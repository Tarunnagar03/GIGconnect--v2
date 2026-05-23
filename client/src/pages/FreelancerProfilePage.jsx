import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { getServiceTheme, getRelatedSkills } from '../utils/serviceHelpers';
import StarRating from '../components/StarRating';
import { EducationSection, InfoSection as ProfileSectionList, getRichPortfolio } from '../components/SharedProfileComponents';
import { useQuery } from '@tanstack/react-query';

const ProfilePageSkeleton = () => (
    <div className="max-w-4xl mx-auto animate-pulse">
        <div className="bg-white p-8 rounded-lg shadow-md mb-6">
            <div className="flex flex-col md:flex-row items-center">
                <div className="w-24 h-24 bg-gray-300 rounded-full flex-shrink-0"></div>
                <div className="mt-4 md:mt-0 md:ml-6 text-center md:text-left">
                    <div className="h-8 bg-gray-300 rounded w-48 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-32"></div>
                </div>
                <div className="md:ml-auto mt-4 md:mt-0 text-center md:text-right">
                    <div className="h-8 bg-gray-300 rounded w-24 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
            </div>
            <div className="border-t mt-6 pt-6">
                <div className="h-6 bg-gray-300 rounded w-32 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
        </div>
        <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="h-7 bg-gray-300 rounded w-40 mb-6"></div>
            <div className="space-y-6">
                <div className="border-b pb-6">
                    <div className="h-5 bg-gray-300 rounded w-24 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
            </div>
        </div>
    </div>
);

