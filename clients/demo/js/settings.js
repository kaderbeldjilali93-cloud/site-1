// =========================================================
// ⚙️ Settings Logic (إعدادات المطعم، الطباعة، والحساب)
// =========================================================

window.renderSettingsRestaurant = async function() {
    const dynamicContent = document.getElementById('dynamic-content');
    if(!dynamicContent) return;
    
    dynamicContent.innerHTML = '<div class="flex h-full items-center justify-center"><div class="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-brand"></div></div>';
    
    let currentName = '';
    let currentLogo = '';
    let currentWelcome = 'مرحباً بك في مطعمنا';
    let currency = 'DA';

    try {
        const response = await fetch(`https://baserow.vidsai.site/api/database/rows/table/${SETTINGS_TABLE_ID}/?user_field_names=true`, {
            method: 'GET',
            headers: { "Authorization": `Token ${BASEROW_TOKEN}` }
        });
        if (response.ok) {
            const data = await response.json();
            if (data.results && data.results.length > 0) {
                const row = data.results[0];
                currentName = row.Name ?? '';
                currentWelcome = row.WelcomeMessage ?? 'مرحباً بك في مطعمنا';
                currency = row.Currency ?? 'DA';
                if (row.Logo && row.Logo.length > 0) {
                    currentLogo = row.Logo[0].url;
                }
            }
        }
    } catch (error) {
        console.warn("Failed to fetch settings:", error);
    }

    dynamicContent.innerHTML = '';
    
    const hasLogo = currentLogo && currentLogo.trim() !== '';

    const container = document.createElement('div');
    container.className = "max-w-2xl mx-auto pb-10 mt-6";

    container.innerHTML = `
        <div class="bg-gray-800 border border-gray-700 rounded-2xl shadow-xl p-6 md:p-8">
            <div class="space-y-6">
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">اسم المطعم في المنيو</label>
                    <input type="text" id="setting-resto-name" value="${currentName}" class="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand outline-none transition" placeholder="مثال: مطعم الأمل">
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">العبارة الترحيبية (في المنيو)</label>
                    <input type="text" id="setting-welcome-msg" value="${currentWelcome}" class="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand outline-none transition" placeholder="مثال: أهلاً بكم في مطعمنا...">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">العملة (Currency)</label>
                    <div class="relative">
                        <select id="setting-currency" class="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand outline-none transition appearance-none cursor-pointer" dir="rtl">
                            <option value="DA">الجزائر (DA)</option>
                            <option value="EGP">مصر (EGP)</option>
                            <option value="TND">تونس (TND)</option>
                            <option value="MAD">المغرب (MAD)</option>
                            <option value="SAR">السعودية (SAR)</option>
                            <option value="AED">الامارات (AED)</option>
                            <option value="BHD">البحرين (BHD)</option>
                            <option value="QAR">قطر (QAR)</option>
                            <option value="SYP">سوريا (SYP)</option>
                            <option value="KWD">الكويت (KWD)</option>
                            <option value="IQD">العراق (IQD)</option>
                            <option value="€">أوروبا (€)</option>
                            <option value="CHF">سويسرا (CHF)</option>
                            <option value="$">الولايات المتحدة الامريكية ($)</option>
                            <option value="CA$">كندا (CA$)</option>
                            <option value="฿">تايلاند (฿)</option>
                            <option value="RM">ماليزيا (RM)</option>
                            <option value="LBP">لبنان (LBP)</option>
                        </select>
                        <div class="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">شعار المطعم (Logo)</label>
                    <input type="hidden" id="logo-action" value="keep">
                    
                    <div class="relative w-32 h-32 rounded-xl border-2 border-gray-600 overflow-hidden bg-gray-900 group">
                        <img id="logo-preview" src="${currentLogo || 'https://placehold.co/150x150/1f2937/a1a1aa?text=No+Logo'}" class="w-full h-full object-contain p-2" onerror="this.src='https://placehold.co/150x150/1f2937/a1a1aa?text=Error'; this.onerror=null;">
                        
                        <button id="btn-remove-logo" onclick="window.removeRestaurantLogo()" class="absolute top-1 left-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded shadow-lg transition ${hasLogo ? '' : 'hidden'}" title="حذف الشعار">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>

                    <div class="relative mt-4">
                        <input type="file" id="setting-resto-logo" accept="image/*" class="hidden" onchange="window.previewRestaurantLogo(this)">
                        <label for="setting-resto-logo" id="resto-logo-label" class="w-full flex items-center justify-center gap-2 bg-gray-700 text-white font-bold rounded-lg px-4 py-2.5 cursor-pointer hover:bg-gray-600 transition shadow-inner border border-gray-600">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                            <span>تعديل الشعار</span>
                        </label>
                    </div>
                    <p class="text-xs text-brand mt-2 font-medium">ملاحظة: يُفضل أن يكون الشعار بدون خلفية (بصيغة PNG) لكي يتناسق مع التصميم بشكل مثالي.</p>
                </div>

                <div class="pt-4 mt-6 border-t border-gray-700">
                    <button id="btn-save-settings" onclick="window.saveRestaurantSettings()" class="w-full bg-brand hover:bg-brand-dark text-black font-bold text-lg py-4 rounded-xl transition shadow-lg transform hover:scale-[1.01]">
                        حفظ الإعدادات
                    </button>
                </div>
            </div>
        </div>
    `;
    dynamicContent.appendChild(container);
    
    const currencySelect = document.getElementById('setting-currency');
    if (currencySelect) {
        currencySelect.value = currency;
    }
};

