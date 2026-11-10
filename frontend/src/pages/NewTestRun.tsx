import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  FileText,
  Loader2,
  Play,
} from "lucide-react";
import { startTest } from "../services/api";
import { useTestRun } from "../context/TestRunContext";

function NewTestRun() {
  const navigate = useNavigate();
  const { setCurrentRun, clearScenarioDecisions } = useTestRun();

  const [storyId, setStoryId] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [operationId, setOperationId] = useState("");
  const [criteria, setCriteria] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleStartTesting() {
    setError("");

    const acceptanceCriteria = criteria
      .split("\\n")
      .map((item) => item.trim())
      .filter(Boolean);

    if (
      !storyId.trim() ||
      !summary.trim() ||
      !description.trim() ||
      !operationId.trim() ||
      acceptanceCriteria.length === 0
    ) {
      setError(
        "Please complete all fields and provide at least one acceptance criterion."
      );
      return;
    }

    setLoading(true);

    try {
      const result = await startTest({
        story_id: storyId.trim(),
        summary: summary.trim(),
        description: `${description.trim()}\\n\\nThe API to test is ${operationId.trim()}.`,
        acceptance_criteria: acceptanceCriteria,
      });

      // Clear decisions from the previous run only after the new run starts successfully.
      clearScenarioDecisions();

      setCurrentRun({
        ...result,
        current_node: null,
        completed_nodes: [],
        node_status: {},
        approved_count: 0,
        rejected_count: 0,
        execution_results: [],
        failure_analyses: [],
        technical_report: null,
        stakeholder_report: null,
        error: null,
      });

      navigate("/workflow");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to start AI testing."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-7">
      <section>
        <div className="flex items-center gap-2 text-blue-400">
          <FileText size={18} />
          <span className="text-xs font-semibold tracking-widest">
            AUTONOMOUS TEST INITIATION
          </span>
        </div>
        <h2 className="mt-2 text-2xl font-bold text-white">New Test Run</h2>
        <p className="mt-2 text-sm text-slate-400">
          Submit a Jira story to start an autonomous API testing workflow.
        </p>
      </section>

      <section className="rounded-xl border border-slate-800 bg-[#111c30] p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-500/10 p-3">
            <FileText className="text-blue-400" size={22} />
          </div>
          <div>
            <h3 className="font-semibold text-white">Jira Story Input</h3>
            <p className="text-xs text-slate-400">
              Provide the requirement that needs to be tested
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs text-slate-400">Jira Story ID</label>
            <input value={storyId} onChange={(e) => setStoryId(e.target.value)}
              placeholder="Example: TASK-102"
              className="w-full rounded-lg border border-slate-700 bg-[#0b1120] px-4 py-3 text-sm text-white outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="mb-2 block text-xs text-slate-400">Story Summary</label>
            <input value={summary} onChange={(e) => setSummary(e.target.value)}
              placeholder="Example: Create a new task"
              className="w-full rounded-lg border border-slate-700 bg-[#0b1120] px-4 py-3 text-sm text-white outline-none focus:border-blue-500" />
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-xs text-slate-400">API Operation ID</label>
            <input value={operationId} onChange={(e) => setOperationId(e.target.value)}
              placeholder="Example: create_task"
              className="w-full rounded-lg border border-slate-700 bg-[#0b1120] px-4 py-3 text-sm text-white outline-none focus:border-blue-500" />
            <p className="mt-1 text-xs text-slate-500">Enter the exact operation ID from your API catalog.</p>
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-xs text-slate-400">Story Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            rows={3} placeholder="Describe the business requirement..."
            className="w-full resize-y rounded-lg border border-slate-700 bg-[#0b1120] px-4 py-3 text-sm text-white outline-none focus:border-blue-500" />
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-xs text-slate-400">Acceptance Criteria</label>
          <textarea value={criteria} onChange={(e) => setCriteria(e.target.value)}
            rows={4} placeholder="Enter each acceptance criterion on a new line..."
            className="w-full resize-y rounded-lg border border-slate-700 bg-[#0b1120] px-4 py-3 text-sm text-white outline-none focus:border-blue-500" />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">Submit a Jira story to initiate the AI testing workflow.</p>
          <button onClick={handleStartTesting} disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            {loading ? "Starting..." : "Start AI Testing"}
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
            <AlertCircle size={16} className="mt-0.5 text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default NewTestRun;
