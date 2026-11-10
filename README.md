::: {align="center"}
# NEXUS AI

### Autonomous API Testing Platform

**From requirements to reviewed scenarios, validated test scripts, API
execution, failure insights, and actionable reports.**

[![Python](https://img.shields.io/badge/Python-3.12+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![LangGraph](https://img.shields.io/badge/Orchestration-LangGraph-1C3C3C)](https://www.langchain.com/langgraph)
[![React](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Status](https://img.shields.io/badge/Status-Proof%20of%20Concept-orange)]()
:::

------------------------------------------------------------------------

## The idea

API testing often involves several disconnected activities:
understanding requirements, designing test cases, writing scripts,
validating those scripts, executing them, investigating failures, and
preparing reports.

**NEXUS AI explores how specialized AI agents can connect these
activities into one guided workflow.**

Give it a Jira story and an API specification. NEXUS AI analyzes the
requirements, proposes test scenarios for human review, generates and
validates Python test scripts, executes approved scripts against a
target API, analyzes failures, and prepares reports for technical and
non-technical audiences.

> **Core principle:** AI accelerates the work. Human review and script
> validation add control before execution.

## The workflow

``` mermaid
flowchart TD
    A["Jira Story"] --> B["Jira Analysis Agent"]
    S["API Specification JSON"] --> B
    B --> C["Test Case Creator"]
    S --> C
    C --> D["Human Review"]
    D --> E["Test Script Generator"]
    S --> E
    E --> F

    subgraph V["Script Validation Subgraph"]
      F["Script Reviewer"] --> G{"Valid?"}
      G -->|Yes| H["Accept Script"]
      G -->|No| I{"Retry limit reached?"}
      I -->|No| J["Script Corrector"]
      J --> F
      I -->|Yes| K["Manual Intervention"]
    end

    H --> L["Test Executor"]
    L --> M["Failure Analysis Agent"]
    M --> N["Report Generator"]
    N --> O["Technical Report"]
    N --> P["Stakeholder Report"]

    classDef input fill:#FFF0B3,stroke:#D69E00,color:#573900,stroke-width:2px
    classDef agent fill:#DCEBFF,stroke:#2563EB,color:#123B75,stroke-width:2px
    classDef human fill:#EADCF8,stroke:#9333EA,color:#581C87,stroke-width:2px
    classDef validator fill:#FFE0E0,stroke:#DC2626,color:#7F1D1D,stroke-width:2px
    classDef decision fill:#FFF0B3,stroke:#D69E00,color:#573900,stroke-width:2px
    classDef success fill:#D1FAE5,stroke:#059669,color:#064E3B,stroke-width:2px
    classDef warning fill:#FFE4CC,stroke:#EA580C,color:#7C2D12,stroke-width:2px
    classDef output fill:#CFFAFE,stroke:#0891B2,color:#164E63,stroke-width:2px

    class A,S input
    class B,C,E,L,M,N agent
    class D human
    class F,J validator
    class G,I decision
    class H success
    class K warning
    class O,P output
```

### Pipeline stages

  -----------------------------------------------------------------------
  Stage                   Component               Responsibility
  ----------------------- ----------------------- -----------------------
  1                       Jira Analysis Agent     Understands the story,
                                                  extracts requirements,
                                                  and identifies
                                                  ambiguities or
                                                  assumptions using API
                                                  context.

  2                       Test Case Creator       Generates positive,
                                                  negative, boundary, and
                                                  edge-case scenarios.

  3                       Human Review            Allows a tester to
                                                  accept, modify, or
                                                  reject proposed
                                                  scenarios before script
                                                  generation.

  4                       Test Script Generator   Creates independent
                                                  Python/pytest scripts
                                                  for approved scenarios.

  5                       Script Validation       Reviews scripts against
                                                  the scenario and API
                                                  specification; sends
                                                  invalid scripts through
                                                  correction retries.

  6                       Test Executor           Executes successfully
                                                  validated scripts
                                                  against the target API
                                                  and captures results.

  7                       Failure Analysis Agent  Examines failed or
                                                  errored tests and
                                                  provides evidence-based
                                                  diagnosis and
                                                  recommended next steps.

  8                       Report Generator        Produces technical and
                                                  stakeholder-oriented
                                                  reports.
  -----------------------------------------------------------------------

### Inside the validation subgraph

Script validation is a nested LangGraph workflow:

1.  **Review** the generated script for scenario coverage, API contract
    alignment, assertions, and test quality.
2.  **Accept** the script when it passes review.
3.  **Correct and retry** when blocking issues are found.
4.  **Escalate for manual intervention** if the script remains invalid
    after the configured retry limit.

The current flow allows an initial review plus up to two correction
retries. Only scripts that reach the valid state are passed to automatic
execution.

## What the POC demonstrates

-   **Requirement-aware test design** --- derives scenarios from Jira
    story context and an API specification.
-   **Assumption awareness** --- distinguishes documented behavior from
    unclear or unspecified requirements.
-   **Human-in-the-loop review** --- keeps a tester involved before
    scripts are generated and executed.
-   **Automated script generation** --- creates Python/pytest test
    scripts from approved scenarios.
-   **Validation with correction retries** --- reviews generated scripts
    and attempts corrections before escalation.
-   **API test execution** --- runs validated scripts and captures
    execution output and status.
-   **Failure analysis** --- summarizes likely causes, supporting
    evidence, and suggested actions.
-   **Two reporting perspectives** --- provides detailed technical
    findings and a stakeholder-friendly summary.
-   **Reusable test assets** --- allows approved scenarios and validated
    scripts to be previewed and downloaded individually or in bulk.
-   **Workflow visibility** --- displays pipeline progress and
    node-level execution status.

## Reports

NEXUS AI generates two report perspectives:

  Technical report                  Stakeholder report
  --------------------------------- -------------------------------
  Test-level execution details      Overall testing summary
  Failure evidence and diagnosis    Quality and business impact
  Script/API observations           Outstanding risks and actions
  Suggested technical remediation   Release-oriented assessment

AI-generated failure diagnoses are recommendations based on the
available execution evidence. They should be reviewed by an engineer
rather than treated as guaranteed root-cause determinations.

## Technology stack

  Layer                           Technologies
  ------------------------------- -----------------------
  Agent orchestration             LangGraph
  Backend API                     Python, FastAPI
  Data validation and schemas     Pydantic
  Test generation and execution   Python, pytest, HTTPX
  Frontend                        React, TypeScript
  Styling and build tooling       Tailwind CSS, Vite
  Python dependency management    uv

## Repository structure

``` text
autonomous-api-tester/
├── src/
│   └── autonomous_api_tester/
│       ├── api.py
│       ├── parent_graph.py
│       ├── script_validation_graph.py
│       ├── jira_analysis_agent.py
│       ├── scenario_generator.py
│       ├── testcase_creator_agent.py
│       ├── test_script_generator.py
│       ├── test_script_reviewer.py
│       ├── test_executor.py
│       ├── failure_analysis_agent.py
│       ├── report_generator.py
│       ├── schemas.py
│       ├── api_config.py
│       ├── api_discovery.py
│       ├── api_spec.json
│       └── templates/
├── frontend/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── layouts/
│       ├── pages/
│       └── services/
├── pyproject.toml
├── uv.lock
├── .python-version
└── README.md
```

## Run locally

### Prerequisites

-   Python 3.12 or a compatible version supported by the project
-   [uv](https://docs.astral.sh/uv/)
-   Node.js and npm
-   An LLM provider account and credentials configured for the provider
    used by `llm_client.py`
-   A reachable REST API and its API specification

### 1. Clone the repository

``` bash
git clone https://github.com/Deepak-1260/nexus-ai-autonomous-api-testing.git
cd nexus-ai-autonomous-api-testing
```

### 2. Set up the backend

``` bash
uv sync
```

Configure the LLM provider credentials and any model settings required
by `src/autonomous_api_tester/llm_client.py`.

Configure the target API base URL using the `API_BASE_URL` environment
variable where required by the generated tests. Keep credentials and
environment-specific values out of source control.

Start the backend from the repository root:

``` bash
uv run uvicorn autonomous_api_tester.api:app
```

The FastAPI service runs at:

``` text
http://127.0.0.1:8000
```

Interactive API documentation is available at:

``` text
http://127.0.0.1:8000/docs
```

### 3. Set up the frontend

Open a second terminal:

``` bash
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal (typically
`http://localhost:5173`).

### 4. Run a test workflow

1.  Start a new test run from the UI.
2.  Provide the Jira story details and ensure the relevant API
    specification is available to the backend.
3.  Review the proposed scenarios. Accept, modify, or reject them.
4.  Inspect approved test assets and generated scripts.
5.  Follow execution progress and review the technical and stakeholder
    reports.

## API workflow endpoints

The backend exposes the workflow through FastAPI. The primary operations
include:

  ----------------------------------------------------------------------------------
  Operation               Endpoint                           Purpose
  ----------------------- ---------------------------------- -----------------------
  Start a run             `POST /runs`                       Starts a test workflow
                                                             from a Jira story.

  Review scenarios        `POST /runs/{thread_id}/approve`   Submits human decisions
                                                             and resumes the
                                                             workflow.

  Run progress            `GET /runs/{thread_id}/progress`   Retrieves workflow
                                                             progress and available
                                                             run information.

  Health check            `GET /health`                      Checks backend
                                                             availability, if
                                                             enabled in the current
                                                             API version.
  ----------------------------------------------------------------------------------

Use `/docs` on the running backend to inspect the exact request and
response schemas exposed by your checkout.

## Important scope and limitations

NEXUS AI is a **working proof of concept**, not a production-ready
enterprise testing service.

-   It demonstrates an agentic API-testing workflow; it is not a
    complete Jira or enterprise-platform integration.
-   API specifications and target API access must be made available to
    the workflow.
-   LLM-generated scenarios, scripts, and failure diagnoses can be
    imperfect. Human review and validation are important safeguards, not
    guarantees.
-   The current checkpoint and run-tracking implementation uses
    in-memory components. Restarting the backend can clear active run
    state; durable persistence is a future improvement.
-   Execute against a controlled test environment. Re-running tests that
    create or modify data can have side effects.
-   Production adoption would require security review, secret
    management, durable persistence, access controls, auditability,
    broader API coverage, and reliability evaluation.

## Roadmap

-   [ ] Validate against a broader range of real-world API
    specifications.
-   [ ] Evaluate scenario quality and generated-script reliability.
-   [ ] Add durable workflow persistence and recovery.
-   [ ] Support controlled re-execution of selected or failed tests.
-   [ ] Add revision history and run-to-run comparison.
-   [ ] Strengthen security, access control, and audit capabilities.
-   [ ] Explore CI/CD integration and enterprise deployment patterns.

## Design philosophy

NEXUS AI is built around a simple idea:

**Don't ask one AI prompt to do the entire testing job. Orchestrate
specialized steps, preserve workflow state, validate generated
artifacts, and keep people involved at the right decision points.**

The goal is not to remove testers from the process. It is to reduce
repetitive work and help them spend more time on test strategy,
meaningful investigation, and quality decisions.

------------------------------------------------------------------------

## Author

**Deepak Kumar Kella**

Software Engineer \| AI Engineering Enthusiast

[![GitHub](https://img.shields.io/badge/GitHub-Deepak--1260-181717?logo=github)](https://github.com/Deepak-1260)

------------------------------------------------------------------------

::: {align="center"}
**NEXUS AI --- Turning API testing workflows into an orchestrated,
reviewable process.**
:::
