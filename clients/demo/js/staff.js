// =========================================================
// 👥 إدارة العمال (Staff Management) - v5.0 Final
// =========================================================

window.renderStaff = async function () {
    const dynamicContent = document.getElementById('dynamic-content');
    dynamicContent.innerHTML = '<div class="flex flex-col items-center justify-center py-16 gap-3"><div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand"></div><p class="text-gray-400 text-sm">جاري تحميل بيانات العمال...</p></div>';

    try {
        // 1. جلب العمال + المنيو + القاعات بشكل متوازي للسرعة
        const _t = Date.now(); // cache-busting
        const [staffResponse, menuItems, tableMapRes] = await Promise.all([
            fetch(`https://baserow.vidsai.site/api/database/rows/table/${STAFF_TABLE_ID}/?user_field_names=true&_t=${_t}`, {
                headers: { "Authorization": `Token ${BASEROW_TOKEN}` },
                cache: 'no-store'
            }),
            (typeof window.fetchMenu === 'function') ? window.fetchMenu() : Promise.resolve([]),
            fetch(`https://baserow.vidsai.site/api/database/rows/table/${TABLEMAP_TABLE_ID}/?user_field_names=true&size=200&_t=${_t}`, {
                headers: { "Authorization": `Token ${BASEROW_TOKEN}` },
                cache: 'no-store'
            })
        ]);

        if (!staffResponse.ok) throw new Error("فشل تحميل العمال");
        const staff = (await staffResponse.json()).results;

        // تحديث الكاش
        if (menuItems && menuItems.length > 0) STATE.cachedMenuItems = menuItems;

        // تحديث خريطة الطاولات
        if (tableMapRes.ok) {
            const mapData = await tableMapRes.json();
            STATE.tableMapData = mapData.results || [];
        }

        // 2. استخراج المحطات من المنيو
        var uniqueStations = [];
        (menuItems || []).forEach(function (item) {
            var st = (typeof item.Station === 'object' && item.Station !== null) ? item.Station.value : (item.Station || "");
            st = String(st).trim();
            if (st && !uniqueStations.includes(st)) uniqueStations.push(st);
        });

        var stationOptions = '<option value="الكل">الكل (جميع المحطات)</option>';
        uniqueStations.forEach(function (st) {
            stationOptions += '<option value="' + st + '">' + st + '</option>';
        });

        // 3. استخراج القاعات
        var uniqueRooms = [];
        (STATE.tableMapData || []).forEach(function (table) {
            var r = table.Room || table.room || "";
            if (r && !uniqueRooms.includes(r)) uniqueRooms.push(r);
        });

        var roomOptions = '<option value="">-- كل القاعات --</option>';
        uniqueRooms.forEach(function (room) {
            roomOptions += '<option value="' + room + '">' + room + '</option>';
        });

        // 4. بناء الجدول
        var html = '<div class="max-w-5xl mx-auto pb-10">';
        html += '<div class="flex flex-wrap justify-between items-center mb-6 gap-3">';
        html += '<div><h2 class="text-2xl font-bold text-white mb-1">👥 إدارة العمال</h2>';
        html += '<p class="text-gray-400 text-sm">إضافة، تعديل، وحذف بيانات الموظفين وتخصيصاتهم.</p></div>';
        html += '<button onclick="window.showAddStaffModal()" class="bg-brand hover:bg-brand-dark text-black font-bold py-2.5 px-5 rounded-xl transition shadow-lg flex items-center gap-2">';
        html += '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>';
        html += 'إضافة عامل جديد</button></div>';

        // === فلتر الأدوار ===
        var currentFilter = STATE.staffRoleFilter || 'all';
        var filterBtnClass = function(val) {
            return val === currentFilter 
                ? 'bg-brand text-black font-bold' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white';
        };
        html += '<div class="flex flex-wrap items-center gap-2 mb-4">';
        html += '<span class="text-gray-400 text-sm font-bold ml-2">فلترة حسب الدور:</span>';
        html += '<button onclick="STATE.staffRoleFilter=\'all\';window.renderStaff()" class="text-xs px-3 py-1.5 rounded-lg transition ' + filterBtnClass('all') + '">الكل</button>';
        html += '<button onclick="STATE.staffRoleFilter=\'Admin\';window.renderStaff()" class="text-xs px-3 py-1.5 rounded-lg transition ' + filterBtnClass('Admin') + '">Admin</button>';
        html += '<button onclick="STATE.staffRoleFilter=\'Cashier\';window.renderStaff()" class="text-xs px-3 py-1.5 rounded-lg transition ' + filterBtnClass('Cashier') + '">Cashier</button>';
        html += '<button onclick="STATE.staffRoleFilter=\'Waiter\';window.renderStaff()" class="text-xs px-3 py-1.5 rounded-lg transition ' + filterBtnClass('Waiter') + '">Waiter</button>';
        html += '<button onclick="STATE.staffRoleFilter=\'Kitchen\';window.renderStaff()" class="text-xs px-3 py-1.5 rounded-lg transition ' + filterBtnClass('Kitchen') + '">Kitchen</button>';
        html += '</div>';

        // تطبيق الفلتر
        var filteredStaff = staff;
        if (currentFilter !== 'all') {
            filteredStaff = staff.filter(function(u) {
                var r = (typeof u.Role === 'object' && u.Role) ? u.Role.value : (u.Role || '');
                return r === currentFilter;
            });
        }

        html += '<div class="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden shadow-lg"><div class="overflow-x-auto w-full">';
        html += '<table class="w-full text-right min-w-[750px]"><thead class="bg-gray-800 text-gray-400 text-sm font-bold"><tr>';
        html += '<th class="py-4 px-4">الاسم</th><th class="py-4 px-4">الدور</th>';
        html += '<th class="py-4 px-4 text-center">التخصيص</th><th class="py-4 px-4 text-center">PIN</th>';
        html += '<th class="py-4 px-4 text-center">الحالة</th><th class="py-4 px-4 text-center">إجراءات</th>';
        html += '</tr></thead><tbody class="divide-y divide-gray-800">';

        if (filteredStaff.length === 0) {
            html += '<tr><td colspan="6" class="py-10 text-center text-gray-500">' + (currentFilter !== 'all' ? 'لا يوجد عمال بدور "' + currentFilter + '"' : 'لا يوجد عمال مسجلين حالياً. اضغط "إضافة عامل جديد" للبدء.') + '</td></tr>';
        }

        filteredStaff.forEach(function (user) {
            var role = (typeof user.Role === 'object' && user.Role) ? user.Role.value : (user.Role || "غير محدد");
            var isActive = user.Status !== false;
            var roomVal = (typeof user.AssignedRoom === 'object' && user.AssignedRoom) ? user.AssignedRoom.value : (user.AssignedRoom || "");
            var stationVal = (typeof user.AssignedStation === 'object' && user.AssignedStation) ? user.AssignedStation.value : (user.AssignedStation || "");
            var kitchenRoomVal = (typeof user.KitchenRoom === 'object' && user.KitchenRoom) ? user.KitchenRoom.value : (user.KitchenRoom || "");

            var assignment = '<span class="text-gray-600">---</span>';
            if (role === 'Waiter') assignment = roomVal ? '<span class="text-brand font-bold">' + roomVal + '</span>' : '<span class="text-yellow-500">لم يحدد</span>';
            if (role === 'Kitchen') {
                var hasKRoom = kitchenRoomVal && kitchenRoomVal.trim();
                var hasStation = stationVal && stationVal !== 'الكل' && stationVal.trim();
                
                if (hasKRoom && hasStation) {
                    // تخصيص مزدوج: قاعة + محطة
                    assignment = '<span class="text-purple-400 font-bold text-xs">🏠 ' + kitchenRoomVal + ' • 🍳 ' + stationVal + '</span>';
                } else if (hasKRoom) {
                    assignment = '<span class="text-blue-400 font-bold">🏠 ' + kitchenRoomVal + '</span>';
                } else if (hasStation) {
                    assignment = '<span class="text-brand font-bold">🍳 ' + stationVal + '</span>';
                } else {
                    assignment = '<span class="text-gray-400">الكل</span>';
                }
            }

            var uId = user.id;
            var uName = String(user.Name || '').replace(/'/g, "\\'");
            var uRole = String(role).replace(/'/g, "\\'");
            var uRoom = String(roomVal).replace(/'/g, "\\'");
            var uStation = String(stationVal).replace(/'/g, "\\'");
            var uPin = String(user.PIN || '').replace(/'/g, "\\'");
            var uKitchenRoom = String(kitchenRoomVal).replace(/'/g, "\\'");

            html += '<tr class="hover:bg-gray-800/50 transition">';
            html += '<td class="py-4 px-4 font-bold text-white">' + (user.Name || "بدون اسم") + '</td>';
            html += '<td class="py-4 px-4"><span class="text-xs font-bold px-2 py-1 rounded-full ' +
                (role === 'Admin' ? 'bg-purple-500/20 text-purple-400' :
                role === 'Cashier' ? 'bg-green-500/20 text-green-400' :
                role === 'Waiter' ? 'bg-blue-500/20 text-blue-400' :
                role === 'Kitchen' ? 'bg-orange-500/20 text-orange-400' : 'bg-gray-700 text-gray-400') + '">' + role + '</span></td>';
            html += '<td class="py-4 px-4 text-center text-sm font-medium">' + assignment + '</td>';
            html += '<td class="py-4 px-4 text-center font-mono text-brand">' + (user.PIN || '<span class="text-gray-600">---</span>') + '</td>';
            html += '<td class="py-4 px-4 text-center"><span class="' + (isActive ? 'text-green-400' : 'text-red-400') + ' text-xs font-bold px-2.5 py-1 bg-gray-800 rounded-full border border-gray-700">' + (isActive ? 'نشط' : 'موقوف') + '</span></td>';

            // أزرار الإجراءات: تفعيل/إيقاف + تعديل + حذف
            html += '<td class="py-4 px-4 text-center"><div class="flex justify-center gap-2">';
            html += '<button onclick="window.toggleStaffStatus(' + uId + ', ' + !isActive + ')" class="text-xs px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 font-bold transition">' + (isActive ? 'إيقاف' : 'تفعيل') + '</button>';
            html += '<button onclick="window.showEditStaffModal(' + uId + ', \'' + uName + '\', \'' + uRole + '\', \'' + uRoom + '\', \'' + uStation + '\', \'' + uPin + '\', \'' + uKitchenRoom + '\')" class="text-xs px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-brand font-bold transition">تعديل</button>';
            html += '<button onclick="window.deleteStaff(' + uId + ', \'' + uName + '\')" class="text-xs px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-red-400 font-bold transition">حذف</button>';
            html += '</div></td></tr>';
        });

        html += '</tbody></table></div></div></div>';

        // === نافذة الإضافة ===
        html += '<div id="add-staff-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">';
        html += '<div class="bg-gray-800 border-t-4 border-brand rounded-xl p-6 w-full max-w-sm shadow-2xl">';
        html += '<h3 class="text-xl font-bold text-white mb-6">إضافة عامل جديد</h3><div class="space-y-4">';
        html += '<div><label class="block text-xs text-gray-400 mb-1.5 font-bold">اسم العامل</label>';
        html += '<input type="text" id="add-name" placeholder="مثال: أحمد بن علي" class="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white outline-none focus:border-brand transition"></div>';
        html += '<div><label class="block text-xs text-gray-400 mb-1.5 font-bold">الدور الوظيفي</label>';
        html += '<select id="add-role" onchange="window.updateStaffFields(\'add\')" class="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white outline-none focus:border-brand transition">';
        html += '<option value="Cashier">Cashier (كاشير)</option><option value="Admin">Admin (مدير)</option><option value="Waiter">Waiter (نادل)</option><option value="Kitchen">Kitchen (طباخ)</option></select></div>';
        html += '<div id="add-room-box" class="hidden"><label class="block text-xs text-gray-400 mb-1.5 font-bold">القاعة المخصصة</label>';
        html += '<select id="add-room" class="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white">' + roomOptions + '</select></div>';
        html += '<div id="add-station-box" class="hidden"><label class="block text-xs text-gray-400 mb-1.5 font-bold">نوع التخصيص</label>';
        html += '<select id="add-kitchen-mode" onchange="window.updateKitchenMode(\'add\')" class="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white mb-3">';
        html += '<option value="station">حسب المحطة (الأطباق)</option><option value="room">حسب القاعة</option><option value="both">قاعة + محطة (مزدوج)</option></select>';
        html += '<div id="add-station-select-box"><label class="block text-xs text-gray-400 mb-1.5 font-bold">محطة المطبخ</label>';
        html += '<select id="add-station" class="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white">' + stationOptions + '</select></div>';
        html += '<div id="add-kitchen-room-box" class="hidden"><label class="block text-xs text-gray-400 mb-1.5 font-bold">قاعة المطبخ</label>';
        html += '<select id="add-kitchen-room" class="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white">' + roomOptions + '</select></div></div>';
        html += '<div><label class="block text-xs text-gray-400 mb-1.5 font-bold">الرمز السري (PIN)</label>';
        html += '<input type="number" id="add-pin" placeholder="مثال: 1234" class="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white text-center font-bold tracking-widest outline-none focus:border-brand transition"></div>';
        html += '</div><div class="flex justify-end gap-3 mt-8">';
        html += '<button onclick="document.getElementById(\'add-staff-modal\').classList.add(\'hidden\')" class="text-gray-400 px-4 py-2 hover:text-white transition">إلغاء</button>';
        html += '<button onclick="window.saveStaff(\'add\')" class="bg-brand px-6 py-2.5 rounded-lg font-bold text-black hover:bg-brand-dark transition">حفظ</button>';
        html += '</div></div></div>';

        // === نافذة التعديل ===
        html += '<div id="edit-staff-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">';
        html += '<div class="bg-gray-800 border-t-4 border-blue-500 rounded-xl p-6 w-full max-w-sm shadow-2xl">';
        html += '<h3 class="text-xl font-bold text-white mb-6">تعديل بيانات العامل</h3><input type="hidden" id="edit-id"><div class="space-y-4">';
        html += '<div><label class="block text-xs text-gray-400 mb-1.5 font-bold">اسم العامل</label>';
        html += '<input type="text" id="edit-name" class="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white outline-none focus:border-brand transition"></div>';
        html += '<div><label class="block text-xs text-gray-400 mb-1.5 font-bold">الدور الوظيفي</label>';
        html += '<select id="edit-role" onchange="window.updateStaffFields(\'edit\')" class="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white outline-none focus:border-brand transition">';
        html += '<option value="Cashier">Cashier (كاشير)</option><option value="Admin">Admin (مدير)</option><option value="Waiter">Waiter (نادل)</option><option value="Kitchen">Kitchen (طباخ)</option></select></div>';
        html += '<div id="edit-room-box" class="hidden"><label class="block text-xs text-gray-400 mb-1.5 font-bold">القاعة المخصصة</label>';
        html += '<select id="edit-room" class="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white">' + roomOptions + '</select></div>';
        html += '<div id="edit-station-box" class="hidden"><label class="block text-xs text-gray-400 mb-1.5 font-bold">نوع التخصيص</label>';
        html += '<select id="edit-kitchen-mode" onchange="window.updateKitchenMode(\'edit\')" class="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white mb-3">';
        html += '<option value="station">حسب المحطة (الأطباق)</option><option value="room">حسب القاعة</option><option value="both">قاعة + محطة (مزدوج)</option></select>';;
        html += '<div id="edit-station-select-box"><label class="block text-xs text-gray-400 mb-1.5 font-bold">محطة المطبخ</label>';
        html += '<select id="edit-station" class="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white">' + stationOptions + '</select></div>';
        html += '<div id="edit-kitchen-room-box" class="hidden"><label class="block text-xs text-gray-400 mb-1.5 font-bold">قاعة المطبخ</label>';
        html += '<select id="edit-kitchen-room" class="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white">' + roomOptions + '</select></div></div>';
        html += '<div><label class="block text-xs text-gray-400 mb-1.5 font-bold">الرمز السري (PIN)</label>';
        html += '<input type="number" id="edit-pin" class="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white text-center font-bold tracking-widest outline-none focus:border-brand transition"></div>';
        html += '</div><div class="flex justify-end gap-3 mt-8">';
        html += '<button onclick="document.getElementById(\'edit-staff-modal\').classList.add(\'hidden\')" class="text-gray-400 px-4 py-2 hover:text-white transition">إلغاء</button>';
        html += '<button onclick="window.saveStaff(\'edit\')" class="bg-brand px-6 py-2.5 rounded-lg font-bold text-black hover:bg-brand-dark transition">تحديث</button>';
        html += '</div></div></div>';

        dynamicContent.innerHTML = html;

    } catch (e) {
        console.error("Staff Render Error:", e);
        dynamicContent.innerHTML = '<div class="text-center py-16"><p class="text-red-400 font-bold text-lg mb-3">❌ خطأ في تحميل بيانات العمال</p><p class="text-gray-500 text-sm mb-4">' + e.message + '</p><button onclick="window.renderStaff()" class="bg-brand text-black font-bold px-5 py-2.5 rounded-lg">🔄 إعادة المحاولة</button></div>';
    }
};

// === فتح نوافذ الإضافة والتعديل ===

window.showAddStaffModal = function () {
    var nameEl = document.getElementById('add-name');
    var roleEl = document.getElementById('add-role');
    var pinEl = document.getElementById('add-pin');
    var roomEl = document.getElementById('add-room');
    var stationEl = document.getElementById('add-station');
    if (nameEl) nameEl.value = '';
    if (roleEl) roleEl.value = 'Cashier';
    if (pinEl) pinEl.value = '';
    if (roomEl) roomEl.value = '';
    if (stationEl) stationEl.value = 'الكل';
    window.updateStaffFields('add');
    document.getElementById('add-staff-modal').classList.remove('hidden');
};

window.showEditStaffModal = function (id, name, role, room, station, pin, kitchenRoom) {
    document.getElementById('edit-id').value = id;
    document.getElementById('edit-name').value = name;

    var roleSelect = document.getElementById('edit-role');
    if (roleSelect) {
        var hasOption = Array.from(roleSelect.options).some(function (opt) { return opt.value === role; });
        roleSelect.value = hasOption ? role : 'Cashier';
    }

    var roomEl = document.getElementById('edit-room');
    var stationEl = document.getElementById('edit-station');
    var pinEl = document.getElementById('edit-pin');
    var kitchenModeEl = document.getElementById('edit-kitchen-mode');
    var kitchenRoomEl = document.getElementById('edit-kitchen-room');
    if (roomEl) roomEl.value = room || '';
    if (stationEl) stationEl.value = station || 'الكل';
    if (pinEl) pinEl.value = (pin && pin !== '---' && pin !== 'undefined') ? pin : '';

    // إعداد وضع المطبخ (station vs room vs both)
    if (role === 'Kitchen') {
        var hasStation = station && station !== '' && station !== 'undefined' && station !== 'الكل';
        var hasRoom = kitchenRoom && kitchenRoom !== '' && kitchenRoom !== 'undefined';
        
        if (hasStation && hasRoom) {
            if (kitchenModeEl) kitchenModeEl.value = 'both';
        } else if (hasRoom) {
            if (kitchenModeEl) kitchenModeEl.value = 'room';
        } else {
            if (kitchenModeEl) kitchenModeEl.value = 'station';
        }
        if (kitchenRoomEl && hasRoom) kitchenRoomEl.value = kitchenRoom;
    }

    window.updateStaffFields('edit');
    document.getElementById('edit-staff-modal').classList.remove('hidden');
};

// === إظهار/إخفاء حقول القاعة والمحطة حسب الدور ===

window.updateStaffFields = function (prefix) {
    var role = document.getElementById(prefix + '-role').value;
    var roomBox = document.getElementById(prefix + '-room-box');
    var stationBox = document.getElementById(prefix + '-station-box');

    if (role === 'Waiter') {
        if (roomBox) roomBox.classList.remove('hidden');
        if (stationBox) stationBox.classList.add('hidden');
    } else if (role === 'Kitchen') {
        if (roomBox) roomBox.classList.add('hidden');
        if (stationBox) stationBox.classList.remove('hidden');
        window.updateKitchenMode(prefix);
    } else {
        if (roomBox) roomBox.classList.add('hidden');
        if (stationBox) stationBox.classList.add('hidden');
    }
};

window.updateKitchenMode = function (prefix) {
    var modeEl = document.getElementById(prefix + '-kitchen-mode');
    var stationSelectBox = document.getElementById(prefix + '-station-select-box');
    var kitchenRoomBox = document.getElementById(prefix + '-kitchen-room-box');
    if (!modeEl) return;

    if (modeEl.value === 'room') {
        if (stationSelectBox) stationSelectBox.classList.add('hidden');
        if (kitchenRoomBox) kitchenRoomBox.classList.remove('hidden');
    } else if (modeEl.value === 'both') {
        if (stationSelectBox) stationSelectBox.classList.remove('hidden');
        if (kitchenRoomBox) kitchenRoomBox.classList.remove('hidden');
    } else {
        if (stationSelectBox) stationSelectBox.classList.remove('hidden');
        if (kitchenRoomBox) kitchenRoomBox.classList.add('hidden');
    }
};

// === حفظ (إضافة أو تعديل) ===

window.saveStaff = async function (action) {
    var isEdit = (action === 'edit');
    var id = isEdit ? document.getElementById('edit-id').value : null;
    var name = document.getElementById(action + '-name').value.trim();
    var role = document.getElementById(action + '-role').value;
    var room = document.getElementById(action + '-room').value;
    var station = document.getElementById(action + '-station').value;
    var kitchenMode = document.getElementById(action + '-kitchen-mode');
    var kitchenRoom = document.getElementById(action + '-kitchen-room');
    var pin = document.getElementById(action + '-pin').value.trim();

    if (!name) {
        window.showToast ? window.showToast("يرجى إدخال اسم العامل", "error") : alert("يرجى إدخال اسم العامل");
        return;
    }
    // لا حاجة لتحقق من طول PIN - يمكن أن يكون أي رقم

    var payload = { "Name": name, "Role": role, "PIN": pin || "", "Status": true };

    if (role === 'Waiter') {
        payload["AssignedRoom"] = room || null;
        payload["AssignedStation"] = null;
        payload["KitchenRoom"] = null;
    } else if (role === 'Kitchen') {
        var mode = kitchenMode ? kitchenMode.value : 'station';
        if (mode === 'room') {
            payload["AssignedStation"] = null;
            payload["KitchenRoom"] = kitchenRoom ? kitchenRoom.value : null;
            payload["AssignedRoom"] = null;
        } else if (mode === 'both') {
            payload["AssignedStation"] = station || null;
            payload["KitchenRoom"] = kitchenRoom ? kitchenRoom.value : null;
            payload["AssignedRoom"] = null;
        } else {
            payload["AssignedStation"] = station || null;
            payload["KitchenRoom"] = null;
            payload["AssignedRoom"] = null;
        }
    } else {
        payload["AssignedRoom"] = null;
        payload["AssignedStation"] = null;
        payload["KitchenRoom"] = null;
    }

    try {
        var url = isEdit
            ? 'https://baserow.vidsai.site/api/database/rows/table/' + STAFF_TABLE_ID + '/' + id + '/?user_field_names=true'
            : 'https://baserow.vidsai.site/api/database/rows/table/' + STAFF_TABLE_ID + '/?user_field_names=true';

        var response = await fetch(url, {
            method: isEdit ? 'PATCH' : 'POST',
            headers: { "Authorization": "Token " + BASEROW_TOKEN, "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("Failed to save");
        document.getElementById(action + '-staff-modal').classList.add('hidden');
        window.showToast ? window.showToast(isEdit ? "✅ تم التحديث بنجاح" : "✅ تم إضافة العامل بنجاح", "success") : null;
        await window.renderStaff();
    } catch (e) {
        console.error("Save staff error:", e);
        window.showToast ? window.showToast("❌ خطأ أثناء الحفظ", "error") : alert("خطأ أثناء الحفظ");
    }
};

// === حذف عامل ===

window.deleteStaff = async function (id, name) {
    if (!confirm("⚠️ هل أنت متأكد من حذف العامل \"" + name + "\"؟\nهذا الإجراء لا يمكن التراجع عنه.")) return;

    try {
        var response = await fetch('https://baserow.vidsai.site/api/database/rows/table/' + STAFF_TABLE_ID + '/' + id + '/', {
            method: 'DELETE',
            headers: { "Authorization": "Token " + BASEROW_TOKEN }
        });
        if (!response.ok) throw new Error("Failed to delete");
        window.showToast ? window.showToast("🗑️ تم حذف العامل بنجاح", "success") : null;
        await window.renderStaff();
    } catch (e) {
        console.error("Delete staff error:", e);
        window.showToast ? window.showToast("❌ خطأ أثناء الحذف", "error") : alert("خطأ أثناء الحذف");
    }
};

// === تفعيل/إيقاف عامل ===

window.toggleStaffStatus = async function (id, newStatus) {
    if (!confirm(newStatus ? "تفعيل هذا العامل؟" : "إيقاف هذا العامل؟")) return;

    try {
        var response = await fetch('https://baserow.vidsai.site/api/database/rows/table/' + STAFF_TABLE_ID + '/' + id + '/?user_field_names=true', {
            method: 'PATCH',
            headers: { "Authorization": "Token " + BASEROW_TOKEN, "Content-Type": "application/json" },
            body: JSON.stringify({ "Status": newStatus })
        });
        if (!response.ok) throw new Error("Failed to toggle");
        await window.renderStaff();
    } catch (e) {
        console.error("Toggle error:", e);
        window.showToast ? window.showToast("❌ خطأ أثناء تغيير الحالة", "error") : alert("خطأ");
    }
};