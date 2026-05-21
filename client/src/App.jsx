/**
 * App Root Component
 * UPDATED: May 6, 2026 - Design System & Routing Enhancement
 * 
 * Features:
 * - Complete routing for all application pages
 * - Private route protection for authenticated users
 * - Role-based access control (Client/Freelancer/Admin)
 * - Authentication context integration
 * - Modern design system applied globally
 * - Responsive layout for all pages
 * 
 * Routes Configured:
 * - Public: Home, About, Contact, Browse Gigs, Find Freelancers
 * - Protected: Dashboard, Chat, Inbox, Reviews, Payment
 * - Admin: Admin Dashboard with user management
 */

import React, { useContext } from 'react';
// --- Router is NOT imported here ---
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
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
import BillingPage from './pages/BillingPage';
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
import FindFreelancers from './pages/FindFreelancers.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

// --- NEW: Global Error Boundary ---
import ErrorBoundary from './components/ErrorBoundary';

// --- ALL IMPORTS ARE CORRECTED ---
import TeamAgencyPage from './pages/TeamAgencyPage';
import ManageGigsPage from './pages/ManageGigsPage';
import MyCompletedProjectsPage from './pages/MyCompletedProjectsPage';
import AboutMePage from './pages/AboutMePage';
import ClientProjectsPage from './pages/ClientProjectsPage';
import ClientProfilePage from './pages/ClientProfilePage';
import HelpPage from './pages/HelpPage';

// --- NEW: Chatbot and MyTickets ---
import Chatbot from './components/Chatbot';
import MyTicketsPage from './pages/MyTicketsPage';

// Helper component to redirect if logged in
const AuthRedirect = ({ children }) => {
  const { auth } = useAuth();
  
  // Wait for auth verification to complete before making redirect decisions
  if (auth?.loading) return null;
  
  if (auth.isAuthenticated) {
      if (auth.user?.role === 'Admin') {
          return <Navigate to="/admin" />;
      }
      return <Navigate to="/dashboard" />;
  }
  return children;
};

// The component using useLocation MUST be a child of <Router>.
function App() {
    const location = useLocation();
    const isHomePage = location.pathname === '/';
    const isAdminPage = location.pathname.startsWith('/admin');

    return (
        <>
            {!isHomePage && !isAdminPage && (
                <ErrorBoundary componentName="Top Navigation Bar" showReload={false}>
                    <Navbar />
                </ErrorBoundary>
            )}
            <main className={!isAdminPage ? "container mx-auto px-4 py-6" : ""}>
                {/* key={location.pathname} ensures the error resets if user navigates away from the crashed page */}
                <ErrorBoundary componentName="Main Content Area" key={location.pathname}>
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
                    <Route path="/settings/billing" element={<PrivateRoute><BillingPage /></PrivateRoute>} />
                    <Route path="/settings/password" element={<PrivateRoute><ChangePasswordPage /></PrivateRoute>} />
                    <Route path="/settings/2fa" element={<PrivateRoute><TwoFactorAuthPage /></PrivateRoute>} />
                    <Route path="/settings/delete" element={<PrivateRoute><DeleteAccountPage /></PrivateRoute>} />
                    <Route path="/settings/details" element={<PrivateRoute><UpdateDetailsPage /></PrivateRoute>} />
                    <Route path="/settings/team" element={<PrivateRoute><TeamAgencyPage /></PrivateRoute>} />
                    <Route path="/history" element={<PrivateRoute><TransactionHistory /></PrivateRoute>} />
                    <Route path="/profile/:freelancerId" element={<PrivateRoute><FreelancerProfilePage /></PrivateRoute>} />
                    <Route path="/payment/:gigId" element={<PrivateRoute><PaymentPage /></PrivateRoute>} />
                    <Route path="/submit-proposal/:gigId" element={<PrivateRoute><SubmitProposalPage /></PrivateRoute>} />
                    <Route path="/view-proposals/:gigId" element={<PrivateRoute><ViewProposalsPage /></PrivateRoute>} />
                    <Route path="/my-proposals" element={<PrivateRoute><MyProposalsPage /></PrivateRoute>} />
                    <Route path="/services" element={<PrivateRoute><ServicesPage /></PrivateRoute>} />
                    <Route path="/freelancers" element={<PrivateRoute><FindFreelancers /></PrivateRoute>} />
                    <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                    
                    {/* --- ALL PROJECT ROUTES --- */}
                    <Route path="/my-projects" element={<PrivateRoute><MyCompletedProjectsPage /></PrivateRoute>} />
                    <Route path="/my-client-projects" element={<PrivateRoute><ClientProjectsPage /></PrivateRoute>} />
                    <Route path="/manage-gigs" element={<PrivateRoute><ManageGigsPage /></PrivateRoute>} />
                    <Route path="/about-me" element={<PrivateRoute><AboutMePage /></PrivateRoute>} />
                    <Route path="/client-profile/:clientId" element={<PrivateRoute><ClientProfilePage /></PrivateRoute>} />
                    <Route path="/help" element={<HelpPage />} />
                    {/* --- NEW: Made Contact Page Public --- */}
                    <Route path="/contact-us" element={<ContactPage />} />
                    <Route path="/settings/tickets" element={<PrivateRoute><MyTicketsPage /></PrivateRoute>} />

                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
                </ErrorBoundary>
            </main>
            
            {/* --- Global AI Chatbot --- */}
            {!isAdminPage && <Chatbot />}
        </>
    );
}

export default App;