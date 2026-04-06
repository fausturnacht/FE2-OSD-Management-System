import { useState } from 'react';
import { Search, X, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import './ManualSearchScreen.css';

const MOCK_RESULTS = [
  { id: '24-09821-001', name: 'Sarah Jenkins', grade: 'GR 11', status: 'Active', statusColor: 'accent-green' },
  { id: '25-11234-092', name: 'Sarah Miller', grade: 'GR 10', status: 'Off Campus', statusColor: 'text-muted' },
  { id: '24-00001-999', name: 'Sarah Connor', label: 'SUSPENDED', status: 'Restricted', statusColor: 'accent-red' },
];

const ManualSearchScreen: React.FC = () => {
  const [searchMode, setSearchMode] = useState<'name' | 'id'>('name');
  const [query, setQuery] = useState('Sarah');
  const navigate = useNavigate();

  return (
    <div className="page-container search-screen animate-fade-in">
      <Header title="Manual Search" showBack={true} />

      <div className="search-content">
        <div className="search-toggle-container">
          <button 
            className={`toggle-btn ${searchMode === 'name' ? 'active' : ''}`}
            onClick={() => setSearchMode('name')}
          >
            By Name
          </button>
          <button 
            className={`toggle-btn ${searchMode === 'id' ? 'active' : ''}`}
            onClick={() => setSearchMode('id')}
          >
            By ID Number
          </button>
        </div>

        <div className="search-bar-wrapper">
          <Search size={20} className="text-muted search-icon-left" />
          <input 
            type="text" 
            className="search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim() && searchMode === 'id') {
                navigate(`/profile/${query.trim()}`);
              }
            }}
            placeholder={searchMode === 'name' ? 'Enter name' : 'Enter ID number'}
          />
          {query && (
            <button className="search-clear-btn" onClick={() => setQuery('')}>
              <X size={16} />
            </button>
          )}
        </div>
        <div className="search-help-text">
          Enter first or last {searchMode === 'name' ? 'name' : 'ID'} to find matches.
        </div>

        <div className="results-section">
          <h3 className="section-title">TOP MATCHES</h3>
          
          <div className="results-list">
            {MOCK_RESULTS.map((user) => (
              <div 
                key={user.id} 
                className="result-card cursor-pointer"
                onClick={() => navigate(`/profile/${user.id}`)}
              >
                <div className="result-avatar-wrapper">
                  <div className={`result-avatar ${user.label === 'SUSPENDED' ? 'bg-zinc-800' : 'bg-indigo'}`}>
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="result-status-dot" style={{ backgroundColor: `var(--${user.statusColor})` }}></div>
                </div>
                
                <div className="result-info">
                  <div className="result-name-row">
                    <span className="result-name">{user.name}</span>
                    {user.label ? (
                      <span className="badge badge-danger ml-2" style={{ padding: '0.125rem 0.375rem', fontSize: '0.6rem'}}>{user.label}</span>
                    ) : (
                      <span className="badge" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', color: 'var(--primary-color)', padding: '0.125rem 0.375rem', fontSize: '0.6rem'}}>{user.grade}</span>
                    )}
                  </div>
                  <div className="text-secondary text-xs mb-1">ID: {user.id}</div>
                  <div className="text-xs" style={{ color: `var(--${user.statusColor})` }}>
                    ● {user.status}
                  </div>
                </div>
                
                <ChevronRight className="text-muted" size={20} />
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <button 
        className="fab-search"
        onClick={() => {
          if (query.trim() && searchMode === 'id') {
            navigate(`/profile/${query.trim()}`);
          } else {
             // For now, in name mode, do nothing or show a toast message (since name search lookup isn't in scope yet)
             console.log("Name search not yet fully implemented");
          }
        }}
      >
        <Search size={24} />
      </button>
    </div>
  );
};

export default ManualSearchScreen;
