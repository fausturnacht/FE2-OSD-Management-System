import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, ChevronDown, CheckCircle, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import { supabase } from '../utils/supabaseClient';

const LogViolationScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [violationType, setViolationType] = useState('');
  const [offenseDetail, setOffenseDetail] = useState('');
  const [sanctionType, setSanctionType] = useState('Service');
  const [sanctionTotal, setSanctionTotal] = useState('');
  const [sanctionUnit, setSanctionUnit] = useState('hours');
  const [sanctionEndDate, setSanctionEndDate] = useState('');

  useEffect(() => {
    const fetchStudent = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('student_id', id)
        .single();
      
      if (!error && data) {
        setStudent(data);
      }
      setLoading(false);
    };
    fetchStudent();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !student) return;

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

      const { error } = await supabase.from('violations').insert({
        student_id: id,
        type: violationType,
        offense: offenseDetail,
        sanction: sanctionText,
        sanction_type: sanctionType,
        sanction_total: sanctionTotal ? Number(sanctionTotal) : null,
        sanction_unit: sanctionUnit,
        sanction_remaining: sanctionType === 'Service' ? Number(sanctionTotal) : null,
        sanction_end_date: sanctionEndDate || null,
        status: sanctionType === 'None' ? 'Record' : 'Active'
      });

      if (error) throw error;
      navigate(`/profile/${id}`);
    } catch (err) {
      console.error("Error logging violation:", err);
      alert("Failed to save violation.");
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
      <Header 
        title="Log Violation" 
      />

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
                <option value="" disabled>Select category...</option>
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
              className="w-full bg-bg-surface-elevated border border-border-subtle text-text-primary rounded-xl p-4 resize-none pb-12 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
              placeholder="Describe the incident (e.g. Broken window in Room 302)..."
              value={offenseDetail}
              onChange={(e) => setOffenseDetail(e.target.value)}
              rows={3}
              required
            ></textarea>
          </div>

          <div className="text-[0.65rem] font-bold text-text-muted tracking-[0.1em] my-4 flex items-center gap-4 after:content-[''] after:flex-1 after:h-[1px] after:bg-border-subtle">SANCTION TRACKING</div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-text-primary mb-2 tracking-widest uppercase">Remedial Type</label>
            <div className="flex gap-2 flex-wrap">
              <button type="button" className={`px-4 py-2 rounded-full text-xs font-medium cursor-pointer transition-all duration-150 ${sanctionType === 'Service' ? 'bg-primary text-white border-primary' : 'bg-bg-surface-elevated text-text-secondary border border-border-subtle hover:bg-bg-surface-hover'}`} onClick={() => {setSanctionType('Service'); setSanctionUnit('hours');}}>Service</button>
              <button type="button" className={`px-4 py-2 rounded-full text-xs font-medium cursor-pointer transition-all duration-150 ${sanctionType === 'Suspension' ? 'bg-primary text-white border-primary' : 'bg-bg-surface-elevated text-text-secondary border border-border-subtle hover:bg-bg-surface-hover'}`} onClick={() => {setSanctionType('Suspension'); setSanctionUnit('days');}}>Suspension</button>
              <button type="button" className={`px-4 py-2 rounded-full text-xs font-medium cursor-pointer transition-all duration-150 ${sanctionType === 'Promissory' ? 'bg-primary text-white border-primary' : 'bg-bg-surface-elevated text-text-secondary border border-border-subtle hover:bg-bg-surface-hover'}`} onClick={() => {setSanctionType('Promissory'); setSanctionTotal(''); setSanctionEndDate('');}}>Promissory</button>
              <button type="button" className={`px-4 py-2 rounded-full text-xs font-medium cursor-pointer transition-all duration-150 ${sanctionType === 'None' ? 'bg-primary text-white border-primary' : 'bg-bg-surface-elevated text-text-secondary border border-border-subtle hover:bg-bg-surface-hover'}`} onClick={() => {setSanctionType('None'); setSanctionTotal(''); setSanctionEndDate('');}}>Warning</button>
              <button type="button" className={`px-4 py-2 rounded-full text-xs font-medium cursor-pointer transition-all duration-150 ${sanctionType === 'Expulsion' ? 'bg-primary text-white border-primary' : 'bg-bg-surface-elevated text-text-secondary border border-border-subtle hover:bg-bg-surface-hover'}`} onClick={() => {setSanctionType('Expulsion'); setSanctionTotal(''); setSanctionEndDate('');}}>Expulsion</button>
            </div>
          </div>

          {sanctionType === 'Service' && (
            <div className="flex flex-col animate-[slideUp_0.3s_ease-out]">
              <label className="text-xs font-bold text-text-primary mb-2 tracking-widest uppercase">Service Quantity (Hours)</label>
              <input 
                type="number" 
                className="w-full bg-bg-surface-elevated border border-border-subtle text-text-primary rounded-xl py-3.5 px-4 text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
                placeholder="e.g. 8.0" 
                value={sanctionTotal}
                onChange={(e) => setSanctionTotal(e.target.value)}
                required
              />
            </div>
          )}

          {sanctionType === 'Suspension' && (
            <div className="flex gap-4 animate-[slideUp_0.3s_ease-out]">
              <div className="flex flex-col flex-1">
                <label className="text-xs font-bold text-text-primary mb-2 tracking-widest uppercase">Duration (Days)</label>
                <input 
                  type="number" 
                  className="w-full bg-bg-surface-elevated border border-border-subtle text-text-primary rounded-xl py-3.5 px-4 text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
                  value={sanctionTotal}
                  onChange={(e) => setSanctionTotal(e.target.value)} 
                  required
                />
              </div>
              <div className="flex flex-col flex-1">
                <label className="text-xs font-bold text-text-primary mb-2 tracking-widest uppercase">End Date</label>
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
            </div>
          )}

          <button type="submit" className="w-full mt-4 p-4 text-lg gap-2 flex items-center justify-center rounded-full font-semibold bg-primary text-white shadow-[0_4px_14px_rgba(59,130,246,0.3)] hover:bg-primary-hover transition-all active:scale-95 disabled:opacity-50" disabled={submitting}>
            {submitting ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />}
            {submitting ? 'Saving...' : 'Confirm Log'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LogViolationScreen;
