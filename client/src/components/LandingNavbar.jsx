/**
 * LandingNavbar Component
 * UPDATED: May 6, 2026 - Landing Page Navigation Enhancement
 * 
 * Features:
 * - Smooth scrolling navigation for homepage
 * - Mobile responsive hamburger menu
 * - Modern navigation design
 * - Gradient styling
 * - Section linking
 */

import React from 'react';
import { Link as ScrollLink } from 'react-scroll';

const LandingNavbar = () => {
const LandingNavbar = () => {
    return (
        <nav className="bg-white/95 backdrop-blur-md text-neutral-800 px-4 py-4 shadow-soft sticky top-0 z-50 border-b border-neutral-200/60">
            <div className="gc-container flex justify-between items-center">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                    GigConnect
                </h1>
                <div className="space-x-8 hidden md:flex">
                    <ScrollLink
                        to="home"
                        spy={true}
                        smooth={true}
                        duration={500}
                        offset={-70}
                        className="font-medium cursor-pointer text-neutral-600 hover:text-primary-600 transition-colors relative group"
                    >
                        Home
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-600 transition-all duration-200 group-hover:w-full"></span>
                    </ScrollLink>
                    <ScrollLink
                        to="about"
                        spy={true}
                        smooth={true}
                        duration={500}
                        offset={-70}
                        className="font-medium cursor-pointer text-neutral-600 hover:text-primary-600 transition-colors relative group"
                    >
                        About
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-600 transition-all duration-200 group-hover:w-full"></span>
                    </ScrollLink>
                    <ScrollLink
                        to="services"
                        spy={true}
                        smooth={true}
                        duration={500}
                        offset={-70}
                        className="font-medium cursor-pointer text-neutral-600 hover:text-primary-600 transition-colors relative group"
                    >
                        Services
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-600 transition-all duration-200 group-hover:w-full"></span>
                    </ScrollLink>
                    <ScrollLink
                        to="projects"
                        spy={true}
                        smooth={true}
                        duration={500}
                        offset={-70}
                        className="font-medium cursor-pointer text-neutral-600 hover:text-primary-600 transition-colors relative group"
                    >
                        Projects
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-600 transition-all duration-200 group-hover:w-full"></span>
                    </ScrollLink>
                    <ScrollLink
                        to="contact"
                        spy={true}
                        smooth={true}
                        duration={500}
                        offset={-70}
                        className="font-medium cursor-pointer text-neutral-600 hover:text-primary-600 transition-colors relative group"
                    >
                        Contact
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-600 transition-all duration-200 group-hover:w-full"></span>
                    </ScrollLink>
                </div>
                <ScrollLink
                    to="login-register"
                    smooth={true}
                    duration={500}
                    offset={-70}
                    className="gc-btn-primary text-lg px-6 py-2 hover:scale-105 transition-transform shadow-soft hover:shadow-medium"
                >
                    Get Started
                </ScrollLink>
            </div>
        </nav>
    );
};
};

export default LandingNavbar;