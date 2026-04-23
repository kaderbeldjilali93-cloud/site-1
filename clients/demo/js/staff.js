// =========================================================
// 👥 إدارة العمال (Staff Management)
// =========================================================


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

        let html = `
            <div class="max-w-5xl mx-auto pb-10">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h2 class="text-2xl font-bold text-white mb-1">إدارة العمال (Staff)</h2>
                        <p class="text-gray-400 text-sm">إدارة الصلاحيات، الحسابات، والرموز السرية للموظفين.</p>
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
            html += `<tr><td colspan="5" class="py-8 text-center text-gray-500">لا يوجد عمال مسجلين بعد.</td></tr>`;
        } else {
            staff.forEach(user => {
                const roleName = (typeof user.Role === 'object' && user.Role !== null) ? user.Role.value : (user.Role || "غير محدد");
                const isActive = user.Status !== false; // Default to true if undefined
                const statusBadge = isActive
                    ? '<span class="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-500/30">نشط</span>'
                    : '<span class="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold border border-red-500/30">موقوف</span>';

                html += `
                    <tr class="hover:bg-gray-800/50 transition duration-150">
                        <td class="py-4 px-4">
                            <span class="font-bold text-white text-lg">${user.Name || "بدون اسم"}</span>
                        </td>
                        <td class="py-4 px-4 text-gray-300">
                            ${roleName}
                        </td>
                        <td class="py-4 px-4 text-center text-brand font-medium">
                            ${user.AssignedRoom || user.AssignedStation || '---'}
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
                                <button onclick="window.showEditPinModal(${user.id}, '${user.Name || ''}')" class="text-sm px-3 py-1.5 bg-gray-700 text-gray-300 hover:bg-white hover:text-black rounded-lg font-medium transition shadow-sm">
                                    تعديل PIN
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
            
            <!-- نافذة تعديل الرمز السري -->
            <div id="edit-pin-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm transition-opacity p-4">
                <div class="bg-gray-800 border-t-4 border-brand rounded-xl shadow-2xl p-6 w-full max-w-sm mx-auto transform transition-all scale-100">
                    <h3 class="text-xl font-bold text-white mb-4">تعديل الرمز السري</h3>
                    <p class="text-gray-400 text-sm mb-4">تعديل الرمز للموظف: <strong id="edit-pin-staff-name" class="text-brand"></strong></p>
                    <input type="hidden" id="edit-pin-staff-id">
                    <input type="number" id="edit-pin-input" placeholder="أدخل أرقام فقط..." class="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-brand outline-none transition text-white mb-6 text-center text-xl font-bold tracking-widest">
                    <div class="flex justify-end gap-3">
                        <button onclick="document.getElementById('edit-pin-modal').classList.add('hidden')" class="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition">إلغاء</button>
                        <button onclick="window.saveNewPin()" class="px-4 py-2 rounded-lg bg-brand hover:bg-brand-dark text-black font-bold transition shadow-lg">حفظ التعديل</button>
                    </div>
                </div>
            </div>

            <!-- نافذة إضافة عامل جديد -->
            <div id="add-staff-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm transition-opacity p-4">
                <div class="bg-gray-800 border-t-4 border-brand rounded-xl shadow-2xl p-6 w-full max-w-sm mx-auto transform transition-all scale-100">
                    <h3 class="text-xl font-bold text-white mb-6">إضافة عامل جديد</h3>
                    
                    <div class="mb-4">
                        <label class="block text-gray-400 text-sm font-bold mb-2">الاسم</label>
                        <input type="text" id="add-staff-name" placeholder="اسم العامل..." class="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-brand outline-none transition text-white">
                    </div>
                    
                    <div class="mb-4">
                        <label class="block text-gray-400 text-sm font-bold mb-2">الدور الوظيفي</label>
                        <select id="add-staff-role" onchange="window.handleRoleChange(this.value)" class="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-brand outline-none transition text-white appearance-none">
                            <option value="Cashier">Cashier</option>
                            <option value="Admin">Admin</option>
                            <option value="Kitchen">Kitchen</option>
                            <option value="Waiter">Waiter</option>
                        </select>
                    </div>

                    <div id="room-assignment-div" class="mb-4 hidden">
                        <label class="block text-gray-400 text-sm font-bold mb-2">الغرفة المخصصة (Assigned Room)</label>
                        <input type="text" id="add-staff-room" placeholder="رقم أو اسم الغرفة..." class="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-brand outline-none transition text-white">
                    </div>

                    <div id="station-assignment-div" class="mb-4 hidden">
                        <label class="block text-gray-400 text-sm font-bold mb-2">القسم المخصص (Assigned Station)</label>
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
        console.error(e);
        dynamicContent.innerHTML = '<div class="text-center text-red-500 py-10 font-bold">حدث خطأ أثناء تحميل بيانات العمال.</div>';
    }
};

