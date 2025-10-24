import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

const TwoFactorAuthPage = () => {
    const { auth } = useContext(AuthContext);
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
        } catch (err) {
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
            } catch (err) {
                setError('Failed to disable 2FA.');
            }
        }
    };

    return (
        <div>
            <Link to="/settings/security" className="inline-block mb-6 text-blue-600 hover:underline">&larr; Back to Security</Link>
            <div className="bg-white p-8 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold mb-4">Two-Factor Authentication (2FA)</h1>
                {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</p>}
                {message && <p className="bg-blue-100 text-blue-700 p-3 rounded mb-4">{message}</p>}

                {is2FAEnabled ? (
                    <div>
                        <p className="text-green-600 font-semibold mb-4">2FA is currently enabled on your account.</p>
                        <button onClick={handleDisable} className="w-full bg-red-600 text-white font-bold py-2 px-4 rounded hover:bg-red-700">Disable 2FA</button>
                    </div>
                ) : (
                    <div>
                        <p className="text-gray-600 mb-4">Add an extra layer of security. We will email you a verification code at login.</p>
                        <button onClick={handleSendCode} className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700">Enable 2FA via Email</button>
                    </div>
                )}

                {showVerifyForm && (
                     <form onSubmit={handleVerifyCode} className="mt-6 border-t pt-6">
                        <label htmlFor="2fa-token" className="block text-gray-700 font-bold mb-2">Enter the 6-digit code from your email</label>
                        <input id="2fa-token" type="text" value={twoFaToken} onChange={(e) => setTwoFaToken(e.target.value)} placeholder="123456" required className="w-full p-2 border rounded-md" />
                        <button type="submit" className="w-full bg-green-500 text-white p-2 rounded mt-4 hover:bg-green-600">Verify & Enable</button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default TwoFactorAuthPage;