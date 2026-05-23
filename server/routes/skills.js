const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getQuestions, verifySkills } = require('../controllers/skillController');

// @route   GET /api/skills/questions
// @desc    Get questions without answers
router.get('/questions', auth, getQuestions);

// @route   POST /api/skills/verify
// @desc    Submit answers and verify skills
router.post('/verify', auth, verifySkills);

module.exports = router;