window.toggleStaffStatus = async function (staffId, makeActive) {
    if (!confirm(makeActive ? 'هل أنت متأكد من تفعيل هذا الحساب؟' : 'هل أنت متأكد من إيقاف منع هذا الحساب من الدخول؟')) return;

    try {
        const response = await fetch(`https://baserow.vidsai.site/api/database/rows/table/${STAFF_TABLE_ID}/${staffId}/?user_field_names=true`, {
            method: 'PATCH',
            headers: {
                "Authorization": `Token ${BASEROW_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ Status: makeActive })
        });

        if (!response.ok) throw new Error("Failed to update status");

        window.showToast("تم تحديث الحالة بنجاح", "success");
        window.renderStaff(); // إعادة تحميل القائمة

    } catch (e) {
        console.error(e);
        window.showToast("فشل في تحديث الحالة", "error");
    }
};

window.showEditPinModal = function (staffId, staffName) {
    document.getElementById('edit-pin-staff-id').value = staffId;
    document.getElementById('edit-pin-staff-name').innerText = staffName;
    document.getElementById('edit-pin-input').value = '';
    document.getElementById('edit-pin-modal').classList.remove('hidden');
    setTimeout(() => document.getElementById('edit-pin-input').focus(), 100);
};

window.saveNewPin = async function () {
    const staffId = document.getElementById('edit-pin-staff-id').value;
    const newPin = document.getElementById('edit-pin-input').value.trim();

    if (!newPin) {
        window.showToast("الرجاء إدخال رمز سري صحيح", "error");
        return;
    }

    try {
        const response = await fetch(`https://baserow.vidsai.site/api/database/rows/table/${STAFF_TABLE_ID}/${staffId}/?user_field_names=true`, {
            method: 'PATCH',
            headers: {
                "Authorization": `Token ${BASEROW_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ PIN: newPin })
        });

        if (!response.ok) throw new Error("Failed to update PIN");

        window.showToast("تم تحديث الرمز السري بنجاح", "success");
        document.getElementById('edit-pin-modal').classList.add('hidden');
        window.renderStaff(); // إعادة التحديث

    } catch (e) {
        console.error(e);
        window.showToast("فشل في تحديث الرمز السري", "error");
    }
};

window.showAddStaffModal = function () {
    document.getElementById('add-staff-name').value = '';
    document.getElementById('add-staff-pin').value = '';
    document.getElementById('add-staff-role').value = 'Cashier';
    document.getElementById('add-staff-room').value = '';
    document.getElementById('add-staff-station').value = 'الكل';
    window.handleRoleChange('Cashier');
    document.getElementById('add-staff-modal').classList.remove('hidden');
    setTimeout(() => document.getElementById('add-staff-name').focus(), 100);
};

window.handleRoleChange = function (role) {
    const roomDiv = document.getElementById('room-assignment-div');
    const stationDiv = document.getElementById('station-assignment-div');

    roomDiv.classList.add('hidden');
    stationDiv.classList.add('hidden');

    if (role === 'Waiter') {
        roomDiv.classList.remove('hidden');
    } else if (role === 'Kitchen') {
        stationDiv.classList.remove('hidden');
    }
};

window.saveNewStaff = async function () {
    const name = document.getElementById('add-staff-name').value.trim();
    const role = document.getElementById('add-staff-role').value;
    const pin = document.getElementById('add-staff-pin').value.trim();
    const assignedRoom = document.getElementById('add-staff-room').value.trim();
    const assignedStation = document.getElementById('add-staff-station').value;

    if (!name || !pin) {
        window.showToast("الرجاء إدخال الاسم والرمز السري", "error");
        return;
    }

    const btn = document.getElementById('btn-save-staff');
    const origText = btn.innerHTML;
    btn.innerHTML = 'جاري الحفظ...';
    btn.disabled = true;

    try {
        const payload = { Name: name, Role: role, PIN: pin, Status: true };
        if (role === 'Waiter') payload.AssignedRoom = assignedRoom;
        if (role === 'Kitchen') payload.AssignedStation = assignedStation;

        const response = await fetch(`https://baserow.vidsai.site/api/database/rows/table/${STAFF_TABLE_ID}/?user_field_names=true`, {
            method: 'POST',
            headers: {
                "Authorization": `Token ${BASEROW_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("Failed to add staff");

        window.showToast("تم إضافة العامل بنجاح", "success");
        document.getElementById('add-staff-modal').classList.add('hidden');
        window.renderStaff();

    } catch (e) {
        console.error(e);
        window.showToast("فشل في إضافة العامل", "error");
    } finally {
        btn.innerHTML = origText;
        btn.disabled = false;
    }
};
