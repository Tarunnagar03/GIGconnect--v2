import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { getServiceTheme, getRelatedSkills } from '../utils/serviceHelpers';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const ServicesPage = () => {
    const { auth } = useAuth();
    const queryClient = useQueryClient();
    
    // --- ENHANCED: React Query for robust caching and data management ---
    const { data: profile, isLoading: isProfileLoading } = useQuery({
        queryKey: ['freelancerProfile', auth.user?.id],
        queryFn: async () => {
            const res = await api.get('/profiles/me');
            return res.data;
        },
        enabled: auth.user?.role === 'Freelancer',
        retry: false
    });

    const loading = auth.user?.role === 'Freelancer' ? isProfileLoading : false;

    // --- NEW: Package Builder State ---
    const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [newPackage, setNewPackage] = useState({
        type: 'package', title: '', price: '', deliveryTime: '', description: ''
    });

    // --- NEW: Save Package Logic ---
    const handleSavePackage = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const safeProfile = profile || {};
            const updatedServices = [...(safeProfile.services || []), JSON.stringify(newPackage)];
            const payload = {
                ...safeProfile,
                education: (safeProfile.education || []).map(item => typeof item === 'object' ? JSON.stringify(item) : item),
                services: updatedServices
            };
            await api.post('/profiles', payload);
            
            // --- ENHANCED: Optimistic UI update via Query Cache ---
            queryClient.setQueryData(['freelancerProfile', auth.user?.id], payload);
            
            setIsPackageModalOpen(false);
            setNewPackage({ type: 'package', title: '', price: '', deliveryTime: '', description: '' });
        } catch (err) {
            alert("Failed to save package.");
        } finally { setIsSaving(false); }
    };

    const handleDeleteService = async (indexToRemove) => {
        if (!window.confirm("Delete this service/package?")) return;
        try {
            const safeProfile = profile || {};
            const updatedServices = (safeProfile.services || []).filter((_, i) => i !== indexToRemove);
            const payload = {
                ...safeProfile,
                education: (safeProfile.education || []).map(item => typeof item === 'object' ? JSON.stringify(item) : item),
                services: updatedServices
            };
            await api.post('/profiles', payload);
            
            // --- ENHANCED: Optimistic UI update via Query Cache ---
            queryClient.setQueryData(['freelancerProfile', auth.user?.id], payload);
        } catch (err) { alert("Failed to delete."); }
    };

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
                    <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">My Project Catalog</h1>
                    <p className="text-lg text-gray-500 font-medium">Create ready-to-buy packages for clients.</p>
                </div>
                <div className="flex gap-3">
                    <Link to="/create-profile" className="bg-white border-2 border-gray-200 text-gray-700 font-bold py-2.5 px-6 rounded-full hover:bg-gray-50 transition-colors shadow-sm whitespace-nowrap">
                        Edit Basic Services
                    </Link>
                {profile && (
                    <button onClick={() => setIsPackageModalOpen(true)} className="bg-blue-600 text-white font-bold py-2.5 px-6 rounded-full hover:bg-blue-700 transition-colors shadow-md whitespace-nowrap flex items-center gap-2">
                        + Create Package
                    </button>
                )}
                </div>
            </div>

            {/* --- NEW: Package Builder Modal --- */}
            {isPackageModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-extrabold text-xl text-gray-800">Create New Package</h3>
                            <button onClick={() => setIsPackageModalOpen(false)} className="text-gray-400 hover:text-red-500 text-2xl">&times;</button>
                        </div>
                        <form onSubmit={handleSavePackage} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Package Title</label>
                                <input type="text" required value={newPackage.title} onChange={e => setNewPackage({...newPackage, title: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-800" placeholder="I will design a modern logo..." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Fixed Price (₹)</label>
                                    <input type="number" required value={newPackage.price} onChange={e => setNewPackage({...newPackage, price: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-green-500 outline-none font-bold text-green-700" placeholder="2500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Delivery Time</label>
                                    <input type="text" required value={newPackage.deliveryTime} onChange={e => setNewPackage({...newPackage, deliveryTime: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-800" placeholder="e.g. 2 Days" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">What's Included? (Deliverables)</label>
                                <textarea required rows="3" value={newPackage.description} onChange={e => setNewPackage({...newPackage, description: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none text-gray-700" placeholder="3 Revisions, Source Files, High Resolution..."></textarea>
                            </div>
                            <button type="submit" disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md mt-2 disabled:bg-gray-400 text-lg">
                                {isSaving ? 'Saving...' : 'Publish Package 🚀'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
            ) : profile && profile.services?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {(Array.isArray(profile.services) ? profile.services : typeof profile.services === 'string' ? profile.services.split(',') : []).map((s, index) => {
                        let service = s;
                        if (typeof s === 'string') { try { const p = JSON.parse(s); if (p.type === 'package') service = p; } catch(e){} }
                        
                        if (typeof service === 'object' && service.type === 'package') {
                            return (
                                <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 flex flex-col h-full group relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-green-400 to-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border border-green-100">Ready to Buy</span>
                                        <button onClick={() => handleDeleteService(index)} className="text-gray-400 hover:text-red-500 font-bold px-2 bg-gray-50 rounded-md">✕</button>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{service.title}</h3>
                                    <p className="text-gray-500 text-sm mb-6 line-clamp-3 leading-relaxed flex-1">{service.description}</p>
                                    <div className="mt-auto border-t border-gray-100 pt-4 flex items-end justify-between">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">Delivery</p>
                                            <p className="text-sm font-bold text-gray-800">⏱️ {service.deliveryTime}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">Fixed Price</p>
                                            <p className="text-2xl font-black text-green-600">₹{service.price}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        const srv = typeof service === 'string' ? service.trim() : '';
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

                                <div className="mt-auto flex justify-between items-end">
                                    <span className={`inline-block border font-bold py-1.5 px-3 rounded-xl text-xs ${theme.color}`}>✓ Publishing</span>
                                    <button onClick={() => handleDeleteService(index)} className="text-gray-400 hover:text-red-500 font-bold px-2 bg-gray-50 rounded-md">✕</button>
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