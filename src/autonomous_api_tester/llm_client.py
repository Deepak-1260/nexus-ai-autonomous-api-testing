
import time
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.rate_limiters import InMemoryRateLimiter

load_dotenv()

rate_limiter = InMemoryRateLimiter(
    requests_per_second=0.2,  # One request every 5 seconds
    check_every_n_seconds=0.1,
    max_bucket_size=1
)

llm = ChatGroq(
    model="openai/gpt-oss-120b",
    rate_limiter=rate_limiter,
    max_retries=3
)


