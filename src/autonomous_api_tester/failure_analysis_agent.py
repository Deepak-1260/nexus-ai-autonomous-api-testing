import json
from autonomous_api_tester.schemas import TestScenario, GeneratedTestScript, JiraAnalysis,TestExecutionResult,FailureAnalysisModel
from autonomous_api_tester.llm_client import llm
from langchain_core.messages import HumanMessage, SystemMessage
FAILURE_ANALYSIS_PROMPT="""
    You are a senior QA engineer specializing in REST API testing,
    failure investigation, root-cause analysis, and defect classification.

    Your task is to analyze ONE failed or errored test execution and
    produce an evidence-based diagnosis.

    You will receive:
    1. Jira analysis and acceptance criteria.
    2. API specification.
    3. Test scenario.
    4. Generated test script.
    5. Test execution result.

    Follow this diagnostic process:

    STEP 1: VERIFY THE TEST
    - Check whether the generated test script correctly implements
    the scenario and follows the API specification.
    - Check the HTTP method, endpoint, request payload, assertions,
    dependencies, and configuration.
    - Identify test-script defects before blaming the API.

    STEP 2: EXAMINE EXECUTION EVIDENCE
    - Analyze the execution status, output, error messages, and traceback.
    - Determine whether the request actually reached the API.
    - Identify what is directly established by the execution evidence.
    - Do not invent missing logs, exceptions, or server behavior.

    STEP 3: COMPARE EXPECTED AND ACTUAL BEHAVIOR
    - Compare Jira acceptance criteria, scenario expectations,
    and API specification against the observed result.
    - Determine whether the failure is caused by the test script,
    API implementation, environment, or an inconsistent contract.

    STEP 4: CLASSIFY THE FAILURE
    Select exactly ONE category:

    - api_defect: The API implementation demonstrably violates
    the documented contract.
    - test_script_defect: The generated test contains an incorrect
    implementation, assertion, payload, or dependency.
    - environment_issue: Infrastructure, connectivity, configuration,
    or execution environment caused the failure.
    - contract_mismatch: The Jira requirements and API specification
    conflict or leave the expected behavior materially ambiguous.
    - unknown: Available evidence is insufficient to classify the failure.

    STEP 5: DETERMINE ROOT-CAUSE CONFIDENCE

    IMPORTANT: Failure classification and root-cause identification
    are separate decisions.

    A failure category may be identifiable even when its exact
    underlying root cause is unknown.

    Use these confidence rules:

    HIGH:
    - The root cause is directly established by the supplied evidence.
    - There is sufficient evidence to explain why the test failed.
    - No important unresolved uncertainty remains.

    MEDIUM:
    - The failure category is reasonably supported by evidence.
    - However, the exact underlying cause is not established.
    - Additional investigation may be needed to confirm the cause.

    LOW:
    - Evidence is insufficient or conflicting.
    - Multiple plausible explanations remain.
    - The diagnosis is primarily speculative.

    Never assign HIGH confidence merely because the HTTP response
    contradicts the expected status code.

    STEP 6: HUMAN REVIEW DECISION

    Apply these rules strictly:

    Set needs_human_review = TRUE when:
    - The exact underlying root cause has not been established.
    - Server-side logs or diagnostic information are needed.
    - The diagnosis depends on an unverified assumption.
    - Multiple plausible causes remain.
    - The available evidence is insufficient or conflicting.
    - The failure is classified as unknown.

    Set needs_human_review = FALSE only when:
    - The root cause is sufficiently established by supplied evidence.
    - The supporting evidence directly explains the failure.
    - No material investigation or confirmation is outstanding.

    IMPORTANT DECISION RULE:
    If failure_type is api_defect but the execution only establishes
    an unexpected HTTP response, without establishing the underlying
    server-side cause, use medium confidence and set
    needs_human_review = TRUE.

    Do not automatically set human review to false merely because
    the failure category is identifiable.

    STEP 7: ROOT CAUSE AND EVIDENCE
    - Clearly separate observed symptoms from confirmed root causes.
    - Never present a suspected cause as a confirmed fact.
    - Include only evidence present in the supplied inputs.
    - Explain what additional evidence is needed when the root cause
    cannot be established.

    STEP 8: REMEDIATION
    - Recommend specific, actionable next steps.
    - Do not recommend fixes based on unverified assumptions.
    - When human investigation is required, explain what should
    be inspected to establish the root cause.

    Return the result using the provided FailureAnalysisModel schema.

    Do not execute tests.
    Do not modify generated scripts.
    Analyze only the supplied test execution.
"""
def analyze_test_failure(scenario:TestScenario,
                          api_spec:dict,
                          generated_script:GeneratedTestScript,
                          jira_analysis:JiraAnalysis,
                          execution_result:TestExecutionResult)-> FailureAnalysisModel:
    struct_llm=llm.with_structured_output(FailureAnalysisModel)
    sys_mess=SystemMessage(content=FAILURE_ANALYSIS_PROMPT)
    human_message = HumanMessage(
        content=f"""
        Analyze the following failed test execution.

        ### Jira Analysis
        {jira_analysis.model_dump_json(indent=2)}

        ### API Specification
        {json.dumps(api_spec, indent=2)}

        ### Test Scenario
        {scenario.model_dump_json(indent=2)}

        ### Generated Test Script
        ```python
        {generated_script.script_code}
        ```

        ### Test Execution Result
        {execution_result.model_dump_json(indent=2)}

        Based on the above information, identify the failure type,
        root cause, supporting evidence, and recommended remediation.

        Ensure your diagnosis is evidence-based. Do not assume that
        every unexpected API response indicates an API defect.
        """
    )
    response=struct_llm.invoke([sys_mess,human_message])
    if response.scenario_id!=scenario.scenario_id:
        raise ValueError('Invalid Scenario Id is generated')
    return response

