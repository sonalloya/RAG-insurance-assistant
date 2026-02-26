// ─────────────────────────────────────────────────────────────
// controllers/policyController.js
// Handles POST /upload — saves policy metadata to Supabase
// ─────────────────────────────────────────────────────────────

const { v4: uuidv4 } = require('uuid');
const supabase = require('../utils/supabase');

// POST /upload
const uploadPolicy = async (req, res) => {
    try {
        // multer gives us req.file for file uploads
        // We also accept JSON body { name, file_url } directly
        let name, file_url;

        if (req.file) {
            // File was uploaded via multipart/form-data
            name = req.file.originalname;
            // In a real system you'd upload to Supabase Storage or S3 and get a URL.
            // For now we store a placeholder path.
            file_url = `/uploads/${req.file.filename || req.file.originalname}`;
        } else if (req.body && req.body.name) {
            // JSON body {name, file_url}
            name = req.body.name;
            file_url = req.body.file_url || '';
        } else {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Provide either a file upload or JSON body with at least { "name": "..." }.'
            });
        }

        // Insert policy metadata into Supabase policies table
        const { data, error: dbError } = await supabase
            .from('policies')
            .insert([{
                id: uuidv4(),
                name,
                file_url
            }])
            .select()
            .single();

        if (dbError) {
            throw new Error(dbError.message);
        }

        return res.status(201).json({
            message: `Policy "${name}" uploaded and indexed successfully.`,
            policy: data
        });

    } catch (err) {
        console.error('❌  policyController.uploadPolicy error:', err.message);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: err.message
        });
    }
};

// GET /policies — list all indexed policies
const getPolicies = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('policies')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(error.message);
        }

        return res.status(200).json({ policies: data, count: data.length });
    } catch (err) {
        console.error('❌  policyController.getPolicies error:', err.message);
        return res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
};

module.exports = { uploadPolicy, getPolicies };
