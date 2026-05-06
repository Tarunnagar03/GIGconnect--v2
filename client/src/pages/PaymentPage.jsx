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

    useEffect(() => {
        const load = async () => {
            setError('');
            try {
                const res = await api.get(`/gigs/${gigId}`);
                setGig(res.data);
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
    }, [gigId, milestoneIndex, gig]);

    const options = { clientSecret };

    return (
        <div className="max-w-2xl mx-auto">
            <Link to={`/gigs/${gigId}`} className="inline-block mb-6 text-blue-600 hover:underline">
                &larr; Back to Gig
            </Link>

            <div className="gc-card p-8">
                <h1 className="text-3xl font-bold mb-2 text-center">Complete Your Payment</h1>
                {gig && (
                    <p className="text-center text-slate-600 mb-6">
                        {gig.title} • Budget: <span className="font-semibold">${gig.budget}</span> • Status: {gig.status}
                    </p>
                )}

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
                        {error}
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
                                    Milestone {idx + 1}: {m.title} — ${m.amount} {m.status === 'paid' ? '(paid)' : ''}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-500 mt-2">
                            Milestones allow staged payments; paid milestones are locked.
                        </p>
                    </div>
                ) : null}

                {clientSecret ? (
                    <Elements options={options} stripe={stripePromise}>
                        <CheckoutForm
                            onSuccess={() => {
                                alert('Payment successful!');
                                navigate('/history');
                            }}
                        />
                    </Elements>
                ) : (
                    !error && <p className="text-center text-slate-500">Preparing payment...</p>
                )}
            </div>
        </div>
    );
};

export default PaymentPage;