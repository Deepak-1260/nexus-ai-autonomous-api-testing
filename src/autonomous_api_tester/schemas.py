from pydantic import BaseModel,Field
from typing import Literal,List


class JiraStory(BaseModel):
    story_id:str
    summary:str
    description:str
    acceptance_criteria:list[str] = Field(min_length=1)

class JiraAnalysis(BaseModel):
    requirement_summary:str
    acceptance_criteria:list[str] = Field(min_length=1)
    ambiguities: list[str]

class TestScenario(BaseModel):
    scenario_id: str
    title: str
    scenario_type: Literal['positive','negative','boundary','edge_case']
    expected_result: str
    is_assumption:bool

class TestScenarioList(BaseModel):
    scenarios: List[TestScenario]

class GeneratedTestScript(BaseModel):
    scenario_id: str=Field(description="identifies the scenario covered")
    test_name: str=Field(description="a meaningful Pytest test function name")
    script_code: str=Field(description="the generated Python code")
    dependencies: list[str]=Field(description="any required packages beyond our existing setup.")

class GeneratedTestScriptList(BaseModel):
    scripts:List[GeneratedTestScript]

class ScriptReview(BaseModel):
    is_valid:bool= Field(description= 'whether the script correctly tests its scenario.')
    issues:list[str]= Field(description='a list of identified problems.')
    suggestions:list[str]=Field(description='a list of recommended corrections')

class TestExecutionResult(BaseModel):
    scenario_id:str=Field(description="identifies the scenario covered")
    test_name:str=Field(description="the Pytest test function name")
    status:Literal['passed','skipped','failed','error']=Field(description="the result of executing the test")
    execution_output:str=Field(description="the captured output from executing the test")
    error_message:str=Field(description="the error message if the test failed or errored, otherwise empty")
    execution_time:float=Field(description="the time taken to execute the test in seconds")

class FailureAnalysisModel(BaseModel):
    scenario_id: str = Field(
        description="Unique identifier of the failed test scenario."
    )

    failure_type: Literal[
        "api_defect",
        "test_script_defect",
        "environment_issue",
        "contract_mismatch",
        "unknown"
    ] = Field(
        description="Classification of the failure based on the available execution evidence."
    )

    root_cause: str = Field(
        description="Identified or suspected reason for the test failure. Clearly communicate uncertainty when the evidence is insufficient."
    )

    evidence: list[str] = Field(
        description="Specific error messages, traceback details, or execution output supporting the diagnosis."
    )

    confidence: Literal["high", "medium", "low"] = Field(
        description="Confidence level in the failure diagnosis based on the available evidence."
    )

    remediation: str = Field(
        description="Recommended corrective action to address the identified or suspected failure cause."
    )

    needs_human_review: bool = Field(
        description="Whether human investigation is required due to uncertainty or insufficient evidence."
    )




class TestCaseReport(BaseModel):
    scenario_id: str = Field(
        description="Unique identifier of the test scenario."
    )
    test_name: str = Field(
        description="Name of the executed test function."
    )
    status: Literal["passed", "failed", "error", "skipped"] = Field(
        description="Final execution status of the test case."
    )
    execution_time: float = Field(
        description="Time taken to execute the test case in seconds."
    )
    failure_type: Literal[
        "api_defect",
        "test_script_defect",
        "environment_issue",
        "contract_mismatch",
        "unknown"
    ] | None = Field(
        default=None,
        description="Classification of the failure. Null when the test did not fail."
    )
    root_cause: str | None = Field(
        default=None,
        description="Identified or suspected reason for the test failure."
    )
    evidence: list[str] = Field(
        default_factory=list,
        description="Execution evidence supporting the failure diagnosis."
    )
    remediation: str | None = Field(
        default=None,
        description="Recommended technical action to resolve the failure."
    )
    needs_human_review: bool = Field(
        default=False,
        description="Whether manual investigation is required for this test case."
    )


