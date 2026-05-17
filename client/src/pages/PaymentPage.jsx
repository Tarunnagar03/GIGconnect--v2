/**
 * PaymentPage Component
 * UPDATED: May 6, 2026 - Payment System Enhancement
 * 
 * Features:
 * - Stripe payment integration
 * - Milestone-based payments
 * - Secure checkout form
 * - Payment status tracking
 * - Invoice management
 * - Modern payment UI with custom design
 */

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../api';
import CheckoutForm from '../components/CheckoutForm';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const PaymentPage = () => {
    const { gigId } = useParams();
    const navigate = useNavigate();
    const [clientSecret, setClientSecret] = useState("");
    const [gig, setGig] = useState(null);
    const [milestoneIndex, setMilestoneIndex] = useState('');
    const [error, setError] = useState('');
    const [isAlreadyPaid, setIsAlreadyPaid] = useState(false);

    useEffect(() => {
        const load = async () => {
            setError('');
            setIsAlreadyPaid(false);
            try {
                const res = await api.get(`/gigs/${gigId}`);
                setGig(res.data);

                // Check if the selected item is already paid
                const selectedMilestoneIndex = new URLSearchParams(window.location.search).get('milestone');
                if (selectedMilestoneIndex) {
                    const milestone = res.data.milestones?.[Number(selectedMilestoneIndex)];
                    if (milestone?.status === 'paid') setIsAlreadyPaid(true);
                } else {
                    if (res.data.paymentStatus === 'paid') setIsAlreadyPaid(true);
                }

            } catch (err) {
                setError(err.response?.data?.msg || 'Failed to load gig.');
            }
        };
        load();
    }, [gigId]);

    useEffect(() => {
        const createIntent = async () => {
            setClientSecret('');
            setError('');
            if (isAlreadyPaid) {
                // Don't create a new intent if it's already paid
                return;
            }
            try {
                const payload = { gigId };
                if (milestoneIndex !== '') payload.milestoneIndex = Number(milestoneIndex);
                const res = await api.post("/payments/create-payment-intent", payload);
                setClientSecret(res.data.clientSecret);
            } catch (err) {
                setError(err.response?.data?.msg || "Error creating payment intent.");
            }
        };
        if (gig) createIntent();
    }, [gigId, milestoneIndex, gig, isAlreadyPaid]);

    const options = { clientSecret };

    return (
        <div className="max-w-2xl mx-auto">
            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 mb-6 text-gray-600 hover:text-blue-600 font-semibold bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm hover:shadow hover:border-blue-200 transition-all group focus:outline-none">
                <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Back to Gig
            </button>

            <div className="gc-card p-8">
                <h1 className="text-3xl font-bold mb-2 text-center">Complete Your Payment</h1>
                {gig && (
                    <p className="text-center text-slate-600 mb-6">
                        {gig.title} • Budget: <span className="font-semibold">₹{gig.budget}</span> • Status: {gig.status}
                    </p>
                )}

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
                        {error}
                    </div>
                )}

                {isAlreadyPaid && (
                    <div className="bg-green-100 border-l-4 border-green-500 text-green-800 p-6 rounded-lg shadow-md text-center">
                        <h2 className="font-bold text-xl mb-2">Payment Complete!</h2>
                        <p>This gig or milestone has already been paid for. Thank you!</p>
                    </div>
                )}

                {gig?.milestones?.length ? (
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Choose what to pay</label>
                        <select
                            className="gc-input"
                            value={milestoneIndex}
                            onChange={(e) => setMilestoneIndex(e.target.value)}
                        >
                            <option value="">Full payment (entire gig)</option>
                            {gig.milestones.map((m, idx) => (
                                <option key={idx} value={idx} disabled={m.status === 'paid'}>
                                    Milestone {idx + 1}: {m.title} — ₹{m.amount} {m.status === 'paid' ? '(paid)' : ''}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-500 mt-2">
                            Milestones allow staged payments; paid milestones are locked.
                        </p>
                    </div>
                ) : null}

                {clientSecret && !isAlreadyPaid ? (
                    <Elements options={options} stripe={stripePromise}>
                        <CheckoutForm
                            onSuccess={() => {
                                alert('Payment successful!');
                                navigate('/history');
                            }}
                        />
                    </Elements>
                ) : (
                    !error && !isAlreadyPaid && <p className="text-center text-slate-500">Preparing payment...</p>
                )}
            </div>
        </div>
    );
};

export default PaymentPage;