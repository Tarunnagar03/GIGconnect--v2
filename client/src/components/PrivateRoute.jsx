// client/src/components/PrivateRoute.jsx
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
    const { auth } = useAuth();
    return auth.isAuthenticated ? children : <Navigate to="/" />;
};

export default PrivateRoute;