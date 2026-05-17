import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsSubmitting(true);
        try {
            const res = await api.post('/auth/forgot-password', { email });
            setMessage(res.data.msg);
            setTimeout(() => {
                navigate(`/reset-password?email=${encodeURIComponent(email)}`);
            }, 2000);
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
                    <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">Reset Password</h2>
                    <p className="text-center text-gray-600 mb-6">Enter your email and we'll send you a 6-digit code.</p>
                    
                    {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center">{error}</p>}
                    {message && <p className="bg-green-100 text-green-700 p-3 rounded mb-4 text-center">{message}</p>}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address <span className="text-red-500">*</span></label>
                            <input 
                                id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} 
                                required className="w-full p-3 border rounded-md" placeholder="you@example.com"
                            />
                        </div>
                        <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 font-bold disabled:bg-gray-400">
                            {isSubmitting ? 'Sending...' : 'Send Reset Code'}
                        </button>
                    </form>
                    <div className="text-center mt-6">
                        <Link to="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 font-semibold bg-gray-50 border border-gray-200 px-4 py-2 rounded-full shadow-sm hover:shadow hover:border-blue-200 transition-all group">
                            <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;