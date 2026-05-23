import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border border-gray-100 rounded-2xl mb-4 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all">
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="w-full px-6 py-5 text-left flex justify-between items-center focus:outline-none"
            >
                <span className="font-bold text-gray-800 text-lg">{question}</span>
                <span className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </span>
            </button>
            {isOpen && (
                <div className="px-6 pb-5 text-gray-600 leading-relaxed animate-fade-in">
                    {answer}
                </div>
            )}
        </div>
    );
};

// DUMMY DATA FOR NOW (Moved outside component to prevent re-allocation on renders)
const dummyFAQs = [
    { q: "How does the payment system work?", a: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat." },
    { q: "How do I create a new gig or post a job?", a: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum." },
    { q: "What is the fee structure for freelancers?", a: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo." },
    { q: "How do I resolve a dispute with a client?", a: "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet." },
    { q: "Can I change my username later?", a: "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident." }
];

const HelpPage = () => {
    const navigate = useNavigate();

    return (
        <div className="max-w-4xl mx-auto animate-fade-in pb-12">
            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 mb-6 text-gray-600 hover:text-blue-600 font-semibold bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm hover:shadow hover:border-blue-200 transition-all group focus:outline-none">
                <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Back
            </button>
            
            <div className="bg-gradient-to-br from-blue-900 to-slate-900 rounded-3xl p-10 md:p-16 text-center text-white shadow-xl mb-12 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500 opacity-20 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-500 opacity-20 rounded-full blur-3xl"></div>
                </div>
                <div className="relative z-10">
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">Help Center</h1>
                    <p className="text-xl text-blue-100 font-medium mb-8">How can we help you today?</p>
                    <div className="max-w-xl mx-auto relative group">
                        <input type="text" placeholder="Search for answers (Dummy Search)..." className="w-full py-4 pl-6 pr-12 rounded-full text-gray-800 font-medium shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-400 transition-all" />
                        <svg className="w-6 h-6 text-gray-400 absolute right-4 top-1/2 transform -translate-y-1/2 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                </div>
            </div>

            <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 px-2">Frequently Asked Questions</h2>
                <div className="space-y-4">
                    {dummyFAQs.map((faq, index) => (
                        <FAQItem key={index} question={faq.q} answer={faq.a} />
                    ))}
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-3xl p-10 text-center shadow-sm">
                <h3 className="text-2xl font-bold text-blue-900 mb-2">Still need help?</h3>
                <p className="text-blue-700 mb-6 font-medium">Our support team is available 24/7 to assist you.</p>
                <Link to="/contact-us" className="inline-block bg-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-700 transition-all hover:-translate-y-1 shadow-md">
                    Go to Contact Form
                </Link>
            </div>
        </div>
    );
};

export default HelpPage;