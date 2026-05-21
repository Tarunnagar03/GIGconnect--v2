import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { text: "Hi! I'm the GigConnect Assistant. How can I help you today?", isBot: true }
    ]);
    const [inputValue, setInputValue] = useState("");
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const userMsg = { text: inputValue, isBot: false };
        setMessages(prev => [...prev, userMsg]);
        setInputValue("");

        // Contextual Help Logic
        setTimeout(() => {
            let botReply = "I'm still learning, but you can find more help in our Help Center or by submitting a support ticket.";
            
            const lowerInput = userMsg.text.toLowerCase();
            if (lowerInput.includes('payment') || lowerInput.includes('money') || lowerInput.includes('pay')) {
                botReply = "Payments are securely held in escrow via Stripe. They are released to freelancers once project milestones are approved by the client.";
            } else if (lowerInput.includes('proposal') || lowerInput.includes('bid')) {
                botReply = "You can view your proposals under 'My Proposals' on your dashboard, or by visiting a specific active gig's page.";
            } else if (lowerInput.includes('ticket') || lowerInput.includes('support')) {
                botReply = "You can manage your support tickets from 'My Tickets' in the Settings menu, or create a new one from the Contact Us page.";
            } else if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
                botReply = "Hello there! How can I assist you with GigConnect today?";
            }

            setMessages(prev => [...prev, { text: botReply, isBot: true }]);
        }, 800);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Chat Window */}
            {isOpen && (
                <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-80 sm:w-96 flex flex-col overflow-hidden mb-4 animate-slide-up" style={{ height: '450px' }}>
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex justify-between items-center shrink-0 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl shadow-inner border border-white/30">🤖</div>
                            <div>
                                <h3 className="font-bold text-sm">GigConnect Assistant</h3>
                                <p className="text-[10px] text-blue-100 uppercase tracking-wider font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block"></span> Online</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200 transition-colors focus:outline-none p-1 bg-white/10 rounded-lg hover:bg-white/20">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4 scrollbar-hide">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'} animate-fade-in`}>
                                <div className={`max-w-[85%] p-3.5 shadow-sm text-sm ${msg.isBot ? 'bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-tl-sm' : 'bg-blue-600 text-white rounded-2xl rounded-tr-sm font-medium'}`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="bg-white border-t border-gray-100 p-2 text-center text-xs">
                        <Link to="/help" onClick={() => setIsOpen(false)} className="text-blue-600 hover:underline font-semibold">Visit Full Help Center &rarr;</Link>
                    </div>

                    <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2 shrink-0">
                        <input 
                            type="text" 
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Ask me anything..." 
                            className="flex-1 bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-500 rounded-full px-4 py-2.5 text-sm outline-none transition-colors"
                        />
                        <button type="submit" disabled={!inputValue.trim()} className="w-11 h-11 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 hover:shadow-md disabled:opacity-50 transition-all shrink-0">
                            <svg className="w-5 h-5 transform rotate-90 translate-x-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
                        </button>
                    </form>
                </div>
            )}

            {/* Toggle Button */}
            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center group border-2 border-white"
                >
                    <span className="text-2xl group-hover:animate-bounce-subtle">🤖</span>
                </button>
            )}
        </div>
    );
};

export default Chatbot;