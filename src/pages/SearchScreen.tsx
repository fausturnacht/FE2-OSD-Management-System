import { useState, useEffect } from 'react';
import { Search as SearchIcon, X, ChevronRight, ChevronLeft, Loader2, Filter, ArrowUpDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

const SearchScreen: React.FC = () => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const navigate = useNavigate();

  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [department, setDepartment] = useState('All');
  const [program, setProgram] = useState('All');
  const [yearLevel, setYearLevel] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);

  // Calculate items per page dynamically based on vertical resolution
  useEffect(() => {
    const calculateLimit = () => {
      // Approximate height of non-list elements (Header, Title, Search Bar, Navigation, Pagination)
      const availableHeight = window.innerHeight - 350;
      // Approximate height of one card including gaps
      const limit = Math.max(1, Math.floor(availableHeight / 85));
      setItemsPerPage(limit);
    };

    calculateLimit();
    window.addEventListener('resize', calculateLimit);
    return () => window.removeEventListener('resize', calculateLimit);
  }, []);

  // Debounce query input to avoid spamming the database
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(0); // Reset to first page on new query
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);

  // Fetch results from Supabase
  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const start = page * itemsPerPage;
        const end = start + itemsPerPage - 1;

        let supabaseQuery = supabase
          .from('students')
          .select('*', { count: 'exact' });

        if (debouncedQuery.trim()) {
          supabaseQuery = supabaseQuery.or(`student_id.ilike.%${debouncedQuery}%,name.ilike.%${debouncedQuery}%`);
        }

        if (department !== 'All') {
          supabaseQuery = supabaseQuery.eq('department', department);
        }

        if (program !== 'All') {
          supabaseQuery = supabaseQuery.eq('program', program);
        }

        if (yearLevel !== 'All') {
          supabaseQuery = supabaseQuery.eq('year_level', parseInt(yearLevel));
        }

        const { data, count, error } = await supabaseQuery
          .range(start, end)
          .order(sortBy, { ascending: sortOrder === 'asc' });

        if (error) throw error;
        setResults(data || []);
        setTotalCount(count || 0);
      } catch (err) {
        console.error('Error fetching search results:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery, page, itemsPerPage, department, program, yearLevel, sortBy, sortOrder]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="page-container flex flex-col animate-[fadeIn_250ms_ease_forwards]">
      <Header title="Student List" />

      <div className="p-6">
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <SearchIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              className="w-full bg-bg-surface border border-border-subtle text-text-primary rounded-full py-3.5 pr-10 pl-12 text-base transition-all duration-150 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && query.trim()) {
                  (e.target as HTMLInputElement).blur();
                }
              }}
              placeholder="Search ID or name"
            />
            {query && (
              <button className="absolute right-4 top-1/2 -translate-y-1/2 bg-transparent border-none text-text-muted cursor-pointer" onClick={() => setQuery('')}>
                <X size={16} />
              </button>
            )}
          </div>
          
          <button 
            className={`flex items-center justify-center w-12 h-12 rounded-full border transition-all duration-200 ${showFilters ? 'bg-primary border-primary text-white' : 'bg-bg-surface border-border-subtle text-text-muted'}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={20} />
          </button>
        </div>

        {showFilters && (
          <div className="bg-bg-surface border border-border-subtle rounded-2xl p-4 mb-6 flex flex-col gap-4 animate-[slideDown_200ms_ease_out]">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider ml-1">Year Level</label>
                <select 
                  className="bg-bg-app border border-border-subtle text-text-primary text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-primary transition-colors"
                  value={yearLevel}
                  onChange={(e) => {
                    setYearLevel(e.target.value);
                    setPage(0);
                  }}
                >
                  <option value="All">All Years</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                  <option value="5">5th Year</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider ml-1">Sort By</label>
                <div className="flex gap-1">
                  <select 
                    className="flex-1 bg-bg-app border border-border-subtle text-text-primary text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-primary transition-colors"
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setPage(0);
                    }}
                  >
                    <option value="name">Name</option>
                    <option value="student_id">ID Number</option>
                  </select>
                  <button 
                    className="w-10 bg-bg-app border border-border-subtle text-text-muted rounded-xl flex items-center justify-center hover:text-primary transition-colors"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  >
                    <ArrowUpDown size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider ml-1">Department</label>
              <select 
                className="bg-bg-app border border-border-subtle text-text-primary text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-primary transition-colors"
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  setPage(0);
                }}
              >
                <option value="All">All Departments</option>
                <option value="Engineering and Architecture">Engineering and Architecture</option>
                <option value="Business Administration">Business Administration</option>
                <option value="College of Informatics and Computing Studies">College of Informatics and Computing Studies</option>
                <option value="Nursing">Nursing</option>
                <option value="Computer Studies">Computer Studies</option>
                <option value="Department of Sanitation">Department of Sanitation</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider ml-1">Program</label>
              <select 
                className="bg-bg-app border border-border-subtle text-text-primary text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-primary transition-colors"
                value={program}
                onChange={(e) => {
                  setProgram(e.target.value);
                  setPage(0);
                }}
              >
                <option value="All">All Programs</option>
                <option value="BS- Information Technology">BS- Information Technology</option>
                <option value="BSBA- Marketing Management">BSBA- Marketing Management</option>
                <option value="BS- Nursing">BS- Nursing</option>
                <option value="Janitorial">Janitorial</option>
                <option value="BS Computer Science">BS Computer Science</option>
                <option value="BS-Civil Engineering">BS-Civil Engineering</option>
              </select>
            </div>
          </div>
        )}

        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-text-muted tracking-widest uppercase">
              {debouncedQuery ? 'Search Results' : 'All Students'}
            </h3>
            {totalCount > 0 && (
              <span className="text-[10px] font-bold text-text-muted/60 uppercase tracking-widest">
                {totalCount} Found
              </span>
            )}
          </div>
            
            {loading ? (
              <div className="flex justify-center my-8">
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            ) : results.length > 0 ? (
              <>
                <div className="flex flex-col gap-4">
                  {results.map((user) => (
                    <div 
                      key={user.student_id} 
                      className="flex items-center bg-bg-surface border border-border-subtle rounded-2xl p-4 transition-all duration-150 hover:border-white/20 hover:-translate-y-0.5 cursor-pointer"
                      onClick={() => navigate(`/profile/${user.student_id}`)}
                    >
                      <div className="relative mr-4">
                        <img 
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name.split(' ')[0]}&backgroundColor=242f44`} 
                          alt="Avatar" 
                          className="w-12 h-12 rounded-xl flex items-center justify-center font-semibold text-xl text-white" 
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                      
                      <div className="flex-1 flex flex-col">
                        <div className="flex items-center mb-0.5">
                          <span className="font-semibold text-base text-text-primary mr-2">{user.name}</span>
                        </div>
                        <div className="text-text-secondary text-xs mb-1">ID: {user.student_id}</div>
                        <div className="text-xs text-text-muted">{formatYearLevel(user.year_level)}</div>
                      </div>
                      
                      <ChevronRight className="text-text-muted" size={20} />
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 px-2 text-text-muted">
                    <button 
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="p-2 rounded hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <span className="text-sm font-medium">Page {page + 1} of {totalPages}</span>
                    <button 
                      onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      className="p-2 rounded hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-text-muted mt-8">
                No results found for "{debouncedQuery}"
              </div>
            )}
          </div>
      </div>
      
      <button 
        className="fixed bottom-[calc(80px+1.5rem)] right-6 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-[0_4px_14px_rgba(59,130,246,0.4)] border-none cursor-pointer z-[100]"
        onClick={() => {
          if (query.trim() && results.length > 0) {
            navigate(`/profile/${results[0].student_id}`);
          }
        }}
      >
        <SearchIcon size={24} />
      </button>
    </div>
  );
};

export default SearchScreen;
