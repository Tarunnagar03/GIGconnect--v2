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

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { Country, State, City } from 'country-state-city';
import { ChevronDownIcon } from '../components/Icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const UpdateDetailsPage = () => {
    const { auth, refreshProfile } = useAuth(); // Use refreshProfile for consistency
    const [formData, setFormData] = useState({
        name: '', email: '', username: '', dob: '',
        country: '', state: '', city: '', phone: '',
        companyName: '', headline: '',
        profileImage: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    // --- State for location dropdowns ---
    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);

    // Initialize countries once
    useEffect(() => {
        setCountries(Country.getAllCountries());
    }, []);

    // --- 2. Load states when country changes ---
    useEffect(() => {
        if (formData.country) {
            const countryInfo = Country.getCountryByCode(formData.country);
            setStates(countryInfo ? State.getStatesOfCountry(countryInfo.isoCode) : []);
        } else {
            setStates([]);
        }
    }, [formData.country]);

    // --- 3. Load cities when state changes ---
    // Bug Fix: stateInfo was being looked up only by code. Should be `isoCode` for consistency.
    useEffect(() => {
        if (formData.country && formData.state) {
            const countryInfo = Country.getCountryByCode(formData.country);
            const stateInfo = countryInfo ? State.getStatesOfCountry(countryInfo.isoCode).find(s => s.isoCode === formData.state) : null;
            setCities(stateInfo ? City.getCitiesOfState(formData.country, stateInfo.isoCode) : []);
        } else {
            setCities([]);
        }
    }, [formData.country, formData.state]);

    // --- 1. Fetch user data with React Query ---
    const { data: userDetails, isLoading: isUserDetailsLoading, isError: isUserDetailsError } = useQuery({
        queryKey: ['userDetails', auth.user?.id],
        queryFn: async () => (await api.get('/users/me')).data,
        enabled: !!auth.isAuthenticated
    });

    // Populate form data when user details are fetched
    useEffect(() => {
        if (userDetails) {
            let formattedDob = '';
            if (userDetails.dob) {
                try {
                    const dateObj = new Date(userDetails.dob);
                    if (!isNaN(dateObj.getTime())) {
                        formattedDob = dateObj.toISOString().split('T')[0];
                    }
                } catch (e) { /* ignore */ }
            }
            setFormData(prev => ({
                ...prev,
                name: userDetails.name || '',
                email: userDetails.email || '',
                username: userDetails.username || '',
                dob: formattedDob,
                country: userDetails.country || '',
                state: userDetails.state || '',
                city: userDetails.city || '',
                phone: userDetails.phone || '',
                companyName: userDetails.companyName || '',
                headline: userDetails.headline || '',
                profileImage: userDetails.profileImage || '' 
            }));
        }
    }, [userDetails]);

    // Handle initial fetch error
    useEffect(() => {
        if (isUserDetailsError) {
            setError('Could not fetch user details.');
        }
    }, [isUserDetailsError]);

    // Form submission mutation
    const queryClient = useQueryClient();
    const updateDetailsMutation = useMutation({
        mutationFn: async (payload) => (await api.put('/users/update-details', payload)).data,
        onSuccess: () => {
            setSuccess('Details updated successfully!');
            refreshProfile(); // Refresh AuthContext to reflect new user details
            queryClient.invalidateQueries(['userDetails', auth.user?.id]); // Invalidate to refetch if needed
            setTimeout(() => navigate('/settings'), 2000);
        },
        onError: (err) => {
            console.error("Update details error:", err);
            const errData = err.response?.data;
            let errMsg = errData?.msg || errData?.message || (errData?.errors && errData.errors[0]?.msg) || err.message || 'Failed to update details.';
            
            if (typeof errData === 'string' && (errData.includes('11000') || errData.toLowerCase().includes('duplicate'))) {
                errMsg = "Duplicate Error: This Email or Username is already taken by another account.";
            } else if (typeof errData === 'string' && errData.length < 100) {
                errMsg += ` - ${errData}`;
            }

            if (err.response?.status === 500 && !errMsg.includes('Duplicate')) {
                errMsg = `Server Error (500): ${errMsg}`;
            }
            setError(errMsg);
        }
    });

    const onChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            if (name === 'country') { newData.state = ''; newData.city = ''; }
            if (name === 'state') { newData.city = ''; }
            return { ...newData, contactVisibility: userDetails?.contactVisibility || 'Everyone' }; // Keep contactVisibility
        });
    };

    // --- Handle Image selection from Device Gallery ---
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // Max 2MB for base64 image over API
                setError('Image size should be less than 2MB.');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, profileImage: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (updateDetailsMutation.isPending) return; // Prevent double submission

        const payload = { ...formData };
            
        // Remove fields that are not applicable to the user's role
        if (auth.user?.role !== 'Freelancer') delete payload.headline;
        if (auth.user?.role !== 'Client') delete payload.companyName;

        updateDetailsMutation.mutate(payload);
    };

    // Display initial loading or error states
    if (isUserDetailsLoading) {
        return (
            <div className="flex justify-center items-center h-[60vh] w-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (isUserDetailsError && !error) {
        return (
            <div className="flex justify-center items-center h-[60vh] w-full text-red-600 font-bold">
                Failed to load user details. Please try refreshing the page.
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto animate-fade-in">
            <Link to="/settings" className="inline-flex items-center gap-2 mb-6 text-gray-600 hover:text-blue-600 font-semibold bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm hover:shadow hover:border-blue-200 transition-all group">
                <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Back to Settings
            </Link>
            <h1 className="text-4xl font-extrabold mb-8 text-gray-800 tracking-tight">Personal Details</h1>
            <form onSubmit={onSubmit} className="bg-white p-10 rounded-2xl shadow-lg border border-gray-100 space-y-6">
                {error && <p className="text-red-500 bg-red-100 p-3 rounded text-center">{error}</p>}
                {success && <p className="text-green-600 bg-green-100 p-3 rounded text-center">{success}</p>}
                
                {/* --- Profile Image Uploader --- */}
                <div className="flex flex-col items-center mb-8 border-b border-gray-100 pb-8">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                            {formData.profileImage ? (
                                <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-4xl text-gray-400">📷</span>
                            )}
                        </div>
                        <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2.5 rounded-full cursor-pointer shadow-md hover:bg-blue-700 transition-colors transform hover:scale-105">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        </label>
                    </div>
                    <p className="text-sm text-gray-500 mt-4 font-medium">Click the blue icon to upload from gallery</p>
                </div>

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
                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number <span className="text-gray-400">(Optional)</span></label>
                    <input id="phone" type="tel" name="phone" value={formData.phone} onChange={onChange} className="w-full p-3 border rounded-md" />
                </div>

                {/* --- Privacy & Visibility --- */}
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                    <label htmlFor="contactVisibility" className="block text-sm font-bold text-gray-800 mb-2">
                        Who can view your Contact Info (Email & Phone)?
                    </label>
                    <div className="relative">
                        <select id="contactVisibility" name="contactVisibility" value={formData.contactVisibility} onChange={onChange} className="appearance-none w-full p-3 border border-gray-300 rounded-md bg-white text-black font-medium">
                            <option value="Everyone">Everyone (Public)</option>
                            <option value="Connections">Logged-in Users Only</option>
                            <option value="Only Me">Only Me (Private)</option>
                        </select>
                        <ChevronDownIcon />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Adjusting this controls who can see your contact details on your public profile.</p>
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
                        <input id="dob" type="date" name="dob" value={formData.dob} onChange={onChange} required className="w-full p-3 border rounded-md" />
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