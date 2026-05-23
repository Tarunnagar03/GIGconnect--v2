import React from 'react';
import { Link } from 'react-router-dom';
import StarRating from '../components/StarRating';
import { EducationSection, InfoSection as ProfileSectionList, getRichPortfolio } from '../components/SharedProfileComponents';
import { getServiceTheme, getRelatedSkills } from '../utils/serviceHelpers';

const FreelancerProfileView = ({ user, profile, isPreviewMode, setIsPreviewMode }) => {
    const parsedPortfolio = getRichPortfolio(profile?.portfolio);
    const avgRating = profile?.ratingAvg || 0;
    const reviewCount = profile?.ratingCount || 0;

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
                <div className="h-24 bg-gradient-to-r from-purple-900 to-indigo-800"></div>
                <div className="px-8 pb-8">
                    <div className="flex justify-between items-start">
                        <div className="w-28 h-28 bg-white rounded-full p-1 shadow-lg flex-shrink-0 -mt-12">
                            <div className="w-full h-full bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-5xl font-bold">
                                {(user?.name || 'U').charAt(0).toUpperCase()}
                            </div>
                        </div>
                        {!isPreviewMode && (
                            <Link to="/create-profile" className="mt-4 bg-purple-600 text-white font-bold py-2.5 px-6 rounded-full hover:bg-purple-700 transition-colors shadow-md">
                                Edit Profile
                            </Link>
                        )}
                    </div>
                    
                    <h1 className="text-2xl font-bold text-gray-800 mt-4 mb-1">{user?.name}</h1>
                    <p className="text-base text-purple-600 font-medium">{profile?.headline || 'Freelancer'}</p>
                    
                    <div className="flex items-center mt-2">
                        <StarRating rating={avgRating} />
                        <span className="ml-2 text-gray-600 text-sm font-medium">({reviewCount} reviews)</span>
                    </div>

                    {profile?.rate && (
                        <div className="mt-4 bg-purple-50 px-4 py-2 rounded-lg inline-block">
                            <span className="text-lg font-bold text-purple-700">₹{profile.rate}</span><span className="text-sm text-gray-500">/hr</span>
                        </div>
                    )}

                    {profile?.bio && (
                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-gray-800">About Me</h3>
                            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
                        </div>
                    )}

                    {parsedPortfolio.length > 0 && (
                        <div className="border-t border-gray-100 mt-6 pt-6">
                            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-gray-800">Portfolio & Projects</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {parsedPortfolio.map((item, idx) => (
                                    <a key={idx} href={item.link} target="_blank" rel="noopener noreferrer" className="block p-5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 transition-all group shadow-sm">
                                        <div className="flex justify-between items-start">
                                            <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform">🔗</div>
                                        </div>
                                        <h4 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors truncate">{item.title}</h4>
                                        <p className="text-xs text-gray-500 mt-1 truncate">{item.link.replace(/^https?:\/\//, '')}</p>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    <EducationSection items={profile?.education} />
                    <ProfileSectionList title="Certifications & Achievements" items={profile?.achievements} />

                    {profile?.skills && profile.skills.length > 0 && (
                        <div className="border-t border-gray-100 mt-6 pt-6">
                            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-gray-800">Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {(Array.isArray(profile.skills) ? profile.skills : typeof profile.skills === 'string' ? profile.skills.split(',') : []).map((skill, index) => (
                                    <span key={index} className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 text-purple-800 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">{skill}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {profile?.services && profile.services.length > 0 && (
                        <div className="border-t border-gray-100 mt-6 pt-6">
                            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-gray-800">Services Offered</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {(Array.isArray(profile.services) ? profile.services : typeof profile.services === 'string' ? profile.services.split(',') : []).map((s, index) => {
                                    let service = s;
                                    if (typeof s === 'string') { try { const p = JSON.parse(s); if (p.type === 'package') service = p; } catch(e){} }
                                    if (typeof service === 'object' && service.type === 'package') return null; // Packages rendered in catalog view
                                    const srv = typeof service === 'string' ? service.trim() : '';
                                    if (!srv) return null;
                                    const theme = getServiceTheme(srv);
                                    return (
                                        <div key={index} className={`p-4 rounded-xl border flex items-center gap-3 shadow-sm group ${theme.color}`}>
                                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-sm shrink-0 group-hover:scale-110 transition-transform">
                                                {theme.icon}
                                            </div>
                                            <span className="font-bold text-gray-800 text-sm line-clamp-1">{srv}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FreelancerProfileView;