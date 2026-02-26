// ─────────────────────────────────────────────────────────────
// routes/chat.js
// ─────────────────────────────────────────────────────────────

const express = require('express');
const router = express.Router();
const { askQuestion, getChatHistory } = require('../controllers/chatController');

// POST /ask — send a question, get an AI response
router.post('/ask', askQuestion);

// GET /chats — retrieve recent chat history
router.get('/chats', getChatHistory);

module.exports = router;
