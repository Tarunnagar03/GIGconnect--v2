import React, { useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

const PostGig = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ title: '', description: '', budget: '' });
    const [error, setError] = useState('');

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/gigs', formData);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.msg || 'Error posting gig');
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Post a New Gig</h1>
            <form onSubmit={onSubmit} className="bg-white p-8 rounded-lg shadow-md">
                {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</p>}
                <div className="mb-4">
                    <label htmlFor="title" className="block text-gray-700 font-bold mb-2">Gig Title</label>
                    <input type="text" name="title" value={formData.title} onChange={onChange} placeholder="e.g., 'Need a logo for my startup'" required className="w-full p-3 border rounded" />
                </div>
                <div className="mb-4">
                    <label htmlFor="description" className="block text-gray-700 font-bold mb-2">Description</label>
                    <textarea name="description" value={formData.description} onChange={onChange} placeholder="Describe your project in detail..." required className="w-full p-3 border rounded h-40"></textarea>
                </div>
                <div className="mb-4">
                    <label htmlFor="budget" className="block text-gray-700 font-bold mb-2">Budget ($)</label>
                    <input type="number" name="budget" value={formData.budget} onChange={onChange} placeholder="e.g., 500" required className="w-full p-3 border rounded" />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 transition-colors">Post Gig</button>
            </form>
        </div>
    );
};

export default PostGig;