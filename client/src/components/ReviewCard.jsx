import React from 'react';
import StarRating from './StarRating';
import { useAuth } from '../context/AuthContext';

// Card to display a review after it's submitted
const ReviewCard = ({ review, onEditClick }) => {
  const { auth } = useAuth();
  const reviewDate = new Date(review.createdAt).toLocaleDateString();
  const reviewerId = review.reviewer?._id || review.reviewer;
  const isOwner = auth?.user?.id && String(auth.user.id) === String(reviewerId);

  return (
    <div className="bg-white p-6 rounded-2xl my-4 border border-gray-100 shadow-sm relative group transition-all hover:shadow-md">
        <div className="flex justify-between items-start mb-3">
            <div>
                <span className="font-extrabold text-gray-900">{review.reviewer?.name || 'Your Review'}</span>
                <div className="flex items-center gap-3 mt-1">
                    <StarRating rating={review.rating} />
                    <span className="text-xs font-bold text-gray-400">{reviewDate}</span>
                    {review.isEdited && <span className="text-xs font-medium italic text-gray-400">(Edited)</span>}
                </div>
            </div>
            {isOwner && onEditClick && (
                <button onClick={() => onEditClick(review)} className="text-gray-400 hover:text-blue-600 transition-colors bg-gray-50 hover:bg-blue-50 p-2 rounded-xl opacity-0 group-hover:opacity-100 focus:opacity-100 outline-none shadow-sm" title="Edit Review">
                    ✏️ Edit
                </button>
            )}
        </div>
        {review.comment && (
            <p className="text-gray-700 mt-3 text-[15px] leading-relaxed">"{review.comment}"</p>
        )}
    </div>
  );
};

export default ReviewCard;