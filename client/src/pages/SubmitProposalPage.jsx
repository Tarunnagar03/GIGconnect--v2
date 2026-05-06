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
 */

import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api';

const SubmitProposalPage = () => {
    const { gigId } = useParams();
    const navigate = useNavigate();
    const { auth } = useContext(AuthContext);

    const [gigTitle, setGigTitle] = useState('');
    const [formData, setFormData] = useState({ coverLetter: '', bidAmount: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [existingProposalStatus, setExistingProposalStatus] = useState(null);

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

                // Then fetch proposals
                const proposalsRes = await api.get('/proposals/my-proposals');

                // --- FIX: Check p.gig exists before accessing _id ---
                const existing = proposalsRes.data.find(p => p.gig && p.gig._id === gigId);

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

    const { coverLetter, bidAmount } = formData;
    const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        // Reset messages and set submitting state
        setError('');
        setSuccess('');
        setIsSubmitting(true);
        try {
            // Validate bid amount
            const numericBidAmount = parseFloat(bidAmount);
            if (isNaN(numericBidAmount) || numericBidAmount < 0) {
                setError('Please enter a valid, non-negative bid amount.');
                setIsSubmitting(false); // Re-enable button
                return;
            }
            // Prepare and send proposal data
            const proposalData = { gigId, coverLetter, bidAmount: numericBidAmount };
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

    if (loading) return <p className="text-center mt-10">Loading...</p>;

    // Main component render
    return (
        <div className="max-w-2xl mx-auto">
            <Link to={`/gigs/${gigId}`} className="inline-block mb-6 text-blue-600 hover:underline">
                &larr; Back to Gig Details
            </Link>
            <h1 className="text-3xl font-bold mb-2">Submit Proposal</h1>
            <p className="text-lg text-gray-600 mb-6">For: <span className="font-semibold">{gigTitle}</span></p>

            {/* Display error if there was one during loading */}
            {error && !existingProposalStatus && (
                 <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            {/* Conditional Rendering: Show status or form */}
            {existingProposalStatus ? (
                // Show existing proposal status
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                    <h2 className="text-xl font-semibold mb-3">You have already submitted a proposal for this gig.</h2>
                    <p className="mb-2">Your proposal status is:</p>
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
                    <form onSubmit={onSubmit} className="bg-white p-8 rounded-lg shadow-md space-y-6">
                        {/* Display submission errors/success here */}
                        {error && <p className="text-red-500 bg-red-100 p-3 rounded text-center font-medium">{error}</p>}
                        {success && <p className="text-green-600 bg-green-100 p-3 rounded text-center font-medium">{success}</p>}

                        {/* Form fields */}
                        <div>
                            <label htmlFor="bidAmount" className="block text-sm font-medium text-gray-700 mb-1">Your Bid Amount ($) <span className="text-red-500">*</span></label>
                            <input type="number" id="bidAmount" name="bidAmount" value={bidAmount} onChange={onChange} required min="0" step="0.01" placeholder="e.g., 500" className="w-full p-3 border rounded-md" disabled={isSubmitting}/>
                        </div>
                        <div>
                            <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700 mb-1">Cover Letter <span className="text-red-500">*</span></label>
                            <textarea id="coverLetter" name="coverLetter" rows="6" value={coverLetter} onChange={onChange} required placeholder="Explain why you are the best fit..." className="w-full p-3 border rounded-md" disabled={isSubmitting}></textarea>
                        </div>
                        <button type="submit" className="w-full bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400" disabled={isSubmitting}>
                            {isSubmitting ? 'Submitting...' : 'Submit Proposal'}
                        </button>
                    </form>
                )
            )}
        </div>
    );
};

export default SubmitProposalPage;