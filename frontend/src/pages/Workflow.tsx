
import {
  BrainCircuit,
  CheckCircle2,
  Circle,
  FileSearch,
  FileText,
  GitBranch,
  Play,
  ShieldCheck,
  Terminal,
  Workflow as WorkflowIcon,
  AlertCircle,
  Loader2,
} from "lucide-react";

import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getRunProgress } from "../services/api";
import { useTestRun } from "../context/TestRunContext";

const agents = [
  {
    node: "jira_analysis",
    name: "Jira Analysis",
    description: "Analyzes business requirements and acceptance criteria",
    icon: FileText,
  },
  {
    node: "test_case_creator",
    name: "Test Case Creator",
    description: "Generates positive, negative and boundary scenarios",
    icon: BrainCircuit,
  },
  {
    node: "reviewer",
    name: "Human Review",
    description: "Waits for tester approval of generated scenarios",
    icon: ShieldCheck,
  },
  {
    node: "script_generator",
    name: "Test Script Generator",
    description: "Generates independent Pytest scripts",
    icon: Terminal,
  },
  {
    node: "script_validator",
    name: "Script Validation",
    description: "Reviews scripts and corrects identified issues",
    icon: GitBranch,
  },
  {
    node: "test_executor",
    name: "Test Executor",
    description: "Executes approved scripts against the API",
    icon: Play,
  },
  {
    node: "failure_analyses",
    name: "Failure Analysis",
    description: "Investigates failed tests and identifies root causes",
    icon: FileSearch,
  },
  {
    node: "report_generator",
    name: "Report Generator",
    description: "Creates technical and stakeholder reports",
    icon: FileText,
  },
];

function Workflow() {
  const navigate = useNavigate();
  const { currentRun, setCurrentRun } = useTestRun();

  // Prevent repeated navigation after workflow completion.
  const completionRedirected = useRef(false);

  // Poll backend while the LangGraph workflow is running.
  useEffect(() => {
    if (!currentRun?.thread_id || currentRun.status !== "running") {
      return;
    }

    const threadId = currentRun.thread_id;
    let active = true;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    async function pollProgress() {
      try {
        const progress = await getRunProgress(threadId);
        if (!active) return;
        setCurrentRun(progress);

        if (progress.status === "running") {
          timeout = setTimeout(pollProgress, 1000);
        }
      } catch (err) {
        if (!active) return;
        console.error("Unable to retrieve workflow progress:", err);
        timeout = setTimeout(pollProgress, 2000);
      }
    }

    void pollProgress();

    return () => {
      active = false;
      if (timeout) clearTimeout(timeout);
    };
  }, [currentRun?.thread_id, currentRun?.status, setCurrentRun]);

  // Route to the next stage when the backend reports a workflow transition.
  useEffect(() => {
    if (
      currentRun?.status === "waiting_for_review" &&
      currentRun.interrupts?.length
    ) {
      navigate("/review", { replace: true });
      return;
    }

    if (
      currentRun?.status === "completed" &&
      !completionRedirected.current
    ) {
      completionRedirected.current = true;
      navigate("/execution", { replace: true });
    }
  }, [
    currentRun?.status,
    currentRun?.interrupts?.length,
    navigate,
  ]);

  function getStatusDetails(status: string) {
    switch (status) {
      case "completed":
        return {
          label: "Completed",
          icon: CheckCircle2,
          color: "text-emerald-400",
          border: "border-emerald-500/30",
          background: "bg-emerald-500/10",
        };

      case "running":
        return {
          label: "Running",
          icon: Loader2,
          color: "text-blue-400",
          border: "border-blue-500/40",
          background: "bg-blue-500/10",
        };

      case "waiting":
        return {
          label: "Waiting for review",
          icon: AlertCircle,
          color: "text-amber-400",
          border: "border-amber-500/30",
          background: "bg-amber-500/5",
        };

      case "failed":
        return {
          label: "Failed",
          icon: AlertCircle,
          color: "text-red-400",
          border: "border-red-500/30",
          background: "bg-red-500/5",
        };

      default:
        return {
          label: "Pending",
          icon: Circle,
          color: "text-slate-500",
          border: "border-slate-700",
          background: "bg-slate-800/50",
        };
    }
  }

  const workflowStatus = currentRun?.status;

  return (
    <div className="space-y-7">
      <section>
        <div className="flex items-center gap-2 text-blue-400">
          <WorkflowIcon size={18} />
          <span className="text-xs font-semibold tracking-widest">
            AUTONOMOUS ORCHESTRATION
          </span>
        </div>

        <h2 className="mt-2 text-2xl font-bold text-white">
          AI Agent Workflow
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          Monitor how intelligent agents collaborate throughout the API testing lifecycle.
        </p>
      </section>

      {/* Dynamic Agent Pipeline */}

      <section className="rounded-xl border border-slate-800 bg-[#111c30] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-white">
              Agent Execution Pipeline
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Eight actual LangGraph execution nodes
            </p>
          </div>

          {workflowStatus && (
            <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300">
              {workflowStatus.replaceAll("_", " ").toUpperCase()}
            </span>
          )}
        </div>

        {currentRun?.current_node && (
          <div className="mt-4 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
            <p className="text-xs text-slate-400">
              Current execution node
            </p>
            <p className="mt-1 text-sm font-semibold text-blue-400">
              {agents.find(
                (agent) => agent.node === currentRun.current_node
              )?.name ?? currentRun.current_node}
            </p>
          </div>
        )}

        <div className="mt-6 space-y-3">
          {agents.map((agent, index) => {
            const Icon = agent.icon;

            const status =
              currentRun?.node_status?.[agent.node] ?? "pending";

            const details = getStatusDetails(status);
            const StatusIcon = details.icon;

            return (
              <div key={agent.node} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${details.border} ${details.background}`}
                  >
                    <Icon size={20} className={details.color} />
                  </div>

                  {index !== agents.length - 1 && (
                    <div className="my-1 h-8 w-px bg-slate-700" />
                  )}
                </div>

                <div
                  className={`mb-2 flex-1 rounded-lg border p-4 transition-colors ${
                    status === "running"
                      ? "border-blue-500/40 bg-blue-500/5"
                      : status === "completed"
                        ? "border-emerald-500/20 bg-[#0b1120]"
                        : status === "waiting"
                          ? "border-amber-500/30 bg-amber-500/5"
                          : status === "failed"
                            ? "border-red-500/30 bg-red-500/5"
                            : "border-slate-800 bg-[#0b1120]"
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-200">
                    {index + 1}. {agent.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {agent.description}
                  </p>

                  <p
                    className={`mt-3 flex items-center gap-2 border-t border-slate-800 pt-3 text-xs ${details.color}`}
                  >
                    <StatusIcon
                      size={14}
                      className={
                        status === "running" ? "animate-spin" : ""
                      }
                    />
                    {details.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {workflowStatus === "failed" && currentRun?.error && (
          <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
            <p className="text-sm font-semibold text-red-400">
              Workflow execution failed
            </p>
            <p className="mt-1 text-xs text-red-300">
              {currentRun.error}
            </p>
          </div>
        )}
      </section>

      <div className="flex items-start gap-3 rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
        <BrainCircuit size={19} className="mt-0.5 text-blue-400" />
        <div>
          <p className="text-sm font-medium text-blue-300">
            Live agent orchestration
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            Execution statuses are retrieved directly from the backend
            using the LangGraph run thread ID.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Workflow;
