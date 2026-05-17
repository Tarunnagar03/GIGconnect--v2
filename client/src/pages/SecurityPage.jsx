import React from 'react';
import { Link } from 'react-router-dom';

const SecurityOptionCard = ({ to, icon, title, description, isDanger = false }) => (
  <Link 
    to={to} 
    className={`block p-6 rounded-2xl shadow-sm border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
      isDanger 
        ? 'bg-red-50 border-red-100 hover:border-red-300 group' 
        : 'bg-white border-gray-100 hover:border-blue-300 group'
    }`}
  >
    <div className="flex items-start gap-5">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-colors ${isDanger ? 'bg-red-100 group-hover:bg-red-200' : 'bg-blue-50 group-hover:bg-blue-100'}`}>
          {icon}
      </div>
      <div className="flex-1">
        <h4 className={`text-xl font-bold mb-1 ${isDanger ? 'text-red-700' : 'text-gray-800'}`}>{title}</h4>
        <p className="text-gray-500 leading-relaxed">{description}</p>
      </div>
    </div>
  </Link>
);

const SecurityPage = () => {
  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <Link to="/settings" className="inline-flex items-center gap-2 mb-6 text-gray-600 hover:text-blue-600 font-semibold bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm hover:shadow hover:border-blue-200 transition-all group">
          <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to All Settings
      </Link>
      <h1 className="text-4xl font-extrabold mb-8 text-gray-800 tracking-tight">Security</h1>
      <div className="grid grid-cols-1 gap-6">
        <SecurityOptionCard
          to="/settings/password"
          icon="🔑"
          title="Change Password"
          description="Update your password to keep your account secure."
        />
        <SecurityOptionCard
          to="/settings/2fa"
          icon="🛡️"
          title="Two-Factor Authentication"
          description="Add an extra layer of security to your account."
        />
        {/* --- DANGER ZONE --- */}
        <SecurityOptionCard
          to="/settings/delete"
          icon="🗑️"
          title="Delete Account"
          description="Permanently delete your account and all associated data."
          isDanger={true}
        />
      </div>
    </div>
  );
};

export default SecurityPage;