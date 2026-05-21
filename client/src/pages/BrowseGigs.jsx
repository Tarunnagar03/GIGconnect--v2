/**
 * BrowseGigs Page Component
 * UPDATED: May 6, 2026 - Design System Enhancement
 * 
 * Changes Made:
 * - Updated gig card styling with modern design
 * - Applied custom color scheme to filters and buttons
 * - Enhanced search and filter interfaces
 * - Improved pagination with modern styling
 * - Added smooth transitions and hover effects
 * - Enhanced responsive layout for mobile devices
 */

import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api';
import GigCard from '../components/GigCard';
import { AuthContext } from '../context/AuthContext';
import ErrorBoundary from '../components/ErrorBoundary';

const GigSkeleton = () => (
    <div className="bg-white p-8 rounded-2xl shadow-sm animate-pulse border border-gray-100">
        <div className="flex justify-between items-start mb-4">
            <div className="h-6 bg-gray-300 rounded w-2/3"></div>
            <div className="h-6 bg-green-200 rounded w-16"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
        <div className="flex gap-2 mb-4">
            <div className="h-6 bg-blue-100 rounded-full w-16"></div>
            <div className="h-6 bg-blue-100 rounded-full w-20"></div>
        </div>
        <div className="h-10 bg-gray-300 rounded w-full mt-4"></div>
    </div>
);

