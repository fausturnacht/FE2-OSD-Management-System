import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import ScanScreen from './pages/ScanScreen';
import ProfileScreen from './pages/ProfileScreen';
import SearchScreen from './pages/SearchScreen';
import LogViolationScreen from './pages/LogViolationScreen';
import EditViolationScreen from './pages/EditViolationScreen';
import BottomNavigation from './components/BottomNavigation';
import './index.css';

function App() {
  return (
    <div className="w-full max-w-[480px] min-h-screen bg-[radial-gradient(circle_at_top,#1c2538_0%,var(--color-bg-app)_50%)] relative overflow-x-hidden flex flex-col pb-[80px] shadow-[0_0_40px_rgba(0,0,0,0.5)] mx-auto">
      <HashRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/scan" />} />
          <Route path="/scan" element={<ScanScreen />} />
          <Route path="/search" element={<SearchScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/profile/:id" element={<ProfileScreen />} />
          <Route path="/log-violation/:id" element={<LogViolationScreen />} />
          <Route path="/edit-violation/:violationId" element={<EditViolationScreen />} />
        </Routes>
        <BottomNavigation />
      </HashRouter>
    </div>
  );
}

export default App;
