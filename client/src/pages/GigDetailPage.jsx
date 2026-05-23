import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currencyFormatter';
import ErrorBoundary from '../components/ErrorBoundary';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const GigDetailPage = () => {
    const { gigId } = useParams();
    const { auth } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    const queryTab = new URLSearchParams(location.search).get('tab');
    const [activeTab, setActiveTab] = useState(queryTab || 'overview');
    
    const [deliverableText, setDeliverableText] = useState('');
    const [deliverableFile, setDeliverableFile] = useState(null);
    
    // --- TIME TRACKER STATE ---
    const [isTracking, setIsTracking] = useState(false);
    const [trackedSeconds, setTrackedSeconds] = useState(0);

    const currentUserId = auth.user?.id || auth.user?._id;

    // --- REACT QUERY DATA FETCHING ---
    const { data: gig, isLoading: loading, error: queryError } = useQuery({
        queryKey: ['gig', gigId],
        queryFn: async () => (await api.get(`/gigs/${gigId}`)).data
    });

    const isClientOwner = currentUserId === gig?.client?._id;

    const { data: profileData } = useQuery({
        queryKey: ['freelancerProfile', currentUserId],
        queryFn: async () => (await api.get('/profiles/me')).data,
        enabled: auth.user?.role === 'Freelancer' && !!currentUserId,
        retry: false
    });

    const { data: proposalCount = 0 } = useQuery({
        queryKey: ['proposalCount', gigId],
        queryFn: async () => (await api.get(`/proposals/gig/${gigId}`)).data.length,
        enabled: !!gig && isClientOwner
    });

    const { data: clientReviews = [] } = useQuery({
        queryKey: ['clientReviews', gig?.client?._id],
        queryFn: async () => (await api.get(`/reviews/client/${gig.client._id}`)).data,
        enabled: !!gig?.client?._id
    });

    const error = queryError ? 'Gig not found or an error occurred.' : '';
    const mySkills = profileData?.skills || [];
    const workspaceDeliverables = gig?.deliverables ? [...gig.deliverables].sort((a,b) => new Date(b.submittedAt) - new Date(a.submittedAt)) : [];

    // Sync active tab state if URL changes externally
    useEffect(() => {
        if (queryTab && ['overview', 'workspace', 'payments'].includes(queryTab)) {
            setActiveTab(queryTab);
        }
    }, [queryTab]);

    // Time Tracker Interval
    useEffect(() => {
        let interval = null;
        if (isTracking) {
            interval = setInterval(() => setTrackedSeconds(s => s + 1), 1000);
        } else if (!isTracking && trackedSeconds !== 0) {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isTracking, trackedSeconds]);

    const handleComplete = async () => {
        if (!window.confirm("Mark this gig as complete?")) return;
        try {
            const res = await api.put(`/gigs/complete/${gigId}`);
            queryClient.setQueryData(['gig', gigId], res.data);
            alert('Gig marked as complete!');
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            alert('Failed to complete gig.');
        }
    };

    const handleRevertComplete = async () => {
        if (!window.confirm("Undo completion? This will move the gig back to 'In Progress' and allow further actions.")) return;
        try {
            const res = await api.put(`/gigs/revert-complete/${gigId}`);
            queryClient.setQueryData(['gig', gigId], res.data);
            alert('Gig reverted to In Progress!');
        } catch (err) {
            console.error(err);
            alert('Failed to revert gig status.');
        }
    };

    // --- AUTO-INVOICE GENERATOR ---
    const handleGenerateInvoice = () => {
        if (!gig) return;
        const invoiceHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Invoice - ${gig.title}</title>
                <style>
                    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #111827; max-width: 800px; margin: 0 auto; }
                    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 40px; }
                    .logo { font-size: 28px; font-weight: 900; color: #4F46E5; letter-spacing: -1px; }
                    .invoice-details { text-align: right; color: #6B7280; font-size: 14px; }
                    .invoice-details strong { color: #111827; }
                    .grid { display: flex; justify-content: space-between; margin-bottom: 40px; }
                    .col { width: 45%; }
                    .col h3 { font-size: 12px; text-transform: uppercase; color: #9CA3AF; letter-spacing: 1px; margin-bottom: 8px; }
                    .col p { margin: 0; font-size: 15px; font-weight: 500; line-height: 1.5; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
                    th { text-align: left; padding: 12px 16px; background: #F3F4F6; color: #374151; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
                    td { padding: 16px; border-bottom: 1px solid #E5E7EB; font-size: 15px; font-weight: 500; }
                    .amount { text-align: right; }
                    .total { text-align: right; font-size: 24px; font-weight: 900; color: #10B981; margin-top: 20px; }
                    .footer { text-align: center; margin-top: 80px; font-size: 14px; color: #9CA3AF; border-top: 1px solid #e5e7eb; padding-top: 20px; }
                    @media print { body { padding: 20px; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo">GigConnect</div>
                    <div class="invoice-details">
                        <p><strong>INVOICE #</strong> INV-${gig._id.substring(0, 8).toUpperCase()}</p>
                        <p><strong>DATE</strong> ${new Date().toLocaleDateString()}</p>
                        <p><strong>STATUS</strong> <span style="color: #10B981;">PAID IN FULL</span></p>
                    </div>
                </div>
                <div class="grid">
                    <div class="col">
                        <h3>Billed To (Client)</h3>
                        <p>${gig.client?.companyName || gig.client?.name}</p>
                        <p style="color: #6B7280; font-size: 14px;">${gig.client?.email || ''}</p>
                    </div>
                    <div class="col" style="text-align: right;">
                        <h3>Paid To (Freelancer)</h3>
                        <p>${gig.assignedFreelancer?.name || 'Assigned Freelancer'}</p>
                        <p style="color: #6B7280; font-size: 14px;">Platform Escrow Provider</p>
                    </div>
                </div>
                <table>
                    <thead><tr><th>Description</th><th class="amount">Amount</th></tr></thead>
                    <tbody>
                        <tr>
                            <td>Professional Services for: <strong>${gig.title}</strong><br/><span style="font-size: 13px; color: #6B7280; margin-top: 4px; display: inline-block;">Project ID: ${gig._id}</span></td>
                            <td class="amount">${formatCurrency(gig.budget)}</td>
                        </tr>
                    </tbody>
                </table>
                <div class="total">Total Paid: ${formatCurrency(gig.budget)}</div>
                <div class="footer">
                    <p>This is a computer-generated tax invoice and requires no physical signature.</p>
                    <p>Thank you for doing business on GigConnect.</p>
                </div>
                <script>window.onload = function() { window.print(); window.setTimeout(window.close, 500); }</script>
            </body>
            </html>
        `;
        const printWindow = window.open('', '_blank', 'width=800,height=900');
        if (printWindow) {
            printWindow.document.write(invoiceHtml);
            printWindow.document.close();
        } else {
            alert("Please allow popups to generate and download the invoice.");
        }
    };

    if (loading) return <div className="text-center mt-20">Loading gig details...</div>;
    if (error || !gig) return <div className="text-center mt-20 text-red-500">{error || 'Gig not found.'}</div>;

    const formattedDate = new Date(gig.date || gig.createdAt || Date.now()).toLocaleDateString();

    const isFreelancer = auth.user?.role === 'Freelancer';
    const isAssignedFreelancer = isFreelancer && gig.assignedFreelancer && 
        (gig.assignedFreelancer._id === currentUserId || gig.assignedFreelancer === currentUserId);
    
    const avgClientRating = clientReviews.length > 0 
        ? (clientReviews.reduce((acc, r) => acc + r.rating, 0) / clientReviews.length).toFixed(1) 
        : 0;

    const lowerMySkills = Array.isArray(mySkills) ? mySkills.map(s => (s || '').toLowerCase()) : [];

    // --- WORKSPACE HANDLERS ---
    const handleDeliverableSubmit = async (e) => {
        e.preventDefault();
        if (!deliverableText.trim() && !deliverableFile) return;
        
        try {
            let fileData = null;
            let fileName = null;

            if (deliverableFile) {
                fileName = deliverableFile.name;
                fileData = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(deliverableFile);
                });
            }

            const res = await api.post(`/gigs/${gigId}/deliverables`, {
                text: deliverableText,
                fileName,
                fileData
            });

            queryClient.setQueryData(['gig', gigId], old => ({ ...old, deliverables: res.data }));
            setDeliverableText('');
            setDeliverableFile(null);
        } catch (err) {
            console.error("Error submitting deliverable:", err);
            alert(err.response?.data?.msg || "Failed to submit deliverable.");
        }
    };

    const handleLogTime = async () => {
        const hours = Math.floor(trackedSeconds / 3600);
        const minutes = Math.floor((trackedSeconds % 3600) / 60);
        
        try {
            const createRes = await api.post(`/gigs/${gigId}/deliverables`, {
                text: `⏱️ Logged Time: ${hours}h ${minutes}m\nNote: Work session completed.`,
            });
            
            // Auto-approve the time log to authorize immediate payout
            const newLog = createRes.data[0]; 
            const approvedRes = await api.put(`/gigs/${gigId}/deliverables/${newLog._id}/status`, { status: 'Approved' });

            queryClient.setQueryData(['gig', gigId], old => ({ ...old, deliverables: approvedRes.data }));
            setIsTracking(false);
            setTrackedSeconds(0);
        } catch (err) {
            console.error(err);
            alert("Failed to log time.");
        }
    };

    const handleApproveWork = async (id) => {
        if (!window.confirm("Approve this delivery? (This will authorize payment release)")) return;
        try {
            const res = await api.put(`/gigs/${gigId}/deliverables/${id}/status`, { status: 'Approved' });
            queryClient.setQueryData(['gig', gigId], old => ({ ...old, deliverables: res.data }));
        } catch (err) {
            console.error(err);
            alert("Failed to approve work.");
        }
    };

    const handleRevision = async (id) => {
        const reason = prompt("What needs to be changed? (Client Feedback)");
        if (reason) {
            try {
                const res = await api.put(`/gigs/${gigId}/deliverables/${id}/status`, { status: 'Revision Requested', feedback: reason });
                queryClient.setQueryData(['gig', gigId], old => ({ ...old, deliverables: res.data }));
            } catch (err) {
                console.error(err);
                alert("Failed to request revision.");
            }
        }
    };

    const handleTabChange = (tabName) => {
        setActiveTab(tabName);
        navigate(`?tab=${tabName}`, { replace: true });
    }

    return (
        <div className="max-w-6xl mx-auto animate-fade-in pb-24 lg:pb-12">
            
            {/* --- SMART BACK BUTTON --- */}
            <button 
                onClick={() => {
                    if (auth?.user?.role === 'Admin') {
                        navigate('/admin?tab=gigs'); // Admins go back to Active Escrows
                    } else {
                        navigate(-1); // Regular users go back normally
                    }
                }} 
                className="inline-flex items-center gap-2 mb-6 text-gray-600 hover:text-blue-600 font-semibold bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm hover:shadow hover:border-blue-200 transition-all group"
            >
                <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Back
            </button>

            <div className="flex flex-col lg:flex-row gap-8">
                
                {/* --- LEFT SIDE: Main Content --- */}
                <div className="flex-1 space-y-6">
                    {/* Tabs Header */}
                    {(isClientOwner || isAssignedFreelancer) && (gig.status === 'In Progress' || gig.status === 'Completed') && (
                        <div className="flex space-x-2 border-b border-gray-200 mb-2 overflow-x-auto scrollbar-hide bg-white px-6 pt-4 rounded-3xl shadow-sm border border-gray-100">
                            <button onClick={() => handleTabChange('overview')} className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors focus:outline-none whitespace-nowrap ${activeTab === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Overview</button>
                            <button onClick={() => handleTabChange('workspace')} className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors focus:outline-none whitespace-nowrap ${activeTab === 'workspace' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Workspace 📂</button>
                            <button onClick={() => handleTabChange('payments')} className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors focus:outline-none whitespace-nowrap ${activeTab === 'payments' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Payments 💳</button>
                        </div>
                    )}

                    <ErrorBoundary componentName="Overview Tab">
                    {activeTab === 'overview' && (
                        <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden animate-fade-in">
                            {/* Top decorative gradient */}
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                        
                        <div className="flex flex-wrap gap-2 mb-6">
                            <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md border ${
                                gig.status === 'Open' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                gig.status === 'In Progress' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                'bg-green-50 text-green-700 border-green-200'
                            }`}>
                                {gig.status}
                            </span>
                            <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md border bg-gray-50 text-gray-500 border-gray-200">
                                Posted {formattedDate}
                            </span>
                        </div>

                        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tight">
                            {gig.title}
                        </h1>

                        <div className="border-t border-b border-gray-100 py-6 my-6">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Project Description</h3>
                            <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">
                                {gig.description}
                            </p>
                        </div>

                        {/* Skills Section with AI Match Highlighting */}
                        {gig.skills && gig.skills.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Skills & Expertise Required</h3>
                                <div className="flex flex-wrap gap-2">
                                    {gig.skills.map((skill, index) => {
                                        const isMatch = isFreelancer && lowerMySkills.includes(skill.toLowerCase());
                                        return (
                                        <span 
                                            key={skill} 
                                                className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                                                    isMatch 
                                                        ? 'bg-green-50 text-green-700 border-green-200 shadow-sm flex items-center gap-1.5' 
                                                        : 'bg-gray-50 text-gray-600 border-gray-200'
                                                }`}
                                            >
                                                {isMatch && <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                                                {skill}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        </div>
                    )}
                    </ErrorBoundary>

                    <ErrorBoundary componentName="Workspace Tab">
                    {activeTab === 'workspace' && (
                        <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden animate-fade-in">
                            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                                <h2 className="text-2xl font-extrabold text-gray-900">Active Workspace 📂</h2>
                                <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-100">Encrypted Room</span>
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* --- Main Submission Area --- */}
                                <div className="lg:col-span-2 space-y-6">
                                    {/* TIME TRACKER WIDGET */}
                                    {isAssignedFreelancer && gig.status === 'In Progress' && (
                                        <div className="bg-gradient-to-r from-slate-800 to-gray-900 rounded-2xl p-6 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                                            <div className="flex items-center gap-4 text-white">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-inner ${isTracking ? 'bg-red-500 animate-pulse' : 'bg-gray-700'}`}>⏱️</div>
                                                <div>
                                                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Time Tracker</p>
                                                    <p className="text-3xl font-mono font-black tracking-wider">
                                                        {String(Math.floor(trackedSeconds / 3600)).padStart(2, '0')}:
                                                        {String(Math.floor((trackedSeconds % 3600) / 60)).padStart(2, '0')}:
                                                        {String(trackedSeconds % 60).padStart(2, '0')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-3 w-full sm:w-auto">
                                                <button onClick={() => setIsTracking(!isTracking)} className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold transition-all shadow-md ${isTracking ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}>{isTracking ? 'Pause' : 'Start'}</button>
                                                {trackedSeconds > 60 && <button onClick={handleLogTime} className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md">Log Time</button>}
                                            </div>
                                        </div>
                                    )}

                                    {isAssignedFreelancer && gig.status === 'In Progress' ? (
                                        <form onSubmit={handleDeliverableSubmit} className="bg-gray-50 border border-gray-200 rounded-2xl p-6 transition-all focus-within:border-blue-300 focus-within:shadow-md">
                                            <h3 className="font-extrabold text-gray-800 mb-4 flex items-center gap-2">
                                                <span className="text-xl">🚀</span> Submit Deliverable
                                            </h3>
                                            <textarea
                                                value={deliverableText}
                                                onChange={(e) => setDeliverableText(e.target.value)}
                                                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white mb-4 resize-none text-sm shadow-inner"
                                                rows="3"
                                                placeholder="Describe what you are submitting or paste a link (e.g. GitHub, Figma, Google Drive)..."
                                                required={!deliverableFile}
                                            ></textarea>
                                            
                                            {deliverableFile && (
                                                <div className="flex items-center justify-between bg-blue-50 border border-blue-100 p-3 rounded-xl mb-4">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="w-8 h-8 bg-blue-200 text-blue-700 rounded-lg flex items-center justify-center font-bold">📄</div>
                                                        <span className="text-sm font-semibold text-blue-900 truncate">{deliverableFile.name}</span>
                                                    </div>
                                                    <button type="button" onClick={() => setDeliverableFile(null)} className="text-red-500 hover:text-red-700 font-bold p-2">✕</button>
                                                </div>
                                            )}

                                            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                                <div>
                                                    <input type="file" id="fileUpload" className="hidden" onChange={(e) => setDeliverableFile(e.target.files[0])} />
                                                    <label htmlFor="fileUpload" className="cursor-pointer text-gray-500 hover:text-blue-600 font-bold text-sm flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white transition-colors border border-transparent hover:border-gray-200">
                                                        📎 Attach File
                                                    </label>
                                                </div>
                                                <button type="submit" className="bg-blue-600 text-white font-bold py-2.5 px-6 rounded-xl hover:bg-blue-700 transition-colors shadow-md hover:-translate-y-0.5 flex items-center gap-2">
                                                    Submit Work
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                                                </button>
                                            </div>
                                        </form>
                                    ) : gig.status === 'In Progress' ? (
                                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-8 text-center shadow-sm">
                                            <span className="text-4xl mb-3 block">⏳</span>
                                            <h3 className="font-bold text-blue-900 mb-1 text-lg">Waiting for submissions</h3>
                                            <p className="text-sm text-blue-700 font-medium">The freelancer hasn't submitted any deliverables yet.</p>
                                        </div>
                                    ) : (
                                        <div className="bg-green-50 border border-green-100 rounded-2xl p-8 text-center shadow-sm">
                                            <span className="text-4xl mb-3 block">✅</span>
                                            <h3 className="font-bold text-green-900 mb-1 text-lg">Project Completed</h3>
                                            <p className="text-sm text-green-700 font-medium">All deliverables have been approved and funds released.</p>
                                        </div>
                                    )}

                                    {/* --- History Feed --- */}
                                    <div className="mt-8 pt-4">
                                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Submission History</h3>
                                        <div className="space-y-6">
                                            {workspaceDeliverables.length > 0 ? workspaceDeliverables.map(del => (
                                                <div key={del._id} className="relative pl-6 border-l-2 border-gray-100 group">
                                                    <div className={`absolute -left-[10px] top-0 w-4 h-4 rounded-full border-4 border-white shadow-sm ${del.status === 'Approved' ? 'bg-green-500' : del.status === 'Revision Requested' ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
                                                    <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-gray-800 text-sm">Delivery Submitted</span>
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${del.status === 'Approved' ? 'bg-green-50 text-green-700' : del.status === 'Revision Requested' ? 'bg-orange-50 text-orange-700' : 'bg-yellow-50 text-yellow-700'}`}>{del.status}</span>
                                                            </div>
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                                {new Date(del.submittedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                            </span>
                                                        </div>
                                                        <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">{del.text}</p>
                                                        {del.fileName && (
                                                        <div 
                                                            className="mt-4 flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100 w-max pr-6 cursor-pointer hover:bg-blue-50 transition-colors"
                                                            onClick={() => {
                                                                if (del.fileData) {
                                                                    const a = document.createElement('a');
                                                                    a.href = del.fileData;
                                                                    a.download = del.fileName;
                                                                    document.body.appendChild(a); // Required for Firefox
                                                                    a.click();
                                                                    document.body.removeChild(a); // Cleanup
                                                                } else {
                                                                    alert("File data not available");
                                                                }
                                                            }}
                                                        >
                                                                <div className="w-8 h-8 bg-white shadow-sm rounded-lg flex items-center justify-center font-bold text-blue-600">📄</div>
                                                                <span className="text-sm font-bold text-gray-700">{del.fileName}</span>
                                                            </div>
                                                        )}
                                                        {del.feedback && (
                                                            <div className="mt-4 bg-orange-50 border border-orange-100 p-4 rounded-xl relative">
                                                                <div className="absolute -top-3 left-4 bg-orange-100 text-orange-800 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider">Client Feedback</div>
                                                                <p className="text-sm text-orange-900 font-medium italic">"{del.feedback}"</p>
                                                            </div>
                                                        )}
                                                        {isClientOwner && del.status === 'Pending Review' && (
                                                            <div className="mt-5 pt-4 border-t border-gray-100 flex gap-3">
                                                                <button onClick={() => handleApproveWork(del._id)} className="flex-1 bg-green-600 text-white font-bold py-2.5 rounded-xl hover:bg-green-700 transition-colors shadow-sm text-sm">Approve Work</button>
                                                                <button onClick={() => handleRevision(del._id)} className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-2.5 rounded-xl hover:bg-gray-50 hover:text-orange-600 transition-colors shadow-sm text-sm">Request Revision</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
                                                    <span className="text-3xl opacity-50 mb-2 block">📭</span>
                                                    <p className="text-gray-500 font-bold text-sm">No activity recorded yet.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* --- Right Side Info Panel --- */}
                                <div className="lg:col-span-1 hidden lg:block">
                                    <div className="bg-gray-50 border border-gray-200 rounded-3xl p-6 sticky top-28">
                                        <h3 className="font-extrabold text-gray-800 mb-4 uppercase tracking-wider text-xs">Workspace Guidelines</h3>
                                        <div className="space-y-4 text-sm text-gray-600 font-medium">
                                            <div className="flex gap-3">
                                                <span className="text-blue-500 font-bold">1.</span>
                                                <p>All official files and links should be submitted here, not in the chat.</p>
                                            </div>
                                            <div className="flex gap-3">
                                                <span className="text-blue-500 font-bold">2.</span>
                                                <p>Clients have 3 days to review a submission before it auto-approves.</p>
                                            </div>
                                            <div className="flex gap-3">
                                                <span className="text-blue-500 font-bold">3.</span>
                                                <p>Approving work triggers the milestone payment automatically.</p>
                                            </div>
                                        </div>
                                        <div className="mt-6 pt-6 border-t border-gray-200">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Security Status</p>
                                            <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-100 shadow-sm w-max">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                                                <span className="text-xs font-bold">End-to-End Encrypted</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    </ErrorBoundary>

                    <ErrorBoundary componentName="Payments Tab">
                    {activeTab === 'payments' && (
                        <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden animate-fade-in">
                            <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Milestones & Payments</h2>
                            
                            <div className="border border-gray-100 rounded-2xl overflow-hidden mb-8">
                                <div className="bg-gray-50 p-5 border-b border-gray-100 flex justify-between items-center">
                                    <span className="font-bold text-gray-700">Main Project Budget</span>
                                    <span className="font-extrabold text-green-600 text-xl">{formatCurrency(gig.budget)}</span>
                                </div>
                                {gig.milestones && gig.milestones.length > 0 ? (
                                    <div className="p-6">
                                        <h4 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">Milestone Breakdown</h4>
                                        <div className="space-y-4">
                                            {gig.milestones.map((m, idx) => (
                                                <div key={idx} className={`flex items-center justify-between border ${m.status === 'paid' ? 'border-green-200 bg-green-50/30' : 'border-gray-200'} p-4 rounded-xl`}>
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${m.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>{idx + 1}</div>
                                                        <div>
                                                            <p className="font-bold text-gray-800">{m.title}</p>
                                                            <p className={`text-xs font-bold mt-1 uppercase tracking-wider ${m.status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                                                                {m.status === 'paid' ? 'Funded / Paid ✅' : 'Pending Funding ⏳'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right flex flex-col items-end">
                                                        <p className="font-extrabold text-gray-900 text-lg">{formatCurrency(m.amount || 0)}</p>
                                                        {m.status !== 'paid' && isClientOwner && (
                                                            <Link to={`/payment/${gig._id}?milestone=${idx}`} className="mt-2 text-xs font-bold bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-black transition-colors shadow-sm">
                                                                Fund Milestone
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-6">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full ${gig.paymentStatus === 'paid' ? 'bg-green-500' : 'bg-yellow-400 animate-pulse'}`}></div>
                                                <span className="font-bold text-gray-800">Status: <span className="uppercase tracking-wider">{gig.paymentStatus || 'Pending'}</span></span>
                                            </div>
                                            {gig.paymentStatus !== 'paid' && isClientOwner && (
                                                <Link to={`/payment/${gig._id}`} className="bg-green-600 text-white font-bold py-2.5 px-6 rounded-xl hover:bg-green-700 transition-colors shadow-md w-full sm:w-auto text-center">
                                                    Pay Now 💳
                                                </Link>
                                            )}
                                            {gig.paymentStatus !== 'paid' && isAssignedFreelancer && (
                                                <button onClick={() => alert("Payment Request sent to client!")} className="bg-white border-2 border-gray-200 text-gray-700 font-bold py-2.5 px-6 rounded-xl hover:bg-gray-50 hover:border-blue-600 hover:text-blue-600 transition-colors w-full sm:w-auto text-center shadow-sm">
                                                    Request Payment 🔔
                                                </button>
                                            )}
                                            {gig.paymentStatus === 'paid' && (
                                                <span className="bg-green-100 border border-green-200 text-green-800 text-xs font-extrabold uppercase tracking-widest px-3 py-2 rounded-lg">Funds Secured ✅</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Generate Invoice Action */}
                            {gig.paymentStatus === 'paid' && (
                                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-inner">
                                    <div>
                                        <h3 className="font-extrabold text-indigo-900">Tax Invoice</h3>
                                        <p className="text-xs text-indigo-700 mt-1 font-medium">Download the official invoice for this transaction.</p>
                                    </div>
                                    <button onClick={handleGenerateInvoice} className="bg-indigo-600 text-white font-bold py-2.5 px-6 rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-md w-full sm:w-auto">
                                        📄 Download PDF
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    </ErrorBoundary>
                </div>

                {/* --- RIGHT SIDE: Sticky Client Sidebar & Actions --- */}
                <div className="w-full lg:w-[350px] xl:w-[400px] shrink-0">
                    <ErrorBoundary componentName="Gig Sidebar">
                    <div className="sticky top-28 space-y-6">
                        
                        {/* Budget & Main Desktop Actions */}
                        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Project Budget</p>
                            <div className="text-4xl font-extrabold text-green-600 mb-6">{formatCurrency(gig.budget)}</div>
                            
                            <div className="hidden lg:block space-y-3">
                                {/* Freelancer Actions */}
                                {isFreelancer && gig.status === 'Open' && (
                                    <Link to={`/submit-proposal/${gigId}`} className="w-full block text-center bg-blue-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-blue-700 transition-all hover:-translate-y-1 shadow-md text-lg">
                                        Apply Now 🚀
                                    </Link>
                                )}
                                {isAssignedFreelancer && (gig.status === 'In Progress' || gig.status === 'Completed') && (
                                    <Link to={`/chat/${gig.client?._id}`} className="w-full block text-center bg-blue-600 text-white font-bold py-3.5 px-6 rounded-xl hover:bg-blue-700 transition-all shadow-md mb-3">
                                        Message Client 💬
                                    </Link>
                                )}
                                {isFreelancer && !isClientOwner && gig.status === 'Open' && (
                                    <Link to={gig.client?._id ? `/chat/${gig.client._id}` : '#'} onClick={(e) => !gig.client?._id && e.preventDefault()} className="w-full block text-center bg-white border-2 border-gray-200 text-gray-700 font-bold py-3.5 px-6 rounded-xl hover:bg-gray-50 hover:border-blue-600 hover:text-blue-600 transition-colors">
                                        Message Client
                                    </Link>
                                )}
                                {/* Client Actions */}
                                {isClientOwner && gig.status === 'Open' && (
                                    <Link to={`/view-proposals/${gigId}`} className="w-full block text-center bg-indigo-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-indigo-700 transition-all hover:-translate-y-1 shadow-md text-lg">
                                        View Proposals ({proposalCount}) 👀
                                    </Link>
                                )}
                                {isClientOwner && (gig.status === 'In Progress' || gig.status === 'Completed') && gig.assignedFreelancer && (
                                    <Link to={`/chat/${gig.assignedFreelancer._id || gig.assignedFreelancer}`} className="w-full block text-center bg-white border-2 border-gray-200 text-gray-700 font-bold py-3.5 px-6 rounded-xl hover:bg-gray-50 hover:border-blue-600 hover:text-blue-600 transition-colors mb-3">
                                        Message Freelancer 💬
                                    </Link>
                                )}
                                {isClientOwner && gig.status === 'In Progress' && (
                                    <>
                                        <Link to={`/payment/${gig._id}`} className="w-full block text-center bg-green-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-green-700 transition-all shadow-md text-lg mb-3">Pay for Gig 💳</Link>
                                        <button onClick={handleComplete} className="w-full bg-purple-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-purple-700 transition-all shadow-md">Mark as Complete ✅</button>
                                    </>
                                )}
                                {isClientOwner && gig.status === 'Completed' && (
                                    <>
                                        <Link to={`/payment/${gig._id}`} className="w-full block text-center bg-green-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-green-700 transition-all shadow-md text-lg mb-3">Pay for Gig 💳</Link>
                                        <button onClick={handleRevertComplete} className="w-full bg-gray-500 text-white font-bold py-3 px-6 rounded-xl hover:bg-gray-600 transition-all shadow-md">Undo Completion ↩️</button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* About The Client Card */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-6 pb-4 border-b border-gray-100">About the Client</h3>
                            
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0">
                                    {(gig.client?.companyName || gig.client?.name || 'C').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <Link to={`/client-profile/${gig.client?._id}`} className="font-bold text-lg text-gray-900 hover:text-blue-600 transition-colors line-clamp-1">
                                        {gig.client?.companyName || gig.client?.name || 'Unknown Client'}
                                    </Link>
                                    {gig.locationText && <p className="text-sm text-gray-500 flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg> {gig.locationText}</p>}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-sm">
                                    <span className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center text-lg shrink-0">✅</span>
                                    <span className="font-bold text-gray-700">Payment Verified</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <span className="w-8 h-8 rounded-full bg-yellow-50 text-yellow-600 flex items-center justify-center text-lg shrink-0">★</span>
                                    <span className="font-bold text-gray-700">{avgClientRating > 0 ? `${avgClientRating} of 5` : 'No ratings yet'} <span className="text-gray-400 font-normal">({clientReviews.length} reviews)</span></span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <span className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-lg shrink-0">📅</span>
                                    <span className="font-bold text-gray-700">Member since {new Date(gig.client?.createdAt || Date.now()).getFullYear()}</span>
                                </div>
                            </div>
                        </div>

                    </div>
                    </ErrorBoundary>
                </div>
            </div>

            {/* --- MOBILE STICKY BOTTOM ACTION BAR --- */}
            <div className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] flex gap-3">
                {isFreelancer && gig.status === 'Open' && (
                    <Link to={`/submit-proposal/${gigId}`} className="flex-1 text-center bg-blue-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-md text-base">
                        Apply Now
                    </Link>
                )}
                {isAssignedFreelancer && (gig.status === 'In Progress' || gig.status === 'Completed') && (
                    <Link to={`/chat/${gig.client?._id}`} className="flex-1 text-center bg-blue-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-md text-base">
                        Message Client
                    </Link>
                )}
                {isClientOwner && gig.status === 'Open' && (
                    <Link to={`/view-proposals/${gigId}`} className="flex-1 text-center bg-indigo-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-md text-base">
                        View Proposals ({proposalCount})
                    </Link>
                )}
                {isClientOwner && (gig.status === 'In Progress' || gig.status === 'Completed') && gig.assignedFreelancer && (
                    <Link to={`/chat/${gig.assignedFreelancer._id || gig.assignedFreelancer}`} className="flex-1 text-center bg-indigo-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-md text-base">
                        Message Freelancer
                    </Link>
                )}
            </div>
        </div>
    );
};

export default GigDetailPage;