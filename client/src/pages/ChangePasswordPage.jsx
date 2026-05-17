import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

const ChangePasswordPage = () => {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const { currentPassword, newPassword, confirmNewPassword } = formData;

    const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmNewPassword) {
            return setError('New passwords do not match.');
        }

        try {
            const res = await api.put('/users/update-password', { currentPassword, newPassword });
            setSuccess(res.data.msg);
            setFormData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
            // Optional: Redirect after a short delay
            setTimeout(() => navigate('/settings/security'), 2000);
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to update password.');
        }
    };

    return (
        <div className="max-w-2xl mx-auto animate-fade-in">
            <Link to="/settings/security" className="inline-flex items-center gap-2 mb-6 text-gray-600 hover:text-blue-600 font-semibold bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm hover:shadow hover:border-blue-200 transition-all group">
                <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Back to Security
            </Link>
            <h1 className="text-4xl font-extrabold mb-8 text-gray-800 tracking-tight">Change Password</h1>
            <form onSubmit={onSubmit} className="bg-white p-10 rounded-2xl shadow-lg border border-gray-100 space-y-6">
                {error && <p className="text-red-700 bg-red-50 border border-red-200 p-4 rounded-xl text-center font-bold">{error}</p>}
                {success && <p className="text-green-700 bg-green-50 border border-green-200 p-4 rounded-xl text-center font-bold">{success}</p>}
                <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <input
                        type="password"
                        id="currentPassword"
                        name="currentPassword"
                        value={currentPassword}
                        onChange={onChange}
                        required
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50 hover:bg-white focus:bg-white"
                    />
                </div>
                <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        value={newPassword}
                        onChange={onChange}
                        minLength="6"
                        required
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50 hover:bg-white focus:bg-white"
                    />
                </div>
                <div>
                    <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <input
                        type="password"
                        id="confirmNewPassword"
                        name="confirmNewPassword"
                        value={confirmNewPassword}
                        onChange={onChange}
                        minLength="6"
                        required
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50 hover:bg-white focus:bg-white"
                    />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-blue-700 hover:-translate-y-1 shadow-md transition-all mt-4">
                    Update Password
                </button>
            </form>
        </div>
    );
};

export default ChangePasswordPage;