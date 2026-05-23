// client/src/components/PrivateRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
    const { auth } = useAuth();
    
    if (auth?.loading) return (
        <div className="flex justify-center items-center h-screen w-full bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    return auth.isAuthenticated ? children : <Navigate to="/" />;
};

export default PrivateRoute;