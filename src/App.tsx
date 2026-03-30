import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ScanScreen from './pages/ScanScreen';
import ProfileScreen from './pages/ProfileScreen';
import ManualSearchScreen from './pages/ManualSearchScreen';
import LogViolationScreen from './pages/LogViolationScreen';
import BottomNavigation from './components/BottomNavigation';
import './index.css';

function App() {
  return (
    <div className="app-container">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/scan" />} />
          <Route path="/scan" element={<ScanScreen />} />
          <Route path="/search" element={<ManualSearchScreen />} />
          <Route path="/profile/:id" element={<ProfileScreen />} />
          <Route path="/log-violation/:id" element={<LogViolationScreen />} />
        </Routes>
        <BottomNavigation />
      </BrowserRouter>
    </div>
  );
}

export default App;
