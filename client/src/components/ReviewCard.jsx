import React from 'react';

// Display-only Star Rating Component
const StarRating = ({ rating }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span key={i} className={`text-xl ${i <= rating ? 'text-yellow-400' : 'text-gray-300'}`}>
        ★
      </span>
    );
  }
  return <div className="flex">{stars}</div>;
};

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