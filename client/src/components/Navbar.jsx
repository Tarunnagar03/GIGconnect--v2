/**
 * Navbar Component
 * UPDATED: May 6, 2026 - Design System Enhancement
 * 
 * Changes Made:
 * - Replaced basic styling with modern gradient logo design
 * - Updated dropdown menu with enhanced visual design
 * - Applied custom color scheme (primary, secondary, accent colors)
 * - Added smooth transitions and hover effects
 * - Improved responsive design for mobile devices
 * - Enhanced user dropdown with better visual hierarchy
 * - Integrated new custom CSS classes from design system
 */

import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// Custom hook to handle clicks outside of a given element
const useClickOutside = (handler) => {
    const domNode = useRef();
    useEffect(() => {
        const maybeHandler = (event) => {
            if (domNode.current && !domNode.current.contains(event.target)) {
                handler();
            }
        };
        document.addEventListener('mousedown', maybeHandler);
        return () => {
            document.removeEventListener('mousedown', maybeHandler);
        };
    });
    return domNode;
};

const Navbar = () => {
    const { auth, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const dropdownRef = useClickOutside(() => {
        setDropdownOpen(false);
    });

    const onLogout = () => {
        logout();
        navigate('/');
    };

    if (!auth || !auth.user) {
        return null; // Don't render if user is not loaded
    }

    // Update the "My Projects" link based on role
    const myProjectsLink = auth.user.role === 'Freelancer' ? '/my-projects' : '/my-client-projects';

    const aboutMeLink = auth.user.role === 'Freelancer' ? '/about-me' : '/settings/details';

    return (
        <nav className="bg-white/95 backdrop-blur-md text-neutral-800 px-4 py-4 shadow-soft sticky top-0 z-50 border-b border-neutral-200/60">
            <div className="gc-container flex justify-between items-center">

                {/* --- LEFT SIDE: Logo Only --- */}
                <Link to="/dashboard" className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent hover:scale-105 transition-transform">
                    GigConnect
                </Link>

                {/* --- RIGHT SIDE: Nav Links & User Menu --- */}
                <div className="flex items-center gap-8">

                    {/* --- Navigation Links --- */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link to="/dashboard" className="font-medium text-neutral-600 hover:text-primary-600 transition-colors relative group">
                            Dashboard
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-600 transition-all duration-200 group-hover:w-full"></span>
                        </Link>
                        {auth.user.role === 'Client' && (
                            <Link to="/freelancers" className="font-medium text-neutral-600 hover:text-primary-600 transition-colors relative group">
                                Find Freelancers
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-600 transition-all duration-200 group-hover:w-full"></span>
                            </Link>
                        )}
                        {auth.user.role === 'Admin' && (
                            <Link to="/admin" className="font-medium text-neutral-600 hover:text-primary-600 transition-colors relative group">
                                Admin Panel
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-600 transition-all duration-200 group-hover:w-full"></span>
                            </Link>
                        )}
                        <Link to={aboutMeLink} className="font-medium text-neutral-600 hover:text-primary-600 transition-colors relative group">
                            Profile
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-600 transition-all duration-200 group-hover:w-full"></span>
                        </Link>
                        <Link to={myProjectsLink} className="font-medium text-neutral-600 hover:text-primary-600 transition-colors relative group">
                            Projects
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-600 transition-all duration-200 group-hover:w-full"></span>
                        </Link>
                        <Link to="/services" className="font-medium text-neutral-600 hover:text-primary-600 transition-colors relative group">
                            Services
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-600 transition-all duration-200 group-hover:w-full"></span>
                        </Link>
                    </div>

                    {/* --- User Dropdown Menu --- */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="w-10 h-10 flex items-center justify-center font-bold rounded-full bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-soft hover:shadow-medium transition-all duration-200 hover:scale-105"
                        >
                            {auth.user.name.charAt(0).toUpperCase()}
                        </button>

                        {dropdownOpen && (
                            <div
                                className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-large py-3 z-50 animate-slide-up border border-neutral-200/60"
                            >
                                <div className="px-4 py-3 border-b border-neutral-200/60 bg-neutral-50/50 rounded-t-xl">
                                    <p className="text-sm text-neutral-600">Signed in as</p>
                                    <p className="text-sm font-semibold text-neutral-900 truncate">{auth.user.name}</p>
                                    <p className="text-xs text-neutral-500">@{auth.user.username} • {auth.user.role}</p>
                                </div>
                                {auth.user.role === 'Freelancer' && (
                                    <Link to="/create-profile" className="block px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors" onClick={() => setDropdownOpen(false)}>
                                        <div className="flex items-center">
                                            <svg className="w-4 h-4 mr-3 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            Edit Profile
                                        </div>
                                    </Link>
                                )}
                                <Link to="/inbox" className="block px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors" onClick={() => setDropdownOpen(false)}>
                                    <div className="flex items-center">
                                        <svg className="w-4 h-4 mr-3 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                        Messages
                                    </div>
                                </Link>
                                <Link to="/settings" className="block px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors" onClick={() => setDropdownOpen(false)}>
                                    <div className="flex items-center">
                                        <svg className="w-4 h-4 mr-3 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        Settings
                                    </div>
                                </Link>
                                <div className="border-t border-neutral-200/60 mt-2">
                                    <button onClick={onLogout} className="w-full text-left block px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-b-xl">
                                        <div className="flex items-center">
                                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            Sign Out
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;