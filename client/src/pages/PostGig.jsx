import React, { useState } from 'react';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';
import DynamicListInput from '../components/DynamicListInput';

const PostGig = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ title: '', description: '', budget: '', skills: [] });
    const [paymentType, setPaymentType] = useState('fixed'); // 'fixed' or 'milestone'
    const [milestones, setMilestones] = useState([{ title: '', amount: '' }]);
    const [error, setError] = useState('');
    const [isAILoading, setIsAILoading] = useState(false);

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleListChange = (name, newList) => setFormData(prev => ({ ...prev, [name]: newList }));

    const handleMilestoneChange = (index, field, value) => {
        const newMilestones = [...milestones];
        newMilestones[index][field] = value;
        setMilestones(newMilestones);
    };
    const addMilestone = () => setMilestones([...milestones, { title: '', amount: '' }]);
    const removeMilestone = (index) => setMilestones(milestones.filter((_, i) => i !== index));

    const totalMilestoneAmount = milestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);

    const handleAISuggestBudget = async () => {
        if (!formData.title || !formData.description) {
            setError('Please fill in the title and description first for an accurate AI pricing suggestion.');
            return;
        }
        setIsAILoading(true);
        setError('');
        try {
            const res = await api.post('/ai-pricing/suggest', {
                type: 'gig_budget',
                title: formData.title,
                description: formData.description,
                skills: formData.skills
            });
            setFormData(prev => ({ ...prev, budget: res.data.suggestedBudget }));
        } catch (err) {
            setError('AI Pricing failed. ' + (err.response?.data?.msg || ''));
        } finally {
            setIsAILoading(false);
        }
    };

    const onSubmit = async e => {
        e.preventDefault();
        setError('');

        if (paymentType === 'milestone' && totalMilestoneAmount !== Number(formData.budget)) {
            setError(`Milestone total (₹${totalMilestoneAmount}) must equal the Project Budget (₹${formData.budget || 0}).`);
            return;
        }

        try {
            const payload = { ...formData };
            if (paymentType === 'milestone') {
                payload.milestones = milestones.map(m => ({ ...m, status: 'pending' }));
            }
            await api.post('/gigs', payload);
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
                            <div className="flex flex-col sm:flex-row gap-3">
                                <input type="number" id="budget" name="budget" value={formData.budget} onChange={onChange} placeholder="e.g., 15000" min="0" required className="flex-1 w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 hover:bg-white focus:bg-white text-lg font-bold" />
                                <button type="button" onClick={handleAISuggestBudget} disabled={isAILoading} className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 text-indigo-700 font-bold px-6 py-4 rounded-xl hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2 whitespace-nowrap shadow-sm disabled:opacity-50">
                                    {isAILoading ? '⏳ Thinking...' : '✨ AI Suggest Budget'}
                                </button>
                            </div>
                        </div>

                        <div className="pt-4">
                            <label className="block text-sm font-bold text-gray-700 mb-3">Payment Structure</label>
                            <div className="flex bg-gray-100 p-1.5 rounded-xl mb-4 shadow-inner">
                                <button type="button" onClick={() => setPaymentType('fixed')} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${paymentType === 'fixed' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Pay all at once (Fixed)</button>
                                <button type="button" onClick={() => setPaymentType('milestone')} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${paymentType === 'milestone' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Pay in Milestones</button>
                            </div>

                            {paymentType === 'milestone' && (
                                <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl space-y-4 animate-fade-in">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-bold text-blue-900">Project Milestones</h4>
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${totalMilestoneAmount === Number(formData.budget) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>Total: ₹{totalMilestoneAmount} / ₹{formData.budget || 0}</span>
                                    </div>
                                    {milestones.map((m, index) => (
                                        <div key={index} className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center font-bold shrink-0">{index + 1}</div>
                                            <input type="text" value={m.title} onChange={(e) => handleMilestoneChange(index, 'title', e.target.value)} placeholder="Milestone Name (e.g. Design Phase)" required className="flex-1 p-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                                            <input type="number" value={m.amount} onChange={(e) => handleMilestoneChange(index, 'amount', e.target.value)} placeholder="Amount (₹)" required min="1" className="w-32 p-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
                                            {milestones.length > 1 && (
                                                <button type="button" onClick={() => removeMilestone(index)} className="text-red-400 hover:text-red-600 p-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                                            )}
                                        </div>
                                    ))}
                                    <button type="button" onClick={addMilestone} className="text-sm font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 mt-2">+ Add another milestone</button>
                                </div>
                            )}
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