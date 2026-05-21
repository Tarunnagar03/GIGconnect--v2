import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import StarRating from '../components/StarRating';

const ClientProfilePage = () => {
    const { clientId } = useParams();
    const navigate = useNavigate();
    const { auth } = React.useContext(AuthContext);
    
    const [clientUser, setClientUser] = useState(null);
    const [clientProfile, setClientProfile] = useState(null);
    const [clientGigs, setClientGigs] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchClientData = async () => {
            setLoading(true);
            setError('');
            try {
                
                // Fetch the client's extended profile (Bio, Website, etc.)
                const profRes = await api.get(`/profiles/user/${clientId}`).catch(() => ({ data: null }));
                setClientProfile(profRes.data);
                
                
                // Safely filter gigs belonging to this client
                const gigsRes = await api.get(`/gigs`).catch(() => ({ data: [] })); // Fallback to all gigs, we'll filter below
                const allGigs = Array.isArray(gigsRes.data) ? gigsRes.data : [];
                const thisClientGigs = allGigs.filter(g => g.client?._id === clientId || g.client === clientId);
                setClientGigs(thisClientGigs);

                // Smart Fallback Logic: Try to get user details directly
                let userData = null;
                try {
                    const userRes = await api.get(`/users/${clientId}`);
                    userData = userRes.data;
                } catch (err) {
                    // Fallback 1: Extract from populated profile
                    if (profRes.data?.user && profRes.data.user.name) {
                        userData = profRes.data.user;
                    } 
                    // Fallback 2: Extract from a populated gig
                    else if (thisClientGigs.length > 0 && thisClientGigs[0].client?.name) {
                        userData = thisClientGigs[0].client;
                    } else {
                        // Ultimate fallback if nothing is found
                        userData = { name: 'Unknown Client', createdAt: new Date() };
                    }
                }
                setClientUser(userData);
                
                // Fetch real reviews written by freelancers for this client
                const reviewsRes = await api.get(`/reviews/client/${clientId}`).catch(() => ({ data: [] }));
                setReviews(Array.isArray(reviewsRes.data) ? reviewsRes.data : []);
            } catch (err) {
                console.error("Error fetching client profile:", err);
                setError('Could not load client profile.');
            } finally {
                setLoading(false);
            }
        };
        fetchClientData();
    }, [clientId]);

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto p-8 animate-pulse">
                <div className="h-32 bg-gray-200 rounded-2xl mb-8"></div>
                <div className="h-64 bg-gray-200 rounded-2xl"></div>
            </div>
        );
    }

    if (error || !clientUser) {
        return (
            <div className="text-center mt-20">
                <h2 className="text-2xl font-bold text-red-500">{error || 'Client not found'}</h2>
                <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline mt-4 inline-block font-medium">&larr; Go Back</button>
            </div>
        );
    }

    const totalGigs = clientGigs.length;
    const activeGigs = clientGigs.filter(g => g.status === 'Open').length;
    const avgRating = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;

    // Determine contact visibility
    const showContactInfo = clientUser.contactVisibility === 'Everyone' || (clientUser.contactVisibility === 'Connections' && auth?.isAuthenticated);

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 mb-6 text-gray-600 hover:text-blue-600 font-semibold bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm hover:shadow hover:border-blue-200 transition-all group">
                <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Back
            </button>

            {/* Header Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8 hover:shadow-xl transition-shadow duration-300">
                <div className="h-24 bg-gradient-to-r from-blue-900 to-slate-800"></div>
                <div className="px-8 pb-8">
                    <div className="flex justify-between items-start">
                        <div className="w-28 h-28 bg-white rounded-full p-1 shadow-lg flex-shrink-0 -mt-12">
                            <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-5xl font-bold">
                            {(clientUser.companyName || clientUser.name || 'C').charAt(0).toUpperCase()}
                        </div>
                    </div>
                        {/* Trust Badge */}
                        <div className="mt-4 bg-green-50 border border-green-100 text-green-700 px-4 py-2 rounded-full flex items-center gap-2 shadow-sm font-semibold text-sm">
                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            Payment Verified
                        </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mt-4 mb-6 gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">{clientUser.companyName || clientUser.name}</h1>
                            {clientUser.companyName && <p className="text-base text-blue-600 font-medium mt-1">Rep: {clientUser.name}</p>}
                            <div className="flex items-center mt-2">
                                <StarRating rating={avgRating} />
                                <span className="ml-2 text-gray-600 text-sm font-medium">({reviews.length} reviews)</span>
                            </div>
                        </div>
                        <div className="w-full md:w-auto text-left md:text-right">
                            <p className="text-sm text-gray-500">Member since {new Date(clientUser.createdAt || Date.now()).getFullYear()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Contact Information Section --- */}
            {showContactInfo && (clientUser.email || clientUser.phone) && (
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 mb-8 hover:shadow-lg transition-shadow duration-300">
                    <h2 className="text-sm font-bold uppercase tracking-wider mb-4 text-gray-800">Contact Information</h2>
                    <div className="space-y-3 text-sm text-gray-700">
                        {clientUser.email && <p className="flex items-center gap-2"><span className="text-lg">📧</span> <strong>Email:</strong> <a href={`mailto:${clientUser.email}`} className="text-blue-600 hover:underline">{clientUser.email}</a></p>}
                        {clientUser.phone && <p className="flex items-center gap-2"><span className="text-lg">📱</span> <strong>Phone:</strong> <a href={`tel:${clientUser.phone}`} className="text-blue-600 hover:underline">{clientUser.phone}</a></p>}
                    </div>
                </div>
            )}

            {/* --- About The Business Section --- */}
            {clientProfile && (clientProfile.bio || clientProfile.portfolio || clientProfile.locationText || (clientProfile.services && clientProfile.services.length > 0)) && (
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 mb-8 hover:shadow-lg transition-shadow duration-300">
                    <h2 className="text-sm font-bold uppercase tracking-wider mb-4 text-gray-800">About the Business</h2>
                    {clientProfile.bio && <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap mb-6">{clientProfile.bio}</p>}
                    
                    {clientProfile.services && clientProfile.services.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Industry & Services</h3>
                            <div className="flex flex-wrap gap-2">
                                {(Array.isArray(clientProfile.services) ? clientProfile.services : clientProfile.services.split(',')).map((service, index) => (
                                    <span key={index} className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">{service}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-6 border-t border-gray-100 pt-4">
                        {clientProfile.locationText && (
                            <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                {clientProfile.locationText}
                            </div>
                        )}
                        {clientProfile.portfolio && (
                            <div className="flex items-center gap-2 text-sm text-blue-600 font-bold">
                                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                                <a href={clientProfile.portfolio.startsWith('http') ? clientProfile.portfolio : `https://${clientProfile.portfolio}`} target="_blank" rel="noopener noreferrer" className="hover:underline">{clientProfile.portfolio.replace(/^https?:\/\//, '')}</a>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Stats */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-4">Client Statistics</h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold">Total Gigs Posted</p>
                                <p className="text-2xl font-bold text-blue-600">{totalGigs}</p>
                            </div>
                            <div className="border-t border-gray-100 pt-4">
                                <p className="text-xs text-gray-500 uppercase font-semibold">Active Gigs</p>
                                <p className="text-2xl font-bold text-green-600">{activeGigs}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Open Gigs */}
                <div className="md:col-span-2 space-y-8">
                    {/* Open Gigs Section */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-6">Open Gigs by this Client</h3>
                        {activeGigs > 0 ? (
                            <div className="space-y-4">
                                {clientGigs.filter(g => g.status === 'Open').map(gig => (
                                    <div key={gig._id} className="border border-gray-100 p-4 rounded-xl hover:bg-gray-50 transition-colors flex justify-between items-center group">
                                        <div>
                                            <Link to={`/gigs/${gig._id}`} className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{gig.title}</Link>
                                            <p className="text-sm text-gray-500 mt-1">Posted {new Date(gig.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right ml-4">
                                            <p className="font-extrabold text-green-600">₹{gig.budget}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">No open gigs at the moment.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* --- Reviews Section --- */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 mt-8">
                <h2 className="text-sm font-bold uppercase tracking-wider mb-6 text-gray-800">Reviews from Freelancers ({reviews.length})</h2>
                {reviews.length > 0 ? (
                    <ul className="space-y-6">
                        {reviews.map(review => (
                            <li key={review._id} className="border-b pb-6 last:border-b-0">
                                <div className="flex items-center mb-2">
                                    <StarRating rating={review.rating} />
                                    <span className="ml-3 font-bold text-gray-700 text-sm">{review.reviewer?.name || 'Unknown Freelancer'}</span>
                                </div>
                                <p className="text-gray-600 italic text-sm">"{review.comment}"</p>
                                <p className="text-xs text-gray-400 mt-2">
                                    Posted on {new Date(review.createdAt).toLocaleDateString()}
                                </p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500">This client has no reviews yet.</p>
                )}
            </div>
        </div>
    );
};

export default ClientProfilePage;