window.previewRestaurantLogo = function(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('logo-preview').src = e.target.result;
            document.getElementById('logo-action').value = 'update';
            document.getElementById('btn-remove-logo').classList.remove('hidden');
        };
        reader.readAsDataURL(input.files[0]);
        
        const label = document.getElementById('resto-logo-label');
        label.innerHTML = `
            <svg class="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            <span class="truncate">${input.files[0].name}</span>
        `;
    }
};

window.removeRestaurantLogo = function() {
    document.getElementById('logo-preview').src = 'https://placehold.co/150x150/1f2937/a1a1aa?text=No+Logo';
    document.getElementById('logo-action').value = 'delete';
    document.getElementById('btn-remove-logo').classList.add('hidden');
    document.getElementById('setting-resto-logo').value = '';
    
    const label = document.getElementById('resto-logo-label');
    label.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
        <span>تعديل الشعار</span>
    `;
};

window.saveRestaurantSettings = async function() {
    const btn = document.getElementById('btn-save-settings');
    const nameInput = document.getElementById('setting-resto-name');
    const welcomeInput = document.getElementById('setting-welcome-msg');
    const currencyInput = document.getElementById('setting-currency'); 
    const logoInput = document.getElementById('setting-resto-logo');
    const logoAction = document.getElementById('logo-action').value;
    
    const nameVal = nameInput.value.trim();
    const welcomeVal = welcomeInput.value.trim();
    const currencyVal = currencyInput.value.trim(); 
    const imageFile = logoInput.files ? logoInput.files[0] : null;

    const originalBtnText = btn.innerHTML;
    btn.innerHTML = `<span class="flex items-center justify-center gap-2"><div class="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-black"></div> جاري الحفظ...</span>`;
    btn.disabled = true;
    btn.classList.add('opacity-70', 'cursor-not-allowed');

    try {
        let uploadedFileName = null;
        
        if (logoAction === 'update' && imageFile) {
            const formData = new FormData();
            formData.append("file", imageFile);
            
            const uploadResponse = await fetch(`https://baserow.vidsai.site/api/user-files/upload-file/`, {
                method: 'POST',
                headers: { "Authorization": `Token ${BASEROW_TOKEN}` },
                body: formData
            });
            
            if (!uploadResponse.ok) {
                const errUpload = await uploadResponse.json();
                throw new Error("فشل رفع الشعار: " + (errUpload.error || ""));
            }
            
            const uploadedFileObj = await uploadResponse.json();
            if(uploadedFileObj && uploadedFileObj.name) {
                uploadedFileName = uploadedFileObj.name;
            }
        }

        const settingsResponse = await fetch(`https://baserow.vidsai.site/api/database/rows/table/${SETTINGS_TABLE_ID}/?user_field_names=true`, {
            method: 'GET',
            headers: { "Authorization": `Token ${BASEROW_TOKEN}` }
        });
        
        if (!settingsResponse.ok) throw new Error("فشل جلب إعدادات المطعم");
        
        const settingsData = await settingsResponse.json();
        
        if (settingsData.results && settingsData.results.length > 0) {
            const rowId = settingsData.results[0].id;
            
            const payload = { 
                "Name": nameVal,
                "WelcomeMessage": welcomeVal,
                "Currency": currencyVal 
            };

            if (logoAction === 'delete') {
                payload["Logo"] = [];
            } else if (uploadedFileName) {
                payload["Logo"] = [{ "name": uploadedFileName }];
            }

            const updateResponse = await fetch(`https://baserow.vidsai.site/api/database/rows/table/${SETTINGS_TABLE_ID}/${rowId}/?user_field_names=true`, {
                method: 'PATCH',
                headers: { 
                    "Authorization": `Token ${BASEROW_TOKEN}`, 
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify(payload)
            });

            if (!updateResponse.ok) {
                throw new Error("فشل تحديث إعدادات المطعم");
            }
            
        } else {
            const payload = { 
                "Name": nameVal,
                "WelcomeMessage": welcomeVal,
                "Currency": currencyVal 
            };
            if (uploadedFileName) {
                payload["Logo"] = [{ "name": uploadedFileName }];
            }
            const createResponse = await fetch(`https://baserow.vidsai.site/api/database/rows/table/${SETTINGS_TABLE_ID}/?user_field_names=true`, {
                method: 'POST',
                headers: { 
                    "Authorization": `Token ${BASEROW_TOKEN}`, 
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify(payload)
            });
            if (!createResponse.ok) throw new Error("فشل إنشاء الإعدادات");
        }

        localStorage.setItem('menu_restaurant_name', nameVal);
        localStorage.setItem('menu_welcome_message', welcomeVal);
        localStorage.setItem('system_currency', currencyVal); 
        if (logoAction === 'delete') {
            localStorage.removeItem('menu_restaurant_logo');
        }

        window.showSuccessPopup();
        document.getElementById('logo-action').value = 'keep'; 
        
    } catch (error) {
        console.error("Baserow API Error Details:", error);
        window.showToast("خطأ: " + error.message, "error");
    } finally {
        btn.innerHTML = originalBtnText;
        btn.disabled = false;
        btn.classList.remove('opacity-70', 'cursor-not-allowed');
    }
};

