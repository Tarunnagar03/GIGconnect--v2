import React from 'react';
import { Link as ScrollLink } from 'react-scroll';

const LandingNavbar = () => {
    return (
        <nav className="bg-white text-gray-800 p-4 shadow-md sticky top-0 z-50">
            <div className="container mx-auto flex justify-between items-center">
                <h1 className="text-2xl font-bold text-blue-600">GigConnect</h1>
                <div className="space-x-6 hidden md:flex">
                    <ScrollLink to="home" spy={true} smooth={true} duration={500} offset={-70} className="font-semibold cursor-pointer hover:text-blue-600">Home</ScrollLink>
                    <ScrollLink to="about" spy={true} smooth={true} duration={500} offset={-70} className="font-semibold cursor-pointer hover:text-blue-600">About</ScrollLink>
                    <ScrollLink to="services" spy={true} smooth={true} duration={500} offset={-70} className="font-semibold cursor-pointer hover:text-blue-600">Services</ScrollLink>
                    <ScrollLink to="projects" spy={true} smooth={true} duration={500} offset={-70} className="font-semibold cursor-pointer hover:text-blue-600">Projects</ScrollLink>
                    <ScrollLink to="contact" spy={true} smooth={true} duration={500} offset={-70} className="font-semibold cursor-pointer hover:text-blue-600">Contact</ScrollLink>
                </div>
                <ScrollLink 
                    to="login-register" 
                    smooth={true} 
                    duration={500}
                    offset={-70}
                    className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                    Login / Register
                </ScrollLink>
            </div>
        </nav>
    );
};

export default LandingNavbar;