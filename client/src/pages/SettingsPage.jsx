import React from 'react';
import { Link } from 'react-router-dom';

// A reusable card component for this page
const SettingsCard = ({ to, icon, title, description, isDanger = false }) => (
  <Link 
    to={to} 
    className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
      isDanger 
        ? 'hover:border-red-300 group' 
        : 'hover:border-blue-300 group'
    }`}
  >
    <div className="flex items-start gap-5">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-colors ${isDanger ? 'bg-red-50 group-hover:bg-red-100' : 'bg-blue-50 group-hover:bg-blue-100'}`}>
          {icon}
      </div>
      <div className="flex-1">
        <h4 className={`text-xl font-bold mb-1 ${isDanger ? 'text-red-700' : 'text-gray-800'}`}>{title}</h4>
        <p className="text-gray-500 leading-relaxed">{description}</p>
      </div>
    </div>
  </Link>
);

const SettingsPage = () => {
  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* --- THIS IS THE NEW BACK BUTTON --- */}
      <Link to="/dashboard" className="inline-flex items-center gap-2 mb-6 text-gray-600 hover:text-blue-600 font-semibold bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm hover:shadow hover:border-blue-200 transition-all group">
          <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Dashboard
      </Link>

      <h1 className="text-4xl font-extrabold mb-8 text-gray-800 tracking-tight">Account Settings</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SettingsCard 
          to="/settings/details"
          icon="👤"
          title="Personal Details"
          description="Update your name and email."
        />
        <SettingsCard 
          to="/settings/security"
          icon="🔒"
          title="Security"
          description="Change your password and manage 2FA."
        />
        <SettingsCard 
          to="/settings/billing"
          icon="🧾"
          title="Billing & Taxes"
          description="Manage payment methods and tax details."
        />
        <SettingsCard 
          to="/settings/team"
          icon="👥"
          title="Team & Agency"
          description="Invite team members or manage agency roster."
        />
        <SettingsCard 
          to="/history"
          icon="💰"
          title="Payment History"
          description="View your transaction history."
        />
        <SettingsCard 
          to="/settings/tickets"
          icon="🎫"
          title="My Tickets"
          description="View and track your support requests."
        />
      </div>
    </div>
  );
};

export default SettingsPage;