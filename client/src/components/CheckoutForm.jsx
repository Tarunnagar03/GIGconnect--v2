/**
 * CheckoutForm Component
 * UPDATED: May 6, 2026 - Stripe Payment UI Enhancement
 * 
 * Features:
 * - Stripe payment element integration
 * - Secure payment processing
 * - Loading states during payment
 * - Error handling and display
 * - Modern checkout UI
 * - Payment confirmation
 */

import React, { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../api';

const CheckoutForm = ({ onSuccess }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [message, setMessage] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setIsProcessing(true);

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            redirect: 'if_required',
        });

        if (error) {
            setMessage(error.message);
        } else if (paymentIntent?.status === 'succeeded') {
            // Confirm with backend (fallback when webhook isn't configured in dev)
            try {
                await api.post('/payments/confirm-payment-intent', { paymentIntentId: paymentIntent.id });
            } catch (err) {
                console.error(err);
            }
            setMessage(null);
            onSuccess?.(paymentIntent);
        } else {
            setMessage(`Payment status: ${paymentIntent?.status || 'unknown'}`);
        }

        setIsProcessing(false);
    };

    return (
        <form id="payment-form" onSubmit={handleSubmit}>
            <PaymentElement id="payment-element" />
            <button disabled={isProcessing || !stripe || !elements} id="submit" className="w-full mt-6 bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
                <span>{isProcessing ? "Processing..." : "Pay now"}</span>
            </button>
            {message && <div className="text-red-500 mt-4 text-center">{message}</div>}
        </form>
    );
};

export default CheckoutForm;