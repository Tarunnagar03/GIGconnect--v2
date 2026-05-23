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
        <div className="min-h-[80vh] flex flex-col justify-center items-center p-4 animate-fade-in">
            <div className="max-w-md w-full mx-auto relative z-10">
                <Link to="/" className="text-4xl font-black tracking-tight text-center text-blue-600 mb-8 block">GigConnect</Link>
                <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-gray-100">
                    <h2 className="text-2xl font-extrabold text-center text-gray-800 mb-2">Reset Password</h2>
                    <p className="text-center text-sm text-gray-500 mb-8 font-medium">Enter your email and we'll send you a 6-digit code.</p>
                    
                    {error && <p className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 text-center font-bold text-sm shadow-sm">{error}</p>}
                    {message && <p className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl mb-6 text-center font-bold text-sm shadow-sm">{message}</p>}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address <span className="text-red-500">*</span></label>
                            <input 
                                id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} 
                                required className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white" placeholder="you@example.com"
                            />
                        </div>
                        <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white p-4 rounded-xl hover:bg-blue-700 hover:-translate-y-1 transition-all shadow-md font-bold disabled:bg-gray-400 disabled:transform-none mt-2">
                            {isSubmitting ? <span className="flex items-center justify-center gap-2"><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span> Sending...</span> : 'Send Reset Code'}
                        </button>
                    </form>
                    <div className="text-center mt-6">
                        <Link to="/" className="text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors">Return to Login</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;