from langchain.agents import create_agent
from autonomous_api_tester.llm_client import llm
from autonomous_api_tester.api_discovery import get_api_details
agent=create_agent(
    model=llm,
    tools=[get_api_details],
    system_prompt="Use tools to retrieve api details when needed."
)

result=agent.invoke({
    'messages':[
        {
            'role':'user',
            'content':'get details for the get_post_by_id'
        }
    ]
})


for message in result['messages']:
    message.pretty_print()

# from langchain_core.messages import HumanMessage,AIMessage,ToolMessage
# tools={
#     'get_api_details':get_api_details
# }
# llm_tools=llm.bind_tools([get_api_details])
# hm=HumanMessage('could you please provide info about get_post_by_id api')

# response=llm_tools.invoke([hm])
# messages=[hm,response]
# for tool_call in response.tool_calls:
#     name=tool_call['name']
#     arguments=tool_call['args']
#     tool_output=tools[name].invoke(arguments)
#     tm=ToolMessage(content=tool_output,tool_call_id=tool_call['id'],name=name)
#     messages.append(tm)
# response=llm_tools.invoke(messages)
# print(response.content)