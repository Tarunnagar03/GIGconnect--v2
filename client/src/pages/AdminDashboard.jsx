import React, { useEffect, useState, useContext } from 'react';
import { Link, Navigate } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

const SectionCard = ({ title, children }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h2 className="text-xl font-bold mb-4">{title}</h2>
    {children}
  </div>
);

const AdminDashboard = () => {
  const { auth } = useContext(AuthContext);
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [gigs, setGigs] = useState([]);
  const [transactions, setTransactions] = useState([]);
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

  const searchUsers = async () => {
    try {
      const res = await api.get(`/admin/users?q=${encodeURIComponent(userQuery)}&limit=25`);
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const searchGigs = async () => {
    try {
      const res = await api.get(`/admin/gigs?q=${encodeURIComponent(gigQuery)}&limit=25`);
      setGigs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <Link to="/dashboard" className="inline-block mb-6 text-blue-600 hover:underline">
        &larr; Back to Dashboard
      </Link>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <p>Loading admin data...</p>
      ) : (
        <>
          {overview && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <SectionCard title="Totals">
                <p><span className="font-semibold">Users:</span> {overview.totals.users}</p>
                <p><span className="font-semibold">Gigs:</span> {overview.totals.gigs}</p>
                <p><span className="font-semibold">Transactions:</span> {overview.totals.transactions}</p>
              </SectionCard>
              <SectionCard title="Gigs status">
                <p><span className="font-semibold">Open:</span> {overview.gigs.open}</p>
                <p><span className="font-semibold">Completed:</span> {overview.gigs.completed}</p>
              </SectionCard>
              <SectionCard title="Actions">
                <p className="text-gray-600 text-sm">
                  Use search below to manage users/gigs quickly.
                </p>
              </SectionCard>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionCard title="Users">
              <div className="flex gap-2 mb-4">
                <input
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  placeholder="Search name/email/username"
                />
                <button onClick={searchUsers} className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700">
                  Search
                </button>
              </div>
              <div className="space-y-3">
                {users.map((u) => (
                  <div key={u._id} className="border rounded-md p-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{u.name} <span className="text-xs text-gray-500">(@{u.username})</span></p>
                      <p className="text-sm text-gray-600">{u.email}</p>
                      <p className="text-xs text-gray-500">Role: {u.role} • Active: {String(u.isActive !== false)}</p>
                    </div>
                    {u.role !== 'Admin' && (
                      <button
                        onClick={() => toggleUserActive(u._id, !(u.isActive !== false))}
                        className="text-sm px-3 py-1 rounded border hover:bg-gray-50"
                      >
                        {u.isActive === false ? 'Activate' : 'Deactivate'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Gigs">
              <div className="flex gap-2 mb-4">
                <input
                  value={gigQuery}
                  onChange={(e) => setGigQuery(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  placeholder="Search gigs"
                />
                <button onClick={searchGigs} className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700">
                  Search
                </button>
              </div>
              <div className="space-y-3">
                {gigs.map((g) => (
                  <div key={g._id} className="border rounded-md p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{g.title}</p>
                        <p className="text-xs text-gray-500">
                          Status: {g.status} • Budget: ${g.budget} • Payment: {g.paymentStatus || 'unpaid'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Client: {g.client?.name} • Assigned: {g.assignedFreelancer?.name || '—'}
                        </p>
                      </div>
                      <button onClick={() => deleteGig(g._id)} className="text-sm px-3 py-1 rounded border border-red-300 text-red-700 hover:bg-red-50">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          <div className="mt-6">
            <SectionCard title="Recent transactions">
              <div className="space-y-2">
                {transactions.map((t) => (
                  <div key={t._id} className="border rounded-md p-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">${t.amount} <span className="text-xs text-gray-500">({t.type}/{t.status})</span></p>
                      <p className="text-xs text-gray-500">
                        User: {t.user?.name} • Gig: {t.gig?.title || '—'}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">{new Date(t.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;