const BrowseGigs = () => {
    const { auth } = useContext(AuthContext);
    const [gigs, setGigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();
    const [proposalMap, setProposalMap] = useState(new Map());
    const [error, setError] = useState(''); // Added error state
    const [mySkills, setMySkills] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const [filters, setFilters] = useState({
        keyword: searchParams.get('keyword') || '',
        minPrice: searchParams.get('minPrice') || '',
        maxPrice: searchParams.get('maxPrice') || '',
        skills: searchParams.get('skills') || ''
    });

    // Get a string representation of searchParams to use as a stable dependency
    const searchString = searchParams.toString();

    const fetchGigsAndProposals = useCallback(async (pageNum = 1) => {
        if (!auth.isAuthenticated) {
            setError("Please log in to browse gigs and see proposal statuses.");
            setLoading(false);
            return;
        }

        if (pageNum === 1) setLoading(true);
        else setLoadingMore(true);
        
        setError(''); // Clear previous errors
        try {
            const currentParams = new URLSearchParams(searchString);
            const params = new URLSearchParams();
            currentParams.forEach((value, key) => {
                if (value) params.set(key, value);
            });
            
            params.set('page', pageNum);
            params.set('limit', 12);

            const gigsRes = await api.get(`/gigs?${params.toString()}`).catch(err => { console.error(err); return { data: [] }; });
            const proposalsRes = await api.get('/proposals/my-proposals').catch(err => { console.error(err); return { data: [] }; });
            
            const profileRes = await api.get('/profiles/me').catch(() => ({ data: null }));
            setMySkills(profileRes.data?.skills || []);

            // Filter out "orphaned" gigs and "Archived" (Soft-Deleted) gigs by Admin
            const validGigs = Array.isArray(gigsRes.data) ? gigsRes.data.filter(gig => gig.client && gig.status === 'Open') : [];
            
            setHasMore(validGigs.length >= 12);
            
            if (pageNum === 1) {
                setGigs(validGigs);
            } else {
                setGigs(prev => [...prev, ...validGigs]);
            }

            const map = new Map();
            for (const proposal of proposalsRes.data) {
                // --- FIX: Check proposal.gig exists before accessing _id ---
                if (proposal.gig) {
                    const matchedGigId = proposal.gig._id || proposal.gig;
                    map.set(matchedGigId, proposal.status);
                }
            }
            setProposalMap(map);

        } catch (err) {
            console.error("Failed to fetch gigs or proposals", err);
            setError(err.response?.data?.msg || "An error occurred while loading gigs.");
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [searchString, auth.isAuthenticated]);

    useEffect(() => {
        setPage(1);
        fetchGigsAndProposals(1);
    }, [fetchGigsAndProposals]);

    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchGigsAndProposals(nextPage);
    };

    const applyFilters = (e) => {
        e.preventDefault();
        setPage(1);
        setSearchParams(filters, { replace: true });
    };

    const getMatchScore = (gigSkills) => {
        if (!mySkills.length || !gigSkills || !gigSkills.length) return 0;
        const lowerMySkills = mySkills.map(s => s.toLowerCase());
        const matchCount = gigSkills.filter(s => lowerMySkills.includes(s.toLowerCase())).length;
        return Math.round((matchCount / gigSkills.length) * 100);
    };

    return (
        <div className="max-w-7xl mx-auto animate-fade-in pb-12">
            <Link to="/dashboard" className="inline-flex items-center gap-2 mb-6 text-gray-600 hover:text-blue-600 font-semibold bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm hover:shadow hover:border-blue-200 transition-all group">
                <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Back to Dashboard
            </Link>
            <div className="mb-8">
                <h1 className="text-4xl md:text-5xl font-extrabold mb-3 text-gray-800 tracking-tight">Browse Gigs</h1>
                <p className="text-xl text-gray-500 font-medium">Discover your next big project and start earning.</p>
            </div>

            {/* Display Error Message */}
             {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl relative mb-6" role="alert">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-8">
                {/* --- LEFT SIDEBAR (FILTERS) --- */}
                <div className="w-full lg:w-1/4">
                    <ErrorBoundary componentName="Filters">
                    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 lg:sticky lg:top-28">
                        <h3 className="text-xl font-extrabold text-gray-800 mb-6 flex items-center gap-2">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
                            Filters
                        </h3>
                        <form onSubmit={applyFilters} className="space-y-6">
                            <div>
                                <label htmlFor="keyword" className="block text-sm font-bold text-gray-700 mb-2">Search Keywords</label>
                                <input type="text" id="keyword" name="keyword" value={filters.keyword} onChange={handleFilterChange} placeholder="e.g. 'React developer'" className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50 hover:bg-white focus:bg-white" />
                            </div>
                            <div>
                                <label htmlFor="skills" className="block text-sm font-bold text-gray-700 mb-2">Required Skills</label>
                                <input type="text" id="skills" name="skills" value={filters.skills} onChange={handleFilterChange} placeholder="e.g. React, Node" className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50 hover:bg-white focus:bg-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Budget Range (₹)</label>
                                <div className="flex items-center gap-2">
                                    <input type="number" name="minPrice" value={filters.minPrice} onChange={handleFilterChange} placeholder="Min" className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50 hover:bg-white focus:bg-white" />
                                    <span className="text-gray-400 font-bold">-</span>
                                    <input type="number" name="maxPrice" value={filters.maxPrice} onChange={handleFilterChange} placeholder="Max" className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50 hover:bg-white focus:bg-white" />
                                </div>
                            </div>
                            <div className="pt-2 border-t border-gray-100">
                                <button type="submit" className="w-full bg-blue-600 text-white font-bold p-4 rounded-xl hover:bg-blue-700 hover:-translate-y-1 shadow-md transition-all text-lg">
                                    Apply Filters
                                </button>
                            </div>
                        </form>
                    </div>
                    </ErrorBoundary>
                </div>

                {/* --- RIGHT SIDE (RESULTS) --- */}
                <div className="w-full lg:w-3/4">
                    <ErrorBoundary componentName="Gig Results">
                    {/* --- RESULTS HEADER --- */}
                    <div className="mb-6 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">
                            <span className="text-blue-600 font-extrabold">{gigs.length}</span> active jobs found
                        </h2>
                    </div>

                    {/* Gig Listings */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <GigSkeleton />
                            <GigSkeleton />
                            <GigSkeleton />
                            <GigSkeleton />
                        </div>
                    ) : gigs.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {gigs.map(gig => (
                                <GigCard
                                    key={gig._id}
                                    gig={gig}
                                    proposalStatus={proposalMap.get(gig._id)}
                                    matchScore={getMatchScore(gig.skills)}
                                />
                            ))}
                        </div>
                    ) : (
                        !error && (
                            <div className="bg-white p-16 rounded-3xl shadow-sm border border-gray-100 text-center flex flex-col items-center">
                                <div className="w-24 h-24 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0V8a2 2 0 01-2 2H8a2 2 0 01-2-2V6m8 0H8m0 0V4"></path></svg>
                                </div>
                                <h3 className="text-2xl font-extrabold text-gray-800 mb-2">No active jobs found</h3>
                                <p className="text-gray-500 font-medium">Try adjusting your filters or expanding your search area.</p>
                            </div>
                        )
                    )}

                    {/* --- LOAD MORE BUTTON --- */}
                    {gigs.length > 0 && hasMore && !loading && (
                        <div className="mt-10 text-center">
                            <button 
                                onClick={handleLoadMore} 
                                disabled={loadingMore}
                                className="bg-white border border-gray-200 text-blue-600 font-bold py-3 px-8 rounded-full shadow-sm hover:shadow hover:border-blue-300 transition-all disabled:opacity-50"
                            >
                                {loadingMore ? 'Loading...' : 'Load More Gigs ⬇'}
                            </button>
                        </div>
                    )}
                    </ErrorBoundary>
                </div>
            </div>
        </div>
    );
};

export default BrowseGigs;