window.renderMarketingSettings = async function() {
    const dynamicContent = document.getElementById('dynamic-content');
    dynamicContent.innerHTML = `<div class="flex items-center justify-center h-64"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div></div>`;

    try {
        const res = await fetch(`https://baserow.vidsai.site/api/database/rows/table/${MARKETING_SETTINGS_TABLE_ID}/1/?user_field_names=true`, {
            headers: { "Authorization": `Token ${BASEROW_TOKEN}` }
        });
        
        let settings = { Is_Active: false, Game_Type: 'boxes', Trigger_Delay: 30, Prizes: 'خصم 10%, حلويات مجانية, مشروب مجاني, حظ أوفر' };
        let exists = false;
        
        if (res.ok) {
            settings = await res.json();
            exists = true;
        }

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
                        <input type="checkbox" id="crm-is-active" class="sr-only peer" ${settings.Is_Active ? 'checked' : ''}>
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

                <!-- Prizes -->
                <div>
                    <label class="block text-sm text-gray-300 mb-2 font-bold">الجوائز المتاحة (مفصولة بفاصلة)</label>
                    <textarea id="crm-prizes" rows="4" class="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white outline-none focus:border-brand transition" placeholder="مثال: خصم 10%, مشروب مجاني, حظ أوفر...">${settings.Prizes || ''}</textarea>
                </div>

            </div>
        </div>`;

    } catch (error) {
        dynamicContent.innerHTML = `<div class="text-center text-red-500 mt-10">حدث خطأ أثناء تحميل الإعدادات</div>`;
        console.error("Marketing settings fetch error:", error);
    }
};

window.saveMarketingSettings = async function(exists) {
    const btn = document.getElementById('crm-save-btn');
    const originalText = btn.innerText;
    btn.innerText = "جاري الحفظ...";
    btn.disabled = true;

    const payload = {
        "Is_Active": document.getElementById('crm-is-active').checked,
        "Game_Type": document.getElementById('crm-game-type').value,
        "Trigger_Delay": parseInt(document.getElementById('crm-trigger-delay').value) || 30,
        "Prizes": document.getElementById('crm-prizes').value.trim()
    };

    try {
        const method = exists ? 'PATCH' : 'POST';
        const url = exists 
            ? `https://baserow.vidsai.site/api/database/rows/table/${MARKETING_SETTINGS_TABLE_ID}/1/?user_field_names=true`
            : `https://baserow.vidsai.site/api/database/rows/table/${MARKETING_SETTINGS_TABLE_ID}/?user_field_names=true`;

        const res = await fetch(url, {
            method: method,
            headers: { "Authorization": `Token ${BASEROW_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            window.showToast("تم حفظ الإعدادات بنجاح", "success");
        } else {
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
