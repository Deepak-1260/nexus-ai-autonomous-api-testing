
import { Outlet, useLocation } from "react-router-dom";

import SideBar from "../components/SideBar";
import Header from "../components/Header";

const pageDetails: Record<string, { title: string; description: string }> = {
  "/": {
    title: "Command Center",
    description: "Overview of your autonomous testing platform",
  },
  "/workflow": {
    title: "Agent Workflow",
    description: "Monitor AI agents and their execution activities",
  },
  "/review": {
    title: "Review & Test Intelligence",
    description: "Review scenarios and validate generated scripts",
  },
  "/execution": {
    title: "Execution & Reports",
    description: "Explore test results, failure analysis and reports",
  },
};

function MainLayout() {
  const location = useLocation();

  const currentPage = pageDetails[location.pathname] ?? pageDetails["/"];

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-100">
      <SideBar />

      <main className="lg:pl-64">
        <Header
          title={currentPage.title}
          description={currentPage.description}
        />

        <div className="p-5 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default MainLayout;