const FreelancerProfilePage = () => {
    const { freelancerId } = useParams();
    const navigate = useNavigate();
    const { auth } = useAuth();
    const [orderingPkg, setOrderingPkg] = useState(null);

    const { data: profile, isLoading: isProfileLoading, error: profileError } = useQuery({
        queryKey: ['freelancerProfile', freelancerId],
        queryFn: async () => (await api.get(`/profiles/user/${freelancerId}`)).data,
        retry: false
    });

    const { data: reviews = [], isLoading: isReviewsLoading } = useQuery({
        queryKey: ['freelancerReviews', freelancerId],
        queryFn: async () => {
            try {
                const res = await api.get(`/reviews/${freelancerId}`);
                return Array.isArray(res.data) ? res.data : [];
            } catch (err) { return []; }
        }
    });

    const loading = isProfileLoading || isReviewsLoading;
    const error = profileError ? 'Could not load freelancer profile.' : '';

    const avgRating = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;

    // Determine contact visibility
    const showContactInfo = profile?.user?.contactVisibility === 'Everyone' || (profile?.user?.contactVisibility === 'Connections' && auth?.isAuthenticated);
    const parsedPortfolio = getRichPortfolio(profile?.portfolio);

    const handleOrderNow = async (pkg) => {
        if (!auth?.isAuthenticated || auth?.user?.role !== 'Client') {
            alert("Please log in as a Client to purchase this package.");
            return;
        }
        if (!window.confirm(`Ready to order "${pkg.title}" for ₹${pkg.price}? You will be redirected to payment.`)) return;

        setOrderingPkg(pkg.title);
        try {
            const payload = {
                title: `Order: ${pkg.title}`,
                description: `Instant Package Order:\n\nDeliverables:\n${pkg.description}\n\nDelivery Time: ${pkg.deliveryTime}`,
                budget: Number(pkg.price),
                assignedFreelancer: profile.user._id,
            };
            const res = await api.post('/gigs/instant-order', payload);
            navigate(`/payment/${res.data._id}`);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.msg || 'Failed to create instant order. Please ensure the backend endpoint is set up.');
        } finally {
            setOrderingPkg(null);
        }
    };

    if (loading) return <ProfilePageSkeleton />;

    if (error || !profile) {
        return (
            <div className="text-center mt-20">
                <h2 className="text-2xl font-bold text-red-500">{error || 'Profile not found'}</h2>
                <p className="text-gray-500">This freelancer may not have set up their profile yet.</p>
                <Link to="/freelancers" className="text-purple-600 hover:underline mt-4 inline-block font-medium">&larr; Back to Find Freelancers</Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <button onClick={() => window.history.back()} className="inline-flex items-center gap-2 mb-6 text-gray-600 hover:text-purple-600 font-semibold bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm hover:shadow hover:border-purple-200 transition-all group">
                <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Back
            </button>
            {/* --- Profile Header Section --- */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8 hover:shadow-xl transition-shadow duration-300">
                <div className="h-24 bg-gradient-to-r from-blue-900 to-slate-800"></div>
                <div className="px-8 pb-8">
                    <div className="flex justify-between items-start">
                        <div className="w-28 h-28 bg-white rounded-full p-1 shadow-lg flex-shrink-0 -mt-12">
                            <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-5xl font-bold">
                                {(profile?.user?.name || 'U').charAt(0).toUpperCase()}
                                </div>
                            </div>
                        <Link 
                            to={`/chat/${profile?.user?._id || ''}?greeting=true`} 
                            className="mt-4 bg-purple-600 text-white font-bold py-2.5 px-6 rounded-full hover:bg-purple-700 transition-colors shadow-md flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                            Message
                        </Link>
                    </div>
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mt-4 mb-6 gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">{profile?.user?.name || 'Unknown User'}</h1>
                            <p className="text-base text-purple-600 font-medium mt-1">{profile.headline || 'Freelancer'}</p>
                            {profile.experience && (Number(profile.experience.years) > 0 || Number(profile.experience.months) > 0) && (
                                <div className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1.5 rounded-lg mt-2 border border-blue-100 shadow-sm">
                                    💼 {profile.experience.years ? `${profile.experience.years} Yrs ` : ''}{profile.experience.months ? `${profile.experience.months} Mos ` : ''}Experience
                                </div>
                            )}
                            <div className="flex items-center mt-2">
                                <StarRating rating={avgRating} />
                                <span className="ml-2 text-gray-600 text-sm font-medium">({reviews.length} reviews)</span>
                            </div>
                        </div>
                        <div className="w-full md:w-auto text-center md:text-right bg-purple-50 px-5 py-3 rounded-xl border border-purple-100">
                            <div className="text-2xl font-extrabold text-purple-700">₹{profile.rate || '0'}<span className="text-base text-purple-500 font-medium">/hr</span></div>
                            <p className="text-purple-600 text-xs font-medium uppercase tracking-wide">Hourly Rate</p>
                        </div>
                    </div>

                {/* --- Contact Information Section --- */}
                {showContactInfo && (profile.user?.email || profile.user?.phone) && (
                    <div className="border-t border-gray-100 mt-6 pt-6">
                        <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-gray-800">Contact Information</h3>
                        <div className="space-y-3 text-sm text-gray-700">
                            {profile.user.email && <p className="flex items-center gap-2"><span className="text-lg">📧</span> <strong>Email:</strong> <a href={`mailto:${profile.user.email}`} className="text-blue-600 hover:underline">{profile.user.email}</a></p>}
                            {profile.user.phone && <p className="flex items-center gap-2"><span className="text-lg">📱</span> <strong>Phone:</strong> <a href={`tel:${profile.user.phone}`} className="text-blue-600 hover:underline">{profile.user.phone}</a></p>}
                        </div>
                    </div>
                )}

                {/* --- About Me / Bio --- */}
                {profile.bio && (
                    <div className="border-t border-gray-100 mt-6 pt-6">
                        <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-gray-800">About Me</h3>
                        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
                    </div>
                )}
                
                {/* --- Rich Portfolio / Case Studies --- */}
                {parsedPortfolio.length > 0 && (
                    <div className="border-t border-gray-100 mt-6 pt-6">
                        <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-gray-800">Portfolio & Projects</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {parsedPortfolio.map((item, idx) => (
                                <a key={idx} href={item.link} target="_blank" rel="noopener noreferrer" className="block p-5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 transition-all group shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform">🔗</div>
                                        <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                                    </div>
                                    <h4 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors truncate">{item.title}</h4>
                                    <p className="text-xs text-gray-500 mt-1 truncate">{item.link.replace(/^https?:\/\//, '')}</p>
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                <EducationSection items={profile.education} />
                <ProfileSectionList title="Achievements" items={profile.achievements} />
                
                {/* --- Skills as Tags --- */}
                {profile.skills && profile.skills.length > 0 && (
                    <div className="border-t border-gray-100 mt-6 pt-6">
                        <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-purple-700">Skills</h3>
                        <div className="flex flex-wrap gap-2">
                            {(Array.isArray(profile.skills) ? profile.skills : typeof profile.skills === 'string' ? profile.skills.split(',') : []).map((skill, index) => (
                                <span key={index} className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 text-purple-800 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">{skill}</span>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- Premium Services Section (Moved to Bottom) --- */}
                {profile.services && profile.services.length > 0 && (
                    <div className="border-t border-gray-100 mt-6 pt-6">
                        <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-purple-700">Project Catalog & Services</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {(Array.isArray(profile.services) ? profile.services : typeof profile.services === 'string' ? profile.services.split(',') : []).map((s, index) => {
                                let service = s;
                                if (typeof s === 'string') { try { const p = JSON.parse(s); if (p.type === 'package') service = p; } catch(e){} }

                                if (typeof service === 'object' && service.type === 'package') {
                                    return (
                                        <div key={index} className="p-6 rounded-2xl border border-green-100 bg-gradient-to-b from-white to-green-50/30 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col h-full group relative overflow-hidden">
                                            <div className="absolute top-0 right-4 bg-green-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-b-lg shadow-sm">Ready to buy</div>
                                            <h4 className="font-extrabold text-lg text-gray-900 mb-2 mt-2 line-clamp-2">{service.title}</h4>
                                            <p className="text-gray-600 text-sm mb-6 line-clamp-3 flex-1">{service.description}</p>
                                            <div className="flex justify-between items-center mb-4 text-sm font-bold text-gray-700 bg-white p-3 rounded-xl border border-green-100">
                                                <span>⏱️ {service.deliveryTime}</span>
                                                <span className="text-xl font-black text-green-600">₹{service.price}</span>
                                            </div>
                                        <button disabled={orderingPkg === service.title} onClick={() => handleOrderNow(service)} className="w-full bg-green-600 text-white font-bold py-3.5 rounded-xl hover:bg-green-700 transition-all hover:-translate-y-0.5 shadow-md flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                                            {orderingPkg === service.title ? 'Processing...' : 'Order Now'} <span className="text-lg">💳</span>
                                            </button>
                                        </div>
                                    );
                                }

                                const srv = typeof service === 'string' ? service.trim() : '';
                                if (!srv) return null;
                                const theme = getServiceTheme(srv);
                                const allSkills = Array.isArray(profile.skills) ? profile.skills : typeof profile.skills === 'string' ? profile.skills.split(',') : [];
                                const relatedSkills = getRelatedSkills(srv, allSkills);
                                return (
                                    <div key={index} className={`p-4 rounded-xl border flex flex-col h-full hover:-translate-y-1 hover:shadow-md transition-all duration-300 shadow-sm group ${theme.color}`}>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-sm shrink-0 group-hover:scale-110 transition-transform origin-center">
                                                {theme.icon}
                                            </div>
                                            <span className="font-bold text-gray-800 text-sm line-clamp-1">{srv}</span>
                                        </div>
                                        {relatedSkills.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-auto pt-2 border-t border-white/40 mb-3">
                                                {relatedSkills.map((rs, i) => (
                                                    <span key={i} className={`bg-white/70 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md border ${theme.color.split(' ')[2]}`}>{rs}</span>
                                                ))}
                                            </div>
                                        )}
                                        <div className="mt-auto border-t border-white/40 pt-3">
                                            <Link to={`/chat/${profile?.user?._id}?service=${encodeURIComponent(srv)}`} className="w-full flex items-center justify-center gap-2 bg-white/90 text-gray-800 font-bold py-2 px-3 rounded-lg text-xs hover:bg-white transition-all duration-300 shadow-sm hover:shadow">
                                                💬 Discuss this service
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
                </div>
            </div>

            {/* --- Reviews Section --- */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-sm font-bold uppercase tracking-wider mb-6 text-gray-800">Client Reviews ({reviews.length})</h2>
                {reviews.length > 0 ? (
                    <ul className="space-y-6">
                        {reviews.map(review => (
                            <li key={review._id} className="border-b pb-6 last:border-b-0">
                                <div className="flex items-center mb-2">
                                    <StarRating rating={review.rating} />
                                    <span className="ml-3 font-bold text-gray-700 text-sm">{review.client?.name || 'Unknown Client'}</span>
                                </div>
                                <p className="text-gray-600 italic text-sm">"{review.comment}"</p>
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