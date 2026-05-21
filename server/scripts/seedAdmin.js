require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');

async function main() {
  const { MONGO_URI, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_USERNAME, ADMIN_NAME, JWT_SECRET } = process.env;
  if (!MONGO_URI) throw new Error('Missing MONGO_URI');
  if (!JWT_SECRET) throw new Error('Missing JWT_SECRET');

  const email = (ADMIN_EMAIL || 'nagart16@gmail.com').toLowerCase();
  const password = ADMIN_PASSWORD || '123456789';
  const username = (ADMIN_USERNAME || 'admin_bhai').toLowerCase();
  const name = ADMIN_NAME || 'Super Admin';

  if (!email || !password) {
    throw new Error('Missing ADMIN_EMAIL or ADMIN_PASSWORD');
  }

  await mongoose.connect(MONGO_URI);

  let user = await User.findOne({ email });
  if (user) {
    user.role = 'Admin';
    user.isActive = true;
    await user.save();
    console.log(`Updated existing user to Admin: ${email}`);
    process.exit(0);
  }

  const existingUsername = await User.findOne({ username });
  if (existingUsername) {
    throw new Error(`ADMIN_USERNAME already taken: ${username}`);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  user = await new User({
    name,
    username,
    email,
    password: passwordHash,
    role: 'Admin',
    isActive: true
  }).save();

  console.log(`Created Admin user: ${email} (${user._id})`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
