import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Telemetry } from "./pages/Telemetry";
import { ProcessTree } from "./pages/ProcessTree";
import { Detection } from "./pages/Detection";
import { Response } from "./pages/Response";

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/telemetry" element={<Telemetry />} />
          <Route path="/process-tree" element={<ProcessTree />} />
          <Route path="/detection" element={<Detection />} />
          <Route path="/response" element={<Response />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
