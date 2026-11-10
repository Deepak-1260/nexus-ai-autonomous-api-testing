from langgraph.types import interrupt,Command
from langgraph.graph import StateGraph,START,END
from langgraph.checkpoint.memory import InMemorySaver
from autonomous_api_tester.test_executor import save_test_scripts,execute_individual_test_scripts
from autonomous_api_tester.jira_analysis_agent import analyze_jira
from autonomous_api_tester.testcase_creator_agent import generate_test_scenarios
from autonomous_api_tester.test_script_generator import generate_test_scripts
from typing_extensions import TypedDict,NotRequired
from autonomous_api_tester.report_generator import generate_reports,generate_html_reports
from autonomous_api_tester.schemas import (
    JiraAnalysis,JiraStory,
    TestExecutionResult,
    TestScenario,
    GeneratedTestScript,
    FailureAnalysisModel,
    TechnicalReport,
    StakeholderReport
)
from autonomous_api_tester.script_validation_graph import script_validator_graph
from autonomous_api_tester.failure_analysis_agent import analyze_test_failure
class TestState(TypedDict):
    jira_story:	JiraStory
    jira_analysis:	NotRequired[JiraAnalysis]
    api_spec:	NotRequired[dict]
    approved_analysis:	NotRequired[JiraAnalysis]
    scenarios:NotRequired[list[TestScenario]]
    generated_scripts:NotRequired[list[GeneratedTestScript]]
    approved_scripts:NotRequired[list[GeneratedTestScript]]
    execution_results:NotRequired[list[TestExecutionResult]]
    human_feedback:NotRequired[str]
    failure_analyses: NotRequired[list[FailureAnalysisModel]]
    technical_report: NotRequired[TechnicalReport]
    stakeholder_report: NotRequired[StakeholderReport]


def failure_analysis_node(state: TestState):

    scenarios_map = {
        scenario.scenario_id: scenario
        for scenario in state["scenarios"]
    }

    scripts_map = {
        script.scenario_id: script
        for script in state["approved_scripts"]
    }

    failure_analyses = []

    for result in state["execution_results"]:

        if result.status not in ("failed", "error"):
            continue

        scenario = scenarios_map.get(result.scenario_id)
        script = scripts_map.get(result.scenario_id)

        if scenario is None:
            raise ValueError(
                f"Scenario not found: {result.scenario_id}"
            )

        if script is None:
            raise ValueError(
                f"Approved script not found: {result.scenario_id}"
            )

        analysis = analyze_test_failure(
            scenario=scenario,
            api_spec=state["api_spec"],
            generated_script=script,
            jira_analysis=state["jira_analysis"],
            execution_result=result
        )

        failure_analyses.append(analysis)

    return {
        "failure_analyses": failure_analyses
    }

        
        

def jira_analysis_node(state: TestState):
    return analyze_jira(state['jira_story'])

def test_case_creator_node(state:TestState):
    jira_analysis=state['jira_analysis']
    api_spec=state['api_spec']
    scenarios=generate_test_scenarios(jira_analysis,api_spec)
    return {'scenarios':scenarios}

def test_script_generator_node(state:TestState):
    scenarios=state['scenarios']
    api_spec=state['api_spec']
    generated_scripts=generate_test_scripts(scenarios,api_spec)
    return {
       'generated_scripts':generated_scripts
    }

def script_validation_node(state:TestState):
    scripts=state['generated_scripts']
    scenarios=state['scenarios']
    api_spec=state['api_spec']
    acc_scripts=[]
    for scenario in scenarios:
        for script in scripts:
            if scenario.scenario_id==script.scenario_id:
                result=script_validator_graph.invoke(
                    {
                        "api_spec":api_spec,
                        "generated_script":script,
                        "retry_count":0,
                        "scenario":scenario,
                    }
                )
                if result['status']=='valid':
                    acc_scripts.append(result['final_script'])
    return {
        'approved_scripts':acc_scripts
    }


def test_executor_node(state:TestState):
    scripts=state['approved_scripts']
    paths_with_sce=save_test_scripts(scripts)
    execution_results=execute_individual_test_scripts(paths_with_sce)
    return {
        "execution_results":execution_results
    }
