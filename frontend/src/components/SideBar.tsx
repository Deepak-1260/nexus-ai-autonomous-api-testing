import {
  Activity,
  PlusCircle,
  BrainCircuit,
  LayoutDashboard,
  ListChecks,
  Workflow,
  Settings,
  FolderCode,
} from "lucide-react";

import { NavLink } from "react-router-dom";

const navigation = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "New Test Run", path: "/new-test-run", icon: PlusCircle },
  { name: "Pipeline Monitor", path: "/workflow", icon: Workflow },
  { name: "Review & Scenarios", path: "/review", icon: ListChecks },
  { name: "Test Assets", path: "/test-assets", icon: FolderCode },
  { name: "Execution & Reports", path: "/execution", icon: Activity },
];

function SideBar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-800 bg-[#0f172a] lg:flex">
      {/* Brand */}
      <div className="flex h-20 items-center gap-3 border-b border-slate-800 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
          <BrainCircuit size={23} />
        </div>

        <div>
          <h1 className="text-lg font-bold tracking-wide text-white">
            NEXUS AI
          </h1>
          <p className="text-xs text-slate-400">
            Autonomous API Testing
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-4 py-6">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Workspace
        </p>

        <nav className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-600/15 text-blue-400"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`
                }
              >
                <Icon size={18} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="mt-auto border-t border-slate-800 p-4">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-slate-400 hover:bg-slate-800">
          <Settings size={18} />
          Settings
        </button>

        <div className="mt-4 flex items-center gap-3 rounded-lg bg-slate-800/70 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/20 text-sm font-bold text-blue-300">
            AI
          </div>

          <div>
            <p className="text-sm font-medium text-white">
              Testing Workspace
            </p>
            <p className="text-xs text-slate-500">
              POC Environment
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default SideBar;
