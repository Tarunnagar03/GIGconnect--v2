import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
    const { auth } = useAuth();
    
    if (auth?.loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

    if (!auth?.isAuthenticated) {
        return <Navigate to="/" />;
    }
    
    if (auth.user?.role !== 'Admin') {
        return <Navigate to="/dashboard" />;
    }
    
    return children;
};

export default AdminRoute;