import { createContext, useContext, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";

export type ScenarioDecision = "accept" | "reject" | "modify";

export type NodeExecutionStatus =
  | "pending"
  | "running"
  | "completed"
  | "waiting"
  | "failed";

export type TestScenario = {
  scenario_id: string;
  title: string;
  scenario_type: "positive" | "negative" | "boundary" | "edge_case";
  expected_result: string;
  is_assumption: boolean;
};

export type GeneratedTestScript = {
  scenario_id: string;
  test_name: string;
  script_code: string;
  dependencies: string[];
};

export type TestExecutionResult = {
  scenario_id: string;
  test_name: string;
  status: "passed" | "skipped" | "failed" | "error";
  execution_output: string;
  error_message: string;
  execution_time: number;
};

export type FailureAnalysis = {
  scenario_id: string;
  failure_type:
    | "api_defect"
    | "test_script_defect"
    | "environment_issue"
    | "contract_mismatch"
    | "unknown";
  root_cause: string;
  evidence: string[];
  confidence: "high" | "medium" | "low";
  remediation: string;
  needs_human_review: boolean;
};

export type TestCaseReport = {
  scenario_id: string;
  test_name: string;
  status: "passed" | "failed" | "error" | "skipped";
  execution_time: number;
  failure_type:
    | "api_defect"
    | "test_script_defect"
    | "environment_issue"
    | "contract_mismatch"
    | "unknown"
    | null;
  root_cause: string | null;
  evidence: string[];
  remediation: string | null;
  needs_human_review: boolean;
};

export type TechnicalReport = {
  report_title: string;
  story_id: string;
  story_summary: string;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  errored_tests: number;
  skipped_tests: number;
  overall_status: "passed" | "failed" | "partially_passed" | "inconclusive";
  test_case_reports: TestCaseReport[];
  technical_findings: string[];
  unresolved_issues: string[];
  recommended_actions: string[];
  human_review_required: boolean;
  conclusion: string;
};

export type StakeholderReport = {
  report_title: string;
  story_id: string;
  feature_summary: string;
  executive_summary: string;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  errored_tests: number;
  skipped_tests: number;
  overall_status: "passed" | "failed" | "partially_passed" | "inconclusive";
  quality_assessment: string;
  key_findings: string[];
  business_risks: string[];
  outstanding_actions: string[];
  release_recommendation:
    | "ready"
    | "ready_with_observations"
    | "not_ready"
    | "requires_further_testing";
  final_recommendation: string;
};

export type TestRun = {
  thread_id: string;
  status: string;

  // Human review data
  interrupts: {
    id: string;
    value: {
      message: string;
      scenarios: TestScenario[];
    };
  }[];

  // Approved test assets
  approved_scenarios?: TestScenario[];
  approved_scripts?: GeneratedTestScript[];

  // Live execution progress
  current_node?: string | null;
  completed_nodes?: string[];
  node_status?: Record<string, NodeExecutionStatus>;

  // Review counts
  approved_count?: number;
  rejected_count?: number;

  // Execution results and reports
  execution_results?: TestExecutionResult[];
  failure_analyses?: FailureAnalysis[];
  technical_report?: TechnicalReport | null;
  stakeholder_report?: StakeholderReport | null;

  // Error information
  error?: string | null;
};

type TestRunContextType = {
  currentRun: TestRun | null;
  setCurrentRun: Dispatch<SetStateAction<TestRun | null>>;

  decisions: Record<string, ScenarioDecision>;

  setScenarioDecision: (
    scenarioId: string,
    decision: ScenarioDecision
  ) => void;

  resetScenarioDecision: (scenarioId: string) => void;

  clearScenarioDecisions: () => void;

  updateScenario: (
    scenarioId: string,
    updates: Partial<TestScenario>
  ) => void;
};

const TestRunContext = createContext<TestRunContextType | undefined>(
  undefined
);

export function TestRunProvider({ children }: { children: ReactNode }) {
  const [currentRun, setCurrentRun] = useState<TestRun | null>(null);

  const [decisions, setDecisions] = useState<
    Record<string, ScenarioDecision>
  >({});

  function setScenarioDecision(
    scenarioId: string,
    decision: ScenarioDecision
  ) {
    setDecisions((previous) => ({
      ...previous,
      [scenarioId]: decision,
    }));
  }

  function resetScenarioDecision(scenarioId: string) {
    setDecisions((previous) => {
      const updated = { ...previous };
      delete updated[scenarioId];
      return updated;
    });
  }

  function clearScenarioDecisions() {
    setDecisions({});
  }

  function updateScenario(
    scenarioId: string,
    updates: Partial<TestScenario>
  ) {
    setCurrentRun((previous) => {
      if (!previous) return previous;

      return {
        ...previous,
        interrupts: previous.interrupts.map((interrupt) => ({
          ...interrupt,
          value: {
            ...interrupt.value,
            scenarios: interrupt.value.scenarios.map((scenario) =>
              scenario.scenario_id === scenarioId
                ? { ...scenario, ...updates }
                : scenario
            ),
          },
        })),
      };
    });
  }

  return (
    <TestRunContext.Provider
      value={{
        currentRun,
        setCurrentRun,
        decisions,
        setScenarioDecision,
        resetScenarioDecision,
        clearScenarioDecisions,
        updateScenario,
      }}
    >
      {children}
    </TestRunContext.Provider>
  );
}

export function useTestRun() {
  const context = useContext(TestRunContext);

  if (!context) {
    throw new Error("useTestRun must be used inside TestRunProvider");
  }

  return context;
}