def human_review_scenarios(scenarios:list[TestScenario]):
    accepted_scenarios=[]
    for scenario in scenarios:
        print("="*50)
        print('title:',scenario.title)
        print('scenario_type:',scenario.scenario_type)
        print('expected_result:',scenario.expected_result)
        print('assumption:',scenario.is_assumption)
        choice=None
        while choice not in ('accept','reject','modify'):
            choice=input('Chose accept/reject/modify:')
        if choice=='accept':
            accepted_scenarios.append(scenario)
        elif choice=='reject':
            continue
        else:
            title = ''
            while not title.strip():
                title = input('Please provide Scenario Title:\n')
            scenario.title=title
            scen_type=None
            while scen_type not in ('positive','negative','boundary','edge_case'):
                scen_type=input("chose type ['positive','negative','boundary','edge_case']\n")
            scenario.scenario_type=scen_type
            exp_res = ''
            while not exp_res.strip():
                exp_res = input("Please provide expected result\n")
            scenario.expected_result=exp_res
            scenario.is_assumption=False
            accepted_scenarios.append(scenario)
    return accepted_scenarios


def human_review_node(state:TestState):
    scenarios=interrupt({
        "message": "Review the generated scenarios",
        "scenarios": state["scenarios"]
    })
    
    return {"scenarios":scenarios}

def reporting_node(state: TestState):

    technical_report, stakeholder_report = generate_reports(
        jira_story=state["jira_story"],
        execution_results=state["execution_results"],
        failure_analyses=state["failure_analyses"]
    )


    generate_html_reports(
        technical_report=technical_report,
        stakeholder_report=stakeholder_report
    )

    return {
        "technical_report": technical_report,
        "stakeholder_report": stakeholder_report
    }

graph_build=StateGraph(TestState) 
graph_build.add_node('jira_analysis',jira_analysis_node)
graph_build.add_node('test_case_creator',test_case_creator_node)
graph_build.add_node('reviewer',human_review_node)
graph_build.add_node('script_generator',test_script_generator_node)
graph_build.add_node('script_validator',script_validation_node)
graph_build.add_node('test_executor',test_executor_node)
graph_build.add_node('failure_analyses',failure_analysis_node)
graph_build.add_node('report_generator',reporting_node)
graph_build.add_edge(START,'jira_analysis')
graph_build.add_edge('jira_analysis','test_case_creator')
graph_build.add_edge('test_case_creator','reviewer')
graph_build.add_edge('reviewer','script_generator')
graph_build.add_edge('script_generator','script_validator')
graph_build.add_edge('script_validator','test_executor')
graph_build.add_edge('test_executor','failure_analyses')
graph_build.add_edge('failure_analyses','report_generator')
graph_build.add_edge('report_generator',END)

graph=graph_build.compile(checkpointer=InMemorySaver())
# config={
#     "configurable":{ "thread_id":"126"}
# }
# jira_story = JiraStory(
#     story_id="TASK-102",
#     summary="Create a new task",
#     description="""
# As a user, I want to create a new task by providing task details
# so that I can manage and track my tasks.

# The API to test is create_task.
# The endpoint is POST /tasks.
# """,
#     acceptance_criteria=[
        # "The API should allow users to create a task by providing a title.",
        # "The API should return HTTP 201 Created when a task is successfully created.",
        # "The response should contain the newly created task details.",
        # "The created task should contain an id, title, description, priority, and status.",
        # "The title is a mandatory field.",
        # "The title should contain a minimum of 3 characters and a maximum of 100 characters.",
        # "The description is an optional field and can be null.",
        # "If priority is not provided, it should default to medium.",
        # "If status is not provided, it should default to pending.",
        # "The API should accept low, medium, and high as valid priority values.",
        # "The API should accept pending, in_progress, and completed as valid status values."
#     ]
# )
# state=graph.invoke({'jira_story':jira_story},config=config)

# accepted_scenarios=human_review_scenarios(state['scenarios'])

# response=graph.invoke(Command(resume=accepted_scenarios),config)       

# print(response)

