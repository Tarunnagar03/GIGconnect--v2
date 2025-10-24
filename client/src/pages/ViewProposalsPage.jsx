import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';

const ViewProposalsPage = () => {
    const { gigId } = useParams();
    const navigate = useNavigate();
    const [proposals, setProposals] = useState([]);
    const [gigTitle, setGigTitle] = useState('');
    const [gigStatus, setGigStatus] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [gigRes, proposalsRes] = await Promise.all([
                api.get(`/gigs/${gigId}`),
                api.get(`/proposals/gig/${gigId}`)
            ]);
            setGigTitle(gigRes.data.title);
            setGigStatus(gigRes.data.status);
            setProposals(proposalsRes.data);
        } catch (err) {
            setError('Could not load proposals.');
            console.error("Error fetching proposals:", err);
        } finally {
            setLoading(false);
        }
    }, [gigId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAcceptProposal = async (proposalId) => {
        if (!window.confirm("Accept this proposal and assign the gig? This will reject others.")) return;
        setError('');
        try {
            await api.put(`/proposals/accept/${proposalId}`);
            alert('Proposal accepted! The gig is now In Progress.');
            navigate(`/gigs/${gigId}`);
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to accept proposal.');
        }
    };

    const handleRejectProposal = async (proposalId) => {
        const reason = prompt("Please provide a brief reason for rejecting this proposal:");
        if (reason === null) return;
        if (!reason || reason.trim() === '') {
            alert('A rejection reason is required.');
            return;
        }
        setError('');
        try {
            await api.put(`/proposals/reject/${proposalId}`, { rejectionReason: reason });
            setProposals(prev => prev.map(p =>
                p._id === proposalId
                    ? { ...p, status: 'Rejected', rejectionReason: reason }
                    : p
            ));
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to reject proposal.');
        }
    };

    if (loading) return <p>Loading proposals...</p>;

    const isGigOpen = gigStatus === 'Open';

    return (
        <div className="max-w-4xl mx-auto">
            <Link to={`/gigs/${gigId}`} className="inline-block mb-6 text-blue-600 hover:underline">
                &larr; Back to Gig Details
            </Link>
            <h1 className="text-3xl font-bold mb-2">Proposals Received</h1>
            <p className="text-lg text-gray-600 mb-6">For: <span className="font-semibold">{gigTitle}</span></p>
            {error && <p className="text-red-500 bg-red-100 p-3 rounded text-center mb-4">{error}</p>}

            {proposals.length > 0 ? (
                <div className="space-y-6">
                    {proposals.map(p => (
                        <div key={p._id} className={`p-6 rounded-lg shadow-md border ${p.status === 'Accepted' ? 'bg-green-50 border-green-300' : p.status === 'Rejected' ? 'bg-red-50 border-red-300 opacity-70' : 'bg-white'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    {/* --- THIS IS THE CLICKABLE LINK --- */}
                                    <Link 
                                        to={`/profile/${p.freelancer._id}`} 
                                        className="text-xl font-bold text-blue-600 hover:underline"
                                    >
                                        {p.freelancer.name} (@{p.freelancer.username})
                                    </Link>
                                    <p className="text-sm text-gray-500">{p.freelancer.headline || 'Freelancer'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-green-600">${p.bidAmount.toFixed(2)}</p>
                                    <p className="text-xs text-gray-400">Submitted: {new Date(p.createdAt).toLocaleDateString()}</p>
                                    {p.status !== 'Submitted' && (
                                        <span className={`mt-1 inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${p.status === 'Accepted' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                            {p.status}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="border-t pt-4">
                                <h4 className="font-semibold mb-2">Cover Letter:</h4>
                                <p className="text-gray-700 whitespace-pre-wrap">{p.coverLetter}</p>
D                            </div>
                            {p.status === 'Rejected' && p.rejectionReason && (
                                <div className="mt-4 border-t pt-4">
                                    <h4 className="font-semibold mb-1 text-red-700">Reason for Rejection:</h4>
                                    <p className="text-gray-600 italic">{p.rejectionReason}</p>
                                </div>
                            )}
                            {isGigOpen && p.status === 'Submitted' && (
                                <div className="mt-6 text-right space-x-3">
                                    <button
                                        onClick={() => handleRejectProposal(p._id)}
                                        className="bg-red-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-600"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => handleAcceptProposal(p._id)}
                                        className="bg-green-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-600"
                                    >
                                        Accept & Assign
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white p-6 rounded-lg shadow-md border text-center">
                    <p className="text-gray-500">No proposals have been submitted for this gig yet.</p>
                </div>
            )}
        </div>
    );
};

export default ViewProposalsPage;