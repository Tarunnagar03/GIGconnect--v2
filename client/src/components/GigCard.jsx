import React from 'react';
import { Link } from 'react-router-dom';

// Helper component for the status badge
const ProposalStatusBadge = ({ status }) => {
    let colors = 'bg-yellow-100 text-yellow-800'; // Default for Submitted
    if (status === 'Accepted') {
        colors = 'bg-green-100 text-green-800';
    } else if (status === 'Rejected') {
        colors = 'bg-red-100 text-red-800';
    }

    return (
        <span className={`px-3 py-1 text-sm font-semibold rounded-full whitespace-nowrap ${colors}`}>
            {status}
        </span>
    );
};

// GigCard accepts proposalStatus prop
const GigCard = ({ gig, proposalStatus }) => {
    // Basic check for gig data
    if (!gig) {
        return <div className="bg-white p-6 rounded-lg shadow-md border border-red-300">Gig data is missing.</div>;
    }

    const shortDescription = (gig.description || '').length > 150
        ? `${gig.description.substring(0, 150)}...`
        : gig.description;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
            <h3 className="text-xl font-bold text-gray-800 mb-2">{gig.title || 'No Title'}</h3>
            <p className="text-sm text-gray-500 mb-3">
                Posted by: {gig.client?.name || 'Unknown'} {/* Optional chaining for client */}
            </p>
            <p className="text-gray-600 mb-4 h-20 flex-grow">{shortDescription}</p>

            {/* Conditional Button/Badge */}
            <div className="flex justify-between items-center mt-auto pt-4 border-t">
                <span className="text-lg font-bold text-green-600">${gig.budget || 0}</span> {/* Default budget to 0 */}

                {proposalStatus ? (
                    // If a proposal status exists, show the badge
                    <ProposalStatusBadge status={proposalStatus} />
                ) : (
                    // Otherwise, show the "View Details" button (link to gig detail page)
                    <Link
                        to={`/gigs/${gig._id}`}
                        className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                    >
                        View Details
                    </Link>
                )}
            </div>
        </div>
    );
};

export default GigCard;