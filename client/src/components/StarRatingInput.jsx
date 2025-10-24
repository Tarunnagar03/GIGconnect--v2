import React, { useState } from 'react';

const StarRatingInput = ({ rating, setRating }) => {
    const [hover, setHover] = useState(0);

    return (
        <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
                {[...Array(5)].map((star, index) => {
                    const starValue = index + 1;
                    return (
                        <button
                            type="button"
                            key={starValue}
                            className={`text-3xl transition-colors ${starValue <= (hover || rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                            onClick={() => setRating(starValue)}
                            onMouseEnter={() => setHover(starValue)}
                            onMouseLeave={() => setHover(0)}
                            aria-label={`${starValue} star`}
                        >
                            ★
                        </button>
                    );
                })}
            </div>
            {/* --- ADDED: Show numeric rating --- */}
            {rating > 0 && (
                <span className="text-lg font-semibold text-gray-600">
                    ({rating}/5)
                </span>
            )}
        </div>
    );
};

export default StarRatingInput;