window.previewPrintQRCode = function(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('print-qr-preview');
            if(preview) preview.src = e.target.result;
            const action = document.getElementById('print-qr-action');
            if(action) action.value = 'update';
            const btnRemove = document.getElementById('btn-remove-print-qr');
            if(btnRemove) btnRemove.classList.remove('hidden');
            
            const previewImg = document.getElementById('preview-qr-img');
            if(previewImg) {
                previewImg.src = e.target.result;
                previewImg.classList.remove('hidden');
            }
        };
        reader.readAsDataURL(input.files[0]);
        
        const label = document.getElementById('print-qr-label');
        if(label) {
            label.innerHTML = `
                <svg class="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                <span class="truncate">${input.files[0].name}</span>
            `;
        }
    }
};

window.removePrintQRCode = function() {
    const preview = document.getElementById('print-qr-preview');
    if(preview) preview.src = 'https://placehold.co/150x150/1f2937/a1a1aa?text=No+QR';
    const action = document.getElementById('print-qr-action');
    if(action) action.value = 'delete';
    const btnRemove = document.getElementById('btn-remove-print-qr');
    if(btnRemove) btnRemove.classList.add('hidden');
    const qrInput = document.getElementById('setting-print-qr');
    if(qrInput) qrInput.value = '';
    
    const previewImg = document.getElementById('preview-qr-img');
    if(previewImg) {
        previewImg.src = '';
        previewImg.classList.add('hidden');
    }
    
    const label = document.getElementById('print-qr-label');
    if(label) {
        label.innerHTML = `
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
            <span>تعديل الـ QR Code</span>
        `;
    }
};

