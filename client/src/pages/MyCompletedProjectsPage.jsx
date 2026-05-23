/**
 * MyCompletedProjectsPage Component
 * UPDATED: May 6, 2026 - Project History Enhancement
 * 
 * Features:
 * - View completed projects/gigs
 * - Project details and status
 * - Client/Freelancer information
 * - Rating and review display
 * - Filter and sort options
 * - Professional layout with modern design
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import ReviewCard from '../components/ReviewCard'; // We'll use your existing component
import ReviewForm from '../components/ReviewForm';
import ProjectCardSkeleton from '../components/ProjectCardSkeleton';

const MyCompletedProjectsPage = () => {
    const { auth } = useAuth();
    const [completedGigs, setCompletedGigs] = useState([]);
    const [reviewMap, setReviewMap] = useState(new Map());
    const [loading, setLoading] = useState(true);
    const [reviewingData, setReviewingData] = useState(null);

    useEffect(() => {
        if (!auth.isAuthenticated) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const [gigsRes, reviewsRes] = await Promise.all([
                    api.get('/gigs/my-assigned-gigs').catch(() => ({ data: [] })),
                    api.get('/reviews/me/my-reviews').catch(() => ({ data: [] }))
                ]);

                const gigsArray = Array.isArray(gigsRes.data) ? gigsRes.data : [];
                setCompletedGigs(gigsArray.filter(gig => gig.status === 'Completed'));

                const rMap = new Map((Array.isArray(reviewsRes.data) ? reviewsRes.data : []).map(review => [String(review.gig?._id || review.gig), review]));
                setReviewMap(rMap);
                
            } catch (err) {
                console.error("Error fetching completed projects:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [auth.isAuthenticated]);

    const handleReviewSuccess = () => {
        alert('Review saved successfully!');
        setReviewingData(null);
        window.location.reload();
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="h-5 bg-gray-300 rounded w-32 mb-6 animate-pulse"></div>
                <div className="h-8 bg-gray-300 rounded w-1/2 mb-6 animate-pulse"></div>
                <div className="space-y-6">
                    <ProjectCardSkeleton />
                    <ProjectCardSkeleton />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto animate-fade-in">
            <Link to="/dashboard" className="inline-flex items-center gap-2 mb-6 text-gray-600 hover:text-blue-600 font-semibold bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm hover:shadow hover:border-blue-200 transition-all group">
                <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Back to Dashboard
            </Link>
            <h1 className="text-4xl font-extrabold mb-8 text-gray-800 tracking-tight">My Completed Gigs</h1>

            {completedGigs.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {completedGigs.map(gig => {
                        const review = reviewMap.get(String(gig._id)); // FIX: String cast for correct matching
                        return (
                            <div key={gig._id} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <Link to={`/gigs/${gig._id}`} className="text-2xl font-bold text-blue-600 hover:text-blue-800 transition-colors block leading-tight flex-1 pr-4">
                                    {gig.title}
                                </Link>
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-semibold whitespace-nowrap">
                                        <span className="w-2 h-2 rounded-full bg-green-500"></span> Completed
                                    </span>
                                </div>
                                <p className="text-xl font-bold text-gray-800 mb-6 bg-gray-50 inline-block px-4 py-2 rounded-lg self-start">₹{gig.budget}</p>
                                <div className="mt-auto border-t border-gray-100 pt-4">
                                {review ? (
                                    <ReviewCard review={review} onEditClick={(rev) => setReviewingData({ gigId: gig._id, initialReview: rev })} />
                                ) : (
                                    <button
                                        onClick={() => setReviewingData({ gigId: gig._id, initialReview: null })}
                                        className="w-full text-sm text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 font-bold py-3 rounded-xl transition-all flex justify-center items-center gap-2 border border-blue-100 hover:border-blue-600 shadow-sm"
                                    >
                                        ⭐ Leave a review for Client
                                    </button>
                                )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
                    <div className="w-24 h-24 bg-blue-50 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <h3 className="text-2xl font-extrabold text-gray-800 mb-2">No completed projects yet</h3>
                    <p className="text-gray-500 font-medium">Once you successfully finish a gig, it will appear here along with your client reviews.</p>
                </div>
            )}

            {/* Review Form Modal */}
            {reviewingData && (
                <ReviewForm
                    gigId={reviewingData.gigId}
                    initialReview={reviewingData.initialReview}
                    onClose={() => setReviewingData(null)}
                    onSubmitSuccess={handleReviewSuccess}
                />
            )}
        </div>
    );
};

export default MyCompletedProjectsPage;