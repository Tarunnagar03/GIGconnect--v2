import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

// Reusable list component for this page
const InfoSection = ({ title, items }) => {
    if (!items || items.length === 0) return null; // Don't render if empty
    return (
        <div className="border-b pb-4 mb-4">
            <h2 className="text-2xl font-bold mb-3 text-blue-600">{title}</h2>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
                {items.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
        </div>
    );
};

const AboutMePage = () => {
    const [profile, setProfile] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const { auth } = useContext(AuthContext);

    useEffect(() => {
        if (!auth.user) return;
        
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch both profile and user data
                const [profileRes, userRes] = await Promise.all([
                    api.get('/profiles/me').catch(e => null), // Allow profile to be null
                    api.get('/users/me')
                ]);
                
                setProfile(profileRes?.data);
                setUser(userRes.data);
            } catch (err) {
                console.error("Error fetching data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [auth.user]);

    if (loading) {
        return <div className="text-center mt-10">Loading your information...</div>;
    }

    if (!user) {
        return <p className="text-center text-red-500">Could not load user data.</p>;
    }

    // Client View
    if (auth.user.role === 'Client') {
        return (
            <div className="max-w-4xl mx-auto">
                <Link to="/dashboard" className="inline-block mb-6 text-blue-600 hover:underline">
                    &larr; Back to Dashboard
                </Link>
                <h1 className="text-3xl font-bold mb-6">About Me</h1>
                <div className="bg-white p-8 rounded-lg shadow-md space-y-4">
                    <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
                    <p className="text-gray-600">You are registered as a **Client**. Your account is active and you can post gigs to find talented freelancers.</p>
                    <Link to="/settings/details" className="inline-block bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700">
                        Edit Personal Details
                    </Link>
                </div>
            </div>
        );
    }

    // Freelancer View
    return (
        <div className="max-w-4xl mx-auto">
            <Link to="/dashboard" className="inline-block mb-6 text-blue-600 hover:underline">
                &larr; Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold mb-6">About Me</h1>
            <div className="bg-white p-8 rounded-lg shadow-md">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800">{user.name}</h2>
                        <p className="text-lg text-gray-500">{user.headline || 'No headline provided.'}</p>
                    </div>
                    <Link to="/create-profile" className="inline-block bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700">
                        Edit My Profile
                    </Link>
                </div>
                
                {profile ? (
                    <div className="mt-6 space-y-6">
                        {profile.bio && (
                            <div className="border-t pt-6">
                                <h3 className="text-2xl font-bold mb-3 text-blue-600">My Bio</h3>
                                <p className="text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
                            </div>
                        )}
                        <InfoSection title="Education" items={profile.education} />
                        <InfoSection title="Achievements" items={profile.achievements} />
                    </div>
                ) : (
                    <div className="mt-6 border-t pt-6 text-center">
                        <p className="text-gray-500 mb-4">You have not created your professional profile yet. (Skills, Bio, Education, etc.)</p>
                        <Link to="/create-profile" className="inline-block bg-green-500 text-white font-bold py-2 px-4 rounded hover:bg-green-600">
                            Create Your Profile
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AboutMePage;