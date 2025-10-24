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
        <div className="max-w-lg mx-auto">
            <Link to="/settings/security" className="inline-block mb-6 text-blue-600 hover:underline">
                &larr; Back to Security
            </Link>
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Change Password</h1>
            <form onSubmit={onSubmit} className="bg-white p-8 rounded-lg shadow-md space-y-6">
                {error && <p className="text-red-500 bg-red-100 p-3 rounded text-center">{error}</p>}
                {success && <p className="text-green-600 bg-green-100 p-3 rounded text-center">{success}</p>}
                <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <input
                        type="password"
                        id="currentPassword"
                        name="currentPassword"
                        value={currentPassword}
                        onChange={onChange}
                        required
                        className="w-full p-3 border rounded-md"
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
                        className="w-full p-3 border rounded-md"
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
                        className="w-full p-3 border rounded-md"
                    />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700">
                    Update Password
                </button>
            </form>
        </div>
    );
};

export default ChangePasswordPage;