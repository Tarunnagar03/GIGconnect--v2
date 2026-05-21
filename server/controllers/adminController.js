const User = require('../models/User');
const Gig = require('../models/Gig');

// 🛡️ SAFE IMPORTS: Prevents server crash if models don't exist yet
let Transaction;
try { Transaction = require('../models/Transaction'); } catch(e) { console.warn("Transaction model missing"); }
let Contact;
try { Contact = require('../models/Contact'); } catch(e) { console.warn("Contact model missing"); }
let AuditLog;
try { AuditLog = require('../models/AuditLog'); } catch(e) { console.warn("AuditLog model missing"); }

// Nodemailer for sending system emails
let nodemailer;
try { nodemailer = require('nodemailer'); } catch(e) { console.warn("Nodemailer not installed"); }

// Safe import for Message model (for disputes)
let Message;
try { Message = require('../models/Message'); } catch(e) { console.warn("Message model missing"); }

// 🚀 SECURITY FIX: Helper to prevent Regular Expression Denial of Service (ReDoS) and NoSQL Injection
const escapeRegex = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

exports.getOverview = async (req, res) => {
  try {
    const [users, gigs, transactions] = await Promise.all([
      User.countDocuments({}),
      Gig.countDocuments({}),
      Transaction ? Transaction.countDocuments({}) : Promise.resolve(0)
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

    if (!nodemailer) return res.status(500).json({ msg: 'Nodemailer is not installed on the server.' });

    // Configure Nodemailer (Best practice: use environment variables)
    const transporter = nodemailer.createTransport({
      service: 'gmail', 
      auth: {
        user: process.env.EMAIL_USER || 'nagartarun011@gmail.com',
        pass: process.env.EMAIL_PASS || 'dfcoeecpdgtuhadq'
      }
    });

    const mailOptions = {
      from: `"GigConnect Trust & Safety" <${process.env.EMAIL_USER || 'nagartarun011@gmail.com'}>`,
      to: user.email,
      subject: subject,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h2 style="color: #4F46E5; margin-bottom: 20px;">GigConnect Official Notice</h2>
                <p style="color: #374151; font-size: 16px;">Dear <strong>${user.name}</strong>,</p>
                <p style="color: #374151; font-size: 15px; line-height: 1.6;">${message.replace(/\n/g, '<br/>')}</p>
                <br/>
                <p style="color: #6B7280; font-size: 14px;">Regards,<br/><strong>Trust & Safety Team</strong><br/>GigConnect Platform</p>
             </div>`
    };

    await transporter.sendMail(mailOptions);
    if (AuditLog) await new AuditLog({ adminId: req.user.id, action: 'Sent System Email', targetId: user._id, targetModel: 'User', details: `Subject: ${subject}` }).save();

    res.json({ msg: 'Email sent successfully' });
  } catch (err) {
    console.error("Email error:", err.message);
    res.status(500).json({ msg: 'Failed to send email. Check SMTP credentials.' });
  }
};

// Get all Contact Us messages for Admin Dashboard
exports.listContacts = async (req, res) => {
  try {
    if (!Contact) return res.json([]);
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
    if (!Contact) return res.status(404).json({ msg: 'Model missing' });
    await Contact.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Contact deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const { q, role, isActive, limit = 50 } = req.query;
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
      .limit(Math.min(Number(limit) || 50, 200));

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

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { isActive: activeStatus } },
      { new: true }
    ).select('-password');

    // 🛡️ SECURITY: Log this action
    if (AuditLog) await new AuditLog({ adminId: req.user.id, action: activeStatus ? 'Reactivated User' : 'Deactivated/Banned User', targetId: user._id, targetModel: 'User', details: `User: ${user.email}` }).save();

    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.listGigs = async (req, res) => {
  try {
    const { status, q, limit = 50 } = req.query;
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
      .limit(Math.min(Number(limit) || 50, 200));
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
    if (AuditLog) await new AuditLog({ adminId: req.user.id, action: 'Archived Gig', targetId: gig._id, targetModel: 'Gig', details: `Gig Title: ${gig.title}` }).save();

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
    if (!AuditLog) return res.json([]);
    const logs = await AuditLog.find().populate('adminId', 'name email').sort({ createdAt: -1 }).limit(100);
    res.json(logs);
  } catch (err) { res.status(500).json({ msg: 'Server Error' }); }
};

exports.markDisputed = async (req, res) => {
  try {
    const gig = await Gig.findByIdAndUpdate(req.params.gigId, { status: 'Disputed' }, { new: true }).populate('client').populate('assignedFreelancer');
    if (AuditLog) await new AuditLog({ adminId: req.user.id, action: 'Froze Gig (Dispute)', targetId: gig._id, targetModel: 'Gig' }).save();
    res.json(gig);
  } catch (err) { res.status(500).json({ msg: 'Server Error' }); }
};

exports.resolveDispute = async (req, res) => {
  try {
    const { resolution } = req.body;
    const gig = await Gig.findById(req.params.gigId).populate('client').populate('assignedFreelancer');
    if (!gig) return res.status(404).json({msg: 'Gig not found'});
    
    gig.status = resolution === 'refund_client' ? 'Cancelled' : 'Completed';
    if (resolution === 'release_funds') gig.paymentStatus = 'paid_out';
    
    await gig.save();
    if (AuditLog) await new AuditLog({ adminId: req.user.id, action: `Resolved Dispute: ${resolution}`, targetId: gig._id, targetModel: 'Gig', details: `Action taken: ${resolution}` }).save();
    res.json(gig);
  } catch(err) { res.status(500).json({ msg: 'Server Error' }); }
};

exports.getDisputeDetails = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.gigId).populate('client', 'name email').populate('assignedFreelancer', 'name email');
    if (!gig) return res.status(404).json({ msg: 'Gig not found' });
    
    let messages = [];
    if (gig.client && gig.assignedFreelancer && Message) {
      const roomName = [String(gig.client._id), String(gig.assignedFreelancer._id)].sort().join('-');
      messages = await Message.find({ roomName }).sort({ timestamp: 1 });
    }
    res.json({ gig, messages });
  } catch (err) { res.status(500).json({ msg: 'Server Error' }); }
};

exports.listTransactions = async (req, res) => {
  try {
    if (!Transaction) return res.json([]);
    const { limit = 50 } = req.query;
    const tx = await Transaction.find({})
      .populate('user', ['name', 'username', 'email'])
      .populate('gig', ['title'])
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit) || 50, 200));
    res.json(tx);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};
