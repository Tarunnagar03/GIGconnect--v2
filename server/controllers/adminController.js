const User = require('../models/User');
const Gig = require('../models/Gig');
const Transaction = require('../models/Transaction');
const Contact = require('../models/Contact'); // Import Contact Model

exports.getOverview = async (req, res) => {
  try {
    const [users, gigs, transactions] = await Promise.all([
      User.countDocuments({}),
      Gig.countDocuments({}),
      Transaction.countDocuments({})
    ]);

    const openGigs = await Gig.countDocuments({ status: 'Open' });
    const completedGigs = await Gig.countDocuments({ status: 'Completed' });

    res.json({
      totals: { users, gigs, transactions },
      gigs: { open: openGigs, completed: completedGigs }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Get all Contact Us messages for Admin Dashboard
exports.listContacts = async (req, res) => {
  try {
    const contacts = await Contact.find({}).sort({ createdAt: -1 });
    res.json(contacts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.listUsers = async (req, res) => {
  try {
    const { q, role, isActive, limit = 50 } = req.query;
    const and = [];
    if (q) {
      and.push({
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
          { username: { $regex: q, $options: 'i' } }
        ]
      });
    }
    if (role) and.push({ role });
    if (isActive === 'true') and.push({ isActive: true });
    if (isActive === 'false') and.push({ isActive: false });

    const query = and.length ? { $and: and } : {};
    const users = await User.find(query)
      .select('-password')
      .sort({ date: -1 })
      .limit(Math.min(Number(limit) || 50, 200));

    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.setUserActive = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { isActive: Boolean(isActive) } },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.listGigs = async (req, res) => {
  try {
    const { status, q, limit = 50 } = req.query;
    const and = [];
    if (status) and.push({ status });
    if (q) {
      and.push({
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } }
        ]
      });
    }
    const query = and.length ? { $and: and } : {};
    const gigs = await Gig.find(query)
      .populate('client', ['name', 'username'])
      .populate('assignedFreelancer', ['name', 'username'])
      .sort({ date: -1 })
      .limit(Math.min(Number(limit) || 50, 200));
    res.json(gigs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.deleteGig = async (req, res) => {
  try {
    const { gigId } = req.params;
    const gig = await Gig.findByIdAndDelete(gigId);
    if (!gig) return res.status(404).json({ msg: 'Gig not found' });
    res.json({ msg: 'Gig deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.listTransactions = async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const tx = await Transaction.find({})
      .populate('user', ['name', 'username', 'email'])
      .populate('gig', ['title'])
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit) || 50, 200));
    res.json(tx);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
