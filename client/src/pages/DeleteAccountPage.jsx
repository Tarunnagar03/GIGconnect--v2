import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api';

const DeleteAccountPage = () => {
    const { logout } = useContext(AuthContext);
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
        <div className="max-w-2xl mx-auto">
            <Link to="/settings/security" className="inline-block mb-6 text-blue-600 hover:underline">
                &larr; Back to Security Settings
            </Link>

            <div className="bg-white p-8 rounded-lg shadow-md border-2 border-red-500">
                <h1 className="text-3xl font-bold text-red-600 mb-4">Delete Account</h1>
                <p className="text-gray-700 mb-2">
                    This is a **permanent** action. Once you delete your account, there is no going back.
                </p>
                <ul className="list-disc list-inside text-gray-600 mb-6 space-y-1">
                    <li>All of your personal details will be removed.</li>
                    <li>Your freelancer profile (if you have one) will be deleted.</li>
                    <li>Any gigs you have posted will be deleted.</li>
                </ul>

                {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center">{error}</p>}

                <button
                    onClick={handleDelete}
                    className="w-full bg-red-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-700 transition-colors"
                >
                    I understand, Permanently Delete My Account
                </button>
            </div>
        </div>
    );
};

export default DeleteAccountPage;