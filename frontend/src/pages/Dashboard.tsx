
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Workflow,
  ArrowUpRight,
  Plus,
} from "lucide-react";

import { useEffect, useState } from "react";
import { checkBackendHealth } from "../services/api";

const stats = [
  {
    label: "Total Test Runs",
    value: "24",
    detail: "Illustrative data",
    icon: Activity,
    color: "text-blue-400",
  },
  {
    label: "Tests Passed",
    value: "186",
    detail: "92.1% pass rate",
    icon: CheckCircle2,
    color: "text-emerald-400",
  },
  {
    label: "Tests Failed",
    value: "11",
    detail: "Require investigation",
    icon: AlertTriangle,
    color: "text-rose-400",
  },
  {
    label: "Human Reviews",
    value: "3",
    detail: "Awaiting approval",
    icon: Clock3,
    color: "text-amber-400",
  },
];

const agents = [
  ["Jira Analysis", "Requirements analyzed", "completed"],
  ["API Discovery", "API contract retrieved", "completed"],
  ["Scenario Generation", "Test scenarios generated", "completed"],
  ["Human Review", "Awaiting tester approval", "waiting"],
  ["Script Generation", "Waiting for approval", "pending"],
  ["Script Validation", "Not started", "pending"],
  ["Test Execution", "Not started", "pending"],
  ["Failure Analysis", "Not started", "pending"],
  ["Report Generation", "Not started", "pending"],
];

const recentRuns = [
  {
    id: "TASK-102",
    title: "Create a new task",
    endpoint: "POST /tasks",
    passed: 7,
    failed: 1,
    status: "Completed",
  },
  {
    id: "TASK-103",
    title: "Retrieve all tasks",
    endpoint: "GET /tasks",
    passed: 3,
    failed: 2,
    status: "Completed",
  },
];

type BackendHealth = {
  status: string;
  application: string;
  message: string;
};

function Dashboard() {
    const [backendStatus, setBackendStatus] = useState<
  "checking" | "connected" | "disconnected"
>("checking");

useEffect(() => {
  checkBackendHealth()
    .then((data: BackendHealth) => {
      setBackendStatus(
        data.status === "healthy" ? "connected" : "disconnected"
      );
    })
    .catch(() => {
      setBackendStatus("disconnected");
    });
}, []);
  return (
    <div className="space-y-8">
    <div className="mb-6 flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900 p-4">
  <span
    className={`h-3 w-3 rounded-full ${
      backendStatus === "connected"
        ? "bg-green-500"
        : backendStatus === "disconnected"
        ? "bg-red-500"
        : "bg-yellow-500"
    }`}
  />

  <div>
    <p className="text-sm font-medium text-white">
      Backend API:{" "}
      {backendStatus === "connected"
        ? "Connected"
        : backendStatus === "disconnected"
        ? "Disconnected"
        : "Checking..."}
    </p>
    <p className="text-xs text-slate-400">
      FastAPI server connection status
    </p>
  </div>
</div>
      {/* Welcome Section */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-blue-400">
            AI QUALITY ENGINEERING
          </p>

          <h2 className="mt-1 text-2xl font-bold md:text-3xl">
            Welcome to NEXUS AI
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Intelligent API testing, from Jira requirements to actionable reports.
          </p>
        </div>

        <button className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500">
          <Plus size={18} />
          Start New AI Test
        </button>
      </section>
   
      {/* Metrics */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="rounded-xl border border-slate-800 bg-[#111c30] p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">
                  {stat.label}
                </p>

                <Icon size={21} className={stat.color} />
              </div>

              <h3 className="mt-4 text-3xl font-bold">
                {stat.value}
              </h3>

              <p className={`mt-2 text-xs ${stat.color}`}>
                {stat.detail}
              </p>
            </div>
          );
        })}
      </section>

      {/* Workflow and Platform Information */}
      <section className="grid gap-6 xl:grid-cols-5">

        <div className="rounded-xl border border-slate-800 bg-[#111c30] p-5 xl:col-span-3">
          <div className="mb-6">
            <h3 className="font-semibold">Agent Workflow</h3>
            <p className="mt-1 text-xs text-slate-400">
              Autonomous testing pipeline overview
            </p>
          </div>

          <div className="space-y-4">
            {agents.map(([name, detail, status]) => (
              <div key={name} className="flex items-center gap-3">

                {status === "completed" ? (
                  <CheckCircle2 size={19} className="text-emerald-400" />
                ) : status === "waiting" ? (
                  <Clock3 size={19} className="text-amber-400" />
                ) : (
                  <div className="h-[18px] w-[18px] rounded-full border border-slate-600" />
                )}

                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-200">
                    {name}
                  </p>

                  <p className="text-xs text-slate-500">
                    {detail}
                  </p>
                </div>

                <span
                  className={`text-xs ${
                    status === "completed"
                      ? "text-emerald-400"
                      : status === "waiting"
                      ? "text-amber-400"
                      : "text-slate-600"
                  }`}
                >
                  {status === "completed"
                    ? "Done"
                    : status === "waiting"
                    ? "Waiting"
                    : "Pending"}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-slate-800 pt-4">
            <a
              href="/workflow"
              className="flex items-center justify-between text-sm text-blue-400 hover:text-blue-300"
            >
              View complete workflow
              <ArrowUpRight size={17} />
            </a>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#111c30] p-5 xl:col-span-2">
          <h3 className="font-semibold">Platform Architecture</h3>

          <p className="mt-1 text-xs text-slate-400">
            Core components of the testing platform
          </p>

          <div className="mt-6 space-y-5">
            {[
              "LangGraph Orchestration",
              "AI Agent Engine",
              "Pytest Execution Engine",
              "Failure Analysis",
              "HTML Reporting Engine",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <Workflow size={18} className="text-blue-400" />
                <span className="text-sm text-slate-300">{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-7 rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
            <p className="text-sm font-medium text-blue-300">
              Autonomous Quality Engineering
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              Coordinating requirement analysis, test generation,
              validation, execution and failure diagnosis.
            </p>
          </div>
        </div>
      </section>

      {/* Recent Testing Runs */}
      <section className="rounded-xl border border-slate-800 bg-[#111c30] p-5">
        <div className="mb-5">
          <h3 className="font-semibold">Recent Testing Runs</h3>

          <p className="mt-1 text-xs text-slate-400">
            Jira-based API testing activities
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-500">
                <th className="pb-3">JIRA STORY</th>
                <th className="pb-3">API ENDPOINT</th>
                <th className="pb-3">PASSED</th>
                <th className="pb-3">FAILED</th>
                <th className="pb-3">STATUS</th>
              </tr>
            </thead>

            <tbody>
              {recentRuns.map((run) => (
                <tr
                  key={run.id}
                  className="border-b border-slate-800/70 last:border-0"
                >
                  <td className="py-4">
                    <p className="font-medium text-slate-200">
                      {run.id}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {run.title}
                    </p>
                  </td>

                  <td className="py-4 font-mono text-xs text-blue-300">
                    {run.endpoint}
                  </td>

                  <td className="py-4 text-emerald-400">
                    {run.passed}
                  </td>

                  <td className="py-4 text-rose-400">
                    {run.failed}
                  </td>

                  <td className="py-4 text-xs text-slate-300">
                    {run.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="border-t border-slate-800 pt-5 text-xs text-slate-500">
        NEXUS AI · Autonomous API Testing Platform · POC
      </p>

    </div>
  );
}

export default Dashboard;
