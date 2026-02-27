// ─────────────────────────────────────────────────────────────
// controllers/policyController.js
// Handles POST /upload, GET /policies, GET /compare
// ─────────────────────────────────────────────────────────────

const { v4: uuidv4 } = require('uuid');
const supabase = require('../utils/supabase');

// ── Extract comparison-ready fields from a parsed policy JSON ──
function extractComparisonData(policyJson) {
    try {
        const p = policyJson.policy || policyJson;
        const sections = p.sections || [];

        // Helper: find content by section title keywords
        const findContent = (...keywords) => {
            for (const sec of sections) {
                const allSubs = [sec, ...(sec.sub_sections || [])];
                for (const s of allSubs) {
                    const titleMatch = keywords.some(k =>
                        (s.title || '').toLowerCase().includes(k.toLowerCase())
                    );
                    if (titleMatch && s.content) return s.content;
                }
            }
            return null;
        };

        return {
            policy_name: p.policy_name || 'Unknown',
            insurer: p.insurer || 'Unknown',
            sum_insured: p.sum_insured || 0,
            premium_amount: p.premium_amount || 0,
            policy_type: p.policy_type || 'Health Insurance',
            network_hospitals: (p.network_hospitals || []).length,
            // Waiting periods
            initial_waiting: findContent('Initial Waiting') ||
                'Refer to policy document',
            pre_existing_waiting: findContent('Pre-Existing Disease Waiting', 'Pre-Existing Waiting') ||
                'Refer to policy document',
            surgery_waiting: findContent('Surgical', 'Surgery') || 'From Day 1 (accident)',
            maternity_waiting: findContent('Maternity Benefit', 'Maternity') || 'Not covered',
            // Coverage details
            room_rent: findContent('Room Rent') || 'As per plan limits',
            hospitalization_limit: findContent('Coverage Limits', 'Hospitalization Limits') ||
                `₹${(p.sum_insured || 0).toLocaleString('en-IN')}`,
            pre_hosp: findContent('Pre-Hospitalization', 'Pre-Hosp') || 'Not specified',
            post_hosp: findContent('Post-Hospitalization', 'Post-Hosp') || 'Not specified',
            no_claim_bonus: findContent('No Claim Bonus', 'NCB') || 'Not available',
            maternity: findContent('Maternity Benefit', 'Maternity') || 'Not covered',
            dental: findContent('Dental Coverage', 'Dental') || 'Not covered',
            vision: findContent('Vision Care', 'Vision') || 'Not covered',
            opd: findContent('OPD', 'Out-patient') || 'Not covered',
            cashless: findContent('Cashless Facility', 'Cashless') || 'Available',
        };
    } catch (e) {
        return null;
    }
}

// POST /upload
const uploadPolicy = async (req, res) => {
    try {
        let name, file_url, policy_data = null;

        if (req.file) {
            name = req.file.originalname;
            file_url = `/uploads/${req.file.originalname}`;

            // If it's a JSON file, parse and extract comparison fields
            if (req.file.mimetype === 'application/json' ||
                name.endsWith('.json')) {
                try {
                    const parsed = JSON.parse(req.file.buffer.toString('utf8'));
                    policy_data = extractComparisonData(parsed);
                    // Override name from JSON content if available
                    if (parsed.policy && parsed.policy.policy_name) {
                        name = parsed.policy.policy_name;
                    }
                } catch (parseErr) {
                    console.warn('⚠️  Could not parse JSON policy file:', parseErr.message);
                }
            }
        } else if (req.body && req.body.name) {
            name = req.body.name;
            file_url = req.body.file_url || '';
            if (req.body.policy_data) {
                policy_data = req.body.policy_data;
            }
        } else {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Provide either a file upload or JSON body with { "name": "..." }.'
            });
        }

        // Insert into Supabase
        const { data, error: dbError } = await supabase
            .from('policies')
            .insert([{ id: uuidv4(), name, file_url, policy_data }])
            .select()
            .single();

        if (dbError) throw new Error(dbError.message);

        return res.status(201).json({
            message: `Policy "${name}" uploaded and indexed successfully.`,
            policy: data,
            comparison_ready: !!policy_data
        });

    } catch (err) {
        console.error('❌  policyController.uploadPolicy error:', err.message);
        return res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
};

// GET /policies — list all indexed policies
const getPolicies = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('policies')
            .select('id, name, file_url, created_at, policy_data')
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);

        return res.status(200).json({ policies: data, count: data.length });
    } catch (err) {
        console.error('❌  policyController.getPolicies error:', err.message);
        return res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
};

// GET /compare?policy1=id&policy2=id — compare two policies side by side
const comparePolicies = async (req, res) => {
    try {
        const { policy1, policy2 } = req.query;

        if (!policy1 || !policy2) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Both policy1 and policy2 query params are required. e.g. /compare?policy1=<id>&policy2=<id>'
            });
        }

        if (policy1 === policy2) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Please select two different policies to compare.'
            });
        }

        const { data, error } = await supabase
            .from('policies')
            .select('id, name, policy_data, created_at')
            .in('id', [policy1, policy2]);

        if (error) throw new Error(error.message);

        if (!data || data.length < 2) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'One or both policies not found. Please upload them first.'
            });
        }

        const p1 = data.find(p => p.id === policy1);
        const p2 = data.find(p => p.id === policy2);

        if (!p1.policy_data || !p2.policy_data) {
            return res.status(422).json({
                error: 'Unprocessable',
                message: 'One or both policies do not have comparison data. Please re-upload as a valid JSON policy file.'
            });
        }

        return res.status(200).json({
            comparison: {
                policy_a: { id: p1.id, name: p1.name, data: p1.policy_data },
                policy_b: { id: p2.id, name: p2.name, data: p2.policy_data }
            }
        });

    } catch (err) {
        console.error('❌  policyController.comparePolicies error:', err.message);
        return res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
};

module.exports = { uploadPolicy, getPolicies, comparePolicies };
