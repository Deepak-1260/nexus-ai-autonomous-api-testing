import type {
  TestScenario,
  GeneratedTestScript,
  TestExecutionResult,
  FailureAnalysis,
  TechnicalReport,
  StakeholderReport,
  NodeExecutionStatus,
} from "../context/TestRunContext";

const API_BASE_URL = "http://localhost:8000";

export async function checkBackendHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);

  if (!response.ok) {
    throw new Error("Backend health check failed");
  }

  return response.json();
}

// Start a new AI testing workflow

export type StartTestResponse = {
  thread_id: string;
  status: string;
  interrupts: {
    id: string;
    value: {
      message: string;
      scenarios: TestScenario[];
    };
  }[];
};

export async function startTest(jiraStory: {
  story_id: string;
  summary: string;
  description: string;
  acceptance_criteria: string[];
}): Promise<StartTestResponse> {
  const response = await fetch(`${API_BASE_URL}/runs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jira_story: jiraStory,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Failed to start AI testing");
  }

  return response.json();
}

// Live execution progress and approved test assets

export type RunProgressResponse = {
  thread_id: string;
  status: string;
  current_node: string | null;
  completed_nodes: string[];
  node_status: Record<string, NodeExecutionStatus>;
  interrupts: StartTestResponse["interrupts"];
  approved_count: number;
  rejected_count: number;
  approved_scenarios: TestScenario[];
  approved_scripts: GeneratedTestScript[];
  execution_results: TestExecutionResult[];
  failure_analyses: FailureAnalysis[];
  technical_report: TechnicalReport | null;
  stakeholder_report: StakeholderReport | null;
  error: string | null;
};

export async function getRunProgress(
  threadId: string
): Promise<RunProgressResponse> {
  const response = await fetch(
    `${API_BASE_URL}/runs/${threadId}/progress`
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Failed to retrieve execution progress");
  }

  return response.json();
}

// Submit human review decisions

export type ScenarioReview = {
  scenario: TestScenario;
  decision: "accept" | "reject" | "modify";
};

export type ApprovalResponse = {
  thread_id: string;
  status: string;
  approved_count: number;
  rejected_count: number;
  interrupts: StartTestResponse["interrupts"];

  // These are populated by the progress endpoint after execution finishes.
  execution_results?: TestExecutionResult[];
  failure_analyses?: FailureAnalysis[];
  technical_report?: TechnicalReport | null;
  stakeholder_report?: StakeholderReport | null;
};

export async function approveScenarios(
  threadId: string,
  reviews: ScenarioReview[]
): Promise<ApprovalResponse> {
  const response = await fetch(
    `${API_BASE_URL}/runs/${threadId}/approve`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reviews,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Failed to submit scenario approvals");
  }

  return response.json();
}
