/**
 * HomePage Component
 * UPDATED: May 6, 2026 - Modern Design & Layout Enhancement
 * 
 * Changes Made:
 * - Redesigned hero section with gradient backgrounds
 * - Enhanced about/services sections with professional layout
 * - Updated contact form with modern styling
 * - Applied custom color scheme throughout
 * - Added smooth animations for page elements
 * - Improved typography with professional fonts
 * - Enhanced authentication forms with better UX
 * - Implemented responsive design for all screen sizes
 */

import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Import Link
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import { Country, State, City } from 'country-state-city';
import LandingNavbar from '../components/LandingNavbar';
import { Link as ScrollLink } from 'react-scroll';

// --- (All your Icon components: ChevronDownIcon, EyeIcon, EyeOffIcon) ---
const ChevronDownIcon = () => ( <svg className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg> );
const EyeIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639l4.443-5.332a1.01 1.01 0 011.517 0l4.443 5.332a1.012 1.012 0 010 .639l-4.443 5.332a1.01 1.01 0 01-1.517 0l-4.443-5.332z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> );
const EyeOffIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243l-4.243-4.243" /></svg> );

// --- Helper component for the placeholder sections ---
const Section = ({ id, title, children, bg = 'bg-white' }) => (
    <section id={id} className={`gc-section ${bg}`}>
        <div className="gc-container">
            <h2 className="text-4xl font-bold text-center mb-12 text-neutral-800">{title}</h2>
            {children}
        </div>
    </section>
);

