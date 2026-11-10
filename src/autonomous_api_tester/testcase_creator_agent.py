from autonomous_api_tester.llm_client import llm
from autonomous_api_tester.schemas import JiraAnalysis, TestScenario, TestScenarioList
from typing import List
from langchain_core.messages import SystemMessage, HumanMessage

TEST_CASE_CREATOR_PROMPT = """
Act as an expert REST API test scenario designer.

Generate test scenarios from the provided JiraAnalysis and API specification.

Instructions:
1. Cover positive, negative, boundary, and edge-case scenarios wherever relevant.
2. Assign each scenario a unique ID, clear title, scenario type, and expected result.
3. Base scenarios on confirmed acceptance criteria and available API specifications.
4. Set is_assumption=False when the scenario's expected behavior is explicitly supported by confirmed requirements or the API contract.
5. Set is_assumption=True when expected behavior depends on an unresolved requirement or an unverified assumption.
6. Never invent HTTP status codes, response schemas, validation rules, ID constraints, or API behavior.
7. When expected behavior is unresolved, explicitly state that clarification is required. Do not present an assumed outcome as confirmed behavior.
8. Do not assume that negative, zero, malformed, or large IDs are invalid unless the requirements or API contract establish that rule.
9. Generate distinct scenarios that provide meaningful coverage. Avoid duplicate scenarios that test the same behavior.
10. Do not invent boundary values when the valid input range is unspecified.
11. Do not introduce unrelated test scenarios outside the scope of the Jira story and relevant API contract.
12. Generate scenarios only. Do not produce executable scripts or implementation code.
13. Return output matching the provided structured schema.
"""

sys_mess = SystemMessage(content=TEST_CASE_CREATOR_PROMPT)

def generate_test_scenarios(
    jira_analysis: JiraAnalysis,
    api_spec: dict
) -> List[TestScenario]:

    structured_llm = llm.with_structured_output(TestScenarioList)

    hum_mess = HumanMessage(f'''
    Generate test scenarios for the following Jira analysis.

    Use the confirmed acceptance criteria as the source of truth for required behavior. Use the ambiguities to identify scenarios that need clarification.

    Jira Analysis:
    {jira_analysis}

    API Specification:
    {api_spec}

    Generate all relevant scenarios without duplicating coverage or inventing unsupported expected behavior.
    ''')

    response = structured_llm.invoke([sys_mess, hum_mess])

    scenarios = response.scenarios
    total = len(scenarios)
    set_ids = set(scenario.scenario_id for scenario in scenarios)

    if(total == 0):
        raise ValueError("LLM didn't generated scenarios at all")

    if(total != len(set_ids)):
        raise ValueError("Duplicate Scenario Ids are present in response")

    return scenarios