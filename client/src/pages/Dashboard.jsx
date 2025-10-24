import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import ClientDashboard from '../components/dashboard/ClientDashboard';
import FreelancerDashboard from '../components/dashboard/FreelancerDashboard';

const Dashboard = () => {
    const { auth } = useContext(AuthContext);

    // Determine the role to display, default to empty string if not loaded
    const userRole = auth.user?.role || '';

    return (
        <div>
            <div className="mb-8">
                {/* --- THIS IS THE MODIFIED LINE --- */}
                {/* It now checks the user's role and displays it in the title */}
                <h1 className="text-3xl font-bold text-gray-800">
                    {userRole} Dashboard
                </h1>
                <p className="mt-1 text-lg text-gray-600">Welcome back, {auth.user?.name}!</p>
            </div>
            
            {auth.user?.role === 'Client' ? <ClientDashboard /> : <FreelancerDashboard />}
        </div>
    );
};

export default Dashboard;