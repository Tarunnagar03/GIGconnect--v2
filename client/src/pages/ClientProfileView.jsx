import React from 'react';
import { Link } from 'react-router-dom';
import StarRating from '../components/StarRating';

const ClientProfileView = ({ user, profile, isPreviewMode, setIsPreviewMode }) => {
    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
                <div className="h-24 bg-gradient-to-r from-blue-900 to-slate-800"></div>
                <div className="px-8 pb-8">
                    <div className="flex justify-between items-start">
                        <div className="w-28 h-28 bg-white rounded-full p-1 shadow-lg flex-shrink-0 -mt-12">
                            <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-5xl font-bold">
                                {(user?.companyName || user?.name || 'C').charAt(0).toUpperCase()}
                            </div>
                        </div>
                        {!isPreviewMode && (
                            <Link to="/create-profile" className="mt-4 bg-blue-600 text-white font-bold py-2.5 px-6 rounded-full hover:bg-blue-700 transition-colors shadow-md">
                                Edit Profile
                            </Link>
                        )}
                    </div>
                    
                    <h1 className="text-2xl font-bold text-gray-800 mt-4 mb-1">{user?.companyName || user?.name}</h1>
                    {user?.companyName && <p className="text-base text-blue-600 font-medium mt-1">Contact: {user?.name}</p>}
                    
                    {profile?.bio && (
                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-gray-800">About {user?.companyName || 'Us'}</h3>
                            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClientProfileView;