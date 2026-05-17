import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { formatCurrency } from '../utils/currencyFormatter';

const ContractsPage = () => {
    const { auth } = useContext(AuthContext);
    const navigate = useNavigate();
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchContracts = async () => {
            if (!auth.isAuthenticated) return;
            setLoading(true);
            try {
                const endpoint = auth.user.role === 'Client' ? '/gigs/my-gigs' : '/gigs/my-assigned-gigs';
                const res = await api.get(endpoint);
                const activeGigs = (Array.isArray(res.data) ? res.data : []).filter(
                    g => g.status === 'In Progress' || g.status === 'Completed'
                );
                setContracts(activeGigs);
            } catch (err) {
                setError('Failed to load contracts.');
            } finally {
                setLoading(false);
            }
        };
        fetchContracts();
    }, [auth.isAuthenticated, auth.user.role]);

    const generateContractPDF = (gig) => {
        const clientName = gig.client?.companyName || gig.client?.name || 'The Client';
        const freelancerName = gig.assignedFreelancer?.name || 'The Freelancer';
        const date = new Date(gig.updatedAt || gig.createdAt).toLocaleDateString();

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Contract - ${gig.title}</title>
                <style>
                    body { font-family: 'Times New Roman', serif; padding: 50px; color: #111; line-height: 1.6; max-width: 800px; margin: auto; }
                    h1 { text-align: center; font-size: 26px; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 40px; letter-spacing: 1px; }
                    h2 { font-size: 18px; margin-top: 35px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
                    p { text-align: justify; font-size: 15px; margin-bottom: 15px; }
                    .signature-block { display: flex; justify-content: space-between; margin-top: 80px; }
                    .signature-line { border-top: 1px solid #000; width: 45%; padding-top: 10px; font-weight: bold; position: relative; }
                    .digital-stamp { font-family: 'Courier New', Courier, monospace; font-size: 22px; color: #0056b3; position: absolute; top: -35px; left: 10px; opacity: 0.8; font-style: italic; }
                    @media print { body { padding: 20px; } }
                </style>
            </head>
            <body>
                <h1>Independent Contractor Agreement</h1>
                <p>This legally binding Independent Contractor Agreement (the "Agreement") is entered into as of <strong>${date}</strong>, by and between <strong>${clientName}</strong> ("Client") and <strong>${freelancerName}</strong> ("Contractor").</p>
                
                <h2>1. Scope of Work</h2>
                <p>The Contractor agrees to perform the following services for the Client: <strong>${gig.title}</strong>.</p>
                <p>Description of services: ${gig.description}</p>
                
                <h2>2. Payment Terms</h2>
                <p>The Client agrees to pay the Contractor the total sum of <strong>${formatCurrency(gig.budget)}</strong> for the services rendered. Payment will be processed via the GigConnect secure platform escrow.</p>
                
                <h2>3. Ownership & Intellectual Property</h2>
                <p>Upon full payment, the Contractor assigns all rights, title, and interest in the work product generated under this Agreement to the Client without any royalty claims.</p>
                
                <h2>4. Confidentiality</h2>
                <p>The Contractor agrees to keep all Client business information strictly confidential and will not disclose it to any third party without written consent.</p>
                
                <div class="signature-block">
                    <div class="signature-line">
                        <span class="digital-stamp">Digitally Signed</span>
                        Client: ${clientName}
                    </div>
                    <div class="signature-line">
                        <span class="digital-stamp">Digitally Signed</span>
                        Contractor: ${freelancerName}
                    </div>
                </div>
                <div style="text-align: center; margin-top: 60px; font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 2px;">
                    Generated securely via GigConnect Platform on ${new Date().toLocaleString()}
                </div>
                <script>window.onload = function() { window.print(); window.setTimeout(window.close, 500); }</script>
            </body>
            </html>
        `;
        const printWindow = window.open('', '_blank', 'width=800,height=900');
        if (printWindow) { printWindow.document.write(html); printWindow.document.close(); } 
        else { alert("Please allow popups to generate the contract."); }
    };

    return (
        <div className="max-w-5xl mx-auto animate-fade-in pb-12">
            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 mb-6 text-gray-600 hover:text-blue-600 font-semibold bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm hover:shadow transition-all group">
                <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg> Back
            </button>
            <h1 className="text-4xl font-extrabold mb-8 text-gray-800 tracking-tight">My Contracts & Agreements</h1>
            
            {loading ? (<div className="text-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div></div>) : 
             error ? (<div className="text-red-500 text-center py-10 font-bold">{error}</div>) : 
             contracts.length === 0 ? (<div className="bg-white p-12 rounded-3xl text-center shadow-sm border border-gray-100"><span className="text-5xl mb-4 block">📭</span><p className="text-gray-500 font-medium">You don't have any active contracts yet. Contracts are generated automatically when a proposal is accepted.</p></div>) : 
             (<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {contracts.map(c => (
                    <div key={c._id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-lg transition-all group relative overflow-hidden flex flex-col justify-between h-full">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div><div className="flex justify-between items-start mb-3"><span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-100 uppercase tracking-wider">Active Contract</span><span className="text-xs text-gray-400 font-bold">{new Date(c.updatedAt).toLocaleDateString()}</span></div><h3 className="text-xl font-bold text-gray-800 mb-1 line-clamp-2">{c.title}</h3><p className="text-gray-500 text-sm mb-6">Between <span className="font-bold text-gray-700">{c.client?.name || 'Client'}</span> and <span className="font-bold text-gray-700">{c.assignedFreelancer?.name || 'Freelancer'}</span></p></div>
                        <button onClick={() => generateContractPDF(c)} className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-md"><span className="text-lg">📄</span> View Legal Agreement</button>
                    </div>
                ))}
            </div>)}
        </div>
    );
};
export default ContractsPage;