window.renderSettingsPrint = async function() {
    const dynamicContent = document.getElementById('dynamic-content');
    if(!dynamicContent) return;
    dynamicContent.innerHTML = '<div class="flex h-full items-center justify-center"><div class="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-brand"></div></div>';
    
    let currentName = localStorage.getItem('menu_restaurant_name') || 'RestoPro';
    let currentTop = localStorage.getItem('print_receipt_top') || 'إدارة المطاعم الذكية';
    let currentBottom = localStorage.getItem('print_receipt_bottom') || 'شكراً لزيارتكم!\\nThank you for your visit';
    let currentPhone = localStorage.getItem('print_phone') || '';
    let currentQrCode = localStorage.getItem('print_qr_code') || '';

    try {
        const response = await fetch(`https://baserow.vidsai.site/api/database/rows/table/${SETTINGS_TABLE_ID}/?user_field_names=true`, {
            method: 'GET',
            headers: { "Authorization": `Token ${BASEROW_TOKEN}` }
        });
        if (response.ok) {
            const data = await response.json();
            if (data.results && data.results.length > 0) {
                const row = data.results[0];
                currentName = row.Name ?? currentName;
                currentTop = row.ReceiptTop ?? currentTop;
                currentBottom = row.ReceiptBottom ?? currentBottom;
                currentPhone = row.Phone ?? currentPhone;
                if (row.QRCode && row.QRCode.length > 0) {
                    currentQrCode = row.QRCode[0].url;
                }
            }
        }
    } catch (error) {
        console.warn("Failed to fetch print settings:", error);
    }

    dynamicContent.innerHTML = '';
    const hasQrCode = currentQrCode && currentQrCode.trim() !== '';

    const container = document.createElement('div');
    container.className = "max-w-6xl mx-auto pb-10 flex flex-col lg:flex-row gap-8 mt-6";

    const formSection = document.createElement('div');
    formSection.className = "flex-1 bg-gray-800 border border-gray-700 rounded-2xl shadow-xl p-6 md:p-8 order-2 lg:order-1";
    formSection.innerHTML = `
        <div class="space-y-6">
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">رقم الهاتف / العنوان (أسفل الإسم)</label>
                <input type="text" id="setting-print-phone" value="${currentPhone}" oninput="document.getElementById('preview-phone').innerText = this.value" class="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand outline-none transition" placeholder="مثال: 0550 00 00 00 - حي الأمل">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">رسالة أعلى التذكرة (ترحيب)</label>
                <textarea id="setting-print-top" rows="3" oninput="document.getElementById('preview-top').innerText = this.value" class="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand outline-none resize-none transition" placeholder="مثال: أهلاً بكم في مطعمنا...">${currentTop}</textarea>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">رسالة أسفل التذكرة (وداع/سوشيال ميديا)</label>
                <textarea id="setting-print-bottom" rows="4" oninput="document.getElementById('preview-bottom').innerText = this.value" class="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand outline-none resize-none transition" placeholder="مثال: شكراً لزيارتكم! تابعونا على انستغرام...">${currentBottom}</textarea>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">صورة رمز الاستجابة السريعة (QR Code)</label>
                <input type="hidden" id="print-qr-action" value="keep">
                
                <div class="relative w-32 h-32 rounded-xl border-2 border-gray-600 overflow-hidden bg-gray-900 group">
                    <img id="print-qr-preview" src="${currentQrCode || 'https://placehold.co/150x150/1f2937/a1a1aa?text=No+QR'}" class="w-full h-full object-contain p-2" onerror="this.src='https://placehold.co/150x150/1f2937/a1a1aa?text=Error'; this.onerror=null;">
                    
                    <button id="btn-remove-print-qr" onclick="window.removePrintQRCode()" class="absolute top-1 left-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded shadow-lg transition ${hasQrCode ? '' : 'hidden'}" title="حذف الشعار">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>

                <div class="relative mt-4">
                    <input type="file" id="setting-print-qr" accept="image/*" class="hidden" onchange="window.previewPrintQRCode(this)">
                    <label for="setting-print-qr" id="print-qr-label" class="w-full flex items-center justify-center gap-2 bg-gray-700 text-white font-bold rounded-lg px-4 py-2.5 cursor-pointer hover:bg-gray-600 transition shadow-inner border border-gray-600">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                        <span>تعديل الـ QR Code</span>
                    </label>
                </div>
            </div>

            <div class="pt-4 mt-6 border-t border-gray-700">
                <button id="btn-save-print" onclick="window.savePrintSettings()" class="w-full bg-brand hover:bg-brand-dark text-black font-bold text-lg py-4 rounded-xl transition shadow-lg transform hover:scale-[1.01]">
                    حفظ إعدادات الطباعة
                </button>
            </div>
        </div>
    `;
    
    const previewSection = document.createElement('div');
    previewSection.className = "w-full lg:w-80 flex-shrink-0 flex justify-center order-1 lg:order-2";
    previewSection.innerHTML = `
        <div class="bg-white text-black p-4 w-full max-w-sm rounded shadow-2xl font-mono text-center text-sm leading-relaxed border-t-8 border-gray-300">
            <h2 id="preview-name" class="font-bold text-xl mb-1">${currentName}</h2>
            <div id="preview-top" class="text-xs mb-1 whitespace-pre-line text-gray-800">${currentTop}</div>
            <div id="preview-phone" class="text-xs mb-3 font-bold">${currentPhone}</div>
            
            <div class="border-t border-dashed border-gray-400 my-3"></div>
            
            <div class="text-left text-xs mb-2 space-y-1">
                <div class="flex justify-between"><span>رقم الطلب:</span> <b>#D-015</b></div>
                <div class="flex justify-between"><span>الطاولة:</span> <b>T-4</b></div>
                <div class="flex justify-between"><span>التاريخ:</span> <span>${new Date().toLocaleDateString('ar-DZ')}</span></div>
            </div>
            
            <div class="border-t border-dashed border-gray-400 my-3"></div>
            
            <div class="text-left text-xs mb-2 space-y-2">
                <div class="font-bold border-b border-gray-300 pb-1 mb-1">تفاصيل الطلب:</div>
                <div class="flex justify-between"><span>1x Pizza Marguerita</span></div>
                <div class="flex justify-between"><span>2x Coca Cola</span></div>
            </div>
            
            <div class="border-t border-dashed border-gray-400 my-3"></div>
            
            <div class="flex justify-between font-bold text-sm mb-3 bg-gray-100 p-1">
                <span>المجموع:</span>
                <span>850 DA</span>
            </div>
            
            <div class="border-t border-dashed border-gray-400 my-3"></div>
            
            <div id="preview-bottom" class="text-xs font-bold whitespace-pre-line mt-3 text-gray-800">${currentBottom}</div>
            
            <img id="preview-qr-img" src="${currentQrCode}" class="w-[100px] h-[100px] object-cover mx-auto mt-3 ${hasQrCode ? '' : 'hidden'}">
        </div>
    `;

    container.appendChild(formSection);
    container.appendChild(previewSection);
    dynamicContent.appendChild(container);
};

