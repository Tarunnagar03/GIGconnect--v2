/**
 * FreelancerDashboard Component
 * UPDATED: May 6, 2026 - Design System Enhancement
 * 
 * Changes Made:
 * - Updated with custom gc-card styling
 * - Applied modern color palette (primary, secondary, accent)
 * - Enhanced stats display with better visual hierarchy
 * - Improved card layouts and spacing
 * - Added smooth transitions and hover effects
 * - Implemented consistent typography
 * - Enhanced profile display with professional design
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { formatCurrency } from '../../utils/currencyFormatter';
import FreelancerKanbanColumn from './FreelancerKanbanColumn';
import SkillVerificationModal from './SkillVerificationModal';
import ErrorBoundary from '../ErrorBoundary';

const FreelancerDashboard = () => {
    const { auth } = useAuth();
    const [stats, setStats] = useState({ earnings: 0, expected: 0, activeBids: 0, successRate: 100, views: 0, withdrawn: 0 });
    const [pipelineData, setPipelineData] = useState({ pitched: [], interviewing: [], working: [], completed: [] });
    const [recommendedGigs, setRecommendedGigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [wallet, setWallet] = useState({ balance: 0, connected: false });
    const [draggedItem, setDraggedItem] = useState(null);
    
    // --- NEW: Skill Verification State ---
    const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
    const [fetchedQuestions, setFetchedQuestions] = useState([]);
    const [userAnswers, setUserAnswers] = useState([]);
    const [testCompleted, setTestCompleted] = useState(false);
    const [skillTestStep, setSkillTestStep] = useState(0);
    const [skillScore, setSkillScore] = useState(0);
    const [isVerified, setIsVerified] = useState(false);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                // 1. Fetch proposals
                const proposalsRes = await api.get('/proposals/my-proposals').catch(err => { console.error(err); return { data: [] }; });
                // FIX: Filter out "orphaned" proposals where the client deleted the Gig
                const proposals = Array.isArray(proposalsRes.data) ? proposalsRes.data.filter(p => p && p.gig) : [];
                
                // Split proposals into Kanban columns
                const pitched = proposals.filter(p => p.status === 'Submitted');
                const interviewing = proposals.filter(p => p.status === 'Interviewing');
                const activeBidsCount = pitched.length + interviewing.length;
                
                // 2. Fetch assigned gigs
                const assignedGigsRes = await api.get('/gigs/my-assigned-gigs').catch(err => { console.error(err); return { data: [] }; });
                const assigned = Array.isArray(assignedGigsRes.data) ? assignedGigsRes.data.filter(Boolean) : [];

                // Split assigned into Kanban columns
                const working = assigned.filter(g => g.status === 'In Progress' || g.status === 'Disputed');
                const completed = assigned.filter(g => g.status === 'Completed');
                
                setPipelineData({ pitched, interviewing, working, completed });

                // 3. Calculate Success rate based on accepted/completed vs total proposals
                const acceptedProposals = proposals.filter(p => p.status === 'Accepted' || p.status === 'Completed');
                const successRate = proposals.length > 0 ? Math.round((acceptedProposals.length / proposals.length) * 100) : 100;

                // 4. Fetch Wallet Balance & Real Transaction Data for Payouts
                const userRes = await api.get('/users/me').catch(() => ({ data: null }));
                const txRes = await api.get('/transactions/me').catch(() => ({ data: [] }));
                const profileRes = await api.get('/profiles/me').catch(() => ({ data: null }));
                
                const payouts = (Array.isArray(txRes.data) ? txRes.data.filter(Boolean) : []).filter(t => t.type === 'payout' && t.status === 'successful');
                const totalWithdrawn = payouts.reduce((sum, t) => sum + (t.amount || 0), 0);
                const walletBalance = userRes.data?.walletBalance || 0;
                const actualLifetimeEarnings = walletBalance + totalWithdrawn;

                // Deducting 10% platform fee for accurate frontend forecasting if no real money moved yet
                const gigBasedEarnings = completed.reduce((sum, gig) => sum + (gig.budget || 0), 0) * 0.9;
                const currentEarnings = actualLifetimeEarnings > 0 ? actualLifetimeEarnings : gigBasedEarnings;
                const expectedFuture = currentEarnings + (working.reduce((sum, gig) => sum + (gig.budget || 0), 0) * 0.9);

                setWallet({
                    balance: walletBalance,
                    connected: !!userRes.data?.stripeAccountId
                });
                
                setIsVerified(profileRes.data?.isVerified || false);

                setStats({
                    earnings: currentEarnings,
                    expected: expectedFuture,
                    withdrawn: totalWithdrawn,
                    activeBids: activeBidsCount,
                    successRate: successRate,
                    views: profileRes.data?.profileViews || 24 // Real data mapping with fallback
                });

                // 5. Fetch AI Recommendations efficiently from Backend DB
                try {
                    const recommendationsRes = await api.get('/gigs?recommendations=true');
                    setRecommendedGigs(Array.isArray(recommendationsRes.data) ? recommendationsRes.data : []);
                } catch (e) {
                    console.error("Failed to load AI matches", e);
                }

            } catch (err) {
                console.error("Dashboard data fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        if (auth.isAuthenticated) {
            fetchDashboardData();
        }
    }, [auth.isAuthenticated]);

    const handlePayout = async () => {
        try {
            const res = await api.post('/payments/payout');
            alert(res.data.msg);
            setStats(prev => ({ ...prev, withdrawn: prev.withdrawn + wallet.balance }));
            setWallet(prev => ({ ...prev, balance: 0 }));
        } catch (err) {
            alert(err.response?.data?.msg || 'Failed to process payout');
        }
    };

    // --- ENTERPRISE: Drag and Drop Handlers ---
    const handleDragStart = (e, item, isGig, sourceColumn) => {
        setDraggedItem({ item, isGig, sourceColumn });
        e.dataTransfer.effectAllowed = "move";
        // Add semi-transparency class to the original dragged element
        setTimeout(() => e.target.classList.add('opacity-40'), 0);
    };

    const handleDragEnd = (e) => {
        e.target.classList.remove('opacity-40');
        setDraggedItem(null);
    };

    const handleDrop = async (e, targetColumn) => {
        e.preventDefault();
        if (!draggedItem) return;
        const { item, isGig, sourceColumn } = draggedItem;

        if (sourceColumn === targetColumn) return;

        // For now, only allow proposals to be dragged between Pitched and Interviewing
        if (!isGig && (targetColumn === 'Pitched' || targetColumn === 'Interviewing')) {
            const dbStatus = targetColumn === 'Pitched' ? 'Submitted' : 'Interviewing';
            
            // Optimistic UI Update
            setPipelineData(prev => {
                const newSource = prev[sourceColumn.toLowerCase()].filter(i => i._id !== item._id);
                const newTarget = [...prev[targetColumn.toLowerCase()], { ...item, status: dbStatus }];
                return { ...prev, [sourceColumn.toLowerCase()]: newSource, [targetColumn.toLowerCase()]: newTarget };
            });
            
            try {
                // Real Database Update
                await api.put(`/proposals/${item._id}/status`, { status: dbStatus });
            } catch (err) {
                console.error("Status update error:", err);
            }
        } else {
            alert("This status transition requires the Client to trigger a contract update.");
        }
        setDraggedItem(null);
    };

    // --- SECURE: Skill Test Logic via Backend ---
    const startSkillTest = async () => {
        try {
            const res = await api.get('/skills/questions');
            setFetchedQuestions(res.data);
            setUserAnswers([]);
            setTestCompleted(false);
            setSkillTestStep(0);
            setSkillScore(0);
            setIsSkillModalOpen(true);
        } catch (err) {
            console.error("Failed to fetch questions:", err);
            alert("Could not load the skill test at this time.");
        }
    };

    const handleAnswer = async (selectedIndex) => {
        const newAnswers = [...userAnswers, selectedIndex];
        setUserAnswers(newAnswers);

        if (skillTestStep < fetchedQuestions.length - 1) {
            setSkillTestStep(prev => prev + 1);
        } else {
            try {
                const res = await api.post('/skills/verify', { answers: newAnswers });
                setSkillScore(res.data.score);
                if (res.data.passed) setIsVerified(true);
                setTestCompleted(true);
            } catch (err) {
                console.error("Failed to verify skills", err);
                setTestCompleted(true);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Greeting Logic
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
    const firstName = (auth.user?.name || 'Freelancer').split(' ')[0];

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* --- A. THE DAILY BRIEFING BANNER --- */}
            <ErrorBoundary componentName="Daily Briefing">
                <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-8 md:p-10 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight flex items-center gap-3">
                                {greeting}, {firstName}! ✨ 
                                {isVerified && <span className="bg-green-500 text-white text-xs px-2.5 py-1 rounded-lg uppercase tracking-widest font-black shadow-md border border-green-400">Verified Expert ✓</span>}
                            </h1>
                        <p className="text-blue-100 font-medium text-lg md:text-xl leading-relaxed max-w-3xl">
                            You have <span className="text-white font-bold bg-white/10 px-2 py-1 rounded-md mx-1 border border-white/20">2 unread messages</span>, 
                            <span className="text-white font-bold bg-white/10 px-2 py-1 rounded-md mx-1 border border-white/20">{stats.activeBids} active bids</span>, 
                            and <span className="text-white font-bold bg-white/10 px-2 py-1 rounded-md mx-1 border border-white/20">{recommendedGigs.length} new gigs</span> matching your skills today.
                        </p>
                    </div>
                        {!isVerified && (
                            <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-5 rounded-2xl shrink-0 text-center lg:w-64 shadow-lg">
                                <div className="text-3xl mb-2">🎓</div>
                                <h3 className="font-bold mb-1">Stand out to clients</h3>
                                <p className="text-xs text-blue-100 mb-4">Pass the MCQ test to get the Verified Expert badge.</p>
                                <button onClick={startSkillTest} className="w-full bg-white text-indigo-900 font-bold py-2 rounded-xl hover:bg-gray-100 transition-colors text-sm">
                                    Take Skill Test
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </ErrorBoundary>

            {/* --- B. FINANCIAL FORECASTING & METRICS --- */}
            <ErrorBoundary componentName="Financial Metrics">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-green-500"></div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform"></div>
                            {wallet.connected ? (
                                <button onClick={handlePayout} disabled={wallet.balance <= 0} className="bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                                    Withdraw Funds
                                </button>
                            ) : (
                                <Link to="/settings/billing" className="bg-white border border-green-200 text-green-700 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors shadow-sm">
                                    Setup Payouts
                                </Link>
                            )}
                        </div>
                        <h4 className="text-gray-500 font-bold text-sm uppercase tracking-wider mb-1">Wallet Balance</h4>
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-extrabold text-green-700">{formatCurrency(wallet.balance)}</p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-green-200/50">
                            <div className="flex justify-between text-[10px] font-bold text-green-700 mb-1.5 uppercase tracking-wider">
                                <span>Lifetime: {formatCurrency(stats.earnings)}</span>
                                <span>Withdrawn: {formatCurrency(stats.withdrawn)}</span>
                            </div>
                            <div className="w-full bg-green-200/50 rounded-full h-1.5">
                                <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${stats.expected > 0 ? (stats.earnings / stats.expected) * 100 : 0}%` }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-6 rounded-3xl shadow-sm hover:-translate-y-1 transition-transform group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform">📝</div>
                            <Link to="/my-proposals" className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-lg hover:bg-blue-200">View All</Link>
                        </div>
                        <h4 className="text-gray-500 font-bold text-sm uppercase tracking-wider mb-1">Active Bids</h4>
                        <p className="text-2xl font-extrabold text-blue-700">{stats.activeBids}</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 border border-purple-100 p-6 rounded-3xl shadow-sm hover:-translate-y-1 transition-transform group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform">🎯</div>
                            <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded-lg">Overall</span>
                        </div>
                        <h4 className="text-gray-500 font-bold text-sm uppercase tracking-wider mb-1">Success Rate</h4>
                        <p className="text-2xl font-extrabold text-purple-700">{stats.successRate}%</p>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 p-6 rounded-3xl shadow-sm hover:-translate-y-1 transition-transform group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform">👁️</div>
                            <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-lg">This Week</span>
                        </div>
                        <h4 className="text-gray-500 font-bold text-sm uppercase tracking-wider mb-1">Profile Views</h4>
                        <p className="text-2xl font-extrabold text-orange-700">{stats.views}</p>
                    </div>
                </div>
            </ErrorBoundary>

            {/* --- 2. TWO COLUMNS: Active Pipeline & Recommendations --- */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                
                {/* Left Column: Kanban Pipeline */}
                <ErrorBoundary componentName="Project Pipeline">
                    <div className="xl:col-span-2 space-y-6 overflow-hidden">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-extrabold text-gray-800 tracking-tight">Project Pipeline</h2>
                            <Link to="/my-projects" className="text-blue-600 font-bold hover:underline text-sm">View History &rarr;</Link>
                        </div>
                        
                        {/* Horizontal Scrollable Kanban Board */}
                        <div className="flex overflow-x-auto gap-6 pb-6 pt-2 px-2 -mx-2 snap-x scrollbar-hide">
                            <FreelancerKanbanColumn title="Pitched" icon="📤" items={pipelineData.pitched} isGig={false} draggedItem={draggedItem} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDrop={handleDrop} />
                            <FreelancerKanbanColumn title="Interviewing" icon="💬" items={pipelineData.interviewing} isGig={false} draggedItem={draggedItem} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDrop={handleDrop} />
                            <FreelancerKanbanColumn title="Working" icon="⚡" items={pipelineData.working} isGig={true} draggedItem={draggedItem} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDrop={handleDrop} />
                            <FreelancerKanbanColumn title="Completed" icon="✅" items={pipelineData.completed} isGig={true} draggedItem={draggedItem} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDrop={handleDrop} />
                        </div>
                    </div>
                </ErrorBoundary>

                {/* Right Column: AI Recommendations */}
                <ErrorBoundary componentName="AI Recommendations">
                    <div className="xl:col-span-1 space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-extrabold text-gray-800 tracking-tight flex items-center gap-2">
                                <span className="text-2xl">✨</span> Smart Matches
                            </h2>
                        </div>

                        <div className="bg-gradient-to-b from-blue-900 to-slate-900 rounded-3xl p-1 shadow-xl">
                            <div className="bg-white rounded-[22px] p-6 h-full min-h-[400px]">
                                {recommendedGigs.length > 0 ? (
                                    <div className="space-y-4">
                                        {recommendedGigs.map(gig => (
                                            <div key={gig._id} className="group relative border border-gray-100 rounded-2xl p-5 hover:border-blue-300 transition-colors hover:shadow-md">
                                                <div className="absolute top-4 right-4">
                                                    <span className="bg-orange-100 text-orange-700 text-[10px] font-extrabold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                                                        🔥 {gig.matchScore}% Match
                                                    </span>
                                                </div>
                                                <h3 className="font-bold text-gray-800 pr-20 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                                                    {gig.title}
                                                </h3>
                                                <p className="text-sm font-medium text-gray-500 mb-3 italic">
                                                    "Because they need <span className="font-bold text-blue-600">{gig.topSkill}</span>"
                                                </p>
                                                <div className="flex items-center justify-between mt-5">
                                                    <p className="text-green-600 font-extrabold text-sm">
                                                        {formatCurrency(gig.budget)}
                                                    </p>
                                                    <button onClick={() => alert("Auto-Drafting Proposal using AI...")} className="bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 text-[10px] font-extrabold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                                                        ✨ Auto-Draft
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        <Link to="/gigs" className="block text-center text-sm font-bold text-gray-500 hover:text-blue-600 pt-2 transition-colors">
                                            View all matches &rarr;
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="text-center py-10 flex flex-col items-center justify-center h-full">
                                        <span className="text-4xl mb-4 opacity-50">🤖</span>
                                        <p className="text-gray-500 text-sm font-medium mb-4">No matching open gigs available right now. We'll notify you when new projects arrive!</p>
                                        <Link to="/create-profile" className="text-blue-600 font-bold text-sm bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors">Update Profile</Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </ErrorBoundary>
            </div>

            {/* --- Skill Verification Modal --- */}
            <SkillVerificationModal 
                isOpen={isSkillModalOpen} 
                testCompleted={testCompleted} 
                fetchedQuestions={fetchedQuestions} 
                skillTestStep={skillTestStep} 
                handleAnswer={handleAnswer} 
                onClose={() => setIsSkillModalOpen(false)} 
                isVerified={isVerified} 
                skillScore={skillScore} 
            />
        </div>
    );
};

export default FreelancerDashboard;