// ─────────────────────────────────────────────────────────────
// routes/policy.js
// ─────────────────────────────────────────────────────────────

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadPolicy, getPolicies } = require('../controllers/policyController');

// Configure multer for in-memory storage
// (files are processed and metadata saved; actual files go to Supabase Storage later)
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
    fileFilter: (req, file, cb) => {
        const allowed = ['application/pdf', 'application/json', 'text/plain',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF, DOCX, TXT, and JSON files are allowed.'));
        }
    }
});

// POST /upload — upload a policy file or JSON metadata
router.post('/upload', upload.single('file'), uploadPolicy);

// GET /policies — list all indexed policies
router.get('/policies', getPolicies);

module.exports = router;
