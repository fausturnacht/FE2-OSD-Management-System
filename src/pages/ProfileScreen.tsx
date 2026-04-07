import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { TriangleAlert, BookOpen, Building2, Calendar, User, ShieldAlert, Edit2, Loader2, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import Header from '../components/Header';
import { supabase } from '../utils/supabaseClient';
import './ProfileScreen.css';

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
  const location = useLocation();
  const navigationData = location.state?.studentData;

  const [studentData, setStudentData] = useState<any>(null);
  const [violations, setViolations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedViolationId, setExpandedViolationId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      const searchId = id || navigationData?.studentId;

      if (!searchId) {
        setError('No Student ID provided.');
        setLoading(false);
        return;
      }

      try {
        // Fetch student info
        const { data: sData, error: sError } = await supabase
          .from('students')
          .select('*')
          .eq('student_id', searchId)
          .single();

        if (sError) throw sError;
        setStudentData(sData);

        // Fetch violation history
        const { data: vData, error: vError } = await supabase
          .from('violations')
          .select('*')
          .eq('student_id', searchId)
          .order('created_at', { ascending: false });

        if (vError) throw vError;
        setViolations(vData || []);

      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError('Data retrieval failed.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

  // Determine active sanctions and warnings
  const activeSanctions = violations.filter(v => 
    v.status === 'Active' && 
    v.sanction_type && 
    v.sanction_type !== 'None'
  );
  

  const hasActiveSanctions = activeSanctions.length > 0;
  const currentSanction = hasActiveSanctions ? activeSanctions[0] : null;

  // Calculate display properties
  let statusLabel = 'NO UNRESOLVED SANCTIONS';
  let statusDetail = 'Clear Record';
  let cardThemeClass = 'is-green';
  let showProgress = false;
  let showTimer = false;
  let progressPercent = 0;
  let remainderText = '';

  if (hasActiveSanctions && currentSanction) {
    statusLabel = 'ACTIVE SANCTIONS';
    statusDetail = currentSanction.sanction || currentSanction.offense;
    cardThemeClass = ''; // default red
    
    if (currentSanction.sanction_type === 'Service') {
      showProgress = true;
      const total = Number(currentSanction.sanction_total) || 1;
      const remaining = Number(currentSanction.sanction_remaining) || 0;
      progressPercent = Math.max(0, Math.min(100, ((total - remaining) / total) * 100));
      remainderText = `${remaining} hours remaining`;
    } else if (currentSanction.sanction_type === 'Suspension' && currentSanction.sanction_end_date) {
      showTimer = true;
      const endDate = new Date(currentSanction.sanction_end_date);
      const now = new Date();
      const diffMs = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      remainderText = diffDays > 0 ? `${diffDays} days remaining` : 'Terminating Today';
    } else if (currentSanction.sanction_type === 'Promissory') {
      remainderText = 'Pending Submission';
    }
  } else {
    statusDetail = 'Good Standing';
  }

  return (
    <div className="page-container profile-screen animate-fade-in">
      <Header 
        title="Student Profile" 
        showBack={true}
        rightAction={<span className="text-primary text-sm font-medium pr-2">Edit</span>} 
      />

      <div className="profile-header">
        <div className="avatar-wrapper">
          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${studentData.name.split(' ')[0]}&backgroundColor=242f44`} alt="Student Avatar" className="profile-avatar" />
          <div className={`status-indicator ${hasActiveSanctions ? 'busy' : 'online'}`}></div>
        </div>
        <h2 className="profile-name">{studentData.name}</h2>
        <div className="profile-badges">
          <span className="badge badge-success">Enrolled</span>
          <span className="text-secondary text-sm">ID: {studentData.student_id}</span>
        </div>
      </div>

      <div className="profile-content">
        <div className={`violation-card ${cardThemeClass}`}>
          <div className="violation-header">
            <div>
              <div className="violation-label">{statusLabel}</div>
              <div className="violation-title">{statusDetail}</div>
            </div>
            {hasActiveSanctions ? <TriangleAlert className="text-red-500" size={24} /> : <ShieldAlert className="text-green-500" size={24} />}
          </div>
          
          {(showProgress || showTimer || (currentSanction?.sanction_type === 'Promissory')) && (
            <div className="service-progress">
              <div className="progress-labels">
                <span className="text-xs text-secondary">
                  {showProgress ? 'Community Service Progress' : showTimer ? 'Suspension Countdown' : 'Promissory Note Status'}
                </span>
                <span className="text-xs font-semibold text-primary">
                  {showTimer && <Clock size={12} className="inline mr-1" />}
                  {remainderText}
                </span>
              </div>
              {showProgress && (
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
                </div>
              )}
            </div>
          )}
        </div>

        <button 
          className="btn btn-primary w-full mb-6 flex items-center justify-center gap-2"
          onClick={() => navigate(`/log-violation/${studentData.student_id}`)}
        >
          <Edit2 size={18} />
          Log New Violation
        </button>

        <div className="info-grid">
          <div className="info-card">
            <BookOpen size={16} className="text-primary mb-1" />
            <div className="info-label">COURSE</div>
            <div className="info-value">{studentData.program}</div>
          </div>
          <div className="info-card">
            <Building2 size={16} className="text-primary mb-1" />
            <div className="info-label">COLLEGE</div>
            <div className="info-value">{studentData.department}</div>
          </div>
          <div className="info-card">
            <Calendar size={16} className="text-primary mb-1" />
            <div className="info-label">YEAR LEVEL</div>
            <div className="info-value">{formatYearLevel(studentData.year_level)}</div>
          </div>
          <div className="info-card">
            <User size={16} className="text-primary mb-1" />
            <div className="info-label">STUDENT TYPE</div>
            <div className="info-value">Regular</div>
          </div>
        </div>

        <div className="history-section">
          <div className="history-header flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">Violation History</h3>
          </div>
          
          <div className="history-list flex flex-col gap-3">
            {violations.length > 0 ? (
              violations.map((record) => (
                <div 
                  key={record.id} 
                  className={`history-item ${expandedViolationId === record.id ? 'is-expanded' : ''}`}
                  onClick={() => setExpandedViolationId(expandedViolationId === record.id ? null : record.id)}
                >
                  <div className="history-item-main flex items-center gap-4 w-full">
                    <div className={`history-icon ${record.status === 'Active' ? 'bg-danger' : record.status === 'Record' ? 'bg-warning' : 'bg-success'}`}>
                      <ShieldAlert size={20} />
                    </div>
                    <div className="history-details flex-1">
                      <div className="font-semibold">{record.type}</div>
                      <div className="text-xs text-secondary">
                        {new Date(record.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className={`badge ${record.status === 'Active' ? 'badge-danger' : record.status === 'Record' ? 'badge-warning' : 'badge-success'}`}>
                      {record.status}
                    </div>
                  </div>

                  {expandedViolationId === record.id && (
                    <div className="history-item-details mt-4 pt-4 border-t border-dashed border-gray-700 animate-fade-in">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="detail-group">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Offense</label>
                          <p className="text-sm text-gray-200">{record.offense}</p>
                        </div>
                        <div className="detail-group">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Sanction</label>
                          <p className="text-sm text-gray-200">{record.sanction || 'N/A'}</p>
                        </div>
                        <div className="detail-group">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Type</label>
                          <p className="text-sm text-gray-200">{record.sanction_type || 'None'}</p>
                        </div>
                        <div className="detail-group">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Created At</label>
                          <p className="text-sm text-gray-200">{new Date(record.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-secondary text-sm">No recorded violations.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
