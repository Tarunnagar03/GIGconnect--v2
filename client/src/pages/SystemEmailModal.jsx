import React, { useState } from 'react';
import api from '../api';

const SystemEmailModal = ({ user, onClose }) => {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    if (!user) return null;

    const handleSend = async (e) => {
        e.preventDefault();
        setSending(true);
        try {
            await api.post(`/admin/users/${user._id}/send-email`, { subject, message });
            alert('Email sent successfully');
            onClose();
        } catch (err) {
            alert('Failed to send email');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-extrabold text-lg text-gray-900">Email {user.name}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500">✕</button>
                </div>
                <form onSubmit={handleSend} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Subject</label>
                        <input required type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Message</label>
                        <textarea required rows="5" value={message} onChange={e => setMessage(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl resize-none"></textarea>
                    </div>
                    <button disabled={sending} type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 disabled:bg-gray-400">
                        {sending ? 'Sending...' : 'Send Email'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SystemEmailModal;