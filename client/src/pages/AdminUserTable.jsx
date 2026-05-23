import React from 'react';

const safeFormatDate = (dateString) => {
    try {
        if (!dateString) return 'Never';
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return 'Never';
        return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return 'Never';
    }
};

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

const AdminUserTable = ({ users, userQuery, setUserQuery, searchUsers, hasMoreUsers, loadingMore, loadMoreUsers, toggleUserActive, setEmailModalUser, startChat }) => {
    return (
        <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-gray-200/50">
            <div className="flex justify-between items-center mb-6 border-b border-gray-200/60 pb-4">
                <h3 className="text-xl font-bold text-slate-800 tracking-tight">User Directory</h3>
            </div>
            <form onSubmit={searchUsers} className="flex items-center gap-3 mb-6 bg-white p-2 rounded-2xl border border-gray-200 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                <input value={userQuery} onChange={(e) => setUserQuery(e.target.value)} className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-2.5 text-gray-800 font-medium outline-none" placeholder="Search by name or email..." />
                <button type="submit" className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors font-bold shadow-md">Search</button>
            </form>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-gray-200">
                            <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest">User</th>
                            <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest">Role</th>
                            <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                            <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest">Network & Device</th>
                            <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-widest">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u._id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                                <td className="p-4">
                                    <p className="font-bold text-gray-900">{u.name}</p>
                                    <p className="text-xs text-gray-500">{u.email}</p>
                                </td>
                                <td className="p-4"><span className="bg-gray-100 text-gray-600 text-[10px] px-2.5 py-1 rounded uppercase font-bold">{u.role}</span></td>
                                <td className="p-4">
                                    <span className={`text-[10px] px-2.5 py-1 rounded uppercase font-bold ${u.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                        {u.isActive ? 'Active' : 'Banned'}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <p className="text-xs text-gray-900 font-bold mb-1">
                                        IP: <span className="font-mono text-gray-500 font-normal">{u.lastIpAddress === '::1' || u.lastIpAddress === '127.0.0.1' ? 'Localhost' : (u.lastIpAddress || 'N/A')}</span>
                                    </p>
                                    <div className="text-[10px] font-bold text-gray-600 relative group cursor-pointer w-max">
                                        <span className="block max-w-[150px] truncate">{parseUserAgent(u.lastUserAgent)}</span>
                                        {/* Premium Custom Tooltip */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-max max-w-xs bg-gray-900 text-white text-[10px] font-medium leading-relaxed px-3 py-2 rounded-lg shadow-xl z-50 whitespace-normal pointer-events-none animate-slide-up">
                                            {u.lastUserAgent || 'N/A'}
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1 font-medium">Last Login: {safeFormatDate(u.lastLogin || u.date)}</p>
                                </td>
                                <td className="p-4 flex gap-2">
                                {u.role !== 'Admin' ? (
                                    <>
                                    <button onClick={() => toggleUserActive(u._id, !u.isActive)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${u.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                                        {u.isActive ? 'Ban' : 'Unban'}
                                    </button>
                                    <button onClick={() => setEmailModalUser(u)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100">Email</button>
                                    <button onClick={() => startChat(u._id)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-50 text-purple-600 hover:bg-purple-100">Message</button>
                                    </>
                                ) : (
                                    <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-400 cursor-not-allowed select-none" title="System Admins are protected from actions">Protected</span>
                                )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {hasMoreUsers && (
                <div className="mt-6 text-center">
                    <button onClick={loadMoreUsers} disabled={loadingMore} className="text-xs uppercase tracking-widest font-black text-indigo-600 hover:bg-indigo-50 py-3 px-6 rounded-xl transition-colors">{loadingMore ? 'Loading...' : 'Load More Users'}</button>
                </div>
            )}
        </div>
    );
};

export default AdminUserTable;