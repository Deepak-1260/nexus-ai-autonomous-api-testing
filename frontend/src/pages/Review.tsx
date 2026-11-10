
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Pencil,
  FileText,
  AlertCircle,
  Save,
  RotateCcw,
  Send,
  Loader2,
} from "lucide-react";

import {
  useTestRun,
  type ScenarioDecision,
} from "../context/TestRunContext";

import { approveScenarios } from "../services/api";

function Review() {
  const navigate = useNavigate();
  const {
    currentRun,
    setCurrentRun,
    decisions,
    setScenarioDecision,
    resetScenarioDecision,
    updateScenario,
  } = useTestRun();

  const scenarios =
    currentRun?.interrupts?.[0]?.value?.scenarios ?? [];

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editExpectedResult, setEditExpectedResult] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  const acceptedCount = Object.values(decisions).filter(
    (decision) => decision === "accept" || decision === "modify"
  ).length;

  const rejectedCount = Object.values(decisions).filter(
    (decision) => decision === "reject"
  ).length;

  const undecidedCount = scenarios.filter(
    (scenario) => !decisions[scenario.scenario_id]
  ).length;

  function selectDecision(
    scenarioId: string,
    decision: ScenarioDecision
  ) {
    setScenarioDecision(scenarioId, decision);
    setSubmitError("");
    setSubmitSuccess("");
  }

  function startEditing(scenario: (typeof scenarios)[number]) {
    setEditingId(scenario.scenario_id);
    setEditTitle(scenario.title);
    setEditExpectedResult(scenario.expected_result);
  }

  function saveModification(scenarioId: string) {
    if (!editTitle.trim() || !editExpectedResult.trim()) {
      return;
    }

    updateScenario(scenarioId, {
      title: editTitle.trim(),
      expected_result: editExpectedResult.trim(),
      is_assumption: false,
    });

    setScenarioDecision(scenarioId, "modify");

    setEditingId(null);
    setEditTitle("");
    setEditExpectedResult("");
    setSubmitError("");
    setSubmitSuccess("");
  }

  function cancelEditing() {
    setEditingId(null);
    setEditTitle("");
    setEditExpectedResult("");
  }

  function resetDecision(scenarioId: string) {
    resetScenarioDecision(scenarioId);
    setSubmitError("");
    setSubmitSuccess("");
  }

  async function handleSubmitApproval() {
    if (!currentRun) {
      setSubmitError("No active test run found.");
      return;
    }

    if (scenarios.length === 0) {
      setSubmitError("No scenarios available for approval.");
      return;
    }

    if (undecidedCount > 0) {
      setSubmitError(
        `Please review all scenarios. ${undecidedCount} scenario(s) still need a decision.`
      );
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess("");

    try {
      const reviews = scenarios.map((scenario) => ({
        scenario,
        decision: decisions[scenario.scenario_id]!,
      }));

      const response = await approveScenarios(
        currentRun.thread_id,
        reviews
      );

      setCurrentRun({
        ...currentRun,
        status: response.status,

        interrupts:
          response.interrupts.length > 0
            ? response.interrupts
            : currentRun.interrupts,

        execution_results: response.execution_results,
        failure_analyses: response.failure_analyses,
        technical_report: response.technical_report,
        stakeholder_report: response.stakeholder_report,
      });

      // Return to Pipeline Monitor so it can poll the same run as execution resumes.
      navigate("/workflow");

      setSubmitSuccess(
        `Approval submitted successfully. ${response.approved_count} scenario(s) approved and ${response.rejected_count} rejected.`
      );
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Failed to submit scenario approvals."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-7">

      {/* Page Introduction */}
      <section>
        <div className="flex items-center gap-2 text-blue-400">
          <ShieldCheck size={18} />
          <span className="text-xs font-semibold tracking-widest">
            HUMAN-IN-THE-LOOP
          </span>
        </div>

        <h2 className="mt-2 text-2xl font-bold text-white">
          Review & Test Intelligence
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          Review AI-generated test scenarios and validate them before
          test script generation.
        </p>
      </section>

      {/* Run Information */}
      {currentRun && (
        <section className="rounded-xl border border-slate-800 bg-[#111c30] p-4">
          <p className="text-xs text-slate-400">Current Test Run</p>

          <p className="mt-2 text-sm text-white">
            Thread ID: {currentRun.thread_id}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Backend status: {currentRun.status}
          </p>
        </section>
      )}

      {/* Review Summary */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-[#111c30] p-5">
          <p className="text-xs text-slate-400">Total Scenarios</p>

          <h3 className="mt-2 text-2xl font-bold text-white">
            {scenarios.length}
          </h3>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-[#111c30] p-5">
          <p className="text-xs text-slate-400">Accepted / Modified</p>

          <h3 className="mt-2 text-2xl font-bold text-emerald-400">
            {acceptedCount}
          </h3>
        </div>

        <div className="rounded-xl border border-red-500/20 bg-[#111c30] p-5">
          <p className="text-xs text-slate-400">Rejected</p>

          <h3 className="mt-2 text-2xl font-bold text-red-400">
            {rejectedCount}
          </h3>
        </div>
      </section>

      {/* Generated Scenarios */}
      <section className="rounded-xl border border-slate-800 bg-[#111c30] p-5">

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-white">
              Generated Test Scenarios
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              Validate each scenario before proceeding.
            </p>
          </div>

          <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-400">
            {currentRun?.status === "waiting_for_review"
              ? "Awaiting review"
              : currentRun?.status === "completed"
                ? "Workflow completed"
                : "No active review"}
          </span>
        </div>

        {scenarios.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-slate-700 p-10 text-center">
            <FileText size={32} className="mx-auto text-slate-600" />

            <h4 className="mt-3 font-medium text-slate-300">
              No scenarios available
            </h4>

            <p className="mt-2 text-sm text-slate-500">
              Start an AI testing workflow and wait for LangGraph
              to return generated scenarios for human review.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {scenarios.map((scenario, index) => {
              const decision = decisions[scenario.scenario_id];
              const isEditing = editingId === scenario.scenario_id;

              return (
                <div
                  key={scenario.scenario_id}
                  className="rounded-xl border border-slate-800 bg-[#0b1120] p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-500">
                        SCENARIO {index + 1} · {scenario.scenario_id}
                      </p>

                      <h4 className="mt-2 font-semibold text-white">
                        {scenario.title}
                      </h4>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs capitalize text-blue-400">
                        {scenario.scenario_type.replace("_", " ")}
                      </span>

                      {scenario.is_assumption && (
                        <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-400">
                          AI Assumption
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 border-t border-slate-800 pt-4">
                    <p className="text-xs font-medium text-slate-400">
                      Expected Result
                    </p>

                    {isEditing ? (
                      <div className="mt-3 space-y-3">
                        <input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full rounded-lg border border-slate-700 bg-[#111c30] px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                          placeholder="Scenario title"
                        />

                        <textarea
                          value={editExpectedResult}
                          onChange={(e) =>
                            setEditExpectedResult(e.target.value)
                          }
                          rows={3}
                          className="w-full rounded-lg border border-slate-700 bg-[#111c30] px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                          placeholder="Expected result"
                        />

                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              saveModification(scenario.scenario_id)
                            }
                            disabled={
                              !editTitle.trim() ||
                              !editExpectedResult.trim()
                            }
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Save size={14} />
                            Save Changes
                          </button>

                          <button
                            onClick={cancelEditing}
                            className="rounded-lg border border-slate-700 px-4 py-2 text-xs text-slate-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        {scenario.expected_result}
                      </p>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
                      <div className="flex flex-wrap gap-2">

                        <button
                          onClick={() =>
                            selectDecision(scenario.scenario_id, "accept")
                          }
                          disabled={submitting || currentRun?.status === "completed"}
                          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
                            decision === "accept"
                              ? "bg-emerald-500 text-white"
                              : "border border-slate-700 text-slate-300 hover:border-emerald-500"
                          } disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                          <CheckCircle2 size={14} />
                          Accept
                        </button>

                        <button
                          onClick={() => startEditing(scenario)}
                          disabled={submitting || currentRun?.status === "completed"}
                          className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 hover:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Pencil size={14} />
                          Modify
                        </button>

                        <button
                          onClick={() =>
                            selectDecision(scenario.scenario_id, "reject")
                          }
                          disabled={submitting || currentRun?.status === "completed"}
                          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
                            decision === "reject"
                              ? "bg-red-500 text-white"
                              : "border border-slate-700 text-slate-300 hover:border-red-500"
                          } disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                          <XCircle size={14} />
                          Reject
                        </button>
                      </div>

                      {decision && currentRun?.status !== "completed" && (
                        <button
                          onClick={() =>
                            resetDecision(scenario.scenario_id)
                          }
                          disabled={submitting}
                          className="flex items-center gap-1 text-xs text-slate-500 hover:text-white disabled:opacity-50"
                        >
                          <RotateCcw size={13} />
                          Reset
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Approval Validation */}
        {scenarios.length > 0 &&
          currentRun?.status !== "completed" && (
            <div className="mt-6 border-t border-slate-800 pt-5">
              <div className="mb-4 flex flex-wrap justify-between gap-2 text-xs">
                <span className="text-slate-400">
                  {undecidedCount === 0
                    ? "All scenarios reviewed"
                    : `${undecidedCount} scenario(s) awaiting decision`}
                </span>

                <span className="text-slate-400">
                  {acceptedCount + rejectedCount}/{scenarios.length} reviewed
                </span>
              </div>

              <button
                onClick={handleSubmitApproval}
                disabled={submitting || undecidedCount > 0}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    Resuming AI Workflow...
                  </>
                ) : (
                  <>
                    <Send size={17} />
                    Submit for Approval
                  </>
                )}
              </button>
            </div>
          )}

        {/* Success Message */}
        {submitSuccess && (
          <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-400">
            {submitSuccess}
          </div>
        )}

        {/* Error Message */}
        {submitError && (
          <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            {submitError}
          </div>
        )}
      </section>

      {/* Information Note */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
        <AlertCircle size={19} className="mt-0.5 text-blue-400" />

        <div>
          <p className="text-sm font-medium text-blue-300">
            Human approval control
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-400">
            Review decisions and scenario modifications are maintained
            in shared context. Submitting approvals resumes the paused
            LangGraph workflow through FastAPI.
          </p>
        </div>
      </div>

    </div>
  );
}

export default Review;
