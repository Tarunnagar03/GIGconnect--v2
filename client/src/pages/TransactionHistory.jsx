import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

const TransactionHistory = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const { auth } = useContext(AuthContext);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                // This API endpoint was created in a previous step
                const res = await api.get('/transactions/me');
                setTransactions(res.data);
            } catch (err) {
                console.error("Error fetching transaction history", err);
            } finally {
                setLoading(false);
            }
        };

        if (auth.isAuthenticated) {
            fetchHistory();
        }
    }, [auth.isAuthenticated]);

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
        <div className="max-w-4xl mx-auto">
            <Link to="/settings" className="inline-block mb-6 text-blue-600 hover:underline">
                &larr; Back to Settings
            </Link>
            <h1 className="text-3xl font-bold mb-6">Transaction History</h1>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {transactions.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {transactions.map(t => (
                                <tr key={t._id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(t.createdAt)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 capitalize">{t.type}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">${t.amount.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(t.status)}`}>
                                            {t.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="p-6 text-gray-500 text-center">You have no transactions yet.</p>
                )}
            </div>
        </div>
    );
};

export default TransactionHistory;