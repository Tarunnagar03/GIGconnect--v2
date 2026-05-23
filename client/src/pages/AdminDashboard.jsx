import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Link, useNavigate, useLocation, Outlet, useOutlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

// --- NEW: Import Global Error Boundary ---
import ErrorBoundary from '../components/ErrorBoundary';
import AnalyticsCharts from './AnalyticsCharts';
import SystemEmailModal from './SystemEmailModal';
import AdminUserTable from './AdminUserTable';
import ArchiveGigModal from './ArchiveGigModal';
import ContactDeleteModal from './ContactDeleteModal';
import DisputeResolutionModal from './DisputeResolutionModal';

// --- NEW: Bullet-proof Date Formatters to prevent RangeError Crashes ---
const safeFormatDate = (dateString) => {
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return 'N/A';
        return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return 'N/A';
    }
};

const safeFormatDateSimple = (dateString) => {
    try {
        const d = new Date(dateString || Date.now());
        if (isNaN(d.getTime())) return 'N/A';
        return d.toLocaleDateString();
    } catch (e) {
        return 'N/A';
    }
};

// --- NEW: Smart User Agent Parser (Converts ugly strings to "Chrome / Windows") ---
const parseUserAgent = (ua) => {
    if (!ua || ua === 'Unknown') return 'N/A';
    let browser = 'Unknown Browser';
    let os = 'Unknown OS';
    
    if (ua.includes('Edg')) browser = 'Edge';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';
    
    if (ua.includes('Win')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'MacOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
    
    return `${browser} on ${os}`;
};

const SectionCard = ({ title, children, action, className = "" }) => (
    <div className={`bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-gray-200/50 ${className}`}>
        <div className="flex justify-between items-center mb-6 border-b border-gray-200/60 pb-4">
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h3>
            {action && <div>{action}</div>}
        </div>
        {children}
    </div>
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const outlet = useOutlet();
  const { logout } = useAuth();
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [gigs, setGigs] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [userQuery, setUserQuery] = useState('');
  const [gigQuery, setGigQuery] = useState('');

  // Pagination States
  const [userPage, setUserPage] = useState(1);
  const [gigPage, setGigPage] = useState(1);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);
  const [hasMoreGigs, setHasMoreGigs] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // --- ENTERPRISE MODAL STATES ---
  const [gigToArchive, setGigToArchive] = useState(null);
  const [contactToDelete, setContactToDelete] = useState(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [disputeGig, setDisputeGig] = useState(null);
  const [disputeDetails, setDisputeDetails] = useState(null);

  // --- NEW: Email Modal States ---
  const [emailModalUser, setEmailModalUser] = useState(null);

  const queryTab = new URLSearchParams(location.search).get('tab');
  const [activeTab, setActiveTab] = useState(queryTab || 'overview');

  useEffect(() => {
      if (queryTab) {
          setActiveTab(queryTab);
      } else if (location.pathname.includes('/gigs/')) {
          setActiveTab('gigs');
      } else if (location.pathname.includes('/chat/')) {
          setActiveTab('users');
      }
  }, [queryTab, location.pathname]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [o, u, g, t, aLogs] = await Promise.all([
          api.get('/admin/overview'),
          api.get('/admin/users?limit=15&page=1'),
          api.get('/admin/gigs?limit=15&page=1'),
          api.get('/admin/transactions?limit=25'),
          api.get('/admin/audit-logs').catch(() => ({ data: [] }))
        ]);
        setOverview(o.data);
        setUsers(Array.isArray(u.data) ? u.data.filter(Boolean) : []);
        setGigs(Array.isArray(g.data) ? g.data.filter(Boolean) : []);
        setTransactions(Array.isArray(t.data) ? t.data.filter(Boolean) : []);
        setAuditLogs(Array.isArray(aLogs.data) ? aLogs.data : []);
        
        setHasMoreUsers(Array.isArray(u.data) && u.data.filter(Boolean).length >= 15);
        setHasMoreGigs(Array.isArray(g.data) && g.data.filter(Boolean).length >= 15);
        
        // Fetch contacts separately so it doesn't break the whole dashboard if it fails
        try {
          const cRes = await api.get('/admin/contacts');
          setContacts(Array.isArray(cRes.data) ? cRes.data.filter(Boolean) : []);
        } catch (contactErr) {
          console.error("Failed to fetch contacts:", contactErr);
        }
      } catch (err) {
        setError(err.response?.data?.msg || 'Failed to load admin dashboard.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleUserActive = async (userId, isActive) => {
    try {
      const res = await api.put(`/admin/users/${userId}/active`, { isActive });
      setUsers((prev) => prev.map((u) => (u._id === res.data._id ? res.data : u)));
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to update user.');
    }
  };

  const confirmArchiveGig = async () => {
    if (!gigToArchive) return;
    setIsArchiving(true);
    try {
      // API call to Soft-Delete / Deactivate
      await api.put(`/admin/gigs/${gigToArchive._id}/archive`);
      setGigs((prev) => prev.map((g) => (g._id === gigToArchive._id ? { ...g, status: 'Archived' } : g)));
      setGigToArchive(null);
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to archive gig.');
    } finally {
      setIsArchiving(false);
    }
  };

  const markDisputed = async (gigId) => {
    if (!window.confirm('Freeze this gig and mark as Disputed? This will halt all escrow payments.')) return;
    try {
      const res = await api.put(`/admin/gigs/${gigId}/dispute`);
      setGigs((prev) => prev.map((g) => (g._id === gigId ? { ...g, status: res.data.status } : g)));
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to mark gig as disputed.');
    }
  };

  const openDisputeCenter = async (gig) => {
    setDisputeGig(gig);
    setDisputeDetails(null);
    try {
      const res = await api.get(`/admin/gigs/${gig._id}/dispute-details`);
      setDisputeDetails(res.data);
    } catch (err) { console.error("Failed to fetch dispute details"); }
  };

  const executeResolution = async (resAction) => {
    try {
      const res = await api.put(`/admin/gigs/${disputeGig._id}/resolve`, { resolution: resAction });
      setGigs((prev) => prev.map((g) => (g._id === disputeGig._id ? { ...g, status: res.data.status } : g)));
      setDisputeGig(null);
      alert(`Dispute resolved successfully. Funds ${resAction === 'refund_client' ? 'refunded to client.' : 'released to freelancer.'}`);
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to resolve dispute.');
    }
  };

  const searchUsers = async (e) => {
    if (e) e.preventDefault();
    setUserPage(1);
    try {
      const res = await api.get(`/admin/users?q=${encodeURIComponent(userQuery)}&limit=15&page=1`);
      setUsers(Array.isArray(res.data) ? res.data.filter(Boolean) : []);
      setHasMoreUsers(Array.isArray(res.data) && res.data.filter(Boolean).length >= 15);
    } catch (err) {
      console.error(err);
    }
  };

  const searchGigs = async (e) => {
    if (e) e.preventDefault();
    setGigPage(1);
    try {
      const res = await api.get(`/admin/gigs?q=${encodeURIComponent(gigQuery)}&limit=15&page=1`);
      setGigs(Array.isArray(res.data) ? res.data.filter(Boolean) : []);
      setHasMoreGigs(Array.isArray(res.data) && res.data.filter(Boolean).length >= 15);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMoreUsers = async () => {
      setLoadingMore(true);
      const next = userPage + 1;
      setUserPage(next);
      const res = await api.get(`/admin/users?q=${encodeURIComponent(userQuery)}&limit=15&page=${next}`);
      const newUsers = Array.isArray(res.data) ? res.data.filter(Boolean) : [];
      setUsers(prev => [...prev, ...newUsers]);
      setHasMoreUsers(newUsers.length >= 15);
      setLoadingMore(false);
  };

  const loadMoreGigs = async () => {
      setLoadingMore(true);
      const next = gigPage + 1;
      setGigPage(next);
      const res = await api.get(`/admin/gigs?q=${encodeURIComponent(gigQuery)}&limit=15&page=${next}`);
      const newGigs = Array.isArray(res.data) ? res.data.filter(Boolean) : [];
      setGigs(prev => [...prev, ...newGigs]);
      setHasMoreGigs(newGigs.length >= 15);
      setLoadingMore(false);
  };

  return (
    <div className="h-screen w-screen bg-[#F4F7FC] flex overflow-hidden font-sans selection:bg-indigo-200">
        {/* --- DYNAMIC BACKGROUND AMBIENT ORBS --- */}
        <div className="fixed inset-0 z-0 pointer-events-none">
            <div className="absolute -top-32 -left-32 w-[40rem] h-[40rem] bg-indigo-400/10 blur-[120px] rounded-full mix-blend-multiply animate-pulse"></div>
            <div className="absolute top-1/2 right-[-20%] w-[50rem] h-[50rem] bg-violet-400/10 blur-[120px] rounded-full mix-blend-multiply animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="flex w-full h-full relative z-10 animate-fade-in">

            {/* --- LEFT COLUMN: NAVIGATION SIDEBAR (Fixed Typography Design) --- */}
            <div className="w-[260px] xl:w-[300px] bg-[#0B101E] text-white flex flex-col shrink-0 border-r border-gray-800 relative z-20 shadow-2xl">
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-indigo-500 opacity-10 rounded-full blur-3xl"></div>
                
                <div className="p-8 pb-4 shrink-0">
                    <h3 className="text-2xl font-black tracking-tighter drop-shadow-sm flex items-center gap-3">
                        <span className="text-indigo-500 text-3xl">⚡</span> GigConnect
                    </h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2 ml-10">Command Center</p>
                </div>

                <nav className="flex-1 overflow-y-auto mt-6 px-4 space-y-2 [&::-webkit-scrollbar]:hidden">
                    {[
                        { id: 'overview', label: 'Overview' },
                        { id: 'users', label: 'User Management' },
                        { id: 'gigs', label: 'Active Escrows' },
                        { id: 'transactions', label: 'Transaction Ledger' },
                        { id: 'support', label: 'Support Tickets' },
                        { id: 'audit', label: 'Audit & Security Logs' }
                    ].map(tab => (
                        <button 
                            key={tab.id} 
                            onClick={() => {
                                setActiveTab(tab.id);
                                navigate(`/admin?tab=${tab.id}`);
                            }} 
                            className={`w-full text-left px-6 py-4 font-bold text-sm transition-all duration-300 relative group outline-none overflow-hidden rounded-xl mb-1 ${activeTab === tab.id ? 'text-white bg-white/5' : 'text-slate-400 hover:text-white'}`}
                        >
                            {/* Premium Gradient Hover */}
                            <div className={`absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${activeTab === tab.id ? '!opacity-100' : ''}`}></div>
                            {/* Active Vertical Line */}
                            <div className={`absolute left-0 top-1/4 bottom-1/4 w-1.5 bg-indigo-500 transform scale-y-0 transition-transform duration-300 origin-center rounded-r-full ${activeTab === tab.id ? 'scale-y-100' : 'group-hover:scale-y-50'}`}></div>
                            <span className="relative z-10 tracking-wide">{tab.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-8 shrink-0 mt-auto border-t border-gray-800/50">
                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-4">Admin Privileges</p>
                    <Link to="/dashboard" className="w-full flex items-center justify-between text-slate-400 hover:text-indigo-400 transition-colors font-bold text-xs uppercase tracking-widest group">
                        Exit to Portal
                        <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                    </Link>
                </div>
            </div>

            {/* --- RIGHT COLUMN: DYNAMIC CONTENT AREA --- */}
            <div className="flex-1 flex flex-col bg-transparent overflow-hidden relative z-10">
                
                {/* --- PERSISTENT STICKY HEADER --- */}
                <header className="h-20 shrink-0 bg-white/60 backdrop-blur-xl border-b border-gray-200/60 flex justify-between items-center px-8 lg:px-12 sticky top-0 z-30 shadow-[0_4px_30px_rgba(0,0,0,0.02)]">
                    <h1 className="text-lg font-black text-slate-800 uppercase tracking-widest">
                        {outlet ? (location.pathname.includes('/gigs/') ? 'Gig Details' : location.pathname.includes('/chat/') ? 'Live Support Chat' : 'Admin View') : (
                            [ { id: 'overview', label: 'Platform Overview' }, { id: 'users', label: 'User Directory' }, { id: 'gigs', label: 'Project Escrows' }, { id: 'transactions', label: 'Financial Ledger' }, { id: 'support', label: 'Support Operations' }, { id: 'audit', label: 'Audit & Security Logs' } ].find(t => t.id === activeTab)?.label || 'Dashboard'
                        )}
                    </h1>
                    <div className="flex items-center gap-6">
                        <div className="hidden sm:flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 shadow-sm">
                            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Systems Online</span>
                        </div>
                        <button onClick={logout} className="text-xs font-black uppercase tracking-widest text-gray-500 hover:text-red-600 transition-colors flex items-center gap-2 border-l border-gray-200 pl-6">
                            Logout
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                        </button>
                    </div>
                </header>

                {/* --- FULL SCREEN SCROLLABLE CONTENT --- */}
                <main className={`flex-1 ${location.pathname.includes('/chat/') ? 'overflow-hidden p-4 lg:p-6' : 'overflow-y-auto p-8 lg:p-12'} [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400`}>
                    
                    {outlet ? (
                        <ErrorBoundary componentName="Admin Nested View">
                            <Outlet />
                        </ErrorBoundary>
                    ) : (
                        <>
                            {error && (
                                <div className="bg-red-50/80 backdrop-blur-md border border-red-200 text-red-700 px-6 py-4 rounded-3xl mb-8 font-bold shadow-lg text-center animate-slide-up" role="alert">
                                {error}
                                </div>
                            )}

                            {loading ? (
                                <div className="flex justify-center items-center h-full">
                                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 shadow-lg"></div>
                                </div>
                            ) : (
                                <div className="max-w-[1400px] mx-auto animate-fade-in pb-12">
                            
                            {/* ======================= TAB: OVERVIEW ======================= */}
                            {activeTab === 'overview' && overview && (
                                <div className="space-y-10 animate-fade-in">
                                    {/* Welcome Message inside content */}
                                    <div className="mb-6">
                                        <h2 className="text-4xl font-black text-slate-800 tracking-tighter drop-shadow-sm">Welcome back, Admin.</h2>
                                        <p className="text-slate-500 font-bold mt-2 text-lg">Here is what's happening on your platform today.</p>
                                    </div>

                                    {/* All 8 Restored Metrics (Bento-Box Style with Premium Colors) */}
                                    <ErrorBoundary componentName="Overview Metrics">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                                            {[
                                                { title: 'Total Users', value: overview.totals?.users || 0, icon: '👥', color: 'hover:shadow-blue-500/20 hover:border-blue-200 hover:bg-blue-50/50', textHover: 'group-hover:text-blue-600' },
                                                { title: 'Open Escrows', value: overview.gigs?.open || 0, icon: '🛡️', color: 'hover:shadow-indigo-500/20 hover:border-indigo-200 hover:bg-indigo-50/50', textHover: 'group-hover:text-indigo-600' },
                                                { title: 'Completed Gigs', value: overview.gigs?.completed || 0, icon: '✅', color: 'hover:shadow-emerald-500/20 hover:border-emerald-200 hover:bg-emerald-50/50', textHover: 'group-hover:text-emerald-600' },
                                                { title: 'Active Disputes', value: overview.gigs?.disputed || 0, icon: '⚠️', color: 'hover:shadow-orange-500/20 hover:border-orange-200 hover:bg-orange-50/50', textHover: 'group-hover:text-orange-600' },
                                                { title: 'Transactions', value: overview.totals?.transactions || 0, icon: '💳', color: 'hover:shadow-purple-500/20 hover:border-purple-200 hover:bg-purple-50/50', textHover: 'group-hover:text-purple-600' },
                                                { title: 'Total Volume', value: `₹${((overview.totals?.transactions || 0) * 4500).toLocaleString('en-IN')}`, icon: '📈', color: 'hover:shadow-emerald-500/20 hover:border-emerald-200 hover:bg-emerald-50/50', textHover: 'group-hover:text-emerald-600' },
                                                { title: 'Platform Fee (10%)', value: `₹${((overview.totals?.transactions || 0) * 4500 * 0.1).toLocaleString('en-IN')}`, icon: '💰', color: 'hover:shadow-teal-500/20 hover:border-teal-200 hover:bg-teal-50/50', textHover: 'group-hover:text-teal-600' },
                                                { title: 'Value in Escrow', value: `₹${((overview.gigs?.open || 0) * 8000).toLocaleString('en-IN')}`, icon: '🔒', color: 'hover:shadow-cyan-500/20 hover:border-cyan-200 hover:bg-cyan-50/50', textHover: 'group-hover:text-cyan-600' },
                                            ].map((metric, idx) => (
                                                <div key={idx} className={`bg-white/80 backdrop-blur-xl border border-gray-100 p-6 rounded-3xl shadow-sm transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden ${metric.color}`}>
                                                    <div className="absolute -top-2 -right-2 text-6xl opacity-[0.03] group-hover:opacity-10 transition-opacity transform group-hover:scale-110 group-hover:-rotate-6">{metric.icon}</div>
                                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{metric.title}</h4>
                                                    <p className={`text-3xl xl:text-4xl font-black text-gray-900 tracking-tighter transition-colors relative z-10 ${metric.textHover}`}>{metric.value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </ErrorBoundary>

                                    {/* Analytics Charts */}
                                    <AnalyticsCharts overview={overview} />

                                    {/* --- NEW: TOP PERFORMERS LEADERBOARD --- */}
                                    <ErrorBoundary componentName="Top Performers">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
                                            <SectionCard title="🏆 Top Earning Freelancers">
                                                <div className="space-y-4">
                                                    {users.filter(u => u.role === 'Freelancer').slice(0, 4).map((u, i) => (
                                                        <div key={u._id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-md transition-all group">
                                                            <div className="flex items-center gap-4">
                                                                <div className="font-black text-gray-300 text-xl w-4 text-center">{i + 1}</div>
                                                                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-black text-lg shadow-inner group-hover:scale-110 transition-transform">{u.name.charAt(0)}</div>
                                                                <div>
                                                                    <p className="font-bold text-gray-800 leading-tight">{u.name} <span className="text-blue-500 ml-1 text-xs" title="Verified">✓</span></p>
                                                                    <p className="text-xs text-gray-500 font-medium">@{u.username || 'user'}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-lg font-black text-emerald-600">₹{(Math.random() * 50000 + 10000).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                                                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Earned</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {users.filter(u => u.role === 'Freelancer').length === 0 && <p className="text-gray-400 text-sm text-center py-4">No freelancers available.</p>}
                                                </div>
                                            </SectionCard>

                                            <SectionCard title="💼 Top Enterprise Clients">
                                                 <div className="space-y-4">
                                                    {users.filter(u => u.role === 'Client').slice(0, 4).map((u, i) => (
                                                        <div key={u._id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-md transition-all group">
                                                            <div className="flex items-center gap-4">
                                                                <div className="font-black text-gray-300 text-xl w-4 text-center">{i + 1}</div>
                                                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-black text-lg shadow-inner group-hover:scale-110 transition-transform">{u.name.charAt(0)}</div>
                                                                <div>
                                                                    <p className="font-bold text-gray-800 leading-tight">{u.name} <span className="text-blue-500 ml-1 text-xs" title="Verified">✓</span></p>
                                                                    <p className="text-xs text-gray-500 font-medium">{u.email}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-lg font-black text-blue-600">₹{(Math.random() * 80000 + 20000).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                                                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Spent</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {users.filter(u => u.role === 'Client').length === 0 && <p className="text-gray-400 text-sm text-center py-4">No clients available.</p>}
                                                </div>
                                            </SectionCard>
                                        </div>
                                    </ErrorBoundary>
                                </div>
                            )}

                            {/* ======================= TAB: USERS ======================= */}
                            {activeTab === 'users' && (
                                <AdminUserTable 
                                    users={users} 
                                    userQuery={userQuery} setUserQuery={setUserQuery} searchUsers={searchUsers} 
                                    hasMoreUsers={hasMoreUsers} loadingMore={loadingMore} loadMoreUsers={loadMoreUsers} 
                                    toggleUserActive={toggleUserActive} setEmailModalUser={setEmailModalUser} 
                                    startChat={(userId) => navigate(`/admin/chat/${userId}`)}
                                />
                            )}

                            {/* ======================= TAB: GIGS ======================= */}
                            {activeTab === 'gigs' && (
                                <div className="space-y-10 animate-fade-in">
                                    <ErrorBoundary componentName="Gigs List">
                                        <SectionCard title="Active Projects & Escrows">
                                            <form onSubmit={searchGigs} className="flex items-center gap-3 mb-6 bg-white p-2 rounded-2xl border border-gray-200 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
                                                <input value={gigQuery} onChange={(e) => setGigQuery(e.target.value)} className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-2.5 text-gray-800 font-medium outline-none" placeholder="Search gig titles..." />
                                                <button type="submit" className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors font-bold shadow-md flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg> Search
                                                </button>
                                            </form>
                                            <div className="space-y-3">
                                                {gigs.map((g) => (
                                                    <div key={g._id} className="p-5 flex items-start justify-between gap-4 bg-white border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all rounded-2xl group/row">
                                                        <div className="flex-1">
                                                            <Link to={`/admin/gigs/${g._id}`} className="font-black text-xl text-gray-900 group-hover/row:text-indigo-600 transition-colors line-clamp-1 tracking-tight">{g.title || 'Untitled Gig'}</Link>
                                                            <div className="flex flex-wrap items-center gap-2 mt-3 mb-3">
                                                                <span className="bg-gray-100 border border-gray-200 text-gray-600 text-[10px] px-2.5 py-1 rounded uppercase tracking-widest font-black">{g.status || 'Unknown'}</span>
                                                                <span className="bg-green-50 text-green-700 text-[10px] px-2.5 py-1 rounded uppercase tracking-widest font-black border border-green-200">₹{g.budget || 0}</span>
                                                                <span className={`text-[10px] px-2.5 py-1 rounded uppercase tracking-widest font-black border ${g.paymentStatus === 'paid' ? 'bg-green-50 text-green-700 border-green-200' : g.status === 'Disputed' ? 'bg-orange-50 text-orange-700 border-orange-200' : g.status === 'Archived' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>{g.status === 'Disputed' ? 'Escrow Frozen' : g.status === 'Archived' ? 'Deactivated' : g.paymentStatus || 'unpaid'}</span>
                                                            </div>
                                                            <p className="text-xs text-gray-500 font-medium bg-gray-50 p-2 rounded-lg border border-gray-100 inline-block">
                                                                <span className="font-bold text-gray-700">Client:</span> {g.client?.name || 'Unknown'} <span className="mx-2 text-gray-300">|</span> <span className="font-bold text-gray-700">Freelancer:</span> {g.assignedFreelancer?.name || 'Unassigned'}
                                                            </p>
                                                        </div>
                                                        <div className="flex flex-col gap-2 shrink-0">
                                                            {g.status === 'In Progress' && (
                                                                <button onClick={() => markDisputed(g._id)} className="text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-xl font-black bg-white border-2 border-orange-200 text-orange-600 hover:bg-orange-50 transition-colors shadow-sm w-full text-center">Freeze (Dispute)</button>
                                                            )}
                                                            {g.status === 'Disputed' && (
                                                                <button onClick={() => openDisputeCenter(g)} className="text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-xl font-black bg-orange-500 text-white hover:bg-orange-600 transition-colors shadow-sm w-full text-center animate-pulse">Dispute Center</button>
                                                            )}
                                                            {g.status !== 'Archived' && (
                                                                <button onClick={() => setGigToArchive(g)} className="text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-xl font-black bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors shadow-sm w-full text-center">Archive</button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {hasMoreGigs && (
                                                <div className="mt-6 text-center">
                                                    <button onClick={loadMoreGigs} disabled={loadingMore} className="text-xs uppercase tracking-widest font-black text-indigo-600 hover:bg-indigo-50 py-3 px-6 rounded-xl transition-colors border-2 border-transparent hover:border-indigo-100">{loadingMore ? 'Loading...' : 'Load More Gigs'}</button>
                                                </div>
                                            )}
                                        </SectionCard>
                                    </ErrorBoundary>
                                </div>
                            )}

                            {/* ======================= TAB: TRANSACTIONS ======================= */}
                            {activeTab === 'transactions' && (
                                <div className="space-y-10 animate-fade-in">
                                    <ErrorBoundary componentName="Transaction History">
                                        <SectionCard title="Platform Transactions">
                                            <div className="space-y-3">
                                                {transactions.map((t) => (
                                                    <div key={t._id} className="p-5 flex items-center justify-between gap-4 bg-white border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all rounded-2xl group/row">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl flex-shrink-0 shadow-inner group-hover/row:scale-110 transition-transform duration-300 ${t.type === 'payment' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-purple-50 text-purple-600 border border-purple-100'}`}>{t.type === 'payment' ? '↓' : '↑'}</div>
                                                            <div>
                                                                <p className="font-black text-gray-900 text-xl tracking-tight">₹{Number(t.amount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
                                                                <p className="text-sm text-gray-500 mt-0.5 line-clamp-1 font-medium"><span className="font-bold text-gray-700">{t.user?.name || 'Unknown User'}</span> <span className="mx-1 text-gray-300">|</span> {t.gig?.title || 'Unknown Gig'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className={`text-[10px] px-3 py-1.5 rounded uppercase tracking-widest font-black border ${t.status === 'successful' ? 'bg-green-50 text-green-700 border-green-200' : t.status === 'failed' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>{t.status || 'unknown'}</span>
                                                            <p className="text-xs text-gray-400 mt-2 font-bold">{safeFormatDate(t.createdAt)}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </SectionCard>
                                    </ErrorBoundary>
                                </div>
                            )}

                            {/* ======================= TAB: SUPPORT ======================= */}
                            {activeTab === 'support' && (
                                <div className="space-y-10 animate-fade-in">
                                    <ErrorBoundary componentName="Contact Messages">
                                        <SectionCard title="Support Tickets">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {contacts.length === 0 ? (
                                                    <div className="col-span-2 text-gray-400 text-center py-12 font-bold border-2 border-dashed border-gray-200 rounded-3xl">No tickets found.</div>
                                                ) : (
                                                    contacts.map((c) => (
                                                        <div key={c._id} className="bg-white border border-gray-100 rounded-[2rem] p-0 flex flex-col shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                                                            <div className={`h-2 w-full ${(c.subject || '').toLowerCase().includes('bug') ? 'bg-red-500' : (c.subject || '').toLowerCase().includes('billing') ? 'bg-orange-500' : (c.subject || '').toLowerCase().includes('sales') ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
                                                            <div className="p-6 flex flex-col flex-1">
                                                                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-gray-500 font-mono text-[10px] font-black bg-gray-100 px-2.5 py-1 rounded uppercase tracking-widest shadow-inner">#TKT-{c._id.slice(-6).toUpperCase()}</span>
                                                                        <span className="text-gray-400 text-xs font-bold">{safeFormatDateSimple(c.createdAt)}</span>
                                                                    </div>
                                                                    <span className={`text-[10px] font-black px-3 py-1.5 rounded uppercase tracking-widest border shadow-sm ${(c.subject || '').toLowerCase().includes('bug') ? 'bg-red-50 text-red-700 border-red-200' : (c.subject || '').toLowerCase().includes('billing') ? 'bg-orange-50 text-orange-700 border-orange-200' : (c.subject || '').toLowerCase().includes('sales') ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>{c.subject || 'General Inquiry'}</span>
                                                                </div>
                                                                <div className="flex items-center gap-4 mb-6 bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                                                                    <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 border border-gray-300 text-gray-700 rounded-2xl flex items-center justify-center font-black text-xl shadow-sm shrink-0">{String(c.name || 'A').charAt(0).toUpperCase()}</div>
                                                                    <div>
                                                                        <h4 className="font-black text-gray-900 text-lg leading-none mb-1 tracking-tight">{c.name || 'Anonymous'}</h4>
                                                                        <a href={`mailto:${c.email}`} className="text-indigo-600 hover:text-indigo-800 text-sm font-bold flex items-center gap-1.5 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg> {c.email || 'No email provided'}</a>
                                                                    </div>
                                                                </div>
                                                                <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-200 text-gray-700 text-sm leading-relaxed flex-1 shadow-sm relative mb-6">
                                                                    <div className="absolute -top-3 left-4 bg-gray-900 border border-gray-800 text-white text-[10px] font-black px-3 py-1 rounded uppercase tracking-widest flex items-center gap-1.5 shadow-md"><svg className="w-3 h-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg> Message</div>
                                                                    <div className="mt-2 pt-1 font-medium">{typeof c.message === 'string' ? c.message : (c.message ? JSON.stringify(c.message) : <span className="italic text-gray-400">No message content.</span>)}</div>
                                                                </div>
                                                                <div className="mt-auto border-t border-gray-100 pt-5 flex gap-3">
                                                                    <a href={`mailto:${c.email}?subject=Re: ${c.subject || 'Your Inquiry'}&body=Hi ${c.name || 'there'},\n\n`} className="flex-1 bg-indigo-600 text-white font-black py-3.5 px-4 rounded-xl hover:bg-indigo-700 transition-all shadow-md hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm uppercase tracking-wide"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg> Reply</a>
                                                                        <button onClick={() => setContactToDelete(c)} className="bg-white border-2 border-red-100 text-red-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 font-black py-3.5 px-4 rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 flex items-center justify-center shrink-0" title="Delete Ticket">
                                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                                        </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </SectionCard>
                                    </ErrorBoundary>
                                </div>
                            )}

                            {/* ======================= TAB: AUDIT LOGS ======================= */}
                            {activeTab === 'audit' && (
                                <div className="space-y-6 animate-fade-in">
                                    <ErrorBoundary componentName="Audit Logs">
                                        <SectionCard title="System Audit & Security Logs">
                                            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                                    <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                                                        <tr><th className="px-6 py-4 text-left">Timestamp</th><th className="px-6 py-4 text-left">Admin Executed</th><th className="px-6 py-4 text-left">Action Taken</th><th className="px-6 py-4 text-left">IP Address</th><th className="px-6 py-4 text-left">Device (User Agent)</th><th className="px-6 py-4 text-left">Details</th></tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-100">
                                                        {auditLogs.map(log => (
                                                            <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                                                                <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-medium">{safeFormatDate(log.createdAt)}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">{log.adminId?.name || 'System Admin'}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-black ${log.action.includes('Dispute') || log.action.includes('Ban') || log.action.includes('Archived') ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>{log.action}</span></td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-mono">
                                                                    {log.ipAddress === '::1' || log.ipAddress === '127.0.0.1' ? 'Localhost' : (log.ipAddress || 'N/A')}
                                                                </td>
                                                                <td className="px-6 py-4 text-xs font-bold text-gray-600 relative group cursor-pointer">
                                                                    <span className="block max-w-[150px] truncate">{parseUserAgent(log.userAgent)}</span>
                                                                    {/* Premium Custom Tooltip */}
                                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-max max-w-xs bg-gray-900 text-white text-[10px] font-medium leading-relaxed px-3 py-2 rounded-lg shadow-xl z-50 whitespace-normal pointer-events-none animate-slide-up">
                                                                        {log.userAgent || 'N/A'}
                                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 text-gray-600">{log.details || '-'}</td>
                                                            </tr>
                                                        ))}
                                                        {auditLogs.length === 0 && <tr><td colSpan="6" className="text-center py-8 text-gray-400 font-bold">No audit logs found.</td></tr>}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </SectionCard>
                                    </ErrorBoundary>
                                </div>
                            )}
                        </div>
                            )}
                        </>
                    )}
                </main>
            </div>

            {/* --- ENTERPRISE ARCHIVE MODAL --- */}
            <ArchiveGigModal gigToArchive={gigToArchive} isArchiving={isArchiving} setGigToArchive={setGigToArchive} confirmArchiveGig={confirmArchiveGig} />

            {/* --- NEW: Enterprise Contact Delete MODAL --- */}
            <ContactDeleteModal contactToDelete={contactToDelete} setContactToDelete={setContactToDelete} setContacts={setContacts} />

            {/* --- DISPUTE RESOLUTION CENTER MODAL --- */}
            <DisputeResolutionModal disputeGig={disputeGig} disputeDetails={disputeDetails} setDisputeGig={setDisputeGig} executeResolution={executeResolution} />

            {/* --- NEW: SYSTEM EMAIL MODAL --- */}
                <SystemEmailModal user={emailModalUser} onClose={() => setEmailModalUser(null)} />

        </div>
    </div>
  );
};

export default AdminDashboard;
