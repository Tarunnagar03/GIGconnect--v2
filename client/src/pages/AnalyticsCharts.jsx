import React from 'react';

const AnalyticsCharts = ({ overview }) => {
    if (!overview) return null;
    
    // Dynamic calculation for relative bar widths
    const maxGigValue = Math.max(overview.gigs?.open || 0, overview.gigs?.completed || 0, 10);
    const openPercent = ((overview.gigs?.open || 0) / maxGigValue) * 100;
    const completedPercent = ((overview.gigs?.completed || 0) / maxGigValue) * 100;

    return (
        <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-gray-200/50 mt-8">
            <h3 className="text-xl font-bold text-slate-800 tracking-tight mb-6">Platform Analytics</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Gigs Breakdown Bar Chart */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Project Lifecycle</h4>
                    
                    <div className="space-y-6">
                        <div className="group">
                            <div className="flex justify-between items-end mb-2">
                                <span className="font-bold text-gray-700">Open Escrows</span>
                                <span className="font-black text-indigo-600 text-lg">{overview.gigs?.open || 0}</span>
                            </div>
                            <div className="w-full bg-indigo-50 rounded-full h-3 overflow-hidden shadow-inner border border-indigo-100/50">
                                <div className="bg-gradient-to-r from-indigo-400 to-indigo-600 h-3 rounded-full transition-all duration-1000 ease-out" style={{ width: `${openPercent}%` }}></div>
                            </div>
                        </div>
                        
                        <div className="group">
                            <div className="flex justify-between items-end mb-2">
                                <span className="font-bold text-gray-700">Completed Projects</span>
                                <span className="font-black text-emerald-600 text-lg">{overview.gigs?.completed || 0}</span>
                            </div>
                            <div className="w-full bg-emerald-50 rounded-full h-3 overflow-hidden shadow-inner border border-emerald-100/50">
                                <div className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-3 rounded-full transition-all duration-1000 ease-out" style={{ width: `${completedPercent}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transactions Growth Ring */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center relative overflow-hidden hover:shadow-md transition-shadow">
                    <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                        <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24"><path d="M21 21H3V3h18v18zM5 19h14V5H5v14zM13 7h4v2h-4V7zM7 7h4v2H7V7zm0 4h10v2H7v-2zm0 4h10v2H7v-2z"></path></svg>
                    </div>
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">System Volume</h4>
                    
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="w-24 h-24 rounded-full border-[6px] border-purple-100 flex items-center justify-center relative bg-white shadow-sm">
                            <svg className="absolute inset-0 w-full h-full text-purple-500 -rotate-90 drop-shadow-sm" viewBox="0 0 36 36">
                                <path className="stroke-current transition-all duration-1000 ease-out" strokeWidth="2.5" strokeDasharray={`${Math.min(((overview.totals?.transactions || 0) * 5), 100)}, 100`} fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" strokeLinecap="round" />
                            </svg>
                            <span className="font-black text-2xl text-purple-700">{overview.totals?.transactions || 0}</span>
                        </div>
                        <div>
                            <p className="text-gray-800 font-bold text-lg leading-tight">Total Transactions</p>
                            <p className="text-xs text-gray-500 mt-1 font-medium">Successfully processed platform wide.</p>
                            <p className="text-[10px] font-black text-green-600 mt-3 bg-green-50 border border-green-200 px-2.5 py-1 rounded uppercase tracking-widest inline-block shadow-sm flex items-center w-max gap-1">
                                <span className="text-green-500 text-sm leading-none mt-[-2px]">&uarr;</span> Active Growth
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsCharts;