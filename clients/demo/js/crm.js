window.renderMarketingSettings = async function () {
    const dynamicContent = document.getElementById('dynamic-content');
    dynamicContent.innerHTML = `<div class="flex items-center justify-center h-64"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div></div>`;

    try {
        const cb = new Date().getTime();
        const res = await fetch(`https://baserow.vidsai.site/api/database/rows/table/${MARKETING_SETTINGS_TABLE_ID}/?user_field_names=true&size=1&cb=${cb}`, {
            headers: { "Authorization": `Token ${BASEROW_TOKEN}` }
        });

        let settings = { Is_Active: false, Game_Type: 'boxes', Trigger_Delay: 30, Prizes: 'خصم 10%, حلويات مجانية, مشروب مجاني, حظ أوفر' };
        window.currentMarketingRowId = null;

        if (res.ok) {
            const data = await res.json();
            if (data.results && data.results.length > 0) {
                settings = data.results[0];
                window.currentMarketingRowId = settings.id;
                console.log("⚙️ [CRM] Settings loaded from Row ID:", window.currentMarketingRowId);
            }
        }

        // Parse existing prizes into array
        window.currentMarketingPrizes = settings.Prizes ? settings.Prizes.split(',').map(p => p.trim()).filter(p => p) : [];

        const exists = window.currentMarketingRowId !== null;

        dynamicContent.innerHTML = `
        <div class="animate-fade-in pb-20 max-w-4xl mx-auto">
            <div class="flex justify-between items-end mb-6">
                <div>
                    <h2 class="text-3xl font-bold text-white mb-2 tracking-tight">إدارة التسويق والألعاب</h2>
                    <p class="text-gray-400 text-sm">قم بضبط إعدادات الألعاب التفاعلية لعملائك</p>
                </div>
                <button onclick="window.saveMarketingSettings(${exists})" id="crm-save-btn" class="bg-brand hover:bg-brand-dark text-black font-bold py-2.5 px-6 rounded-lg transition shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                    حفظ الإعدادات
                </button>
            </div>

            <div class="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700 p-6 space-y-6 shadow-xl">
                
                <!-- Is Active -->
                <div class="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl border border-gray-700">
                    <div>
                        <h3 class="text-white font-bold text-lg">تفعيل الألعاب (Gamification)</h3>
                        <p class="text-xs text-gray-400 mt-1">عرض اللعبة للعميل أثناء تصفح المنيو</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="crm-is-active" class="sr-only peer" ${(settings.Is_Active === true || settings.Is_Active === "true") ? 'checked' : ''}>
                        <div class="w-14 h-7 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-brand"></div>
                    </label>
                </div>

                <!-- Game Type -->
                <div>
                    <label class="block text-sm text-gray-300 mb-2 font-bold">نوع اللعبة</label>
                    <select id="crm-game-type" class="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white outline-none focus:border-brand transition">
                        <option value="boxes" ${settings.Game_Type === 'boxes' ? 'selected' : ''}>الصناديق الثلاثة (Boxes)</option>
                        <option value="wheel" ${settings.Game_Type === 'wheel' ? 'selected' : ''}>عجلة الحظ (Wheel) - قريباً</option>
                        <option value="scratch" ${settings.Game_Type === 'scratch' ? 'selected' : ''}>بطاقة الخدش (Scratch) - قريباً</option>
                    </select>
                </div>

                <!-- Trigger Delay -->
                <div>
                    <label class="block text-sm text-gray-300 mb-2 font-bold">تأخير الظهور (بالثواني)</label>
                    <input type="number" id="crm-trigger-delay" value="${settings.Trigger_Delay || 30}" class="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white number-font outline-none focus:border-brand transition" min="1">
                    <p class="text-xs text-gray-500 mt-1">الوقت المستغرق قبل ظهور اللعبة للعميل بعد فتح المنيو</p>
                </div>

                <!-- Smart Prizes Selector -->
                <div>
                    <label class="block text-sm text-gray-300 mb-2 font-bold">الجوائز المتاحة</label>
                    <div class="flex gap-2 mb-3">
                        <select id="crm-prize-select" onchange="window.handleCrmPrizeSelectChange()" class="flex-1 p-3 bg-gray-900 border border-gray-700 rounded-lg text-white outline-none focus:border-brand transition">
                            <option value="خصم 5%">خصم 5%</option>
                            <option value="خصم 10%">خصم 10%</option>
                            <option value="خصم 15%">خصم 15%</option>
                            <option value="خصم 20%">خصم 20%</option>
                            <option value="خصم 25%">خصم 25%</option>
                            <option value="مشروب مجاني">مشروب مجاني</option>
                            <option value="حلوى مجانية">حلوى مجانية</option>
                            <option value="custom">جائزة مخصصة...</option>
                        </select>
                        <button onclick="window.addCrmPrize()" class="bg-brand/20 text-brand border border-brand/50 px-6 py-2 rounded-lg hover:bg-brand hover:text-black transition font-bold">إضافة</button>
                    </div>
                    
                    <div id="crm-custom-prize-container" class="hidden mb-3 animate-fade-in">
                        <input type="text" id="crm-custom-prize-input" class="w-full p-3 bg-gray-900 border border-brand/50 rounded-lg text-white outline-none placeholder-gray-600 focus:ring-1 ring-brand/50" placeholder="أدخل اسم الجائزة المخصصة...">
                    </div>

                    <div id="crm-prizes-chips" class="flex flex-wrap gap-2 p-3 bg-gray-900/30 rounded-xl border border-gray-700 min-h-[60px]">
                        <!-- Chips will render here -->
                    </div>
                    <p class="text-xs text-gray-500 mt-2">سيتم اختيار جائزة عشوائية من هذه القائمة لكل عميل يفتح الصندوق.</p>
                </div>

            </div>
        </div>`;

        // Render initial chips
        window.renderCrmPrizeChips();

    } catch (error) {
        dynamicContent.innerHTML = `<div class="text-center text-red-500 mt-10">حدث خطأ أثناء تحميل الإعدادات</div>`;
        console.error("Marketing settings fetch error:", error);
    }
};

