import { NavLink } from 'react-router-dom';
import { QrCode, Users, User } from 'lucide-react';

const BottomNavigation: React.FC = () => {
  return (
    <nav className="absolute bottom-0 left-0 w-full h-[80px] bg-bg-surface border-t border-border-subtle flex justify-around items-center px-4 z-50">
      <NavLink 
        to="/scan" 
        className={({ isActive }) => `flex flex-col items-center justify-center no-underline text-xs font-medium transition-all duration-150 gap-1 w-16 hover:text-text-secondary ${isActive ? 'text-primary -translate-y-0.5 [&>svg]:text-primary [&>svg]:drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'text-text-muted'}`}
      >
        <QrCode size={24} />
        <span>Scan</span>
      </NavLink>
      <NavLink 
        to="/profile" 
        className={({ isActive }) => `flex flex-col items-center justify-center no-underline text-xs font-medium transition-all duration-150 gap-1 w-16 hover:text-text-secondary ${isActive ? 'text-primary -translate-y-0.5 [&>svg]:text-primary [&>svg]:drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'text-text-muted'}`}
      >
        <User size={24} />
        <span>Profile</span>
      </NavLink>
      <NavLink 
        to="/search" 
        className={({ isActive }) => `flex flex-col items-center justify-center no-underline text-xs font-medium transition-all duration-150 gap-1 w-16 hover:text-text-secondary ${isActive ? 'text-primary -translate-y-0.5 [&>svg]:text-primary [&>svg]:drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'text-text-muted'}`}
      >
        <Users size={24} />
        <span>Students</span>
      </NavLink>
    </nav>
  );
};

export default BottomNavigation;
