import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

const GigDetailPage = () => {
    const { gigId } = useParams();
    const { auth } = useContext(AuthContext);
    const navigate = useNavigate();

    const [gig, setGig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [proposalCount, setProposalCount] = useState(0); // State to hold proposal count

    useEffect(() => {
        const fetchGig = async () => {
            try {
                const res = await api.get(`/gigs/${gigId}`);
                setGig(res.data);
                // If the current user is the client, fetch proposal count
                if (auth.user?.id === res.data.client._id) {
                    fetchProposalCount(gigId);
                }
            } catch (err) {
                setError('Gig not found or an error occurred.');
                console.error("Error fetching gig details:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchGig();
    }, [gigId, auth.user?.id]); // Rerun if user ID changes

    // Function to fetch the number of proposals for the client
    const fetchProposalCount = async (id) => {
        try {
            const res = await api.get(`/proposals/gig/${id}`);
            setProposalCount(res.data.length);
        } catch (err) {
            console.error("Error fetching proposal count:", err);
        }
    };

    const handleAssign = async () => {
        // We'll replace this later with selecting from proposals
        const freelancerId = prompt("Enter the Freelancer's User ID to assign this gig to (for testing):");
        if (!freelancerId) return;

        try {
            const res = await api.put(`/gigs/assign/${gigId}`, { freelancerId });
            setGig(res.data);
            alert('Gig has been assigned and is now In Progress!');
        } catch (err) {
            console.error(err);
            alert('Failed to assign gig.');
        }
    };

    const handleComplete = async () => {
        if (!window.confirm("Mark this gig as complete?")) return;
        try {
            const res = await api.put(`/gigs/complete/${gigId}`);
            setGig(res.data);
            alert('Gig marked as complete!');
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            alert('Failed to complete gig.');
        }
    };

    if (loading) return <div className="text-center mt-20">Loading gig details...</div>;
    if (error) return <div className="text-center mt-20 text-red-500">{error}</div>;

    const formattedDate = new Date(gig.date).toLocaleDateString();

    const isClientOwner = auth.user?.id === gig.client._id;
    const isFreelancer = auth.user?.role === 'Freelancer';

    return (
        <div>
            <Link to="/gigs" className="inline-block mb-6 text-blue-600 hover:underline">
                &larr; Back to All Gigs
            </Link>

            <div className="bg-white p-8 rounded-lg shadow-md">
                {/* ... (Gig Title, Status, Budget, Date, Description - remain the same) ... */}
                 <div className="flex flex-col md:flex-row justify-between items-start mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2 md:mb-0">{gig.title}</h1>
                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                            gig.status === 'Open' ? 'bg-blue-100 text-blue-800' :
                            gig.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                        }`}>
                            Status: {gig.status}
                        </span>
                    </div>
                    <span className="text-3xl font-bold text-green-600 mt-2 md:mt-0">${gig.budget}</span>
                </div>
                <p className="text-md text-gray-500 mb-6">
                    Posted on {formattedDate} by <span className="font-semibold">{gig.client ? gig.client.name : 'Unknown'}</span>
                </p>
                <div className="border-t pt-6">
                    <h2 className="text-xl font-bold mb-3">Project Description</h2>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{gig.description}</p>
                </div>

                {/* --- ACTION BUTTONS SECTION --- */}
                <div className="mt-8 text-center space-y-3 md:space-y-0 md:space-x-4">

                    {/* --- Freelancer Actions --- */}
                    {isFreelancer && gig.status === 'Open' && (
                        <Link
                            to={`/submit-proposal/${gigId}`}
                            className="inline-block bg-green-500 text-white font-bold py-3 px-10 rounded-lg hover:bg-green-600 transition-colors"
                        >
                            Submit Proposal 📝
                        </Link>
                    )}
                    {isFreelancer && !isClientOwner && ( // Only show if freelancer is NOT the client
                         <Link
                            to={`/chat/${gig.client._id}`}
                            className="inline-block bg-blue-600 text-white font-bold py-3 px-10 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Contact Client 💬
                        </Link>
                    )}

                    {/* --- Client Actions --- */}
                    {isClientOwner && gig.status === 'Open' && (
                        <>
                            <Link
                                to={`/view-proposals/${gigId}`}
                                className="inline-block bg-indigo-500 text-white font-bold py-3 px-10 rounded-lg hover:bg-indigo-600 transition-colors"
                            >
                                View Proposals ({proposalCount}) 👀
                            </Link>
                            {/* We keep the manual assign button for now, but ideally it's removed later */}
                            <button onClick={handleAssign} className="bg-yellow-500 text-white font-bold py-3 px-10 rounded-lg hover:bg-yellow-600 transition-colors">
                                Assign Manually (Test)
                            </button>
                        </>
                    )}
                    {isClientOwner && gig.status === 'In Progress' && (
                        <>
                            <Link to={`/payment/${gig._id}`} className="bg-green-500 text-white font-bold py-3 px-10 rounded-lg hover:bg-green-600">
                                Pay for Gig 💳
                            </Link>
                            <button onClick={handleComplete} className="bg-purple-500 text-white font-bold py-3 px-10 rounded-lg hover:bg-purple-600">
                                Mark as Complete ✅
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GigDetailPage;