// ── Smart Prizes Logic ──

window.handleCrmPrizeSelectChange = function() {
    const select = document.getElementById('crm-prize-select');
    const customContainer = document.getElementById('crm-custom-prize-container');
    if (select.value === 'custom') {
        customContainer.classList.remove('hidden');
    } else {
        customContainer.classList.add('hidden');
    }
};

window.addCrmPrize = function() {
    const select = document.getElementById('crm-prize-select');
    const customInput = document.getElementById('crm-custom-prize-input');
    let prizeName = select.value;

    if (prizeName === 'custom') {
        prizeName = customInput.value.trim();
        if (!prizeName) return;
        customInput.value = '';
    }

    if (!window.currentMarketingPrizes.includes(prizeName)) {
        window.currentMarketingPrizes.push(prizeName);
        window.renderCrmPrizeChips();
    }
};

window.removeCrmPrize = function(index) {
    window.currentMarketingPrizes.splice(index, 1);
    window.renderCrmPrizeChips();
};

window.renderCrmPrizeChips = function() {
    const container = document.getElementById('crm-prizes-chips');
    if (!container) return;

    if (window.currentMarketingPrizes.length === 0) {
        container.innerHTML = `<span class="text-gray-600 text-xs italic m-auto">لا توجد جوائز مضافة..</span>`;
        return;
    }

    container.innerHTML = window.currentMarketingPrizes.map((p, i) => `
        <div class="flex items-center gap-2 bg-emerald-900/50 text-ivory-100 border border-brand/30 px-3 py-1.5 rounded-full text-sm animate-zoom-in">
            <span class="font-medium">${p}</span>
            <button onclick="window.removeCrmPrize(${i})" class="text-brand hover:text-red-400 transition">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>
    `).join('');
};

window.saveMarketingSettings = async function (exists) {
    const btn = document.getElementById('crm-save-btn');
    const originalText = btn.innerText;
    btn.innerText = "جاري الحفظ...";
    btn.disabled = true;

    const payload = {
        "Is_Active": document.getElementById('crm-is-active').checked,
        "Game_Type": document.getElementById('crm-game-type').value,
        "Trigger_Delay": parseInt(document.getElementById('crm-trigger-delay').value) || 30,
        "Prizes": window.currentMarketingPrizes.join(', ')
    };

    try {
        const id = window.currentMarketingRowId;
        const method = id ? 'PATCH' : 'POST';
        const url = id
            ? `https://baserow.vidsai.site/api/database/rows/table/${MARKETING_SETTINGS_TABLE_ID}/${id}/?user_field_names=true`
            : `https://baserow.vidsai.site/api/database/rows/table/${MARKETING_SETTINGS_TABLE_ID}/?user_field_names=true`;

        const res = await fetch(url, {
            method: method,
            headers: { "Authorization": `Token ${BASEROW_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            window.showToast("تم حفظ الإعدادات بنجاح", "success");
        } else {
            const err = await res.json();
            console.error("Save error:", err);
            throw new Error("Failed to save");
        }
    } catch (e) {
        window.showToast("حدث خطأ أثناء الحفظ", "error");
        console.error(e);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
        setTimeout(() => window.renderMarketingSettings(), 500);
    }
};

// ══════════════════════════════════════════════
//  قائمة الزبائن (Customers List)
// ══════════════════════════════════════════════
window.renderCustomersList = async function () {
    const dynamicContent = document.getElementById('dynamic-content');
    dynamicContent.innerHTML = `<div class="flex items-center justify-center h-64"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div></div>`;

    try {
        const cb = new Date().getTime();
        const res = await fetch(`https://baserow.vidsai.site/api/database/rows/table/${CUSTOMERS_TABLE_ID}/?user_field_names=true&size=200&cb=${cb}`, {
            headers: { "Authorization": `Token ${BASEROW_TOKEN}` }
        });

        if (!res.ok) throw new Error("API Error: " + res.status);

        const data = await res.json();
        let customers = [];

        if (data.results && data.results.length > 0) {
            customers = data.results;
        } else if (data.id) {
            customers = [data];
        }

        // Format date helper
        const formatDate = (raw) => {
            if (!raw) return '--';
            try {
                const d = new Date(raw);
                if (isNaN(d.getTime())) return raw;
                return d.toLocaleDateString('ar-DZ', { year: 'numeric', month: 'short', day: 'numeric' }) + ' — ' + d.toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit', hour12: false });
            } catch (e) { return raw; }
        };

        // Extract field value (handles Baserow single_select objects)
        const val = (v) => {
            if (v === null || v === undefined) return '--';
            if (typeof v === 'object' && v.value !== undefined) return v.value;
            return String(v) || '--';
        };

        // Build table rows
        let rowsHtml = '';
        if (customers.length === 0) {
            rowsHtml = `
            <tr>
                <td colspan="4" class="text-center py-16">
                    <div class="flex flex-col items-center gap-3">
                        <svg class="w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        <p class="text-gray-500 text-lg font-bold">لا يوجد زبائن بعد</p>
                        <p class="text-gray-600 text-sm">سيظهر الزبائن هنا بعد مشاركتهم في ألعاب التسويق</p>
                    </div>
                </td>
            </tr>`;
        } else {
            // Reverse to show newest first
            customers.reverse().forEach((c, i) => {
                const isWin = c.Prize_Won && !String(c.Prize_Won).includes('حظ');
                const prizeBadgeClass = isWin
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                    : 'bg-gray-700/50 text-gray-400 border border-gray-600';
                const prizeIcon = isWin ? '🏆' : '😅';

                rowsHtml += `
                <tr class="border-b border-gray-700/50 hover:bg-gray-800/50 transition">
                    <td class="py-3.5 px-4 text-gray-400 text-xs number-font whitespace-nowrap">${formatDate(c.created_on || c['Created at'] || c.Date)}</td>
                    <td class="py-3.5 px-4 text-white font-medium">${val(c.Name) || 'بدون اسم'}</td>
                    <td class="py-3.5 px-4 text-gray-300 number-font text-left" dir="ltr">${val(c.Phone)}</td>
                    <td class="py-3.5 px-4">
                        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${prizeBadgeClass}">
                            ${prizeIcon} ${val(c.Prize_Won)}
                        </span>
                    </td>
                </tr>`;
            });
        }

        dynamicContent.innerHTML = `
        <div class="animate-fade-in pb-20 max-w-5xl mx-auto">
            <div class="flex justify-between items-end mb-6">
                <div>
                    <h2 class="text-3xl font-bold text-white mb-2 tracking-tight">قائمة الزبائن</h2>
                    <p class="text-gray-400 text-sm">جميع الزبائن المسجلين عبر نظام الألعاب التسويقية</p>
                </div>
                <div class="flex items-center gap-3">
                    <span class="bg-brand/10 text-brand border border-brand/20 px-4 py-2 rounded-lg text-sm font-bold number-font">${customers.length} زبون</span>
                    <button onclick="window.renderCustomersList()" class="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition text-sm font-bold">
                        <svg class="w-4 h-4 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                        تحديث
                    </button>
                </div>
            </div>

            <div class="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700 shadow-xl overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-right" style="direction: rtl;">
                        <thead>
                            <tr class="bg-gray-900/80 border-b border-gray-700">
                                <th class="py-3.5 px-4 text-xs text-gray-400 font-bold uppercase tracking-wider">التاريخ</th>
                                <th class="py-3.5 px-4 text-xs text-gray-400 font-bold uppercase tracking-wider">الاسم</th>
                                <th class="py-3.5 px-4 text-xs text-gray-400 font-bold uppercase tracking-wider">الهاتف</th>
                                <th class="py-3.5 px-4 text-xs text-gray-400 font-bold uppercase tracking-wider">الجائزة</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-700/30">
                            ${rowsHtml}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>`;

    } catch (error) {
        console.error("Customers list fetch error:", error);
        dynamicContent.innerHTML = `
        <div class="flex flex-col items-center justify-center h-64 gap-4">
            <svg class="w-16 h-16 text-red-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            <p class="text-red-400 font-bold text-lg">حدث خطأ أثناء تحميل قائمة الزبائن</p>
            <button onclick="window.renderCustomersList()" class="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition text-sm">إعادة المحاولة</button>
        </div>`;
    }
};
