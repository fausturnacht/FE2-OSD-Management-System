import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { TriangleAlert, BookOpen, Building2, Calendar, User, ShieldAlert, Edit2, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import Header from '../components/Header';
import { supabase } from '../utils/supabaseClient';
import './ProfileScreen.css';

// We'll keep dummy data for violations and hours for now since we haven't built out the full violations fetching logic yet.
const MOCK_VIOLATION_DATA = {
  enrolled: true,
  status: 'CURRENT VIOLATION STATUS',
  statusDetail: 'Pending Promissory Note',
  communityServiceHours: 15,
  totalServiceHours: 40,
  studentType: 'Regular',
  history: [
    { type: 'Improper Uniform', date: 'Oct 24, 2023 - 08:30 AM', status: 'Warning', statusColor: 'warning' },
    { type: 'No ID Card', date: 'Sep 12, 2023 - 09:15 AM', status: 'Recorded', statusColor: 'danger' }
  ]
};

const formatYearLevel = (level: number) => {
  switch (level) {
    case 1: return '1st Year';
    case 2: return '2nd Year';
    case 3: return '3rd Year';
    case 4: return '4th Year';
    case 5: return '5th Year';
    default: return `${level}th Year`;
  }
};

const ProfileScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // Location state is preserved here just in case, but we prefer DB fetching
  const location = useLocation();
  const navigationData = location.state?.studentData;

  const [studentData, setStudentData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudent = async () => {
      setLoading(true);
      setError(null);
      
      const searchId = id || navigationData?.studentId;

      if (!searchId) {
        setError('No Student ID provided.');
        setLoading(false);
        return;
      }

      try {
        const { data, error: dbError } = await supabase
          .from('students')
          .select('*')
          .eq('student_id', searchId)
          .single();

        if (dbError) throw dbError;
        
        if (data) {
          setStudentData(data);
        } else {
          setError('Student not found in database.');
        }
      } catch (err: any) {
        console.error("Error fetching student:", err);
        setError('Student not found or database error.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [id, navigationData]);

  if (loading) {
    return (
      <div className="page-container profile-screen flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary mr-3" size={32} />
        <span className="text-xl text-primary font-semibold">Retrieving Data...</span>
      </div>
    );
  }

  if (error || !studentData) {
    return (
      <div className="page-container profile-screen">
        <Header title="Student Profile" showBack={true} />
        <div className="flex flex-col items-center justify-center p-8 mt-12">
          <TriangleAlert className="text-red-500 mb-4" size={48} />
          <h2 className="text-2xl font-bold mb-2">Not Found</h2>
          <p className="text-secondary text-center">
            {error || `Could not find student with ID: ${id}`}
          </p>
          <button className="btn btn-primary mt-6 w-full" onClick={() => navigate(-1)}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const profile = {
    ...MOCK_VIOLATION_DATA,
    id: studentData.student_id,
    name: studentData.name,
    course: studentData.program,
    college: studentData.department,
    yearLevel: formatYearLevel(studentData.year_level),
  };

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
          {/* Dynamically seeded based on their name to give dummy uniqueness */}
          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name.split(' ')[0]}&backgroundColor=242f44`} alt="Student Avatar" className="profile-avatar" />
          <div className="status-indicator online"></div>
        </div>
        <h2 className="profile-name">{profile.name}</h2>
        <div className="profile-badges">
          <span className="badge badge-success">Enrolled</span>
          <span className="text-secondary text-sm">ID: {profile.id}</span>
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
          onClick={() => navigate(`/log-violation/${profile.id}`)}
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
