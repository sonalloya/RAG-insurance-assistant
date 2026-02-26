// ─────────────────────────────────────────────────────────────
// server.js — RAG Insurance AI Backend
// Render-ready: reads PORT from environment variable
// ─────────────────────────────────────────────────────────────

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const chatRoutes = require('./routes/chat');
const policyRoutes = require('./routes/policy');

const app = express();
const PORT = process.env.PORT || 5000;

// ── CORS ─────────────────────────────────────────────────────
// Allow the Vercel frontend URL and local development
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:5500',  // Live Server (VS Code)
    'http://127.0.0.1:5500'
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (Postman, curl, Render health checks)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
            return callback(null, true);
        }
        return callback(new Error(`CORS: Origin ${origin} is not allowed.`));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// ── Body parsers ──────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Request logger (simple, beginner-friendly) ────────────────
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// ── Health check route ────────────────────────────────────────
// Render uses this to confirm the server is alive
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        service: 'RAG Insurance AI Backend',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        routes: {
            health: 'GET /',
            ask: 'POST /ask',
            chats: 'GET /chats',
            upload: 'POST /upload',
            policies: 'GET /policies'
        }
    });
});

// ── API Routes ────────────────────────────────────────────────
app.use('/', chatRoutes);    // POST /ask, GET /chats
app.use('/', policyRoutes);  // POST /upload, GET /policies

// ── 404 Handler ───────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found', message: `Route ${req.method} ${req.path} does not exist.` });
});

// ── Global Error Handler ──────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('❌  Unhandled error:', err.message);
    res.status(err.status || 500).json({
        error: err.name || 'Internal Server Error',
        message: err.message || 'Something went wrong.'
    });
});

// ── Start Server ──────────────────────────────────────────────
app.listen(PORT, () => {
    console.log('');
    console.log('🛡️  RAG Insurance AI Backend');
    console.log(`✅  Server running on port ${PORT}`);
    console.log(`📡  Health check: http://localhost:${PORT}/`);
    console.log(`💬  Chat API:     POST http://localhost:${PORT}/ask`);
    console.log(`📤  Upload API:   POST http://localhost:${PORT}/upload`);
    console.log('');
});

module.exports = app;