// --- New: Contact Form Component ---
const ContactForm = () => {
    const [contactData, setContactData] = useState({ name: '', email: '', message: '' });
    const [contactError, setContactError] = useState('');
    const [contactSuccess, setContactSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const onContactChange = e => setContactData({ ...contactData, [e.target.name]: e.target.value });

    const onContactSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setContactError('');
        setContactSuccess('');
        try {
            const res = await api.post('/api/contact', contactData);
            setContactSuccess(res.data.msg);
            setContactData({ name: '', email: '', message: '' });
        } catch (err) {
            setContactError(err.response?.data?.msg || 'Failed to send message.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-neutral-800 mb-4">Get In Touch</h3>
                <p className="text-neutral-600">
                    Have questions about GigConnect? We'd love to hear from you.
                </p>
            </div>

            <form onSubmit={onContactSubmit} className="gc-card p-8 space-y-6">
                {contactSuccess && (
                    <div className="bg-secondary-50 border border-secondary-200 text-secondary-800 px-4 py-3 rounded-lg text-center font-medium animate-slide-up">
                        {contactSuccess}
                    </div>
                )}
                {contactError && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-center font-medium animate-slide-up">
                        {contactError}
                    </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="contact-name" className="gc-label">
                            Your Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            id="contact-name"
                            value={contactData.name}
                            onChange={onContactChange}
                            required
                            className="gc-input"
                            placeholder="John Doe"
                        />
                    </div>
                    <div>
                        <label htmlFor="contact-email" className="gc-label">
                            Your Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            name="email"
                            id="contact-email"
                            value={contactData.email}
                            onChange={onContactChange}
                            required
                            className="gc-input"
                            placeholder="john@example.com"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="contact-message" className="gc-label">
                        Message <span className="text-neutral-400">(Optional)</span>
                    </label>
                    <textarea
                        name="message"
                        id="contact-message"
                        rows="5"
                        value={contactData.message}
                        onChange={onContactChange}
                        className="gc-textarea resize-none"
                        placeholder="Tell us how we can help you..."
                    ></textarea>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="gc-btn-primary w-full py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Sending...
                        </div>
                    ) : (
                        'Send Message'
                    )}
                </button>
            </form>
        </div>
    );
};

// --- New: Featured Gigs Component ---
const FeaturedProjects = () => {
    const [gigs, setGigs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/gigs/public')
            .then(res => setGigs(res.data))
            .catch(err => console.error("Error fetching public gigs:", err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
    );
    if (gigs.length === 0) return (
        <p className="text-center text-neutral-500 py-12">
            No projects available right now. Be the first to post a gig!
        </p>
    );

    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {gigs.slice(0, 6).map(gig => (
                <div key={gig._id} className="gc-card p-6 group hover:scale-105 transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                        <h3 className="text-xl font-bold text-neutral-800 group-hover:text-primary-700 transition-colors line-clamp-2">
                            {gig.title}
                        </h3>
                        <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium ml-2 flex-shrink-0">
                            ${gig.budget}
                        </span>
                    </div>
                    <p className="text-neutral-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                        {gig.description}
                    </p>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-neutral-500">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {new Date(gig.createdAt).toLocaleDateString()}
                        </div>
                        <ScrollLink
                            to="login-register"
                            smooth={true}
                            duration={500}
                            offset={-70}
                            className="gc-btn-accent text-sm px-4 py-2 hover:scale-105 transition-transform"
                        >
                            View Details
                        </ScrollLink>
                    </div>
                </div>
            ))}
        </div>
    );
};


function HomePage() {
    // --- All your existing login/register logic is kept ---
    const [isLoginView, setIsLoginView] = useState(true);
    const [formData, setFormData] = useState({
        name: '', username: '', email: '', phone: '', password: '', confirmPassword: '', role: 'Client', 
        dob: '', country: '', state: '', city: '', companyName: '', headline: ''
    });
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [show2FAPrompt, setShow2FAPrompt] = useState(false);
    const [twoFaCode, setTwoFaCode] = useState('');
    const [tempUserId, setTempUserId] = useState(null);
    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    // --- All your existing useEffects and handlers are kept ---
    useEffect(() => { setCountries(Country.getAllCountries()); }, []);
    
    useEffect(() => {
        if (formData.country) {
            const countryInfo = Country.getCountryByCode(formData.country);
            setStates(State.getStatesOfCountry(countryInfo.isoCode));
            setFormData(prev => ({ ...prev, state: '', city: '' }));
        } else { setStates([]); setCities([]); }
    }, [formData.country]);
    
    useEffect(() => {
        if (formData.country && formData.state) {
            const countryInfo = Country.getCountryByCode(formData.country);
            const allStates = State.getStatesOfCountry(countryInfo.isoCode);
            const stateInfo = allStates.find(s => s.isoCode === formData.state);
            if (stateInfo) {
                setCities(City.getCitiesOfState(formData.country, stateInfo.isoCode));
            } else {
                setCities([]);
            }
        } else { 
            setCities([]); 
        }
    }, [formData.country, formData.state]);

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            // Only send email/username and password for login
            const loginData = { email: formData.email, password: formData.password };
            const res = await api.post('/auth/login', loginData);

            if (res.data.twoFactorRequired) {
                setTempUserId(res.data.userId);
                setShow2FAPrompt(true);
            } else {
                login(res.data.token);
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.msg || 'An error occurred.');
        }
    };
    
    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        try {
            const res = await api.post('/auth/register', formData);
            login(res.data.token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.msg || 'An error occurred.');
        }
    };
    
    const handle2FASubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await api.post('/auth/login/verify-2fa', { userId: tempUserId, token: twoFaCode });
            login(res.data.token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.msg || 'Invalid 2FA code.');
        }
    };
    
    return (
        <div className="bg-neutral-50">
            <LandingNavbar />

            {/* --- "Home" Section --- */}
            <section id="home" className="min-h-screen flex items-center justify-center gc-hero-bg text-white">
                <div className="text-center px-4 max-w-4xl mx-auto animate-fade-in">
                    <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-accent-200 bg-clip-text text-transparent">
                        Welcome to GigConnect
                    </h1>
                    <p className="text-xl md:text-2xl mb-8 text-accent-100 leading-relaxed">
                        Your hyperlocal marketplace for connecting talented freelancers with local businesses. Build stronger communities, one gig at a time.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <ScrollLink
                            to="login-register"
                            smooth={true}
                            duration={500}
                            offset={-70}
                            className="gc-btn-primary text-lg px-8 py-4 shadow-large hover:shadow-xl transform hover:scale-105 transition-all"
                        >
                            Get Started
                        </ScrollLink>
                        <ScrollLink
                            to="about"
                            smooth={true}
                            duration={500}
                            offset={-70}
                            className="gc-btn-secondary text-lg px-8 py-4 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                        >
                            Learn More
                        </ScrollLink>
                    </div>
                </div>
            </section>

            {/* --- "About" Section --- */}
            <Section id="about" title="About GigConnect" bg="bg-neutral-50">
                <div className="max-w-4xl mx-auto text-center">
                    <p className="text-xl text-neutral-600 mb-8 leading-relaxed">
                        GigConnect is a revolutionary hyperlocal freelance marketplace designed to connect talented local professionals with businesses right in their neighborhood.
                    </p>
                    <div className="grid md:grid-cols-3 gap-8 mt-12">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-neutral-800 mb-2">Local Focus</h3>
                            <p className="text-neutral-600">Connect with talent and businesses in your immediate community</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-neutral-800 mb-2">Verified Talent</h3>
                            <p className="text-neutral-600">All freelancers are vetted and rated by previous clients</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-neutral-800 mb-2">Secure Payments</h3>
                            <p className="text-neutral-600">Safe and secure payment processing with milestone protection</p>
                        </div>
                    </div>
                </div>
            </Section>

            {/* --- "Services" Section --- */}
            <Section id="services" title="Our Services" bg="bg-white">
                <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                    <div className="gc-card p-8 text-center group hover:scale-105 transition-transform duration-300">
                        <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary-200 transition-colors">
                            <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold mb-4 text-primary-700">For Clients</h3>
                        <p className="text-neutral-600 leading-relaxed">
                            Easily post a gig, receive bids from local freelancers, manage your projects, and handle payments securely, all in one place. Find the perfect professional just around the corner.
                        </p>
                        <ul className="text-left mt-6 space-y-2">
                            <li className="flex items-center text-neutral-700">
                                <svg className="w-5 h-5 text-secondary-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Post detailed project requirements
                            </li>
                            <li className="flex items-center text-neutral-700">
                                <svg className="w-5 h-5 text-secondary-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Review and compare proposals
                            </li>
                            <li className="flex items-center text-neutral-700">
                                <svg className="w-5 h-5 text-secondary-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Secure milestone-based payments
                            </li>
                        </ul>
                    </div>
                    <div className="gc-card p-8 text-center group hover:scale-105 transition-transform duration-300">
                        <div className="w-20 h-20 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-accent-200 transition-colors">
                            <svg className="w-10 h-10 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0V8a2 2 0 01-2 2H8a2 2 0 01-2-2V6m8 0H8m0 0V4" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold mb-4 text-accent-700">For Freelancers</h3>
                        <p className="text-neutral-600 leading-relaxed">
                            Showcase your skills, browse local jobs, submit proposals, and get paid securely. Build your portfolio and grow your freelance business within your own community.
                        </p>
                        <ul className="text-left mt-6 space-y-2">
                            <li className="flex items-center text-neutral-700">
                                <svg className="w-5 h-5 text-secondary-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Create detailed professional profiles
                            </li>
                            <li className="flex items-center text-neutral-700">
                                <svg className="w-5 h-5 text-secondary-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Discover local opportunities
                            </li>
                            <li className="flex items-center text-neutral-700">
                                <svg className="w-5 h-5 text-secondary-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Real-time messaging with clients
                            </li>
                        </ul>
                    </div>
                </div>
            </Section>

            {/* --- "Projects" Section --- */}
            <Section id="projects" title="Featured Open Projects" bg="bg-gray-50">
                <FeaturedProjects />
            </Section>
            
            {/* --- "Contact" Section --- */}
            <Section id="contact" title="Contact Us" bg="bg-white">
                <ContactForm />
            </Section>

            {/* --- "Login/Register" Section --- */}
            <section id="login-register" className="min-h-screen flex flex-col justify-center bg-gray-100 py-20 px-4">
                <div className="max-w-md w-full mx-auto">
                    <div className="bg-white p-8 rounded-lg shadow-md">
                        {show2FAPrompt ? (
                            <>
                                {/* --- 2FA Form --- */}
                                <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">Enter Security Code</h2>
                                <p className="text-center text-gray-600 mb-6">A 6-digit code was sent to your email.</p>
                                {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center">{error}</p>}
                                <form onSubmit={handle2FASubmit} className="space-y-5">
                                    <div>
                                        <label htmlFor="2fa-code" className="block text-sm font-medium text-gray-700 mb-1">Verification Code <span className="text-red-500">*</span></label>
                                        <input id="2fa-code" type="text" value={twoFaCode} onChange={(e) => setTwoFaCode(e.target.value)} required className="w-full p-3 border rounded-md" />
                                    </div>
                                    <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 font-bold">Verify & Login</button>
                                </form>
                            </>
                        ) : (
                            <>
                                {/* --- Login/Register Form --- */}
                                <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">{isLoginView ? 'Login' : 'Create an Account'}</h2>
                                {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center">{error}</p>}
                                
                                <form onSubmit={isLoginView ? handleLoginSubmit : handleRegisterSubmit} className="space-y-5">
                                    {!isLoginView && (
                                        <>
                                            {/* Role */}
                                            <div>
                                                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Register as <span className="text-red-500">*</span></label>
                                                <div className="relative">
                                                    <select id="role" name="role" value={formData.role} onChange={onChange} required className="appearance-none w-full p-3 border rounded-md bg-white text-black">
                                                        <option value="Client">A Client (hiring for a project)</option>
                                                        <option value="Freelancer">A Freelancer (looking for work)</option>
                                                    </select>
                                                    <ChevronDownIcon />
                                                </div>
                                            </div>
                                            {/* Conditional Fields */}
                                            {formData.role === 'Client' && (
                                                <div>
                                                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">Company Name <span className="text-gray-400">(Optional)</span></label>
                                                    <input id="companyName" type="text" name="companyName" value={formData.companyName} onChange={onChange} placeholder="Your Company, Inc." className="w-full p-3 border rounded-md" />
                                                </div>
                                            )}
                                            {formData.role === 'Freelancer' && (
                                                <div>
                                                    <label htmlFor="headline" className="block text-sm font-medium text-gray-700 mb-1">Professional Headline <span className="text-red-500">*</span></label>
                                                    <input id="headline" type="text" name="headline" value={formData.headline} onChange={onChange} placeholder="e.g., Senior React Developer" required className="w-full p-3 border rounded-md" />
                                                </div>
                                            )}
                                            {/* Name */}
                                            <div>
                                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                                                <input id="name" type="text" name="name" value={formData.name} onChange={onChange} required className="w-full p-3 border rounded-md" />
                                            </div>
                                            {/* Username */}
                                            <div>
                                                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username <span className="text-red-500">*</span></label>
                                                <input id="username" type="text" name="username" value={formData.username} onChange={onChange} placeholder="e.g., janesmith (no spaces)" required className="w-full p-3 border rounded-md" />
                                            </div>
                                        </>
                                    )}
                                    
                                    {/* Email / Username Login */}
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                            {isLoginView ? 'Email or Username' : 'Email Address'} <span className="text-red-500">*</span>
                                        </label>
                                        <input id="email" type={isLoginView ? 'text' : 'email'} name="email" value={formData.email} onChange={onChange} placeholder={isLoginView ? 'yourusername or you@example.com' : 'you@example.com'} required className="w-full p-3 border rounded-md" />
                                    </div>

                                    {/* Phone (Register only) */}
                                    {!isLoginView && (
                                        <div>
                                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-gray-400">(Optional)</span></label>
                                            <input id="phone" type="tel" name="phone" value={formData.phone} onChange={onChange} placeholder="Your Phone Number" className="w-full p-3 border rounded-md" />
                                        </div>
                                    )}
                                    
                                    {/* Password */}
                                    <div>
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <input id="password" type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={onChange} required className="w-full p-3 border rounded-md pr-10" />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center px-3" aria-label="Toggle password visibility">
                                                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                            </button>
                                        </div>
                                        
                                        {/* --- THIS IS THE ONLY ADDITION --- */}
                                        {isLoginView && (
                                            <div className="text-right mt-1">
                                                <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
                                                    Forgot Password?
                                                </Link>
                                            </div>
                                        )}
                                    </div>

                                    {/* Confirm Password (Register only) */}
                                    {!isLoginView && (
                                        <>
                                            <div>
                                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password <span className="text-red-500">*</span></label>
                                                <div className="relative">
                                                    <input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={onChange} required className="w-full p-3 border rounded-md pr-10" />
                                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 flex items-center px-3" aria-label="Toggle password visibility">
                                                        {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            {/* --- (Country, State, City, DOB fields) --- */}
                                            <div>
                                                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">Country <span className="text-red-500">*</span></label>
                                                <div className="relative">
                                                    <select id="country" name="country" value={formData.country} onChange={onChange} required className="appearance-none w-full p-3 border rounded-md bg-white text-black">
                                                        <option value="">Select Country</option>
                                                        {countries.map(country => <option key={country.isoCode} value={country.isoCode}>{country.name}</option>)}
                                                    </select>
                                                    <ChevronDownIcon />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
                                                    <div className="relative">
                                                        <select id="state" name="state" value={formData.state} onChange={onChange} required disabled={!formData.country} className="appearance-none w-full p-3 border rounded-md bg-white text-black disabled:bg-gray-100">
                                                            <option value="">Select State</option>
                                                            {states.map(state => <option key={state.isoCode} value={state.isoCode}>{state.name}</option>)}
                                                        </select>
                                                        <ChevronDownIcon />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
                                                    <div className="relative">
                                                        <select id="city" name="city" value={formData.city} onChange={onChange} required disabled={!formData.state} className="appearance-none w-full p-3 border rounded-md bg-white text-black disabled:bg-gray-100">
                                                            <option value="">Select City</option>
                                                            {cities.map(city => <option key={city.name} value={city.name}>{city.name}</option>)}
                                                        </select>
                                                        <ChevronDownIcon />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1">
                                                <div>
                                                    <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-1">Date of Birth <span className="text-red-500">*</span></label>
                                                    <input id="dob" type="date" name="dob" value={formData.dob} onChange={onChange} required className="w-full p-3 border rounded-md text-gray-500" />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition-colors font-bold">
                                        {isLoginView ? 'Login' : 'Create Account'}
                                    </button>
                                </form>
                                
                                <div className="text-center mt-6">
                                    <button onClick={() => { setIsLoginView(!isLoginView); setError(''); }} className="text-sm text-blue-600 hover:underline">
                                        {isLoginView ? "Don't have an account? Register" : 'Already have an account? Login'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}

export default HomePage;