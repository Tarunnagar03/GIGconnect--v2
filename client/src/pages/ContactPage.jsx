import React from 'react';
import { Link } from 'react-router-dom';

const ContactPage = () => (
    <div className="max-w-4xl mx-auto">
        <Link to="/dashboard" className="inline-flex items-center gap-2 mb-6 text-gray-600 hover:text-blue-600 font-semibold bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm hover:shadow hover:border-blue-200 transition-all group">
            <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Back to Dashboard
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