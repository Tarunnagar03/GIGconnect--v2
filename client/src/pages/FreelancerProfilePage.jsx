import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';

// Reusable Star Rating (Display Only)
const StarRating = ({ rating }) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
        stars.push(<span key={i} className={`text-xl ${i <= rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>);
    }
    return <div className="flex items-center">{stars}</div>;
};

// Reusable list component for new sections
const ProfileSectionList = ({ title, items }) => {
    if (!items || items.length === 0) return null; // Don't render if empty
    return (
        <div className="border-t mt-6 pt-6">
            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
                {items.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
        </div>
    );
};

const FreelancerProfilePage = () => {
    const { freelancerId } = useParams();
    const [profile, setProfile] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError('');
            try {
                const [profileRes, reviewsRes] = await Promise.all([
                    api.get(`/profiles/user/${freelancerId}`),
                    api.get(`/reviews/${freelancerId}`)
                ]);
                setProfile(profileRes.data);
                setReviews(reviewsRes.data);
            } catch (err) {
                console.error("Error fetching freelancer data:", err);
                setError('Could not load freelancer profile.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [freelancerId]);

    const avgRating = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;

    if (loading) return <div className="text-center mt-20">Loading profile...</div>;

    if (error || !profile) {
        return (
            <div className="text-center mt-20">
                <h2 className="text-2xl font-bold text-red-500">{error || 'Profile not found'}</h2>
                <p className="text-gray-500">This freelancer may not have set up their profile yet.</p>
                <Link to="/gigs" className="text-blue-600 hover:underline mt-4 inline-block">&larr; Back to gigs</Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* --- Profile Header Section --- */}
            <div className="bg-white p-8 rounded-lg shadow-md mb-6">
                <div className="flex flex-col md:flex-row items-center">
                    <div className="w-24 h-24 bg-gray-300 rounded-full flex-shrink-0 flex items-center justify-center text-4xl text-gray-500 mb-4 md:mb-0 md:mr-6">
                        {profile.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-center md:text-left">
                        <h1 className="text-3xl font-bold text-gray-800">{profile.user.name}</h1>
                        <p className="text-lg text-gray-500">{profile.headline || 'Freelancer'}</p>
                        <div className="flex items-center justify-center md:justify-start mt-2">
                            <StarRating rating={avgRating} />
                            <span className="ml-2 text-gray-600">({reviews.length} reviews)</span>
                        </div>
                    </div>
                    <div className="md:ml-auto mt-4 md:mt-0 text-center md:text-right">
                        <div className="text-3xl font-bold text-green-600">${profile.rate || '0'}/hr</div>
                        <p className="text-gray-500">Hourly Rate</p>
                    </div>
                </div>

                {/* --- About Me / Bio --- */}
                {profile.bio && (
                    <div className="border-t mt-6 pt-6">
                        <h3 className="text-xl font-bold mb-3">About Me</h3>
                        <p className="text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
                    </div>
                )}
                
                {/* --- NEW SECTIONS --- */}
                <ProfileSectionList title="Services I Offer" items={profile.services} />
                <ProfileSectionList title="Education" items={profile.education} />
                <ProfileSectionList title="Achievements" items={profile.achievements} />
                <ProfileSectionList title="Skills" items={profile.skills} />
                
            </div>

            {/* --- Reviews Section --- */}
            <div className="bg-white p-8 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-6">Client Reviews</h2>
                {reviews.length > 0 ? (
                    <ul className="space-y-6">
                        {reviews.map(review => (
                            <li key={review._id} className="border-b pb-6 last:border-b-0">
                                <div className="flex items-center mb-2">
                                    <StarRating rating={review.rating} />
                                    <span className="ml-4 font-bold text-gray-700">{review.client.name}</span>
                                </div>
                                <p className="text-gray-600 italic">"{review.comment}"</p>
                                <p className="text-xs text-gray-400 mt-2">
                                    Posted on {new Date(review.createdAt).toLocaleDateString()}
                                </p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500">This freelancer has no reviews yet.</p>
                )}
            </div>
        </div>
    );
};

export default FreelancerProfilePage;