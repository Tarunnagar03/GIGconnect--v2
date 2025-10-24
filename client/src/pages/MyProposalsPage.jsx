import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

const MyProposalsPage = () => {
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { auth } = useContext(AuthContext);

    useEffect(() => {
        const fetchMyProposals = async () => {
            if (!auth.isAuthenticated) {
                setError('Please log in to view your proposals.');
                setLoading(false);
                return;
            }
            setLoading(true);
            setError('');
            try {
                const res = await api.get('/proposals/my-proposals');
                if (Array.isArray(res.data)) {
                    setProposals(res.data);
                } else {
                    console.error("API did not return an array:", res.data);
                    setError('Failed to load proposals. Invalid data received.');
                    setProposals([]);
                }
            } catch (err) {
                console.error("Failed to fetch proposals", err);
                setError(err.response?.data?.msg || 'An error occurred while fetching proposals.');
                setProposals([]);
            } finally {
                setLoading(false);
            }
        };
        fetchMyProposals();
    }, [auth.isAuthenticated]);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Submitted': return 'bg-yellow-100 text-yellow-800';
            case 'Accepted': return 'bg-blue-100 text-blue-800';
            case 'Completed': return 'bg-green-100 text-green-800';
            case 'Rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    
    const getEffectiveStatus = (proposal) => {
        if (proposal.status === 'Accepted' && proposal.gig?.status === 'Completed') {
            return 'Completed';
        }
        return proposal.status;
    };

    if (loading) {
        return <div className="text-center mt-10">Loading your proposals...</div>;
    }

    // --- NEW LOGIC: Filter proposals ---
    const validProposals = proposals.filter(p => p.gig);
    const orphanedProposalCount = proposals.length - validProposals.length;

    return (
        <div className="max-w-4xl mx-auto">
            <Link to="/dashboard" className="inline-block mb-6 text-blue-600 hover:underline">
                &larr; Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold mb-6">My Proposals</h1>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* --- UPDATED: Check validProposals.length --- */}
                {validProposals.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                        {/* --- UPDATED: Map over validProposals --- */}
                        {validProposals.map(p => {
                            const effectiveStatus = getEffectiveStatus(p);
                            
                            // We no longer need the "!p.gig" check here
                            
                            return (
                                <li key={p._id} className="p-4 hover:bg-gray-50">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <Link to={`/gigs/${p.gig._id}`} className="font-semibold text-lg text-blue-600 hover:underline block">
                                                {p.gig.title || 'Gig Title Missing'}
                                            </Link>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Submitted on: {new Date(p.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 text-sm font-semibold rounded-full whitespace-nowrap ${getStatusBadge(effectiveStatus)}`}>
                                            {effectiveStatus}
                                        </span>
                                    </div>
                                    {effectiveStatus === 'Rejected' && p.rejectionReason && (
                                        <div className="mt-3 bg-red-50 p-3 rounded border border-red-200">
                                            <p className="text-sm font-semibold text-red-700">Client Feedback:</p>
                                            <p className="text-sm text-gray-600 italic">"{p.rejectionReason}"</p>
                                        </div>
                                    )}
                                    {effectiveStatus === 'Completed' && (
                                         <p className="text-sm text-green-600 mt-3 font-semibold">This gig was successfully completed!</p>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                     // Only show "no proposals" if there wasn't an error AND no valid proposals
                     !error && orphanedProposalCount === 0 && <p className="p-6 text-gray-500 text-center">You have not submitted any proposals yet.</p>
                )}
                
                {/* --- NEW: Section for orphaned proposals --- */}
                {orphanedProposalCount > 0 && (
                    <div className="p-4 border-t bg-gray-50 opacity-70">
                        <p className="font-semibold text-gray-600">Completed Gigs Not Available</p>
                        <p className="text-sm text-gray-500">
                            You have {orphanedProposalCount} {orphanedProposalCount > 1 ? 'proposals' : 'proposal'} for gigs that have been removed or deleted.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyProposalsPage;