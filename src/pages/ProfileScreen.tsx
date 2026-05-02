import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { TriangleAlert, BookOpen, Building2, Calendar, User, ShieldAlert, Edit2, Loader2, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import Header from '../components/Header';
import { supabase } from '../utils/supabaseClient';

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
      
      let searchId = id || navigationData?.studentId;
      
      if (!searchId) {
        searchId = localStorage.getItem('activeStudentId');
      }

      if (!searchId) {
        setError('NO_PROFILE_SELECTED');
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
      <div className="page-container flex flex-col p-0 items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary mr-3" size={32} />
        <span className="text-xl text-primary font-semibold">Retrieving Data...</span>
      </div>
    );
  }

  if (error || !studentData) {
    if (error === 'NO_PROFILE_SELECTED') {
      return (
        <div className="page-container flex flex-col p-0">
          <Header title="Student Profile" />
          <div className="flex flex-col items-center justify-center p-8 mt-24">
            <User className="text-secondary opacity-50 mb-6" size={64} />
            <h2 className="text-2xl font-bold mb-2 text-white">No Profile Selected</h2>
            <p className="text-secondary text-center mb-8">
              You haven't scanned a student yet. Please scan an ID to view their profile here.
            </p>
            <button className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-semibold bg-primary text-white shadow-[0_4px_14px_rgba(59,130,246,0.3)] hover:bg-primary-hover active:scale-95 transition-all w-full max-w-xs" onClick={() => navigate('/scan')}>
              Scan an ID
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="page-container flex flex-col p-0">
        <Header title="Student Profile" />
        <div className="flex flex-col items-center justify-center p-8 mt-12">
          <TriangleAlert className="text-red-500 mb-4" size={48} />
          <h2 className="text-2xl font-bold mb-2">Not Found</h2>
          <p className="text-secondary text-center">
            {error || `Could not find student with ID: ${id}`}
          </p>

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
  let isGreen = true;
  let showProgress = false;
  let showTimer = false;
  let progressPercent = 0;
  let remainderText = '';

  if (hasActiveSanctions && currentSanction) {
    statusLabel = 'ACTIVE SANCTIONS';
    statusDetail = currentSanction.sanction || currentSanction.offense;
    isGreen = false;
    
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
    <div className="page-container flex flex-col p-0 animate-[fadeIn_250ms_ease_forwards]">
      <Header 
        title="Student Profile" 
      />

      <div className="flex flex-col items-center px-4 py-8">
        <div className="relative w-24 h-24 rounded-full border-4 border-bg-surface-elevated mb-4 bg-bg-surface-elevated">
          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${studentData.name.split(' ')[0]}&backgroundColor=242f44`} alt="Student Avatar" className="w-full h-full rounded-full object-cover" />
          <div className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-[3px] border-bg-app ${hasActiveSanctions ? 'bg-accent-red shadow-[0_0_8px_var(--color-accent-red)]' : 'bg-accent-green'}`}></div>
        </div>
        <h2 className="text-2xl font-bold mb-2 text-center">{studentData.name}</h2>
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center justify-center bg-accent-green-bg text-accent-green">Enrolled</span>
          <span className="text-text-secondary text-sm">ID: {studentData.student_id}</span>
        </div>
      </div>

      <div className="flex-1 px-6 py-4">
        <div className={`border rounded-2xl p-5 mb-6 border-l-4 ${isGreen ? 'bg-gradient-to-br from-green-500/15 to-[#0b3f1e]/80 border-green-500/30 shadow-[0_10px_25px_rgba(34,197,94,0.1)] border-l-accent-green' : 'bg-gradient-to-br from-red-500/15 to-[#470f0f]/80 border-red-500/30 shadow-[0_10px_25px_rgba(239,68,68,0.1)] border-l-accent-red'}`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className={`text-xs font-bold tracking-widest mb-1 ${isGreen ? 'text-accent-green' : 'text-accent-red'}`}>{statusLabel}</div>
              <div className="text-lg font-semibold text-white">{statusDetail}</div>
            </div>
            {hasActiveSanctions ? <TriangleAlert className="text-red-500" size={24} /> : <ShieldAlert className="text-green-500" size={24} />}
          </div>
          
          {(showProgress || showTimer || (currentSanction?.sanction_type === 'Promissory')) && (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-secondary">
                  {showProgress ? 'Community Service Progress' : showTimer ? 'Suspension Countdown' : 'Promissory Note Status'}
                </span>
                <span className="text-xs font-semibold text-primary">
                  {showTimer && <Clock size={12} className="inline mr-1" />}
                  {remainderText}
                </span>
              </div>
              {showProgress && (
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${isGreen ? 'bg-accent-green' : 'bg-accent-red'}`} style={{ width: `${progressPercent}%` }}></div>
                </div>
              )}
            </div>
          )}
        </div>

        <button 
          className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-semibold bg-primary text-white shadow-[0_4px_14px_rgba(59,130,246,0.3)] hover:bg-primary-hover active:scale-95 transition-all w-full mb-6"
          onClick={() => navigate(`/log-violation/${studentData.student_id}`)}
        >
          <Edit2 size={18} />
          Log New Violation
        </button>

        <div className="flex flex-col gap-3">
          <div className="bg-bg-surface rounded-xl px-5 py-4 border border-border-subtle flex flex-col">
            <BookOpen size={16} className="text-primary mb-1" />
            <div className="text-[0.65rem] text-text-muted font-semibold tracking-widest mb-1">COURSE</div>
            <div className="text-[0.9rem] font-medium text-text-primary">{studentData.program}</div>
          </div>
          <div className="bg-bg-surface rounded-xl px-5 py-4 border border-border-subtle flex flex-col">
            <Building2 size={16} className="text-primary mb-1" />
            <div className="text-[0.65rem] text-text-muted font-semibold tracking-widest mb-1">COLLEGE</div>
            <div className="text-[0.9rem] font-medium text-text-primary">{studentData.department}</div>
          </div>
          <div className="bg-bg-surface rounded-xl px-5 py-4 border border-border-subtle flex flex-col">
            <Calendar size={16} className="text-primary mb-1" />
            <div className="text-[0.65rem] text-text-muted font-semibold tracking-widest mb-1">YEAR LEVEL</div>
            <div className="text-[0.9rem] font-medium text-text-primary">{formatYearLevel(studentData.year_level)}</div>
          </div>
          <div className="bg-bg-surface rounded-xl px-5 py-4 border border-border-subtle flex flex-col">
            <User size={16} className="text-primary mb-1" />
            <div className="text-[0.65rem] text-text-muted font-semibold tracking-widest mb-1">STUDENT TYPE</div>
            <div className="text-[0.9rem] font-medium text-text-primary">Regular</div>
          </div>
        </div>

        <div className="mt-8 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">Violation History</h3>
          </div>
          
          <div className="flex flex-col gap-3">
            {violations.length > 0 ? (
              violations.map((record) => (
                <div 
                  key={record.id} 
                  className={`flex flex-col bg-bg-surface p-4 rounded-xl border border-border-subtle cursor-pointer transition-all duration-300 hover:border-primary hover:bg-bg-surface-elevated hover:-translate-y-0.5 ${expandedViolationId === record.id ? 'border-primary bg-bg-surface-elevated shadow-[0_10px_30px_rgba(0,0,0,0.2)]' : ''}`}
                  onClick={() => setExpandedViolationId(expandedViolationId === record.id ? null : record.id)}
                >
                  <div className="flex items-center gap-4 w-full">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${record.status === 'Active' ? 'bg-red-500/15 text-accent-red' : record.status === 'Record' ? 'bg-amber-500/15 text-accent-orange' : 'bg-emerald-500/15 text-accent-green'}`}>
                      <ShieldAlert size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{record.type}</div>
                      <div className="text-xs text-text-secondary">
                        {new Date(record.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center justify-center ${record.status === 'Active' ? 'bg-red-500/20 text-accent-red border border-red-500/30' : record.status === 'Record' ? 'bg-amber-500/20 text-accent-orange border border-amber-500/30' : 'bg-emerald-500/20 text-accent-green border border-emerald-500/30'}`}>
                      {record.status}
                    </div>
                  </div>

                  {expandedViolationId === record.id && (
                    <div className="mt-4 pt-4 border-t border-dashed border-gray-700 animate-[fadeIn_250ms_ease_forwards]">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Offense</label>
                          <p className="text-sm text-gray-200">{record.offense}</p>
                        </div>
                        <div className="flex flex-col">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Sanction</label>
                          <p className="text-sm text-gray-200">{record.sanction || 'N/A'}</p>
                        </div>
                        <div className="flex flex-col">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Type</label>
                          <p className="text-sm text-gray-200">{record.sanction_type || 'None'}</p>
                        </div>
                        <div className="flex flex-col">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Created At</label>
                          <p className="text-sm text-gray-200">{new Date(record.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-text-secondary text-sm">No recorded violations.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
