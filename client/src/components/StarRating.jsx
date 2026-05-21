import React from 'react';

const StarRating = ({ rating }) => {
    const roundedRating = Math.round(rating || 0);
    
    return (
        <div className="flex text-yellow-400 text-lg tracking-widest drop-shadow-sm" title={`${rating} out of 5`}>
            {[...Array(5)].map((_, i) => (
                <span key={i}>{i < roundedRating ? '★' : '☆'}</span>
            ))}
        </div>
    );
};

export default StarRating;