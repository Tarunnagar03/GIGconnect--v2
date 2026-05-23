import React from 'react';

const SkillVerificationModal = ({ isOpen, testCompleted, fetchedQuestions, skillTestStep, handleAnswer, onClose, isVerified, skillScore }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-indigo-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center text-xl shadow-sm border border-indigo-200">
                            🎓
                        </div>
                        <div>
                            <h3 className="font-extrabold text-lg text-gray-900 leading-tight">Skill Verification</h3>
                            <p className="text-[10px] uppercase tracking-wider font-bold text-indigo-600">Expert Badge</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors shadow-sm">✕</button>
                </div>

                <div className="p-8">
                    {testCompleted ? (
                        <div className="text-center">
                            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-4xl mb-4 shadow-inner ${isVerified ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'}`}>
                                {isVerified ? '✓' : '✕'}
                            </div>
                            <h4 className="text-2xl font-bold text-gray-800 mb-2">{isVerified ? 'Passed!' : 'Failed'}</h4>
                            <p className="text-gray-600 mb-6">Your score: <strong className={isVerified ? 'text-green-600' : 'text-red-600'}>{skillScore}%</strong></p>
                            <button onClick={onClose} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-md">Close</button>
                        </div>
                    ) : fetchedQuestions.length > 0 ? (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-sm font-bold text-gray-500">Question {skillTestStep + 1} of {fetchedQuestions.length}</span>
                                <div className="w-1/2 bg-gray-200 h-2 rounded-full overflow-hidden">
                                    <div className="bg-indigo-600 h-full transition-all" style={{ width: `${((skillTestStep) / fetchedQuestions.length) * 100}%` }}></div>
                                </div>
                            </div>
                            <h4 className="text-lg font-bold text-gray-800 mb-6">{fetchedQuestions[skillTestStep].question}</h4>
                            <div className="space-y-3">
                                {fetchedQuestions[skillTestStep].options.map((opt, i) => (
                                    <button key={i} onClick={() => handleAnswer(i)} className="w-full text-left p-4 rounded-xl border-2 border-gray-100 hover:border-indigo-600 hover:bg-indigo-50 font-medium text-gray-700 transition-all">
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                            <p className="text-gray-500 font-medium">Loading questions...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SkillVerificationModal;