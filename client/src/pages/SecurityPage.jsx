import React from 'react';
import { Link } from 'react-router-dom';

const SecurityOptionCard = ({ to, icon, title, description, isDanger = false }) => (
  <Link 
    to={to} 
    className={`block p-6 rounded-lg shadow-md border-2 transition-all ${
      isDanger 
        ? 'bg-red-50 border-red-200 hover:border-red-500 hover:bg-red-100' 
        : 'bg-white border-transparent hover:border-blue-500 hover:bg-blue-50'
    }`}
  >
    <div className="flex items-center gap-4">
      <span className="text-3xl">{icon}</span>
      <div>
        <h4 className={`text-lg font-bold ${isDanger ? 'text-red-700' : 'text-gray-800'}`}>{title}</h4>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
    </div>
  </Link>
);

const SecurityPage = () => {
  return (
    <div>
      <Link to="/settings" className="inline-block mb-6 text-blue-600 hover:underline">
        &larr; Back to All Settings
      </Link>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Security</h1>
      <div className="space-y-6">
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