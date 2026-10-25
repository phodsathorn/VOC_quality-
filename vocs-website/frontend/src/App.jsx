import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import DataCollection from './pages/DataCollection';
import Alerts from './pages/Alerts';
import AirflowDiagram from './pages/AirflowDiagram';
import Settings from './pages/Settings';
import Guide from './pages/Guide';
import Maintenance from './pages/Maintenance';
import History from './pages/History';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/"                element={<Dashboard />} />
          <Route path="/history"         element={<History />} />
          <Route path="/devices"         element={<Devices />} />
          <Route path="/data-collection" element={<DataCollection />} />
          <Route path="/alerts"          element={<Alerts />} />
          <Route path="/airflow"         element={<AirflowDiagram />} />
          <Route path="/guide"           element={<Guide />} />
          <Route path="/maintenance"     element={<Maintenance />} />
          <Route path="/settings"        element={<Settings />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
