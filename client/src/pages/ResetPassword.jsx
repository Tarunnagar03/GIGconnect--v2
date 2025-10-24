import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../api';

const ResetPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = new URLSearchParams(location.search).get('email');

    const [formData, setFormData] = useState({ code: '', password: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { code, password, confirmPassword } = formData;
    const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password !== confirmPassword) {
            return setError('Passwords do not match.');
        }
        if (!email) {
            return setError('No email address found. Please start over.');
        }

        setIsSubmitting(true);
        try {
            const res = await api.put('/auth/reset-password', { email, code, password });
            setSuccess(res.data.msg);
            setTimeout(() => navigate('/'), 3000);
        } catch (err) {
            setError(err.response?.data?.msg || 'An error occurred.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
            <div className="max-w-md w-full mx-auto">
                <Link to="/" className="text-4xl font-bold text-center text-blue-600 mb-6 block">GigConnect</Link>
                <div className="bg-white p-8 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Set New Password</h2>
                    
                    {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center">{error}</p>}
                    {success && <p className="bg-green-100 text-green-700 p-3 rounded mb-4 text-center">{success}</p>}

                    {!success && (
                        <form onSubmit={handleSubmit} className="space-y-5">
                             <div>
                                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">6-Digit Code <span className="text-red-500">*</span></label>
                                <input 
                                    id="code" type="text" name="code"
                                    value={code} onChange={onChange} required 
                                    className="w-full p-3 border rounded-md" placeholder="Check your email"
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">New Password <span className="text-red-500">*</span></label>
                                <input 
                                    id="password" type="password" name="password"
                                    value={password} onChange={onChange} required 
                                    className="w-full p-3 border rounded-md" placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password <span className="text-red-500">*</span></label>
                                <input 
                                    id="confirmPassword" type="password" name="confirmPassword"
                                    value={confirmPassword} onChange={onChange} required 
                                    className="w-full p-3 border rounded-md" placeholder="••••••••"
                                />
                            </div>
                            <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 font-bold disabled:bg-gray-400">
                                {isSubmitting ? 'Saving...' : 'Save New Password'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;