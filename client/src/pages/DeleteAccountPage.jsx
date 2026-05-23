import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const DeleteAccountPage = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleDelete = async () => {
        // Show a confirmation dialog before proceeding
        const isConfirmed = window.confirm(
            'Are you absolutely sure you want to delete your account? This action is permanent and cannot be undone.'
        );

        if (isConfirmed) {
            try {
                await api.delete('/profiles/me'); // This is the API endpoint you already created
                alert('Your account has been permanently deleted.'); // An alert is okay for this final action
                logout();
                navigate('/');
            } catch (err) {
                setError('Failed to delete account. Please try again.');
                console.error(err);
            }
        }
    };

    return (
        <div className="max-w-3xl mx-auto animate-fade-in">
            <Link to="/settings/security" className="inline-flex items-center gap-2 mb-6 text-gray-600 hover:text-blue-600 font-semibold bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm hover:shadow hover:border-blue-200 transition-all group">
                <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Back to Security Settings
            </Link>

            <div className="bg-red-50 p-12 rounded-2xl shadow-lg border border-red-100 text-center">
                <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                </div>
                <h1 className="text-4xl font-extrabold text-red-700 mb-4 tracking-tight">Delete Account</h1>
                <p className="text-gray-800 text-lg mb-4">
                    This is a **permanent** action. Once you delete your account, there is no going back.
                </p>
                <ul className="text-red-800/80 mb-8 space-y-2 bg-red-100/50 p-6 rounded-xl inline-block text-left">
                    <li>All of your personal details will be removed.</li>
                    <li>Your freelancer profile (if you have one) will be deleted.</li>
                    <li>Any gigs you have posted will be deleted.</li>
                </ul>

                {error && <p className="bg-red-100 border border-red-300 text-red-700 p-4 rounded-xl mb-6 text-center font-bold">{error}</p>}

                <button
                    onClick={handleDelete}
                    className="w-full bg-red-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-red-700 hover:-translate-y-1 shadow-md transition-all"
                >
                    I understand, Permanently Delete My Account
                </button>
            </div>
        </div>
    );
};

export default DeleteAccountPage;