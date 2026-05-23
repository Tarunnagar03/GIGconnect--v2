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

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Import Link
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { Country, State, City } from 'country-state-city';
import LandingNavbar from '../components/LandingNavbar';
import { Link as ScrollLink } from 'react-scroll';
import { formatCurrency } from '../utils/currencyFormatter';
import { ChevronDownIcon, EyeIcon, EyeOffIcon } from '../components/Icons';
import { useQuery } from '@tanstack/react-query';

// --- Helper component for the placeholder sections ---
const Section = ({ id, title, children, bg = 'bg-white' }) => (
    <section id={id} className={`gc-section ${bg}`}>
        <div className="gc-container">
            {title && <h2 className="text-4xl font-bold text-center mb-12 text-neutral-800">{title}</h2>}
            {children}
        </div>
    </section>
);

// --- New: Featured Gigs Component ---
const FeaturedProjects = () => {
    const { data: gigs = [], isLoading: loading } = useQuery({
        queryKey: ['featuredGigs'],
        queryFn: async () => {
            const res = await api.get('/gigs/public');
            return Array.isArray(res.data) ? res.data.filter(gig => gig.client && gig.status === 'Open') : [];
        }
    });

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
                <div key={gig._id} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col h-full group relative overflow-hidden">
                    {/* Subtle top gradient line on hover */}
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
                    
                    <div className="flex justify-between items-start mb-4 gap-4">
                        <h3 className="text-xl font-extrabold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                            {gig.title}
                        </h3>
                        <div className="bg-green-50 border border-green-100 text-green-700 px-3 py-1.5 rounded-xl text-sm font-bold shadow-sm whitespace-nowrap">
                            {formatCurrency(gig.budget)}
                        </div>
                    </div>
                    
                    {/* Client / Date info */}
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs shadow-sm">
                            {(gig.client?.companyName || gig.client?.name || 'C').charAt(0).toUpperCase()}
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                            Posted on {new Date(gig.date || gig.createdAt).toLocaleDateString()}
                        </div>
                    </div>

                    <p className="text-gray-600 text-sm mb-8 line-clamp-3 leading-relaxed flex-grow">
                        {gig.description}
                    </p>
                    
                    <div className="mt-auto border-t border-gray-100 pt-5">
                        <ScrollLink
                            to="login-register"
                            smooth={true}
                            duration={500}
                            offset={-70}
                            className="w-full flex items-center justify-center gap-2 bg-gray-50 text-blue-600 border border-gray-200 font-bold py-3 rounded-xl group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all cursor-pointer"
                        >
                            Apply Now <span className="transform group-hover:translate-x-1 transition-transform">&rarr;</span>
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
    const [clientType, setClientType] = useState('personal');
    const [step, setStep] = useState(1);
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
    const { login } = useAuth();

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
                await login();
                navigate('/dashboard');
            }
        } catch (err) {
            // FIX: Display the actual backend error or network error instead of a generic message
            if (err.response && err.response.data && err.response.data.msg) {
                setError(err.response.data.msg);
            } else {
                setError(err.message === 'Network Error' ? 'Cannot connect to the server. Is MongoDB/Backend running?' : `Error: ${err.message}`);
            }
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
            const payload = { ...formData };
            if (payload.role === 'Client' && clientType === 'personal') {
                payload.companyName = '';
            }
            
            const res = await api.post('/auth/register', payload);
            await login();
            navigate('/dashboard');
        } catch (err) {
            if (err.response && err.response.data && err.response.data.msg) {
                setError(err.response.data.msg);
            } else {
                setError(`Error: ${err.message}`);
            }
        }
    };
    
    const handle2FASubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await api.post('/auth/login/verify-2fa', { userId: tempUserId, token: twoFaCode });
            await login();
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.msg || 'Invalid 2FA code.');
        }
    };

    const handlePrevStep = () => {
        setError('');
        setStep(1);
    };
    
    return (
        <div className="bg-neutral-50">
            <LandingNavbar />

            {/* --- "Home" Section --- */}
            <section id="home" className="relative min-h-[90vh] flex flex-col justify-center bg-gradient-to-br from-gray-900 via-slate-800 to-black text-white overflow-hidden pt-20">
                {/* Ambient glowing blobs for Premium feel */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] pointer-events-none"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] pointer-events-none"></div>

                {/* Background Image Overlay */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1920&q=80" alt="Team collaborating" className="w-full h-full object-cover opacity-20 mix-blend-overlay" />
                </div>

                <div className="relative z-10 text-center px-4 max-w-5xl mx-auto animate-fade-in mt-16">
                    <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight drop-shadow-lg leading-tight">
                        Hire the Top 1% Local Talent <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">for your Next Big Idea.</span>
                    </h1>
                    <p className="text-xl md:text-2xl mb-12 text-gray-300 leading-relaxed max-w-3xl mx-auto">
                        The premium hyperlocal marketplace connecting world-class professionals with growing businesses right in your neighborhood.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                        <ScrollLink
                            to="login-register"
                            smooth={true}
                            duration={500}
                            offset={-70}
                            onClick={() => { setFormData({ ...formData, role: 'Client' }); setStep(2); setIsLoginView(false); }}
                            className="bg-white text-gray-900 hover:bg-gray-100 font-bold text-lg px-8 py-4 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.2)] transform hover:-translate-y-1 transition-all cursor-pointer w-full sm:w-auto"
                        >
                            Post a Gig
                        </ScrollLink>
                        <ScrollLink
                            to="login-register"
                            smooth={true}
                            duration={500}
                            offset={-70}
                            onClick={() => { setFormData({ ...formData, role: 'Freelancer' }); setStep(2); setIsLoginView(false); }}
                            className="bg-gray-800 border border-gray-700 text-white hover:bg-gray-700 font-bold text-lg px-8 py-4 rounded-full transform hover:-translate-y-1 transition-all cursor-pointer w-full sm:w-auto"
                        >
                            Earn as a Freelancer
                        </ScrollLink>
                    </div>
                </div>
                
                {/* Social Proof Bar */}
                <div className="mt-auto relative z-10 bg-black/50 border-y border-gray-800 py-5 overflow-hidden flex whitespace-nowrap">
                    <style>{`
                        @keyframes marquee-scroll {
                            0% { transform: translateX(0); }
                            100% { transform: translateX(-50%); }
                        }
                        .animate-marquee {
                            animation: marquee-scroll 25s linear infinite;
                        }
                        .animate-marquee:hover {
                            animation-play-state: paused;
                        }
                    `}</style>
                    <div className="animate-marquee flex gap-12 sm:gap-24 text-gray-500 font-semibold uppercase tracking-widest text-xs sm:text-sm min-w-max px-6">
                        {/* Generate seamless loop items dynamically */}
                        {Array(6).fill([
                            { text: 'Trusted by 10,000+ Startups', icon: '✔', color: 'text-green-500' },
                            { text: 'Secure Payments via Stripe', icon: '🔒', color: 'text-blue-500' },
                            { text: '24/7 Quality Support', icon: '⚡', color: 'text-purple-500' }
                        ]).flat().map((item, idx) => (
                            <span key={idx} className="flex items-center gap-2"><span className={item.color}>{item.icon}</span> {item.text}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- "How It Works" Section --- */}
            <Section id="about" title="How It Works" bg="bg-neutral-50">
                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 text-center group">
                        <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform group-hover:bg-blue-100 shadow-sm">
                            <span className="text-4xl">📝</span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-4">1. Post a Job</h3>
                        <p className="text-gray-600 leading-relaxed font-medium">Tell us what you need done in seconds. It's free and easy to post your project details.</p>
                    </div>
                    <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 text-center group">
                        <div className="w-20 h-20 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform group-hover:bg-purple-100 shadow-sm">
                            <span className="text-4xl">🤝</span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-4">2. Get Bids</h3>
                        <p className="text-gray-600 leading-relaxed font-medium">Receive custom proposals from top-rated local professionals within minutes.</p>
                    </div>
                    <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 text-center group">
                        <div className="w-20 h-20 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform group-hover:bg-green-100 shadow-sm">
                            <span className="text-4xl">💳</span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-4">3. Pay Safely</h3>
                        <p className="text-gray-600 leading-relaxed font-medium">Your money is held securely by Stripe until you approve the completed work.</p>
                    </div>
                </div>
            </Section>

            {/* --- "Categories" Section --- */}
            <Section id="services" title="Explore Popular Categories" bg="bg-white">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto">
                    {[
                        { name: 'Web Development', icon: '💻', color: 'bg-blue-100 text-blue-600' },
                        { name: 'UI/UX Design', icon: '🎨', color: 'bg-pink-100 text-pink-600' },
                        { name: 'Digital Marketing', icon: '📈', color: 'bg-green-100 text-green-600' },
                        { name: 'Video Editing', icon: '🎬', color: 'bg-purple-100 text-purple-600' },
                        { name: 'Content Writing', icon: '✍️', color: 'bg-yellow-100 text-yellow-600' },
                        { name: 'App Development', icon: '📱', color: 'bg-indigo-100 text-indigo-600' },
                        { name: 'Virtual Assistant', icon: '💼', color: 'bg-teal-100 text-teal-600' },
                        { name: 'Data Analysis', icon: '📊', color: 'bg-orange-100 text-orange-600' }
                    ].map((cat, idx) => (
                        <div key={idx} className="bg-gray-50 border border-gray-100 p-6 rounded-3xl text-center hover:bg-white hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer group">
                            <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-sm group-hover:scale-110 transition-transform ${cat.color}`}>
                                {cat.icon}
                            </div>
                            <h3 className="text-base md:text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{cat.name}</h3>
                        </div>
                    ))}
                </div>
                <div className="text-center mt-12">
                    <ScrollLink
                        to="login-register"
                        smooth={true} duration={500} offset={-70}
                        className="inline-flex items-center gap-2 text-blue-600 font-bold hover:text-blue-800 transition-colors cursor-pointer text-lg group"
                    >
                        Browse all categories <span className="transform group-hover:translate-x-1 transition-transform">&rarr;</span>
                    </ScrollLink>
                </div>
            </Section>

            {/* --- "Projects" Section --- */}
            <Section id="projects" title="Featured Open Projects" bg="bg-gray-50">
                <FeaturedProjects />
            </Section>
            
            {/* --- "Contact" Section --- */}
            <Section id="contact" title="" bg="bg-white">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl font-bold text-center mb-6 text-neutral-800">Have Questions?</h2>
                    <p className="text-xl text-gray-600 mb-8">
                        Our team is ready to help you with any inquiries, from technical support to enterprise solutions.
                    </p>
                    <Link 
                        to="/contact-us"
                        className="inline-block bg-blue-600 text-white font-bold text-lg px-10 py-4 rounded-full shadow-lg hover:bg-blue-700 transform hover:-translate-y-1 transition-all"
                    >
                        Get In Touch
                    </Link>
                </div>
            </Section>

            {/* --- BOTTOM CTA BANNER --- */}
            <section className="py-24 bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-center text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-400 via-transparent to-transparent blur-2xl pointer-events-none"></div>
                <div className="relative z-10 max-w-4xl mx-auto px-4">
                    <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">Ready to scale your success?</h2>
                    <p className="text-xl text-blue-100 mb-10 font-medium">Join thousands of businesses and professionals already using GigConnect to grow.</p>
                    <ScrollLink to="login-register" smooth={true} duration={500} offset={-70} className="inline-block bg-white text-blue-900 font-extrabold text-xl px-12 py-5 rounded-full shadow-2xl hover:scale-105 transition-transform cursor-pointer">
                        Join GigConnect Today
                    </ScrollLink>
                </div>
            </section>

            {/* --- "Login/Register" Section --- */}
            <section id="login-register" className="min-h-screen flex flex-col justify-center bg-slate-50 py-24 px-4">
                <div className="max-w-[28rem] w-full mx-auto">
                    <div className="bg-white p-8 md:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                        
                        {show2FAPrompt ? (
                            <>
                                {/* --- 2FA Form --- */}
                                <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-4 tracking-tight">Enter Security Code</h2>
                                <p className="text-center text-gray-600 mb-6">A 6-digit code was sent to your email.</p>
                                {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center">{error}</p>}
                                <form onSubmit={handle2FASubmit} className="space-y-5">
                                    <div>
                                        <label htmlFor="2fa-code" className="block text-sm font-medium text-gray-700 mb-1">Verification Code <span className="text-red-500">*</span></label>
                                        <input id="2fa-code" type="text" value={twoFaCode} onChange={(e) => setTwoFaCode(e.target.value)} required className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white text-center text-xl tracking-widest font-bold" placeholder="• • • • • •" />
                                    </div>
                                    <button type="submit" className="w-full bg-blue-600 text-white p-4 rounded-xl hover:bg-blue-700 transition-all hover:-translate-y-1 font-bold shadow-md text-lg">Verify & Login</button>
                                </form>
                            </>
                        ) : (
                            <>
                                {/* --- Login/Register Form --- */}
                                <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-8 tracking-tight">{isLoginView ? 'Welcome Back' : 'Create an Account'}</h2>
                                
                                {/* Step Indicator (Only for Register) */}
                                {!isLoginView && (
                                    <div className="mb-6">
                                        <div className="flex justify-between text-sm font-medium text-gray-500 mb-2">
                                            <span className={step === 1 ? 'text-blue-600 font-bold' : 'text-gray-400'}>1. Choose Role</span>
                                            <span className={step === 2 ? 'text-blue-600 font-bold' : 'text-gray-400'}>2. Account Details</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div className={`bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300 ${step === 1 ? 'w-1/2' : 'w-full'}`}></div>
                                        </div>
                                    </div>
                                )}

                                {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center">{error}</p>}
                                
                                <form onSubmit={isLoginView ? handleLoginSubmit : handleRegisterSubmit} className="space-y-5">
                                    {/* === LOGIN VIEW === */}
                                    {isLoginView && (
                                        <div className="space-y-5 animate-fade-in">
                                            <div>
                                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                                    Email or Username <span className="text-red-500">*</span>
                                                </label>
                                                <input id="email" type="text" name="email" value={formData.email} onChange={onChange} placeholder="yourusername or you@example.com" required className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white" />
                                            </div>
                                            <div>
                                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
                                                <div className="relative">
                                                    <input id="password" type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={onChange} required className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white pr-10" placeholder="••••••••" />
                                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center px-3" aria-label="Toggle password visibility">
                                                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                                    </button>
                                                </div>
                                                <div className="text-right mt-2">
                                                    <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800 font-semibold transition-colors">
                                                        Forgot Password?
                                                    </Link>
                                                </div>
                                            </div>
                                            <button type="submit" className="w-full bg-blue-600 text-white p-4 rounded-xl hover:bg-blue-700 transition-all hover:-translate-y-1 font-bold shadow-md text-lg mt-2">
                                                Login
                                            </button>
                                        </div>
                                    )}

                                    {/* === REGISTER VIEW: STEP 1 === */}
                                    {!isLoginView && step === 1 && (
                                        <div className="space-y-6 animate-fade-in">
                                            <p className="text-center text-gray-600 mb-2 font-medium">How do you want to use GigConnect?</p>
                                            <div className="grid grid-cols-1 gap-4">
                                                <button type="button" onClick={() => { setFormData({ ...formData, role: 'Client' }); setStep(2); }} className="w-full bg-white border-2 border-gray-200 p-6 rounded-2xl text-left hover:border-blue-500 hover:shadow-md transition-all group focus:outline-none">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shrink-0 shadow-sm">🏢</div>
                                                        <div>
                                                            <h3 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-blue-700 transition-colors">I want to Hire</h3>
                                                            <p className="text-sm text-gray-500">Post gigs and hire top local talent.</p>
                                                        </div>
                                                    </div>
                                                </button>
                                                <button type="button" onClick={() => { setFormData({ ...formData, role: 'Freelancer' }); setStep(2); }} className="w-full bg-white border-2 border-gray-200 p-6 rounded-2xl text-left hover:border-purple-500 hover:shadow-md transition-all group focus:outline-none">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shrink-0 shadow-sm">💻</div>
                                                        <div>
                                                            <h3 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-purple-700 transition-colors">I want to Work</h3>
                                                            <p className="text-sm text-gray-500">Create a profile and find freelance jobs.</p>
                                                        </div>
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* === REGISTER VIEW: STEP 2 === */}
                                    {!isLoginView && step === 2 && (
                                        <div className="space-y-5 animate-fade-in">
                                            <button type="button" onClick={handlePrevStep} className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1 mb-2 font-medium">
                                                &larr; Back to roles
                                            </button>

                                            {/* Client Toggle: Personal vs Business */}
                                            {formData.role === 'Client' && (
                                                <div className="flex bg-gray-100 p-1.5 rounded-xl mb-6 shadow-inner">
                                                    <button type="button" onClick={() => setClientType('personal')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${clientType === 'personal' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Personal Project</button>
                                                    <button type="button" onClick={() => setClientType('business')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${clientType === 'business' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Business / Company</button>
                                                </div>
                                            )}

                                            {/* Common Fields */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                                                    <input id="name" type="text" name="name" value={formData.name} onChange={onChange} required placeholder="John Doe" className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white" />
                                                </div>
                                                <div>
                                                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username <span className="text-red-500">*</span></label>
                                                    <input id="username" type="text" name="username" value={formData.username} onChange={onChange} required placeholder="johndoe123" className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white" />
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address <span className="text-red-500">*</span></label>
                                                <input id="email" type="email" name="email" value={formData.email} onChange={onChange} required placeholder="you@example.com" className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white" />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
                                                    <div className="relative">
                                                        <input id="password" type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={onChange} required minLength="6" placeholder="••••••••" className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white pr-10" />
                                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center px-4">
                                                            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password <span className="text-red-500">*</span></label>
                                                    <div className="relative">
                                                        <input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={onChange} required minLength="6" placeholder="••••••••" className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white pr-10" />
                                                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 flex items-center px-4">
                                                            {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Role Specific Fields */}
                                            {formData.role === 'Client' && clientType === 'business' && (
                                                <div>
                                                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">Company Name <span className="text-red-500">*</span></label>
                                                    <input id="companyName" type="text" name="companyName" value={formData.companyName} onChange={onChange} required placeholder="Your Company, Inc." className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white" />
                                                </div>
                                            )}

                                            {formData.role === 'Freelancer' && (
                                                <>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label htmlFor="headline" className="block text-sm font-medium text-gray-700 mb-1">Professional Headline <span className="text-red-500">*</span></label>
                                                            <input id="headline" type="text" name="headline" value={formData.headline} onChange={onChange} placeholder="e.g. Senior Designer" required className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white" />
                                                        </div>
                                                        <div>
                                                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
                                                            <input id="phone" type="tel" name="phone" value={formData.phone} onChange={onChange} required placeholder="+1 234 567 8900" className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white" />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <div>
                                                            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">Country <span className="text-red-500">*</span></label>
                                                            <div className="relative">
                                                                <select id="country" name="country" value={formData.country} onChange={onChange} required className="appearance-none w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white text-gray-800">
                                                                    <option value="">Select</option>
                                                                    {countries.map(country => <option key={country.isoCode} value={country.isoCode}>{country.name}</option>)}
                                                                </select>
                                                                <ChevronDownIcon />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
                                                            <div className="relative">
                                                                <select id="state" name="state" value={formData.state} onChange={onChange} required disabled={!formData.country} className="appearance-none w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white text-gray-800 disabled:bg-gray-100 disabled:cursor-not-allowed">
                                                                    <option value="">Select</option>
                                                                    {states.map(state => <option key={state.isoCode} value={state.isoCode}>{state.name}</option>)}
                                                                </select>
                                                                <ChevronDownIcon />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
                                                            <div className="relative">
                                                                <select id="city" name="city" value={formData.city} onChange={onChange} required disabled={!formData.state} className="appearance-none w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white text-gray-800 disabled:bg-gray-100 disabled:cursor-not-allowed">
                                                                    <option value="">Select</option>
                                                                    {cities.map(city => <option key={city.name} value={city.name}>{city.name}</option>)}
                                                                </select>
                                                                <ChevronDownIcon />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-1">Date of Birth <span className="text-red-500">*</span></label>
                                                        <input id="dob" type="date" name="dob" value={formData.dob} onChange={onChange} required className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white" />
                                                    </div>
                                                </>
                                            )}
                                            
                                            <button type="submit" className="w-full bg-blue-600 text-white p-4 rounded-xl hover:bg-blue-700 transition-all hover:-translate-y-1 font-bold shadow-md text-lg mt-6">
                                                Create Account
                                            </button>
                                        </div>
                                    )}
                                </form>
                                
                                <div className="text-center mt-8 pt-6 border-t border-gray-100">
                                    <button onClick={() => { setIsLoginView(!isLoginView); setError(''); setStep(1); }} className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                                        {isLoginView ? "Don't have an account? Register" : 'Already have an account? Login'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* --- Premium Footer --- */}
            <footer className="bg-gray-900 text-gray-400 py-12 text-center border-t border-gray-800">
                <div className="max-w-6xl mx-auto px-4">
                    <h2 className="text-2xl font-extrabold text-white mb-4 tracking-widest uppercase">GigConnect</h2>
                    <p className="mb-6 font-medium">The premier hyperlocal freelance marketplace.</p>
                    <div className="flex justify-center gap-6 mb-8 text-sm font-semibold">
                        <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                        <Link to="/help" className="hover:text-white transition-colors">Help Center</Link>
                    </div>
                    <p className="text-xs opacity-50">&copy; {new Date().getFullYear()} GigConnect. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}

export default HomePage;