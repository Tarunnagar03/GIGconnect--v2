import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const BillingPage = () => {
    const { auth } = useContext(AuthContext);
    const navigate = useNavigate();
    const isFreelancer = auth?.user?.role === 'Freelancer';

    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        panNumber: '',
        upiId: '',
        bankAccount: '',
        ifscCode: '',
        gstNumber: '',
        billingAddress: '123 Tech Park, Silicon Valley, CA'
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = (e) => {
        e.preventDefault();
        setIsSaving(true);
        // Simulate API Call to save billing preferences
        setTimeout(() => {
            setIsSaving(false);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 4000);
        }, 1200);
    };

    return (
        <div className="max-w-4xl mx-auto pb-12 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate('/settings')} className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors shadow-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                </button>
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Billing & Taxes</h1>
                    <p className="text-sm text-gray-500 mt-1 font-medium">Manage your {isFreelancer ? 'payout methods and tax identity' : 'billing address and payment methods'}.</p>
                </div>
            </div>

            {/* Global Success Toast */}
            {showSuccess && (
                <div className="mb-6 bg-green-50 border border-green-200 p-4 rounded-2xl flex items-center gap-3 animate-slide-up shadow-sm">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">✓</div>
                    <p className="text-green-800 font-bold text-sm">Your billing and tax information has been updated successfully.</p>
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-8">
                
                {/* --- FREELANCER SPECIFIC UI --- */}
                {isFreelancer && (
                    <>
                        {/* Payout Methods Card */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><span className="text-xl">💸</span> Payout Methods</h2>
                                <span className="bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md">Primary</span>
                            </div>
                            <div className="p-6 md:p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">UPI ID (Fastest)</label>
                                        <input type="text" name="upiId" value={formData.upiId} onChange={handleChange} placeholder="e.g. username@okhdfcbank" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Bank Account Number</label>
                                        <input type="text" name="bankAccount" value={formData.bankAccount} onChange={handleChange} placeholder="000123456789" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">IFSC Code</label>
                                        <input type="text" name="ifscCode" value={formData.ifscCode} onChange={handleChange} placeholder="HDFC0001234" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tax Identity Card */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><span className="text-xl">🧾</span> Tax Identity Information</h2>
                            </div>
                            <div className="p-6 md:p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">PAN Number <span className="text-red-500">*</span></label>
                                        <input type="text" name="panNumber" required value={formData.panNumber} onChange={handleChange} placeholder="ABCDE1234F" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none uppercase" />
                                        <p className="text-[10px] text-gray-500 font-medium mt-1">Required for generating legal invoices.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">GSTIN (Optional)</label>
                                        <input type="text" name="gstNumber" value={formData.gstNumber} onChange={handleChange} placeholder="22AAAAA0000A1Z5" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none uppercase" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* --- CLIENT SPECIFIC UI --- */}
                {!isFreelancer && (
                    <>
                        {/* Billing Address Card */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><span className="text-xl">🏢</span> Company Billing Details</h2>
                            </div>
                            <div className="p-6 md:p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Registered Billing Address</label>
                                    <textarea name="billingAddress" rows="3" value={formData.billingAddress} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none resize-none"></textarea>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Company GSTIN / VAT ID</label>
                                        <input type="text" name="gstNumber" value={formData.gstNumber} onChange={handleChange} placeholder="22AAAAA0000A1Z5" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none uppercase" />
                                        <p className="text-[10px] text-gray-500 font-medium mt-1">If provided, this will appear on your freelancer invoices.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Saved Payment Methods */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><span className="text-xl">💳</span> Payment Methods</h2>
                                <button type="button" className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">+ Add New Card</button>
                            </div>
                            <div className="p-6 md:p-8">
                                <div className="border border-gray-200 rounded-2xl p-4 flex items-center justify-between hover:border-blue-300 transition-colors cursor-pointer group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center text-xs font-black text-gray-500 border border-gray-200">VISA</div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">•••• •••• •••• 4242</p>
                                            <p className="text-xs text-gray-500 font-medium">Expires 12/28</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">Default</span>
                                        <button type="button" className="text-gray-400 hover:text-red-500 transition-colors">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Action Footer */}
                <div className="flex justify-end pt-4">
                    <button 
                        type="submit" 
                        disabled={isSaving}
                        className="bg-gray-900 text-white font-bold py-3.5 px-8 rounded-xl hover:bg-black transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Saving Details...
                            </>
                        ) : (
                            'Save Billing Preferences'
                        )}
                    </button>
                </div>

            </form>
        </div>
    );
};

export default BillingPage;