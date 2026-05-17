const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const {
  getOverview,
  listUsers,
  setUserActive,
  listGigs,
  deleteGig,
  listTransactions,
  listContacts
} = require('../controllers/adminController');

router.use(auth, requireRole('Admin'));

router.get('/overview', getOverview);
router.get('/users', listUsers);
router.put('/users/:userId/active', setUserActive);

router.get('/gigs', listGigs);
router.delete('/gigs/:gigId', deleteGig);

router.get('/transactions', listTransactions);

router.get('/contacts', listContacts);

module.exports = router;
