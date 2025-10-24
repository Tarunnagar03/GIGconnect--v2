import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useParams } from 'react-router-dom';
import api from '../api';
import CheckoutForm from '../components/CheckoutForm';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const PaymentPage = () => {
    const { gigId } = useParams();
    const [clientSecret, setClientSecret] = useState("");

    useEffect(() => {
        api.post("/payments/create-payment-intent", { gigId })
            .then((res) => setClientSecret(res.data.clientSecret))
            .catch(err => console.error("Error creating payment intent:", err));
    }, [gigId]);

    const options = { clientSecret };

    return (
        <div className="max-w-lg mx-auto bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-3xl font-bold mb-6 text-center">Complete Your Payment</h1>
            {clientSecret && (
                <Elements options={options} stripe={stripePromise}>
                    <CheckoutForm />
                </Elements>
            )}
        </div>
    );
};

export default PaymentPage;