window.savePrintSettings = async function() {
    const btn = document.getElementById('btn-save-print');
    const topVal = document.getElementById('setting-print-top').value.trim();
    const bottomVal = document.getElementById('setting-print-bottom').value.trim();
    const phoneVal = document.getElementById('setting-print-phone').value.trim();
    const qrAction = document.getElementById('print-qr-action').value;
    const qrInput = document.getElementById('setting-print-qr');
    const imageFile = qrInput && qrInput.files ? qrInput.files[0] : null;

    const originalBtnText = btn.innerHTML;
    btn.innerHTML = `<span class="flex items-center justify-center gap-2"><div class="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-black"></div> جاري الحفظ...</span>`;
    btn.disabled = true;
    btn.classList.add('opacity-70', 'cursor-not-allowed');

    try {
        let uploadedFileName = null;
        
        if (qrAction === 'update' && imageFile) {
            const formData = new FormData();
            formData.append("file", imageFile);
            
            const uploadResponse = await fetch(`https://baserow.vidsai.site/api/user-files/upload-file/`, {
                method: 'POST',
                headers: { "Authorization": `Token ${BASEROW_TOKEN}` },
                body: formData
            });
            
            if (!uploadResponse.ok) {
                const errUpload = await uploadResponse.json();
                throw new Error("فشل رفع الشعار: " + (errUpload.error || ""));
            }
            
            const uploadedFileObj = await uploadResponse.json();
            if(uploadedFileObj && uploadedFileObj.name) {
                uploadedFileName = uploadedFileObj.name;
            }
        }

        const settingsResponse = await fetch(`https://baserow.vidsai.site/api/database/rows/table/${SETTINGS_TABLE_ID}/?user_field_names=true`, {
            method: 'GET',
            headers: { "Authorization": `Token ${BASEROW_TOKEN}` }
        });
        
        if (!settingsResponse.ok) {
            throw new Error("فشل جلب الإعدادات");
        }
        
        const settingsData = await settingsResponse.json();
        const payload = {
            "ReceiptTop": topVal,
            "ReceiptBottom": bottomVal,
            "Phone": phoneVal
        };

        if (qrAction === 'delete') {
            payload["QRCode"] = [];
        } else if (uploadedFileName) {
            payload["QRCode"] = [{ "name": uploadedFileName }];
        }

        let finalQrUrl = '';

        if (settingsData.results && settingsData.results.length > 0) {
            const rowId = settingsData.results[0].id;
            
            const updateResponse = await fetch(`https://baserow.vidsai.site/api/database/rows/table/${SETTINGS_TABLE_ID}/${rowId}/?user_field_names=true`, {
                method: 'PATCH',
                headers: { 
                    "Authorization": `Token ${BASEROW_TOKEN}`, 
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify(payload)
            });

            if (!updateResponse.ok) throw new Error("فشل تحديث إعدادات الطباعة");
            const updatedData = await updateResponse.json();
            if (updatedData.QRCode && updatedData.QRCode.length > 0) finalQrUrl = updatedData.QRCode[0].url;
            
        } else {
            const createResponse = await fetch(`https://baserow.vidsai.site/api/database/rows/table/${SETTINGS_TABLE_ID}/?user_field_names=true`, {
                method: 'POST',
                headers: { 
                    "Authorization": `Token ${BASEROW_TOKEN}`, 
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify(payload)
            });
            if (!createResponse.ok) throw new Error("فشل إنشاء الإعدادات");
            const createdData = await createResponse.json();
            if (createdData.QRCode && createdData.QRCode.length > 0) finalQrUrl = createdData.QRCode[0].url;
        }

        localStorage.setItem('print_receipt_top', topVal);
        localStorage.setItem('print_receipt_bottom', bottomVal);
        localStorage.setItem('print_phone', phoneVal);
        
        if (qrAction === 'delete') {
            localStorage.removeItem('print_qr_code');
        } else if (finalQrUrl) {
            localStorage.setItem('print_qr_code', finalQrUrl);
        }

        window.showSuccessPopup();
        document.getElementById('print-qr-action').value = 'keep';
        
    } catch (error) {
        console.error("Baserow API Error Details:", error);
        window.showToast("خطأ: " + error.message, "error");
    } finally {
        btn.innerHTML = originalBtnText;
        btn.disabled = false;
        btn.classList.remove('opacity-70', 'cursor-not-allowed');
    }
};