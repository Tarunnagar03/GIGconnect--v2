/**
 * AboutMePage Component
 * UPDATED: May 6, 2026 - Profile Display Enhancement
 * 
 * Features:
 * - User profile information display
 * - Freelancer or Client profile view
 * - Skills and experience showcase
 * - Rating and review statistics
 * - Contact options
 * - Modern profile layout
 */

import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { formatCurrency } from '../utils/currencyFormatter';

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

// Reusable list component for this page
const InfoSection = ({ title, items }) => {
    // Safety check: Convert to array if it's a string, or empty array if null
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

const AboutMePage = () => {
    const [profile, setProfile] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const { auth } = useContext(AuthContext);

    useEffect(() => {
        if (!auth.user) return;
        
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch sequentially
                const profileRes = await api.get('/profiles/me').catch(() => null); // Allow profile to be null
                const userRes = await api.get('/users/me');
                
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
            <div className="max-w-4xl mx-auto animate-fade-in">
                <Link to="/dashboard" className="inline-flex items-center gap-2 mb-6 text-gray-600 hover:text-blue-600 font-semibold bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm hover:shadow hover:border-blue-200 transition-all group">
                    <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    Back to Dashboard
                </Link>
                
                <div className="bg-blue-50 border border-blue-100 text-blue-800 px-5 py-4 rounded-xl mb-6 flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">👁️</span>
                        <p className="font-medium">{isPreviewMode ? "You are viewing your profile exactly as freelancers see it." : "This is your private business dashboard."}</p>
                    </div>
                    <button onClick={() => setIsPreviewMode(!isPreviewMode)} className={`px-4 py-2 font-bold rounded-lg transition-colors text-sm ${isPreviewMode ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700' : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-100'}`}>
                        {isPreviewMode ? 'Exit Preview' : 'View Public Profile'}
                    </button>
                </div>
                <h1 className="text-4xl font-extrabold mb-8 text-gray-800 tracking-tight">My Profile</h1>
                
                {/* Header Card */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8 hover:shadow-xl transition-shadow duration-300">
                    <div className="h-24 bg-gradient-to-r from-blue-900 to-slate-800"></div>
                    <div className="px-8 pb-8">
                        <div className="flex justify-between items-start">
                            <div className="w-28 h-28 bg-white rounded-full p-1 shadow-lg flex-shrink-0 -mt-12 z-10 relative">
                                <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-5xl font-bold overflow-hidden">
                                    {user?.profileImage ? (
                                        <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        (user?.companyName || user?.name || 'C').charAt(0).toUpperCase()
                                    )}
                                </div>
                            </div>
                            {!isPreviewMode && (
                                <div className="flex items-center gap-3 mt-4">
                                    <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/client-profile/${user._id}`); alert('Public profile link copied to clipboard!'); }} className="bg-white border-2 border-gray-200 text-gray-700 font-bold py-2 px-4 rounded-full hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                                        Share
                                    </button>
                                    <Link to="/create-profile" className="bg-white border-2 border-blue-600 text-blue-600 font-bold py-2 px-6 rounded-full hover:bg-blue-50 transition-colors shadow-sm">
                                        Edit Company Profile
                                    </Link>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mt-4 mb-6 gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">{user.companyName || user.name}</h1>
                                {user.companyName && <p className="text-base text-blue-600 font-medium mt-1">Rep: {user.name}</p>}
                                <div className="mt-2 bg-green-50 border border-green-100 text-green-700 px-3 py-1 rounded-full inline-flex items-center gap-2 shadow-sm font-semibold text-xs">
                                    <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    Payment Verified
                                </div>
                            </div>
                            <div className="w-full md:w-auto text-left md:text-right">
                                <p className="text-sm text-gray-500">Member since {new Date(user.createdAt || Date.now()).getFullYear()}</p>
                            </div>
                        </div>
                    </div>

                {/* --- Contact Info (Self View) --- */}
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 mb-8 hover:shadow-lg transition-shadow duration-300">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800">Contact Information</h2>
                        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">Visibility: {user.contactVisibility || 'Everyone'}</span>
                    </div>
                    <div className="space-y-3 text-sm text-gray-700">
                        <p className="flex items-center gap-2"><span className="text-lg">📧</span> <strong>Email:</strong> {user.email}</p>
                        {user.phone ? <p className="flex items-center gap-2"><span className="text-lg">📱</span> <strong>Phone:</strong> {user.phone}</p> : <p className="text-gray-400 italic">No phone number added</p>}
                        {!isPreviewMode && <div className="mt-4 text-xs font-medium"><Link to="/settings/details" className="text-blue-600 hover:underline">Edit Contact & Privacy Settings &rarr;</Link></div>}
                    </div>
                </div>

                </div>

                {profile && (profile.bio || profile.portfolio || profile.locationText || (profile.services && profile.services.length > 0)) ? (
                    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 mb-8 hover:shadow-lg transition-shadow duration-300">
                        <h2 className="text-sm font-bold uppercase tracking-wider mb-4 text-gray-800">About the Business</h2>
                        {profile.bio && <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap mb-6">{profile.bio}</p>}
                        
                        {profile.services && profile.services.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Industry & Services</h3>
                                <div className="flex flex-wrap gap-2">
                                    {(Array.isArray(profile.services) ? profile.services : profile.services.split(',')).map((service, index) => (
                                        <span key={index} className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">{service}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-6 border-t border-gray-100 pt-4">
                            {profile.locationText && (
                                <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                    {profile.locationText}
                                </div>
                            )}
                            {profile.portfolio && (
                                <div className="flex items-center gap-2 text-sm text-blue-600 font-bold">
                                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                                    <a href={profile.portfolio.startsWith('http') ? profile.portfolio : `https://${profile.portfolio}`} target="_blank" rel="noopener noreferrer" className="hover:underline">{profile.portfolio.replace(/^https?:\/\//, '')}</a>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8 text-center">
                        <div className="w-16 h-16 bg-blue-50 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                        </div>
                        <p className="text-gray-600 mb-4 font-medium">You haven't added any details about your company/business yet.</p>
                        <Link to="/create-profile" className="inline-block bg-blue-600 text-white font-bold py-2.5 px-6 rounded-xl hover:bg-blue-700 transition-colors shadow-sm">Add Business Info</Link>
                    </div>
                )}
                
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 text-sm text-center">Your public statistics (Active Gigs, Total Gigs, Reviews) will appear below this section when viewed by freelancers.</p>
                </div>
            </div>
        );
    }

    // Freelancer View
    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <Link to="/dashboard" className="inline-flex items-center gap-2 mb-6 text-gray-600 hover:text-blue-600 font-semibold bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm hover:shadow hover:border-blue-200 transition-all group">
                <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Back to Dashboard
            </Link>
            
            <div className="bg-purple-50 border border-purple-100 text-purple-800 px-5 py-4 rounded-xl mb-6 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">👁️</span>
                    <p className="font-medium">{isPreviewMode ? "You are viewing your profile exactly as a Client sees it." : "This is your private profile dashboard."}</p>
                </div>
                <button onClick={() => setIsPreviewMode(!isPreviewMode)} className={`px-4 py-2 font-bold rounded-lg transition-colors text-sm ${isPreviewMode ? 'bg-purple-600 text-white shadow-md hover:bg-purple-700' : 'bg-white text-purple-600 border border-purple-200 hover:bg-purple-100'}`}>
                    {isPreviewMode ? 'Exit Preview' : 'View as Client'}
                </button>
            </div>
            <h1 className="text-4xl font-extrabold mb-8 text-gray-800 tracking-tight">My Profile</h1>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="h-24 bg-gradient-to-r from-blue-900 to-slate-800"></div>
                <div className="px-8 pb-8">
                    <div className="flex justify-between items-start">
                        <div className="w-28 h-28 bg-white rounded-full p-1 shadow-lg flex-shrink-0 -mt-12 relative z-10">
                            <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-5xl font-bold overflow-hidden">
                                {user?.profileImage ? (
                                    <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    (user?.name || 'U').charAt(0).toUpperCase()
                                )}
                            </div>
                        </div>
                        {!isPreviewMode && (
                            <div className="flex items-center gap-3 mt-4">
                                <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/profile/${user._id}`); alert('Public profile link copied to clipboard!'); }} className="bg-white border-2 border-gray-200 text-gray-700 font-bold py-2 px-4 rounded-full hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                                    Share
                                </button>
                                <Link 
                                    to="/create-profile" 
                                    className="bg-white border-2 border-purple-600 text-purple-600 font-bold py-2 px-6 rounded-full hover:bg-purple-50 transition-colors shadow-sm"
                                >
                                    Edit Profile
                                </Link>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mt-4 mb-6 gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">{user.name}</h1>
                            <p className="text-base text-purple-600 font-medium mt-1">{user.headline || 'No headline provided.'}</p>
                            {profile && profile.experience && (Number(profile.experience.years) > 0 || Number(profile.experience.months) > 0) && (
                                <div className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1.5 rounded-lg mt-2 border border-blue-100 shadow-sm">
                                    💼 {profile.experience.years ? `${profile.experience.years} Yrs ` : ''}{profile.experience.months ? `${profile.experience.months} Mos ` : ''}Experience
                                </div>
                            )}
                        </div>
                        {profile && typeof profile.rate === 'number' && (
                            <div className="w-full md:w-auto text-center md:text-right bg-purple-50 px-5 py-3 rounded-xl border border-purple-100">
                                <div className="text-2xl font-extrabold text-purple-700">{formatCurrency(profile.rate)}<span className="text-base text-purple-500 font-medium">/hr</span></div>
                                <p className="text-purple-600 text-xs font-medium uppercase tracking-wide">Hourly Rate</p>
                            </div>
                        )}
                    </div>
                    
                {profile ? (
                    <div className="mt-8 space-y-2">
                        {profile.bio && (
                            <div className="border-t border-gray-100 pt-6 mt-6">
                                <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-gray-800">About Me</h3>
                                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
                            </div>
                        )}

                        <EducationSection items={profile.education} />
                        <InfoSection title="Achievements" items={profile.achievements} />
                        
                        {/* --- Skills as Tags --- */}
                        {profile.skills && profile.skills.length > 0 && (
                            <div className="border-t border-gray-100 pt-6 mt-6">
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
                            <div className="border-t border-gray-100 pt-6 mt-6">
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
                                                    <div className="flex flex-wrap gap-1.5 mt-auto pt-2 border-t border-white/40">
                                                        {relatedSkills.map((rs, i) => (
                                                            <span key={i} className={`bg-white/70 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md border ${theme.color.split(' ')[2]}`}>{rs}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
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
        </div>
    );
};

export default AboutMePage;