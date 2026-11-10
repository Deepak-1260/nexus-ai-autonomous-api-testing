from autonomous_api_tester.llm_client import llm
from autonomous_api_tester.api_discovery import get_api_details
from langchain.agents import create_agent
from autonomous_api_tester.schemas import JiraAnalysis,JiraStory
from langchain_core.messages import ToolMessage
import json
JIRA_ANALYSIS_PROMPT = """
Act as a Jira requirements analyst for REST API testing.

1. Understand the Jira story and its original acceptance criteria.
2. Use available tools to retrieve relevant API specifications.
   Investigate dependent APIs when necessary, within the scope of the story.
3. Compare the Jira requirements with the retrieved API contracts.
4. Preserve all explicit requirements from the Jira story.
5. Never invent API behavior or silently convert assumptions into requirements.
6. Clearly identify missing, conflicting, and ambiguous information.
7. Do not generate test cases.
8. Provide a detailed analysis that distinguishes confirmed requirements
   from unresolved requirements and optional recommendations.
9. Report only ambiguities that materially affect the stated requirements.
10. Distinguish requirements explicitly stated in Jira from behavior documented
    by the API contract. A missing contract detail does not invalidate an
    explicit Jira requirement.
11. Do not investigate unrelated API concerns or dependencies without evidence
    that they affect this story.
12. Never move an explicit Jira acceptance criterion into ambiguities solely because the API contract does not document it.
"""
jira_analysis_agent=create_agent(
    model=llm,
    tools=[get_api_details],
    system_prompt=JIRA_ANALYSIS_PROMPT
)

def analyze_jira(jira_story:JiraStory)->dict:

    HUMAN_PROMPT = f"""
    Analyze the following Jira story and identify its requirements.

    {jira_story}
    """

    response=jira_analysis_agent.invoke(
        {
            "messages":[
                {
                    'role':'user',
                    'content':HUMAN_PROMPT
                }
            ]
        }
    )
    print("\n===== JIRA AGENT RESPONSE =====")
    print(response["messages"])
    api_spec=None
    for message in response['messages']:
        if isinstance(message,ToolMessage):
            api_spec=json.loads(message.content)
    if api_spec is  None:
        raise ValueError('API SPEC was not retrieved')
    
    message=response['messages'][-1]
    # message.pretty_print()
    STRUCTURED_ANALYSIS_PROMPT = """
    Convert the supplied Jira analysis into the JiraAnalysis schema.

    - Preserve the original Jira requirements and their intent.
    - Keep confirmed requirements in acceptance_criteria.
    - Put missing, conflicting, or unclear information in ambiguities.
    - Do not downgrade an explicit Jira requirement merely because the API
    contract does not document it.
    - Do not invent requirements, API behavior, status codes, or assumptions.
    - Include only ambiguities relevant to the Jira story or discovered API details.
    - Do not generate test cases.
    - If the supplied analysis lacks information needed for a field, do not
    fabricate it.
    """
    llm_structured=llm.with_structured_output(JiraAnalysis)
    analysis=llm_structured.invoke([STRUCTURED_ANALYSIS_PROMPT,message.content])
    
    return {
        "jira_analysis":analysis,
        "api_spec":api_spec
    }

