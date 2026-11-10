
import { useState } from "react";
import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  ClipboardList,
  BarChart3,
 
} from "lucide-react";

import { useTestRun } from "../context/TestRunContext";

type Tab = "execution" | "technical" | "stakeholder";

function Execution() {
  const { currentRun } = useTestRun();
  const [activeTab, setActiveTab] = useState<Tab>("execution");

  const results = currentRun?.execution_results ?? [];
  const failures = currentRun?.failure_analyses ?? [];
  const technicalReport = currentRun?.technical_report;
  const stakeholderReport = currentRun?.stakeholder_report;

  const tabs: {
    id: Tab;
    label: string;
    icon: typeof Activity;
  }[] = [
    { id: "execution", label: "Execution Results", icon: Activity },
    { id: "technical", label: "Technical Report", icon: FileText },
    { id: "stakeholder", label: "Stakeholder Report", icon: ShieldCheck },
  ];

  if (!currentRun) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <EmptyState message="Start a testing workflow and approve the generated scenarios. Execution results and reports will appear here after the workflow completes." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader />

      {/* Run Information */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/50 px-5 py-3">
        <div>
          <p className="text-xs text-slate-500">Current Test Run</p>
          <p className="mt-1 text-sm text-slate-300">
            {currentRun.thread_id}
          </p>
        </div>

        <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium capitalize text-emerald-400">
          {currentRun.status.replaceAll("_", " ")}
        </span>
      </div>

      {/* Report Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "border border-blue-400/20 bg-blue-400/10 text-blue-400"
                  : "border border-transparent text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon size={17} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "execution" && (
        <ExecutionResults
          results={results}
          failures={failures}
        />
      )}

      {activeTab === "technical" && (
        technicalReport ? (
          <TechnicalReportView report={technicalReport} />
        ) : (
          <EmptyState message="The technical report is not available for this run." />
        )
      )}

      {activeTab === "stakeholder" && (
        stakeholderReport ? (
          <StakeholderReportView report={stakeholderReport} />
        ) : (
          <EmptyState message="The stakeholder report is not available for this run." />
        )
      )}
    </div>
  );
}

/* --------------------------------------------------
   PAGE HEADER
-------------------------------------------------- */

function PageHeader() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">
        Execution & Reports
      </h1>
      <p className="mt-1 text-sm text-slate-400">
        Test execution results, technical insights, and stakeholder assessment.
      </p>
    </div>
  );
}

/* --------------------------------------------------
   EXECUTION RESULTS TAB
-------------------------------------------------- */

function ExecutionResults({
  results,
  failures,
}: {
  results: NonNullable<
    ReturnType<typeof useTestRun>["currentRun"]
  >["execution_results"];
  failures: NonNullable<
    ReturnType<typeof useTestRun>["currentRun"]
  >["failure_analyses"];
}) {
  const testResults = results ?? [];
  const failureRecords = failures ?? [];

  if (testResults.length === 0) {
    return (
      <EmptyState message="No execution results are available for this run." />
    );
  }

  const metrics = [
    {
      label: "Total Tests",
      value: testResults.length,
      icon: Activity,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      label: "Passed",
      value: testResults.filter((r) => r.status === "passed").length,
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
    },
    {
      label: "Failed",
      value: testResults.filter((r) => r.status === "failed").length,
      icon: XCircle,
      color: "text-red-400",
      bg: "bg-red-400/10",
    },
    {
      label: "Errors",
      value: testResults.filter((r) => r.status === "error").length,
      icon: AlertCircle,
      color: "text-orange-400",
      bg: "bg-orange-400/10",
    },
    {
      label: "Skipped",
      value: testResults.filter((r) => r.status === "skipped").length,
      icon: Clock,
      color: "text-slate-400",
      bg: "bg-slate-400/10",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Metrics */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 size={19} className="text-blue-400" />
          <h2 className="text-lg font-semibold text-white">
            Execution Overview
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {metrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <div
                key={metric.label}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">
                    {metric.label}
                  </span>
                  <div className={`rounded-lg p-2 ${metric.bg}`}>
                    <Icon size={18} className={metric.color} />
                  </div>
                </div>

                <p className="mt-4 text-3xl font-semibold text-white">
                  {metric.value}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Test Execution Table */}
      <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
        <div className="border-b border-slate-800 p-5">
          <h2 className="font-semibold text-white">
            Test Execution Results
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Individual scenario execution outcomes.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4 font-medium">Test Name</th>
                <th className="px-5 py-4 font-medium">Scenario ID</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium">Duration</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800">
              {testResults.map((result) => (
                <tr key={result.scenario_id} className="text-slate-300">
                  <td className="max-w-sm px-5 py-4 font-medium text-white">
                    {result.test_name}
                  </td>
                  <td className="px-5 py-4 text-slate-400">
                    {result.scenario_id}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={result.status} />
                  </td>
                  <td className="px-5 py-4 tabular-nums">
                    {result.execution_time.toFixed(2)}s
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Failure Analysis */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">
            AI Failure Analysis
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Root-cause analysis and remediation recommendations.
          </p>
        </div>

        {failureRecords.length === 0 ? (
          <EmptyState message="No failure analysis records are available for this run." />
        ) : (
          failureRecords.map((failure) => (
            <div
              key={failure.scenario_id}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-white">
                    Scenario: {failure.scenario_id}
                  </p>
                  <p className="mt-1 text-xs capitalize text-slate-400">
                    {formatLabel(failure.failure_type)}
                  </p>
                </div>

                <span className="rounded-full bg-blue-400/10 px-3 py-1 text-xs capitalize text-blue-400">
                  {failure.confidence} confidence
                </span>
              </div>

              <div className="mt-5 space-y-4">
                <DetailBlock
                  icon={<AlertTriangle size={15} className="text-orange-400" />}
                  title="Root Cause"
                  content={failure.root_cause}
                />

                <div>
                  <h3 className="mb-2 text-sm font-medium text-slate-300">
                    Evidence
                  </h3>
                  <BulletList items={failure.evidence} />
                </div>

                <DetailBlock
                  icon={<Lightbulb size={15} className="text-yellow-400" />}
                  title="Recommended Remediation"
                  content={failure.remediation}
                />

                {failure.needs_human_review && (
                  <p className="text-xs font-medium text-orange-400">
                    Human review required
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

/* --------------------------------------------------
   TECHNICAL REPORT TAB
-------------------------------------------------- */

function TechnicalReportView({
  report,
}: {
  report: NonNullable<
    ReturnType<typeof useTestRun>["currentRun"]
  >["technical_report"];
}) {
  if (!report) return null;

  const stats = [
    { label: "Total Tests", value: report.total_tests, color: "text-white" },
    { label: "Passed", value: report.passed_tests, color: "text-emerald-400" },
    { label: "Failed", value: report.failed_tests, color: "text-red-400" },
    { label: "Errors", value: report.errored_tests, color: "text-orange-400" },
    { label: "Skipped", value: report.skipped_tests, color: "text-slate-400" },
  ];

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <ReportHeader
        icon={<FileText size={22} className="text-blue-400" />}
        title={report.report_title}
        storyId={report.story_id}
        summary={report.story_summary}
        status={report.overall_status}
      />

      {/* Execution Summary */}
      <ReportSection title="Execution Summary">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-slate-700 bg-slate-950/40 p-4"
            >
              <p className="text-xs text-slate-400">{stat.label}</p>
              <p className={`mt-2 text-2xl font-semibold ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </ReportSection>

      {/* Test Case Details */}
      <ReportSection title="Test Case Execution Details">
        {report.test_case_reports.length === 0 ? (
          <p className="text-sm text-slate-400">
            No test execution results available.
          </p>
        ) : (
          <div className="space-y-4">
            {report.test_case_reports.map((test) => (
              <div
                key={test.scenario_id}
                className="rounded-lg border border-slate-700 bg-slate-950/30 p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-medium text-white">
                    {test.scenario_id} — {test.test_name}
                  </h3>
                  <StatusBadge status={test.status} />
                </div>

                <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-500">Execution Time</p>
                    <p className="mt-1 text-slate-300">
                      {test.execution_time.toFixed(2)} seconds
                    </p>
                  </div>

                  {test.failure_type && (
                    <div>
                      <p className="text-xs text-slate-500">Failure Type</p>
                      <p className="mt-1 capitalize text-slate-300">
                        {formatLabel(test.failure_type)}
                      </p>
                    </div>
                  )}
                </div>

                {test.root_cause && (
                  <DetailBlock
                    title="Root Cause"
                    content={test.root_cause}
                  />
                )}

                {test.evidence.length > 0 && (
                  <div className="mt-4">
                    <h4 className="mb-2 text-sm font-medium text-slate-300">
                      Supporting Evidence
                    </h4>
                    <div className="rounded-lg bg-slate-900 p-4">
                      <BulletList items={test.evidence} />
                    </div>
                  </div>
                )}

                {test.remediation && (
                  <DetailBlock
                    icon={<Lightbulb size={15} className="text-yellow-400" />}
                    title="Recommended Remediation"
                    content={test.remediation}
                  />
                )}

                <div className="mt-4 border-t border-slate-800 pt-3 text-sm">
                  <span className="text-slate-400">Human Review: </span>
                  {test.needs_human_review ? (
                    <span className="font-medium text-orange-400">
                      Required
                    </span>
                  ) : (
                    <span className="font-medium text-emerald-400">
                      Not Required
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ReportSection>

      {/* Technical Findings */}
      <ReportSection title="Technical Findings">
        <BulletList items={report.technical_findings} />
      </ReportSection>

      {/* Unresolved Issues */}
      <ReportSection title="Unresolved Issues">
        <BulletList items={report.unresolved_issues} />
      </ReportSection>

      {/* Recommended Actions */}
      <ReportSection title="Recommended Actions">
        <BulletList items={report.recommended_actions} />
      </ReportSection>

      {/* Conclusion */}
      <ReportSection title="Overall Conclusion">
        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-400/10 p-5">
          <p className="text-sm leading-7 text-slate-300">
            {report.conclusion}
          </p>
        </div>

        <div className="mt-4">
          <span className="text-sm text-slate-400">
            Human Review Required:{" "}
          </span>
          {report.human_review_required ? (
            <span className="text-sm font-medium text-orange-400">Yes</span>
          ) : (
            <span className="text-sm font-medium text-emerald-400">No</span>
          )}
        </div>
      </ReportSection>

      <ReportFooter />
    </div>
  );
}

/* --------------------------------------------------
   STAKEHOLDER REPORT TAB
-------------------------------------------------- */

function StakeholderReportView({
  report,
}: {
  report: NonNullable<
    ReturnType<typeof useTestRun>["currentRun"]
  >["stakeholder_report"];
}) {
  if (!report) return null;

  const stats = [
    { label: "Total Tests", value: report.total_tests, color: "text-white" },
    { label: "Passed", value: report.passed_tests, color: "text-emerald-400" },
    { label: "Failed", value: report.failed_tests, color: "text-red-400" },
    { label: "Errors", value: report.errored_tests, color: "text-orange-400" },
    { label: "Skipped", value: report.skipped_tests, color: "text-slate-400" },
  ];

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <ReportHeader
        icon={<ShieldCheck size={22} className="text-emerald-400" />}
        title={report.report_title}
        storyId={report.story_id}
        summary={report.feature_summary}
        status={report.overall_status}
      />

      {/* Executive Summary */}
      <ReportSection title="Executive Summary">
        <p className="text-sm leading-7 text-slate-300">
          {report.executive_summary}
        </p>
      </ReportSection>

      {/* Testing Overview */}
      <ReportSection title="Testing Overview">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-slate-700 bg-slate-950/40 p-4"
            >
              <p className="text-xs text-slate-400">{stat.label}</p>
              <p className={`mt-2 text-2xl font-semibold ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </ReportSection>

      {/* Quality Assessment */}
      <ReportSection title="Quality Assessment">
        <p className="text-sm leading-7 text-slate-300">
          {report.quality_assessment}
        </p>
      </ReportSection>

      {/* Key Findings */}
      <ReportSection title="Key Findings">
        <FindingList items={report.key_findings} />
      </ReportSection>

      {/* Business Risks */}
      <ReportSection title="Business Risks">
        {report.business_risks.length === 0 ? (
          <EmptyListMessage message="No business risks reported." />
        ) : (
          <div className="space-y-3">
            {report.business_risks.map((risk, index) => (
              <div
                key={index}
                className="rounded-lg border-l-4 border-orange-400 bg-orange-400/10 p-4"
              >
                <p className="text-sm leading-6 text-slate-300">{risk}</p>
              </div>
            ))}
          </div>
        )}
      </ReportSection>

      {/* Outstanding Actions */}
      <ReportSection title="Outstanding Actions">
        <BulletList items={report.outstanding_actions} />
      </ReportSection>

      {/* Release Recommendation */}
      <ReportSection title="Release Recommendation">
        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-400/10 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-blue-400">
            Recommendation
          </p>

          <h3 className="mt-2 text-xl font-semibold capitalize text-white">
            {formatLabel(report.release_recommendation)}
          </h3>

          <p className="mt-3 text-sm leading-7 text-slate-300">
            {report.final_recommendation}
          </p>
        </div>
      </ReportSection>

      <ReportFooter />
    </div>
  );
}

/* --------------------------------------------------
   SHARED REPORT COMPONENTS
-------------------------------------------------- */

function ReportHeader({
  icon,
  title,
  storyId,
  summary,
  status,
}: {
  icon: React.ReactNode;
  title: string;
  storyId: string;
  summary: string;
  status: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-900/60 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-slate-800 p-3">{icon}</div>
          <div>
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            <p className="mt-1 text-xs text-slate-400">
              NEXUS AI Generated Report
            </p>
          </div>
        </div>

        <StatusBadge status={status} />
      </div>

      <div className="mt-6 grid gap-4 border-t border-slate-800 pt-5 sm:grid-cols-2">
        <div>
          <p className="text-xs text-slate-500">Jira Story</p>
          <p className="mt-1 font-medium text-slate-200">{storyId}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Feature</p>
          <p className="mt-1 text-sm text-slate-300">{summary}</p>
        </div>
      </div>
    </div>
  );
}

function ReportSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
      <h2 className="mb-5 border-b border-slate-800 pb-3 text-base font-semibold text-white">
        {title}
      </h2>
      {children}
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    passed: "bg-emerald-400/10 text-emerald-400",
    failed: "bg-red-400/10 text-red-400",
    error: "bg-orange-400/10 text-orange-400",
    skipped: "bg-slate-400/10 text-slate-400",
    completed: "bg-emerald-400/10 text-emerald-400",
    ready: "bg-emerald-400/10 text-emerald-400",
    ready_with_observations: "bg-blue-400/10 text-blue-400",
    not_ready: "bg-red-400/10 text-red-400",
    requires_further_testing: "bg-orange-400/10 text-orange-400",
    partially_passed: "bg-orange-400/10 text-orange-400",
    inconclusive: "bg-slate-400/10 text-slate-400",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
        styles[status] ?? "bg-slate-400/10 text-slate-400"
      }`}
    >
      {formatLabel(status)}
    </span>
  );
}

function DetailBlock({
  icon,
  title,
  content,
}: {
  icon?: React.ReactNode;
  title: string;
  content: string;
}) {
  return (
    <div className="mt-4">
      <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
        {icon}
        {title}
      </h4>
      <p className="text-sm leading-6 text-slate-400">{content}</p>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <EmptyListMessage message="No information reported." />;
  }

  return (
    <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-slate-400">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

function FindingList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <EmptyListMessage message="No key findings reported." />;
  }

  return (
    <div className="space-y-3">
      {items.map((finding, index) => (
        <div
          key={index}
          className="rounded-lg border-l-4 border-slate-500 bg-slate-950/40 p-4"
        >
          <p className="text-sm leading-6 text-slate-300">{finding}</p>
        </div>
      ))}
    </div>
  );
}

function EmptyListMessage({ message }: { message: string }) {
  return <p className="text-sm text-slate-500">{message}</p>;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50 px-6 text-center">
      <ClipboardList size={40} className="mb-4 text-slate-600" />
      <p className="max-w-md text-sm leading-6 text-slate-400">{message}</p>
    </div>
  );
}

function ReportFooter() {
  return (
    <div className="border-t border-slate-800 py-5 text-center">
      <p className="text-xs text-slate-500">
        Generated by NEXUS AI — Autonomous API Testing Platform
      </p>
      <p className="mt-1 text-xs text-slate-600">
        Automated assessment. Not a formal release approval.
      </p>
    </div>
  );
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

export default Execution;
