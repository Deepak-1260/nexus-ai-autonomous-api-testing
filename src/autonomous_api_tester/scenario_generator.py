from autonomous_api_tester.schemas import TestScenarioList,TestScenario,JiraStory
from typing import List
from autonomous_api_tester.llm_client import llm
def generate_scenarios(story:JiraStory)->List[TestScenario]:
    llm_with_structure=llm.with_structured_output(TestScenarioList)
    response=llm_with_structure.invoke(f'''create test scenarios for the following JIRA 
    story  for all types like positive,negative, boundary, edge_case generate distinct scenarios
    Jira Story:
     story_id:{story.story_id}
     summary:{story.summary}
     description:{story.description}
     acceptance_criteria:{story.acceptance_criteria}
    don't invent new about the story that is not mentioned in the context.
    Generate expected results strictly from the provided acceptance criteria.
    If a boundary or edge case requires an unspecified business rule, identify it as an assumption instead of inventing expected behavior.
      ''')
    scenarios=response.scenarios
    total=len(scenarios)
    set_ids=set(scenario.scenario_id for scenario in scenarios)
    if(total==0):
        raise ValueError("LLM didn't generated scenarios at all")

    if(total!=len(set_ids)):
        raise ValueError("Duplicate Scenario Ids are present in response")
    return scenarios