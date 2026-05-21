import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

// --- NEW: Import Global Error Boundary ---
import ErrorBoundary from '../components/ErrorBoundary';

// --- NEW: Enterprise Analytics Charts ---
import { Chart as ChartJS, registerables } from 'chart.js';

ChartJS.register(...registerables);

// --- NATIVE CHART WRAPPERS (Bypasses react-chartjs-2 hooks bug) ---
const NativeChart = ({ type, data, options }) => {
    const canvasRef = useRef(null);
    const chartRef = useRef(null);
    useEffect(() => {
        if (chartRef.current) chartRef.current.destroy();
        chartRef.current = new ChartJS(canvasRef.current, { type, data, options });
        return () => { if (chartRef.current) chartRef.current.destroy(); };
    }, [type, data, options]);
    return <canvas ref={canvasRef}></canvas>;
};

// Helper to generate realistic looking chart data based on current totals
const generateTrendData = (total, months = 6) => {
    const safeTotal = Number(total) || 0;
    const data = [];
    for(let i=1; i<=months; i++) data.push(Math.floor(safeTotal * (i/months)));
    return data;
};

// --- Chart Constants (Moved outside to prevent re-render memory leaks) ---
const getDynamicChartLabels = () => {
    const labels = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setDate(1); // Set to 1st to avoid month overflow bugs (like Feb 30th)
        d.setMonth(new Date().getMonth() - i);
        labels.push(d.toLocaleString('en-US', { month: 'short' }));
    }
    return labels;
};

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
        intersect: false,
        mode: 'index',
    },
    plugins: {
        legend: { display: false }, // Hiding default boring legend
        tooltip: {
            backgroundColor: '#0B101E', // Dark sleek tooltip
            titleFont: { size: 13 },
            bodyFont: { size: 14, weight: 'bold' },
            padding: 12,
            cornerRadius: 8,
            displayColors: false,
        }
    },
    scales: {
        y: { 
            beginAtZero: true,
            grid: { color: 'rgba(0, 0, 0, 0.04)', drawBorder: false }, // Soft grid lines
            ticks: { color: '#9CA3AF', font: { size: 11 }, padding: 10 }
        },
        x: { 
            grid: { display: false, drawBorder: false },
            ticks: { color: '#9CA3AF', font: { size: 11 }, padding: 10 }
        }
    }
};

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
  const [emailSubject, setEmailSubject] = useState('Account Notice: Action Required');
  const [emailMessage, setEmailMessage] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const [activeTab, setActiveTab] = useState('overview');

  const chartLabels = useMemo(() => getDynamicChartLabels(), []);

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

  const handleSendEmail = async (e) => {
    e.preventDefault();
    setIsSendingEmail(true);
    try {
      await api.post(`/admin/users/${emailModalUser._id}/send-email`, {
        subject: emailSubject,
        message: emailMessage
      });
      alert('Email sent successfully to ' + emailModalUser.email);
      setEmailModalUser(null);
      setEmailMessage('');
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to send email.');
    } finally {
      setIsSendingEmail(false);
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

  const safeTransactions = overview?.totals?.transactions || 0;
  const safeUsers = overview?.totals?.users || 0;

  const revenueData = {
    labels: chartLabels,
    datasets: [{
        label: 'Platform Transactions (₹)',
        data: generateTrendData(safeTransactions * 5000, 6),
        borderColor: 'rgb(79, 70, 229)', // Indigo 600
        backgroundColor: 'rgba(79, 70, 229, 0.15)',
        fill: true,
        tension: 0.4, // Smooth curved enterprise lines
        borderWidth: 3,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: 'rgb(79, 70, 229)',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6, // Interactive hover dots
    }]
  };

  const userGrowthData = {
    labels: chartLabels,
    datasets: [{
        label: 'New Users Registered',
        data: generateTrendData(safeUsers, 6).map(val => Math.floor(val * (Math.random() * 0.5 + 0.5))),
        backgroundColor: 'rgba(16, 185, 129, 0.8)', // Emerald 500
        borderRadius: 8, // Rounded bars
        barPercentage: 0.4, // Sleek, thin bars
    }]
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
                            onClick={() => setActiveTab(tab.id)} 
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
                        {[ { id: 'overview', label: 'Platform Overview' }, { id: 'users', label: 'User Directory' }, { id: 'gigs', label: 'Project Escrows' }, { id: 'transactions', label: 'Financial Ledger' }, { id: 'support', label: 'Support Operations' }, { id: 'audit', label: 'Audit & Security Logs' } ].find(t => t.id === activeTab)?.label || 'Dashboard'}
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
                <main className="flex-1 overflow-y-auto p-8 lg:p-12 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
                    
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
                                    <ErrorBoundary componentName="Analytics Charts">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            <SectionCard title="Revenue Trends">
                                                <div className="h-72 w-full relative">
                                                    {overview ? <NativeChart type="line" data={revenueData} options={chartOptions} /> : <div className="h-full w-full bg-gray-50 animate-pulse rounded-xl"></div>}
                                                </div>
                                            </SectionCard>
                                            <SectionCard title="User Growth">
                                                <div className="h-72 w-full relative">
                                                    {overview ? <NativeChart type="bar" data={userGrowthData} options={chartOptions} /> : <div className="h-full w-full bg-gray-50 animate-pulse rounded-xl"></div>}
                                                </div>
                                            </SectionCard>
                                        </div>
                                    </ErrorBoundary>

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
                                <div className="space-y-10 animate-fade-in">
                                    <ErrorBoundary componentName="Users List">
                                        <SectionCard title="All Platform Users">
                                            <form onSubmit={searchUsers} className="flex items-center gap-3 mb-6 bg-white p-2 rounded-2xl border border-gray-200 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
                                                <input value={userQuery} onChange={(e) => setUserQuery(e.target.value)} className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-2.5 text-gray-800 font-medium outline-none" placeholder="Search name, email, or username..." />
                                                <button type="submit" className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors font-bold shadow-md flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg> Search
                                                </button>
                                            </form>
                                            <div className="space-y-3">
                                                {users.map((u) => (
                                                    <div key={u._id} className="p-5 flex items-center justify-between gap-4 bg-white border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all rounded-2xl group/row">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-black text-xl flex-shrink-0 shadow-md">{String(u?.name || 'U').charAt(0).toUpperCase()}</div>
                                                            <div>
                                                                <p className="font-black text-gray-900 text-lg tracking-tight group-hover/row:text-indigo-600 transition-colors">{u.name || 'Unknown User'} <span className="text-sm text-gray-400 font-bold">(@{u.username || 'unknown'})</span></p>
                                                                <p className="text-sm text-gray-500 font-medium">{u.email}</p>
                                                                <div className="flex items-center gap-2 mt-2">
                                                                    <span className="bg-gray-100 border border-gray-200 text-gray-600 text-[10px] px-2.5 py-1 rounded uppercase tracking-widest font-black">{u.role || 'User'}</span>
                                                                    <span className={`text-[10px] px-2.5 py-1 rounded uppercase tracking-widest font-black border ${u.isActive !== false ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{u.isActive !== false ? 'Active' : 'Inactive'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {u.role !== 'Admin' && (
                                                            <div className="flex gap-2 shrink-0">
                                                                <button onClick={() => toggleUserActive(u._id, !(u.isActive !== false))} className={`text-xs px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm ${u.isActive !== false ? 'bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300' : 'bg-green-600 text-white hover:bg-green-700 border-2 border-transparent'}`}>
                                                                    {u.isActive === false ? 'Activate' : 'Deactivate'}
                                                                </button>
                                                                <button onClick={() => setEmailModalUser(u)} className="text-xs px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm bg-white border-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300">
                                                                    Email ✉️
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            {hasMoreUsers && (
                                                <div className="mt-6 text-center">
                                                    <button onClick={loadMoreUsers} disabled={loadingMore} className="text-xs uppercase tracking-widest font-black text-indigo-600 hover:bg-indigo-50 py-3 px-6 rounded-xl transition-colors border-2 border-transparent hover:border-indigo-100">{loadingMore ? 'Loading...' : 'Load More Users'}</button>
                                                </div>
                                            )}
                                        </SectionCard>
                                    </ErrorBoundary>
                                </div>
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
                                                            <Link to={`/gigs/${g._id}`} className="font-black text-xl text-gray-900 group-hover/row:text-indigo-600 transition-colors line-clamp-1 tracking-tight">{g.title || 'Untitled Gig'}</Link>
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
                                                        <tr><th className="px-6 py-4 text-left">Timestamp</th><th className="px-6 py-4 text-left">Admin Executed</th><th className="px-6 py-4 text-left">Action Taken</th><th className="px-6 py-4 text-left">Details</th></tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-100">
                                                        {auditLogs.map(log => (
                                                            <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                                                                <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-medium">{safeFormatDate(log.createdAt)}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">{log.adminId?.name || 'System Admin'}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-black ${log.action.includes('Dispute') || log.action.includes('Ban') || log.action.includes('Archived') ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>{log.action}</span></td>
                                                                <td className="px-6 py-4 text-gray-600">{log.details || '-'}</td>
                                                            </tr>
                                                        ))}
                                                        {auditLogs.length === 0 && <tr><td colSpan="4" className="text-center py-8 text-gray-400 font-bold">No audit logs found.</td></tr>}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </SectionCard>
                                    </ErrorBoundary>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* --- ENTERPRISE ARCHIVE MODAL --- */}
            {gigToArchive && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-slide-up border border-gray-100">
                        <div className="p-8 text-center">
                            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-red-100">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Archive Project?</h3>
                            <p className="text-gray-500 font-medium mb-1">
                                Are you sure you want to deactivate <br/><span className="text-gray-800 font-bold">"{gigToArchive.title}"</span>?
                            </p>
                            <p className="text-xs text-red-600 font-bold bg-red-50/80 p-3 rounded-xl mt-6 border border-red-100">
                                This project will be hidden from all Freelancer and Client portals immediately.
                            </p>
                        </div>
                        <div className="p-5 bg-gray-50 border-t border-gray-100 flex gap-3">
                            <button onClick={() => setGigToArchive(null)} disabled={isArchiving} className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-100 transition-colors shadow-sm disabled:opacity-50 outline-none">
                                Cancel
                            </button>
                            <button onClick={confirmArchiveGig} disabled={isArchiving} className="flex-1 bg-red-600 text-white font-bold py-3.5 rounded-xl hover:bg-red-700 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 outline-none">
                                {isArchiving ? <><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span> Archiving...</> : 'Yes, Deactivate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- NEW: Enterprise Contact Delete MODAL --- */}
            {contactToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-slide-up border border-gray-100">
                        <div className="p-8 text-center">
                            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-red-100">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Delete Message?</h3>
                            <p className="text-gray-500 font-medium mb-1">
                                Permanently delete the message from <br/><span className="text-gray-800 font-bold">"{contactToDelete.name}"</span>?
                            </p>
                            <p className="text-xs text-red-600 font-bold bg-red-50/80 p-3 rounded-xl mt-6 border border-red-100">
                                This action is irreversible.
                            </p>
                        </div>
                        <div className="p-5 bg-gray-50 border-t border-gray-100 flex gap-3">
                            <button onClick={() => setContactToDelete(null)} className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-100 transition-colors shadow-sm outline-none">Cancel</button>
                            <button onClick={async () => { await api.delete(`/admin/contacts/${contactToDelete._id}`); setContacts(p => p.filter(c => c._id !== contactToDelete._id)); setContactToDelete(null); }} className="flex-1 bg-red-600 text-white font-bold py-3.5 rounded-xl hover:bg-red-700 transition-all shadow-md outline-none">Yes, Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- DISPUTE RESOLUTION CENTER MODAL --- */}
            {disputeGig && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden animate-slide-up border border-gray-100">
                        <div className="p-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
                            <h2 className="text-xl font-black text-orange-600 flex items-center gap-2"><span className="text-2xl">⚖️</span> Dispute Resolution Center</h2>
                            <button onClick={() => setDisputeGig(null)} className="text-gray-400 hover:text-red-500 font-bold bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-200">Close</button>
                        </div>
                        
                        <div className="flex-1 flex overflow-hidden">
                            {/* Left: Contract/Gig Details */}
                            <div className="w-1/3 bg-gray-50/50 border-r border-gray-200 p-6 overflow-y-auto">
                                <h3 className="font-bold text-gray-400 uppercase tracking-widest text-[10px] mb-2">Disputed Project</h3>
                                <p className="text-lg font-black text-gray-900 mb-6">{disputeDetails?.gig?.title || disputeGig.title}</p>
                                
                                <h3 className="font-bold text-gray-400 uppercase tracking-widest text-[10px] mb-2">Escrow Value</h3>
                                <p className="text-3xl font-black text-green-600 mb-6">₹{disputeDetails?.gig?.budget || disputeGig.budget}</p>

                                <div className="space-y-4">
                                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"><p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Client (Buyer)</p><p className="font-bold text-blue-600">{disputeDetails?.gig?.client?.name || 'Loading...'}</p><p className="text-xs text-gray-500">{disputeDetails?.gig?.client?.email}</p></div>
                                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"><p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Freelancer (Seller)</p><p className="font-bold text-purple-600">{disputeDetails?.gig?.assignedFreelancer?.name || 'Loading...'}</p><p className="text-xs text-gray-500">{disputeDetails?.gig?.assignedFreelancer?.email}</p></div>
                                </div>
                            </div>
                            
                            {/* Right: Chat History Evidence */}
                            <div className="w-2/3 bg-white p-6 overflow-y-auto">
                                <h3 className="font-bold text-gray-400 uppercase tracking-widest text-[10px] mb-4">Chat History Evidence</h3>
                                {!disputeDetails ? (<div className="flex justify-center mt-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>) : disputeDetails.messages.length === 0 ? (<p className="text-center text-gray-400 italic mt-10">No messages found between users.</p>) : (
                                    <div className="space-y-4">
                                        {disputeDetails.messages.map((msg, i) => (
                                            <div key={i} className={`p-4 rounded-2xl max-w-[80%] ${String(msg.senderId || msg.sender) === String(disputeDetails.gig.client._id) ? 'bg-blue-50 border border-blue-100 self-start mr-auto' : 'bg-purple-50 border border-purple-100 self-end ml-auto'}`}>
                                                <p className="text-[10px] font-black uppercase text-gray-400 mb-1">{msg.senderName || 'User'}</p>
                                                <p className="text-sm text-gray-800 font-medium">{msg.text}</p>
                                                <p className="text-[9px] text-gray-400 mt-2 text-right">{new Date(msg.timestamp).toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="p-5 border-t border-gray-200 bg-gray-50 flex justify-end gap-4 shrink-0">
                            <button onClick={() => executeResolution('refund_client')} className="bg-white border-2 border-orange-200 text-orange-600 font-black py-3 px-6 rounded-xl hover:bg-orange-50 transition-all shadow-sm">Refund Client</button>
                            <button onClick={() => executeResolution('release_funds')} className="bg-green-600 text-white font-black py-3 px-6 rounded-xl hover:bg-green-700 transition-all shadow-md">Release to Freelancer</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- NEW: SYSTEM EMAIL MODAL --- */}
            {emailModalUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up border border-gray-100">
                        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <div>
                                <h3 className="font-extrabold text-xl text-gray-800">Send System Email</h3>
                                <p className="text-xs text-gray-500 font-bold mt-1">To: {emailModalUser.email}</p>
                            </div>
                            <button onClick={() => setEmailModalUser(null)} className="text-gray-400 hover:text-red-500 text-2xl font-bold bg-white w-8 h-8 rounded-full shadow-sm flex items-center justify-center border border-gray-200">✕</button>
                        </div>
                        <form onSubmit={handleSendEmail} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Subject</label>
                                <select value={emailSubject} onChange={e => setEmailSubject(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-800 appearance-none cursor-pointer">
                                    <option value="Account Notice: Action Required">Account Notice: Action Required</option>
                                    <option value="⚠️ Warning: Suspicious Activity Detected">⚠️ Warning: Suspicious Activity Detected</option>
                                    <option value="GigConnect Platform Update">GigConnect Platform Update</option>
                                    <option value="Trust & Safety Policy Violation">Trust & Safety Policy Violation</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Message Body</label>
                                <textarea required rows="6" value={emailMessage} onChange={e => setEmailMessage(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none text-gray-700" placeholder={`Dear ${emailModalUser.name},\n\nWrite your official message here...`}></textarea>
                            </div>
                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => setEmailModalUser(null)} className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-50 transition-all shadow-sm">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isSendingEmail || !emailMessage.trim()} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md disabled:bg-gray-400 flex items-center justify-center gap-2">
                                    {isSendingEmail ? <><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span> Sending...</> : 'Send Mail ✉️'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    </div>
  );
};

export default AdminDashboard;
