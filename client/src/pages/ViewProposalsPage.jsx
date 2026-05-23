import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useQuery } from '@tanstack/react-query';

const ViewProposalsPage = () => {
    const { gigId } = useParams();
    const navigate = useNavigate();
    const [proposals, setProposals] = useState([]);
    const [gigTitle, setGigTitle] = useState('');
    const [gigStatus, setGigStatus] = useState('');
    const [gigBudget, setGigBudget] = useState(0);
    const [error, setError] = useState('');
    const [draggedItem, setDraggedItem] = useState(null);

    const { data, isLoading, error: queryError } = useQuery({
        queryKey: ['viewProposals', gigId],
        queryFn: async () => {
            const [gigRes, proposalsRes] = await Promise.all([
                api.get(`/gigs/${gigId}`),
                api.get(`/proposals/gig/${gigId}`).catch(() => ({ data: [] }))
            ]);
            return {
                gig: gigRes.data,
                proposals: proposalsRes.data
            };
        },
        enabled: !!gigId
    });

    useEffect(() => {
        if (data) {
            setGigTitle(data.gig.title);
            setGigStatus(data.gig.status);
            setGigBudget(data.gig.budget || 0);
            setProposals(data.proposals);
        }
    }, [data]);

    const handleAcceptProposal = async (proposalId) => {
        if (!window.confirm("Accept this proposal and assign the gig? This will reject others.")) return;
        setError('');
        try {
            await api.put(`/proposals/accept/${proposalId}`);
            setProposals(prev => prev.map(p => p._id === proposalId ? { ...p, status: 'Accepted' } : { ...p, status: p.status === 'Accepted' ? 'Rejected' : p.status }));
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

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[60vh] w-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const isGigOpen = gigStatus === 'Open';

    // --- ENTERPRISE: Drag and Drop Handlers ---
    const handleDragStart = (e, proposal) => {
        setDraggedItem(proposal);
        e.dataTransfer.effectAllowed = "move";
        setTimeout(() => e.target.classList.add('opacity-40'), 0);
    };

    const handleDragEnd = (e) => {
        e.target.classList.remove('opacity-40');
        setDraggedItem(null);
    };

    const handleDrop = async (e, targetStatus) => {
        e.preventDefault();
        if (!draggedItem) return;
        
        const currentStatus = draggedItem.status === 'Submitted' ? 'Pending Review' : draggedItem.status;
        if (currentStatus === targetStatus) return;

        if (targetStatus === 'Accepted') {
            handleAcceptProposal(draggedItem._id);
        } else if (targetStatus === 'Rejected') {
            handleRejectProposal(draggedItem._id);
        } else if (targetStatus === 'Interviewing' || targetStatus === 'Pending Review') {
            const dbStatus = targetStatus === 'Pending Review' ? 'Submitted' : 'Interviewing';
            setProposals(prev => prev.map(p => p._id === draggedItem._id ? { ...p, status: dbStatus } : p));
            try {
                // Fallback API call to update pipeline status
                await api.put(`/proposals/${draggedItem._id}/status`, { status: dbStatus });
            } catch (error) {
                console.warn("Status update API might not be configured, relying on local state.", error);
            }
        }
        setDraggedItem(null);
    };

    const pipelineColumns = [
        { id: 'Pending Review', statusMatch: 'Submitted', icon: '📥' },
        { id: 'Interviewing', statusMatch: 'Interviewing', icon: '💬' },
        { id: 'Accepted', statusMatch: 'Accepted', icon: '🤝' },
        { id: 'Rejected', statusMatch: 'Rejected', icon: '❌' }
    ];

    return (
        <div className="max-w-7xl mx-auto animate-fade-in pb-12">
            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 mb-6 text-gray-600 hover:text-blue-600 font-semibold bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm hover:shadow hover:border-blue-200 transition-all group focus:outline-none">
                <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Back to Gig Details
            </button>
            <h1 className="text-4xl font-extrabold mb-2 text-gray-800 tracking-tight">Proposals Received</h1>
            <p className="text-lg text-gray-500 mb-8">For: <span className="font-bold text-gray-800">{gigTitle}</span></p>
            {(error || queryError) && <p className="text-red-700 bg-red-50 border border-red-200 p-4 rounded-xl text-center mb-6 font-bold">{error || 'Could not load proposals.'}</p>}

            {/* --- ENTERPRISE: Kanban Pipeline Board --- */}
            <div className="flex overflow-x-auto gap-6 pb-8 snap-x scrollbar-hide">
                {pipelineColumns.map(col => {
                    const colProposals = proposals.filter(p => p.status === col.statusMatch);
                    return (
                        <div 
                            key={col.id}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDrop(e, col.id)}
                            className={`bg-gray-50/80 border border-gray-200/60 rounded-3xl p-5 min-w-[320px] w-full flex-shrink-0 flex flex-col max-h-[750px] transition-colors ${draggedItem ? 'bg-blue-50/50 border-blue-200 border-dashed' : ''}`}
                        >
                            <div className="flex justify-between items-center mb-5 px-1 border-b border-gray-200/60 pb-3">
                                <h3 className="font-extrabold text-gray-800 flex items-center gap-2">{col.icon} {col.id}</h3>
                                <span className="bg-white border border-gray-200 text-gray-500 text-xs font-black px-2.5 py-1 rounded-full shadow-sm">{colProposals.length}</span>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
                                {colProposals.map(p => {
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
                                        <div 
                                            key={p._id} 
                                            draggable={isGigOpen}
                                            onDragStart={(e) => handleDragStart(e, p)}
                                            onDragEnd={handleDragEnd}
                                            className={`p-6 rounded-2xl shadow-sm border transition-all duration-300 hover:shadow-md cursor-grab active:cursor-grabbing hover:border-blue-300 ${p.status === 'Accepted' ? 'bg-green-50 border-green-200' : p.status === 'Rejected' ? 'bg-red-50 border-red-100 opacity-70' : 'bg-white border-gray-100'}`}
                                        >
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
                                        {gigBudget > 0 && (p.status === 'Submitted' || p.status === 'Interviewing') && (
                                            <p className={`text-[10px] font-bold mt-1.5 px-2 py-0.5 rounded-md w-full text-center ${isOver ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                {isOver ? `+${Math.round(diff)}% over budget` : `${Math.abs(Math.round(diff))}% under budget`}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="border-t border-gray-200 pt-6 mt-2">
                                <h4 className="font-bold text-gray-800 mb-2">Cover Letter:</h4>
                                <p className="text-gray-700 whitespace-pre-wrap text-sm line-clamp-4">{displayCoverLetter}</p>
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
                            {isGigOpen && (p.status === 'Submitted' || p.status === 'Interviewing') && (
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
                                {colProposals.length === 0 && (
                                    <div className="h-28 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center text-gray-400 text-sm font-bold bg-white/50">
                                        Drag proposals here
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                    </div>
        </div>
    );
};

export default ViewProposalsPage;