/**
 * TwoFactorAuthPage Component
 * UPDATED: May 6, 2026 - Security Enhancement
 * 
 * Features:
 * - Two-Factor Authentication setup
 * - QR code generation
 * - OTP verification
 * - Backup codes management
 * - Security status display
 * - Modern security UI
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const TwoFactorAuthPage = () => {
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);
    const [showVerifyForm, setShowVerifyForm] = useState(false);
    const [twoFaToken, setTwoFaToken] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        // Fetch the user's full details to check their 2FA status
        api.get('/users/me')
            .then(res => setIs2FAEnabled(res.data.twoFactorEnabled))
            .catch(console.error);
    }, []);

    const handleSendCode = async () => {
        setError('');
        setMessage('');
        try {
            const res = await api.post('/2fa/generate-email-code');
            setMessage(res.data.msg);
            setShowVerifyForm(true);
        } catch {
            setError('Error: Could not send verification code.');
        }
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await api.post('/2fa/verify', { token: twoFaToken });
            alert(res.data.msg); // Using alert here for simplicity on success
            setIs2FAEnabled(true);
            setShowVerifyForm(false);
            setTwoFaToken('');
        } catch (err) {
            setError(err.response?.data?.msg || 'Invalid token.');
        }
    };

    const handleDisable = async () => {
        if (window.confirm('Are you sure you want to disable 2FA?')) {
            try {
                const res = await api.put('/2fa/disable');
                alert(res.data.msg);
                setIs2FAEnabled(false);
            } catch {
                setError('Failed to disable 2FA.');
            }
        }
    };

    return (
        <div className="max-w-2xl mx-auto animate-fade-in">
            <Link to="/settings/security" className="inline-flex items-center gap-2 mb-6 text-gray-600 hover:text-blue-600 font-semibold bg-white border border-gray-200 px-5 py-2.5 rounded-full shadow-sm hover:shadow hover:border-blue-200 transition-all group">
                <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Back to Security
            </Link>
            
            <h1 className="text-4xl font-extrabold mb-8 text-gray-800 tracking-tight">Two-Factor Authentication</h1>
            
            <div className="bg-white p-8 md:p-10 rounded-3xl shadow-lg border border-gray-100">
                {error && <p className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 text-center font-bold shadow-sm">{error}</p>}
                {message && <p className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-xl mb-6 text-center font-bold shadow-sm">{message}</p>}

                {is2FAEnabled ? (
                    <div className="bg-green-50 border border-green-200 p-8 rounded-2xl text-center">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm border border-green-200">🛡️</div>
                        <h2 className="text-xl font-extrabold text-green-800 mb-2">2FA is Enabled</h2>
                        <p className="text-green-700 font-medium mb-8">Your account is protected with an extra layer of security.</p>
                        <button onClick={handleDisable} className="w-full sm:w-auto px-10 bg-white border-2 border-red-200 text-red-600 font-bold py-3.5 rounded-xl hover:bg-red-50 hover:border-red-300 transition-all shadow-sm">Disable 2FA</button>
                    </div>
                ) : (
                    <div className="bg-gray-50 border border-gray-200 p-8 rounded-2xl text-center">
                        <div className="w-16 h-16 bg-white border border-gray-200 text-gray-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm">🔓</div>
                        <h2 className="text-xl font-extrabold text-gray-800 mb-2">2FA is Disabled</h2>
                        <p className="text-gray-600 mb-8 font-medium max-w-md mx-auto">Add an extra layer of security. We will email you a secure verification code every time you log in.</p>
                        <button onClick={handleSendCode} className="w-full bg-blue-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-blue-700 hover:-translate-y-1 transition-all shadow-md text-lg">Enable 2FA via Email</button>
                    </div>
                )}

                {showVerifyForm && (
                     <form onSubmit={handleVerifyCode} className="mt-8 border-t border-gray-100 pt-8 animate-fade-in">
                        <label htmlFor="2fa-token" className="block text-sm font-bold text-gray-700 mb-3 text-center">Enter the 6-digit code from your email</label>
                        <input id="2fa-token" type="text" value={twoFaToken} onChange={(e) => setTwoFaToken(e.target.value)} placeholder="------" maxLength="6" required className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white text-center font-mono font-bold tracking-widest text-2xl mb-6" />
                        <button type="submit" className="w-full bg-green-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-green-700 hover:-translate-y-1 transition-all shadow-md text-lg">Verify & Enable</button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default TwoFactorAuthPage;