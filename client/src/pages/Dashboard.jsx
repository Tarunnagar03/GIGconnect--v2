import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import ClientDashboard from '../components/dashboard/ClientDashboard';
import FreelancerDashboard from '../components/dashboard/FreelancerDashboard';

const Dashboard = () => {
    const { auth } = useContext(AuthContext);

    // Determine the role to display, default to empty string if not loaded
    const userRole = auth.user?.role || '';

    return (
        <div className="max-w-6xl mx-auto">
            {/* --- Premium Welcome Hero Banner --- */}
            <div className="relative overflow-hidden rounded-2xl p-8 mb-8 text-white shadow-lg bg-gradient-to-r from-blue-900 to-slate-800">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 right-20 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
                
                <div className="relative z-10">
                    <h1 className="text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">
                        {userRole === 'Client' ? `Ready to build something amazing, ${auth.user?.companyName || auth.user?.name}?` : `Let's land your next big project, ${auth.user?.name}!`}
                    </h1>
                    <p className="text-lg opacity-90 font-medium">
                        {userRole === 'Client' ? 'Manage your projects and find top local talent.' : 'Track your applications and discover new opportunities.'}
                    </p>
                </div>
            </div>

            {auth.user?.role === 'Client' ? <ClientDashboard /> : <FreelancerDashboard />}
        </div>
    );
};

export default Dashboard;