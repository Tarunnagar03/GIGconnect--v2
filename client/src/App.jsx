import React, { useContext } from 'react';
// --- Router is NOT imported here ---
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'; 
import { AuthContext } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import CreateProfile from './pages/CreateProfile';
import PostGig from './pages/PostGig';
import BrowseGigs from './pages/BrowseGigs';
import GigDetailPage from './pages/GigDetailPage';
import ChatPage from './pages/ChatPage';
import InboxPage from './pages/InboxPage';
import SettingsPage from './pages/SettingsPage';
import SecurityPage from './pages/SecurityPage';
import DeleteAccountPage from './pages/DeleteAccountPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import TwoFactorAuthPage from './pages/TwoFactorAuthPage';
import FreelancerProfilePage from './pages/FreelancerProfilePage';
import PaymentPage from './pages/PaymentPage';
import UpdateDetailsPage from './pages/UpdateDetailsPage';
import TransactionHistory from './pages/TransactionHistory';
import SubmitProposalPage from './pages/SubmitProposalPage';
import ViewProposalsPage from './pages/ViewProposalsPage';
import MyProposalsPage from './pages/MyProposalsPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ServicesPage from './pages/ServicesPage';
import ContactPage from './pages/ContactPage';

// --- ALL IMPORTS ARE CORRECTED ---
import MyCompletedProjectsPage from './pages/MyCompletedProjectsPage';
import AboutMePage from './pages/AboutMePage';
import ClientProjectsPage from './pages/ClientProjectsPage';

// Helper component to redirect if logged in
const AuthRedirect = ({ children }) => {
  const { auth } = useContext(AuthContext);
  return auth.isAuthenticated ? <Navigate to="/dashboard" /> : children;
};

// The component using useLocation MUST be a child of <Router>.
function App() {
    const location = useLocation();
    const hideNavbar = location.pathname === '/';

    return (
        <>
            {!hideNavbar && <Navbar />}
            <main className="container mx-auto p-4">
                <Routes>
                    <Route 
                        path="/" 
                        element={
                            <AuthRedirect>
                                <HomePage />
                            </AuthRedirect>
                        } 
                    />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} /> 
                    <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                    <Route path="/create-profile" element={<PrivateRoute><CreateProfile /></PrivateRoute>} />
                    <Route path="/post-gig" element={<PrivateRoute><PostGig /></PrivateRoute>} />
                    <Route path="/gigs" element={<PrivateRoute><BrowseGigs /></PrivateRoute>} />
                    <Route path="/gigs/:gigId" element={<PrivateRoute><GigDetailPage /></PrivateRoute>} />
                    <Route path="/inbox" element={<PrivateRoute><InboxPage /></PrivateRoute>} />
                    <Route path="/chat/:recipientId" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
                    <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
                    <Route path="/settings/security" element={<PrivateRoute><SecurityPage /></PrivateRoute>} />
                    <Route path="/settings/password" element={<PrivateRoute><ChangePasswordPage /></PrivateRoute>} />
                    <Route path="/settings/2fa" element={<PrivateRoute><TwoFactorAuthPage /></PrivateRoute>} />
                    <Route path="/settings/delete" element={<PrivateRoute><DeleteAccountPage /></PrivateRoute>} />
                    <Route path="/settings/details" element={<PrivateRoute><UpdateDetailsPage /></PrivateRoute>} />
                    <Route path="/history" element={<PrivateRoute><TransactionHistory /></PrivateRoute>} />
                    <Route path="/profile/:freelancerId" element={<PrivateRoute><FreelancerProfilePage /></PrivateRoute>} />
                    <Route path="/payment/:gigId" element={<PrivateRoute><PaymentPage /></PrivateRoute>} />
                    <Route path="/submit-proposal/:gigId" element={<PrivateRoute><SubmitProposalPage /></PrivateRoute>} />
                    <Route path="/view-proposals/:gigId" element={<PrivateRoute><ViewProposalsPage /></PrivateRoute>} />
                    <Route path="/my-proposals" element={<PrivateRoute><MyProposalsPage /></PrivateRoute>} />
                    <Route path="/services" element={<PrivateRoute><ServicesPage /></PrivateRoute>} />
                    <Route path="/contact-us" element={<PrivateRoute><ContactPage /></PrivateRoute>} />
                    
                    {/* --- ALL PROJECT ROUTES --- */}
                    <Route path="/my-projects" element={<PrivateRoute><MyCompletedProjectsPage /></PrivateRoute>} />
                    <Route path="/my-client-projects" element={<PrivateRoute><ClientProjectsPage /></PrivateRoute>} />
                    <Route path="/about-me" element={<PrivateRoute><AboutMePage /></PrivateRoute>} />

                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </main>
        </>
    );
}

export default App;