// =========================================================
// 👥 إدارة العمال (Staff Management) - النسخة الذكية (ديناميكية 100%)
// =========================================================

window.renderStaff = async function () {
    const dynamicContent = document.getElementById('dynamic-content');
    dynamicContent.innerHTML = '<div class="text-center text-gray-400 py-10">جاري تحميل بيانات العمال...</div>';

    try {
        // 1. جلب بيانات العمال من Baserow
        const response = await fetch(`https://baserow.vidsai.site/api/database/rows/table/${STAFF_TABLE_ID}/?user_field_names=true`, {
            method: 'GET',
            headers: { "Authorization": `Token ${typeof BASEROW_TOKEN !== 'undefined' ? BASEROW_TOKEN : ''}` }
        });

        if (!response.ok) throw new Error("Failed to load staff");
        const data = await response.json();
        const staff = data.results;

        // 2. 💡 جلب أسماء القاعات ديناميكياً من خريطة الطاولات
        let uniqueRooms = new Set();
        if (typeof STATE !== 'undefined' && STATE.tableMapData) {
            Object.values(STATE.tableMapData).forEach(table => {
                const r = table.room || table.Room;
                if (r) uniqueRooms.add(r);
            });
        }
        
        let roomOptions = '<option value="">-- اختر القاعة --</option>';
        uniqueRooms.forEach(room => {
            roomOptions += `<option value="${room}">${room}</option>`;
        });

        // 3. 💡 جلب "محطات المطبخ" ديناميكياً من المنيو (Menu)
        let uniqueStations = new Set();
        try {
            // التحقق إذا كان المنيو محمل مسبقاً، وإلا نقوم بتحميله
            let menuItems = STATE.cachedMenuItems;
            if (!menuItems || menuItems.length === 0) {
                if (typeof window.fetchMenu === 'function') {
                    menuItems = await window.fetchMenu();
                    STATE.cachedMenuItems = menuItems; // حفظه في الذاكرة لتسريع النظام
                }
            }
            
            if (menuItems && menuItems.length > 0) {
                menuItems.forEach(item => {
                    // قراءة حقل Station (سواء كان نص عادي أو قائمة منسدلة من Baserow)
                    const st = (typeof item.Station === 'object' && item.Station !== null) ? item.Station.value : (item.Station || "");
                    if (st && String(st).trim() !== "") {
                        uniqueStations.add(String(st).trim());
                    }
                });
            }
        } catch (err) {
            console.warn("Failed to extract stations from menu", err);
        }

        let stationOptions = '<option value="الكل">الكل</option>';
        if (uniqueStations.size > 0) {
            uniqueStations.forEach(st => {
                stationOptions += `<option value="${st}">${st}</option>`;
            });
        } else {
            // خيارات احتياطية في حال كان المنيو فارغاً تماماً
            stationOptions += `
                <option value="بيتزا">بيتزا</option>
                <option value="مشويات">مشويات</option>
                <option value="مشروبات">مشروبات</option>
            `;
        }

        // 4. بناء الواجهة
        let html = `
            <div class="max-w-5xl mx-auto pb-10">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h2 class="text-2xl font-bold text-white mb-1">إدارة العمال (Staff)</h2>
                        <p class="text-gray-400 text-sm">تخصيص القاعات، المحطات، وتعديل الرموز السرية.</p>
                    </div>
                    <button onclick="window.showAddStaffModal()" class="bg-brand hover:bg-brand-dark text-black font-bold py-2.5 px-5 rounded-xl transition shadow-lg flex items-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                        إضافة عامل جديد
                    </button>
                </div>

                <div class="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden shadow-lg">
                    <div class="overflow-x-auto w-full">
                        <table class="w-full text-right min-w-[700px]">
                            <thead class="bg-gray-800 text-gray-400 text-sm font-bold">
                                <tr>
                                    <th class="py-4 px-4">الاسم</th>
                                    <th class="py-4 px-4">الدور</th>
                                    <th class="py-4 px-4 text-center">التخصيص</th>
                                    <th class="py-4 px-4 text-center">PIN</th>
                                    <th class="py-4 px-4 text-center">الحالة</th>
                                    <th class="py-4 px-4 text-center">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-800">
        `;

        if (staff.length === 0) {
            html += `<tr><td colspan="6" class="py-8 text-center text-gray-500">لا يوجد عمال مسجلين بعد.</td></tr>`;
        } else {
            staff.forEach(user => {
                const role = (typeof user.Role === 'object' && user.Role) ? user.Role.value : (user.Role || "غير محدد");
                const isActive = user.Status !== false;
                
                const roomVal = (typeof user.AssignedRoom === 'object' && user.AssignedRoom) ? user.AssignedRoom.value : (user.AssignedRoom || "");
                const stationVal = (typeof user.AssignedStation === 'object' && user.AssignedStation) ? user.AssignedStation.value : (user.AssignedStation || "");

                let assignment = '---';
                if (role === 'Waiter') assignment = roomVal || 'لم يحدد';
                if (role === 'Kitchen') assignment = stationVal || 'الكل';

                const uId = user.id;
                const uName = String(user.Name || '').replace(/'/g, "\\'");
                const uRole = String(role).replace(/'/g, "\\'");
                const uRoom = String(roomVal).replace(/'/g, "\\'");
                const uStation = String(stationVal).replace(/'/g, "\\'");
                const uPin = String(user.PIN || '').replace(/'/g, "\\'");

                html += `
                    <tr class="hover:bg-gray-800/50 transition">
                        <td class="py-4 px-4 font-bold text-white">${user.Name || "بدون اسم"}</td>
                        <td class="py-4 px-4 text-gray-400">${role}</td>
                        <td class="py-4 px-4 text-center text-brand font-medium">${assignment}</td>
                        <td class="py-4 px-4 text-center font-mono text-brand">${user.PIN || '---'}</td>
                        <td class="py-4 px-4 text-center">
                            <span class="${isActive ? 'text-green-400' : 'text-red-400'} text-xs font-bold px-2 py-1 bg-gray-800 rounded-full border border-gray-700">
                                ${isActive ? 'نشط' : 'موقوف'}
                            </span>
                        </td>
                        <td class="py-4 px-4 text-center">
                            <div class="flex justify-center gap-2">
                                <button onclick="window.toggleStaffStatus(${uId}, ${!isActive})" class="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-gray-300">
                                    ${isActive ? 'إيقاف' : 'تفعيل'}
                                </button>
                                <button onclick="window.showEditStaffModal(${uId}, '${uName}', '${uRole}', '${uRoom}', '${uStation}', '${uPin}')" class="text-xs px-2 py-1 bg-brand text-black font-bold rounded hover:bg-brand-dark">
                                    تعديل
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });
        }

        html += `</tbody></table></div></div></div>`;
        
        // نوافذ الإضافة والتعديل مع الخيارات الديناميكية
        html += `
            <div id="add-staff-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                <div class="bg-gray-800 border-t-4 border-brand rounded-xl p-6 w-full max-w-sm shadow-2xl">
                    <h3 class="text-xl font-bold text-white mb-6">إضافة عامل جديد</h3>
                    <div class="space-y-4">
                        <input type="text" id="add-name" placeholder="اسم العامل" class="w-full p-3 bg-gray-900 border border-gray-700 rounded text-white outline-none">
                        <select id="add-role" onchange="window.updateStaffFields('add')" class="w-full p-3 bg-gray-900 border border-gray-700 rounded text-white outline-none">
                            <option value="Cashier">Cashier</option><option value="Admin">Admin</option><option value="Waiter">Waiter</option><option value="Kitchen">Kitchen</option>
                        </select>
                        <div id="add-room-box" class="hidden">
                            <label class="text-xs text-gray-500">القاعة المخصصة</label>
                            <select id="add-room" class="w-full p-3 bg-gray-900 border border-gray-700 rounded text-white">${roomOptions}</select>
                        </div>
                        <div id="add-station-box" class="hidden">
                            <label class="text-xs text-gray-500">محطة المطبخ (تلقائية من المنيو)</label>
                            <select id="add-station" class="w-full p-3 bg-gray-900 border border-gray-700 rounded text-white">
                                ${stationOptions}
                            </select>
                        </div>
                        <input type="number" id="add-pin" placeholder="الرمز السري (4 أرقام)" class="w-full p-3 bg-gray-900 border border-gray-700 rounded text-white text-center font-bold tracking-widest">
                    </div>
                    <div class="flex justify-end gap-3 mt-8">
                        <button onclick="document.getElementById('add-staff-modal').classList.add('hidden')" class="text-gray-400 px-4 py-2">إلغاء</button>
                        <button onclick="window.saveStaff('add')" class="bg-brand px-6 py-2 rounded font-bold text-black">حفظ</button>
                    </div>
                </div>
            </div>

            <div id="edit-staff-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                <div class="bg-gray-800 border-t-4 border-brand rounded-xl p-6 w-full max-w-sm shadow-2xl">
                    <h3 class="text-xl font-bold text-white mb-6">تعديل بيانات العامل</h3>
                    <input type="hidden" id="edit-id">
                    <div class="space-y-4">
                        <input type="text" id="edit-name" class="w-full p-3 bg-gray-900 border border-gray-700 rounded text-white outline-none">
                        <select id="edit-role" onchange="window.updateStaffFields('edit')" class="w-full p-3 bg-gray-900 border border-gray-700 rounded text-white outline-none">
                            <option value="Cashier">Cashier</option><option value="Admin">Admin</option><option value="Waiter">Waiter</option><option value="Kitchen">Kitchen</option>
                        </select>
                        <div id="edit-room-box" class="hidden">
                            <label class="text-xs text-gray-500">القاعة المخصصة</label>
                            <select id="edit-room" class="w-full p-3 bg-gray-900 border border-gray-700 rounded text-white">${roomOptions}</select>
                        </div>
                        <div id="edit-station-box" class="hidden">
                            <label class="text-xs text-gray-500">محطة المطبخ (تلقائية من المنيو)</label>
                            <select id="edit-station" class="w-full p-3 bg-gray-900 border border-gray-700 rounded text-white">
                                ${stationOptions}
                            </select>
                        </div>
                        <input type="number" id="edit-pin" class="w-full p-3 bg-gray-900 border border-gray-700 rounded text-white text-center font-bold tracking-widest">
                    </div>
                    <div class="flex justify-end gap-3 mt-8">
                        <button onclick="document.getElementById('edit-staff-modal').classList.add('hidden')" class="text-gray-400 px-4 py-2">إلغاء</button>
                        <button onclick="window.saveStaff('edit')" class="bg-brand px-6 py-2 rounded font-bold text-black">تحديث</button>
                    </div>
                </div>
            </div>
        `;

        dynamicContent.innerHTML = html;

    } catch (e) {
        console.error("Staff Render Error:", e);
        dynamicContent.innerHTML = '<div class="text-center text-red-500 py-10 font-bold">حدث خطأ أثناء تحميل البيانات.</div>';
    }
};

// 💡 دوال التحكم في الواجهة
window.showAddStaffModal = function() {
    document.getElementById('add-name').value = '';
    document.getElementById('add-role').value = 'Cashier';
    document.getElementById('add-pin').value = '';
    window.updateStaffFields('add');
    document.getElementById('add-staff-modal').classList.remove('hidden');
};

window.showEditStaffModal = function(id, name, role, room, station, pin) {
    document.getElementById('edit-id').value = id;
    document.getElementById('edit-name').value = name;
    document.getElementById('edit-role').value = role;
    document.getElementById('edit-pin').value = pin;
    
    window.updateStaffFields('edit');
    
    if (role === 'Waiter') document.getElementById('edit-room').value = room;
    if (role === 'Kitchen') document.getElementById('edit-station').value = station || 'الكل';

    document.getElementById('edit-staff-modal').classList.remove('hidden');
};

window.updateStaffFields = function(prefix) {
    const role = document.getElementById(prefix + '-role').value;
    const roomBox = document.getElementById(prefix + '-room-box');
    const stationBox = document.getElementById(prefix + '-station-box');

    roomBox.classList.add('hidden');
    stationBox.classList.add('hidden');

    if (role === 'Waiter') roomBox.classList.remove('hidden');
    if (role === 'Kitchen') stationBox.classList.remove('hidden');
};

// 💡 دوال الحفظ والتحديث (Baserow)
window.saveStaff = async function(mode) {
    const id = mode === 'edit' ? document.getElementById('edit-id').value : null;
    const name = document.getElementById(mode + '-name').value.trim();
    const role = document.getElementById(mode + '-role').value;
    const pin = document.getElementById(mode + '-pin').value.trim();
    const room = document.getElementById(mode + '-room').value;
    const station = document.getElementById(mode + '-station').value;

    if (!name || !pin) {
        window.showToast("الاسم والرمز السري مطلوبان", "error");
        return;
    }

    try {
        const payload = { Name: name, Role: role, PIN: pin };
        if (role === 'Waiter') {
            payload.AssignedRoom = room;
            payload.AssignedStation = ''; // تفريغ
        } else if (role === 'Kitchen') {
            payload.AssignedStation = station;
            payload.AssignedRoom = ''; // تفريغ
        } else {
            payload.AssignedRoom = '';
            payload.AssignedStation = '';
        }

        const url = id 
            ? `https://baserow.vidsai.site/api/database/rows/table/${STAFF_TABLE_ID}/${id}/?user_field_names=true`
            : `https://baserow.vidsai.site/api/database/rows/table/${STAFF_TABLE_ID}/?user_field_names=true`;

        const response = await fetch(url, {
            method: id ? 'PATCH' : 'POST',
            headers: { "Authorization": `Token ${BASEROW_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify(id ? payload : { ...payload, Status: true })
        });

        if (!response.ok) throw new Error("API Fail");

        window.showToast("تمت العملية بنجاح ✅", "success");
        document.getElementById(mode + '-staff-modal').classList.add('hidden');
        window.renderStaff();

    } catch (e) {
        console.error(e);
        window.showToast("فشل في حفظ البيانات", "error");
    }
};

window.toggleStaffStatus = async function(id, status) {
    try {
        await fetch(`https://baserow.vidsai.site/api/database/rows/table/${STAFF_TABLE_ID}/${id}/?user_field_names=true`, {
            method: 'PATCH',
            headers: { "Authorization": `Token ${BASEROW_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify({ Status: status })
        });
        window.renderStaff();
    } catch (e) {
        window.showToast("فشل التحديث", "error");
    }
};