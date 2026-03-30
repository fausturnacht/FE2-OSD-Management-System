import { NavLink } from 'react-router-dom';
import { QrCode, Search, Clock, Settings } from 'lucide-react';
import './BottomNavigation.css';

const BottomNavigation: React.FC = () => {
  return (
    <nav className="bottom-nav">
      <NavLink 
        to="/scan" 
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <QrCode size={24} />
        <span>Scan</span>
      </NavLink>
      <NavLink 
        to="/search" 
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <Search size={24} />
        <span>Manual</span>
      </NavLink>
      <NavLink 
        to="/history" 
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <Clock size={24} />
        <span>History</span>
      </NavLink>
      <NavLink 
        to="/settings" 
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <Settings size={24} />
        <span>Settings</span>
      </NavLink>
    </nav>
  );
};

export default BottomNavigation;
