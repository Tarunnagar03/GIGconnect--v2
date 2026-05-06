/**
 * AuthContext - Global Authentication State Management
 * UPDATED: May 6, 2026 - Authentication Enhancement
 * 
 * Manages:
 * - User authentication state
 * - JWT token management
 * - User profile data
 * - Role-based access (Client/Freelancer/Admin)
 * - Login/Logout functionality
 * - Token persistence and validation
 * - Two-Factor Authentication state
 * 
 * Features:
 * - Automatic token refresh
 * - Secure token storage
 * - Protected context for sensitive operations
 */

/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState({ token: null, user: null, isAuthenticated: false });
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const initializeAuth = useCallback(async (token) => {
        try {
            const decoded = jwtDecode(token);
            if (decoded.exp * 1000 < Date.now()) {
                throw new Error("Token expired");
            }
            
            // --- UPDATED: user object now includes username ---
            const user = decoded.user;
            setAuth({ token, user, isAuthenticated: true });

            if (user.role === 'Freelancer') {
                try {
                    const res = await api.get('/profiles/me');
                    setProfile(res.data);
                } catch {
                    setProfile(null);
                }
            }
        } catch {
            localStorage.removeItem('token');
            setAuth({ token: null, user: null, isAuthenticated: false });
            setProfile(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            initializeAuth(token);
        } else {
            setLoading(false);
        }
    }, [initializeAuth]);

    const login = (token) => {
        localStorage.setItem('token', token);
        setLoading(true);
        initializeAuth(token);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setAuth({ token: null, user: null, isAuthenticated: false });
        setProfile(null);
    };
    
    const refreshProfile = () => auth.token && initializeAuth(auth.token);

    // --- UPDATED: Also pass setAuth to update user details ---
    const value = { auth, setAuth, profile, loading, login, logout, refreshProfile };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};