import React, { useState } from 'react';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';

// Helper: Premium Dynamic List Builder for Arrays (Skills)
const DynamicListInput = ({ name, label, items, onChange, placeholder, required }) => {
    const [inputValue, setInputValue] = useState('');

    const handleAdd = (e) => {
        e.preventDefault();
        const trimmed = inputValue.trim();
        if (trimmed && !items.includes(trimmed)) {
            onChange(name, [...items, trimmed]);
            setInputValue('');
        }
    };

    const handleRemove = (indexToRemove) => {
        onChange(name, items.filter((_, index) => index !== indexToRemove));
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="flex gap-2 mb-3">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(e); } }}
                    className="flex-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50 hover:bg-white focus:bg-white"
                    placeholder={placeholder}
                />
                <button type="button" onClick={handleAdd} className="bg-blue-100 text-blue-700 px-6 font-bold rounded-xl hover:bg-blue-200 transition-colors shadow-sm">
                    Add
                </button>
            </div>
            <div className="flex flex-wrap gap-2">
                {items.map((item, index) => (
                    <span key={index} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold px-4 py-1.5 rounded-full flex items-center gap-2 shadow-sm animate-fade-in">
                        {item}
                        <button type="button" onClick={() => handleRemove(index)} className="hover:text-red-200 focus:outline-none flex items-center justify-center transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </span>
                ))}
                {items.length === 0 && <span className="text-sm text-gray-400 italic font-medium px-2">No skills added yet.</span>}
            </div>
        </div>
    );
};

const PostGig = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ title: '', description: '', budget: '', skills: [] });
    const [error, setError] = useState('');

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleListChange = (name, newList) => setFormData(prev => ({ ...prev, [name]: newList }));

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
        <div className="max-w-6xl mx-auto animate-fade-in pb-12">
            <Link to="/dashboard" className="inline-flex items-center gap-2 mb-6 text-gray-600 hover:text-blue-600 font-semibold bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm hover:shadow hover:border-blue-200 transition-all group">
                <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Back to Dashboard
            </Link>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left Side: Tips & Info */}
                <div className="lg:col-span-1 space-y-6">
                    <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight leading-tight">Bring your ideas to life.</h1>
                    <p className="text-lg text-gray-600">Post your gig and get connected with the top 1% of freelance talent on our platform.</p>
                    
                    <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl shadow-sm mt-8">
                        <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            Tips for success
                        </h3>
                        <ul className="space-y-3 text-blue-900/80 text-sm font-medium">
                            <li className="flex items-start gap-2">✓ <span className="flex-1">Be clear and specific with your title.</span></li>
                            <li className="flex items-start gap-2">✓ <span className="flex-1">Add all necessary skills so the right experts find you.</span></li>
                            <li className="flex items-start gap-2">✓ <span className="flex-1">Provide a detailed description of your expectations and timeline.</span></li>
                            <li className="flex items-start gap-2">✓ <span className="flex-1">Set a realistic budget to attract quality work.</span></li>
                        </ul>
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="lg:col-span-2">
                    <form onSubmit={onSubmit} className="bg-white p-8 md:p-10 rounded-3xl shadow-lg border border-gray-100 space-y-6">
                        {error && <p className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-4 font-bold">{error}</p>}
                        
                        <div>
                            <label htmlFor="title" className="block text-sm font-bold text-gray-700 mb-2">Gig Title <span className="text-red-500">*</span></label>
                            <input type="text" id="title" name="title" value={formData.title} onChange={onChange} placeholder="e.g., 'Need a complete E-Commerce website'" required className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 hover:bg-white focus:bg-white text-lg" />
                        </div>
                        
                        <DynamicListInput 
                            name="skills"
                            label="Skills Required"
                            items={formData.skills}
                            onChange={handleListChange}
                            placeholder="e.g., React.js, UI Design, Node.js"
                        />
                        
                        <div>
                            <label htmlFor="description" className="block text-sm font-bold text-gray-700 mb-2">Description <span className="text-red-500">*</span></label>
                            <textarea id="description" name="description" value={formData.description} onChange={onChange} placeholder="Describe your project in detail..." required className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 hover:bg-white focus:bg-white h-48 resize-none text-base"></textarea>
                        </div>
                        
                        <div>
                            <label htmlFor="budget" className="block text-sm font-bold text-gray-700 mb-2">Budget (₹) <span className="text-red-500">*</span></label>
                            <input type="number" id="budget" name="budget" value={formData.budget} onChange={onChange} placeholder="e.g., 15000" min="0" required className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 hover:bg-white focus:bg-white text-lg font-bold" />
                        </div>
                        
                        <div className="pt-4 border-t border-gray-100">
                            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-blue-700 hover:-translate-y-1 transition-all shadow-md text-lg">Publish Gig</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PostGig;