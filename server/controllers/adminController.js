const User = require('../models/User');
const Gig = require('../models/Gig');
const Transaction = require('../models/Transaction');
const Contact = require('../models/Contact');
const AuditLog = require('../models/AuditLog');
const Message = require('../models/Message');
const sendEmail = require('../utils/email');

//  SECURITY FIX: Helper to prevent Regular Expression Denial of Service (ReDoS) and NoSQL Injection
const escapeRegex = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// 🚀 ENTERPRISE SECURITY: Helper to capture Network & Device Info
const getAuditMeta = (req) => ({
    ipAddress: req.headers['x-forwarded-for']?.split(',')[0] || req.ip || req.socket?.remoteAddress || 'Unknown',
    userAgent: req.headers['user-agent'] || 'Unknown'
});

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
    res.status(500).json({ msg: 'Server Error' });
  }
};

// --- NEW: Send Official System Email to User ---
exports.sendUserEmail = async (req, res) => {
  try {
    const { userId } = req.params;
    const { subject, message } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    await sendEmail({
      email: user.email,
      subject: subject,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h2 style="color: #4F46E5; margin-bottom: 20px;">GigConnect Official Notice</h2>
                <p style="color: #374151; font-size: 16px;">Dear <strong>${user.name}</strong>,</p>
                <p style="color: #374151; font-size: 15px; line-height: 1.6;">${message.replace(/\n/g, '<br/>')}</p>
                <br/>
                <p style="color: #6B7280; font-size: 14px;">Regards,<br/><strong>Trust & Safety Team</strong><br/>GigConnect Platform</p>
             </div>`
    });
    const auditMeta = getAuditMeta(req);
    await new AuditLog({ adminId: req.user.id, action: 'Sent System Email', targetId: user._id, targetModel: 'User', details: `Subject: ${subject}`, ...auditMeta }).save();

    res.json({ msg: 'Email sent successfully' });
  } catch (err) {
    console.error("Email error:", err.message);
    res.status(500).json({ msg: 'Failed to send email. Check SMTP credentials.' });
  }
};

// Get all Contact Us messages for Admin Dashboard
exports.listContacts = async (req, res) => {
  try {
    const contacts = await Contact.find({}).sort({ createdAt: -1 });
    res.json(contacts);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// Delete Contact Message
exports.deleteContact = async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Contact deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const { q, role, isActive, limit = 50, page = 1 } = req.query;
    const limitNum = Math.min(Number(limit) || 50, 200);
    const pageNum = Math.max(1, Number(page) || 1);
    const and = [];
    if (q && typeof q === 'string') {
      const safeQ = escapeRegex(q);
      and.push({
        $or: [
          { name: { $regex: safeQ, $options: 'i' } },
          { email: { $regex: safeQ, $options: 'i' } },
          { username: { $regex: safeQ, $options: 'i' } }
        ]
      });
    }
    if (role && typeof role === 'string') and.push({ role });
    if (isActive === 'true') and.push({ isActive: true });
    if (isActive === 'false') and.push({ isActive: false });

    const query = and.length ? { $and: and } : {};
    const users = await User.find(query)
      .select('-password')
      .sort({ date: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.setUserActive = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;
    
    // 🚀 BUG FIX: Boolean('false') evaluates to true in JS. We must explicitly check.
    const activeStatus = isActive === true || String(isActive).toLowerCase() === 'true';

    // 🛡️ SECURITY: Prevent banning Admins (Self-lockout prevention)
    const targetUser = await User.findById(userId);
    if (!targetUser) return res.status(404).json({ msg: 'User not found' });
    if (targetUser.role === 'Admin') {
        return res.status(403).json({ msg: 'Security Alert: Administrator accounts cannot be banned or deactivated.' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { isActive: activeStatus } },
      { new: true }
    ).select('-password');

    // 🛡️ SECURITY: Log this action
    const auditMeta = getAuditMeta(req);
    await new AuditLog({ adminId: req.user.id, action: activeStatus ? 'Reactivated User' : 'Deactivated/Banned User', targetId: user._id, targetModel: 'User', details: `User: ${user.email}`, ...auditMeta }).save();

    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.listGigs = async (req, res) => {
  try {
    const { status, q, limit = 50, page = 1 } = req.query;
    const limitNum = Math.min(Number(limit) || 50, 200);
    const pageNum = Math.max(1, Number(page) || 1);
    const and = [];
    if (status && typeof status === 'string') and.push({ status });
    if (q && typeof q === 'string') {
      const safeQ = escapeRegex(q);
      and.push({
        $or: [
          { title: { $regex: safeQ, $options: 'i' } },
          { description: { $regex: safeQ, $options: 'i' } }
        ]
      });
    }
    const query = and.length ? { $and: and } : {};
    const gigs = await Gig.find(query)
      .populate('client', ['name', 'username'])
      .populate('assignedFreelancer', ['name', 'username'])
      .sort({ date: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);
    res.json(gigs);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.archiveGig = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ msg: 'Gig not found' });

    gig.status = 'Archived';
    await gig.save();

    // 🛡️ SECURITY: Log this action
    const auditMeta = getAuditMeta(req);
    await new AuditLog({ adminId: req.user.id, action: 'Archived Gig', targetId: gig._id, targetModel: 'Gig', details: `Gig Title: ${gig.title}`, ...auditMeta }).save();

    res.json(gig);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Gig not found' });
    }
    res.status(500).json({ msg: 'Server error while archiving gig.' });
  }
};

// --- ENTERPRISE DISPUTE & AUDIT LOGS ---
exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find().populate('adminId', 'name email').sort({ createdAt: -1 }).limit(100);
    res.json(logs);
  } catch (err) { res.status(500).json({ msg: 'Server Error' }); }
};

exports.markDisputed = async (req, res) => {
  try {
    const gig = await Gig.findByIdAndUpdate(req.params.gigId, { status: 'Disputed' }, { new: true }).populate('client').populate('assignedFreelancer');
    const auditMeta = getAuditMeta(req);
    await new AuditLog({ adminId: req.user.id, action: 'Froze Gig (Dispute)', targetId: gig._id, targetModel: 'Gig', ...auditMeta }).save();
    res.json(gig);
  } catch (err) { res.status(500).json({ msg: 'Server Error' }); }
};

exports.resolveDispute = async (req, res) => {
  try {
    const { resolution } = req.body;
    const gig = await Gig.findById(req.params.gigId).populate('client').populate('assignedFreelancer');
    if (!gig) return res.status(404).json({msg: 'Gig not found'});
    
    gig.status = resolution === 'refund_client' ? 'Cancelled' : 'Completed';
    if (resolution === 'release_funds') {
        gig.paymentStatus = 'paid_out';
        // 🚨 CRITICAL FIX: Transfer funds to freelancer wallet (minus 10% platform fee)
        if (gig.assignedFreelancer && gig.budget) {
            await User.findByIdAndUpdate(gig.assignedFreelancer, { $inc: { walletBalance: gig.budget * 0.9 } });
        }
    }
    
    await gig.save();
    const auditMeta = getAuditMeta(req);
    await new AuditLog({ adminId: req.user.id, action: `Resolved Dispute: ${resolution}`, targetId: gig._id, targetModel: 'Gig', details: `Action taken: ${resolution}`, ...auditMeta }).save();
    res.json(gig);
  } catch(err) { res.status(500).json({ msg: 'Server Error' }); }
};

exports.getDisputeDetails = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.gigId).populate('client', 'name email').populate('assignedFreelancer', 'name email');
    if (!gig) return res.status(404).json({ msg: 'Gig not found' });
    
    let messages = [];
    if (gig.client && gig.assignedFreelancer) {
      const roomName = [String(gig.client._id), String(gig.assignedFreelancer._id)].sort().join('-');
      messages = await Message.find({ conversationId: roomName }).sort({ createdAt: 1 });
    }
    res.json({ gig, messages });
  } catch (err) { res.status(500).json({ msg: 'Server Error' }); }
};

exports.listTransactions = async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const limitNum = Math.min(Number(limit) || 50, 200);
    const pageNum = Math.max(1, Number(page) || 1);
    const tx = await Transaction.find({})
      .populate('user', ['name', 'username', 'email'])
      .populate('gig', ['title'])
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);
    res.json(tx);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};
