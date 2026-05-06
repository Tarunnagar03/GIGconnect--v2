/**
 * UpdateDetailsPage Component
 * UPDATED: May 6, 2026 - Profile Management Enhancement
 * 
 * Features:
 * - Update user profile information
 * - Email and password management
 * - Personal details editing
 * - Form validation
 * - Success/error notifications
 * - Modern profile UI
 */

import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import { Country, State, City } from 'country-state-city';

// --- (Icon components) ---
const ChevronDownIcon = () => ( <svg className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg> );

const UpdateDetailsPage = () => {
    const { auth, login } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        name: '', email: '', username: '', dob: '',
        country: '', state: '', city: '', phone: '',
        companyName: '', headline: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // --- State for location dropdowns ---
    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);

    // --- 1. Fetch all user data to pre-fill the form ---
    useEffect(() => {
        setCountries(Country.getAllCountries());
        api.get('/users/me')
            .then(res => {
                const user = res.data;
                setFormData({
                    name: user.name || '',
                    email: user.email || '',
                    username: user.username || '',
                    dob: user.dob ? user.dob.split('T')[0] : '', // Format date for input
                    country: user.country || '',
                    state: user.state || '',
                    city: user.city || '',
                    phone: user.phone || '',
                    companyName: user.companyName || '',
                    headline: user.headline || ''
                });
            })
            .catch(() => {
                setError('Could not fetch user details.');
            })
            .finally(() => setLoading(false));
    }, []);

    // --- 2. Load states when country changes ---
    useEffect(() => {
        if (formData.country) {
            const countryInfo = Country.getCountryByCode(formData.country);
            setStates(State.getStatesOfCountry(countryInfo.isoCode));
        } else {
            setStates([]);
        }
    }, [formData.country]);

    // --- 3. Load cities when state changes ---
    useEffect(() => {
        if (formData.country && formData.state) {
            // Need to get stateInfo to find isoCode for city fetching
            const countryInfo = Country.getCountryByCode(formData.country);
            const stateInfo = State.getStatesOfCountry(countryInfo.isoCode).find(s => s.isoCode === formData.state);
            if (stateInfo) {
                setCities(City.getCitiesOfState(formData.country, stateInfo.isoCode));
            }
        } else {
            setCities([]);
        }
    }, [formData.country, formData.state]);


    const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            const res = await api.put('/users/update-details', formData);
            login(res.data.token); // Update the token in context
            setSuccess('Details updated successfully!');
            setTimeout(() => navigate('/settings'), 2000);
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to update details.');
        }
    };

    if (loading) {
        return <p>Loading details...</p>;
    }

    return (
        <div className="max-w-2xl mx-auto">
            <Link to="/settings" className="inline-block mb-6 text-blue-600 hover:underline">
                &larr; Back to Settings
            </Link>
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Personal Details</h1>
            <form onSubmit={onSubmit} className="bg-white p-8 rounded-lg shadow-md space-y-6">
                {error && <p className="text-red-500 bg-red-100 p-3 rounded text-center">{error}</p>}
                {success && <p className="text-green-600 bg-green-100 p-3 rounded text-center">{success}</p>}
                
                {/* --- Role-specific fields --- */}
                {auth.user.role === 'Client' && (
                    <div>
                        <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">Company Name <span className="text-gray-400">(Optional)</span></label>
                        <input id="companyName" type="text" name="companyName" value={formData.companyName} onChange={onChange} className="w-full p-3 border rounded-md" />
                    </div>
                )}
                {auth.user.role === 'Freelancer' && (
                    <div>
                        <label htmlFor="headline" className="block text-sm font-medium text-gray-700 mb-1">Professional Headline <span className="text-red-500">*</span></label>
                        <input id="headline" type="text" name="headline" value={formData.headline} onChange={onChange} required className="w-full p-3 border rounded-md" />
                    </div>
                )}

                {/* --- Standard fields --- */}
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={onChange} required className="w-full p-3 border rounded-md" />
                </div>
                <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username <span className="text-red-500">*</span></label>
                    <input type="text" id="username" name="username" value={formData.username} onChange={onChange} required className="w-full p-3 border rounded-md" />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address <span className="text-red-500">*</span></label>
                    <input type="email" id="email" name="email" value={formData.email} onChange={onChange} required className="w-full p-3 border rounded-md" />
                </div>
                
                {/* --- Location fields --- */}
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
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-1">Date of Birth <span className="text-red-500">*</span></label>
                        <input id="dob" type="date" name="dob" value={formData.dob} onChange={onChange} required className="w-full p-3 border rounded-md text-gray-500" />
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-gray-400">(Optional)</span></label>
                        <input id="phone" type="tel" name="phone" value={formData.phone} onChange={onChange} className="w-full p-3 border rounded-md" />
                    </div>
                </div>
                
                <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700">
                    Save Changes
                </button>
            </form>
        </div>
    );
};

export default UpdateDetailsPage;