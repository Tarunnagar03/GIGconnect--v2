import React, { useState } from 'react';
import api from '../api';
import StarRatingInput from './StarRatingInput';

const ReviewForm = ({ gigId, onClose, onSubmitSuccess }) => {
    // --- UPDATED: Default rating is now 0 (blank) ---
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
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
            await api.post('/reviews', {
                gigId,
                rating,
                comment
            });
            onSubmitSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to submit review.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg my-4 border animate-fadeIn">
            <h4 className="text-lg font-semibold mb-4">Leave a Review</h4>
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
                    rows="3"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience..."
                    className="w-full p-3 border rounded-md"
                ></textarea>
            </div>
            <div className="flex justify-end gap-3 mt-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="bg-white text-gray-700 py-2 px-4 rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
            </div>
        </form>
    );
};

export default ReviewForm;