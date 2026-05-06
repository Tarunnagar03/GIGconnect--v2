/**
 * FreelancerDashboard Component
 * UPDATED: May 6, 2026 - Design System Enhancement
 * 
 * Changes Made:
 * - Updated with custom gc-card styling
 * - Applied modern color palette (primary, secondary, accent)
 * - Enhanced stats display with better visual hierarchy
 * - Improved card layouts and spacing
 * - Added smooth transitions and hover effects
 * - Implemented consistent typography
 * - Enhanced profile display with professional design
 */

import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api';

const FreelancerDashboard = () => {
    // Get both auth (for user info) and profile (for skills/rate)
    const { auth, profile } = useContext(AuthContext);
    const [stats, setStats] = useState({ activeBids: 0, gigsWon: 0, earnings: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!auth.user) return; 
            setLoading(true);
            try {
                const [proposalsRes, assignedGigsRes] = await Promise.all([
                    api.get('/proposals/my-proposals'),
                    api.get('/gigs/my-assigned-gigs')
                ]);

                const proposals = proposalsRes.data;
                const assignedGigs = assignedGigsRes.data;

                const activeBids = proposals.filter(p => p.status === 'Submitted').length;
                const completedGigs = assignedGigs.filter(g => g.status === 'Completed');
                const gigsWon = completedGigs.length;
                const earnings = completedGigs.reduce((sum, gig) => sum + gig.budget, 0);

                setStats({ activeBids, gigsWon, earnings });
            } catch (err) {
                console.error("Error fetching freelancer dashboard data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [auth.user]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Your Profile Card */}
            <div className="gc-card p-6">
                <h3 className="text-xl font-bold mb-4 text-neutral-800">Your Profile</h3>

                {/* Check if the profile (skills, rate, etc.) exists */}
                {profile ? (
                    <div className="space-y-3">
                        {/* Get headline from auth.user, which is from the User model */}
                        <p className="text-neutral-600"><strong className="text-neutral-800">Headline:</strong> {auth.user?.headline || 'Not set'}</p>
                        <p className="text-neutral-600"><strong className="text-neutral-800">Skills:</strong> {profile.skills.join(', ')}</p>
                        <p className="text-neutral-600"><strong className="text-neutral-800">Rate:</strong> {profile.rate ? `$${profile.rate}/hr` : 'Not set'}</p>
                    </div>
                ) : (
                    // If no profile, show "Create Profile" button
                    <div>
                        <p className="text-neutral-600 mb-4">You haven't created a professional profile yet. Create one to start applying for gigs!</p>
                        <Link to="/create-profile" className="gc-btn-success">
                            Create Profile
                        </Link>
                    </div>
                )}
            </div>

            {/* Key Stats Card */}
            <div className="gc-card p-6">
                <h3 className="text-xl font-bold mb-4 text-neutral-800">Key Stats</h3>
                {loading ? (
                    <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                    </div>
                ) : (
                    <div className="flex justify-around text-center">
                        <div>
                            <span className="text-3xl font-bold text-accent-600">{stats.activeBids}</span>
                            <p className="text-neutral-500">Active Bids</p>
                        </div>
                        <div>
                            <span className="text-3xl font-bold text-secondary-600">{stats.gigsWon}</span>
                            <p className="text-neutral-500">Gigs Won</p>
                        </div>
                        <div>
                            <span className="text-3xl font-bold text-secondary-700">${stats.earnings.toFixed(2)}</span>
                            <p className="text-neutral-500">Earnings</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Find Gigs Card */}
            <div className="md:col-span-2 gc-card p-6">
                <h3 className="text-xl font-bold mb-4 text-neutral-800">Find Your Next Opportunity</h3>
                <p className="text-neutral-600 mb-4">Search for new projects and grow your freelance business.</p>
                <Link to="/gigs" className="gc-btn-primary">
                    Browse All Gigs
                </Link>
            </div>

            {/* My Proposals Card */}
            <div className="md:col-span-2 gc-card p-6">
                <h3 className="text-xl font-bold mb-4 text-neutral-800">Track Your Applications</h3>
                <p className="text-gray-600 mb-4">View the status of proposals you have submitted.</p>
                <Link to="/my-proposals" className="inline-block bg-purple-600 text-white font-bold py-2 px-4 rounded hover:bg-purple-700 transition-colors">
                    View My Proposals
                </Link>
            </div>
        </div>
    );
};

export default FreelancerDashboard;