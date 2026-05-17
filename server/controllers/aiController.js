exports.generateProposal = async (req, res) => {
    const { gigTitle, gigDescription, action, currentText } = req.body;
    
    try {
        // SIMULATED AI ENGINE (Smart Contextual Generation)
        // Realistic 1.5 second delay to mimic AI thinking time
        await new Promise(resolve => setTimeout(resolve, 1500));

        let generatedText = "";
        
        if (action === 'write') {
            generatedText = `Hi there,\n\nI recently came across your project "${gigTitle}" and I am very interested in helping you complete it successfully.\n\nBased on your description:\n"${gigDescription ? gigDescription.substring(0, 100) + '...' : 'the details provided'}"\n\nI understand the core requirements and I have the exact skill set needed to deliver high-quality results. I am highly communicative and focused on exceeding client expectations.\n\nLet's connect to discuss the details!\n\nBest regards.`;
        } else if (action === 'professional') {
            generatedText = `Dear Hiring Manager,\n\nI am writing to express my strong interest in the "${gigTitle}" position. \n\n${currentText || 'I am confident in my ability to deliver exceptional value to your project.'}\n\nI have reviewed the project details and am well-prepared to execute the deliverables efficiently. I look forward to the possibility of discussing this further.\n\nSincerely,`;
        } else if (action === 'shorten') {
            generatedText = `Hi! I'm ready to work on "${gigTitle}". I have the required skills and can deliver great results quickly. Let's chat!`;
        }

        res.json({ generatedText });

        /* 
        // --- ACTUAL GOOGLE GEMINI API INTEGRATION CODE (Ready to use) ---
        // 1. Run: npm install @google/generative-ai
        // 2. Uncomment below:
        
        // const { GoogleGenerativeAI } = require("@google/generative-ai");
        // const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // const model = genAI.getGenerativeModel({ model: "gemini-pro"});
        // const prompt = `Write a freelance proposal for a gig titled "${gigTitle}". Description: ${gigDescription}`;
        // const result = await model.generateContent(prompt);
        // res.json({ generatedText: result.response.text() });
        */

    } catch (error) {
        console.error("AI Generation Error:", error);
        res.status(500).json({ msg: 'AI generation failed due to server error.' });
    }
};