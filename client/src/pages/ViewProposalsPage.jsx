import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';

const ViewProposalsPage = () => {
    const { gigId } = useParams();
    const navigate = useNavigate();
    const [proposals, setProposals] = useState([]);
    const [gigTitle, setGigTitle] = useState('');
    const [gigStatus, setGigStatus] = useState('');
    const [gigBudget, setGigBudget] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('Pending Review');

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const gigRes = await api.get(`/gigs/${gigId}`);
            const proposalsRes = await api.get(`/proposals/gig/${gigId}`).catch(err => { console.error(err); return { data: [] }; });
            setGigTitle(gigRes.data.title);
            setGigStatus(gigRes.data.status);
            setGigBudget(gigRes.data.budget || 0);
            setProposals(proposalsRes.data);
        } catch (err) {
            setError('Could not load proposals.');
            console.error("Error fetching proposals:", err);
        } finally {
            setLoading(false);
        }
    }, [gigId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAcceptProposal = async (proposalId) => {
        if (!window.confirm("Accept this proposal and assign the gig? This will reject others.")) return;
        setError('');
        try {
            await api.put(`/proposals/accept/${proposalId}`);
            alert('Proposal accepted! The gig is now In Progress.');
            navigate(`/gigs/${gigId}`);
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to accept proposal.');
        }
    };

    const handleRejectProposal = async (proposalId) => {
        const reason = prompt("Please provide a brief reason for rejecting this proposal:");
        if (reason === null) return;
        if (!reason || reason.trim() === '') {
            alert('A rejection reason is required.');
            return;
        }
        setError('');
        try {
            await api.put(`/proposals/reject/${proposalId}`, { rejectionReason: reason });
            setProposals(prev => prev.map(p =>
                p._id === proposalId
                    ? { ...p, status: 'Rejected', rejectionReason: reason }
                    : p
            ));
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to reject proposal.');
        }
    };

    if (loading) return <p>Loading proposals...</p>;

    const isGigOpen = gigStatus === 'Open';

    // --- NEW: Filter proposals based on Active Tab ---
    const filteredProposals = proposals.filter(p => {
        if (activeTab === 'Pending Review') return p.status === 'Submitted';
        if (activeTab === 'Accepted') return p.status === 'Accepted';
        if (activeTab === 'Rejected') return p.status === 'Rejected';
        return true;
    });

    return (
        <div className="max-w-5xl mx-auto animate-fade-in">
            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 mb-6 text-gray-600 hover:text-blue-600 font-semibold bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm hover:shadow hover:border-blue-200 transition-all group focus:outline-none">
                <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Back to Gig Details
            </button>
            <h1 className="text-4xl font-extrabold mb-2 text-gray-800 tracking-tight">Proposals Received</h1>
            <p className="text-lg text-gray-500 mb-8">For: <span className="font-bold text-gray-800">{gigTitle}</span></p>
            {error && <p className="text-red-700 bg-red-50 border border-red-200 p-4 rounded-xl text-center mb-6 font-bold">{error}</p>}

            {/* --- NEW: Interactive Pipeline Tabs --- */}
            <div className="flex space-x-3 mb-8 overflow-x-auto pb-2 scrollbar-hide border-b border-gray-100">
                {['Pending Review', 'Accepted', 'Rejected'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2.5 rounded-t-xl font-bold text-sm whitespace-nowrap transition-all ${
                            activeTab === tab 
                                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' 
                                : 'bg-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        {tab} ({proposals.filter(p => p.status === (tab === 'Pending Review' ? 'Submitted' : tab)).length})
                    </button>
                ))}
            </div>

            {filteredProposals.length > 0 ? (
                <div className="space-y-8">
                    {filteredProposals.map(p => {
                        let displayCoverLetter = p.coverLetter;
                        let attachmentData = null;

                        if (displayCoverLetter && displayCoverLetter.includes('[ATTACHMENT]:::')) {
                            const parts = displayCoverLetter.split('[ATTACHMENT]:::');
                            displayCoverLetter = parts[0].trim();
                            try {
                                attachmentData = JSON.parse(parts[1]);
                            } catch (e) { console.error(e); }
                        }
                        
                        const diff = gigBudget > 0 ? ((p.bidAmount - gigBudget) / gigBudget) * 100 : 0;
                        const isOver = diff > 0;

                        return (
                            <div key={p._id} className={`p-8 rounded-2xl shadow-sm border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${p.status === 'Accepted' ? 'bg-green-50 border-green-200' : p.status === 'Rejected' ? 'bg-red-50 border-red-100 opacity-80' : 'bg-white border-gray-100'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    {/* --- THIS IS THE CLICKABLE LINK --- */}
                                    <Link 
                                        to={`/profile/${p.freelancer._id}`} 
                                        className="text-xl font-bold text-blue-600 hover:underline"
                                    >
                                        {p.freelancer.name} (@{p.freelancer.username})
                                    </Link>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-sm text-gray-600 font-medium">{p.freelancer.headline || 'Professional Freelancer'}</p>
                                        <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100">Identity Verified ✓</span>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <div className={`border rounded-xl p-3 flex flex-col items-end min-w-[140px] shadow-sm ${p.status === 'Accepted' ? 'bg-white border-green-200' : 'bg-gray-50 border-gray-100'}`}>
                                        <p className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400 mb-1">Bid Amount</p>
                                        <p className="text-2xl font-black text-gray-900">₹{p.bidAmount}</p>
                                        {gigBudget > 0 && p.status === 'Submitted' && (
                                            <p className={`text-[10px] font-bold mt-1.5 px-2 py-0.5 rounded-md w-full text-center ${isOver ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                {isOver ? `+${Math.round(diff)}% over budget` : `${Math.abs(Math.round(diff))}% under budget`}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="border-t border-gray-200 pt-6 mt-2">
                                <h4 className="font-bold text-gray-800 mb-2">Cover Letter:</h4>
                                <p className="text-gray-700 whitespace-pre-wrap">{displayCoverLetter}</p>
                            </div>
                            {attachmentData && (
                                <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-10 h-10 bg-white shadow-sm rounded-lg flex items-center justify-center text-xl shrink-0 border border-gray-100">
                                            {attachmentData.type?.startsWith('image/') ? '🖼️' : '📄'}
                                        </div>
                                        <div className="truncate pr-4">
                                            <p className="text-sm font-bold text-gray-800 truncate">{attachmentData.name}</p>
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{(attachmentData.size / 1024).toFixed(1)} KB • Portfolio Attachment</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            const a = document.createElement('a');
                                            a.href = attachmentData.content;
                                            a.download = attachmentData.name;
                                            a.click();
                                        }}
                                        className="text-blue-600 hover:text-blue-800 text-sm font-bold bg-white border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm shrink-0 flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                        View File
                                    </button>
                                </div>
                            )}
                            {p.status === 'Rejected' && p.rejectionReason && (
                                <div className="mt-4 border-t pt-4">
                                    <h4 className="font-semibold mb-1 text-red-700">Reason for Rejection:</h4>
                                    <p className="text-gray-600 italic">{p.rejectionReason}</p>
                                </div>
                            )}
                            {isGigOpen && p.status === 'Submitted' && (
                                <div className="mt-6 text-right space-x-3">
                                    <button
                                        onClick={() => handleRejectProposal(p._id)}
                                        className="bg-red-50 text-red-700 border border-red-200 font-bold py-3 px-8 rounded-xl hover:bg-red-100 transition-colors"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => handleAcceptProposal(p._id)}
                                        className="bg-green-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-green-700 transition-all hover:-translate-y-1 shadow-md"
                                    >
                                        Accept & Assign
                                    </button>
                                </div>
                            )}
                        </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
                    <div className="w-24 h-24 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"></path></svg>
                    </div>
                    <p className="text-gray-500 text-lg">No proposals found in "{activeTab}"</p>
                </div>
            )}
        </div>
    );
};

export default ViewProposalsPage;