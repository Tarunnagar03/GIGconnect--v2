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

// --- This is a helper component for the placeholder sections ---
const Section = ({ id, title, children, bg = 'bg-white' }) => (
    <section id={id} className={`min-h-screen flex flex-col justify-center py-20 px-4 ${bg}`}>
        <div className="container mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">{title}</h2>
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
        <form onSubmit={onContactSubmit} className="max-w-xl mx-auto bg-white p-8 rounded-lg shadow-md space-y-4">
            {contactSuccess && <p className="text-green-600 bg-green-100 p-3 rounded text-center font-medium">{contactSuccess}</p>}
            {contactError && <p className="text-red-500 bg-red-100 p-3 rounded text-center font-medium">{contactError}</p>}
            <div>
                <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-1">Your Name <span className="text-red-500">*</span></label>
                <input type="text" name="name" id="contact-name" value={contactData.name} onChange={onContactChange} required className="w-full p-3 border rounded-md" />
            </div>
            <div>
                <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-1">Your Email <span className="text-red-500">*</span></label>
                <input type="email" name="email" id="contact-email" value={contactData.email} onChange={onContactChange} required className="w-full p-3 border rounded-md" />
            </div>
            <div>
                <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 mb-1">Message <span className="text-gray-400">(Optional)</span></label>
                <textarea name="message" id="contact-message" rows="5" value={contactData.message} onChange={onContactChange} className="w-full p-3 border rounded-md"></textarea>
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
                {isSubmitting ? 'Sending...' : 'Send Message'}
            </button>
        </form>
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

    if (loading) return <p className="text-center text-gray-500">Loading projects...</p>;
    if (gigs.length === 0) return <p className="text-center text-gray-500">No projects available right now.</p>;

    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {gigs.map(gig => (
                <div key={gig._id} className="bg-white p-4 rounded-lg shadow-md h-full flex flex-col border">
                    <h3 className="text-lg font-bold mb-2 text-blue-700">{gig.title}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-3 flex-grow">{gig.description}</p>
                    <div className="flex justify-between items-center mt-auto pt-2 border-t">
                        <span className="font-semibold text-green-600">${gig.budget}</span>
                        <ScrollLink 
                            to="login-register" 
                            smooth={true} 
                            duration={500} 
                            offset={-70}
                            className="bg-gray-200 text-gray-800 font-bold py-1 px-3 text-sm rounded hover:bg-gray-300 cursor-pointer"
                        >
                            Apply
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
        <div className="bg-gray-50">
            <LandingNavbar />

            {/* --- "Home" Section --- */}
            <section id="home" className="h-screen flex items-center justify-center bg-white text-gray-800 text-center p-4">
                <div>
                    <h2 className="text-5xl font-bold mb-4">Welcome to GigConnect</h2>
                    <p className="text-xl mb-8 text-gray-600">Your local marketplace for freelance talent.</p>
                    <ScrollLink 
                        to="login-register" 
                        smooth={true} 
                        duration={500}
                        offset={-70}
                        className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                        Get Started
                    </ScrollLink>
                </div>
            </section>

            {/* --- "About" Section --- */}
            <Section id="about" title="About Us" bg="bg-gray-50">
                <p className="max-w-3xl mx-auto text-center text-lg text-gray-700">
                    GigConnect is a hyperlocal freelance marketplace designed to connect talented local professionals with businesses right in their neighborhood. We believe in building stronger communities by making it easy to find and hire talent nearby.
                </p>
            </Section>

            {/* --- "Services" Section --- */}
            <Section id="services" title="Our Services" bg="bg-white">
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    <div className="bg-white p-6 rounded-lg shadow-md border">
                        <h3 className="text-2xl font-bold mb-3 text-blue-600">For Clients</h3>
                        <p className="text-gray-700">Easily post a gig, receive bids from local freelancers, manage your projects, and handle payments securely, all in one place. Find the perfect professional just around the corner.</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md border">
                        <h3 className="text-2xl font-bold mb-3 text-blue-600">For Freelancers</h3>
                        <p className="text-gray-700">Showcase your skills, browse local jobs, submit proposals, and get paid securely. Build your portfolio and grow your freelance business within your own community.</p>
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