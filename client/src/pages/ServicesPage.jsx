import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

const ServicesPage = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const { auth } = useContext(AuthContext);

    useEffect(() => {
        if (auth.user?.role === 'Freelancer') {
            api.get('/profiles/me')
                .then(res => setProfile(res.data))
                .catch(err => console.error("No profile found", err))
                .finally(() => setLoading(false));
        } else {
            setLoading(false); // No profile to load for clients
        }
    }, [auth.user]);

    // Client View
    if (auth.user?.role === 'Client') {
        return (
             <div className="max-w-4xl mx-auto">
                <Link to="/dashboard" className="inline-block mb-6 text-blue-600 hover:underline">&larr; Back to Dashboard</Link>
                <h1 className="text-3xl font-bold mb-6">Our Services</h1>
                <div className="bg-white p-8 rounded-lg shadow-md space-y-6">
                    <p className="text-gray-700">As a client, you can post gigs, receive proposals from talented freelancers, manage your projects, and handle payments securely.</p>
                    <Link to="/post-gig" className="inline-block bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700">
                        Post a New Gig
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
            <h1 className="text-3xl font-bold mb-6">My Services</h1>
            {loading ? (
                <p>Loading services...</p>
            ) : profile && profile.services?.length > 0 ? (
                <div className="bg-white p-8 rounded-lg shadow-md">
                    <p className="text-gray-600 mb-4">Here is a list of the services you offer. You can update these on your profile page.</p>
                    <ul className="list-disc list-inside space-y-2">
                        {profile.services.map((service, index) => (
                            <li key={index} className="text-lg text-gray-700">{service}</li>
                        ))}
                    </ul>
                    {/* --- "Edit" Button Removed --- */}
                </div>
            ) : (
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                    <p className="text-gray-500 mb-4">You have not listed any services yet.</p>
                    <Link to="/create-profile" className="inline-block bg-green-500 text-white font-bold py-2 px-4 rounded hover:bg-green-600">
                        Add Services to Your Profile
                    </Link>
                </div>
            )}
        </div>
    );
};

export default ServicesPage;