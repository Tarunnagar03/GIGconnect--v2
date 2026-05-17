import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
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
            <div className="max-w-6xl mx-auto animate-fade-in">
                <Link to="/dashboard" className="inline-flex items-center gap-2 mb-6 text-gray-600 hover:text-blue-600 font-semibold bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm hover:shadow hover:border-blue-200 transition-all group">
                    <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    Back to Dashboard
                </Link>
                
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-gray-800 tracking-tight">What service are you looking for today?</h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">Discover top-rated professionals for your next big project.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[
                        { title: 'Web & App Development', icon: '💻', skills: 'React, Node, Python, iOS, Android' },
                        { title: 'UI/UX & Graphic Design', icon: '🎨', skills: 'Figma, Photoshop, Illustrator, Logo' },
                        { title: 'Digital Marketing & SEO', icon: '📈', skills: 'SEO, SMM, Google Ads, Social Media' },
                        { title: 'Content & Translation', icon: '✍️', skills: 'Copywriting, Translation, Blogs, Articles' },
                        { title: 'Video & Animation', icon: '🎬', skills: 'Premiere Pro, After Effects, 2D/3D' },
                        { title: 'Business & Consulting', icon: '💼', skills: 'Accounting, HR, Legal, Virtual Assistant' }
                    ].map((cat, idx) => (
                        <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 flex flex-col h-full group">
                            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform origin-left">{cat.icon}</div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">{cat.title}</h3>
                            <p className="text-gray-500 mb-8 text-sm">{cat.skills.split(', ').join(' • ')}</p>
                            
                            <div className="mt-auto grid grid-cols-2 gap-3">
                                <Link to={`/freelancers?skills=${encodeURIComponent(cat.skills.split(',')[0])}`} className="text-center bg-blue-50 text-blue-700 font-bold py-2.5 px-3 rounded-xl hover:bg-blue-100 transition-colors text-sm">Find Experts</Link>
                                <Link to="/post-gig" className="text-center bg-white border-2 border-gray-200 text-gray-700 font-bold py-2.5 px-3 rounded-xl hover:border-blue-600 hover:text-blue-600 transition-colors text-sm">Post a Gig</Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Freelancer View
    return (
        <div className="max-w-5xl mx-auto animate-fade-in">
            <Link to="/dashboard" className="inline-flex items-center gap-2 mb-6 text-gray-600 hover:text-blue-600 font-semibold bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm hover:shadow hover:border-blue-200 transition-all group">
                <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Back to Dashboard
            </Link>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">My Services</h1>
                    <p className="text-lg text-gray-500 font-medium">Manage the services you offer to clients.</p>
                </div>
                <Link to="/create-profile" className="bg-white border-2 border-blue-600 text-blue-600 font-bold py-2.5 px-6 rounded-full hover:bg-blue-50 transition-colors shadow-sm whitespace-nowrap">
                    Edit Services
                </Link>
            </div>
            {loading ? (
                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
            ) : profile && profile.services?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {(Array.isArray(profile.services) ? profile.services : typeof profile.services === 'string' ? profile.services.split(',') : []).map((service, index) => {
                        const srv = service.trim();
                        if (!srv) return null;
                        const theme = getServiceTheme(srv);
                        const allSkills = Array.isArray(profile.skills) ? profile.skills : typeof profile.skills === 'string' ? profile.skills.split(',') : [];
                        const relatedSkills = getRelatedSkills(srv, allSkills);
                        
                        return (
                            <div key={index} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 flex flex-col h-full group">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-sm group-hover:scale-110 transition-transform origin-left ${theme.color}`}>
                                    {theme.icon}
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800 mb-3 line-clamp-2">{srv}</h3>
                                <p className="text-gray-500 mb-6 text-sm">Active service offered to clients on your profile.</p>
                                
                                {relatedSkills.length > 0 && (
                                    <div className="mb-6">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Related Skills</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {relatedSkills.map((rs, i) => (
                                                <span key={i} className={`text-xs font-bold px-2.5 py-1 rounded-lg bg-gray-50 border ${theme.color.split(' ')[2]} ${theme.color.split(' ')[0]}`}>
                                                    {rs}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-auto">
                                    <span className={`inline-block border font-bold py-2 px-4 rounded-xl text-sm ${theme.color}`}>
                                        ✓ Publishing
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
                    <div className="w-24 h-24 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                    </div>
                    <p className="text-gray-500 mb-4">You have not listed any services yet.</p>
                    <Link to="/create-profile" className="inline-block bg-blue-600 text-white font-bold py-3 px-8 rounded-full hover:bg-blue-700 transition-all hover:-translate-y-1 shadow-md">
                        Add Services to Your Profile
                    </Link>
                </div>
            )}
        </div>
    );
};

export default ServicesPage;