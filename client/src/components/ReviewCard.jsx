import React from 'react';
import StarRating from './StarRating';

// Card to display a review after it's submitted
const ReviewCard = ({ review }) => {
  const reviewDate = new Date(review.createdAt).toLocaleDateString();

  return (
    <div className="bg-gray-50 p-4 rounded-lg my-4 border">
        <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-gray-800">Your Review</span>
            <span className="text-sm text-gray-500">{reviewDate}</span>
        </div>
        <StarRating rating={review.rating} />
        {review.comment && (
            <p className="text-gray-600 mt-2 italic">"{review.comment}"</p>
        )}
    </div>
  );
};

export default ReviewCard;