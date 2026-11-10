from typing_extensions import TypedDict,NotRequired
from typing import Literal
from autonomous_api_tester.schemas import TestScenario,GeneratedTestScript,ScriptReview
from autonomous_api_tester.test_script_reviewer import review_test_script
from autonomous_api_tester.test_script_generator import correct_test_script
from langgraph.graph import StateGraph,START,END
class ScriptValidationState(TypedDict):
    scenario:TestScenario	
    api_spec:dict	
    generated_script:GeneratedTestScript
    review:NotRequired[ScriptReview]
    retry_count: int
    final_script:NotRequired[GeneratedTestScript]
    status:Literal["valid","failed","manual_intervention"]

def review_script_node(state:ScriptValidationState):
    scenario=state['scenario']
    api_spec=state['api_spec']
    generated_script=state['generated_script']
    review=review_test_script(scenario,generated_script,api_spec)
    
    return {"review":review}

def correct_script_node(state:ScriptValidationState):
    scenario=state['scenario']
    api_spec=state['api_spec']
    generated_script=state['generated_script']
    review=state['review']
    generated_script=correct_test_script(scenario,api_spec,generated_script,review)
    return {
        "generated_script":generated_script,
        "retry_count":state['retry_count']+1
        }
def route_after_review(state:ScriptValidationState)->str:
    review=state['review']
    retry_count=state['retry_count']
    if review.is_valid:
        return 'accept'
    elif retry_count<2:
        return 'correct'
    else:
        return 'manual_intervention'

def manaul_intervention_node(state: ScriptValidationState):
    print('manaul intervention happending')
    return {
        'status' :"manual_intervention"
    }

def accept_script_node(state:ScriptValidationState):
    return {
        'final_script':state['generated_script'],
        'status':'valid'
    }
graph_builder=StateGraph(ScriptValidationState)
graph_builder.add_node('review',review_script_node)
graph_builder.add_node('correct',correct_script_node)
graph_builder.add_node('human',manaul_intervention_node) 
graph_builder.add_node('accept',accept_script_node)
graph_builder.add_edge(START,'review')
graph_builder.add_conditional_edges('review',route_after_review,{
    'accept':'accept',
    'correct':'correct',
    'manual_intervention':'human'

})
graph_builder.add_edge('accept',END)
graph_builder.add_edge('human',END)
graph_builder.add_edge('correct','review')
script_validator_graph=graph_builder.compile()

