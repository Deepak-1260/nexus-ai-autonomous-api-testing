import os
from dotenv import load_dotenv
import httpx

load_dotenv()
api_base_url=os.getenv('API_BASE_URL')
response=httpx.get(api_base_url+"/posts/1")
print(response.status_code)
print(response.json())