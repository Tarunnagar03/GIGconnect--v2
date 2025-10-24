import React from 'react';
import { Link } from 'react-router-dom';

const ContactPage = () => (
    <div className="max-w-4xl mx-auto">
        <Link to="/dashboard" className="inline-block mb-6 text-blue-600 hover:underline">
            &larr; Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
        <div className="bg-white p-8 rounded-lg shadow-md">
            <p className="text-lg text-gray-700">
                This is a placeholder for your internal contact page. You can add a support form or display your contact information here.
            </p>
        </div>
    </div>
);

export default ContactPage;