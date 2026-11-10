from autonomous_api_tester.schemas import GeneratedTestScript,TestExecutionResult
import xml.etree.ElementTree as ET
from typing import List
from pathlib import Path
from dotenv import load_dotenv
import os
import re
import subprocess
import sys

load_dotenv()
def save_test_scripts(scripts:List[GeneratedTestScript])->list[tuple[Path,str]]:
    path=Path(os.getenv('TEST_PATH'))
    path.mkdir(parents=True,exist_ok=True)
    files=[]
    base_path=path.resolve()
    for script in scripts:
        original_name=f"{script.scenario_id.strip()}_{script.test_name.strip()}"
        safe_name = 'test_'+re.sub(r'[^a-zA-Z0-9_-]', '_', original_name)+'.py'
        name=path/safe_name
        file_path=name.resolve()
        if not file_path.is_relative_to(base_path):
            raise ValueError('Invalid File path: outsied generated_tests ')
        if file_path.exists():
            raise FileExistsError(f"Test script already exists: {file_path}")
        file_path.write_text(script.script_code, encoding="utf-8")
        files.append((file_path,script.scenario_id))
    return files

def execute_test_scripts():
    try:
        result=subprocess.run(
            [sys.executable,"-m","pytest",os.getenv('TEST_PATH'),"-v","--junitxml=test_results/report.xml"],
            check=False,
            capture_output=True,
            timeout=15,
            text=True,
            
        )
    except subprocess.TimeoutExpired as e:
        print('Subprocess have been timedout')
        print("Partial err:",e.stderr)
        print("Partial output:",e.stdout)
        return

    # print("Stnd err:",result.stderr)
    # print("Stnd output:",result.stdout)
    # print("Return Code:",result.returncode)


def execute_individual_test_scripts(paths: list[tuple[Path,str]]) -> list[TestExecutionResult]:

    results = []

    for path,scenario_id in paths:
        result = subprocess.run(
            [sys.executable, "-m", "pytest", str(path), "-v"],
            check=False,
            capture_output=True,
            text=True
        )

        # Determine execution status
        if result.returncode == 0:
            status = "passed"
        else:
            status = "failed"

        # Extract scenario ID from filename
        # match = re.search(r"TC\d+", path.stem, re.IGNORECASE)

        # scenario_id = match.group(0).upper() if match else "UNKNOWN"

        # Extract test function name from filename
        test_name = path.stem

        execution_result = TestExecutionResult(
            scenario_id=scenario_id,
            test_name=test_name,
            status=status,
            execution_output=result.stdout if status == "passed" else "",
            error_message=result.stdout if status == "failed" else "",
            execution_time=0.0
        )

        results.append(execution_result)

    return results




def output_viewer() -> list[TestExecutionResult]:
    report_path = Path("test_results/report.xml")

    if not report_path.exists():
        raise FileNotFoundError(f"JUnit report not found: {report_path}")

    try:
        tree = ET.parse(report_path)
    except ET.ParseError as e:
        raise ValueError(f"Invalid or incomplete JUnit XML: {e}") from e

    root = tree.getroot()
    results = []

    for testcase in root.findall(".//testcase"):
        cls_name = testcase.get("classname", "")
        name = testcase.get("name", "")
        execution_time = float(testcase.get("time", 0.0))

        # Extract scenario ID from the generated test filename
        module_name = cls_name.split(".")[-1]
        match = re.search(r"test_(TC\d+)_", module_name, re.IGNORECASE)

        if not match:
            raise ValueError(f"Unable to identify scenario ID: {cls_name}")

        scenario_id = match.group(1).upper()

        failure = testcase.find("failure")
        error = testcase.find("error")
        skipped = testcase.find("skipped")

        if failure is not None:
            status = "failed"
            error_message = failure.get("message", "") or (failure.text or "").strip()
        elif error is not None:
            status = "error"
            error_message = error.get("message", "") or (error.text or "").strip()
        elif skipped is not None:
            status = "skipped"
            error_message = skipped.get("message", "") or (skipped.text or "").strip()
        else:
            status = "passed"
            error_message = ""

        # Capture per-test output
        stdout = testcase.findtext("system-out", default="")
        stderr = testcase.findtext("system-err", default="")
        execution_output = "\n".join(
            value for value in [stdout, stderr] if value
        )

        result = TestExecutionResult(
            scenario_id=scenario_id,
            test_name=name,
            status=status,
            execution_output=execution_output,
            error_message=error_message,
            execution_time=execution_time
        )

        results.append(result)
        print(result)

    return results

        


#####################################validation purpose#################################
# from autonomous_api_tester.jira_analysis_agent import analyze_jira
# from autonomous_api_tester.schemas import JiraStory
# from autonomous_api_tester.testcase_creator_agent import generate_test_scenarios
# from autonomous_api_tester.test_script_generator import generate_test_scripts
# from autonomous_api_tester.script_validation_graph import graph
# jira_story = JiraStory(
#     story_id="POST-101",
#     summary="Retrieve a post by ID",
#     description=(
#         "As a user, I want to retrieve a post using its unique ID "
#         "so that I can view its details. "
#         "The API to test is get_post_by_id."
#     ),
#     acceptance_criteria=[
#         "A valid post ID returns HTTP 200 OK.",
#         "The response contains userId, id, title, and body.",
#         "The returned ID matches the requested post ID.",
#         "A nonexistent post ID returns an appropriate error response."
#     ]
# )
# # print("*1")
# jira_analysis=analyze_jira(jira_story)
# # print("*2")
# scenarios=generate_test_scenarios(jira_analysis)
# api_spec={
#   "operation_id": "get_post_by_id",
#   "method": "GET",
#   "path": "/posts/{id}",
#   "description": "Retrieve a post by its ID",
#   "path_parameters": {
#     "id": "integer"
#   },
#   "expected_status": 200,
#   "response_fields": ["userId", "id", "title", "body"]
# }
# # print("*3")
# scripts=generate_test_scripts(scenarios,api_spec)
# # print("*4")
# acc_scripts=[]
# for scenario in scenarios:
#     for script in scripts:
#         if scenario.scenario_id==script.scenario_id:
#             result=graph.invoke(
#                 {
#                     "api_spec":api_spec,
#                     "generated_script":script,
#                     "retry_count":0,
#                     "scenario":scenario,
#                 }
#             )
#             if result['status']=='valid':
#                 acc_scripts.append(result['generated_script'])
# ##saved the scripts

# saved_paths = save_test_scripts(acc_scripts)

# execution_results = execute_individual_test_scripts(saved_paths)

# for result in execution_results: 
#     print(result)
# execute_test_scripts()

# output_viewer()