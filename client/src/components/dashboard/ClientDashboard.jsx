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
            {/* Get Started Card (Unchanged) */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-4">Get Started</h3>
                <p className="text-gray-600 mb-4">Ready to bring your next project to life? Post a new gig to find top local talent.</p>
                <Link to="/post-gig" className="inline-block bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition-colors">
                    Post a New Gig
                </Link>
            </div>

            {/* Key Stats Card (Unchanged) */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-4">Key Stats</h3>
                <div className="flex justify-around text-center">
                    <div>
                        <span className="text-3xl font-bold text-blue-600">{openGigs.length}</span>
                        <p className="text-gray-500">Active Gigs</p>
                    </div>
                    <div>
                        <span className="text-3xl font-bold text-gray-400">0</span>
                        <p className="text-gray-500">Proposals</p>
                    </div>
                    <div>
                        <span className="text-3xl font-bold text-green-600">{completedGigs.length}</span>
                        <p className="text-gray-500">Completed</p>
                    </div>
                </div>
            </div>

            {/* My Active Gigs Card (Unchanged) */}
            <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-4">My Active Gigs</h3>
                {loading ? ( <p>Loading...</p> ) : openGigs.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                        {openGigs.map(gig => (
                            <li key={gig._id} className="py-3 flex justify-between items-center">
                                <Link to={`/gigs/${gig._id}`} className="font-semibold text-blue-600 hover:underline">
                                    {gig.title}
                                </Link>
                                <span className="text-gray-500">${gig.budget}</span>
                            </li>
                        ))}
                    </ul>
                ) : ( <p className="text-gray-500">You have no active gig postings.</p> )}
            </div>
            
            {/* --- UPDATED: Completed Gigs Card --- */}
            <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-4">Completed Gigs</h3>
                {loading ? ( <p>Loading...</p> ) : completedGigs.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                        {completedGigs.map(gig => {
                            // Check if a review exists for this gig
                            const existingReview = reviewMap.get(gig._id);
                            
                            return (
                                <li key={gig._id} className="py-3">
                                    <div className="flex justify-between items-center">
                                        <Link to={`/gigs/${gig._id}`} className="font-semibold text-gray-700 hover:text-blue-600">
                                            {gig.title}
                                        </Link>
                                        
                                        {/* --- UPDATED: Conditionally show button or "Submitted" --- */}
                                        {existingReview ? (
                                            <span className="text-green-600 font-semibold text-sm">✓ Review Submitted</span>
                                        ) : (
                                            <button 
                                                onClick={() => setReviewingGigId(reviewingGigId === gig._id ? null : gig._id)}
                                                className="bg-green-500 text-white font-bold py-1 px-3 text-sm rounded hover:bg-green-600"
                                            >
                                                {reviewingGigId === gig._id ? 'Cancel' : 'Leave a Review'}
                                            </button>
                                        )}
                                    </div>
                                    
                                    {/* Show the review form if this gig is selected */}
                                    {reviewingGigId === gig._id && (
                                        <ReviewForm 
                                            gigId={gig._id} 
                                            onClose={() => setReviewingGigId(null)}
                                            onSubmitSuccess={handleReviewSuccess}
                                        />
                                    )}
                                    
                                    {/* Show the submitted review card if it exists */}
                                    {existingReview && (
                                        <ReviewCard review={existingReview} />
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                ) : <p className="text-gray-500">No completed gigs.</p>}
            </div>
        </div>
    );
};

export default ClientDashboard;