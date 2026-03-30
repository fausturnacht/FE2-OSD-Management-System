import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ title, showBack = false, rightAction }) => {
  const navigate = useNavigate();

  return (
    <header className="app-header">
      <div className="header-left">
        {showBack && (
          <button className="back-btn" onClick={() => navigate(-1)} aria-label="Go back">
            <ArrowLeft size={24} />
          </button>
        )}
      </div>
      <h1 className="header-title">{title}</h1>
      <div className="header-right">
        {rightAction}
      </div>
    </header>
  );
};

export default Header;
