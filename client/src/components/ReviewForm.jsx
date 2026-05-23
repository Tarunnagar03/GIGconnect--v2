import React, { useState } from 'react';
import api from '../api';
import StarRatingInput from './StarRatingInput';
import { useAuth } from '../context/AuthContext';

const ReviewForm = ({ gigId, initialReview, onClose, onSubmitSuccess }) => {
    const { auth } = useAuth();
    // --- UPDATED: Default rating is now 0 (blank) ---
    const [rating, setRating] = useState(initialReview ? initialReview.rating : 0);
    const [comment, setComment] = useState(initialReview ? initialReview.comment : '');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // --- ADDED: Validation to ensure a star rating is given ---
        if (rating === 0) {
            setError('Please select a star rating (1-5).');
            return;
        }

        setIsSubmitting(true);
        try {
            if (initialReview) {
                // EDIT EXISTING REVIEW
                await api.put(`/reviews/${initialReview._id}`, { rating, comment });
            } else {
                // CREATE NEW REVIEW
                const endpoint = auth?.user?.role === 'Freelancer' ? '/reviews/client-feedback' : '/reviews';
                await api.post(endpoint, {
                    gigId,
                    rating,
                    comment
                });
            }
            onSubmitSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to submit review.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <form onSubmit={handleSubmit} onClick={e => e.stopPropagation()} className="bg-white p-8 rounded-3xl w-full max-w-lg shadow-2xl animate-slide-up border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h4 className="text-2xl font-extrabold text-gray-800">{initialReview ? 'Edit Review' : 'Leave a Review'}</h4>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors bg-gray-50 hover:bg-red-50 p-2 rounded-full font-bold">✕</button>
                </div>
            {error && <p className="text-red-500 bg-red-100 p-3 rounded text-center mb-4">{error}</p>}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating <span className="text-red-500">*</span></label>
                <StarRatingInput rating={rating} setRating={setRating} />
            </div>
            <div>
                <label htmlFor={`comment-${gigId}`} className="block text-sm font-medium text-gray-700 mb-1">
                    Your Comment <span className="text-gray-400">(Optional)</span>
                </label>
                <textarea
                    id={`comment-${gigId}`}
                    name="comment"
                        rows="4"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience..."
                        className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all bg-gray-50 focus:bg-white resize-none"
                ></textarea>
            </div>
                <div className="flex justify-end gap-3 mt-6">
                <button
                    type="button"
                    onClick={onClose}
                        className="bg-white text-gray-700 font-bold py-3 px-6 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                        className="bg-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-700 disabled:bg-gray-400 shadow-md hover:shadow-lg transition-all"
                >
                    {isSubmitting ? 'Submitting...' : (initialReview ? 'Update Review' : 'Submit Review')}
                </button>
            </div>
        </form>
        </div>
    );
};

export default ReviewForm;