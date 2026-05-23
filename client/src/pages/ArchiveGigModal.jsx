import React from 'react';

const ArchiveGigModal = ({ gigToArchive, isArchiving, setGigToArchive, confirmArchiveGig }) => {
    if (!gigToArchive) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
                <div className="p-6 border-b border-gray-100 flex items-center gap-3 bg-red-50/50">
                    <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center text-xl shadow-sm border border-red-200">
                        📦
                    </div>
                    <div>
                        <h3 className="font-extrabold text-lg text-gray-900 leading-tight">Archive Gig?</h3>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-red-500">Action Confirmation</p>
                    </div>
                </div>
                <div className="p-6">
                    <p className="text-gray-600 mb-6">Are you sure you want to archive <strong>{gigToArchive.title}</strong>? This will hide it from the platform.</p>
                    <div className="flex gap-3">
                        <button onClick={() => setGigToArchive(null)} className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">Cancel</button>
                        <button onClick={confirmArchiveGig} disabled={isArchiving} className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors shadow-md disabled:bg-red-400">
                            {isArchiving ? 'Archiving...' : 'Yes, Archive'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ArchiveGigModal;