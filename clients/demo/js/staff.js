// =========================================================
// 👥 إدارة العمال (Staff Management) - النسخة المحدثة (Direct Sync)
// =========================================================

window.renderStaff = async function () {
    const dynamicContent = document.getElementById('dynamic-content');
    dynamicContent.innerHTML = '<div class="text-center text-gray-400 py-10">جاري تحميل بيانات العمال والمحطات...</div>';

    try {
        // 1. جلب بيانات العمال مباشرة من Baserow لضمان أحدث نسخة
        const staffResponse = await fetch(`https://baserow.vidsai.site/api/database/rows/table/${STAFF_TABLE_ID}/?user_field_names=true`, {
            method: 'GET',
            headers: { "Authorization": `Token ${typeof BASEROW_TOKEN !== 'undefined' ? BASEROW_TOKEN : ''}` }
        });

        if (!staffResponse.ok) throw new Error("Failed to load staff");
        const staffData = await staffResponse.json();
        const staff = staffData.results;

        // 2. 💡 تحديث قائمة المحطات: نجلب المنيو "طازج" من Baserow الآن
        let uniqueStations = new Set();
        let menuItems = [];
        
        if (typeof window.fetchMenu === 'function') {
            // فرض جلب المنيو من السيرفر مباشرة لتحديث أي تغيير يدوياً في Baserow
            menuItems = await window.fetchMenu();
            STATE.cachedMenuItems = menuItems; // تحديث الذاكرة العامة للنظام أيضاً
        }

        if (menuItems && menuItems.length > 0) {
            menuItems.forEach(item => {
                const st = (typeof item.Station === 'object' && item.Station !== null) ? item.Station.value : (item.Station || "");
                if (st && String(st).trim() !== "") {
                    uniqueStations.add(String(st).trim());
                }
            });
        }

        let stationOptions = '<option value="الكل">الكل</option>';
        uniqueStations.forEach(st => {
            stationOptions += `<option value="${st}">${st}</option>`;
        });

        // 3. جلب أسماء القاعات من خريطة الطاولات
        let uniqueRooms = new Set();
        if (STATE.tableMapData) {
            Object.values(STATE.tableMapData).forEach(table => {
                const r = table.room || table.Room;
                if (r) uniqueRooms.add(r);
            });
        }
        
        let roomOptions = '<option value="">-- اختر القاعة --</option>';
        uniqueRooms.forEach(room => {
            roomOptions += `<option value="${room}">${room}</option>`;
        });

        // 4. بناء الواجهة مع الحقول الجديدة
        let html = `
            <div class="max-w-5xl mx-auto pb-10">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h2 class="text-2xl font-bold text-white mb-1">إدارة العمال (Staff)</h2>
                        <p class="text-gray-400 text-sm">تحديث تلقائي للمحطات من المنيو في Baserow.</p>
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

        html += `</tbody></table></div></div></div>`;
        
        // نوافذ الإضافة والتعديل
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
                            <select id="add-station" class="w-full p-3 bg-gray-900 border border-gray-700 rounded text-white">${stationOptions}</select>
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
                            <select id="edit-station" class="w-full p-3 bg-gray-900 border border-gray-700 rounded text-white">${stationOptions}</select>
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
        dynamicContent.innerHTML = '<div class="text-center text-red-500 py-10 font-bold">حدث خطأ أثناء تحميل البيانات من Baserow.</div>';
    }
};

// ... باقي الدوال (showAddStaffModal, updateStaffFields, saveStaff, toggleStaffStatus) تبقى كما هي في ملفك الأصلي