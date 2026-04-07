import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, ChevronDown, CheckCircle, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import { supabase } from '../utils/supabaseClient';
import './LogViolationScreen.css';

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
    <div className="page-container log-violation-screen animate-fade-in">
      <Header 
        title="Log Violation" 
        showBack={true} 
        rightAction={<div className="help-icon">?</div>}
      />

      <div className="log-content">
        {student && (
          <div className="student-summary-card">
            <div className="avatar-wrapper-small">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name.split(' ')[0]}&backgroundColor=6366f1`} alt="Student Avatar" />
            </div>
            <h2 className="summary-name">{student.name}</h2>
            <div className="summary-id">ID: {student.student_id}</div>
          </div>
        )}

        <form className="violation-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Violation Category</label>
            <div className="select-wrapper">
              <select 
                className="input-field select-field"
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
              <ChevronDown className="select-icon" size={20} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Offense Details</label>
            <textarea 
              className="input-field remarks-field" 
              placeholder="Describe the incident (e.g. Broken window in Room 302)..."
              value={offenseDetail}
              onChange={(e) => setOffenseDetail(e.target.value)}
              rows={3}
              required
            ></textarea>
          </div>

          <div className="section-divider">SANCTION TRACKING</div>

          <div className="form-group">
            <label className="form-label">Remedial Type</label>
            <div className="quick-chips">
              <button type="button" className={`chip ${sanctionType === 'Service' ? 'active' : ''}`} onClick={() => {setSanctionType('Service'); setSanctionUnit('hours');}}>Service</button>
              <button type="button" className={`chip ${sanctionType === 'Suspension' ? 'active' : ''}`} onClick={() => {setSanctionType('Suspension'); setSanctionUnit('days');}}>Suspension</button>
              <button type="button" className={`chip ${sanctionType === 'Promissory' ? 'active' : ''}`} onClick={() => {setSanctionType('Promissory'); setSanctionTotal(''); setSanctionEndDate('');}}>Promissory</button>
              <button type="button" className={`chip ${sanctionType === 'None' ? 'active' : ''}`} onClick={() => {setSanctionType('None'); setSanctionTotal(''); setSanctionEndDate('');}}>Warning</button>
              <button type="button" className={`chip ${sanctionType === 'Expulsion' ? 'active' : ''}`} onClick={() => {setSanctionType('Expulsion'); setSanctionTotal(''); setSanctionEndDate('');}}>Expulsion</button>
            </div>
          </div>

          {sanctionType === 'Service' && (
            <div className="form-group animate-slide-up">
              <label className="form-label">Service Quantity (Hours)</label>
              <input 
                type="number" 
                className="input-field" 
                placeholder="e.g. 8.0" 
                value={sanctionTotal}
                onChange={(e) => setSanctionTotal(e.target.value)}
                required
              />
            </div>
          )}

          {sanctionType === 'Suspension' && (
            <div className="form-row animate-slide-up">
              <div className="form-group flex-1">
                <label className="form-label">Duration (Days)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={sanctionTotal}
                  onChange={(e) => setSanctionTotal(e.target.value)} 
                  required
                />
              </div>
              <div className="form-group flex-1">
                <label className="form-label">End Date</label>
                <div className="input-with-icon">
                  <CalendarIcon size={18} className="input-icon" />
                  <input 
                    type="date" 
                    className="input-field" 
                    value={sanctionEndDate}
                    onChange={(e) => setSanctionEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary submit-btn" disabled={submitting}>
            {submitting ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />}
            {submitting ? 'Saving...' : 'Confirm Log'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LogViolationScreen;
