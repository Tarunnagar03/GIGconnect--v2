const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");

exports.generateProposal = async (req, res) => {
    try {
        const { gigTitle, gigDescription, action, currentText } = req.body;

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ msg: "GEMINI_API_KEY is not configured on the server." });
        }
        const apiKey = process.env.GEMINI_API_KEY;
        
        let prompt = "";

        if (action === 'write') {
            prompt = `You are an expert freelance copywriter. Write a professional cover letter for a freelancer applying to the following job:
Job Title: "${gigTitle}"
Job Description: "${gigDescription}"

Instructions:
- Keep it concise, confident, and professional.
- Maximum 3 short paragraphs.
- Do not include placeholders like "[Your Name]", just provide the body of the letter directly.
- Use PLAIN TEXT only. Do NOT use markdown formatting (no asterisks, no hashes).`;
        } else if (action === 'professional') {
            prompt = `You are an expert editor. Take the following freelance proposal and rewrite it to sound more professional, polished, and compelling to a client. Keep the exact same core meaning and intent.

Instructions:
- Use PLAIN TEXT only. Do NOT use markdown formatting (no asterisks, no bold/italics).
- Do not add conversational intro/outro. Output ONLY the final text.

Original Proposal: "${currentText}"`;
        } else if (action === 'shorten') {
            prompt = `You are an expert editor. Take the following freelance proposal and make it much shorter and punchier, without losing the main intent. It should be easy to read in 10 seconds.

Instructions:
- Use PLAIN TEXT only. Do NOT use markdown formatting (no asterisks, no bold/italics).
- Do not add conversational intro/outro. Output ONLY the final text.

Original Proposal: "${currentText}"`;
        } else {
            return res.status(400).json({ msg: "Invalid AI action requested." });
        }

        // 🚀 ULTIMATE FIX: Dynamically ask Google which models this API key is allowed to use!
        let targetModel = "gemini-1.5-flash"; // Default assumption
        
        try {
            // Use native fetch (Node 18+) to get the active models for this specific API key
            const modelsResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
            const modelsData = await modelsResponse.json();
            
            if (modelsData && modelsData.models) {
                // Filter only models that support text generation
                const available = modelsData.models.filter(m => 
                    m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")
                );
                
                if (available.length > 0) {
                    // Prefer 'flash' for speed, otherwise just take whatever is available first
                    const preferred = available.find(m => m.name.includes("1.5-flash")) || available[0];
                    targetModel = preferred.name.replace('models/', '');
                    console.log(`[AI Auto-Discovery] Success! Using active model: ${targetModel}`);
                }
            }
        } catch (fetchErr) {
            console.log("[AI Auto-Discovery] Failed to fetch models list, using default.", fetchErr.message);
        }

        // Initialize the Gemini API client with the confirmed active model
        const genAI = new GoogleGenerativeAI(apiKey);
        
        // 🚀 ULTIMATE FIX: Disable Safety Filters to prevent "Professional" language from being blocked as spam
        const safetySettings = [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ];

        const model = genAI.getGenerativeModel({ 
            model: targetModel,
            safetySettings: safetySettings 
        });

        const result = await model.generateContent(prompt);
        let generatedText = result.response.text();

        // Clean up any residual markdown formatting or code blocks if Gemini ignores instructions
        generatedText = generatedText.replace(/```[\s\S]*?\n/g, '').replace(/```/g, '').replace(/\*\*/g, '').trim();

        res.json({ generatedText });
    } catch (err) {
        console.error("AI Generation Error:", err);
        let errMsg = "Failed to generate AI content. Please try again later.";
        if (err.message && (err.message.includes("API key not valid") || err.message.includes("API_KEY_INVALID"))) {
            errMsg = "Your Gemini API Key is invalid. Please generate a new one from Google AI Studio.";
        } else if (err.message && (err.message.toLowerCase().includes("safety") || err.message.includes("blocked"))) {
            errMsg = "Google AI blocked the generation due to strict safety filters.";
        }
        res.status(500).json({ msg: errMsg });
    }
};