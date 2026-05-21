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
import ErrorBoundary from '../ErrorBoundary';

const ClientDashboard = () => {
    const [myGigs, setMyGigs] = useState([]);
    const [myReviews, setMyReviews] = useState([]); // <-- NEW: State for reviews
    const [loading, setLoading] = useState(true);
    const [reviewingGigId, setReviewingGigId] = useState(null);

    // Fetch both gigs and reviews
    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            const gigsRes = await api.get('/gigs/my-gigs').catch(err => { console.error(err); return { data: [] }; });
            const reviewsRes = await api.get('/reviews/me/my-reviews').catch(err => { console.error(err); return { data: [] }; });
            
            setMyGigs(Array.isArray(gigsRes.data) ? gigsRes.data.filter(Boolean) : []);
            setMyReviews(Array.isArray(reviewsRes.data) ? reviewsRes.data.filter(Boolean) : []);

        } catch (err) {
            console.error("Error fetching dashboard data:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const openGigsCount = myGigs.filter(gig => gig.status === 'Open').length;
    const inProgressGigsCount = myGigs.filter(gig => gig.status === 'In Progress').length;
    const activeGigs = myGigs.filter(gig => gig.status === 'Open' || gig.status === 'In Progress');
    const completedGigs = myGigs.filter(gig => gig.status === 'Completed');

    // Create a Map for quick lookup of reviews by gigId
    const reviewMap = new Map((Array.isArray(myReviews) ? myReviews : []).map(review => [review.gig?._id || review.gig, review]));

    const handleReviewSuccess = () => {
        alert('Review submitted successfully!');
        setReviewingGigId(null);
        fetchDashboardData(); // Re-fetch all data to show the new review
    };

    return (
        <div className="space-y-6">
            {/* Quick Actions Menu */}
            <ErrorBoundary componentName="Quick Actions">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link to="/post-gig" className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-4 border border-gray-100 group">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800">Post New Gig</h4>
                            <p className="text-xs text-gray-500">Hire top talent</p>
                        </div>
                    </Link>
                    <Link to="/freelancers" className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-4 border border-gray-100 group">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800">Search Talent</h4>
                            <p className="text-xs text-gray-500">Browse profiles</p>
                        </div>
                    </Link>
                    <Link to="/history" className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-4 border border-gray-100 group">
                        <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800">Transactions</h4>
                            <p className="text-xs text-gray-500">Payment history</p>
                        </div>
                    </Link>
                </div>
            </ErrorBoundary>

            {/* Key Stats */}
            <ErrorBoundary componentName="Key Stats">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl shadow-sm hover:-translate-y-1 transition-transform">
                        <h4 className="text-blue-800 font-semibold mb-1">Open Gigs</h4>
                        <p className="text-4xl font-extrabold text-blue-600">{openGigsCount}</p>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-100 p-6 rounded-2xl shadow-sm hover:-translate-y-1 transition-transform">
                        <h4 className="text-yellow-800 font-semibold mb-1">In Progress</h4>
                        <p className="text-4xl font-extrabold text-yellow-600">{inProgressGigsCount}</p>
                    </div>
                    <div className="bg-green-50 border border-green-100 p-6 rounded-2xl shadow-sm hover:-translate-y-1 transition-transform">
                        <h4 className="text-green-800 font-semibold mb-1">Completed</h4>
                        <p className="text-4xl font-extrabold text-green-600">{completedGigs.length}</p>
                    </div>
                </div>
            </ErrorBoundary>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* My Active Gigs Card */}
                <ErrorBoundary componentName="Active Gigs">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-xl font-bold mb-4 text-gray-800">My Active Gigs</h3>
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : activeGigs.length > 0 ? (
                            <ul className="divide-y divide-gray-100">
                                {activeGigs.map(gig => (
                                    <li key={gig._id} className="py-3 flex justify-between items-center group">
                                        <Link to={`/gigs/${gig._id}`} className="font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">
                                            {gig.title}
                                        </Link>
                                        <span className="text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full text-sm">₹{gig.budget}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center py-10 px-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 mt-2">
                                <div className="w-16 h-16 bg-blue-50 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                                </div>
                                <h4 className="text-lg font-bold text-gray-700 mb-2">No Active Gigs</h4>
                                <p className="text-gray-500 mb-4 max-w-sm mx-auto text-sm">You don't have any gigs currently open or in progress.</p>
                                <Link to="/post-gig" className="inline-block bg-blue-600 text-white font-medium px-6 py-2 rounded-full hover:bg-blue-700 transition-colors">Post a Gig Now</Link>
                            </div>
                        )}
                    </div>
                </ErrorBoundary>

                {/* Completed Gigs Card */}
                <ErrorBoundary componentName="Completed Gigs">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-xl font-bold mb-4 text-gray-800">Completed Gigs</h3>
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : completedGigs.length > 0 ? (
                            <ul className="divide-y divide-gray-100">
                                {completedGigs.map(gig => {
                                    const review = reviewMap.get(gig._id);
                                    return (
                                        <li key={gig._id} className="py-3 flex justify-between items-center group">
                                            <div className="flex-1">
                                                <Link to={`/gigs/${gig._id}`} className="font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">
                                                    {gig.title}
                                                </Link>
                                                {review ? (
                                                    <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                                                        Reviewed ({review.rating})
                                                    </p>
                                                ) : (
                                                    <button
                                                        onClick={() => setReviewingGigId(gig._id)}
                                                        className="text-sm text-blue-500 hover:text-blue-700 mt-1 underline"
                                                    >
                                                        Leave a review
                                                    </button>
                                                )}
                                            </div>
                                            <span className="text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full text-sm">₹{gig.budget}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <div className="text-center py-10 px-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 mt-2">
                                <div className="w-16 h-16 bg-green-50 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                </div>
                                <h4 className="text-lg font-bold text-gray-700 mb-2">No Completed Gigs</h4>
                                <p className="text-gray-500 mb-4 max-w-sm mx-auto text-sm">Once a freelancer finishes your project, it will appear here.</p>
                            </div>
                        )}
                    </div>
                </ErrorBoundary>
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