const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const {
  getOverview,
  listUsers,
  setUserActive,
  sendUserEmail,
  listGigs,
  archiveGig, // Renamed from deleteGig
  listTransactions,
  listContacts,
  getAuditLogs,
  markDisputed,
  resolveDispute,
  getDisputeDetails,
  deleteContact
} = require('../controllers/adminController');

router.use(auth, requireRole('Admin'));

router.get('/overview', getOverview);
router.get('/users', listUsers);
router.put('/users/:userId/active', setUserActive);
router.post('/users/:userId/send-email', sendUserEmail);

router.get('/gigs', listGigs);
router.put('/gigs/:gigId/archive', archiveGig); // Changed to PUT for soft-delete

// --- Dispute & Audit Routes ---
router.put('/gigs/:gigId/dispute', markDisputed);
router.put('/gigs/:gigId/resolve', resolveDispute);
router.get('/gigs/:gigId/dispute-details', getDisputeDetails);
router.get('/audit-logs', getAuditLogs);

router.get('/transactions', listTransactions);

router.get('/contacts', listContacts);
router.delete('/contacts/:id', deleteContact);

module.exports = router;
