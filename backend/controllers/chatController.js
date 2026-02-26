// ─────────────────────────────────────────────────────────────
// controllers/chatController.js
// Handles POST /ask — simulated AI response + Supabase logging
// ─────────────────────────────────────────────────────────────

const supabase = require('../utils/supabase');

// Simulated AI response engine
// Replace this function later with a real RAG/LLM call
function generateAIResponse(question) {
    const q = question.toLowerCase();

    if (q.includes('hospitalization') || q.includes('hospital')) {
        return 'Based on Section 4.2 – Hospitalization Coverage of your policy, hospitalization expenses are covered including room rent (up to 1% of Sum Insured per day), ICU charges, surgeon fees, anaesthetist fees, and nursing expenses. Pre and post hospitalisation expenses are covered for 30 and 60 days respectively.';
    }
    if (q.includes('maternity') || q.includes('pregnancy')) {
        return 'As per Section 7.1 – Maternity Benefit, maternity coverage applies after a waiting period of 24 months (730 days) from policy start date. Normal delivery is covered up to ₹50,000 and caesarean delivery up to ₹75,000. New-born baby cover is included for the first 90 days.';
    }
    if (q.includes('pre-existing') || q.includes('pre existing')) {
        return 'According to Section 6.3 – Pre-Existing Disease Coverage, any condition diagnosed or treated within 48 months prior to the policy start date is considered pre-existing. Coverage for such conditions begins after a 48-month (1,095 days) waiting period from the policy inception date.';
    }
    if (q.includes('cashless') || q.includes('claim')) {
        return 'Per Section 9.1 – Cashless Claim Process: (1) Visit a network hospital. (2) Show your health card at the insurance desk. (3) Fill out the pre-authorisation form. (4) The hospital submits the form to us. (5) Approval is typically given within 2 hours. You can check network hospitals on our portal.';
    }
    if (q.includes('dental') || q.includes('teeth')) {
        return 'As per Section 8.4 – Dental Coverage, routine dental treatment (fillings, extractions, scaling) is not covered under the standard plan. However, dental treatment arising from accidents or resulting in hospitalisation is covered. The optional Dental Rider can be added for comprehensive dental coverage.';
    }
    if (q.includes('room rent') || q.includes('room limit')) {
        return 'According to Section 4.2.1 – Room Rent Sub-Limit, the daily room rent limit is 1% of the Sum Insured for a standard room and 2% for ICU. If you opt for a room above this limit, all other expenses will be proportionately reduced as per the co-payment clause in Section 12.';
    }
    if (q.includes('waiting period')) {
        return 'Your policy has three waiting periods: (1) Initial waiting period of 30 days for all illnesses except accidents. (2) 2-year waiting period for specified conditions like hernia, cataracts, and joint replacements. (3) 4-year waiting period for pre-existing diseases. Accidents are covered from day one.';
    }

    // Default fallback response
    return `Thank you for your question about "${question}". Based on your policy document, I've reviewed the relevant clauses. For the most accurate answer, I recommend checking Sections 4–9 of your policy document or contacting our support team. This system currently uses simulated AI responses — real RAG integration will be added in the next phase for clause-level citation.`;
}

// POST /ask
const askQuestion = async (req, res) => {
    try {
        const { question } = req.body;

        // Validate input
        if (!question || typeof question !== 'string' || question.trim() === '') {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'The "question" field is required and must be a non-empty string.'
            });
        }

        const trimmedQuestion = question.trim();

        // Generate AI response (simulated — swap for real RAG later)
        const answer = generateAIResponse(trimmedQuestion);

        // Save question + answer to Supabase chats table
        const { error: dbError } = await supabase
            .from('chats')
            .insert([{ question: trimmedQuestion, answer }]);

        if (dbError) {
            // Log but don't fail the request — the user still gets their answer
            console.error('⚠️  Supabase insert error (chats):', dbError.message);
        }

        // Return response
        return res.status(200).json({
            question: trimmedQuestion,
            answer,
            source: 'simulated-rag', // change to 'rag' when real AI is wired
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error('❌  chatController.askQuestion error:', err.message);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Something went wrong while processing your question.'
        });
    }
};

// GET /chats — retrieve recent chat history (bonus utility route)
const getChatHistory = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;

        const { data, error } = await supabase
            .from('chats')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            throw new Error(error.message);
        }

        return res.status(200).json({ chats: data, count: data.length });
    } catch (err) {
        console.error('❌  chatController.getChatHistory error:', err.message);
        return res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
};

module.exports = { askQuestion, getChatHistory };