class TechnicalReport(BaseModel):
    report_title: str = Field(
        description="Title of the technical test execution report."
    )
    story_id: str = Field(
        description="Jira story identifier associated with this execution."
    )
    story_summary: str = Field(
        description="Brief description of the functionality being tested."
    )

    total_tests: int = Field(
        description="Total number of executed test cases."
    )
    passed_tests: int = Field(
        description="Number of test cases that passed."
    )
    failed_tests: int = Field(
        description="Number of test cases that failed assertions."
    )
    errored_tests: int = Field(
        description="Number of test cases that encountered execution errors."
    )
    skipped_tests: int = Field(
        description="Number of test cases skipped during execution."
    )

    overall_status: Literal[
        "passed", "failed", "partially_passed", "inconclusive"
    ] = Field(
        description="Overall result of the test execution based on all test outcomes."
    )

    test_case_reports: list[TestCaseReport] = Field(
        description="Detailed execution results and failure diagnoses for individual test cases."
    )
    technical_findings: list[str] = Field(
        description="Important technical observations discovered during testing."
    )
    unresolved_issues: list[str] = Field(
        description="Issues that remain unresolved or require further investigation."
    )
    recommended_actions: list[str] = Field(
        description="Actionable technical steps recommended for the development or QA team."
    )
    human_review_required: bool = Field(
        description="Whether any test failure requires manual investigation."
    )
    conclusion: str = Field(
        description="Overall technical conclusion about the test execution."
    )


class StakeholderReport(BaseModel):
    report_title: str = Field(
        description="Title of the stakeholder-oriented test execution report."
    )
    story_id: str = Field(
        description="Jira story identifier associated with this testing activity."
    )
    feature_summary: str = Field(
        description="High-level description of the feature or functionality tested."
    )
    executive_summary: str = Field(
        description="Concise overview of the testing outcome written for managers and stakeholders."
    )

    total_tests: int = Field(
        description="Total number of test cases executed."
    )
    passed_tests: int = Field(
        description="Number of successfully passed test cases."
    )
    failed_tests: int = Field(
        description="Number of test cases that failed."
    )
    errored_tests: int = Field(
        description="Number of test cases that encountered execution errors."
    )
    skipped_tests: int = Field(
        description="Number of test cases skipped during execution."
    )

    overall_status: Literal[
        "passed", "failed", "partially_passed", "inconclusive"
    ] = Field(
        description="Overall testing outcome."
    )
    quality_assessment: str = Field(
        description="High-level assessment of the tested feature based on available execution evidence."
    )
    key_findings: list[str] = Field(
        description="Most important testing findings that stakeholders should know."
    )
    business_risks: list[str] = Field(
        description="Potential business or operational risks associated with identified issues."
    )
    outstanding_actions: list[str] = Field(
        description="Important pending actions and decisions requiring stakeholder attention."
    )
    release_recommendation: Literal[
        "ready",
        "ready_with_observations",
        "not_ready",
        "requires_further_testing"
    ] = Field(
        description="Recommended release readiness based on test results and identified risks. This is a recommendation, not an approval."
    )
    final_recommendation: str = Field(
        description="Concise concluding recommendation for project stakeholders."
    )


class ReportingNarratives(BaseModel):
    technical_findings: list[str] = Field(
        description="Important technical observations derived from test execution and failure analyses."
    )
    unresolved_issues: list[str] = Field(
        description="Technical issues that remain unresolved or require further investigation."
    )
    recommended_actions: list[str] = Field(
        description="Actionable technical recommendations for developers and QA engineers."
    )
    technical_conclusion: str = Field(
        description="Evidence-based conclusion about the technical test execution."
    )

    executive_summary: str = Field(
        description="Concise overview of testing outcomes for managers and stakeholders."
    )
    quality_assessment: str = Field(
        description="High-level assessment of the tested feature based on actual test results."
    )
    key_findings: list[str] = Field(
        description="Most important findings stakeholders should be aware of."
    )
    business_risks: list[str] = Field(
        description="Potential business or operational risks supported by the available evidence."
    )
    outstanding_actions: list[str] = Field(
        description="Pending decisions or actions requiring attention."
    )
    release_recommendation: Literal[
        "ready",
        "ready_with_observations",
        "not_ready",
        "requires_further_testing"
    ] = Field(
        description="Suggested release readiness based on test evidence. This is not an approval."
    )
    final_recommendation: str = Field(
        description="Concise recommendation for stakeholders based on the testing outcome."
    )
