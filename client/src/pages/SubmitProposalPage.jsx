/**
 * SubmitProposalPage Component
 * UPDATED: May 6, 2026 - Proposal System Enhancement
 * 
 * Features:
 * - Proposal form for gigs
 * - Bid amount configuration
 * - Timeline estimation
 * - Proposal description
 * - Form validation
 * - Modern UI with custom design system
 * - NEW: Multi-Step Wizard interface
 * - NEW: Budget comparison logic
 * - NEW: AI Assistant placeholder buttons
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { formatCurrency } from '../utils/currencyFormatter';

const SubmitProposalPage = () => {
    const { gigId } = useParams();
    const navigate = useNavigate();
    const { auth } = useAuth();

    const [gigTitle, setGigTitle] = useState('');
    const [gigBudget, setGigBudget] = useState(0);
    const [gigData, setGigData] = useState(null);
    const [isAIGenerating, setIsAIGenerating] = useState(false);
    const [isAIPricing, setIsAIPricing] = useState(false);
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({ coverLetter: '', bidAmount: '', time: '3 Days' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [existingProposalStatus, setExistingProposalStatus] = useState(null);
    const [portfolioFile, setPortfolioFile] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!auth.user) {
                setLoading(false);
                setError('Authentication error. Please log in again.');
                return;
            }
            setLoading(true);
            setError('');
            try {
                // Fetch gig details first
                const gigRes = await api.get(`/gigs/${gigId}`);
                setGigTitle(gigRes.data.title);
                setGigBudget(gigRes.data.budget || 0);
                setGigData(gigRes.data);

                // Then fetch proposals
                const proposalsRes = await api.get('/proposals/my-proposals');

                // --- FIX: Check p.gig exists before accessing _id ---
                const existing = proposalsRes.data.find(p => {
                    const matchedGigId = p.gig && typeof p.gig === 'object' ? p.gig._id : p.gig;
                    return matchedGigId === gigId;
                });

                if (existing) {
                    setExistingProposalStatus(existing.status);
                }
            } catch (err) {
                // Log the specific error for debugging
                console.error("Error fetching data:", err);
                // Set a user-friendly error message
                setError('Could not load page details. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [gigId, auth.user]);

    const { coverLetter, bidAmount, time } = formData;
    const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    // --- Advanced Features Logic ---
    const numericBidAmount = parseFloat(bidAmount);
    let bidFeedback = null;
    if (!isNaN(numericBidAmount) && gigBudget > 0) {
        const diff = ((numericBidAmount - gigBudget) / gigBudget) * 100;
        if (diff > 5) bidFeedback = { type: 'warning', text: `Your bid is ${Math.round(diff)}% higher than the client's budget.` };
        else if (diff < -5) bidFeedback = { type: 'success', text: `Competitive! Your bid is ${Math.abs(Math.round(diff))}% lower than the budget.` };
        else bidFeedback = { type: 'info', text: 'Your bid perfectly matches the client budget.' };
    }

    const handleAIAssist = async (action) => {
        setIsAIGenerating(action);
        try {
            const payload = { gigTitle, gigDescription: gigData?.description || '', action, currentText: formData.coverLetter };
            const res = await api.post('/ai/generate-proposal', payload);
            setFormData({ ...formData, coverLetter: res.data.generatedText });
        } catch (err) {
            console.error("AI Error:", err);
            alert(err.response?.data?.msg || "Failed to connect to AI Assistant. Is your backend running?");
        }
        setIsAIGenerating(false);
    };

    const handleAISuggestBid = async () => {
        setIsAIPricing(true);
        setError('');
        try {
            const res = await api.post('/ai-pricing/suggest', {
                type: 'freelancer_bid',
                gigTitle,
                gigBudget
            });
            setFormData(prev => ({ ...prev, bidAmount: res.data.suggestedBid }));
        } catch (err) {
            setError('AI Pricing failed. ' + (err.response?.data?.msg || ''));
        } finally {
            setIsAIPricing(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setError('File size should be less than 5MB.');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setPortfolioFile({
                    name: file.name, size: file.size, type: file.type,
                    content: reader.result
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        // Reset messages and set submitting state
        setError('');
        setSuccess('');
        setIsSubmitting(true);
        try {
            // Validate bid amount
            if (isNaN(numericBidAmount) || numericBidAmount < 0) {
                setError('Please enter a valid, non-negative bid amount.');
                setIsSubmitting(false); // Re-enable button
                return;
            }
            // Prepare and send proposal data
            let finalCoverLetter = `${coverLetter}\n\nEstimated Time: ${time}`;
            if (portfolioFile) {
                finalCoverLetter += `\n\n[ATTACHMENT]:::${JSON.stringify(portfolioFile)}`;
            }
            const proposalData = { gigId, coverLetter: finalCoverLetter, bidAmount: numericBidAmount };
            await api.post('/proposals', proposalData);
            setSuccess('Proposal submitted successfully!');
            setExistingProposalStatus('Submitted'); // Update UI immediately
            setTimeout(() => navigate('/my-proposals'), 800);
        } catch (err) {
            console.error("Proposal submission error:", err.response || err);
            setError(err.response?.data?.msg || 'Failed to submit proposal. Please try again.');
        } finally {
            setIsSubmitting(false); // Re-enable button
        }
    };

    if (loading) {
        return (
            <div className="max-w-2xl mx-auto animate-pulse mt-4">
                <div className="h-4 bg-gray-300 rounded w-32 mb-6"></div>
                <div className="h-8 bg-gray-300 rounded w-2/3 mb-2"></div>
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-6"></div>
                <div className="bg-white p-8 rounded-lg shadow-md space-y-6">
                    <div>
                        <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                        <div className="h-12 bg-gray-200 rounded w-full"></div>
                    </div>
                    <div>
                        <div className="h-4 bg-gray-300 rounded w-1/5 mb-2"></div>
                        <div className="h-32 bg-gray-200 rounded w-full"></div>
                    </div>
                    <div className="h-12 bg-gray-300 rounded w-full mt-4"></div>
                </div>
            </div>
        );
    }

    const handleNext = () => {
        setError('');
        if (step === 1 && (!bidAmount || isNaN(parseFloat(bidAmount)))) {
            setError('Please enter a valid bid amount before proceeding.');
            return;
        }
        if (step === 2 && !coverLetter.trim()) {
            setError('Please write a cover letter before proceeding.');
            return;
        }
        setStep(step + 1);
    };

    // Main component render
    return (
        <div className="max-w-3xl mx-auto animate-fade-in">
            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 mb-6 text-gray-600 hover:text-blue-600 font-semibold bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm hover:shadow hover:border-blue-200 transition-all group focus:outline-none">
                <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Back to Gig Details
            </button>
            
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold mb-2 text-gray-800 tracking-tight">Submit Proposal</h1>
                    <p className="text-lg text-gray-500">For: <span className="font-bold text-gray-800">{gigTitle}</span></p>
                </div>
                {!existingProposalStatus && (
                    <div className="text-right">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Client Budget</p>
                        <p className="text-2xl font-extrabold text-green-600">{formatCurrency(gigBudget)}</p>
                    </div>
                )}
            </div>

            {/* Display error if there was one during loading */}
            {error && !existingProposalStatus && (
                 <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            {/* Conditional Rendering: Show status or form */}
            {existingProposalStatus ? (
                // Show existing proposal status
                <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
                    <h2 className="text-2xl font-bold mb-4 text-gray-800">You have already submitted a proposal for this gig.</h2>
                    <p className="mb-4 text-gray-500">Your proposal status is:</p>
                    <span className={`px-3 py-1 text-base font-semibold rounded-full ${
                        existingProposalStatus === 'Accepted' ? 'bg-green-100 text-green-800' :
                        existingProposalStatus === 'Rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800' // Submitted
                    }`}>
                        {existingProposalStatus}
                    </span>
                    {existingProposalStatus === 'Rejected' && (
                       <p className="text-sm text-gray-500 mt-4">The client has reviewed your proposal but decided to move forward with another candidate.</p>
                    )}
                     {existingProposalStatus === 'Accepted' && (
                       <p className="text-sm text-green-600 mt-4">Congratulations! The client accepted your proposal.</p>
                    )}
                </div>
            ) : (
                // Show the submission form (only if no initial loading error)
                !error && (
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden relative">
                        {/* Progress Bar */}
                        <div className="flex bg-gray-50 border-b border-gray-100">
                            <div className={`flex-1 py-4 text-center text-sm font-bold border-b-2 transition-colors ${step >= 1 ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}>1. Terms</div>
                            <div className={`flex-1 py-4 text-center text-sm font-bold border-b-2 transition-colors ${step >= 2 ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}>2. Pitch</div>
                            <div className={`flex-1 py-4 text-center text-sm font-bold border-b-2 transition-colors ${step >= 3 ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}>3. Attach & Submit</div>
                        </div>

                        <form onSubmit={onSubmit} className="p-8 md:p-10 space-y-6">
                            {error && <p className="text-red-700 bg-red-50 border border-red-200 p-4 rounded-xl text-center font-bold animate-slide-up">{error}</p>}
                            {success && <p className="text-green-700 bg-green-50 border border-green-200 p-4 rounded-xl text-center font-bold animate-slide-up">{success}</p>}

                            {/* STEP 1: Terms */}
                            {step === 1 && (
                                <div className="space-y-8 animate-fade-in">
                                    <h2 className="text-2xl font-bold text-gray-800 border-b border-gray-100 pb-4">Set Your Terms</h2>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end mb-1">
                                                <label htmlFor="bidAmount" className="block text-sm font-black text-gray-500 uppercase tracking-wider">Your Bid Amount (₹) <span className="text-red-500">*</span></label>
                                                {gigBudget > 0 && (
                                                    <button type="button" onClick={handleAISuggestBid} disabled={isAIPricing} className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md">
                                                        {isAIPricing ? <span className="animate-spin">⏳</span> : '✨'} {isAIPricing ? 'Calculating...' : 'AI Suggest Bid'}
                                                    </button>
                                                )}
                                            </div>
                                            <input type="number" id="bidAmount" name="bidAmount" value={bidAmount} onChange={onChange} required min="0" step="0.01" placeholder="e.g., 5000" className="w-full p-4 text-2xl font-extrabold border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50 hover:bg-white focus:bg-white text-gray-800" disabled={isSubmitting}/>
                                            
                                            {/* Dynamic Budget Feedback */}
                                            {bidFeedback && (
                                                <div className={`flex items-start gap-2 p-3 rounded-xl border ${bidFeedback.type === 'warning' ? 'bg-orange-50 border-orange-200 text-orange-800' : bidFeedback.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
                                                    <span className="text-lg leading-none">{bidFeedback.type === 'warning' ? '⚠️' : bidFeedback.type === 'success' ? '🎯' : '💡'}</span>
                                                    <p className="text-sm font-bold">{bidFeedback.text}</p>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <label htmlFor="time" className="block text-sm font-black text-gray-500 uppercase tracking-wider">Estimated Delivery Time <span className="text-red-500">*</span></label>
                                            <input type="text" id="time" name="time" value={time} onChange={onChange} required placeholder="e.g., 3 Days" className="w-full p-4 text-xl font-bold border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50 hover:bg-white focus:bg-white text-gray-800" disabled={isSubmitting}/>
                                            <p className="text-xs text-gray-400 font-medium">Clients prefer clear and realistic timelines.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: The Pitch & AI Assistant */}
                            {step === 2 && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="flex justify-between items-end border-b border-gray-100 pb-4">
                                        <h2 className="text-2xl font-bold text-gray-800">The Pitch (Cover Letter)</h2>
                                    </div>
                                    
                                    {/* ✨ AI Assistant Bar */}
                                    <div className={`bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-2xl border ${isAIGenerating ? 'border-purple-300 shadow-md' : 'border-indigo-100 shadow-inner'} flex flex-wrap items-center gap-3 transition-all`}>
                                        <span className={`text-2xl ml-2 ${isAIGenerating ? 'animate-spin' : 'animate-pulse'}`}>✨</span>
                                        <div>
                                            <p className="text-sm font-bold text-indigo-900">{isAIGenerating ? 'AI is thinking...' : 'AI Writing Assistant'}</p>
                                            <p className="text-[10px] text-indigo-600 uppercase tracking-wider font-bold">{isAIGenerating ? 'Generating your perfect pitch' : 'Stuck? Let AI help you write.'}</p>
                                        </div>
                                        <div className="flex flex-wrap gap-2 ml-auto">
                                            <button type="button" disabled={isAIGenerating} onClick={() => handleAIAssist('write')} className="bg-white border border-indigo-200 text-indigo-700 text-xs font-bold px-4 py-2 rounded-xl shadow-sm hover:bg-indigo-600 hover:text-white transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
                                                {isAIGenerating === 'write' ? '⏳ Generating...' : '✍️ Write for me'}
                                            </button>
                                            <button type="button" disabled={isAIGenerating || !coverLetter.trim()} onClick={() => handleAIAssist('professional')} className="bg-white border border-indigo-200 text-indigo-700 text-xs font-bold px-4 py-2 rounded-xl shadow-sm hover:bg-indigo-600 hover:text-white transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
                                                {isAIGenerating === 'professional' ? '⏳ Generating...' : '👔 Make Professional'}
                                            </button>
                                            <button type="button" disabled={isAIGenerating || !coverLetter.trim()} onClick={() => handleAIAssist('shorten')} className="bg-white border border-indigo-200 text-indigo-700 text-xs font-bold px-4 py-2 rounded-xl shadow-sm hover:bg-indigo-600 hover:text-white transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
                                                {isAIGenerating === 'shorten' ? '⏳ Generating...' : '✂️ Shorten'}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <textarea id="coverLetter" name="coverLetter" rows="8" value={coverLetter} onChange={onChange} required placeholder="Introduce yourself and explain why you're the best fit for this project..." className="w-full p-5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50 hover:bg-white focus:bg-white resize-none text-base text-gray-800 leading-relaxed shadow-inner" disabled={isSubmitting}></textarea>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: Attach & Submit */}
                            {step === 3 && (
                                <div className="space-y-8 animate-fade-in text-center py-6">
                                    <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner">
                                        🚀
                                    </div>
                                    <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">Ready to send?</h2>
                                    <p className="text-gray-500 text-lg">Your bid of <span className="font-bold text-gray-800">₹{bidAmount}</span> will be sent to the client.</p>
                                    
                                    {/* Real Portfolio Attachment */}
                                    {!portfolioFile ? (
                                        <label className="max-w-md mx-auto bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-gray-300 text-left hover:bg-gray-100 transition-colors cursor-pointer group flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-xl group-hover:scale-110 transition-transform">📎</div>
                                            <div>
                                                <p className="font-bold text-gray-800">Attach Portfolio Item</p>
                                                <p className="text-xs text-gray-500">Upload PDF, Image, or Doc (Max 5MB)</p>
                                            </div>
                                            <input type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleFileChange} />
                                        </label>
                                    ) : (
                                        <div className="max-w-md mx-auto bg-blue-50 p-4 rounded-2xl border border-blue-200 text-left flex items-center justify-between shadow-sm animate-fade-in">
                                            <div className="flex items-center gap-4 overflow-hidden">
                                                <div className="w-12 h-12 bg-blue-600 text-white rounded-xl shadow-sm flex items-center justify-center text-xl shrink-0">
                                                    {portfolioFile.type?.startsWith('image/') ? '🖼️' : '📄'}
                                                </div>
                                                <div className="truncate">
                                                    <p className="font-bold text-blue-900 truncate">{portfolioFile.name}</p>
                                                    <p className="text-xs text-blue-700">{(portfolioFile.size / 1024).toFixed(1)} KB • Ready to send</p>
                                                </div>
                                            </div>
                                            <button type="button" onClick={() => setPortfolioFile(null)} className="w-8 h-8 flex items-center justify-center bg-white text-red-500 rounded-full hover:bg-red-50 transition-colors shadow-sm shrink-0">✕</button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Navigation Buttons */}
                            <div className="pt-6 border-t border-gray-100 flex justify-between">
                                {step > 1 ? (
                                    <button type="button" onClick={() => setStep(step - 1)} className="bg-white border-2 border-gray-200 text-gray-600 font-bold py-3.5 px-8 rounded-xl hover:bg-gray-50 transition-all">
                                        Back
                                    </button>
                                ) : <div></div>}
                                
                                {step < 3 ? (
                                    <button type="button" onClick={handleNext} className="bg-blue-600 text-white font-bold py-3.5 px-10 rounded-xl hover:bg-blue-700 hover:-translate-y-1 shadow-md transition-all">
                                        Next Step &rarr;
                                    </button>
                                ) : (
                                    <button type="submit" disabled={isSubmitting} className="bg-green-600 text-white font-extrabold py-3.5 px-12 rounded-xl hover:bg-green-700 hover:-translate-y-1 shadow-lg disabled:bg-gray-400 transition-all text-lg flex items-center gap-2">
                                        {isSubmitting ? 'Sending...' : 'Submit Proposal ✈️'}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                )
            )}
        </div>
    );
};

export default SubmitProposalPage;