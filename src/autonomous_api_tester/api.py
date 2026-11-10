from threading import Lock, Thread
from uuid import uuid4
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from langgraph.types import Command

from autonomous_api_tester.parent_graph import graph
from autonomous_api_tester.schemas import JiraStory, TestScenario


app = FastAPI(
    title="NEXUS AI",
    description="Autonomous API Testing Platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request Models

class StartTestRequest(BaseModel):
    jira_story: JiraStory


class ScenarioReview(BaseModel):
    scenario: TestScenario
    decision: Literal["accept", "reject", "modify"]


class SubmitReviewRequest(BaseModel):
    reviews: list[ScenarioReview]


# In-memory progress storage

runs = {}
runs_lock = Lock()


# Serialization Helpers

def serialize_model(value):
    if value is None:
        return None

    if hasattr(value, "model_dump"):
        return value.model_dump(mode="json")

    return value


def serialize_list(items):
    return [
        serialize_model(item)
        for item in (items or [])
    ]


def format_snapshot_interrupts(snapshot):
    interrupts = []

    for task in snapshot.tasks:
        for item in task.interrupts:
            interrupts.append({
                "id": item.id,
                "value": serialize_model(item.value),
            })

    return interrupts


def get_run_results(snapshot):
    values = snapshot.values or {}

    return {
        "approved_scenarios": serialize_list(
            values.get("scenarios")
        ),
        "approved_scripts": serialize_list(
            values.get("approved_scripts")
        ),
        "execution_results": serialize_list(
            values.get("execution_results")
        ),
        "failure_analyses": serialize_list(
            values.get("failure_analyses")
        ),
        "technical_report": serialize_model(
            values.get("technical_report")
        ),
        "stakeholder_report": serialize_model(
            values.get("stakeholder_report")
        ),
    }


# Background Graph Execution

def execute_graph(thread_id, graph_input, config):

    try:
        for event in graph.stream(
            graph_input,
            config=config,
            stream_mode="tasks",
            version="v2",
        ):

            if event.get("type") != "tasks":
                continue

            task_data = event.get("data", {})
            node_name = task_data.get("name")

            if not node_name:
                continue

            with runs_lock:

                run = runs[thread_id]

                # Task started
                if "input" in task_data:

                    run["current_node"] = node_name
                    run["node_status"][node_name] = "running"

                # Task completed, interrupted or failed
                else:

                    if task_data.get("interrupts"):

                        run["node_status"][node_name] = "waiting"

                    elif task_data.get("error"):

                        run["node_status"][node_name] = "failed"

                    else:

                        run["node_status"][node_name] = "completed"

                        if node_name not in run["completed_nodes"]:
                            run["completed_nodes"].append(node_name)

        snapshot = graph.get_state(config)
        interrupts = format_snapshot_interrupts(snapshot)

        with runs_lock:

            run = runs[thread_id]
            run["interrupts"] = interrupts

            if interrupts:

                run["status"] = "waiting_for_review"
                run["current_node"] = "reviewer"
                run["node_status"]["reviewer"] = "waiting"

            else:

                run["status"] = "completed"
                run["current_node"] = None

                results = get_run_results(snapshot)
                run.update(results)

    except Exception as error:

        with runs_lock:

            run = runs[thread_id]

            run["status"] = "failed"
            run["current_node"] = None
            run["error"] = str(error)


def start_background_execution(thread_id, graph_input, config):

    worker = Thread(
        target=execute_graph,
        args=(thread_id, graph_input, config),
        daemon=True,
    )

    worker.start()


# Health Check

@app.get("/health")
def health_check():

    return {
        "status": "healthy",
        "application": "NEXUS AI",
        "message": "Backend is running successfully",
    }


# Start AI Testing Workflow

@app.post("/runs")
def start_test(request: StartTestRequest):

    thread_id = str(uuid4())

    config = {
        "configurable": {
            "thread_id": thread_id
        }
    }

    with runs_lock:

        runs[thread_id] = {
            "thread_id": thread_id,
            "status": "running",
            "current_node": None,
            "completed_nodes": [],
            "node_status": {},
            "interrupts": [],
            "approved_count": 0,
            "rejected_count": 0,
            "approved_scenarios": [],
            "approved_scripts": [],
            "execution_results": [],
            "failure_analyses": [],
            "technical_report": None,
            "stakeholder_report": None,
            "error": None,
        }

    initial_state = {
        "jira_story": request.jira_story,
    }

    start_background_execution(
        thread_id,
        initial_state,
        config,
    )

    return {
        "thread_id": thread_id,
        "status": "running",
        "interrupts": [],
    }


# Get Live Execution Progress and Test Assets

@app.get("/runs/{thread_id}/progress")
def get_run_progress(thread_id: str):

    with runs_lock:

        run = runs.get(thread_id)

        if run is None:
            raise HTTPException(
                status_code=404,
                detail="Test run not found.",
            )

        response = run.copy()

    # Read the latest checkpoint so validated scripts can be exposed
    # as soon as the script_validator node has completed.
    config = {
        "configurable": {
            "thread_id": thread_id
        }
    }

    try:
        snapshot = graph.get_state(config)
        values = snapshot.values or {}

        response["approved_scripts"] = serialize_list(
            values.get("approved_scripts")
        )

        # Scenarios are only considered approved after the review
        # endpoint has accepted the user's decisions.
        with runs_lock:
            current_run = runs.get(thread_id)
            if current_run is not None:
                response["approved_scenarios"] = current_run.get(
                    "approved_scenarios", []
                )

    except Exception:
        # A run may not have produced its first checkpoint yet.
        pass

    return response


# Submit Human Review and Resume LangGraph

@app.post("/runs/{thread_id}/approve")
def approve_scenarios(
    thread_id: str,
    request: SubmitReviewRequest,
):

    config = {
        "configurable": {
            "thread_id": thread_id
        }
    }

    with runs_lock:

        run = runs.get(thread_id)

        if run is None:
            raise HTTPException(
                status_code=404,
                detail="Test run not found.",
            )

        if run["status"] != "waiting_for_review":
            raise HTTPException(
                status_code=409,
                detail="This test run is not waiting for human approval.",
            )

        snapshot = graph.get_state(config)

        if not snapshot.tasks or not any(
            task.interrupts for task in snapshot.tasks
        ):
            raise HTTPException(
                status_code=409,
                detail="No pending human review was found.",
            )

        approved_scenarios = [
            review.scenario
            for review in request.reviews
            if review.decision in ("accept", "modify")
        ]

        rejected_count = sum(
            review.decision == "reject"
            for review in request.reviews
        )

        run["status"] = "running"
        run["current_node"] = "reviewer"
        run["interrupts"] = []
        run["approved_count"] = len(approved_scenarios)
        run["rejected_count"] = rejected_count
        run["approved_scenarios"] = serialize_list(approved_scenarios)
        run["approved_scripts"] = []
        run["node_status"]["reviewer"] = "completed"

        if "reviewer" not in run["completed_nodes"]:
            run["completed_nodes"].append("reviewer")

    start_background_execution(
        thread_id,
        Command(resume=approved_scenarios),
        config,
    )

    return {
        "thread_id": thread_id,
        "status": "running",
        "approved_count": len(approved_scenarios),
        "rejected_count": rejected_count,
        "interrupts": [],
    }
