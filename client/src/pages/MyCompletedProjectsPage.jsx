import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import ReviewCard from '../components/ReviewCard'; // We'll use your existing component

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
                // Fetch completed gigs and reviews simultaneously
                const [gigsRes, reviewsRes] = await Promise.all([
                    api.get('/gigs/my-assigned-gigs'),
                    api.get(`/reviews/me/my-reviews`) // This is the client's reviews, let's get freelancer's reviews
                    // We'll use the freelancer's public profile review endpoint
                ]);

                // This logic is slightly complex, let's simplify
                // We'll fetch assigned gigs and reviews FOR the freelancer
                const assignedGigs = await api.get('/gigs/my-assigned-gigs');
                const freelancerReviews = await api.get(`/reviews/${auth.user.id}`); // Get reviews *for* me

                // Filter for completed gigs
                setCompletedGigs(assignedGigs.data.filter(gig => gig.status === 'Completed'));

                // Create a map of reviews for easy lookup by gig ID
                const reviewMap = new Map(freelancerReviews.data.map(review => [review.gig, review]));
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
        return <div className="text-center mt-10">Loading completed projects...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <Link to="/dashboard" className="inline-block mb-6 text-blue-600 hover:underline">
                &larr; Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold mb-6">My Completed Projects</h1>

            {completedGigs.length > 0 ? (
                <div className="space-y-6">
                    {completedGigs.map(gig => {
                        const review = reviews.get(gig._id); // Find the matching review
                        return (
                            <div key={gig._id} className="bg-white p-6 rounded-lg shadow-md">
                                <h2 className="text-2xl font-bold text-blue-600 mb-2">{gig.title}</h2>
                                <p className="text-lg font-semibold text-green-600 mb-4">${gig.budget}</p>
                                {review ? (
                                    <ReviewCard review={review} />
                                ) : (
                                    <p className="text-gray-500 italic">The client has not left a review for this project yet.</p>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                    <p className="text-gray-500">You have no completed projects yet.</p>
                </div>
            )}
        </div>
    );
};

export default MyCompletedProjectsPage;