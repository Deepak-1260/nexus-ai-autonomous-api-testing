from autonomous_api_tester.llm_client import llm
from autonomous_api_tester.schemas import JiraStory
from autonomous_api_tester.scenario_generator import generate_scenarios
story = JiraStory(
    story_id="AUTH-101",
    summary="User login API",
    description="Allow users to log in using their email and password.",
    acceptance_criteria=[
        "Valid credentials return HTTP 200 and an access token.",
        "Invalid credentials return HTTP 401.",
        "Missing email or password returns HTTP 400.",
        "The response must not expose the user's password."
    ]
)
story1 = JiraStory(
    story_id="POST-101",
    summary="Retrieve a post by ID",
    description=(
        "As a user, I want to retrieve a post using its unique ID "
        "so that I can view its details. "
        "The API to test is get_post_by_id."
    ),
    acceptance_criteria=[
        "A valid post ID returns HTTP 200 OK.",
        "The response contains userId, id, title, and body.",
        "The returned ID matches the requested post ID.",
        "A nonexistent post ID returns an appropriate error response."
    ]
)

# scenarios=generate_scenarios(story)

# total=len(scenarios)
# assumptions=sum(1 for secnario in scenarios if secnario.is_assumption)
# confirmed=total-assumptions
# print(total,confirmed,assumptions)

