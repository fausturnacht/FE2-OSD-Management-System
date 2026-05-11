import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, ChevronDown, CheckCircle, Loader2, Trash2, RotateCcw } from 'lucide-react';
import Header from '../components/Header';
import { supabase } from '../utils/supabaseClient';

const EditViolationScreen: React.FC = () => {
  const { violationId } = useParams<{ violationId: string }>();
  const navigate = useNavigate();
  
  const [violation, setViolation] = useState<any>(null);
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [violationType, setViolationType] = useState('');
  const [offenseDetail, setOffenseDetail] = useState('');
  const [sanctionType, setSanctionType] = useState('Service');
  const [sanctionTotal, setSanctionTotal] = useState('');
  const [sanctionRemaining, setSanctionRemaining] = useState('');
  const [sanctionUnit, setSanctionUnit] = useState('hours');
  const [sanctionEndDate, setSanctionEndDate] = useState('');
  const [suspensionMode, setSuspensionMode] = useState<'duration' | 'date'>('duration');
  const [status, setStatus] = useState('Active');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!violationId) return;
      
      try {
        // Fetch violation
        const { data: vData, error: vError } = await supabase
          .from('violations')
          .select('*')
          .eq('id', violationId)
          .single();
        
        if (vError) throw vError;
        setViolation(vData);
        
        // Pre-fill form
        setViolationType(vData.type || '');
        setOffenseDetail(vData.offense || '');
        setSanctionType(vData.sanction_type || 'Service');
        setSanctionTotal(vData.sanction_total?.toString() || '');
        setSanctionRemaining(vData.sanction_remaining?.toString() || '');
        setSanctionUnit(vData.sanction_unit || 'hours');
        setSanctionEndDate(vData.sanction_end_date ? vData.sanction_end_date.split('T')[0] : '');
        setStatus(vData.status || 'Active');

        // Fetch student info
        if (vData.student_id) {
          const { data: sData, error: sError } = await supabase
            .from('students')
            .select('*')
            .eq('student_id', vData.student_id)
            .single();
          
          if (!sError) setStudent(sData);
        }
      } catch (err) {
        console.error("Error fetching violation data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [violationId]);

  // Sync duration and end date
  useEffect(() => {
    if (sanctionType !== 'Suspension') return;

    if (suspensionMode === 'duration' && sanctionTotal) {
      const days = parseInt(sanctionTotal);
      if (!isNaN(days)) {
        const date = new Date();
        date.setDate(date.getDate() + days);
        setSanctionEndDate(date.toISOString().split('T')[0]);
      }
    } else if (suspensionMode === 'date' && sanctionEndDate) {
      const endDate = new Date(sanctionEndDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 0) {
        setSanctionTotal(diffDays.toString());
      }
    }
  }, [sanctionTotal, sanctionEndDate, suspensionMode, sanctionType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!violationId || !student) return;

    setSubmitting(true);
    try {
      // Build sanction text for legacy/summary field
      let sanctionText = '';
      if (sanctionType === 'Service') sanctionText = `${sanctionTotal} hours student service`;
      else if (sanctionType === 'Suspension') sanctionText = `${sanctionTotal} days suspension`;
      else if (sanctionType === 'Expulsion') sanctionText = 'Expulsion';
      else if (sanctionType === 'Promissory') sanctionText = 'Promissory Note';
      else if (sanctionType === 'None') sanctionText = 'Warning';
      else sanctionText = sanctionType;

      const updateData: any = {
        type: violationType,
        offense: offenseDetail,
        sanction: sanctionText,
        sanction_type: sanctionType,
        sanction_total: sanctionTotal ? Number(sanctionTotal) : null,
        sanction_unit: sanctionUnit,
        sanction_remaining: sanctionType === 'Service' ? Number(sanctionRemaining) : null,
        sanction_end_date: sanctionEndDate || null,
        status: status
      };

      const { error } = await supabase
        .from('violations')
        .update(updateData)
        .eq('id', violationId);

      if (error) throw error;
      navigate(`/profile/${student.student_id}`);
    } catch (err) {
      console.error("Error updating violation:", err);
      alert("Failed to update violation.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmSoftDelete = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('violations')
        .update({ status: 'Record' })
        .eq('id', violationId);

      if (error) throw error;
      navigate(`/profile/${student.student_id}`);
    } catch (err) {
      console.error("Error archiving violation:", err);
      alert("Failed to archive violation.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="page-container flex flex-col animate-[fadeIn_250ms_ease_forwards]">
      <Header title="Update Sanction" />

      <div className="p-6">
        {student && (
          <div className="flex flex-col items-center mb-8 pb-6 border-b border-border-subtle">
            <div className="relative w-20 h-20 rounded-full border-[3px] border-bg-surface-elevated mb-3 bg-bg-surface-elevated overflow-hidden">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name.split(' ')[0]}&backgroundColor=6366f1`} alt="Student Avatar" className="w-full h-full object-cover" />
            </div>
            <h2 className="text-xl font-semibold mb-1">{student.name}</h2>
            <div className="text-sm text-text-secondary mb-4">ID: {student.student_id}</div>
          </div>
        )}

        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <div className="flex flex-col">
            <label className="text-xs font-bold text-text-primary mb-2 tracking-widest uppercase">Violation Category</label>
            <div className="relative mb-4">
              <select 
                className="w-full bg-bg-surface-elevated border border-border-subtle text-text-primary rounded-xl py-3.5 pl-4 pr-10 text-base appearance-none cursor-pointer focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                value={violationType}
                onChange={(e) => setViolationType(e.target.value)}
                required
              >
                <option value="Uniform/Appearance">Uniform/Appearance</option>
                <option value="Vandalism">Vandalism</option>
                <option value="Indecency">Indecency</option>
                <option value="Dishonesty">Dishonesty</option>
                <option value="Unauthorized Organization">Unauthorized Organization</option>
                <option value="Other">Other...</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={20} />
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-text-primary mb-2 tracking-widest uppercase">Offense Details</label>
            <textarea 
              className="w-full bg-bg-surface-elevated border border-border-subtle text-text-primary rounded-xl p-4 resize-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
              value={offenseDetail}
              onChange={(e) => setOffenseDetail(e.target.value)}
              rows={3}
              required
            ></textarea>
          </div>

          <div className="text-[0.65rem] font-bold text-text-muted tracking-[0.1em] my-4 flex items-center gap-4 after:content-[''] after:flex-1 after:h-[1px] after:bg-border-subtle">EDIT SANCTION</div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-text-primary mb-2 tracking-widest uppercase">Remedial Type</label>
            <div className="flex gap-2 flex-wrap">
              {['Service', 'Suspension', 'Promissory', 'None', 'Expulsion'].map((type) => (
                <button 
                  key={type}
                  type="button" 
                  className={`px-4 py-2 rounded-full text-xs font-medium cursor-pointer transition-all duration-150 ${sanctionType === type ? 'bg-primary text-white border-primary' : 'bg-bg-surface-elevated text-text-secondary border border-border-subtle hover:bg-bg-surface-hover'}`} 
                  onClick={() => {
                    setSanctionType(type);
                    if (type === 'Service') setSanctionUnit('hours');
                    else if (type === 'Suspension') setSanctionUnit('days');
                    else { setSanctionTotal(''); setSanctionRemaining(''); setSanctionEndDate(''); }
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {sanctionType === 'Service' && (
            <div className="grid grid-cols-2 gap-4 animate-[slideUp_0.3s_ease-out]">
              <div className="flex flex-col">
                <label className="text-xs font-bold text-text-primary mb-2 tracking-widest uppercase">Total Hours</label>
                <input 
                  type="number" 
                  className="w-full bg-bg-surface-elevated border border-border-subtle text-text-primary rounded-xl py-3.5 px-4 text-base focus:outline-none focus:border-primary" 
                  value={sanctionTotal}
                  onChange={(e) => setSanctionTotal(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-bold text-text-primary mb-2 tracking-widest uppercase text-primary">Remaining</label>
                <input 
                  type="number" 
                  step="0.5"
                  className="w-full bg-bg-surface-elevated border border-primary/50 text-text-primary rounded-xl py-3.5 px-4 text-base focus:outline-none focus:border-primary shadow-[0_0_10px_rgba(59,130,246,0.1)]" 
                  value={sanctionRemaining}
                  onChange={(e) => setSanctionRemaining(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {sanctionType === 'Suspension' && (
            <div className="flex flex-col gap-4 animate-[slideUp_0.3s_ease-out]">
              <div className="flex p-1 bg-bg-surface-elevated rounded-xl border border-border-subtle">
                <button 
                  type="button" 
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${suspensionMode === 'duration' ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-text-secondary'}`}
                  onClick={() => setSuspensionMode('duration')}
                >
                  BY DURATION
                </button>
                <button 
                  type="button" 
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${suspensionMode === 'date' ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-text-secondary'}`}
                  onClick={() => setSuspensionMode('date')}
                >
                  BY END DATE
                </button>
              </div>

              {suspensionMode === 'duration' ? (
                <div className="flex flex-col animate-[fadeIn_200ms_ease]">
                  <label className="text-xs font-bold text-text-primary mb-2 tracking-widest uppercase ml-1">Duration (Days)</label>
                  <input 
                    type="number" 
                    min="1"
                    className="w-full bg-bg-surface-elevated border border-border-subtle text-text-primary rounded-xl py-3.5 px-4 text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
                    placeholder="e.g. 3"
                    value={sanctionTotal}
                    onChange={(e) => setSanctionTotal(e.target.value)} 
                    required
                  />
                </div>
              ) : (
                <div className="flex flex-col animate-[fadeIn_200ms_ease]">
                  <label className="text-xs font-bold text-text-primary mb-2 tracking-widest uppercase ml-1">Suspension End Date</label>
                  <div className="relative">
                    <CalendarIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input 
                      type="date" 
                      className="w-full bg-bg-surface-elevated border border-border-subtle text-text-primary rounded-xl py-3.5 pl-10 pr-4 text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
                      value={sanctionEndDate}
                      onChange={(e) => setSanctionEndDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3 mt-4">
            <button type="submit" className="w-full p-4 text-lg gap-2 flex items-center justify-center rounded-full font-semibold bg-primary text-white shadow-[0_4px_14px_rgba(59,130,246,0.3)] hover:bg-primary-hover transition-all active:scale-95 disabled:opacity-50" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />}
              {submitting ? 'Updating...' : 'Save Changes'}
            </button>
            
            <button 
              type="button" 
              className="w-full p-4 text-sm gap-2 flex items-center justify-center rounded-full font-semibold bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all active:scale-95" 
              onClick={() => setShowConfirmModal(true)}
              disabled={submitting}
            >
              <Trash2 size={18} />
              Mark as Resolved / Archive
            </button>
            
            <button 
              type="button" 
              className="w-full p-4 text-sm gap-2 flex items-center justify-center rounded-full font-semibold bg-bg-surface-elevated text-text-muted transition-all active:scale-95" 
              onClick={() => navigate(-1)}
              disabled={submitting}
            >
              <RotateCcw size={18} />
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center px-6 animate-[fadeIn_200ms_ease_forwards]">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)}></div>
          <div className="bg-bg-surface border border-border-subtle w-full max-w-xs rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative z-10 animate-[slideUp_300ms_cubic-bezier(0.16,1,0.3,1)_forwards]">
            <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mb-4 mx-auto">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-white text-center mb-2">Resolve Sanction?</h3>
            <p className="text-text-secondary text-sm text-center mb-6">
              This will move the sanction to the historical records. This action is usually performed when the student has completed their remedial work.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                className="w-full py-3.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 active:scale-95 transition-all shadow-lg shadow-red-500/20"
                onClick={confirmSoftDelete}
              >
                YES, RESOLVE IT
              </button>
              <button 
                className="w-full py-3.5 rounded-xl bg-bg-surface-elevated text-text-primary font-bold text-sm border border-border-subtle hover:bg-bg-surface-hover active:scale-95 transition-all"
                onClick={() => setShowConfirmModal(false)}
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditViolationScreen;
