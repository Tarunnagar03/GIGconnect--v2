import React from 'react';
import { Link } from 'react-router-dom';

// A reusable card component for this page
const SettingsCard = ({ to, icon, title, description, isDanger = false }) => (
  <Link 
    to={to} 
    className={`bg-white p-6 rounded-lg shadow-md border-2 border-transparent transition-all ${
      isDanger 
        ? 'hover:border-red-500 hover:bg-red-50' 
        : 'hover:border-blue-500 hover:bg-blue-50'
    }`}
  >
    <div className="flex items-center gap-4">
      <span className="text-3xl">{icon}</span>
      <div>
        <h4 className={`text-lg font-bold ${isDanger ? 'text-red-600' : 'text-gray-800'}`}>{title}</h4>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
    </div>
  </Link>
);

const SettingsPage = () => {
  return (
    <div>
      {/* --- THIS IS THE NEW BACK BUTTON --- */}
      <Link to="/dashboard" className="inline-block mb-6 text-blue-600 hover:underline">
        &larr; Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold mb-6 text-gray-800">Account Settings</h1>
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
          to="/history"
          icon="💰"
          title="Payment History"
          description="View your transaction history."
        />
      </div>
    </div>
  );
};

export default SettingsPage;