import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, ChevronDown, Camera, Mic, CheckCircle } from 'lucide-react';
import Header from '../components/Header';
import './LogViolationScreen.css';

const LogViolationScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [violationType, setViolationType] = useState('');
  
  // Handlers for mock fast-chips
  const handleChipSelect = (type: string) => {
    setViolationType(type);
  };

  return (
    <div className="page-container log-violation-screen animate-fade-in">
      <Header 
        title="Log Violation" 
        showBack={true} 
        rightAction={<div className="help-icon">?</div>}
      />

      <div className="log-content">
        <div className="student-summary-card">
          <div className="avatar-wrapper-small">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah&backgroundColor=6366f1" alt="Student Avatar" />
            <div className="status-indicator online"></div>
          </div>
          <h2 className="summary-name">Sarah Jenkins</h2>
          <div className="summary-id">ID: {id || 'STU-2024-889'}</div>
          
          <div className="summary-badges">
            <span className="badge-pill">Grade 11</span>
            <span className="badge-pill">Section B</span>
          </div>
          
          <div className="summary-stats">
            <div className="stat-column">
              <div className="stat-label">STATUS</div>
              <div className="stat-value text-accent-green font-semibold">Good Standing</div>
            </div>
            <div className="stat-column">
              <div className="stat-label">PRIOR OFFENSES</div>
              <div className="stat-value text-secondary">2 (Minor)</div>
            </div>
          </div>
        </div>

        <form className="violation-form" onSubmit={(e) => { e.preventDefault(); navigate(`/profile/${id||'STU-2024-889'}`); }}>
          <div className="form-group">
            <label className="form-label">Violation Type</label>
            <div className="select-wrapper">
              <select 
                className="input-field select-field"
                value={violationType}
                onChange={(e) => setViolationType(e.target.value)}
              >
                <option value="" disabled>Select a violation...</option>
                <option value="Uniform">Improper Uniform</option>
                <option value="No ID">No ID Card</option>
                <option value="Late">Late Arrival</option>
                <option value="Other">Other...</option>
              </select>
              <ChevronDown className="select-icon" size={20} />
            </div>
            
            <div className="quick-chips">
              <button type="button" className={`chip ${violationType === 'Uniform' ? 'active' : ''}`} onClick={() => handleChipSelect('Uniform')}>Uniform</button>
              <button type="button" className={`chip ${violationType === 'No ID' ? 'active' : ''}`} onClick={() => handleChipSelect('No ID')}>No ID</button>
              <button type="button" className={`chip ${violationType === 'Late' ? 'active' : ''}`} onClick={() => handleChipSelect('Late')}>Late</button>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label">DATE</label>
              <div className="input-with-icon">
                <CalendarIcon size={18} className="input-icon" />
                <input type="text" className="input-field" defaultValue="Oct 24, 2023" />
              </div>
            </div>
            <div className="form-group flex-1">
              <label className="form-label">TIME</label>
              <div className="input-with-icon">
                <Clock size={18} className="input-icon" />
                <input type="text" className="input-field" defaultValue="09:42 AM" />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Administrator Remarks</label>
            <div className="textarea-wrapper">
              <textarea 
                className="input-field remarks-field" 
                placeholder="Add specific details about the incident..."
                rows={4}
              ></textarea>
              <div className="textarea-actions">
                <button type="button" className="action-btn"><Camera size={18} /></button>
                <button type="button" className="action-btn"><Mic size={18} /></button>
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary submit-btn">
            <CheckCircle size={20} />
            Submit Violation
          </button>
          
          <div className="submit-disclaimer">
            This action will be logged in the student's permanent record.
          </div>
        </form>
      </div>
    </div>
  );
};

export default LogViolationScreen;
