import React, { useEffect, useState, useContext } from 'react';
import { Link, Navigate } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

const SectionCard = ({ title, children, action }) => (
    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">{title}</h2>
          {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  );

const AdminDashboard = () => {
  const { auth } = useContext(AuthContext);
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [gigs, setGigs] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [userQuery, setUserQuery] = useState('');
  const [gigQuery, setGigQuery] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [o, u, g, t] = await Promise.all([
          api.get('/admin/overview'),
          api.get('/admin/users?limit=25'),
          api.get('/admin/gigs?limit=25'),
          api.get('/admin/transactions?limit=25')
        ]);
        setOverview(o.data);
        setUsers(u.data);
        setGigs(g.data);
        setTransactions(t.data);
        
        // Fetch contacts separately so it doesn't break the whole dashboard if it fails
        try {
          const cRes = await api.get('/admin/contacts');
          setContacts(Array.isArray(cRes.data) ? cRes.data : []);
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

  if (!auth?.isAuthenticated) return <Navigate to="/" />;
  if (auth.user?.role !== 'Admin') return <Navigate to="/dashboard" />;

  const toggleUserActive = async (userId, isActive) => {
    try {
      const res = await api.put(`/admin/users/${userId}/active`, { isActive });
      setUsers((prev) => prev.map((u) => (u._id === res.data._id ? res.data : u)));
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to update user.');
    }
  };

  const deleteGig = async (gigId) => {
    if (!window.confirm('Delete this gig?')) return;
    try {
      await api.delete(`/admin/gigs/${gigId}`);
      setGigs((prev) => prev.filter((g) => g._id !== gigId));
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to delete gig.');
    }
  };

  const searchUsers = async (e) => {
    if (e) e.preventDefault();
    try {
      const res = await api.get(`/admin/users?q=${encodeURIComponent(userQuery)}&limit=25`);
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const searchGigs = async (e) => {
    if (e) e.preventDefault();
    try {
      const res = await api.get(`/admin/gigs?q=${encodeURIComponent(gigQuery)}&limit=25`);
      setGigs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in pb-12">
      {/* --- Premium VIP Header --- */}
      <div className="relative overflow-hidden rounded-3xl p-8 md:p-10 mb-8 text-white shadow-lg bg-gradient-to-r from-blue-900 to-slate-800">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-40 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
              <Link to="/dashboard" className="inline-flex items-center gap-2 mb-6 text-blue-200 hover:text-white font-semibold bg-white/10 hover:bg-white/20 border border-white/10 px-4 py-2 rounded-full transition-all group">
                  <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                  Back to Dashboard
              </Link>
              <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">Admin Control Panel</h1>
              <p className="text-lg text-blue-100 font-medium max-w-2xl">Manage users, monitor gigs, and oversee platform activity with real-time insights.</p>
          </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-8 font-bold shadow-sm text-center" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {overview && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl shadow-sm hover:-translate-y-1 transition-transform">
                    <h4 className="text-blue-800 font-bold mb-1 text-sm uppercase tracking-wider">Total Users</h4>
                    <p className="text-4xl font-extrabold text-blue-600">{overview.totals?.users || 0}</p>
                </div>
                <div className="bg-purple-50 border border-purple-100 p-6 rounded-3xl shadow-sm hover:-translate-y-1 transition-transform">
                    <h4 className="text-purple-800 font-bold mb-1 text-sm uppercase tracking-wider">Total Gigs</h4>
                    <p className="text-4xl font-extrabold text-purple-600">{overview.totals?.gigs || 0}</p>
                </div>
                <div className="bg-green-50 border border-green-100 p-6 rounded-3xl shadow-sm hover:-translate-y-1 transition-transform">
                    <h4 className="text-green-800 font-bold mb-1 text-sm uppercase tracking-wider">Transactions</h4>
                    <p className="text-4xl font-extrabold text-green-600">{overview.totals?.transactions || 0}</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-100 p-6 rounded-3xl shadow-sm hover:-translate-y-1 transition-transform">
                    <h4 className="text-yellow-800 font-bold mb-1 text-sm uppercase tracking-wider">Open Gigs</h4>
                    <p className="text-4xl font-extrabold text-yellow-600">{overview.gigs?.open || 0}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl shadow-sm hover:-translate-y-1 transition-transform">
                    <h4 className="text-emerald-800 font-bold mb-1 text-sm uppercase tracking-wider">Completed Gigs</h4>
                    <p className="text-4xl font-extrabold text-emerald-600">{overview.gigs?.completed || 0}</p>
                </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <SectionCard title="Users">
              <form onSubmit={searchUsers} className="flex items-center gap-3 mb-6 bg-gray-50 p-2 rounded-full border border-gray-200">
                <input
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-2 text-gray-700 outline-none"
                  placeholder="Search name, email, or username..."
                />
                <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition-colors font-bold shadow-sm">
                  Search
                </button>
              </form>
              <div className="space-y-0">
                {users.map((u) => (
                  <div key={u._id} className="border-b border-gray-100 last:border-0 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors rounded-xl px-3 -mx-3">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-sm">
                            {(u?.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 text-lg">{u.name || 'Unknown User'} <span className="text-sm text-gray-500 font-medium">(@{u.username || 'unknown'})</span></p>
                            <p className="text-sm text-gray-600">{u.email}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-md font-semibold">{u.role || 'User'}</span>
                                <span className={`text-xs px-2.5 py-1 rounded-md font-semibold ${u.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {u.isActive !== false ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    </div>
                    {u.role !== 'Admin' && (
                      <button
                        onClick={() => toggleUserActive(u._id, !(u.isActive !== false))}
                        className={`text-sm px-5 py-2.5 rounded-full font-bold transition-colors ${u.isActive !== false ? 'bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300' : 'bg-green-600 text-white hover:bg-green-700'}`}
                      >
                        {u.isActive === false ? 'Activate' : 'Deactivate'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Gigs">
              <form onSubmit={searchGigs} className="flex items-center gap-3 mb-6 bg-gray-50 p-2 rounded-full border border-gray-200">
                <input
                  value={gigQuery}
                  onChange={(e) => setGigQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-2 text-gray-700 outline-none"
                  placeholder="Search gig titles..."
                />
                <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition-colors font-bold shadow-sm">
                  Search
                </button>
              </form>
              <div className="space-y-0">
                {gigs.map((g) => (
                  <div key={g._id} className="border-b border-gray-100 last:border-0 py-4 flex items-start justify-between gap-4 hover:bg-gray-50 transition-colors rounded-xl px-3 -mx-3">
                    <div className="flex-1">
                      <Link to={`/gigs/${g._id}`} className="font-bold text-lg text-blue-600 hover:underline line-clamp-1">{g.title || 'Untitled Gig'}</Link>
                      <div className="flex flex-wrap items-center gap-2 mt-2 mb-2">
                          <span className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-md font-semibold">{g.status || 'Unknown'}</span>
                          <span className="bg-green-50 text-green-700 text-xs px-2.5 py-1 rounded-md font-semibold border border-green-100">₹{g.budget || 0}</span>
                          <span className={`text-xs px-2.5 py-1 rounded-md font-semibold ${g.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {g.paymentStatus || 'unpaid'}
                          </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        <span className="font-medium text-gray-700">Client:</span> {g.client?.name || 'Unknown'} &bull; <span className="font-medium text-gray-700">Freelancer:</span> {g.assignedFreelancer?.name || 'Unassigned'}
                      </p>
                    </div>
                    <button onClick={() => deleteGig(g._id)} className="text-sm px-5 py-2.5 rounded-full font-bold bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors flex-shrink-0 shadow-sm mt-1">
                        Delete
                    </button>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          <div className="mt-8">
            <SectionCard title="Recent Transactions">
              <div className="space-y-0">
                {transactions.map((t) => (
                  <div key={t._id} className="border-b border-gray-100 last:border-0 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors rounded-xl px-3 -mx-3">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-sm ${t.type === 'payment' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                            {t.type === 'payment' ? '↓' : '↑'}
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 text-lg">₹{t.amount?.toFixed(2) || '0.00'}</p>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                                <span className="font-semibold text-gray-700">{t.user?.name || 'Unknown User'}</span> &bull; {t.gig?.title || 'Unknown Gig'}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className={`text-xs px-3 py-1.5 rounded-md font-bold uppercase tracking-wider ${t.status === 'successful' ? 'bg-green-100 text-green-700' : t.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {t.status || 'unknown'}
                        </span>
                        <p className="text-xs text-gray-400 mt-2 font-medium">{new Date(t.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          <div className="mt-8">
            <SectionCard title="Contact Us Messages">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {contacts.length === 0 ? (
                  <p className="text-gray-500 col-span-2 text-center py-8">No messages found.</p>
                ) : (
                  contacts.map((c) => (
                    <div key={c._id} className="border border-gray-100 rounded-3xl p-6 flex flex-col gap-4 bg-gray-50 hover:bg-white hover:shadow-lg transition-all hover:-translate-y-1">
                        <div className="flex justify-between items-start gap-2">
                            <div>
                                <p className="font-bold text-gray-900 text-lg">{c.name || 'Anonymous'}</p>
                                <a href={`mailto:${c.email}`} className="text-blue-600 hover:underline text-sm font-medium">{c.email || 'No email'}</a>
                            </div>
                            <p className="text-xs text-gray-500 font-medium whitespace-nowrap bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">{new Date(c.createdAt || Date.now()).toLocaleDateString()}</p>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 text-gray-700 text-sm leading-relaxed flex-1 shadow-inner">
                            {c.message || <span className="italic text-gray-400">No message provided</span>}
                        </div>
                    </div>
                  ))
                )}
              </div>
            </SectionCard>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
