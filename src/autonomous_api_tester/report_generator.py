
from pathlib import Path
from jinja2 import Environment, FileSystemLoader, select_autoescape
import json

from autonomous_api_tester.schemas import (
    JiraStory,
    TestExecutionResult,
    FailureAnalysisModel,
    TestCaseReport,
    TechnicalReport,
    StakeholderReport,
    ReportingNarratives
)

from autonomous_api_tester.llm_client import llm

from langchain_core.messages import HumanMessage, SystemMessage


REPORTING_PROMPT = """
You are a senior QA reporting specialist responsible for generating
two different reports from API test execution results.

You will receive:
1. Jira story details.
2. Test execution results.
3. Failure analyses produced by a separate Failure Analysis Agent.
4. Deterministically calculated execution statistics.

Your responsibility is to generate the narrative content for:

A. TECHNICAL QA REPORT
Audience: QA engineers and developers.

Focus on:
- Important technical findings.
- Unresolved technical issues.
- Actionable recommendations.
- Overall technical conclusion.

Use technical terminology where appropriate.
Explain failures using the supplied failure analyses.
Do not repeat every execution detail unnecessarily.

B. STAKEHOLDER REPORT
Audience: Managers, project leads and stakeholders.

Focus on:
- Executive summary.
- Overall quality assessment.
- Key findings.
- Potential business or operational risks.
- Outstanding actions.
- Release recommendation.
- Final recommendation.

Use clear, professional, non-technical language.
Explain the impact of failures without overwhelming stakeholders
with implementation details.

IMPORTANT RULES:

1. Use only the supplied Jira story, execution results,
   failure analyses and calculated statistics.

2. Never invent test results, defects, root causes, evidence,
   business impacts or completed actions.

3. Do not change or recalculate the supplied execution statistics.

4. Distinguish confirmed defects from suspected issues.

5. Do not claim that a feature is ready for release merely because
   most tests passed.

6. Consider failed tests, execution errors, unresolved issues
   and human-review requirements when making recommendations.

7. If evidence is insufficient to establish business impact,
   clearly communicate that the impact requires further assessment.

8. A release recommendation is advisory and must not be presented
   as an actual release approval.

9. Keep the technical report detailed and the stakeholder report
   concise and business-oriented.

10. Do not claim that all acceptance criteria have been validated
    merely because multiple tests passed. Make coverage claims only
    when supported by the supplied scenarios and execution results.

11. Clearly distinguish confirmed technical findings from potential
    business impacts. Do not present hypothetical impacts as
    confirmed production consequences.

Return only the information required by the ReportingNarratives
Pydantic schema.
"""


def calculate_execution_statistics(
    execution_results: list[TestExecutionResult]
) -> dict:

    counts = {
        "passed": 0,
        "failed": 0,
        "error": 0,
        "skipped": 0
    }

    for result in execution_results:
        counts[result.status] += 1

    total = len(execution_results)

    if total == 0 or counts["passed"] + counts["failed"] + counts["error"] + counts["skipped"] == 0:
        overall_status = "inconclusive"

    elif counts["failed"] == 0 and counts["error"] == 0 and counts["skipped"] == 0:
        overall_status = "passed"

    elif counts["passed"] == 0:
        overall_status = "failed" if (
            counts["failed"] > 0 or counts["error"] > 0
        ) else "inconclusive"

    else:
        overall_status = "partially_passed"

    return {
        "total_tests": total,
        "passed_tests": counts["passed"],
        "failed_tests": counts["failed"],
        "errored_tests": counts["error"],
        "skipped_tests": counts["skipped"],
        "overall_status": overall_status
    }


def prepare_test_case_reports(
    execution_results: list[TestExecutionResult],
    failure_analyses: list[FailureAnalysisModel]
) -> list[TestCaseReport]:

    result_ids = [result.scenario_id for result in execution_results]

    if len(result_ids) != len(set(result_ids)):
        raise ValueError("Duplicate scenario IDs found in execution results.")

    failure_map = {}

    for analysis in failure_analyses:
        if analysis.scenario_id not in result_ids:
            raise ValueError(
                f"Failure analysis references unknown scenario: {analysis.scenario_id}"
            )

        if analysis.scenario_id in failure_map:
            raise ValueError(
                f"Duplicate failure analysis for scenario: {analysis.scenario_id}"
            )

        failure_map[analysis.scenario_id] = analysis

    reports = []

    for result in execution_results:

        analysis = failure_map.get(result.scenario_id)

        if analysis and result.status not in ("failed", "error"):
            raise ValueError(
                f"Failure analysis exists for non-failed scenario: {result.scenario_id}"
            )

        reports.append(
            TestCaseReport(
                scenario_id=result.scenario_id,
                test_name=result.test_name,
                status=result.status,
                execution_time=result.execution_time,

                failure_type=analysis.failure_type if analysis else None,
                root_cause=analysis.root_cause if analysis else None,
                evidence=analysis.evidence if analysis else [],
                remediation=analysis.remediation if analysis else None,

                needs_human_review=(
                    analysis.needs_human_review
                    if analysis
                    else result.status in ("failed", "error")
                )
            )
        )

    return reports


