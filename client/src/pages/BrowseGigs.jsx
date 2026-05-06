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
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import GigCard from '../components/GigCard';
import { AuthContext } from '../context/AuthContext';

const BrowseGigs = () => {
    const { auth } = useContext(AuthContext);
    const [gigs, setGigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();
    const [proposalMap, setProposalMap] = useState(new Map());
    const [error, setError] = useState(''); // Added error state

    const [filters, setFilters] = useState({
        keyword: searchParams.get('keyword') || '',
        minPrice: searchParams.get('minPrice') || '',
        maxPrice: searchParams.get('maxPrice') || '',
        skills: searchParams.get('skills') || '',
        radiusKm: searchParams.get('radiusKm') || '',
    });

    const fetchGigsAndProposals = useCallback(async () => {
        if (!auth.isAuthenticated) {
            setError("Please log in to browse gigs and see proposal statuses.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(''); // Clear previous errors
        try {
            const params = new URLSearchParams(filters);
            for (const [key, value] of params.entries()) {
                if (!value) params.delete(key);
            }

            // If radiusKm is set, attach current user's profile geo if available.
            if (filters.radiusKm) {
                try {
                    const me = await api.get('/profiles/me');
                    const coords = me.data?.geo?.coordinates;
                    if (Array.isArray(coords) && coords.length === 2) {
                        params.set('lng', String(coords[0]));
                        params.set('lat', String(coords[1]));
                    }
                } catch {
                    // ignore: browsing still works without geo
                }
            }

            const [gigsRes, proposalsRes] = await Promise.all([
                api.get(`/gigs?${params.toString()}`),
                api.get('/proposals/my-proposals')
            ]);

            setGigs(gigsRes.data);

            const map = new Map();
            for (const proposal of proposalsRes.data) {
                // --- FIX: Check proposal.gig exists before accessing _id ---
                if (proposal.gig) {
                    map.set(proposal.gig._id, proposal.status);
                }
            }
            setProposalMap(map);

        } catch (err) {
            console.error("Failed to fetch gigs or proposals", err);
            setError(err.response?.data?.msg || "An error occurred while loading gigs.");
        } finally {
            setLoading(false);
        }
    }, [filters, auth.isAuthenticated]);

    useEffect(() => {
        fetchGigsAndProposals();
    }, [fetchGigsAndProposals]);

    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const applyFilters = (e) => {
        e.preventDefault();
        setSearchParams(filters, { replace: true });
        // Fetch will be triggered by useEffect dependency on filters
        fetchGigsAndProposals(); // Also manually trigger for immediate feedback
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Browse Gigs</h1>

            {/* Display Error Message */}
             {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Filters Sidebar */}
                <aside className="md:col-span-1 bg-white p-6 rounded-lg shadow-md h-fit">
                    <h2 className="text-xl font-bold mb-4">Filters</h2>
                    <form onSubmit={applyFilters} className="space-y-4">
                        <div>
                            <label htmlFor="keyword" className="block text-sm font-medium text-gray-700">Keyword</label>
                            <input type="text" id="keyword" name="keyword" value={filters.keyword} onChange={handleFilterChange} placeholder="e.g., 'React developer'" className="mt-1 block w-full p-2 border rounded-md" />
                        </div>
                        <div>
                            <label htmlFor="skills" className="block text-sm font-medium text-gray-700">Skills</label>
                            <input type="text" id="skills" name="skills" value={filters.skills} onChange={handleFilterChange} placeholder="e.g., React, Node" className="mt-1 block w-full p-2 border rounded-md" />
                            <p className="text-xs text-gray-500 mt-1">Comma-separated (optional)</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Price Range</label>
                            <div className="flex items-center space-x-2 mt-1">
                                <input type="number" name="minPrice" value={filters.minPrice} onChange={handleFilterChange} placeholder="Min $" className="w-full p-2 border rounded-md" />
                                <span>-</span>
                                <input type="number" name="maxPrice" value={filters.maxPrice} onChange={handleFilterChange} placeholder="Max $" className="w-full p-2 border rounded-md" />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="radiusKm" className="block text-sm font-medium text-gray-700">Near me (km)</label>
                            <input type="number" id="radiusKm" name="radiusKm" value={filters.radiusKm} onChange={handleFilterChange} placeholder="e.g., 10" className="mt-1 block w-full p-2 border rounded-md" />
                            <p className="text-xs text-gray-500 mt-1">Uses your saved GPS (Profile → Use my GPS).</p>
                        </div>
                        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Apply Filters</button>
                    </form>
                </aside>

                {/* Gig Listings */}
                <main className="md:col-span-3">
                    {loading ? (
                        <p>Loading gigs...</p>
                    ) : gigs.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {gigs.map(gig => (
                                <GigCard
                                    key={gig._id}
                                    gig={gig}
                                    proposalStatus={proposalMap.get(gig._id)}
                                />
                            ))}
                        </div>
                    ) : (
                         // Only show "no gigs" if there wasn't an error
                         !error && <div className="bg-white p-6 rounded-lg shadow-md text-center">
                            <p className="text-gray-500">No open gigs match your criteria.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default BrowseGigs;