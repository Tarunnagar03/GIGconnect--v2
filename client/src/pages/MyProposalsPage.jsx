import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { formatCurrency } from '../utils/currencyFormatter';

const MyProposalsPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryTab = new URLSearchParams(location.search).get('tab');

    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState(queryTab || 'All');
    const { auth } = useContext(AuthContext);

    useEffect(() => {
        if (queryTab && ['All', 'Pending Proposals', 'Hired', 'Rejected'].includes(queryTab)) {
            setActiveTab(queryTab);
        }
    }, [queryTab]);

    useEffect(() => {
        const fetchMyProposals = async () => {
            if (!auth.isAuthenticated) {
                setError('Please log in to view your proposals.');
                setLoading(false);
                return;
            }
            setLoading(true);
            setError('');
            try {
                const res = await api.get('/proposals/my-proposals');
                if (Array.isArray(res.data)) {
                    setProposals(res.data);
                } else {
                    console.error("API did not return an array:", res.data);
                    setError('Failed to load proposals. Invalid data received.');
                    setProposals([]);
                }
            } catch (err) {
                console.error("Failed to fetch proposals", err);
                setError(err.response?.data?.msg || 'An error occurred while fetching proposals.');
                setProposals([]);
            } finally {
                setLoading(false);
            }
        };
        fetchMyProposals();
    }, [auth.isAuthenticated]);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Submitted': return 'bg-yellow-100 text-yellow-800';
            case 'Accepted': return 'bg-blue-100 text-blue-800';
            case 'Completed': return 'bg-green-100 text-green-800';
            case 'Rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    
    const getEffectiveStatus = (proposal) => {
        if (proposal.status === 'Accepted' && proposal.gig?.status === 'Completed') {
            return 'Completed';
        }
        return proposal.status;
    };

    if (loading) {
        return <div className="text-center mt-10">Loading your proposals...</div>;
    }

    // --- NEW LOGIC: Filter proposals ---
    const validProposals = proposals.filter(p => p.gig);
    const orphanedProposalCount = proposals.length - validProposals.length;

    // --- Filter proposals based on active tab ---
    const filteredProposals = validProposals.filter(p => {
        const status = getEffectiveStatus(p);
        if (activeTab === 'All') return true;
        if (activeTab === 'Pending Proposals') return status === 'Submitted';
        if (activeTab === 'Hired') return status === 'Accepted' || status === 'Completed';
        if (activeTab === 'Rejected') return status === 'Rejected';
        return true;
    });

    const tabs = ['All', 'Pending Proposals', 'Hired', 'Rejected'];

    return (
        <div className="max-w-5xl mx-auto animate-fade-in pb-12">
            <Link to="/dashboard" className="inline-flex items-center gap-2 mb-6 text-gray-600 hover:text-blue-600 font-semibold bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm hover:shadow hover:border-blue-200 transition-all group">
                <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Back to Dashboard
            </Link>
            <h1 className="text-4xl font-extrabold mb-8 text-gray-800 tracking-tight">My Proposals</h1>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

                {/* --- UPDATED: Check validProposals.length --- */}
                {validProposals.length > 0 ? (
                    <>
                        {/* --- NEW: Interactive Pipeline Tabs --- */}
                        <div className="flex space-x-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                            {tabs.map(tab => (
                                <button
                                    key={tab}
                                onClick={() => {
                                    setActiveTab(tab);
                                    navigate(`?tab=${tab}`, { replace: true });
                                }}
                                    className={`px-6 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all shadow-sm ${
                                        activeTab === tab 
                                            ? 'bg-blue-600 text-white shadow-md' 
                                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredProposals.length > 0 ? filteredProposals.map(p => {
                            const effectiveStatus = getEffectiveStatus(p);
                            
                            // We no longer need the "!p.gig" check here
                            
                            return (
                                    <div key={p._id} className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group relative overflow-hidden flex flex-col h-full">
                                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
                                        
                                        <div className="flex justify-between items-start mb-5">
                                        <span className={`px-3 py-1 text-sm font-semibold rounded-full whitespace-nowrap flex items-center gap-1.5 ${getStatusBadge(effectiveStatus)}`}>
                                            <span className={`w-2 h-2 rounded-full ${effectiveStatus === 'Accepted' || effectiveStatus === 'Completed' ? 'bg-green-500' : effectiveStatus === 'Rejected' ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                                            {effectiveStatus}
                                        </span>
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                                            </div>
                                    </div>
                                        <div>
                                            <Link to={`/gigs/${p.gig._id}`} className="font-extrabold text-2xl text-gray-800 hover:text-blue-600 transition-colors block mb-2 leading-tight line-clamp-2">
                                                {p.gig.title || 'Gig Title Missing'}
                                            </Link>
                                        </div>
                                    
                                        {/* --- NEW: Bid Insights UI --- */}
                                        <div className="mt-auto pt-6">
                                            <div className="flex justify-between items-center bg-gray-50 p-5 rounded-2xl border border-gray-100 shadow-inner">
                                                <div>
                                                    <p className="text-[10px] text-gray-500 uppercase font-extrabold tracking-wider mb-1">Your Bid</p>
                                                    <p className="text-xl font-extrabold text-blue-600">{formatCurrency(p.bidAmount)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-gray-500 uppercase font-extrabold tracking-wider mb-1">Client Budget</p>
                                                    <p className="text-xl font-extrabold text-green-600">{formatCurrency(p.gig.budget || 0)}</p>
                                                </div>
                                            </div>
                                        </div>

                                    {effectiveStatus === 'Rejected' && p.rejectionReason && (
                                            <div className="mt-4 bg-red-50 p-4 rounded-xl border border-red-100 shadow-sm">
                                            <p className="text-sm font-bold text-red-800 mb-1">Client Feedback:</p>
                                            <p className="text-sm text-gray-600 italic">"{p.rejectionReason}"</p>
                                        </div>
                                    )}
                                    {effectiveStatus === 'Completed' && (
                                         <p className="text-sm text-green-600 mt-3 font-semibold">This gig was successfully completed!</p>
                                    )}
                                </div>
                            );
                            }) : (
                                <div className="col-span-1 md:col-span-2 bg-gray-50 p-10 rounded-3xl border border-dashed border-gray-200 text-center">
                                    <p className="text-gray-500 font-medium text-lg">No proposals found in "{activeTab}"</p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                     // Only show "no proposals" if there wasn't an error AND no valid proposals
                     !error && orphanedProposalCount === 0 && (
                         <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
                            <div className="w-24 h-24 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            </div>
                            <p className="text-gray-500 text-lg">You have not submitted any proposals yet.</p>
                         </div>
                     )
                )}
                
                {/* --- NEW: Section for orphaned proposals --- */}
                {orphanedProposalCount > 0 && (
                    <div className="p-4 mt-6 rounded-xl bg-gray-50 border border-gray-200">
                        <p className="font-semibold text-gray-600">Completed Gigs Not Available</p>
                        <p className="text-sm text-gray-500">
                            You have {orphanedProposalCount} {orphanedProposalCount > 1 ? 'proposals' : 'proposal'} for gigs that have been removed or deleted.
                        </p>
                    </div>
                )}
        </div>
    );
};

export default MyProposalsPage;