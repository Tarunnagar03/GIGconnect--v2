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

import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import ReviewCard from '../components/ReviewCard'; // We'll use your existing component
import ProjectCardSkeleton from '../components/ProjectCardSkeleton';

const MyCompletedProjectsPage = () => {
    const [completedGigs, setCompletedGigs] = useState([]);
    const [reviews, setReviews] = useState(new Map());
    const [loading, setLoading] = useState(true);
    const { auth } = useContext(AuthContext);

    useEffect(() => {
        if (!auth.user) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const assignedGigs = await api.get('/gigs/my-assigned-gigs').catch(err => { console.error(err); return { data: [] }; });
                const freelancerReviews = await api.get(`/reviews/${auth.user.id}`).catch(err => { console.error(err); return { data: [] }; });

                // Filter for completed gigs
                const gigsArray = Array.isArray(assignedGigs.data) ? assignedGigs.data : [];
                setCompletedGigs(gigsArray.filter(gig => gig.status === 'Completed'));

                // Create a map of reviews for easy lookup by gig ID
                const reviewMap = new Map((Array.isArray(freelancerReviews.data) ? freelancerReviews.data : []).map(review => [review.gig?._id || review.gig, review]));
                setReviews(reviewMap);

            } catch (err) {
                console.error("Error fetching completed projects data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [auth.user]);

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
                        const review = reviews.get(gig._id); // Find the matching review
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
                                    <ReviewCard review={review} />
                                ) : (
                                    <p className="text-gray-500 italic text-sm">The client has not left a review for this gig yet.</p>
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
                    <p className="text-gray-500">You have no completed gigs yet.</p>
                </div>
            )}
        </div>
    );
};

export default MyCompletedProjectsPage;