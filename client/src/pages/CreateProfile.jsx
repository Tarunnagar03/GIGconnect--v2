import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

// Helper for textarea inputs
const ProfileTextArea = ({ name, label, value, onChange, placeholder }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <textarea
            id={name}
            name={name}
            rows="4"
            value={value}
            onChange={onChange}
            className="w-full p-3 border rounded-md"
            placeholder={placeholder}
        ></textarea>
        <p className="text-xs text-gray-500 mt-1">Please use commas to separate items (e.g., Item 1, Item 2)</p>
    </div>
);

const CreateProfile = () => {
    const [formData, setFormData] = useState({
        skills: '', rate: '', bio: '', portfolio: '',
        services: '', education: '', achievements: '' // Added new fields
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);
    const navigate = useNavigate();
    const { refreshProfile } = useContext(AuthContext);

    // Fetch existing profile data
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/profiles/me');
                if (res.data) {
                    setFormData({
                        skills: res.data.skills.join(', '),
                        rate: res.data.rate || '',
                        bio: res.data.bio || '',
                        portfolio: res.data.portfolio || '',
                        // --- Pre-fill new fields ---
                        services: (res.data.services || []).join(', '),
                        education: (res.data.education || []).join(', '),
                        achievements: (res.data.achievements || []).join(', ')
                    });
                    setIsEditMode(true);
                }
            } catch (err) {
                console.log("No existing profile found, creating a new one.");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const { skills, rate, bio, portfolio, services, education, achievements } = formData;
    const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            // Send all fields, including new ones
            await api.post('/profiles', formData);
            refreshProfile();
            alert(isEditMode ? 'Profile updated successfully!' : 'Profile created successfully!');
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to save profile.');
        }
    };

    const handleDeleteProfile = async () => {
        const isConfirmed = window.confirm(
            'Are you sure you want to delete your freelancer profile? Your user account will remain active.'
        );
        if (isConfirmed) {
            try {
                await api.delete('/profiles'); 
                alert('Your freelancer profile has been deleted.');
                refreshProfile();
                navigate('/dashboard');
            } catch (err) {
                setError('Failed to delete profile. Please try again.');
                console.error(err);
            }
        }
    };

    if (loading) {
        return <p className="text-center mt-10">Loading profile...</p>;
    }

    return (
        <div className="max-w-2xl mx-auto">
            <Link to="/dashboard" className="inline-block mb-6 text-blue-600 hover:underline">
                &larr; Back to Dashboard
            </Link>
            
            <h1 className="text-3xl font-bold mb-6">
                {isEditMode ? 'Edit Your Freelancer Profile' : 'Create Your Freelancer Profile'}
            </h1>
            <p className="text-gray-600 mb-6">This is your public-facing profile. Clients will see this when you apply for gigs.</p>
            
            <form onSubmit={onSubmit} className="bg-white p-8 rounded-lg shadow-md space-y-6">
                {error && <p className="text-red-500 bg-red-100 p-3 rounded text-center font-medium">{error}</p>}
                
                <div>
                    <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-1">Skills <span className="text-red-500">*</span></label>
                    <input type="text" id="skills" name="skills" value={skills} onChange={onChange} required className="w-full p-3 border rounded-md" placeholder="e.g., React.js, C# Framework, .NET Developer"/>
                    <p className="text-xs text-gray-500 mt-1">Please use comma-separated values (e.g., HTML, CSS, JavaScript)</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="rate" className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate ($)</label>
                        <input type="number" id="rate" name="rate" value={rate} onChange={onChange} min="0" className="w-full p-3 border rounded-md" placeholder="e.g., 50"/>
                    </div>
                    <div>
                        <label htmlFor="portfolio" className="block text-sm font-medium text-gray-700 mb-1">Portfolio/Website <span className="text-gray-400">(Optional)</span></label>
                        <input type="text" id="portfolio" name="portfolio" value={portfolio} onChange={onChange} className="w-full p-3 border rounded-md" placeholder="https://yourwebsite.com"/>
                    </div>
                </div>

                <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">About You (Bio)</label>
                    <textarea id="bio" name="bio" rows="5" value={bio} onChange={onChange} className="w-full p-3 border rounded-md" placeholder="Tell clients a bit about your experience..."></textarea>
                </div>

                {/* --- NEW FIELDS ADDED --- */}
                <ProfileTextArea name="services" label="Services You Offer" value={services} onChange={onChange} placeholder="e.g., Web Development, UI/UX Design" />
                <ProfileTextArea name="education" label="Education" value={education} onChange={onChange} placeholder="e.g., BCA from IIMS Anuyogipuram Meerut, MCA from Dewan Institute Partapur Meerut" />
                <ProfileTextArea name="achievements" label="Achievements" value={achievements} onChange={onChange} placeholder="e.g., Certified AWS Developer, 100+ Projects Completed" />

                <div className="flex justify-end gap-4 border-t pt-6">
                    <button type="button" onClick={() => navigate('/dashboard')} className="bg-white text-gray-700 py-2 px-6 rounded-lg border border-gray-300 hover:bg-gray-50 font-medium">
                        Cancel
                    </button>
                    <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700">
                        Save Profile
                    </button>
                </div>
            </form>

            {isEditMode && (
                <div className="mt-8 bg-white p-6 rounded-lg shadow-md border-2 border-red-500">
                    <h3 className="text-xl font-bold text-red-700 mb-3">Delete Profile</h3>
                    <p className="text-gray-600 mb-4">This will remove your public freelancer profile (skills, bio, etc.). Your user account and login will not be affected.</p>
                    <button onClick={handleDeleteProfile} className="bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700">
                        Delete My Profile
                    </button>
                </div>
            )}
        </div>
    );
};

export default CreateProfile;