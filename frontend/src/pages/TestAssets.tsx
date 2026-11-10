import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Download,
  FileCode2,
  FileJson,
  FileText,
  FolderCode,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { getRunProgress } from "../services/api";
import { useTestRun } from "../context/TestRunContext";
import type {
  GeneratedTestScript,
  TestScenario,
} from "../context/TestRunContext";

type AssetTab = "scenarios" | "scripts";

function downloadFile(filename: string, content: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function safeFilename(value: string) {
  return value.replace(/[^a-z0-9-_]+/gi, "_").replace(/^_+|_+$/g, "") || "asset";
}

function TestAssets() {
  const { currentRun, setCurrentRun } = useTestRun();
  const [activeTab, setActiveTab] = useState<AssetTab>("scenarios");
  const [search, setSearch] = useState("");
  const [selectedScenario, setSelectedScenario] = useState<TestScenario | null>(null);
  const [selectedScript, setSelectedScript] = useState<GeneratedTestScript | null>(null);
  const [refreshError, setRefreshError] = useState("");

  const threadId = currentRun?.thread_id;

  // Refresh this run's artifacts while the workflow is active. The API reads
  // the latest LangGraph checkpoint, so validated scripts appear as soon as
  // the script-validation node completes.
  useEffect(() => {
    if (!threadId) return;

    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    const refresh = async () => {
      try {
        const progress = await getRunProgress(threadId);
        if (cancelled) return;

        setCurrentRun((previous) =>
          previous?.thread_id === threadId
            ? { ...previous, ...progress }
            : previous
        );
        setRefreshError("");

        if (progress.status === "completed" || progress.status === "failed") {
          if (timer) clearInterval(timer);
        }
      } catch (error) {
        if (!cancelled) {
          setRefreshError(
            error instanceof Error ? error.message : "Unable to refresh test assets."
          );
        }
      }
    };

    void refresh();
    timer = setInterval(() => void refresh(), 2500);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [threadId, setCurrentRun]);

  const scenarios = currentRun?.approved_scenarios ?? [];
  const scripts = currentRun?.approved_scripts ?? [];

  const filteredScenarios = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return scenarios;
    return scenarios.filter((scenario) =>
      [
        scenario.scenario_id,
        scenario.title,
        scenario.scenario_type,
        scenario.expected_result,
      ].some((value) => value.toLowerCase().includes(query))
    );
  }, [scenarios, search]);

  const filteredScripts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return scripts;
    return scripts.filter((script) =>
      [
        script.scenario_id,
        script.test_name,
        script.script_code,
        ...script.dependencies,
      ].some((value) => value.toLowerCase().includes(query))
    );
  }, [scripts, search]);

  function downloadScenario(scenario: TestScenario) {
    downloadFile(
      `${safeFilename(scenario.scenario_id)}.json`,
      JSON.stringify(scenario, null, 2),
      "application/json"
    );
  }

  function downloadAllScenarios() {
    downloadFile(
      "nexus-approved-test-cases.json",
      JSON.stringify(scenarios, null, 2),
      "application/json"
    );
  }

  function downloadScript(script: GeneratedTestScript) {
    downloadFile(
      `${safeFilename(script.test_name || script.scenario_id)}.py`,
      script.script_code,
      "text/x-python"
    );
  }

  function downloadAllScripts() {
    const bundle = scripts
      .map((script) =>
        [
          `# Scenario ID: ${script.scenario_id}`,
          `# Test name: ${script.test_name}`,
          "",
          script.script_code.trim(),
          "",
        ].join("\n")
      )
      .join("\n\n# " + "=".repeat(72) + "\n\n");

    downloadFile("nexus-validated-test-scripts.py", bundle, "text/x-python");
  }

  if (!currentRun) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Test Assets</h1>
          <p className="mt-1 text-sm text-slate-400">
            Browse approved test cases and validated Python scripts.
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-[#111c30] px-6 py-14 text-center">
          <FolderCode className="mx-auto text-slate-500" size={36} />
          <h2 className="mt-4 text-lg font-semibold text-white">No active test run</h2>
          <p className="mt-2 text-sm text-slate-400">
            Start a test run and approve its scenarios to view the generated assets here.
          </p>
        </div>
      </div>
    );
  }

  const assetsReady = scenarios.length > 0 || scripts.length > 0;
  const isWaitingForReview = currentRun.status === "waiting_for_review";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FolderCode className="text-blue-400" size={22} />
            <h1 className="text-2xl font-bold text-white">Test Assets</h1>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Approved test cases and scripts validated by the AI reviewer.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Run ID: <span className="font-mono text-slate-400">{currentRun.thread_id}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2 text-xs text-slate-300">
            {scenarios.length} approved test cases
          </span>
          <span className="rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2 text-xs text-slate-300">
            {scripts.length} validated scripts
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-[#111c30] p-5">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
              <FileJson size={20} />
            </div>
            <span className="text-xs text-slate-500">Human-approved</span>
          </div>
          <p className="mt-4 text-2xl font-bold text-white">{scenarios.length}</p>
          <p className="mt-1 text-sm text-slate-400">Approved test cases</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#111c30] p-5">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <FileCode2 size={20} />
            </div>
            <span className="text-xs text-slate-500">Validation status: valid</span>
          </div>
          <p className="mt-4 text-2xl font-bold text-white">{scripts.length}</p>
          <p className="mt-1 text-sm text-slate-400">Validated Python scripts</p>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-800 bg-[#111c30]">
        <div className="flex flex-col gap-3 border-b border-slate-800 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setActiveTab("scenarios");
                setSearch("");
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "scenarios"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              Approved Test Cases
            </button>
            <button
              onClick={() => {
                setActiveTab("scripts");
                setSearch("");
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "scripts"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              Validated Scripts
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-48 flex-1 sm:flex-none">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={activeTab === "scenarios" ? "Search test cases..." : "Search scripts..."}
                className="w-full rounded-lg border border-slate-700 bg-[#0b1120] py-2 pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500 sm:w-64"
              />
            </div>
            {activeTab === "scenarios" ? (
              <button
                onClick={downloadAllScenarios}
                disabled={!scenarios.length}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Download size={14} /> Download all JSON
              </button>
            ) : (
              <button
                onClick={downloadAllScripts}
                disabled={!scripts.length}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Download size={14} /> Download all .py
              </button>
            )}
          </div>
        </div>

        {activeTab === "scenarios" ? (
          <div className="divide-y divide-slate-800">
            {filteredScenarios.length ? (
              filteredScenarios.map((scenario) => (
                <div key={scenario.scenario_id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-blue-300">{scenario.scenario_id}</span>
                      <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-400">
                        Approved
                      </span>
                      <span className="rounded-full bg-slate-800 px-2 py-1 text-[11px] text-slate-300">
                        {scenario.scenario_type.replace("_", " ")}
                      </span>
                      {scenario.is_assumption && (
                        <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[11px] text-amber-300">
                          Assumption
                        </span>
                      )}
                    </div>
                    <h3 className="mt-2 truncate text-sm font-semibold text-white">{scenario.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">
                      {scenario.expected_result}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => setSelectedScenario(scenario)}
                      className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800"
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => downloadScenario(scenario)}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600/15 px-3 py-2 text-xs font-medium text-blue-300 hover:bg-blue-600/25"
                    >
                      <Download size={14} /> Download
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                loading={currentRun.status === "running" && !scenarios.length}
                title={isWaitingForReview ? "Awaiting scenario approval" : "No approved test cases yet"}
                message={
                  isWaitingForReview
                    ? "Review the generated scenarios first. Approved scenarios will appear here after submission."
                    : "Approved scenarios will appear here once the review step is submitted."
                }
              />
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredScripts.length ? (
              filteredScripts.map((script) => (
                <div key={script.scenario_id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-blue-300">{script.scenario_id}</span>
                      <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-400">
                        Validated
                      </span>
                      <span className="rounded-full bg-slate-800 px-2 py-1 text-[11px] text-slate-300">
                        Python / Pytest
                      </span>
                    </div>
                    <h3 className="mt-2 truncate text-sm font-semibold text-white">{script.test_name}</h3>
                    <p className="mt-1 text-xs text-slate-400">
                      {script.dependencies.length
                        ? `Dependencies: ${script.dependencies.join(", ")}`
                        : "No additional dependencies listed"}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => setSelectedScript(script)}
                      className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800"
                    >
                      Preview code
                    </button>
                    <button
                      onClick={() => downloadScript(script)}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600/15 px-3 py-2 text-xs font-medium text-blue-300 hover:bg-blue-600/25"
                    >
                      <Download size={14} /> .py
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                loading={currentRun.status === "running" && scenarios.length > 0 && !scripts.length}
                title="No validated scripts yet"
                message="Scripts will appear here after the script-validation node completes successfully."
              />
            )}
          </div>
        )}
      </section>

      {refreshError && (
        <p className="text-xs text-amber-300">{refreshError}</p>
      )}

      {!assetsReady && currentRun.status === "running" && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Loader2 size={14} className="animate-spin" />
          Waiting for approved assets from the active LangGraph run...
        </div>
      )}

      {selectedScenario && (
        <PreviewModal
          title={selectedScenario.title}
          subtitle={`${selectedScenario.scenario_id} · ${selectedScenario.scenario_type}`}
          onClose={() => setSelectedScenario(null)}
        >
          <div className="space-y-4 text-sm">
            <Detail label="Expected result" value={selectedScenario.expected_result} />
            <Detail label="Assumption" value={selectedScenario.is_assumption ? "Yes" : "No"} />
            <pre className="overflow-x-auto rounded-lg border border-slate-800 bg-[#080e1b] p-4 text-xs text-slate-300">
              {JSON.stringify(selectedScenario, null, 2)}
            </pre>
          </div>
        </PreviewModal>
      )}

      {selectedScript && (
        <PreviewModal
          title={selectedScript.test_name}
          subtitle={`${selectedScript.scenario_id} · Python / Pytest`}
          onClose={() => setSelectedScript(null)}
          action={
            <button
              onClick={() => downloadScript(selectedScript)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-500"
            >
              <Download size={14} /> Download .py
            </button>
          }
        >
          <div className="space-y-3">
            <p className="text-xs text-slate-400">
              Dependencies: {selectedScript.dependencies.length ? selectedScript.dependencies.join(", ") : "None listed"}
            </p>
            <pre className="max-h-[60vh] overflow-auto rounded-lg border border-slate-800 bg-[#080e1b] p-4 text-xs leading-5 text-emerald-200">
              <code>{selectedScript.script_code}</code>
            </pre>
          </div>
        </PreviewModal>
      )}
    </div>
  );
}

function EmptyState({
  loading,
  title,
  message,
}: {
  loading: boolean;
  title: string;
  message: string;
}) {
  return (
    <div className="px-6 py-14 text-center">
      {loading ? (
        <Loader2 size={28} className="mx-auto animate-spin text-blue-400" />
      ) : (
        <FileText size={28} className="mx-auto text-slate-600" />
      )}
      <h3 className="mt-3 text-sm font-semibold text-white">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-400">{message}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-200">{value}</p>
    </div>
  );
}

function PreviewModal({
  title,
  subtitle,
  onClose,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  action?: React.ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-xl border border-slate-700 bg-[#111c30] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 p-5">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-white">{title}</h2>
            <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {action}
            <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Close preview">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="max-h-[calc(90vh-85px)] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export default TestAssets;
