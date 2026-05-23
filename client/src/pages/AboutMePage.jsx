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

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import ClientProfileView from './ClientProfileView';
import FreelancerProfileView from './FreelancerProfileView';
import { useQuery } from '@tanstack/react-query';

const AboutMePage = () => {
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const { auth } = useAuth();

    const { data, isLoading: loading } = useQuery({
        queryKey: ['aboutMe', auth.user?.id],
        queryFn: async () => {
            const res = await api.get('/aggregated/about-me');
            return res.data;
        },
        enabled: !!auth.user
    });

    const profile = data?.profile;
    const user = data?.user;

    if (loading) {
        return <div className="text-center mt-10">Loading your information...</div>;
    }

    if (!user) {
        return <p className="text-center text-red-500">Could not load user data.</p>;
    }

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <Link to="/dashboard" className="inline-flex items-center gap-2 mb-6 text-gray-600 hover:text-blue-600 font-semibold bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm hover:shadow hover:border-blue-200 transition-all group">
                <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Back to Dashboard
            </Link>
            
            {auth.user.role === 'Client' ? (
                <ClientProfileView user={user} profile={profile} isPreviewMode={isPreviewMode} setIsPreviewMode={setIsPreviewMode} />
            ) : (
                <FreelancerProfileView user={user} profile={profile} isPreviewMode={isPreviewMode} setIsPreviewMode={setIsPreviewMode} />
            )}
        </div>
    );
};

export default AboutMePage;