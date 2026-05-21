import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

const MyTicketsPage = () => {
    const { auth } = useContext(AuthContext);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchTickets = async () => {
            try {
                const res = await api.get('/contact/my-tickets');
                setTickets(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                setError('Failed to load tickets.');
            } finally {
                setLoading(false);
            }
        };

        if (auth.isAuthenticated) {
            fetchTickets();
        }
    }, [auth.isAuthenticated]);

    if (loading) {
        return <div className="text-center mt-20 text-gray-500 font-bold animate-pulse">Loading your tickets...</div>;
    }

    return (
        <div className="max-w-5xl mx-auto animate-fade-in pb-12">
            <Link to="/settings" className="inline-flex items-center gap-2 mb-6 text-gray-600 hover:text-blue-600 font-semibold bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm hover:shadow transition-all group">
                <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg> Back to Settings
            </Link>
            
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">My Support Tickets</h1>
                <Link to="/contact-us" className="bg-blue-600 text-white font-bold py-2.5 px-6 rounded-xl hover:bg-blue-700 transition-all shadow-md hover:-translate-y-1">
                    + New Ticket
                </Link>
            </div>
            
            {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 font-bold">{error}</div>}

            {tickets.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center">
                    <span className="text-5xl mb-4 block">🎫</span>
                    <p className="text-gray-500 font-medium text-lg">You don't have any support tickets yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {tickets.map(ticket => (
                        <div key={ticket._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="bg-gray-100 text-gray-600 text-[10px] px-2.5 py-1 rounded uppercase tracking-widest font-black">#TKT-{ticket._id.slice(-6).toUpperCase()}</span>
                                    <span className="text-xs text-gray-400 font-bold">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 mb-1">{ticket.subject || 'General Inquiry'}</h3>
                                <p className="text-sm text-gray-600 line-clamp-2">{ticket.message || 'No additional details provided.'}</p>
                            </div>
                            <div className="shrink-0 flex flex-col gap-2 items-end">
                                <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-100 shadow-sm">Submitted</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyTicketsPage;