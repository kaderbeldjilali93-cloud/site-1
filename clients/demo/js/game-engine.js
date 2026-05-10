// game-engine.js

(function() {
    // Inject Custom Styles for the Game
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
        .shake { animation: shake 0.5s; }
        .box-3d {
            background: linear-gradient(135deg, #FFD700, #DAA520);
            box-shadow: 0 10px 20px rgba(0,0,0,0.5), inset 0 -5px 15px rgba(0,0,0,0.3);
            border: 2px solid #B8860B;
        }
        .box-open {
            background: linear-gradient(135deg, #2d3748, #1a202c);
            border: 2px solid #FFD700;
        }
    `;
    document.head.appendChild(style);

    const initGame = async () => {
        console.log("🎮 [Game Engine] Initializing...");
        try {
            const cb = new Date().getTime();
            // Fetch the table rows
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
                settings = data.results[0]; // Extracted from Array
            } else if (data.id) {
                settings = data; // Extracted as direct Object
            }

            if (!settings) {
                console.warn("⚠️ [Game Engine] Table is completely empty (No rows).");
                return;
            }

            console.log("⚙️ [Game Engine] Settings applied:", settings);

            // Handle Boolean strictly (Accounting for string "false" or actual boolean false)
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

    const showLeadCaptureModal = (prizes) => {
        // Prevent showing if already shown
        if (document.getElementById('gamification-modal')) return;

        const modalHtml = `
        <div id="gamification-modal" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in" style="direction: rtl;">
            <div class="bg-gray-800/90 border border-brand/50 rounded-2xl p-6 w-full max-w-sm shadow-[0_0_30px_rgba(212,175,55,0.2)] text-center relative">
                <button onclick="document.getElementById('gamification-modal').remove()" class="absolute top-4 left-4 text-gray-400 hover:text-white">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <div id="step-1-lead">
                    <h2 class="text-3xl font-bold text-brand mb-2">جرب حظك! 🎁</h2>
                    <p class="text-gray-300 text-sm mb-6">أدخل رقم هاتفك لفرصة الفوز بجوائز وخصومات مميزة اليوم.</p>
                    
                    <div class="space-y-4 text-right">
                        <div>
                            <label class="block text-xs text-gray-400 mb-1 font-bold">الاسم (اختياري)</label>
                            <input type="text" id="game-name" class="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white outline-none focus:border-brand transition">
                        </div>
                        <div>
                            <label class="block text-xs text-gray-400 mb-1 font-bold">رقم الهاتف (مطلوب)</label>
                            <input type="tel" id="game-phone" class="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white text-left number-font outline-none focus:border-brand transition" placeholder="05XXXXXXXX">
                        </div>
                    </div>
                    
                    <div class="mt-6 flex flex-col gap-3">
                        <button id="game-start-btn" class="w-full bg-brand hover:bg-brand-dark text-black font-bold py-3 rounded-lg transition shadow-lg">إلعب الآن</button>
                        <button onclick="document.getElementById('gamification-modal').remove()" class="w-full text-gray-400 hover:text-white text-sm py-2">لا شكراً</button>
                    </div>
                </div>

                <div id="step-2-game" class="hidden">
                    <h2 class="text-2xl font-bold text-white mb-2">اختر صندوقاً!</h2>
                    <p class="text-gray-400 text-sm mb-8">اضغط على أحد الصناديق لاكتشاف جائزتك</p>
                    
                    <div class="flex justify-center gap-4 mb-8">
                        <div class="box-3d w-24 h-24 rounded-xl cursor-pointer flex items-center justify-center transition hover:scale-105" onclick="window.playBoxGame(this)">
                            <span class="text-4xl">🎁</span>
                        </div>
                        <div class="box-3d w-24 h-24 rounded-xl cursor-pointer flex items-center justify-center transition hover:scale-105" onclick="window.playBoxGame(this)">
                            <span class="text-4xl">🎁</span>
                        </div>
                        <div class="box-3d w-24 h-24 rounded-xl cursor-pointer flex items-center justify-center transition hover:scale-105" onclick="window.playBoxGame(this)">
                            <span class="text-4xl">🎁</span>
                        </div>
                    </div>
                </div>

                <div id="step-3-success" class="hidden">
                    <div class="text-6xl mb-4 animate-bounce">🎉</div>
                    <h2 class="text-3xl font-bold text-brand mb-2">مبروك!</h2>
                    <p class="text-white text-lg mb-2">لقد فزت بـ:</p>
                    <div id="game-prize-result" class="text-xl font-bold text-brand bg-gray-900 py-3 px-4 rounded-lg border border-brand/30 inline-block mb-6 shadow-inner"></div>
                    <p class="text-gray-400 text-sm mb-6">أظهر هذه الشاشة للكاشير للحصول على جائزتك.</p>
                    <button onclick="document.getElementById('gamification-modal').remove()" class="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition">إغلاق والعودة للقائمة</button>
                </div>

            </div>
        </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        document.getElementById('game-start-btn').addEventListener('click', () => {
            const phone = document.getElementById('game-phone').value.trim();
            if (!phone) {
                alert('يرجى إدخال رقم الهاتف للمشاركة.');
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

        // Expose function globally for the onclick
        window.playBoxGame = async function(el) {
            if (el.classList.contains('opened')) return;
            
            // Disable other boxes
            document.querySelectorAll('.box-3d').forEach(b => b.classList.add('opened', 'opacity-50', 'cursor-not-allowed'));
            el.classList.remove('opacity-50');
            el.classList.add('shake');
            
            const randomPrize = window._gamificationLead.prizes[Math.floor(Math.random() * window._gamificationLead.prizes.length)];
            
            setTimeout(() => {
                el.classList.remove('shake', 'box-3d');
                el.classList.add('box-open');
                el.innerHTML = `<span class="text-brand font-bold text-sm text-center px-1">${randomPrize}</span>`;
                
                setTimeout(() => {
                    document.getElementById('step-2-game').classList.add('hidden');
                    document.getElementById('game-prize-result').innerText = randomPrize;
                    document.getElementById('step-3-success').classList.remove('hidden');
                    
                    // Post to Baserow in background
                    postGamificationLead(window._gamificationLead.name, window._gamificationLead.phone, randomPrize);
                }, 1500);
            }, 500);
        };
    };

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
        } catch (e) {
            console.warn("Silent background lead post failed", e);
        }
    };

    // Initialize when ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGame);
    } else {
        initGame();
    }

})();