def generate_reports(
    jira_story: JiraStory,
    execution_results: list[TestExecutionResult],
    failure_analyses: list[FailureAnalysisModel]
) -> tuple[TechnicalReport, StakeholderReport]:

    # 1. Calculate execution statistics using Python.
    statistics = calculate_execution_statistics(execution_results)

    # 2. Prepare detailed test-case reports using Python.
    test_case_reports = prepare_test_case_reports(
        execution_results,
        failure_analyses
    )

    # 3. Prepare compact execution information for the LLM.
    execution_data = []

    for result in execution_results:
        execution_data.append({
            "scenario_id": result.scenario_id,
            "test_name": result.test_name,
            "status": result.status,
            "execution_time": result.execution_time,
            "error_message": result.error_message
        })

    # 4. Prepare the LLM messages.
    system_message = SystemMessage(
        content=REPORTING_PROMPT
    )

    human_message = HumanMessage(
        content=f"""
Generate the technical QA report and stakeholder report
using the information below.

### Jira Story

{jira_story.model_dump_json(indent=2)}

### Execution Statistics

{json.dumps(statistics, indent=2)}

### Individual Test Execution Results

{json.dumps(execution_data, indent=2)}

### Failure Analyses

{json.dumps(
    [analysis.model_dump(mode="json") for analysis in failure_analyses],
    indent=2
)}

Generate both reports according to the ReportingNarratives schema.

Ensure that the reports accurately reflect the supplied
execution statistics and failure analyses.
"""
    )

    # 5. Generate both report narratives in one LLM invocation.
    structured_llm = llm.with_structured_output(
        ReportingNarratives
    )

    narratives = structured_llm.invoke([
        system_message,
        human_message
    ])

    # 6. Construct the Technical QA Report.
    technical_report = TechnicalReport(
        report_title="Technical QA Test Execution Report",
        story_id=jira_story.story_id,
        story_summary=jira_story.summary,

        **statistics,

        test_case_reports=test_case_reports,

        technical_findings=narratives.technical_findings,
        unresolved_issues=narratives.unresolved_issues,
        recommended_actions=narratives.recommended_actions,

        human_review_required=any(
            report.needs_human_review
            for report in test_case_reports
        ),

        conclusion=narratives.technical_conclusion
    )

    # 7. Construct the Stakeholder Report.
    stakeholder_report = StakeholderReport(
        report_title="Stakeholder Test Execution Report",
        story_id=jira_story.story_id,
        feature_summary=jira_story.summary,

        executive_summary=narratives.executive_summary,

        total_tests=statistics["total_tests"],
        passed_tests=statistics["passed_tests"],
        failed_tests=statistics["failed_tests"],
        errored_tests=statistics["errored_tests"],
        skipped_tests=statistics["skipped_tests"],

        overall_status=statistics["overall_status"],

        quality_assessment=narratives.quality_assessment,
        key_findings=narratives.key_findings,
        business_risks=narratives.business_risks,
        outstanding_actions=narratives.outstanding_actions,

        release_recommendation=narratives.release_recommendation,
        final_recommendation=narratives.final_recommendation
    )

    return technical_report, stakeholder_report


def generate_html_reports(technical_report, stakeholder_report):

    template_dir = Path(__file__).parent / "templates"

    env = Environment(
        loader=FileSystemLoader(template_dir),
        autoescape=select_autoescape(["html", "xml"])
    )

    # Render technical report
    technical_template = env.get_template("technical_report.html")

    technical_html = technical_template.render(
        report=technical_report
    )

    # Render stakeholder report
    stakeholder_template = env.get_template("stakeholder_report.html")

    stakeholder_html = stakeholder_template.render(
        report=stakeholder_report
    )

    # Save reports
    output_dir = Path("reports")
    output_dir.mkdir(parents=True, exist_ok=True)

    (output_dir / "technical_report.html").write_text(
        technical_html,
        encoding="utf-8"
    )

    (output_dir / "stakeholder_report.html").write_text(
        stakeholder_html,
        encoding="utf-8"
    )

