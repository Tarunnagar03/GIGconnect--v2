import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currencyFormatter';
import { useQuery } from '@tanstack/react-query';

const ManageGigsPage = () => {
    const { auth } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const queryTab = new URLSearchParams(location.search).get('tab');

    const [activeTab, setActiveTab] = useState(queryTab || 'Open');

    useEffect(() => {
        if (queryTab && ['Open', 'In Progress', 'Completed'].includes(queryTab)) {
            setActiveTab(queryTab);
        }
    }, [queryTab]);

    // 1. Fetch Gigs via React Query
    const { data: gigs = [], isLoading: isGigsLoading } = useQuery({
        queryKey: ['manageGigs'],
        queryFn: async () => {
            const res = await api.get('/gigs/my-gigs');
            return Array.isArray(res.data) ? res.data : [];
        },
        enabled: auth.isAuthenticated
    });

    const openGigIds = useMemo(() => gigs.filter(g => g.status === 'Open').map(g => g._id), [gigs]);

    // 2. Fetch Proposal Counts ONLY for Open Gigs, executed in parallel and cached
    const { data: proposalCounts = {}, isLoading: isCountsLoading } = useQuery({
        queryKey: ['proposalCounts', openGigIds],
        queryFn: async () => {
            const counts = {};
            await Promise.all(openGigIds.map(async (id) => {
                try {
                    const propRes = await api.get(`/proposals/gig/${id}`);
                    counts[id] = propRes.data.filter(p => p.status === 'Submitted').length;
                } catch (e) {
                    counts[id] = 0;
                }
            }));
            return counts;
        },
        enabled: openGigIds.length > 0 && auth.isAuthenticated
    });

    const loading = isGigsLoading || (openGigIds.length > 0 && isCountsLoading);

    if (loading) {
        return <div className="text-center mt-20 text-gray-500 font-bold animate-pulse">Loading your pipeline...</div>;
    }

    const filteredGigs = gigs.filter(g => g.status === activeTab);
    const tabs = ['Open', 'In Progress', 'Completed'];

    return (
        <div className="max-w-6xl mx-auto animate-fade-in pb-12">
            <Link to="/dashboard" className="inline-flex items-center gap-2 mb-6 text-gray-600 hover:text-blue-600 font-semibold bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm hover:shadow hover:border-blue-200 transition-all group">
                <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Back to Dashboard
            </Link>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold mb-2 text-gray-800 tracking-tight">Manage Job Postings</h1>
                    <p className="text-lg text-gray-500 font-medium">Track your active hires, review candidates, and manage contracts.</p>
                </div>
                <Link to="/post-gig" className="bg-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-blue-700 transition-all shadow-md hover:-translate-y-1">
                    + Post a New Gig
                </Link>
            </div>

            {/* Pipeline Tabs */}
            <div className="flex space-x-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                {tabs.map(tab => (
                    <button
                        key={tab}
                    onClick={() => {
                        setActiveTab(tab);
                        navigate(`?tab=${tab}`, { replace: true });
                    }}
                        className={`px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all shadow-sm ${
                            activeTab === tab 
                                ? 'bg-gray-900 text-white shadow-md' 
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                        {tab} ({gigs.filter(g => g.status === tab).length})
                    </button>
                ))}
            </div>

            {/* Gigs Grid */}
            {filteredGigs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredGigs.map(gig => {
                        const newProposals = proposalCounts[gig._id] || 0;
                        return (
                            <div key={gig._id} className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full group relative overflow-hidden">
                                <div className={`absolute top-0 left-0 w-full h-1.5 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 ${activeTab === 'Open' ? 'bg-blue-500' : activeTab === 'In Progress' ? 'bg-yellow-400' : 'bg-green-500'}`}></div>
                                
                                <div className="flex justify-between items-start mb-4 gap-4">
                                    <h3 className="text-xl font-bold text-gray-900 line-clamp-2">{gig.title}</h3>
                                    <div className="text-right shrink-0">
                                        <p className="text-lg font-extrabold text-green-600">{formatCurrency(gig.budget)}</p>
                                    </div>
                                </div>

                                <div className="text-xs text-gray-500 font-medium mb-6 bg-gray-50 inline-block px-3 py-1.5 rounded-lg border border-gray-100">
                                    Posted on {new Date(gig.createdAt).toLocaleDateString()}
                                </div>

                                <div className="mt-auto border-t border-gray-100 pt-6">
                                    {activeTab === 'Open' && (
                                        <div className="flex items-center justify-between">
                                            <div>
                                                {newProposals > 0 ? (
                                                    <span className="flex items-center gap-1.5 text-sm font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-md">
                                                        <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span></span>
                                                        {newProposals} New Proposals
                                                    </span>
                                                ) : (
                                                    <span className="text-sm font-bold text-gray-500">No new proposals</span>
                                                )}
                                            </div>
                                            <Link to={`/view-proposals/${gig._id}`} className="bg-blue-50 text-blue-700 font-bold py-2.5 px-5 rounded-xl hover:bg-blue-100 transition-colors text-sm">
                                                Review Candidates &rarr;
                                            </Link>
                                        </div>
                                    )}

                                    {activeTab === 'In Progress' && (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">
                                                    {gig.assignedFreelancer?.name?.charAt(0).toUpperCase() || 'F'}
                                                </div>
                                                <span className="text-sm font-bold text-gray-700 truncate w-32">{gig.assignedFreelancer?.name || 'Hired Talent'}</span>
                                            </div>
                                            <Link to={`/gigs/${gig._id}`} className="bg-white border-2 border-gray-200 text-gray-700 font-bold py-2 px-4 rounded-xl hover:border-blue-500 hover:text-blue-600 transition-colors text-sm">
                                                Open Workspace
                                            </Link>
                                        </div>
                                    )}

                                    {activeTab === 'Completed' && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-green-600 flex items-center gap-1"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg> Fully Paid</span>
                                            <Link to={`/gigs/${gig._id}`} className="text-sm font-bold text-blue-600 hover:underline">View History</Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center">
                    <div className="w-24 h-24 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0V8a2 2 0 01-2 2H8a2 2 0 01-2-2V6m8 0H8m0 0V4"></path></svg>
                    </div>
                    <p className="text-gray-500 text-lg font-medium mb-4">You have no {activeTab.toLowerCase()} gigs right now.</p>
                    {activeTab === 'Open' && (
                        <Link to="/post-gig" className="inline-block bg-blue-600 text-white font-bold py-3 px-8 rounded-full hover:bg-blue-700 transition-colors shadow-md">
                            Post your first Gig
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
};

export default ManageGigsPage;