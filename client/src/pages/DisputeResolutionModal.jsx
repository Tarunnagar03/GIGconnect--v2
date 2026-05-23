import React from 'react';

const DisputeResolutionModal = ({ disputeGig, disputeDetails, setDisputeGig, executeResolution }) => {
    if (!disputeGig) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-slide-up max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-orange-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center text-xl shadow-sm border border-orange-200">
                            ⚖️
                        </div>
                        <div>
                            <h3 className="font-extrabold text-lg text-gray-900 leading-tight">Dispute Center</h3>
                            <p className="text-[10px] uppercase tracking-wider font-bold text-orange-500">{disputeGig.title}</p>
                        </div>
                    </div>
                    <button onClick={() => setDisputeGig(null)} className="text-gray-400 hover:text-red-500 font-bold p-2 text-xl">&times;</button>
                </div>
                <div className="p-6 overflow-y-auto flex-1">
                    {!disputeDetails ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    <h4 className="font-bold text-gray-700 mb-1">Client</h4>
                                    <p className="font-semibold">{disputeDetails.gig?.client?.name}</p>
                                    <p className="text-gray-500 text-xs">{disputeDetails.gig?.client?.email}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    <h4 className="font-bold text-gray-700 mb-1">Freelancer</h4>
                                    <p className="font-semibold">{disputeDetails.gig?.assignedFreelancer?.name}</p>
                                    <p className="text-gray-500 text-xs">{disputeDetails.gig?.assignedFreelancer?.email}</p>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800 mb-2">Chat History</h4>
                                <div className="bg-gray-100 p-4 rounded-xl h-48 overflow-y-auto border border-gray-200 space-y-2">
                                    {disputeDetails.messages?.length > 0 ? disputeDetails.messages.map((m, i) => (
                                        <div key={i} className="text-sm">
                                            <span className="font-bold text-gray-700">{m.senderName}: </span>
                                            <span className="text-gray-600">{m.text}</span>
                                        </div>
                                    )) : <p className="text-gray-400 italic text-sm text-center mt-10">No messages found in this room.</p>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                    <button onClick={() => executeResolution('refund_client')} className="flex-1 bg-white border-2 border-red-200 text-red-600 font-bold py-3 rounded-xl hover:bg-red-50 transition-colors shadow-sm">
                        Refund Client
                    </button>
                    <button onClick={() => executeResolution('release_funds')} className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-colors shadow-md">
                        Release to Freelancer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DisputeResolutionModal;