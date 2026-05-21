/**
 * CreateProfile Page Component
 * UPDATED: May 6, 2026 - Design System Enhancement
 * 
 * Features:
 * - Freelancer profile creation form
 * - Skills input with validation
 * - Hourly rate configuration
 * - Professional headline setup
 * - Form validation and error handling
 * - Modern styling with custom design system
 */

import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import DynamicListInput from '../components/DynamicListInput';
import { ChevronDownIcon } from '../components/Icons';

// Helper: Premium Dynamic List Builder for Education (Objects)
const DynamicEducationInput = ({ items, onChange }) => {
    const [course, setCourse] = useState('');
    const [college, setCollege] = useState('');

    const handleAdd = (e) => {
        e.preventDefault();
        if (course.trim() && college.trim()) {
            onChange('education', [...items, { course: course.trim(), college: college.trim() }]);
            setCourse('');
            setCollege('');
        }
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Education & Degrees</label>
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <input type="text" placeholder="Degree/Course (e.g., B.Tech in CS)" value={course} onChange={e => setCourse(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(e); } }} className="flex-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50 hover:bg-white focus:bg-white" />
                <input type="text" placeholder="University/College (e.g., IIT Delhi)" value={college} onChange={e => setCollege(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(e); } }} className="flex-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50 hover:bg-white focus:bg-white" />
                <button type="button" onClick={handleAdd} className="bg-blue-100 text-blue-700 px-6 py-3 font-bold rounded-xl hover:bg-blue-200 transition-colors shadow-sm whitespace-nowrap">Add</button>
            </div>
            <div className="flex flex-col gap-2">
                {items.map((item, index) => {
                    const isObj = typeof item === 'object' && item !== null;
                    const itemKey = isObj ? `${item.course}-${index}` : `${item}-${index}`;
                    return (
                        <div key={itemKey} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-200 shadow-sm animate-fade-in">
                            <div>
                                <p className="font-bold text-gray-800 text-sm">{isObj ? item.course : item}</p>
                                {isObj && item.college && <p className="text-xs text-gray-500 mt-0.5">{item.college}</p>}
                            </div>
                            <button type="button" onClick={() => onChange('education', items.filter((_, i) => i !== index))} className="text-gray-400 hover:text-red-500 p-2 transition-colors focus:outline-none"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                        </div>
                    );
                })}
                {items.length === 0 && <span className="text-sm text-gray-400 italic font-medium px-2">No education added yet.</span>}
            </div>
        </div>
    );
};

// Helper: Premium Dynamic List Builder for Portfolio
const DynamicPortfolioInput = ({ items, onChange }) => {
    const [title, setTitle] = useState('');
    const [link, setLink] = useState('');

    const handleAdd = (e) => {
        e.preventDefault();
        if (title.trim() && link.trim()) {
            onChange('portfolioItems', [...items, { title: title.trim(), link: link.trim() }]);
            setTitle('');
            setLink('');
        }
    };

    return (
        <div className="border-t border-gray-100 pt-6 mt-6">
            <label className="block text-sm font-bold text-gray-800 mb-2">Rich Portfolio & Case Studies</label>
            <p className="text-xs text-gray-500 mb-4">Add links to your live projects, GitHub repos, or Dribbble designs.</p>
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <input type="text" placeholder="Project Name (e.g. E-Commerce App)" value={title} onChange={e => setTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(e); } }} className="flex-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50 hover:bg-white focus:bg-white" />
                <input type="url" placeholder="Project Link (https://...)" value={link} onChange={e => setLink(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(e); } }} className="flex-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50 hover:bg-white focus:bg-white" />
                <button type="button" onClick={handleAdd} className="bg-blue-100 text-blue-700 px-6 py-3 font-bold rounded-xl hover:bg-blue-200 transition-colors shadow-sm whitespace-nowrap">Add Project</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm animate-fade-in group">
                        <div className="overflow-hidden pr-2">
                            <p className="font-bold text-gray-800 text-sm truncate">{item.title}</p>
                            <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline truncate block mt-0.5">{item.link}</a>
                        </div>
                        <button type="button" onClick={() => onChange('portfolioItems', items.filter((_, i) => i !== index))} className="text-gray-400 hover:text-red-500 p-2 transition-colors focus:outline-none bg-white rounded-lg shadow-sm group-hover:shadow"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                    </div>
                ))}
                {items.length === 0 && <span className="text-sm text-gray-400 italic font-medium px-2 col-span-2">No portfolio items added yet.</span>}
            </div>
        </div>
    );
};

