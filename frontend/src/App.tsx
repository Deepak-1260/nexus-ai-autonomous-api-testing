import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TestRunProvider } from "./context/TestRunContext";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import NewTestRun from "./pages/NewTestRun";
import Workflow from "./pages/Workflow";
import Review from "./pages/Review";
import Execution from "./pages/Execution";
import TestAssets from "./pages/TestAssets";

function App() {
  return (
    <BrowserRouter>
      <TestRunProvider>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/new-test-run" element={<NewTestRun />} />
            <Route path="/workflow" element={<Workflow />} />
            <Route path="/review" element={<Review />} />
            <Route path="/test-assets" element={<TestAssets />} />
            <Route path="/execution" element={<Execution />} />
          </Route>
        </Routes>
      </TestRunProvider>
    </BrowserRouter>
  );
}

export default App;
