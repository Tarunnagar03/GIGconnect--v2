const Profile = require('../models/Profile');

// Securely store questions and answers on the server (Not accessible via API directly)
const skillQuestions = [
    { id: 1, q: "What does API stand for?", options: ["Application Programming Interface", "Advanced Protocol Integration", "Automated Program Interface"], ans: 0 },
    { id: 2, q: "Which of the following is a NoSQL database?", options: ["PostgreSQL", "MySQL", "MongoDB"], ans: 2 },
    { id: 3, q: "In React, what hook is used to manage state?", options: ["useEffect", "useState", "useContext"], ans: 1 }
];

exports.getQuestions = (req, res) => {
    // Strip out the 'ans' property before sending to the frontend
    const safeQuestions = skillQuestions.map(q => ({ id: q.id, q: q.q, options: q.options }));
    res.json(safeQuestions);
};

exports.verifySkills = async (req, res) => {
    try {
        const { answers } = req.body;
        if (!answers || !Array.isArray(answers)) return res.status(400).json({ msg: 'Invalid answers format' });

        let score = 0;
        skillQuestions.forEach((q, index) => {
            if (answers[index] === q.ans) score += 1;
        });

        const passed = score >= 2;
        if (passed) await Profile.findOneAndUpdate({ user: req.user.id }, { isVerified: true });

        res.json({ passed, score, total: skillQuestions.length });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};