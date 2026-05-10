// game-engine.js — Premium Gamification Engine v2.0

(function () {
    // ⚙️ تعريف المتغيرات هنا مباشرة لضمان عملها 100% وتفادي مشاكل الكاش
    const MARKETING_SETTINGS_TABLE_ID = '760';
    const CUSTOMERS_TABLE_ID = '761';
    const BASEROW_TOKEN = window.BASEROW_TOKEN || 'DfaoAk1o41H4iPUtkblY2ZKzXcbHxizb';

    // Inject Premium Styles
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes shake {
            0% { transform: translate(1px, 1px) rotate(0deg); }
            10% { transform: translate(-1px, -2px) rotate(-1deg); }
            20% { transform: translate(-3px, 0px) rotate(1deg); }
            30% { transform: translate(3px, 2px) rotate(0deg); }
            40% { transform: translate(1px, -1px) rotate(1deg); }
            50% { transform: translate(-1px, 2px) rotate(-1deg); }
            60% { transform: translate(-3px, 1px) rotate(0deg); }
            70% { transform: translate(3px, 1px) rotate(-1deg); }
            80% { transform: translate(-1px, -1px) rotate(1deg); }
            90% { transform: translate(1px, 2px) rotate(0deg); }
            100% { transform: translate(1px, -2px) rotate(-1deg); }
        }
        @keyframes float-glow {
            0%, 100% { transform: translateY(0) scale(1); filter: drop-shadow(0 0 8px rgba(212,175,55,0.4)); }
            50% { transform: translateY(-6px) scale(1.03); filter: drop-shadow(0 0 18px rgba(212,175,55,0.7)); }
        }
        .shake { animation: shake 0.5s; }
        .game-box-3d {
            width: 100px;
            height: 100px;
            border-radius: 16px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            background: radial-gradient(ellipse at 30% 20%, #FFE066 0%, #FFD700 30%, #DAA520 60%, #B8860B 100%);
            box-shadow:
                0 8px 24px rgba(0,0,0,0.5),
                0 2px 6px rgba(0,0,0,0.3),
                inset 0 2px 4px rgba(255,255,255,0.4),
                inset 0 -6px 12px rgba(0,0,0,0.35),
                inset 4px 0 8px rgba(255,255,255,0.15),
                inset -4px 0 8px rgba(0,0,0,0.2);
            border: 2px solid #B8860B;
            position: relative;
            animation: float-glow 2.5s ease-in-out infinite;
        }
        .game-box-3d::before {
            content: '';
            position: absolute;
            top: 6px;
            left: 10%;
            right: 10%;
            height: 12px;
            background: linear-gradient(to bottom, rgba(255,255,255,0.5), transparent);
            border-radius: 50%;
        }
        .game-box-3d:hover {
            transform: translateY(-8px) scale(1.08) !important;
            box-shadow:
                0 16px 40px rgba(212,175,55,0.4),
                0 4px 12px rgba(0,0,0,0.4),
                inset 0 2px 4px rgba(255,255,255,0.5),
                inset 0 -6px 12px rgba(0,0,0,0.3);
            filter: drop-shadow(0 0 20px rgba(212,175,55,0.6)) !important;
        }
        .game-box-3d.opened {
            animation: none !important;
            cursor: not-allowed;
        }
        .box-open {
            background: linear-gradient(135deg, #064e3b, #022c22);
            border: 2px solid #d4af37;
            box-shadow: 0 0 20px rgba(212,175,55,0.3), inset 0 0 15px rgba(0,0,0,0.4);
            animation: none !important;
        }
        .game-phone-error {
            color: #f87171;
            font-size: 12px;
            margin-top: 4px;
            display: none;
            font-weight: 600;
        }
        .game-phone-error.visible {
            display: block;
        }
    `;
    document.head.appendChild(style);

    // ── Gift SVG Icon ──
    const giftSVG = `<svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 drop-shadow-lg" viewBox="0 0 24 24" fill="none" stroke="#5C3D00" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="4" rx="1" fill="#B8860B" stroke="#5C3D00"/><rect x="5" y="12" width="14" height="8" rx="1" fill="#DAA520" stroke="#5C3D00"/><line x1="12" y1="8" x2="12" y2="20" stroke="#5C3D00" stroke-width="1.5"/><path d="M12 8c-1-2-4-3.5-5-2s1 3 5 2" fill="#FFD700" stroke="#5C3D00"/><path d="M12 8c1-2 4-3.5 5-2s-1 3-5 2" fill="#FFD700" stroke="#5C3D00"/></svg>`;

    // ══════════════════════════════════════════════
    //  INIT GAME — Ultra-Resilient Fetcher
    // ══════════════════════════════════════════════
    const initGame = async () => {
        console.log("🎮 [Game Engine] Initializing...");
        try {
            const cb = new Date().getTime();
            const res = await fetch(`https://baserow.vidsai.site/api/database/rows/table/${MARKETING_SETTINGS_TABLE_ID}/?user_field_names=true&cb=${cb}`, {
                headers: { "Authorization": `Token ${BASEROW_TOKEN}` }
            });

            if (!res.ok) {
                console.warn("⚠️ [Game Engine] API Error. Status:", res.status);
                return;
            }

            const data = await res.json();
            console.log("🔍 [Game Engine] RAW Data from Baserow:", data);

            let settings = null;

            // Handle BOTH data shapes dynamically
            if (data.results && data.results.length > 0) {
                settings = data.results[0];
            } else if (data.id) {
                settings = data;
            }

            if (!settings) {
                console.warn("⚠️ [Game Engine] Table is completely empty (No rows).");
                return;
            }

            console.log("⚙️ [Game Engine] Settings applied:", settings);

            if (settings.Is_Active === false || settings.Is_Active === "false" || !settings.Is_Active) {
                console.log("🛑 [Game Engine] Gamification is DISABLED in settings.");
                return;
            }

            const delay = (parseInt(settings.Trigger_Delay) || 30) * 1000;
            const prizesRaw = settings.Prizes || "";
            const prizes = prizesRaw.split(',').map(p => p.trim()).filter(p => p);

            if (prizes.length === 0) {
                console.warn("⚠️ [Game Engine] Active, but NO PRIZES defined!");
                return;
            }

            console.log(`⏳ [Game Engine] Countdown: ${delay / 1000} seconds...`);

            setTimeout(() => {
                console.log("🎁 [Game Engine] Showing Game Modal!");
                showLeadCaptureModal(prizes);
            }, delay);

        } catch (e) {
            console.error("❌ [Game Engine] Error:", e);
        }
    };

    // ══════════════════════════════════════════════
    //  LEAD CAPTURE MODAL — Premium Emerald Theme
    // ══════════════════════════════════════════════
    const showLeadCaptureModal = (prizes) => {
        if (document.getElementById('gamification-modal')) return;

        const modalHtml = `
        <div id="gamification-modal" class="fixed inset-0 z-[100] flex items-center justify-center bg-emerald-950/95 backdrop-blur-md p-4 animate-zoom-in" style="direction: rtl;">
            <div class="bg-emerald-900/80 border border-brand-500/50 rounded-2xl p-6 w-full max-w-sm shadow-[0_0_40px_rgba(212,175,55,0.25)] text-center relative">
                <button onclick="document.getElementById('gamification-modal').remove()" class="absolute top-4 left-4 text-emerald-400 hover:text-white transition">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>

                <!-- Step 1: Lead Capture -->
                <div id="step-1-lead">
                    <div class="w-16 h-16 mx-auto mb-4 bg-emerald-800/60 rounded-full flex items-center justify-center border border-brand-500/30 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                        <span class="text-3xl">🎁</span>
                    </div>
                    <h2 class="text-2xl font-bold text-brand-500 mb-3">جوائز مميزة بانتظارك!</h2>
                    <p class="text-ivory-300 text-sm mb-6 leading-relaxed">قم بملء المعلومات للحصول على جوائز مميزة لهذا اليوم</p>

                    <div class="space-y-4 text-right">
                        <div>
                            <label class="block text-xs text-ivory-400 mb-1.5 font-bold">الاسم</label>
                            <input type="text" id="game-name" class="w-full p-3 bg-emerald-950/80 border border-emerald-700 rounded-xl text-white outline-none focus:border-brand-500 transition placeholder-emerald-600" placeholder="أدخل اسمك">
                        </div>
                        <div>
                            <label class="block text-xs text-ivory-400 mb-1.5 font-bold">رقم الهاتف</label>
                            <input type="tel" id="game-phone" class="w-full p-3 bg-emerald-950/80 border border-emerald-700 rounded-xl text-white text-left outline-none focus:border-brand-500 transition placeholder-emerald-600" placeholder="05XXXXXXXX" dir="ltr">
                            <p id="game-phone-error" class="game-phone-error">يرجى إدخال رقم هاتف صحيح (9 أرقام على الأقل)</p>
                        </div>
                    </div>

                    <div class="mt-6 flex flex-col gap-3">
                        <button id="game-start-btn" class="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-brand-500/20 active:scale-95">إلعب الآن</button>
                        <button onclick="document.getElementById('gamification-modal').remove()" class="w-full text-emerald-400 hover:text-white text-sm py-2 transition">لا شكراً</button>
                    </div>
                </div>

                <!-- Step 2: Box Game -->
                <div id="step-2-game" class="hidden">
                    <h2 class="text-2xl font-bold text-white mb-2">اختر صندوقاً!</h2>
                    <p class="text-emerald-300 text-sm mb-8">اضغط على أحد الصناديق لاكتشاف جائزتك</p>

                    <div class="flex justify-center gap-5 mb-8">
                        <div class="game-box-3d" onclick="window.playBoxGame(this)">${giftSVG}</div>
                        <div class="game-box-3d" onclick="window.playBoxGame(this)">${giftSVG}</div>
                        <div class="game-box-3d" onclick="window.playBoxGame(this)">${giftSVG}</div>
                    </div>
                </div>

                <!-- Step 3: Result (Win or Lose) -->
                <div id="step-3-result" class="hidden">
                    <div id="result-icon" class="text-6xl mb-4 animate-bounce"></div>
                    <h2 id="result-title" class="text-3xl font-bold mb-2"></h2>
                    <p id="result-subtitle" class="text-lg mb-2"></p>
                    <div id="game-prize-result" class="text-xl font-bold text-brand-500 bg-emerald-950/80 py-3 px-6 rounded-xl border border-brand-500/30 inline-block mb-6 shadow-inner"></div>
                    <p id="result-instruction" class="text-emerald-400 text-sm mb-6"></p>
                    <button onclick="document.getElementById('gamification-modal').remove()" class="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition border border-emerald-600">العودة للقائمة</button>
                </div>

            </div>
        </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // ── Step 1 → Step 2 with validation ──
        document.getElementById('game-start-btn').addEventListener('click', () => {
            const phone = document.getElementById('game-phone').value.trim();
            const errorEl = document.getElementById('game-phone-error');
            const phoneInput = document.getElementById('game-phone');

            // Strip non-digit characters for validation
            const digitsOnly = phone.replace(/\D/g, '');

            if (digitsOnly.length < 9) {
                errorEl.classList.add('visible');
                phoneInput.classList.remove('border-emerald-700');
                phoneInput.classList.add('border-red-500');
                // Auto-clear error on next input
                phoneInput.addEventListener('input', function handler() {
                    errorEl.classList.remove('visible');
                    phoneInput.classList.remove('border-red-500');
                    phoneInput.classList.add('border-emerald-700');
                    phoneInput.removeEventListener('input', handler);
                });
                return;
            }

            window._gamificationLead = {
                name: document.getElementById('game-name').value.trim(),
                phone: phone,
                prizes: prizes
            };
            document.getElementById('step-1-lead').classList.add('hidden');
            document.getElementById('step-2-game').classList.remove('hidden');
        });

        // ── Box Game Logic ──
        window.playBoxGame = async function (el) {
            if (el.classList.contains('opened')) return;

            // Disable all boxes
            document.querySelectorAll('.game-box-3d').forEach(b => {
                b.classList.add('opened', 'opacity-40', 'cursor-not-allowed');
                b.style.pointerEvents = 'none';
            });
            el.classList.remove('opacity-40');
            el.style.opacity = '1';
            el.classList.add('shake');

            const randomPrize = window._gamificationLead.prizes[Math.floor(Math.random() * window._gamificationLead.prizes.length)];
            const isLoss = randomPrize.includes('حظ');

            setTimeout(() => {
                el.classList.remove('shake', 'game-box-3d');
                el.classList.add('box-open');
                el.style.animation = 'none';
                el.innerHTML = `<span class="text-brand-500 font-bold text-xs text-center px-2 leading-tight">${randomPrize}</span>`;

                setTimeout(() => {
                    document.getElementById('step-2-game').classList.add('hidden');
                    const resultEl = document.getElementById('step-3-result');
                    resultEl.classList.remove('hidden');

                    document.getElementById('game-prize-result').innerText = randomPrize;

                    if (isLoss) {
                        // ── Losing scenario ──
                        document.getElementById('result-icon').innerText = '😅';
                        document.getElementById('result-title').className = 'text-3xl font-bold mb-2 text-white';
                        document.getElementById('result-title').innerText = 'حظ أوفر المرة القادمة!';
                        document.getElementById('result-subtitle').className = 'text-emerald-300 text-lg mb-2';
                        document.getElementById('result-subtitle').innerText = 'لا تيأس، الحظ يبتسم لك قريباً';
                        document.getElementById('result-instruction').innerText = 'يمكنك المحاولة مرة أخرى في زيارتك القادمة.';
                    } else {
                        // ── Winning scenario ──
                        document.getElementById('result-icon').innerText = '🎉';
                        document.getElementById('result-title').className = 'text-3xl font-bold mb-2 text-brand-500';
                        document.getElementById('result-title').innerText = 'مبروك!';
                        document.getElementById('result-subtitle').className = 'text-white text-lg mb-2';
                        document.getElementById('result-subtitle').innerText = 'لقد فزت بـ:';
                        document.getElementById('result-instruction').innerText = 'سيتم إرفاق جائزتك تلقائياً مع طلبك.';

                        // Save prize globally for cashier integration
                        window._wonPrize = randomPrize;
                        console.log("🏆 [Game Engine] Prize saved globally:", window._wonPrize);
                    }

                    // Post lead to Baserow
                    postGamificationLead(window._gamificationLead.name, window._gamificationLead.phone, randomPrize);
                }, 1500);
            }, 500);
        };
    };

    // ══════════════════════════════════════════════
    //  POST LEAD — Background Data Persistence
    // ══════════════════════════════════════════════
    const postGamificationLead = async (name, phone, prize) => {
        try {
            await fetch(`https://baserow.vidsai.site/api/database/rows/table/${CUSTOMERS_TABLE_ID}/?user_field_names=true`, {
                method: 'POST',
                headers: { "Authorization": `Token ${BASEROW_TOKEN}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    "Name": name,
                    "Phone": phone,
                    "Prize_Won": prize
                })
            });
            console.log("✅ [Game Engine] Lead posted to Baserow.");
        } catch (e) {
            console.warn("⚠️ [Game Engine] Background lead post failed:", e);
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGame);
    } else {
        initGame();
    }

})();
