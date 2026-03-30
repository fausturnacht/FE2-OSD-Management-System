import { useParams, useNavigate } from 'react-router-dom';
import { TriangleAlert, BookOpen, Building2, Calendar, User, ShieldAlert, Edit2 } from 'lucide-react';
import Header from '../components/Header';
import './ProfileScreen.css';

// Mock Data
const MOCK_PROFILE = {
  id: '21-04392-MN',
  name: 'Doe, John A.',
  enrolled: true,
  status: 'CURRENT VIOLATION STATUS',
  statusDetail: 'Pending Promissory Note',
  communityServiceHours: 15,
  totalServiceHours: 40,
  course: 'BS Computer Science',
  college: 'College of Engineering',
  yearLevel: '3rd Year',
  studentType: 'Regular',
  history: [
    { type: 'Improper Uniform', date: 'Oct 24, 2023 - 08:30 AM', status: 'Warning', statusColor: 'warning' },
    { type: 'No ID Card', date: 'Sep 12, 2023 - 09:15 AM', status: 'Recorded', statusColor: 'danger' }
  ]
};

const ProfileScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const profile = MOCK_PROFILE; // Defaulting to mock

  const progressPercent = ((profile.totalServiceHours - profile.communityServiceHours) / profile.totalServiceHours) * 100;

  return (
    <div className="page-container profile-screen animate-fade-in">
      <Header 
        title="Student Profile" 
        showBack={true}
        rightAction={<span className="text-primary text-sm font-medium pr-2">Edit</span>} 
      />

      <div className="profile-header">
        <div className="avatar-wrapper">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=John&backgroundColor=242f44" alt="Student Avatar" className="profile-avatar" />
          <div className="status-indicator online"></div>
        </div>
        <h2 className="profile-name">{profile.name}</h2>
        <div className="profile-badges">
          <span className="badge badge-success">Enrolled</span>
          <span className="text-secondary text-sm">ID: {id || profile.id}</span>
        </div>
      </div>

      <div className="profile-content">
        <div className="violation-card">
          <div className="violation-header">
            <div>
              <div className="violation-label">{profile.status}</div>
              <div className="violation-title">{profile.statusDetail}</div>
            </div>
            <TriangleAlert className="text-red-500" size={24} />
          </div>
          
          <div className="service-progress">
            <div className="progress-labels">
              <span className="text-xs text-secondary">Community Service Progress</span>
              <span className="text-xs font-semibold text-primary">Remaining: {profile.communityServiceHours} hours</span>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>
        </div>

        <div className="info-grid">
          <div className="info-card">
            <BookOpen size={16} className="text-primary mb-1" />
            <div className="info-label">COURSE</div>
            <div className="info-value">{profile.course}</div>
          </div>
          <div className="info-card">
            <Building2 size={16} className="text-primary mb-1" />
            <div className="info-label">COLLEGE</div>
            <div className="info-value">{profile.college}</div>
          </div>
          <div className="info-card">
            <Calendar size={16} className="text-primary mb-1" />
            <div className="info-label">YEAR LEVEL</div>
            <div className="info-value">{profile.yearLevel}</div>
          </div>
          <div className="info-card">
            <User size={16} className="text-primary mb-1" />
            <div className="info-label">STUDENT TYPE</div>
            <div className="info-value">{profile.studentType}</div>
          </div>
        </div>

        <button 
          className="btn btn-primary w-full mt-4 flex items-center justify-center gap-2"
          onClick={() => navigate(`/log-violation/${id || profile.id}`)}
        >
          <Edit2 size={18} />
          Log New Violation
        </button>

        <div className="history-section">
          <div className="history-header flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">Violation History</h3>
            <span className="text-primary text-sm font-medium cursor-pointer">View All</span>
          </div>
          
          <div className="history-list flex-col gap-3">
            {profile.history.map((record, idx) => (
              <div key={idx} className="history-item">
                <div className={`history-icon bg-${record.statusColor}`}>
                  <ShieldAlert size={20} />
                </div>
                <div className="history-details flex-1">
                  <div className="font-semibold">{record.type}</div>
                  <div className="text-xs text-secondary">{record.date}</div>
                </div>
                <div className={`badge badge-${record.statusColor}`}>
                  {record.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
