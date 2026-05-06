/**
 * ClientDashboard Component
 * UPDATED: May 6, 2026 - Design System Enhancement & Modern Styling
 * 
 * Changes Made:
 * - Replaced basic styling with custom gc-card classes
 * - Applied modern color scheme (primary, secondary, accent)
 * - Updated loading indicators with animated spinners
 * - Enhanced typography with professional fonts
 * - Improved card layouts with better spacing and shadows
 * - Added smooth transitions and hover effects
 * - Implemented responsive grid layout
 * - Enhanced review functionality with better visual feedback
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import ReviewForm from '../ReviewForm';
import ReviewCard from '../ReviewCard'; // <-- IMPORT THE DISPLAY CARD

const ClientDashboard = () => {
    const [myGigs, setMyGigs] = useState([]);
    const [myReviews, setMyReviews] = useState([]); // <-- NEW: State for reviews
    const [loading, setLoading] = useState(true);
    const [reviewingGigId, setReviewingGigId] = useState(null);

    // Fetch both gigs and reviews
    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            const [gigsRes, reviewsRes] = await Promise.all([
                api.get('/gigs/my-gigs'),
                api.get('/reviews/me/my-reviews') // <-- NEW: Fetch submitted reviews
            ]);
            
            setMyGigs(gigsRes.data);
            setMyReviews(reviewsRes.data);

        } catch (err) {
            console.error("Error fetching dashboard data:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const openGigs = myGigs.filter(gig => gig.status === 'Open' || gig.status === 'In Progress');
    const completedGigs = myGigs.filter(gig => gig.status === 'Completed');

    // Create a Map for quick lookup of reviews by gigId
    const reviewMap = new Map(myReviews.map(review => [review.gig, review]));

    const handleReviewSuccess = () => {
        alert('Review submitted successfully!');
        setReviewingGigId(null);
        fetchDashboardData(); // Re-fetch all data to show the new review
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Get Started Card */}
            <div className="gc-card p-6">
                <h3 className="text-xl font-bold mb-4 text-neutral-800">Get Started</h3>
                <p className="text-neutral-600 mb-4">Ready to bring your next project to life? Post a new gig to find top local talent.</p>
                <Link to="/post-gig" className="gc-btn-primary">
                    Post a New Gig
                </Link>
            </div>

            {/* Key Stats Card */}
            <div className="gc-card p-6">
                <h3 className="text-xl font-bold mb-4 text-neutral-800">Key Stats</h3>
                <div className="flex justify-around text-center">
                    <div>
                        <span className="text-3xl font-bold text-primary-600">{openGigs.length}</span>
                        <p className="text-neutral-500">Active Gigs</p>
                    </div>
                    <div>
                        <span className="text-3xl font-bold text-neutral-400">0</span>
                        <p className="text-neutral-500">Proposals</p>
                    </div>
                    <div>
                        <span className="text-3xl font-bold text-secondary-600">{completedGigs.length}</span>
                        <p className="text-neutral-500">Completed</p>
                    </div>
                </div>
            </div>

            {/* My Active Gigs Card */}
            <div className="md:col-span-2 gc-card p-6">
                <h3 className="text-xl font-bold mb-4 text-neutral-800">My Active Gigs</h3>
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                ) : openGigs.length > 0 ? (
                    <ul className="divide-y divide-neutral-200">
                        {openGigs.map(gig => (
                            <li key={gig._id} className="py-3 flex justify-between items-center">
                                <Link to={`/gigs/${gig._id}`} className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                                    {gig.title}
                                </Link>
                                <span className="text-neutral-500 font-medium">${gig.budget}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-neutral-500 text-center py-8">You have no active gig postings.</p>
                )}
            </div>

            {/* Completed Gigs Card */}
            <div className="md:col-span-2 gc-card p-6">
                <h3 className="text-xl font-bold mb-4 text-neutral-800">Completed Gigs</h3>
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                ) : completedGigs.length > 0 ? (
                    <ul className="divide-y divide-neutral-200">
                        {completedGigs.map(gig => {
                            const review = reviewMap.get(gig._id);
                            return (
                                <li key={gig._id} className="py-3 flex justify-between items-center">
                                    <div className="flex-1">
                                        <Link to={`/gigs/${gig._id}`} className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                                            {gig.title}
                                        </Link>
                                        {review ? (
                                            <p className="text-sm text-neutral-500 mt-1">Reviewed • {review.rating} stars</p>
                                        ) : (
                                            <button
                                                onClick={() => setReviewingGigId(gig._id)}
                                                className="text-sm text-accent-600 hover:text-accent-700 mt-1"
                                            >
                                                Leave a review
                                            </button>
                                        )}
                                    </div>
                                    <span className="text-neutral-500 font-medium">${gig.budget}</span>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p className="text-neutral-500 text-center py-8">No completed gigs yet.</p>
                )}
            </div>

            {/* Review Form Modal */}
            {reviewingGigId && (
                <ReviewForm
                    gigId={reviewingGigId}
                    onClose={() => setReviewingGigId(null)}
                    onSubmitSuccess={handleReviewSuccess}
                />
            )}
        </div>
    );
};

export default ClientDashboard;