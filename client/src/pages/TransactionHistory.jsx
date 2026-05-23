import React from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';

const TransactionHistory = () => {
    const { auth } = useAuth();

    const { data: transactions = [], isLoading: loading } = useQuery({
        queryKey: ['transactionHistory'],
        queryFn: async () => {
            const res = await api.get('/transactions/me');
            return res.data;
        },
        enabled: auth.isAuthenticated
    });

    const formatDate = (dateString) => new Date(dateString).toLocaleString();

    const getStatusClass = (status) => {
        switch (status) {
            case 'successful': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'failed': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return <div className="text-center mt-10">Loading transaction history...</div>;
    }

    return (
        <div className="max-w-5xl mx-auto animate-fade-in">
            <Link to="/settings" className="inline-flex items-center gap-2 mb-6 text-gray-600 hover:text-blue-600 font-semibold bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm hover:shadow hover:border-blue-200 transition-all group">
                <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Back to Settings
            </Link>
            <h1 className="text-4xl font-extrabold mb-8 text-gray-800 tracking-tight">Transaction History</h1>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {transactions.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {transactions.map(t => (
                                <tr key={t._id} className="hover:bg-gray-50 transition-colors duration-150">
                                    <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-500">{formatDate(t.createdAt)}</td>
                                    <td className="px-8 py-5 whitespace-nowrap text-sm font-medium text-gray-800 capitalize">{t.type}</td>
                                    <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-gray-900">₹{t.amount.toFixed(2)}</td>
                                    <td className="px-8 py-5 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(t.status)}`}>
                                            {t.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="p-12 text-center">
                        <div className="w-20 h-20 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                        <p className="text-gray-500 text-lg">You have no transactions yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TransactionHistory;