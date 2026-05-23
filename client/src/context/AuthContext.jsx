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

import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import api from '../api';

// FIX: Isko wapas export karna hoga taaki baaki saare pages crash na karein
export const AuthContext = createContext();

// Enterprise Best Practice: Custom Hook to consume Context (Fixes Vite HMR Warning)
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState({ user: null, isAuthenticated: false });
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const initializeAuth = useCallback(async () => {
        try {
            // SECURITY & LOOP FIX: Always verify session with backend. 
            // Token is sent automatically via HttpOnly cookie.
            const res = await api.get('/users/me');
            const user = res.data;

            setAuth({ user, isAuthenticated: true });

            if (user.role === 'Freelancer') {
                try {
                    const resProfile = await api.get('/profiles/me');
                    setProfile(resProfile.data);
                } catch {
                    setProfile(null);
                }
            }
        } catch (err) {
            setAuth({ user: null, isAuthenticated: false });
            setProfile(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        initializeAuth();
    }, [initializeAuth]);

    const login = async () => {
        setLoading(true);
        await initializeAuth();
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout'); // Backend clears the HttpOnly cookie
        } catch (e) {}
        setAuth({ user: null, isAuthenticated: false });
        setProfile(null);
    };
    
    const refreshProfile = () => auth.isAuthenticated && initializeAuth();

    // --- UPDATED: Also pass setAuth to update user details ---
    const value = { auth, setAuth, profile, loading, login, logout, refreshProfile };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};