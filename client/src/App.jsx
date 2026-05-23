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

import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';
import Chatbot from './components/Chatbot';

// Lazy-loaded Pages for Code Splitting (This prevents the white screen crash!)
const HomePage = lazy(() => import('./pages/HomePage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CreateProfile = lazy(() => import('./pages/CreateProfile'));
const PostGig = lazy(() => import('./pages/PostGig'));
const BrowseGigs = lazy(() => import('./pages/BrowseGigs'));
const GigDetailPage = lazy(() => import('./pages/GigDetailPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const InboxPage = lazy(() => import('./pages/InboxPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const BillingPage = lazy(() => import('./pages/BillingPage'));
const SecurityPage = lazy(() => import('./pages/SecurityPage'));
const DeleteAccountPage = lazy(() => import('./pages/DeleteAccountPage'));
const ChangePasswordPage = lazy(() => import('./pages/ChangePasswordPage'));
const TwoFactorAuthPage = lazy(() => import('./pages/TwoFactorAuthPage'));
const FreelancerProfilePage = lazy(() => import('./pages/FreelancerProfilePage'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const UpdateDetailsPage = lazy(() => import('./pages/UpdateDetailsPage'));
const TransactionHistory = lazy(() => import('./pages/TransactionHistory'));
const SubmitProposalPage = lazy(() => import('./pages/SubmitProposalPage'));
const ViewProposalsPage = lazy(() => import('./pages/ViewProposalsPage'));
const MyProposalsPage = lazy(() => import('./pages/MyProposalsPage'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const FindFreelancers = lazy(() => import('./pages/FindFreelancers'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const TeamAgencyPage = lazy(() => import('./pages/TeamAgencyPage'));
const ManageGigsPage = lazy(() => import('./pages/ManageGigsPage'));
const MyCompletedProjectsPage = lazy(() => import('./pages/MyCompletedProjectsPage'));
const AboutMePage = lazy(() => import('./pages/AboutMePage'));
const ClientProjectsPage = lazy(() => import('./pages/ClientProjectsPage'));
const ClientProfilePage = lazy(() => import('./pages/ClientProfilePage'));
const HelpPage = lazy(() => import('./pages/HelpPage'));
const MyTicketsPage = lazy(() => import('./pages/MyTicketsPage'));
const ContractsPage = lazy(() => import('./pages/ContractsPage'));

// Helper component to redirect if logged in
const AuthRedirect = ({ children }) => {
  const { auth } = useAuth();
  
  // Wait for auth verification to complete before making redirect decisions
  if (auth?.loading) return (
      <div className="flex justify-center items-center h-screen w-full bg-slate-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
  );
  
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
                <ErrorBoundary componentName="Main Content Area">
                <Suspense fallback={
                    <div className="flex justify-center items-center h-[60vh] w-full">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                }>
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
                    <Route path="/contracts" element={<PrivateRoute><ContractsPage /></PrivateRoute>} />
                    <Route path="/services" element={<PrivateRoute><ServicesPage /></PrivateRoute>} />
                    <Route path="/freelancers" element={<PrivateRoute><FindFreelancers /></PrivateRoute>} />
                    <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>}>
                        <Route path="gigs/:gigId" element={<GigDetailPage />} />
                        <Route path="chat/:recipientId" element={<ChatPage />} />
                    </Route>
                    
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
                </Suspense>
                </ErrorBoundary>
            </main>
            
            {/* --- Global AI Chatbot --- */}
            {!isAdminPage && <Chatbot />}
        </>
    );
}

export default App;