// ============================================
// RAG Insurance Chatbot — script.js
// Frontend ↔ Backend API Integration
// ============================================
//
// 🔧 CONFIGURATION — update API_URL after deploying backend to Render
// For local dev: 'http://localhost:5000'
// For production: 'https://your-app-name.onrender.com'
// ============================================

const API_URL = window.ENV_API_URL || 'http://localhost:5000';

(function () {
    'use strict';

    // ── Navbar scroll effect ──
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 30);
        });
    }

    // ── Hamburger / Mobile menu ──
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('open');
            mobileMenu.classList.toggle('open');
        });
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('open');
                mobileMenu.classList.remove('open');
            });
        });
        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
                hamburger.classList.remove('open');
                mobileMenu.classList.remove('open');
            }
        });
    }

    // ── Active nav link ──
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        }
    });

    // ── Scroll Reveal ──
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    // ── Smooth scroll for anchor links ──
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
            }
        });
    });

    // ── Counter animation ──
    function animateCounter(el) {
        const target = parseInt(el.getAttribute('data-target'), 10);
        const suffix = el.getAttribute('data-suffix') || '';
        const duration = 1800;
        const startTime = performance.now();
        const easeOut = t => 1 - Math.pow(1 - t, 3);

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            el.textContent = Math.round(easeOut(progress) * target) + suffix;
            if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    }

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('[data-target]').forEach(el => counterObserver.observe(el));

    // ── Toast Notification ──
    function showToast(message, type = 'default', duration = 3000) {
        let toast = document.getElementById('global-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'global-toast';
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        const icons = { success: '✅', error: '❌', info: 'ℹ️', default: '🔔' };
        toast.innerHTML = `<span>${icons[type] || icons.default}</span> ${message}`;
        toast.className = `toast show ${type}`;
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }
    window.showToast = showToast;

    // ── Eligibility Checker (features.html) ──
    const eligibilityBtn = document.getElementById('check-eligibility-btn');
    const eligibilityResult = document.getElementById('eligibility-result');

    if (eligibilityBtn && eligibilityResult) {
        eligibilityBtn.addEventListener('click', () => {
            const policyStart = document.getElementById('policy-start')?.value;
            const treatmentType = document.getElementById('treatment-type')?.value;
            const hospDate = document.getElementById('hosp-date')?.value;

            if (!policyStart || !treatmentType || !hospDate) {
                eligibilityResult.className = 'eligibility-result checking';
                eligibilityResult.innerHTML = '⚠️ Please fill in all fields to check eligibility.';
                return;
            }

            eligibilityResult.className = 'eligibility-result checking';
            eligibilityResult.innerHTML = '🔄 Checking eligibility... Querying policy database...';

            setTimeout(() => {
                const startDate = new Date(policyStart);
                const hospDateObj = new Date(hospDate);
                const daysDiff = (hospDateObj - startDate) / (1000 * 60 * 60 * 24);

                const waitPeriods = {
                    'general': 30,
                    'hospitalization': 30,
                    'surgery': 90,
                    'maternity': 730,
                    'pre-existing': 1095,
                    'dental': 180,
                    'vision': 90
                };

                const treatmentLabels = {
                    'general': 'General Treatment',
                    'hospitalization': 'Hospitalization',
                    'surgery': 'Surgical Procedure',
                    'maternity': 'Maternity Coverage',
                    'pre-existing': 'Pre-Existing Condition',
                    'dental': 'Dental Treatment',
                    'vision': 'Vision Care'
                };

                const required = waitPeriods[treatmentType] || 30;
                const label = treatmentLabels[treatmentType] || treatmentType;

                if (daysDiff < 0) {
                    eligibilityResult.className = 'eligibility-result not-eligible';
                    eligibilityResult.innerHTML = `❌ Invalid dates — hospitalization date cannot be before policy start date.`;
                } else if (daysDiff >= required) {
                    eligibilityResult.className = 'eligibility-result eligible';
                    eligibilityResult.innerHTML = `✅ Claim is <strong>Eligible</strong>. Waiting period of ${required} days completed for <strong>${label}</strong>. Covered as per Section 4.2 – Hospitalization Coverage.`;
                } else {
                    const remaining = Math.ceil(required - daysDiff);
                    eligibilityResult.className = 'eligibility-result not-eligible';
                    eligibilityResult.innerHTML = `❌ Claim is <strong>Not Eligible</strong> yet. Waiting period not completed for <strong>${label}</strong>. ${remaining} day(s) remaining out of ${required} required.`;
                }
            }, 1600);
        });
    }

    // ────────────────────────────────────────────────────────────
    // ── Live Chatbot — POST /ask to backend ──────────────────────
    // ────────────────────────────────────────────────────────────
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    const chatSendBtn = document.getElementById('chat-send-btn');

    function appendUserMsg(text) {
        if (!chatMessages) return;
        const row = document.createElement('div');
        row.className = 'chat-row chat-row--user';
        row.innerHTML = `
      <div class="chat-avatar-user">🧑</div>
      <div class="chat-bubble-user">${text}</div>`;
        chatMessages.appendChild(row);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function appendAIMsg(text) {
        if (!chatMessages) return;
        const row = document.createElement('div');
        row.className = 'chat-row chat-row--ai';
        row.innerHTML = `
      <div class="chat-avatar-ai">🤖</div>
      <div class="chat-bubble-ai">${text}</div>`;
        chatMessages.appendChild(row);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return row;
    }

    function showTypingIndicator() {
        if (!chatMessages) return null;
        const row = document.createElement('div');
        row.className = 'chat-row chat-row--ai';
        row.id = 'typing-indicator';
        row.innerHTML = `
      <div class="chat-avatar-ai">🤖</div>
      <div class="chat-bubble-ai"><div class="typing-dots"><span></span><span></span><span></span></div></div>`;
        chatMessages.appendChild(row);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return row;
    }

    async function sendQuestion(question) {
        if (!question || !chatMessages) return;
        appendUserMsg(question);
        const typingRow = showTypingIndicator();
        if (chatSendBtn) chatSendBtn.disabled = true;

        try {
            const response = await fetch(`${API_URL}/ask`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question })
            });
            const data = await response.json();
            if (typingRow) typingRow.remove();
            if (response.ok) {
                appendAIMsg(data.answer);
            } else {
                appendAIMsg(`❌ Error: ${data.message || 'Could not get a response.'}`);
            }
        } catch (err) {
            if (typingRow) typingRow.remove();
            appendAIMsg('❌ Network error — the backend may be waking up (free Render plan). Please try again in 30 seconds.');
            console.error('Chat API error:', err);
        } finally {
            if (chatSendBtn) chatSendBtn.disabled = false;
        }
    }

    if (chatForm && chatInput) {
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const question = chatInput.value.trim();
            if (!question) return;
            chatInput.value = '';
            await sendQuestion(question);
        });
    }

    // Suggested question chips
    window.askSuggested = function (btn) {
        const question = btn.textContent.trim();
        if (chatInput) chatInput.value = question;
        sendQuestion(question);
        if (chatInput) chatInput.value = '';
    };

    // Clear chat button
    window.clearChat = function () {
        if (!chatMessages) return;
        chatMessages.innerHTML = '';
        appendAIMsg('👋 Chat cleared! Ask me anything about your insurance policy.');
    };

    // ── Policy Comparison Widget (features.html) ─────────────────
    const selectA = document.getElementById('policy-select-a');
    const selectB = document.getElementById('policy-select-b');
    const compareBtn = document.getElementById('compare-btn');
    const compareResult = document.getElementById('compare-result');

    // Load policies into dropdowns
    async function loadPoliciesForCompare() {
        if (!selectA || !selectB) return;
        try {
            const res = await fetch(`${API_URL}/policies`);
            const data = await res.json();
            const policies = (data.policies || []).filter(p => p.policy_data);

            const makeOptions = (excludeId) => {
                if (policies.length === 0) {
                    return '<option value="">No comparison-ready policies found — upload JSON policies first</option>';
                }
                return '<option value="">Select a policy…</option>' +
                    policies.map(p =>
                        `<option value="${p.id}" ${p.id === excludeId ? 'disabled' : ''}>${p.name}</option>`
                    ).join('');
            };

            selectA.innerHTML = makeOptions(null);
            selectB.innerHTML = makeOptions(null);

            // Keep the other select's selected item disabled once one is chosen
            selectA.addEventListener('change', () => {
                Array.from(selectB.options).forEach(o => {
                    o.disabled = o.value === selectA.value && o.value !== '';
                });
            });
            selectB.addEventListener('change', () => {
                Array.from(selectA.options).forEach(o => {
                    o.disabled = o.value === selectB.value && o.value !== '';
                });
            });
        } catch (e) {
            if (selectA) selectA.innerHTML = '<option value="">⚠️ Backend offline — check Render</option>';
            if (selectB) selectB.innerHTML = '<option value="">⚠️ Backend offline — check Render</option>';
        }
    }
    loadPoliciesForCompare();

    // Compare button click
    if (compareBtn) {
        compareBtn.addEventListener('click', async () => {
            const id1 = selectA?.value;
            const id2 = selectB?.value;
            if (!id1 || !id2) {
                compareResult.innerHTML = '<div style="text-align:center;padding:16px;color:#f59e0b">⚠️ Please select two different policies to compare.</div>';
                return;
            }
            compareResult.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-dim)">⏳ Comparing policies...</div>';
            compareBtn.disabled = true;

            try {
                const res = await fetch(`${API_URL}/compare?policy1=${id1}&policy2=${id2}`);
                const data = await res.json();

                if (!res.ok) {
                    compareResult.innerHTML = `<div style="text-align:center;padding:16px;color:var(--danger)">❌ ${data.message}</div>`;
                    return;
                }

                const a = data.comparison.policy_a;
                const b = data.comparison.policy_b;

                // Fields to compare
                const rows = [
                    ['Sum Insured', `₹${Number(a.data.sum_insured).toLocaleString('en-IN')}`, `₹${Number(b.data.sum_insured).toLocaleString('en-IN')}`],
                    ['Annual Premium', `₹${Number(a.data.premium_amount).toLocaleString('en-IN')}`, `₹${Number(b.data.premium_amount).toLocaleString('en-IN')}`],
                    ['Insurer', a.data.insurer, b.data.insurer],
                    ['Network Hospitals', `${a.data.network_hospitals}+ hospitals`, `${b.data.network_hospitals}+ hospitals`],
                    ['Initial Waiting Period', a.data.initial_waiting?.split('.')[0] || '30 days', b.data.initial_waiting?.split('.')[0] || '30 days'],
                    ['Pre-Existing Disease Wait', a.data.pre_existing_waiting?.split('.')[0] || 'N/A', b.data.pre_existing_waiting?.split('.')[0] || 'N/A'],
                    ['Surgery Waiting Period', a.data.surgery_waiting?.split('.')[0] || 'N/A', b.data.surgery_waiting?.split('.')[0] || 'N/A'],
                    ['Maternity Coverage', a.data.maternity_waiting?.split('.')[0] || 'Not covered', b.data.maternity_waiting?.split('.')[0] || 'Not covered'],
                    ['No Claim Bonus', a.data.no_claim_bonus?.split('.')[0] || 'N/A', b.data.no_claim_bonus?.split('.')[0] || 'N/A'],
                    ['Dental Coverage', a.data.dental?.split('.')[0] || 'Not covered', b.data.dental?.split('.')[0] || 'Not covered'],
                    ['Vision Coverage', a.data.vision?.split('.')[0] || 'Not covered', b.data.vision?.split('.')[0] || 'Not covered'],
                    ['OPD Coverage', a.data.opd?.split('.')[0] || 'Not covered', b.data.opd?.split('.')[0] || 'Not covered'],
                ];

                compareResult.innerHTML = `
          <table class="comparison-table" style="font-size:0.78rem">
            <thead>
              <tr>
                <th>Feature / Benefit</th>
                <th>🅰 ${a.name}</th>
                <th>🅱 ${b.name}</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(([label, aVal, bVal]) => `
                <tr>
                  <td><strong>${label}</strong></td>
                  <td>${aVal}</td>
                  <td>${bVal}</td>
                </tr>`).join('')}
            </tbody>
          </table>
          <div style="font-size:0.72rem;color:var(--text-dim);text-align:center;margin-top:8px;padding:4px 0">
            ⚖️ Live comparison from Supabase · ${new Date().toLocaleTimeString()}
          </div>`;
            } catch (err) {
                compareResult.innerHTML = '<div style="text-align:center;padding:16px;color:var(--danger)">❌ Network error — backend may be waking up. Try again in 30 seconds.</div>';
            } finally {
                compareBtn.disabled = false;
            }
        });
    }

    // ── Admin: Upload Policy → POST /upload ──────────────────────
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const uploadList = document.getElementById('upload-list');

    if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', () => fileInput.click());

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--primary)';
            uploadArea.style.background = 'rgba(99,102,241,0.08)';
        });
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = '';
            uploadArea.style.background = '';
        });
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '';
            uploadArea.style.background = '';
            handleFiles(e.dataTransfer.files);
        });
        fileInput.addEventListener('change', () => handleFiles(fileInput.files));

        async function handleFiles(files) {
            if (!files.length) return;

            for (const file of Array.from(files)) {
                // Show file in upload list immediately
                if (uploadList) {
                    const item = document.createElement('div');
                    item.className = 'upload-file-item';
                    item.id = `file-${file.name.replace(/\W/g, '_')}`;
                    item.innerHTML = `<span>📄</span><span>${file.name}</span><span style="margin-left:auto;font-size:0.75rem;color:var(--text-dim)">${(file.size / 1024).toFixed(1)} KB — uploading...</span>`;
                    uploadList.appendChild(item);
                }

                // Upload to backend
                try {
                    const formData = new FormData();
                    formData.append('file', file);

                    const res = await fetch(`${API_URL}/upload`, {
                        method: 'POST',
                        body: formData
                    });

                    const data = await res.json();

                    const item = document.getElementById(`file-${file.name.replace(/\W/g, '_')}`);
                    if (item) {
                        if (res.ok) {
                            item.querySelector('span:last-child').textContent = `${(file.size / 1024).toFixed(1)} KB — ✅ Indexed`;
                            showToast(`Policy "${file.name}" uploaded successfully!`, 'success');
                        } else {
                            item.querySelector('span:last-child').textContent = `${(file.size / 1024).toFixed(1)} KB — ❌ Failed`;
                            showToast(`Failed to upload "${file.name}": ${data.message}`, 'error');
                        }
                    }
                } catch (err) {
                    showToast(`Upload error for "${file.name}": Network issue.`, 'error');
                    console.error('Upload error:', err);
                }
            }
        }
    }

    // ── Admin: Sidebar active ──
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.addEventListener('click', function () {
            document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // ── Admin: Animate chart bars on page load ──
    const chartBars = document.querySelectorAll('.chart-bar');
    if (chartBars.length) {
        chartBars.forEach((bar, i) => {
            const finalHeight = bar.style.height;
            bar.style.height = '0';
            setTimeout(() => {
                bar.style.transition = 'height 0.8s cubic-bezier(0.4,0,0.2,1)';
                bar.style.height = finalHeight;
            }, 200 + i * 80);
        });
    }

    // ── Hover 3D tilt on cards ──
    document.querySelectorAll('.card, .stat-card, .highlight-card, .team-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            card.style.transform = `translateY(-6px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });

    // ── Feature preview card clicks ──
    document.querySelectorAll('.card[data-href]').forEach(card => {
        card.addEventListener('click', () => {
            window.location.href = card.getAttribute('data-href');
        });
        card.style.cursor = 'pointer';
    });

    // ── Particle background (hero) ──
    const canvas = document.getElementById('hero-particles');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particles = [];
        const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        resize();
        window.addEventListener('resize', resize);

        class Particle {
            constructor() { this.reset(); }
            reset() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2 + 0.5;
                this.speedX = (Math.random() - 0.5) * 0.4;
                this.speedY = (Math.random() - 0.5) * 0.4;
                this.opacity = Math.random() * 0.5 + 0.1;
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) this.reset();
            }
            draw() {
                ctx.save();
                ctx.globalAlpha = this.opacity;
                ctx.fillStyle = '#6366f1';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        for (let i = 0; i < 60; i++) particles.push(new Particle());

        function animateParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => { p.update(); p.draw(); });
            requestAnimationFrame(animateParticles);
        }
        animateParticles();
    }

})();
