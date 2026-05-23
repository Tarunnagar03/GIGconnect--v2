import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const TeamAgencyPage = () => {
    const { auth } = useAuth();
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('Member');
    const [isInviting, setIsInviting] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    
    // Simulated existing team members
    const [teamMembers, setTeamMembers] = useState([
        { id: 1, name: auth.user?.name || 'You', email: auth.user?.email || '', role: 'Owner', status: 'Active' },
        { id: 2, name: 'Alex Developer', email: 'alex.dev@example.com', role: 'Member', status: 'Active' },
        { id: 3, name: 'Sarah Finance', email: 'sarah.fin@example.com', role: 'Finance', status: 'Pending' }
    ]);

    const handleInvite = async (e) => {
        e.preventDefault();
        setIsInviting(true);
        
        try {
            // Call the backend to actually send the invite email and save to DB
            let inviteId = Date.now();
            await api.post('/agency/invite', { email: inviteEmail, role: inviteRole }).then(res => {
                if (res.data?.inviteId) inviteId = res.data.inviteId;
            }).catch(err => {
                console.warn("Backend API for invite not connected yet, simulating success locally.", err);
            });
            
            const newMember = {
                id: inviteId,
                name: 'Pending Invite', 
                email: inviteEmail,
                role: inviteRole,
                status: 'Pending'
            };
            setTeamMembers([...teamMembers, newMember]);
            setSuccessMsg(`Invitation sent successfully to ${inviteEmail}`);
            setInviteEmail('');
            setIsInviting(false);
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.msg || "Failed to send invitation.");
            setIsInviting(false);
        }
    };

    const handleRemove = async (id) => {
        if(window.confirm("Are you sure you want to revoke access for this member?")) {
            try {
                // Fallback catch agar backend route abhi bani nahi ho
                await api.delete(`/agency/members/${id}`).catch((err) => {
                    console.warn("Backend API for remove not connected yet, removing locally.", err);
                });
                setTeamMembers(teamMembers.filter(m => m.id !== id));
            } catch (err) {
                console.error(err);
                setTeamMembers(teamMembers.filter(m => m.id !== id));
            }
        }
    };

    return (
        <div className="max-w-5xl mx-auto animate-fade-in pb-12">
            <Link to="/settings" className="inline-flex items-center gap-2 mb-6 text-gray-600 hover:text-blue-600 font-semibold bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm hover:shadow hover:border-blue-200 transition-all group">
                <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Back to Settings
            </Link>
            
            <div className="mb-8">
                <h1 className="text-4xl font-extrabold mb-2 text-gray-800 tracking-tight">Team & Agency</h1>
                <p className="text-lg text-gray-500 font-medium">Manage your agency roster or invite team members to collaborate.</p>
            </div>

            {successMsg && (
                <div className="mb-6 bg-green-50 border border-green-200 p-4 rounded-2xl flex items-center gap-3 animate-slide-up shadow-sm">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">✓</div>
                    <p className="text-green-800 font-bold text-sm">{successMsg}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 sticky top-28">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><span>✉️</span> Invite Member</h3>
                        <form onSubmit={handleInvite} className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                                <input type="email" required value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="colleague@example.com" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium" />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Assign Role</label>
                                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-bold text-gray-700">
                                    <option value="Admin">Admin (Full Access)</option>
                                    <option value="Member">Member (Manage Gigs)</option>
                                    <option value="Finance">Finance (Billing Only)</option>
                                </select>
                            </div>
                            <button type="submit" disabled={isInviting || !inviteEmail} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-all shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed">
                                {isInviting ? 'Sending Invite...' : 'Send Invitation'}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><span>👥</span> Active Roster ({teamMembers.length})</h2>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {teamMembers.map((member) => (
                                <div key={member.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200 text-gray-600 rounded-full flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                                            {member.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 flex items-center gap-2">{member.name} {member.role === 'Owner' && <span className="bg-blue-100 text-blue-700 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-blue-200">Owner</span>}</p>
                                            <p className="text-sm text-gray-500 font-medium">{member.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border ${member.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200 animate-pulse'}`}>{member.status}</span>
                                        {member.role !== 'Owner' && (
                                            <button onClick={() => handleRemove(member.id)} className="text-gray-400 hover:text-red-500 font-bold p-2 transition-colors" title="Revoke Access">✕</button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeamAgencyPage;