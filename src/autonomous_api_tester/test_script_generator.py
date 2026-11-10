from autonomous_api_tester.schemas import TestScenario,GeneratedTestScript,GeneratedTestScriptList,ScriptReview
from langchain_core.messages import SystemMessage,HumanMessage
from autonomous_api_tester.llm_client import llm
from typing import List
import ast


TEST_SCRIPT_GENERATOR_PROMPT = """
Act as an expert Python test automation engineer specializing in REST APIs.

Generate executable Pytest scripts using HTTPX based on the provided API specification and approved test scenarios.

Instructions:
1. Generate one independent Pytest test function for each approved scenario.
2. Use the API specification for the HTTP method, endpoint, parameters, and documented response details.
3. Write clear, maintainable Python code following Pytest conventions.
4. Assert only behavior supported by confirmed requirements or the API contract.
5. Never invent HTTP status codes, response schemas, validation rules, authentication requirements, or API behavior.
6. If a scenario depends on unresolved requirements or assumptions, do not create unsupported assertions. Flag it for clarification rather than generating a definitive test.
7. Read the API_BASE_URL from the existing environment configuration. Do not hardcode it.
8. Use HTTPX to send requests and Pytest assertions to validate responses.
9. Give every generated script a meaningful test name and associate it with its source scenario_id.
10. Include only dependencies required by the generated scripts.
11. Do not include production application code, mock responses, or fabricated API results.
12. Generate test code only. Never execute the scripts or claim that they have passed.
13. Return output matching the provided structured schema.
"""
def generate_test_scripts(scenarios:List[TestScenario],api_spec:dict)->List[GeneratedTestScript]:
    structed_llm=llm.with_structured_output(GeneratedTestScriptList)
    sys_mess=SystemMessage(TEST_SCRIPT_GENERATOR_PROMPT)
    HUMAN_PROMPT = f"""
    Generate executable Pytest scripts for the following approved test scenarios.

    API Specification:
    {api_spec}

    Approved Test Scenarios:
    {scenarios}

    Requirements:
    - Generate one independent test function for each eligible scenario.
    - Use the exact HTTP method, endpoint, parameters, and documented response details from the API specification.
    - Use the approved scenarios to determine what each test must verify.
    - Read the API base URL from the existing environment configuration.
    - Do not invent API behavior, expected status codes, or response schemas.
    - If a scenario depends on unresolved requirements, do not generate unsupported assertions.
    - Associate each script with its original scenario_id.
    - Return the scripts using the required structured schema.
    """
    hum_mess=HumanMessage(HUMAN_PROMPT)
    try:
        response = structed_llm.invoke([sys_mess, hum_mess])
    except Exception as e:
        print("ERROR TYPE:", type(e))
        print("ERROR:", e)

        if hasattr(e, "body"):
            print("ERROR BODY:", e.body)

        raise
    # response=structed_llm.invoke([sys_mess,hum_mess])
    print(f"Total genrated scripts: {len(response.scripts)}")
    scenario_ids=set(scenario.scenario_id for scenario in scenarios if not scenario.is_assumption)
    for test_script in response.scripts:
        ast.parse(test_script.script_code)
        id=test_script.scenario_id
        if id in scenario_ids:
            scenario_ids.remove(id)
        else:
            raise ValueError("Invalid scenario Id generated")
    if len(scenario_ids) !=0:
        raise ValueError("Some scenarios are skipped")
    # print("valid scripts are generated")
    return response.scripts


TEST_SCRIPT_CORRECTOR_PROMPT = """
Act as an expert Python test automation engineer specializing in REST API testing.

Your task is to correct a generated Pytest script based on the feedback
provided by a semantic code reviewer.

Instructions:

1. Address every valid issue identified by the reviewer.
2. Follow the reviewer's suggestions while preserving the original test scenario.
3. Use the API specification as the source of truth for API behavior.
4. Do not introduce unsupported assertions, status codes, response fields,
   validation rules, or assumptions.
5. Preserve the original scenario_id and test intent.
6. Use HTTPX and Pytest conventions.
7. Read the API_BASE_URL from the existing environment configuration.
8. Generate executable Python test code.
9. Do not execute the generated script or claim that it has passed.
10. Return the corrected script using the provided structured output schema.
"""

def correct_test_script(
        scenario:TestScenario,
        api_spec:dict,
        script:GeneratedTestScript,
        review:ScriptReview
)->GeneratedTestScript:
    sys_mess=SystemMessage(TEST_SCRIPT_CORRECTOR_PROMPT)
    HUMAN_PROMPT = f"""
    Correct the following generated test script.

    Original Test Scenario:
    {scenario}

    API Specification:
    {api_spec}

    Previously Generated Script:
    {script}

    Reviewer Feedback:
    {review}

    Correct the script by addressing the identified issues.

    Preserve the original scenario_id and test intent.
    Return the corrected script using the required structured schema.
    """
    hum_mess=HumanMessage(HUMAN_PROMPT)
    struct_out_llm=llm.with_structured_output(GeneratedTestScript)
    new_script=struct_out_llm.invoke([sys_mess,hum_mess])
    if new_script.scenario_id!=script.scenario_id:
        raise ValueError("Generated incorrect scenario id")
    ast.parse(new_script.script_code)
    return new_script