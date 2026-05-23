import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import api from '../api';

const ResetPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const email = searchParams.get('email');

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
        <div className="min-h-[80vh] flex flex-col justify-center items-center p-4 animate-fade-in">
            <div className="max-w-md w-full mx-auto relative z-10">
                <Link to="/" className="text-4xl font-black tracking-tight text-center text-blue-600 mb-8 block">GigConnect</Link>
                <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-gray-100">
                    <h2 className="text-2xl font-extrabold text-center text-gray-800 mb-2">Set New Password</h2>
                    <p className="text-center text-sm text-gray-500 mb-8 font-medium">Enter the 6-digit code sent to your email.</p>
                    
                    {error && <p className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 text-center font-bold text-sm shadow-sm">{error}</p>}
                    {success && <p className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl mb-6 text-center font-bold text-sm shadow-sm">{success}</p>}

                    {!success && (
                        <form onSubmit={handleSubmit} className="space-y-5">
                             <div>
                                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">6-Digit Code <span className="text-red-500">*</span></label>
                                <input 
                                    id="code" type="text" name="code"
                                    value={code} onChange={onChange} required 
                                    className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white text-center font-mono font-bold tracking-widest text-lg" placeholder="------" maxLength="6"
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">New Password <span className="text-red-500">*</span></label>
                                <input 
                                    id="password" type="password" name="password"
                                    value={password} onChange={onChange} required 
                                    className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white" placeholder="••••••••" minLength="6"
                                />
                            </div>
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password <span className="text-red-500">*</span></label>
                                <input 
                                    id="confirmPassword" type="password" name="confirmPassword"
                                    value={confirmPassword} onChange={onChange} required 
                                    className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white" placeholder="••••••••" minLength="6"
                                />
                            </div>
                            <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white p-4 rounded-xl hover:bg-blue-700 hover:-translate-y-1 transition-all shadow-md font-bold disabled:bg-gray-400 disabled:transform-none mt-2">
                                {isSubmitting ? <span className="flex items-center justify-center gap-2"><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span> Saving...</span> : 'Save New Password'}
                            </button>
                        </form>
                    )}
                </div>
                <div className="text-center mt-6">
                    <Link to="/" className="text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors">Return to Login</Link>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;