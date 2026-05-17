import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

// Helper: Automatically assigns Icons & Colors based on keywords
const getServiceTheme = (serviceName) => {
    const lower = serviceName.toLowerCase();
    if (/(web|app|dev|react|node|python|software|code|program|api|html|css)/.test(lower)) return { icon: '💻', color: 'text-blue-600 bg-blue-50 border-blue-100' };
    if (/(design|ui|ux|graphic|logo|art|draw|illustrat|figma|photoshop)/.test(lower)) return { icon: '🎨', color: 'text-pink-600 bg-pink-50 border-pink-100' };
    if (/(seo|market|ad|social|promot|sale|brand|growth)/.test(lower)) return { icon: '📈', color: 'text-green-600 bg-green-50 border-green-100' };
    if (/(write|content|translat|blog|copy|type|edit|proofread)/.test(lower)) return { icon: '✍️', color: 'text-yellow-600 bg-yellow-50 border-yellow-100' };
    if (/(video|animat|edit|photo|film|audio|sound|music)/.test(lower)) return { icon: '🎬', color: 'text-purple-600 bg-purple-50 border-purple-100' };
    if (/(business|consult|manag|admin|account|hr|finance|legal)/.test(lower)) return { icon: '💼', color: 'text-indigo-600 bg-indigo-50 border-indigo-100' };
    return { icon: '✨', color: 'text-teal-600 bg-teal-50 border-teal-100' };
};

// Helper: Smart Skill Mapping Engine
const getRelatedSkills = (serviceName, allSkills) => {
    if (!allSkills || !Array.isArray(allSkills)) return [];
    const lowerSrv = serviceName.toLowerCase();
    const isWeb = /(web|app|dev|code|software|program|api|html|css|react|node)/.test(lowerSrv);
    const isDesign = /(design|ui|ux|graphic|logo|art|illustrat|figma)/.test(lowerSrv);
    const isMarketing = /(seo|market|ad|social|promot|sale|brand)/.test(lowerSrv);
    const isWriting = /(write|content|translat|blog|copy|edit|proofread)/.test(lowerSrv);
    const isVideo = /(video|animat|film|audio|sound|music)/.test(lowerSrv);
    const isBusiness = /(business|consult|manag|admin|account|hr|finance|legal)/.test(lowerSrv);
    return allSkills.map(s => s.trim()).filter(skill => {
        if (!skill) return false;
        const s = skill.toLowerCase();
        if (isWeb && /(web|app|dev|code|software|program|api|html|css|js|javascript|typescript|react|node|python|java|c#|c\+\+|sql|mongo|aws|docker|git)/.test(s)) return true;
        if (isDesign && /(design|ui|ux|graphic|logo|art|illustrat|figma|photoshop|canva|adobe|sketch|color)/.test(s)) return true;
        if (isMarketing && /(seo|market|ad|social|promot|sale|brand|google|facebook|instagram|tiktok|email)/.test(s)) return true;
        if (isWriting && /(write|content|translat|blog|copy|edit|proofread|word|typing)/.test(s)) return true;
        if (isVideo && /(video|animat|film|audio|sound|music|premiere|after effects|vfx)/.test(s)) return true;
        if (isBusiness && /(business|consult|manag|admin|account|hr|finance|legal|excel|data entry)/.test(s)) return true;
        if (s.includes(lowerSrv) || lowerSrv.includes(s)) return true;
        return false;
    });
};

// Reusable Star Rating (Display Only)
const StarRating = ({ rating }) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
        stars.push(<span key={i} className={`text-xl ${i <= rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>);
    }
    return <div className="flex items-center">{stars}</div>;
};

// Reusable list component for Education (Objects)
const EducationSection = ({ items }) => {
    const safeItems = Array.isArray(items) ? items : (typeof items === 'string' ? items.split(',') : []);
    if (!safeItems || safeItems.length === 0) return null;
    return (
        <div className="border-t border-gray-100 mt-6 pt-6">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-gray-800">Education</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {safeItems.map((item, index) => {
                    if (item === '[object Object]') return null;
                    let parsedItem = item;
                    let isObj = typeof item === 'object' && item !== null;
                    
                    if (!isObj && typeof item === 'string') {
                        try {
                            parsedItem = JSON.parse(item);
                            isObj = typeof parsedItem === 'object';
                        } catch (e) { /* ignore standard strings */ }
                    }
                    return (
                        <div key={index} className="flex items-start gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0 text-sm">🎓</div>
                            <div>
                                <p className="font-bold text-gray-800 text-sm">{isObj ? parsedItem.course : parsedItem}</p>
                                {isObj && parsedItem.college && <p className="text-xs text-gray-500 mt-0.5">{parsedItem.college}</p>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Reusable list component for new sections
const ProfileSectionList = ({ title, items }) => {
    const safeItems = Array.isArray(items) ? items : (typeof items === 'string' ? items.split(',') : []);
    if (!safeItems || safeItems.length === 0) return null; // Don't render if empty
    return (
        <div className="border-t border-gray-100 mt-6 pt-6">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-gray-800">{title}</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
                {safeItems.map((item, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                        <span className="text-purple-400 mt-0.5">•</span>
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

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
    const { auth } = React.useContext(AuthContext);
    const [profile, setProfile] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError('');
            try {
                const profileRes = await api.get(`/profiles/user/${freelancerId}`);
                const reviewsRes = await api.get(`/reviews/${freelancerId}`).catch(err => { console.error(err); return { data: [] }; });
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

    // Determine contact visibility
    const showContactInfo = profile?.user?.contactVisibility === 'Everyone' || (profile?.user?.contactVisibility === 'Connections' && auth?.isAuthenticated);

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
                        <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-purple-700">Services I Offer</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {(Array.isArray(profile.services) ? profile.services : typeof profile.services === 'string' ? profile.services.split(',') : []).map((service, index) => {
                                const srv = service.trim();
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