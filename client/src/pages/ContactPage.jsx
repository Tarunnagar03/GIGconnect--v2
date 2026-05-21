import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { ChevronDownIcon } from '../components/Icons';

const ContactPage = () => {
    const [contactData, setContactData] = useState({ name: '', email: '', subject: 'General Inquiry', message: '' });
    const [contactError, setContactError] = useState('');
    const [contactSuccess, setContactSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const onContactChange = e => setContactData({ ...contactData, [e.target.name]: e.target.value });

    const onContactSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setContactError('');
        setContactSuccess('');
        try {
            const res = await api.post('/contact', contactData);
            setContactSuccess(res.data.msg || 'Message sent successfully!');
            setContactData({ name: '', email: '', subject: 'General Inquiry', message: '' });
        } catch (err) {
            setContactError(err.response?.data?.msg || 'Failed to send message.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto pb-12 animate-fade-in">
            <Link to="/dashboard" className="inline-flex items-center gap-2 mb-8 text-gray-600 hover:text-blue-600 font-black bg-white border border-gray-200 px-5 py-2.5 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all group">
                <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Back to Dashboard
            </Link>

            <div className="bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col lg:flex-row overflow-hidden">
                {/* Left Column: Contact Info */}
                <div className="lg:w-2/5 bg-gradient-to-br from-gray-900 via-slate-800 to-black text-white p-10 lg:p-14 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-white opacity-5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-40 h-40 bg-blue-500 opacity-20 rounded-full blur-3xl"></div>

                    <div className="relative z-10">
                        <h3 className="text-4xl lg:text-5xl font-black mb-6 tracking-tighter drop-shadow-sm">Let's Talk.</h3>
                        <p className="text-gray-300 text-lg mb-10 leading-relaxed font-medium">
                            Have a question, found a bug, or need a custom enterprise solution? Drop us a message and our team will get back to you within 2 hours.
                        </p>

                        <div className="space-y-8">
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
                                    <span className="text-2xl">📧</span>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-black uppercase tracking-widest mb-1">Email Us</p>
                                    <p className="text-lg font-bold text-white tracking-wide">support@gigconnect.com</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
                                    <span className="text-2xl">📍</span>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-black uppercase tracking-widest mb-1">Location</p>
                                    <p className="text-lg font-bold text-white tracking-wide">New Delhi, India</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 mt-16 pt-8 border-t border-white/10">
                        <div className="flex items-center gap-3">
                            <span className="relative flex h-3.5 w-3.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]"></span>
                            </span>
                            <p className="text-sm font-black text-gray-300 tracking-wide uppercase">24/7 Premium Support</p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Form */}
                <div className="lg:w-3/5 p-10 lg:p-14 bg-white">
                    <form onSubmit={onContactSubmit} className="space-y-6">
                        {contactSuccess && <div className="bg-green-50 border-2 border-green-200 text-green-800 px-6 py-4 rounded-2xl text-center font-black shadow-sm">{contactSuccess}</div>}
                        {contactError && <div className="bg-red-50 border-2 border-red-200 text-red-800 px-6 py-4 rounded-2xl text-center font-black shadow-sm">{contactError}</div>}

                        <div className="grid md:grid-cols-2 gap-6">
                            <div><label className="block text-sm font-bold text-gray-700 mb-2">Your Name <span className="text-red-500">*</span></label><input type="text" name="name" value={contactData.name} onChange={onContactChange} required className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white font-medium" placeholder="John Doe" /></div>
                            <div><label className="block text-sm font-bold text-gray-700 mb-2">Your Email <span className="text-red-500">*</span></label><input type="email" name="email" value={contactData.email} onChange={onContactChange} required className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white font-medium" placeholder="you@example.com" /></div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">What can we help you with? <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <select name="subject" value={contactData.subject} onChange={onContactChange} required className="appearance-none w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white text-gray-800 font-bold cursor-pointer"><option value="General Inquiry">General Inquiry</option><option value="Billing Support">Billing Support</option><option value="Enterprise Sales">Enterprise Sales</option><option value="Report a Bug">Report a Bug</option></select>
                                <ChevronDownIcon />
                            </div>
                        </div>

                        <div><label className="block text-sm font-bold text-gray-700 mb-2">Message <span className="text-neutral-400 font-normal">(Optional)</span></label><textarea name="message" rows="5" value={contactData.message} onChange={onContactChange} className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white resize-none font-medium" placeholder="Explain your issue in detail..."></textarea></div>

                        <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white font-black py-4.5 rounded-xl hover:bg-blue-700 transition-all hover:-translate-y-1 shadow-md hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed text-lg mt-4 flex justify-center items-center gap-3 uppercase tracking-wider">
                            {isSubmitting ? <><span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span> Sending...</> : 'Send Message'}
                        </button>

                        <p className="text-center text-xs text-gray-400 mt-6 flex items-center justify-center gap-1.5 font-bold"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg> Your information is secure and encrypted.</p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;