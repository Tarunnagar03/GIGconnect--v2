import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../utils/currencyFormatter';

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
const GigCard = ({ gig, proposalStatus, matchScore }) => {
    const [isSaved, setIsSaved] = useState(false);

    // Basic check for gig data
    if (!gig) {
        return <div className="bg-white p-6 rounded-lg shadow-md border border-red-300">Gig data is missing.</div>;
    }

    const shortDescription = (gig.description || '').length > 120
        ? `${gig.description.substring(0, 120)}...`
        : gig.description;

    return (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col h-full group relative overflow-hidden">
            {/* Subtle top gradient line on hover */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>

            {/* Top Badges (Match & Save) */}
            <div className="absolute top-5 right-5 flex items-center gap-2">
                {matchScore !== undefined && matchScore > 0 && (
                    <span className="bg-orange-100 text-orange-700 text-[10px] font-extrabold px-2 py-1 rounded-md shadow-sm">
                        🔥 {matchScore}% Match
                    </span>
                )}
                <button 
                    onClick={(e) => { e.preventDefault(); setIsSaved(!isSaved); }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm ${isSaved ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-red-400'}`}
                    title={isSaved ? "Remove from saved" : "Save for later"}
                >
                    <svg className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                </button>
            </div>

            <div className="flex justify-between items-start mb-4 gap-4 pr-24">
                <h3 className="text-xl font-extrabold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {gig.title || 'No Title'}
                </h3>
            </div>

            <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs shadow-sm">
                    {(gig.client?.companyName || gig.client?.name || 'C').charAt(0).toUpperCase()}
                </div>
                <div className="text-xs text-gray-500 font-medium">
                    Posted by <span className="text-gray-700 font-bold">{gig.client?.name || 'Unknown'}</span>
                </div>
            </div>

            <p className="text-gray-600 text-sm mb-5 line-clamp-3 leading-relaxed flex-grow">
                {shortDescription}
            </p>

            {/* Skills tags */}
            {gig.skills && gig.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-5">
                    {gig.skills.slice(0, 3).map((skill, i) => (
                        <span key={i} className="text-[10px] bg-gray-50 border border-gray-100 font-semibold text-gray-600 px-2 py-1 rounded-md">
                            {skill}
                        </span>
                    ))}
                    {gig.skills.length > 3 && (
                        <span className="text-[10px] bg-gray-50 border border-gray-100 font-semibold text-gray-600 px-2 py-1 rounded-md">
                            +{gig.skills.length - 3}
                        </span>
                    )}
                </div>
            )}

            <div className="mt-auto border-t border-gray-100 pt-5 flex items-center justify-between">
                <span className="text-lg font-extrabold text-green-600">{formatCurrency(gig.budget || 0)}</span>
                
                {proposalStatus ? (
                    <ProposalStatusBadge status={proposalStatus} />
                ) : (
                    <Link
                        to={`/gigs/${gig._id}`}
                        className="text-sm bg-gray-50 text-blue-600 border border-gray-200 font-bold py-2 px-4 rounded-xl group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all shadow-sm"
                    >
                        View Details
                    </Link>
                )}
            </div>
        </div>
    );
};

export default GigCard;