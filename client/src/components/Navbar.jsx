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
    
    // --- THIS IS THE FIX ---
    // Update the "My Projects" link based on role
    const myProjectsLink = auth.user.role === 'Freelancer' ? '/my-projects' : '/my-client-projects';
    
    const aboutMeLink = auth.user.role === 'Freelancer' ? '/about-me' : '/settings/details';

    return (
        <nav className="bg-white text-gray-800 p-4 shadow-md sticky top-0 z-50">
            <div className="container mx-auto flex justify-between items-center">
                
                {/* --- LEFT SIDE: Logo Only --- */}
                <Link to="/dashboard" className="text-2xl font-bold text-blue-600">
                    GigConnect
                </Link>
                
                {/* --- RIGHT SIDE: Nav Links & User Menu --- */}
                <div className="flex items-center gap-8">
                    
                    {/* --- Navigation Links --- */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link to="/dashboard" className="font-semibold text-gray-600 hover:text-blue-600">
                            Home
                        </Link>
                        <Link to={aboutMeLink} className="font-semibold text-gray-600 hover:text-blue-600">
                            About Me
                        </Link>
                        <Link to={myProjectsLink} className="font-semibold text-gray-600 hover:text-blue-600">
                            My Projects
                        </Link>
                        <Link to="/services" className="font-semibold text-gray-600 hover:text-blue-600">
                            Services
                        </Link>
                        <Link to="/contact-us" className="font-semibold text-gray-600 hover:text-blue-600">
                            Contact
                        </Link>
                    </div>

                    {/* --- User Dropdown Menu --- */}
                    <div className="relative" ref={dropdownRef}>
                        <button 
                            onClick={() => setDropdownOpen(!dropdownOpen)} 
                            className="w-10 h-10 flex items-center justify-center font-bold rounded-full bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            {auth.user.name.charAt(0).toUpperCase()}
                        </button>
                        
                        {dropdownOpen && (
                            <div 
                                className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-2 z-50 transition-all duration-200 ease-out transform origin-top-right"
                                style={{ opacity: dropdownOpen ? 1 : 0, transform: dropdownOpen ? 'scaleY(1)' : 'scaleY(0.95)' }}
                            >
                                <div className="px-4 py-2 border-b">
                                    <p className="text-sm text-gray-900">Signed in as</p>
                                    <p className="text-sm font-medium text-gray-900 truncate">{auth.user.name} (@{auth.user.username})</p>
                                </div>
                                {auth.user.role === 'Freelancer' && (
                                    <Link to="/create-profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setDropdownOpen(false)}>
                                        My Profile (Edit)
                                    </Link>
                                )}
                                <Link to="/inbox" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setDropdownOpen(false)}>
                                    Inbox
                                </Link>
                                <Link to="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setDropdownOpen(false)}>
                                    Settings
                                </Link>
                                <button onClick={onLogout} className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 border-t">
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;