const CreateProfile = () => {
    const [formData, setFormData] = useState({
        skills: [], rate: '', bio: '', portfolio: '',
        services: [], education: [], achievements: [],
        locationText: '', experience: { years: '', months: '' },
        portfolioItems: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);
    const navigate = useNavigate();
    const { auth, refreshProfile } = useContext(AuthContext);
    const isClient = auth.user?.role === 'Client';

    // Fetch existing profile data
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/profiles/me');
                
                // Safe extraction of rich portfolio array vs old string
                let parsedPortfolioItems = [];
                if (res.data?.portfolio) {
                    if (res.data.portfolio.trim().startsWith('[')) {
                        try { parsedPortfolioItems = JSON.parse(res.data.portfolio); } catch (e) {}
                    } else if (res.data.portfolio.trim() && res.data.portfolio.includes('http')) {
                        // Legacy fallback
                        parsedPortfolioItems = [{ title: 'Personal Website', link: res.data.portfolio }];
                    }
                }
                
                if (res.data) {
                    setFormData({
                        skills: res.data.skills || [],
                        rate: res.data.rate || '',
                        bio: res.data.bio || '',
                        portfolio: res.data.portfolio || '',
                        services: res.data.services || [],
                        education: (res.data.education || []).map(item => {
                            if (typeof item === 'string') {
                                if (item === '[object Object]') return null;
                                try { return JSON.parse(item); } catch { return item; }
                            }
                            return item;
                        }).filter(Boolean),
                        achievements: res.data.achievements || [],
                        locationText: res.data.locationText || '',
                        experience: res.data.experience || { years: '', months: '' },
                        portfolioItems: parsedPortfolioItems
                    });
                    setIsEditMode(true);
                }
            } catch {
                console.log("No existing profile found, creating a new one.");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const { skills, rate, bio, portfolio, services, education, achievements, locationText, experience, portfolioItems } = formData;
    const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleListChange = (name, newList) => setFormData(prev => ({ ...prev, [name]: newList }));
    const handleExperienceChange = (e) => setFormData(prev => ({ ...prev, experience: { ...prev.experience, [e.target.name]: e.target.value } }));

    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!isClient) {
            if (skills.length === 0) {
                setError('Please add at least one professional skill.');
                return;
            }
            
            if (services.length === 0) {
                setError('Please add at least one service you offer.');
                return;
            }
        }

        try {
            const payload = {
                ...formData,
                education: formData.education.map(item => typeof item === 'object' ? JSON.stringify(item) : item),
                portfolio: JSON.stringify(formData.portfolioItems) // Save rich array as string
            };

            await api.post('/profiles', payload);
            refreshProfile();
            setSuccess(isEditMode ? 'Profile updated successfully!' : 'Profile created successfully!');
            setTimeout(() => navigate('/dashboard'), 2000);
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to save profile.');
        }
    };


    if (loading) {
        return <p className="text-center mt-10">Loading profile...</p>;
    }

    return (
        <div className="max-w-3xl mx-auto animate-fade-in">
            <Link to="/dashboard" className="inline-flex items-center gap-2 mb-6 text-gray-600 hover:text-blue-600 font-semibold bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm hover:shadow hover:border-blue-200 transition-all group">
                <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Back to Dashboard
            </Link>
            
            <h1 className="text-4xl font-extrabold mb-2 text-gray-800 tracking-tight">
                {isEditMode ? (isClient ? 'Edit Company Profile' : 'Edit Your Freelancer Profile') : (isClient ? 'Create Company Profile' : 'Create Your Freelancer Profile')}
            </h1>
            <p className="text-lg text-gray-500 mb-8">{isClient ? 'Tell freelancers about your business to attract top talent. Leave blank to remove.' : 'Set up your professional identity. Leaving a field blank will remove it from your profile.'}</p>
            
            <form onSubmit={onSubmit} className="space-y-8 pb-10">
                {error && <p className="text-red-700 bg-red-50 border border-red-200 p-4 rounded-xl text-center font-bold">{error}</p>}
                {success && <p className="text-green-700 bg-green-50 border border-green-200 p-4 rounded-xl text-center font-bold animate-fade-in">{success}</p>}
                
                {!isClient ? (
                    <>
                        {/* --- SECTION 1: Basic Info (Freelancer) --- */}
                        <div className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-2 border-b border-gray-100 pb-4">Basic Information</h2>
                            <DynamicListInput name="skills" label="Professional Skills" items={skills} onChange={handleListChange} placeholder="e.g., React.js, Copywriting, Node.js" required={true} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="rate" className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate (₹)</label>
                                    <input type="number" id="rate" name="rate" value={rate} onChange={onChange} min="0" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50 hover:bg-white focus:bg-white" placeholder="e.g., 50"/>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="exp-years" className="block text-sm font-medium text-gray-700 mb-1">Experience (Years)</label>
                                    <input type="number" id="exp-years" name="years" value={experience.years} onChange={handleExperienceChange} min="0" max="50" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50 hover:bg-white focus:bg-white" placeholder="e.g., 3"/>
                                </div>
                                <div>
                                    <label htmlFor="exp-months" className="block text-sm font-medium text-gray-700 mb-1">Experience (Months)</label>
                                    <input type="number" id="exp-months" name="months" value={experience.months} onChange={handleExperienceChange} min="0" max="11" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50 hover:bg-white focus:bg-white" placeholder="e.g., 6"/>
                                </div>
                            </div>
                        </div>

                        {/* --- SECTION 2: Professional Details (Freelancer) --- */}
                        <div className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-2 border-b border-gray-100 pb-4">Professional Details</h2>
                            <DynamicPortfolioInput items={portfolioItems} onChange={handleListChange} />
                            <DynamicListInput name="services" label="Services You Offer" items={services} onChange={handleListChange} placeholder="e.g., Web Development, UI/UX Design" required={true} />
                            <DynamicEducationInput items={education} onChange={handleListChange} />
                            <DynamicListInput name="achievements" label="Certifications & Achievements" items={achievements} onChange={handleListChange} placeholder="e.g., AWS Certified Developer, Best UI Award" />
                        </div>

                        {/* --- SECTION 3: About & Location (Freelancer) --- */}
                        <div className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-2 border-b border-gray-100 pb-4">About You & Location</h2>
                            <div>
                                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">About You (Bio)</label>
                                <textarea id="bio" name="bio" rows="5" value={bio} onChange={onChange} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50 hover:bg-white focus:bg-white resize-none" placeholder="Tell clients a bit about your experience..."></textarea>
                            </div>
                            <div>
                                <label htmlFor="locationText" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                <input type="text" id="locationText" name="locationText" value={locationText} onChange={onChange} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50 hover:bg-white focus:bg-white" placeholder="e.g., Meerut, Uttar Pradesh" />
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2 border-b border-gray-100 pb-4">Business / Company Details</h2>
                        
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3 shadow-sm">
                            <span className="text-xl">💡</span>
                            <p className="text-sm text-blue-900 leading-relaxed">
                                To update your official <strong>Company Name</strong> or <strong>Personal Name</strong>, please visit your <Link to="/settings/details" className="font-bold underline hover:text-blue-700">Account Settings</Link>.
                            </p>
                        </div>

                        <div>
                            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">About Your Business / Company Info</label>
                            <textarea id="bio" name="bio" rows="6" value={bio} onChange={onChange} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50 hover:bg-white focus:bg-white resize-none" placeholder="Describe your company, industry, how long you've been running, and the kind of projects you usually hire for..."></textarea>
                        </div>
                        
                        <DynamicListInput 
                            name="services"
                            label="Industry / Services Provided"
                            items={services}
                            onChange={handleListChange}
                            placeholder="e.g., Software Development, FinTech, E-Commerce"
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="portfolio" className="block text-sm font-medium text-gray-700 mb-1">Company Website</label>
                                <input type="text" id="portfolio" name="portfolio" value={portfolio} onChange={onChange} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50 hover:bg-white focus:bg-white" placeholder="https://yourcompany.com"/>
                            </div>
                            <div>
                                <label htmlFor="locationText" className="block text-sm font-medium text-gray-700 mb-1">Headquarters / Location</label>
                                <input type="text" id="locationText" name="locationText" value={locationText} onChange={onChange} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50 hover:bg-white focus:bg-white" placeholder="e.g., New York, USA"/>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- STICKY ACTION BUTTONS --- */}
                <div className="flex justify-end gap-4 sticky bottom-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-gray-200 z-10">
                    <button type="button" onClick={() => navigate('/dashboard')} className="bg-white text-gray-700 py-3 px-8 rounded-xl border border-gray-200 hover:bg-gray-50 font-bold transition-colors">
                        Cancel
                    </button>
                    <button type="submit" className="bg-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-700 hover:-translate-y-1 shadow-md transition-all">
                        Save Profile
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateProfile;