import React from 'react';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ title, rightAction }) => {

  return (
    <header className="flex items-center justify-between px-5 h-16 bg-transparent text-text-primary z-40">
      <div className="flex items-center w-10">
        {/* Back button removed per user request */}
      </div>
      <h1 className="flex-1 text-center text-lg font-semibold tracking-tight">{title}</h1>
      <div className="flex items-center w-10 justify-end">
        {rightAction}
      </div>
    </header>
  );
};

export default Header;
