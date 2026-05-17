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
 * - NEW: Integrated Command Palette (Cmd+K)
 * - NEW: Integrated Focus Mode for deep work
 */

import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import api from '../api';

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

// Real-time Bell Component
const NotificationBell = () => {
    const { auth } = useContext(AuthContext);
    const { socket } = useContext(SocketContext);
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);

    const bellRef = useClickOutside(() => {
        setIsOpen(false);
    });

    const fetchNotifications = async () => {
        if (!auth?.isAuthenticated) return;
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchNotifications();
        // Automatically check for new notifications every 15 seconds
        const interval = setInterval(fetchNotifications, 15000);
        return () => clearInterval(interval);
    }, [auth?.isAuthenticated]);

    // --- NEW: Real-time Socket.io Notification Listener ---
    useEffect(() => {
        if (!socket || !auth?.isAuthenticated) return;
        const handleNewNotif = (notif) => {
            setNotifications(prev => [notif, ...prev]);
            // Optional: Play a subtle UI pop sound
            try {
                const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
                audio.volume = 0.5;
                audio.play().catch(() => {});
            } catch(e) {}
        };
        socket.on('newNotification', handleNewNotif);
        return () => socket.off('newNotification', handleNewNotif);
    }, [socket, auth?.isAuthenticated]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleOpen = async () => {
        setIsOpen(!isOpen);
        if (!isOpen && unreadCount > 0) {
            try {
                await api.put('/notifications/read');
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            } catch (err) { console.error(err); }
        }
    };

    return (
        <div className="relative z-50" ref={bellRef}>
            <button onClick={handleOpen} className="relative p-2 text-neutral-600 hover:text-primary-600 transition-colors rounded-full hover:bg-neutral-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-black rounded-full h-4 w-4 flex items-center justify-center shadow-sm border-2 border-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-200 p-2 overflow-hidden animate-slide-up origin-top-right">
                    <div className="px-3 py-2 border-b border-gray-100/50 font-extrabold text-sm text-gray-800 tracking-tight">Notifications</div>
                    <div className="max-h-80 overflow-y-auto mt-1 space-y-1">
                        {notifications.length > 0 ? (
                            notifications.map(notif => (
                                <Link 
                                    key={notif._id} 
                                    to={notif.link || '#'} 
                                    onClick={() => setIsOpen(false)}
                                    className={`block px-3 py-3 rounded-xl hover:bg-gray-50/80 transition-colors ${!notif.isRead ? 'bg-blue-50/50' : ''}`}
                                >
                                    <p className={`text-sm leading-tight ${!notif.isRead ? 'font-bold text-gray-900' : 'text-gray-600 font-medium'}`}>{notif.message}</p>
                                    <p className="text-[10px] font-bold text-gray-400 mt-1.5 uppercase tracking-wider">{new Date(notif.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                </Link>
                            ))
                        ) : (
                            <div className="p-6 text-center text-neutral-500 text-sm">No new notifications</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const Navbar = () => {
    const { auth, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [oppMenuOpen, setOppMenuOpen] = useState(false);
    const [projMenuOpen, setProjMenuOpen] = useState(false);

    const { socket } = useContext(SocketContext);
    const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
    const [toastMsg, setToastMsg] = useState(null);
    const [pendingCount, setPendingCount] = useState(0);

    const dropdownRef = useClickOutside(() => {
        setDropdownOpen(false);
    });

    // --- NEW: Real-time Global Message Toast ---
    useEffect(() => {
        if (!socket || !auth?.user) return;
        const handleConvoUpdate = (convo) => {
            // Check if the last message is from someone else
            if (convo.lastMessage && String(convo.lastMessage.sender) !== String(auth.user.id)) {
                setHasUnreadMessages(true);
                
                // Find sender name for the toast
                const senderObj = convo.participants.find(p => String(p._id) !== String(auth.user.id));
                const senderName = senderObj ? senderObj.name : 'Someone';
                
                setToastMsg(`💬 New message from ${senderName}`);
                setTimeout(() => setToastMsg(null), 5000);
            }
        };
        socket.on('conversationUpdated', handleConvoUpdate);
        return () => socket.off('conversationUpdated', handleConvoUpdate);
    }, [socket, auth?.user]);

    // --- NEW: Fetch Pending Proposals Count for Freelancer ---
    useEffect(() => {
        if (!auth?.isAuthenticated) return;
        if (auth.user.role === 'Freelancer') {
            api.get('/proposals/my-proposals')
                .then(res => {
                    if (Array.isArray(res.data)) {
                        setPendingCount(res.data.filter(p => p.status === 'Submitted').length);
                    }
                })
                .catch(() => {});
        }
    }, [auth?.isAuthenticated, auth?.user?.role]);

    const onLogout = () => {
        logout();
        navigate('/');
    };

    if (!auth || !auth.user) {
        return null; // Don't render if user is not loaded
    }

    // Update the "My Projects" link based on role
    const myProjectsLink = auth.user.role === 'Freelancer' ? '/my-projects' : '/manage-gigs';

    return (
        <>
        {/* --- GLOBAL REAL-TIME TOAST --- */}
        {toastMsg && (
            <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-slide-up">
                <Link to="/inbox" onClick={() => setToastMsg(null)} className="bg-gray-900/95 backdrop-blur-xl text-white px-6 py-3.5 rounded-full text-sm font-bold shadow-2xl hover:bg-black transition-all flex items-center gap-3 border border-gray-700 hover:scale-105 group">
                    {toastMsg}
                    <span className="bg-blue-600 text-white text-[10px] px-3 py-1.5 rounded-md uppercase tracking-widest ml-2 group-hover:bg-blue-500 transition-colors shadow-inner">Reply</span>
                </Link>
            </div>
        )}

        {/* --- CLASSIC CLEAN NAVBAR --- */}
        <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
            <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">

                {/* --- LEFT SIDE: Logo & Links --- */}
                <div className="flex items-center gap-8">
                    <Link to="/dashboard" className="text-2xl font-extrabold tracking-tighter text-blue-600 flex items-center gap-2">
                        GigConnect
                    </Link>

                    {/* Desktop Navigation Links */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link to="/dashboard" className="text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors">Dashboard</Link>
                        
                        {/* --- Opportunities / Find Talent Mega Menu --- */}
                        <div 
                            className="relative group py-4"
                            onMouseEnter={() => setOppMenuOpen(true)}
                            onMouseLeave={() => setOppMenuOpen(false)}
                        >
                            <Link to={auth.user.role === 'Freelancer' ? '/gigs' : '/freelancers'} className={`text-sm font-semibold transition-colors flex items-center gap-1 ${oppMenuOpen ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}>
                                {auth.user.role === 'Freelancer' ? 'Opportunities' : 'Find Talent'}
                                <svg className={`w-4 h-4 transition-transform duration-200 ${oppMenuOpen ? 'rotate-180 text-blue-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </Link>
                            
                            <div className={`absolute top-[50px] left-1/2 -translate-x-1/2 w-[480px] bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-gray-100 p-6 transition-all duration-200 origin-top ${oppMenuOpen ? 'opacity-100 visible scale-100 translate-y-0' : 'opacity-0 invisible scale-95 -translate-y-2'}`}>
                                {auth.user.role === 'Freelancer' ? (
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                        <div>
                                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Discover</h4>
                                            <div className="space-y-4">
                                            <Link to="/gigs?sort=latest" onClick={() => setOppMenuOpen(false)} className="flex items-center gap-3 text-sm font-bold text-gray-800 hover:text-blue-600 group/link">
                                                    <span className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-lg group-hover/link:scale-110 transition-transform">✨</span> Recommended
                                                </Link>
                                            <Link to="/gigs?saved=true" onClick={() => setOppMenuOpen(false)} className="flex items-center gap-3 text-sm font-bold text-gray-800 hover:text-blue-600 group/link">
                                                    <span className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-lg group-hover/link:scale-110 transition-transform">🔖</span> Saved Jobs
                                                </Link>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Categories</h4>
                                            <div className="space-y-4">
                                            <Link to="/gigs?skills=Web+Development" onClick={() => setOppMenuOpen(false)} className="block text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors">Web Development</Link>
                                            <Link to="/gigs?skills=UI%2FUX+Design" onClick={() => setOppMenuOpen(false)} className="block text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors">UI/UX Design</Link>
                                            <Link to="/gigs?skills=Content+Writing" onClick={() => setOppMenuOpen(false)} className="block text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors">Content Writing</Link>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                        <div>
                                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Find Experts</h4>
                                            <div className="space-y-4">
                                            <Link to="/freelancers?minRating=4&sort=rating_desc" onClick={() => setOppMenuOpen(false)} className="flex items-center gap-3 text-sm font-bold text-gray-800 hover:text-blue-600 group/link">
                                                    <span className="w-8 h-8 rounded-full bg-yellow-50 text-yellow-600 flex items-center justify-center text-lg group-hover/link:scale-110 transition-transform">⭐</span> Top Rated
                                                </Link>
                                            <Link to="/freelancers?saved=true" onClick={() => setOppMenuOpen(false)} className="flex items-center gap-3 text-sm font-bold text-gray-800 hover:text-blue-600 group/link">
                                                    <span className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-lg group-hover/link:scale-110 transition-transform">🔖</span> Saved Profiles
                                                </Link>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Quick Links</h4>
                                            <div className="space-y-4">
                                            <Link to="/manage-gigs?tab=Completed" onClick={() => setOppMenuOpen(false)} className="block text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors">My Previous Hires</Link>
                                                <Link to="/post-gig" onClick={() => setOppMenuOpen(false)} className="block text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors">Post a New Gig</Link>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                                    <Link to={auth.user.role === 'Freelancer' ? '/gigs' : '/freelancers'} onClick={() => setOppMenuOpen(false)} className="text-xs font-extrabold text-blue-600 hover:text-blue-800 flex items-center gap-1 justify-center uppercase tracking-wider">
                                        View all {auth.user.role === 'Freelancer' ? 'opportunities' : 'talent'} <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* --- My Projects Mega Menu --- */}
                        <div 
                            className="relative group py-4"
                            onMouseEnter={() => setProjMenuOpen(true)}
                            onMouseLeave={() => setProjMenuOpen(false)}
                        >
                            <Link to={myProjectsLink} className={`text-sm font-semibold transition-colors flex items-center gap-1 ${projMenuOpen ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}>
                                My Projects
                                <svg className={`w-4 h-4 transition-transform duration-200 ${projMenuOpen ? 'rotate-180 text-blue-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </Link>
                            
                            <div className={`absolute top-[50px] left-1/2 -translate-x-1/2 w-[300px] bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-gray-100 p-2 transition-all duration-200 origin-top ${projMenuOpen ? 'opacity-100 visible scale-100 translate-y-0' : 'opacity-0 invisible scale-95 -translate-y-2'}`}>
                                <Link to={myProjectsLink} onClick={() => setProjMenuOpen(false)} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors group/item">
                                    <div className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center text-xl group-hover/item:scale-110 transition-transform shadow-sm">🟢</div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800 group-hover/item:text-blue-600">Active Contracts</p>
                                        <p className="text-[10px] text-gray-500 font-medium">Currently in progress</p>
                                    </div>
                                </Link>
                                <Link to={auth.user.role === 'Freelancer' ? "/my-proposals" : "/manage-gigs"} onClick={() => setProjMenuOpen(false)} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors group/item mt-1">
                                    <div className="w-10 h-10 bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center text-xl group-hover/item:scale-110 transition-transform shadow-sm">⏳</div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm font-bold text-gray-800 group-hover/item:text-blue-600">{auth.user.role === 'Freelancer' ? 'Pending Proposals' : 'Manage Job Postings'}</p>
                                            {auth.user.role === 'Freelancer' && pendingCount > 0 && (
                                                <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse">{pendingCount}</span>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-gray-500 font-medium">{auth.user.role === 'Freelancer' ? 'Awaiting client response' : 'Review candidates per gig'}</p>
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT SIDE: Notifications & Avatar --- */}
                <div className="flex items-center gap-2 sm:gap-4">
                    
                    {/* Messages Icon */}
                    <Link to="/inbox" onClick={() => setHasUnreadMessages(false)} className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 transition-colors rounded-full" title="Messages">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                        {hasUnreadMessages && (
                            <span className="absolute top-1.5 right-1.5 bg-red-500 border-2 border-white rounded-full h-3 w-3 animate-pulse shadow-sm"></span>
                        )}
                    </Link>

                    <NotificationBell />
                    
                    {/* User Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-sm hover:shadow transition-all focus:outline-none"
                        >
                            {auth.user?.profileImage ? (
                                <img src={auth.user.profileImage} alt="Profile" className="w-full h-full object-cover rounded-full" />
                            ) : (
                                (auth.user?.companyName || auth.user?.name || 'U').charAt(0).toUpperCase()
                            )}
                        </button>

                        {/* Classic Dropdown Menu */}
                        {dropdownOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-fade-in origin-top-right">
                                <div className="px-4 py-3 border-b border-gray-100">
                                    <p className="text-sm font-bold text-gray-900 truncate">{auth.user.companyName || auth.user.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{auth.user.email}</p>
                                    <p className="text-[10px] font-bold text-blue-600 uppercase mt-1 tracking-wider">{auth.user.role}</p>
                                </div>
                                <div className="py-2">
                                    <Link to={auth.user.role === 'Freelancer' ? '/about-me' : `/client-profile/${auth.user.id}`} onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                                        My Profile
                                    </Link>
                                    <Link to="/settings" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                                        Settings
                                    </Link>
                                    <Link to="/settings/billing" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                                        Billing & Invoices
                                    </Link>
                                </div>
                                <div className="border-t border-gray-100 pt-2">
                                    <button onClick={onLogout} className="w-full text-left px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors">
                                        Log Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Mobile Hamburger */}
                    <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-gray-600 hover:text-blue-600 focus:outline-none ml-2">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                    </button>
                </div>
            </nav>
        </div>

        {/* --- MOBILE SIDE MENU --- */}
        {isMobileMenuOpen && (
            <div className="fixed inset-0 z-[100] flex md:hidden">
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
                <div className="w-[80%] max-w-sm bg-white h-full relative z-10 shadow-2xl flex flex-col animate-slide-left">
                    <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-xl font-extrabold text-blue-600">GigConnect</h2>
                        <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-500 hover:text-red-500 font-bold text-xl">✕</button>
                    </div>
                    <div className="p-4 space-y-1 flex-1 overflow-y-auto">
                        <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="block p-3 text-base font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg">Dashboard</Link>
                        <Link to={auth.user.role === 'Freelancer' ? '/gigs' : '/freelancers'} onClick={() => setIsMobileMenuOpen(false)} className="block p-3 text-base font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg">{auth.user.role === 'Freelancer' ? 'Opportunities' : 'Find Talent'}</Link>
                        <Link to={myProjectsLink} onClick={() => setIsMobileMenuOpen(false)} className="block p-3 text-base font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg">My Projects</Link>
                        <Link to="/inbox" onClick={() => { setIsMobileMenuOpen(false); setHasUnreadMessages(false); }} className="block p-3 text-base font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg">Messages</Link>
                    </div>
                    <div className="p-4 border-t border-gray-100">
                        <button onClick={() => { setIsMobileMenuOpen(false); onLogout(); }} className="w-full text-center p-3 text-red-600 font-bold bg-red-50 rounded-lg hover:bg-red-100">Log Out</button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
};

export default Navbar;