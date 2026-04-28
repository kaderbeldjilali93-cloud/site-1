window.renderStaff = async function () {
    const dynamicContent = document.getElementById('dynamic-content');
    dynamicContent.innerHTML = '<div class="text-center text-gray-400 py-10">جاري تحميل بيانات العمال...</div>';

    try {
        const response = await fetch(`https://baserow.vidsai.site/api/database/rows/table/${STAFF_TABLE_ID}/?user_field_names=true`, {
            method: 'GET',
            headers: { "Authorization": `Token ${typeof BASEROW_TOKEN !== 'undefined' ? BASEROW_TOKEN : ''}` }
        });

        if (!response.ok) throw new Error("Failed to load staff");
        const data = await response.json();
        const staff = data.results;

        // 💡 استخراج أسماء القاعات الحقيقية من الطاولات
        let uniqueRooms = new Set();
        if (typeof STATE !== 'undefined' && STATE.tableMapData) {
            Object.values(STATE.tableMapData).forEach(table => {
                if (table.room) uniqueRooms.add(table.room);
                if (table.Room) uniqueRooms.add(table.Room);
            });
        }
        
        let roomOptions = '';
        if (uniqueRooms.size > 0) {
            uniqueRooms.forEach(room => {
                roomOptions += `<option value="${room}">`;
            });
        } else {
            roomOptions += `<option value="القاعة 1"><option value="التراس">`;
        }

        let html = `
            <datalist id="room-datalist">
                ${roomOptions}
            </datalist>

            <div class="max-w-5xl mx-auto pb-10">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h2 class="text-2xl font-bold text-white mb-1">إدارة العمال (Staff)</h2>
                        <p class="text-gray-400 text-sm">إدارة الصلاحيات، التخصيص، والرموز السرية.</p>
                    </div>
                    <button onclick="window.showAddStaffModal()" class="bg-brand hover:bg-brand-dark text-black font-bold py-2.5 px-5 rounded-xl transition shadow-[0_0_15px_rgba(255,153,0,0.3)] flex items-center gap-2 whitespace-nowrap">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                        إضافة عامل جديد
                    </button>
                </div>

                <div class="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden shadow-lg">
                    <div class="overflow-x-auto w-full">
                        <table class="w-full text-right min-w-[700px]">
                            <thead class="bg-gray-800 text-gray-400 text-sm">
                                <tr>
                                    <th class="py-4 px-4 font-semibold w-1/4">الاسم</th>
                                    <th class="py-4 px-4 font-semibold w-1/4">الدور الوظيفي</th>
                                    <th class="py-4 px-4 font-semibold text-center w-1/6">التخصيص</th>
                                    <th class="py-4 px-4 font-semibold text-center w-1/6">الرمز السري</th>
                                    <th class="py-4 px-4 font-semibold text-center w-1/6">الحالة</th>
                                    <th class="py-4 px-4 font-semibold text-center w-1/6">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-800">
        `;

        if (staff.length === 0) {
            html += `<tr><td colspan="6" class="py-8 text-center text-gray-500">لا يوجد عمال مسجلين بعد.</td></tr>`;
        } else {
            staff.forEach(user => {
                const roleName = (typeof user.Role === 'object' && user.Role !== null) ? user.Role.value : (user.Role || "غير محدد");
                const isActive = user.Status !== false; 
                const statusBadge = isActive
                    ? '<span class="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-500/30">نشط</span>'
                    : '<span class="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold border border-red-500/30">موقوف</span>';

                // 💡 الحل الجذري: فحص نوع البيانات قبل قرائتها (خاصة لـ Baserow Single Select)
                const roomVal = (typeof user.AssignedRoom === 'object' && user.AssignedRoom !== null) ? user.AssignedRoom.value : (user.AssignedRoom || "");
                const stationVal = (typeof user.AssignedStation === 'object' && user.AssignedStation !== null) ? user.AssignedStation.value : (user.AssignedStation || "");

                let assignment = '---';
                if (roleName === 'Waiter' && roomVal) assignment = roomVal;
                if (roleName === 'Kitchen' && stationVal) assignment = stationVal;

                // تحويل كل شيء إلى String لضمان عدم توقف المتصفح
                const safeName = String(user.Name || '').replace(/'/g, "\\'");
                const safeRoom = String(roomVal).replace(/'/g, "\\'");
                const safeStation = String(stationVal).replace(/'/g, "\\'");
                const safePin = String(user.PIN || '').replace(/'/g, "\\'");

                html += `
                    <tr class="hover:bg-gray-800/50 transition duration-150">
                        <td class="py-4 px-4">
                            <span class="font-bold text-white text-lg">${user.Name || "بدون اسم"}</span>
                        </td>
                        <td class="py-4 px-4 text-gray-300">
                            ${roleName}
                        </td>
                        <td class="py-4 px-4 text-center text-brand font-medium">
                            ${assignment}
                        </td>
                        <td class="py-4 px-4 text-center">
                            <div class="flex items-center justify-center gap-2">
                                <span class="font-mono bg-gray-800 px-3 py-1 rounded text-brand font-bold tracking-widest border border-gray-700">${user.PIN || '---'}</span>
                            </div>
                        </td>
                        <td class="py-4 px-4 text-center">
                            ${statusBadge}
                        </td>
                        <td class="py-4 px-4">
                            <div class="flex items-center justify-center gap-2">
                                <button onclick="window.toggleStaffStatus(${user.id}, ${!isActive})" class="text-sm px-3 py-1.5 rounded-lg font-medium transition ${isActive ? 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white' : 'bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white'}" title="${isActive ? 'إيقاف الحساب' : 'تفعيل الحساب'}">
                                    ${isActive ? 'إيقاف' : 'تفعيل'}
                                </button>
                                <button onclick="window.showEditStaffModal(${user.id}, '${safeName}', '${roleName}', '${safeRoom}', '${safeStation}', '${safePin}')" class="text-sm px-3 py-1.5 bg-gray-700 text-gray-300 hover:bg-white hover:text-black rounded-lg font-medium transition shadow-sm">
                                    تعديل
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });
        }

        html += `
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div id="edit-staff-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm transition-opacity p-4">
                <div class="bg-gray-800 border-t-4 border-brand rounded-xl shadow-2xl p-6 w-full max-w-sm mx-auto transform transition-all scale-100">
                    <h3 class="text-xl font-bold text-white mb-6">تعديل بيانات العامل</h3>
                    
                    <input type="hidden" id="edit-staff-id">
                    
                    <div class="mb-4">
                        <label class="block text-gray-400 text-sm font-bold mb-2">الاسم</label>
                        <input type="text" id="edit-staff-name" class="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-brand outline-none transition text-white">
                    </div>
                    
                    <div class="mb-4">
                        <label class="block text-gray-400 text-sm font-bold mb-2">الدور الوظيفي</label>
                        <select id="edit-staff-role" onchange="window.handleRoleChange('edit')" class="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-brand outline-none transition text-white appearance-none">
                            <option value="Cashier">Cashier</option>
                            <option value="Admin">Admin</option>
                            <option value="Kitchen">Kitchen</option>
                            <option value="Waiter">Waiter</option>
                        </select>
                    </div>

                    <div id="edit-room-div" class="mb-4 hidden">
                        <label class="block text-gray-400 text-sm font-bold mb-2">القاعة المخصصة</label>
                        <input type="text" id="edit-staff-room" list="room-datalist" placeholder="اختر من القائمة أو اكتب..." class="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-brand outline-none transition text-white">
                    </div>

                    <div id="edit-station-div" class="mb-4 hidden">
                        <label class="block text-gray-400 text-sm font-bold mb-2">محطة المطبخ</label>
                        <select id="edit-staff-station" class="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-brand outline-none transition text-white appearance-none">
                            <option value="الكل">الكل</option>
                            <option value="بيتزا">بيتزا</option>
                            <option value="مشويات">مشويات</option>
                            <option value="مشروبات">مشروبات</option>
                            <option value="تحضير سريع">تحضير سريع</option>
                        </select>
                    </div>

                    <div class="mb-6">
                        <label class="block text-gray-400 text-sm font-bold mb-2">الرمز السري (PIN)</label>
                        <input type="number" id="edit-staff-pin" placeholder="أرقام فقط..." class="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-brand outline-none transition text-white tracking-widest font-mono">
                    </div>

                    <div class="flex justify-end gap-3 mt-8">
                        <button onclick="document.getElementById('edit-staff-modal').classList.add('hidden')" class="px-4 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition">إلغاء</button>
                        <button onclick="window.saveEditStaff()" id="btn-update-staff" class="px-6 py-2.5 rounded-lg bg-brand hover:bg-brand-dark text-black font-bold transition shadow-lg">حفظ التعديلات</button>
                    </div>
                </div>
            </div>

            <div id="add-staff-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm transition-opacity p-4">
                <div class="bg-gray-800 border-t-4 border-brand rounded-xl shadow-2xl p-6 w-full max-w-sm mx-auto transform transition-all scale-100">
                    <h3 class="text-xl font-bold text-white mb-6">إضافة عامل جديد</h3>
                    
                    <div class="mb-4">
                        <label class="block text-gray-400 text-sm font-bold mb-2">الاسم</label>
                        <input type="text" id="add-staff-name" placeholder="اسم العامل..." class="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-brand outline-none transition text-white">
                    </div>
                    
                    <div class="mb-4">
                        <label class="block text-gray-400 text-sm font-bold mb-2">الدور الوظيفي</label>
                        <select id="add-staff-role" onchange="window.handleRoleChange('add')" class="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-brand outline-none transition text-white appearance-none">
                            <option value="Cashier">Cashier</option>
                            <option value="Admin">Admin</option>
                            <option value="Kitchen">Kitchen</option>
                            <option value="Waiter">Waiter</option>
                        </select>
                    </div>

                    <div id="add-room-div" class="mb-4 hidden">
                        <label class="block text-gray-400 text-sm font-bold mb-2">القاعة المخصصة</label>
                        <input type="text" id="add-staff-room" list="room-datalist" placeholder="اختر من القائمة أو اكتب..." class="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-brand outline-none transition text-white">
                    </div>

                    <div id="add-station-div" class="mb-4 hidden">
                        <label class="block text-gray-400 text-sm font-bold mb-2">محطة المطبخ</label>
                        <select id="add-staff-station" class="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-brand outline-none transition text-white appearance-none">
                            <option value="الكل">الكل</option>
                            <option value="بيتزا">بيتزا</option>
                            <option value="مشويات">مشويات</option>
                            <option value="مشروبات">مشروبات</option>
                            <option value="تحضير سريع">تحضير سريع</option>
                        </select>
                    </div>

                    <div class="mb-6">
                        <label class="block text-gray-400 text-sm font-bold mb-2">الرمز السري (PIN)</label>
                        <input type="number" id="add-staff-pin" placeholder="أرقام فقط..." class="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-brand outline-none transition text-white tracking-widest font-mono">
                    </div>

                    <div class="flex justify-end gap-3 mt-8">
                        <button onclick="document.getElementById('add-staff-modal').classList.add('hidden')" class="px-4 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition">إلغاء</button>
                        <button onclick="window.saveNewStaff()" id="btn-save-staff" class="px-6 py-2.5 rounded-lg bg-brand hover:bg-brand-dark text-black font-bold transition shadow-lg">حفظ وإضافة</button>
                    </div>
                </div>
            </div>
        `;

        dynamicContent.innerHTML = html;

    } catch (e) {
        console.error("Staff Render Error:", e);
        dynamicContent.innerHTML = `<div class="text-center text-red-500 py-10 font-bold">حدث خطأ أثناء تحميل بيانات العمال. تأكد من إعدادات Baserow.</div>`;
    }
};