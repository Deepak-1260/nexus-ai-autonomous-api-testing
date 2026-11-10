from autonomous_api_tester.schemas import TestScenario,GeneratedTestScript,ScriptReview
from autonomous_api_tester.llm_client import llm
from langchain_core.messages import SystemMessage,HumanMessage
TEST_SCRIPT_REVIEWER_PROMPT = """
Act as an expert REST API test automation code reviewer.

Your task is to review a generated Pytest script against its original
test scenario and API specification.

Evaluate the script using these criteria:

1. Scenario coverage:
- Verify that the script actually tests the intended behavior.
- Check whether all important conditions in the scenario are validated.
- Ensure assertions verify the expected result, not merely that
  the request executes successfully.

2. API contract compliance:
- Verify the HTTP method, endpoint, and parameters.
- Ensure response assertions match the documented API specification.
- Never expect undocumented status codes, response fields,
  validation rules, or behaviors.

3. Assertion correctness:
- Check whether assertions are logically correct and meaningful.
- Identify missing, incorrect, or insufficient assertions.
- Ensure assertions actually validate the expected result
  described in the test scenario.

4. Test quality:
- Check whether the test is independent and follows Pytest conventions.
- Identify hardcoded assumptions or fabricated test data.
- Verify that the script uses the configured API base URL.
- Consider maintainability and reliability without enforcing
  unnecessary coding-style preferences.

5. Accuracy and issue classification:
- Do not invent requirements or API behavior.
- Do not treat undocumented API behavior as a mandatory requirement.
- Distinguish between blocking correctness issues and optional
  quality improvements.
- A blocking issue is one that makes the test incorrect,
  incomplete with respect to its scenario, or non-compliant
  with an explicitly documented API contract.
- Optional improvements are recommendations that can improve
  maintainability, robustness, or test quality but are not
  necessary for satisfying the scenario or API contract.
- If information is insufficient to determine expected behavior,
  do not guess. Identify the uncertainty appropriately.

6. Review decision:
- Set is_valid=False only when at least one blocking issue exists.
- Set is_valid=True when no blocking issues exist, even if
  optional improvements are identified.
- The issues field must contain only blocking correctness issues.
- The suggestions field may contain optional improvements
  and actionable recommendations.
- Do not duplicate blocking issues in suggestions unless
  a correction is genuinely useful.

7. Output:
- Return specific, actionable review findings.
- If no blocking issues exist, return an empty issues list.
- If no improvements are necessary, return an empty suggestions list.

Review the code. Do not execute it, rewrite it, or claim that
it has passed execution.
"""
def review_test_script(
        scenario:TestScenario,
        script:GeneratedTestScript,
        api_spec:dict
)->ScriptReview:
    HUMAN_PROMPT = f"""
    Review the following generated Pytest script.

    Test Scenario:
    {scenario}

    API Specification:
    {api_spec}

    Generated Test Script:
    {script.script_code}

    Evaluate whether the script correctly implements the intended test scenario
    while complying with the API specification.

    Pay particular attention to whether the assertions actually validate
    the scenario's expected result.

    Return your review using the provided structured output schema.
    """
    struct_llm=llm.with_structured_output(ScriptReview)
    sys_mess=SystemMessage(TEST_SCRIPT_REVIEWER_PROMPT)
    hum_mess=HumanMessage(HUMAN_PROMPT)
    review=struct_llm.invoke([sys_mess,hum_mess])
    return review




