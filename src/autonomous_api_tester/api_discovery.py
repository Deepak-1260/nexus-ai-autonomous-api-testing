import json
from langchain_core.tools import tool
from autonomous_api_tester.llm_client import llm

with open('./src/autonomous_api_tester/api_spec.json', 'r') as file:
    data = json.load(file)

@tool
def get_api_details(operation_id: str) -> dict | None:
    '''Get the API details for a specified operation_id'''
    for api in data:
        if api['operation_id'] == operation_id:
            return api
    return None



