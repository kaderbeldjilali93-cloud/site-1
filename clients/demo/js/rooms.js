// clients/demo/js/rooms.js

window.generateTableSVG = function (shape, chairColor = "#10b981", scale = 1.0) {
    const tableColor = "#4b5563";
    const strokeColor = "#6b7280";
    let svg = "";

    // Parse shape for specific cases or use defaults
    switch (shape) {
        case "round-2":
            svg = `
            <svg width="70" height="70" viewBox="0 0 70 70" style="transform: scale(${scale}); transform-origin: center;">
                <ellipse cx="35" cy="8" rx="10" ry="6" fill="${chairColor}"/>
                <ellipse cx="35" cy="62" rx="10" ry="6" fill="${chairColor}"/>
                <circle cx="35" cy="35" r="22" fill="${tableColor}" stroke="${strokeColor}" stroke-width="2"/>
            </svg>`;
            break;
        case "round-4":
            svg = `
            <svg width="90" height="90" viewBox="0 0 90 90" style="transform: scale(${scale}); transform-origin: center;">
                <ellipse cx="45" cy="8" rx="12" ry="8" fill="${chairColor}"/>
                <ellipse cx="45" cy="82" rx="12" ry="8" fill="${chairColor}"/>
                <ellipse cx="82" cy="45" rx="8" ry="12" fill="${chairColor}"/>
                <ellipse cx="8" cy="45" rx="8" ry="12" fill="${chairColor}"/>
                <circle cx="45" cy="45" r="28" fill="${tableColor}" stroke="${strokeColor}" stroke-width="2"/>
            </svg>`;
            break;
        case "square-4":
            svg = `
            <svg width="80" height="80" viewBox="0 0 80 80" style="transform: scale(${scale}); transform-origin: center;">
                <ellipse cx="40" cy="8" rx="12" ry="6" fill="${chairColor}"/>
                <ellipse cx="40" cy="72" rx="12" ry="6" fill="${chairColor}"/>
                <ellipse cx="72" cy="40" rx="6" ry="12" fill="${chairColor}"/>
                <ellipse cx="8" cy="40" rx="6" ry="12" fill="${chairColor}"/>
                <rect x="18" y="18" width="44" height="44" rx="6" fill="${tableColor}" stroke="${strokeColor}" stroke-width="2"/>
            </svg>`;
            break;
        case "rect-6":
            svg = `
            <svg width="140" height="80" viewBox="0 0 140 80" style="transform: scale(${scale}); transform-origin: center;">
                <ellipse cx="35" cy="8" rx="12" ry="6" fill="${chairColor}"/>
                <ellipse cx="70" cy="8" rx="12" ry="6" fill="${chairColor}"/>
                <ellipse cx="105" cy="8" rx="12" ry="6" fill="${chairColor}"/>
                <ellipse cx="35" cy="72" rx="12" ry="6" fill="${chairColor}"/>
                <ellipse cx="70" cy="72" rx="12" ry="6" fill="${chairColor}"/>
                <ellipse cx="105" cy="72" rx="12" ry="6" fill="${chairColor}"/>
                <rect x="15" y="18" width="110" height="44" rx="6" fill="${tableColor}" stroke="${strokeColor}" stroke-width="2"/>
            </svg>`;
            break;
        case "rect-8":
            svg = `
            <svg width="180" height="80" viewBox="0 0 180 80" style="transform: scale(${scale}); transform-origin: center;">
                <ellipse cx="35" cy="8" rx="12" ry="6" fill="${chairColor}"/>
                <ellipse cx="70" cy="8" rx="12" ry="6" fill="${chairColor}"/>
                <ellipse cx="105" cy="8" rx="12" ry="6" fill="${chairColor}"/>
                <ellipse cx="140" cy="8" rx="12" ry="6" fill="${chairColor}"/>
                <ellipse cx="35" cy="72" rx="12" ry="6" fill="${chairColor}"/>
                <ellipse cx="70" cy="72" rx="12" ry="6" fill="${chairColor}"/>
                <ellipse cx="105" cy="72" rx="12" ry="6" fill="${chairColor}"/>
                <ellipse cx="140" cy="72" rx="12" ry="6" fill="${chairColor}"/>
                <rect x="15" y="18" width="150" height="44" rx="6" fill="${tableColor}" stroke="${strokeColor}" stroke-width="2"/>
            </svg>`;
            break;
        case "bar-1":
            svg = `
            <svg width="40" height="40" viewBox="0 0 40 40" style="transform: scale(${scale}); transform-origin: center;">
                <circle cx="20" cy="10" r="6" fill="${chairColor}"/>
                <rect x="14" y="20" width="12" height="15" rx="3" fill="${tableColor}" stroke="${strokeColor}" stroke-width="2"/>
            </svg>`;
            break;
        default:
            svg = `<svg width="70" height="70" style="transform: scale(${scale}); transform-origin: center;"><circle cx="35" cy="35" r="25" fill="${tableColor}" stroke="${strokeColor}"/></svg>`;
    }
    return svg;
};

window.renderSettingsRooms = async function () {
    const dynamicContent = document.getElementById('dynamic-content');
    if (!dynamicContent) return;

    dynamicContent.innerHTML = `<div class="flex items-center justify-center p-10"><div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand"></div></div>`;

    try {
        if (!STATE.tableMapData || STATE.tableMapData.length === 0) {
            const res = await fetch(`https://baserow.vidsai.site/api/database/rows/table/${TABLEMAP_TABLE_ID}/?user_field_names=true&size=200`, {
                headers: { "Authorization": `Token ${BASEROW_TOKEN}` }
            });
            if (res.ok) {
                const data = await res.json();
                STATE.tableMapData = data.results || [];
            }
        }

        let rooms = [...new Set(STATE.tableMapData.map(t => t.Room).filter(Boolean))].sort();

        // Ensure currentRoom is in the rooms list even if it has no tables yet
        if (STATE.currentRoom && !rooms.includes(STATE.currentRoom)) {
            rooms.push(STATE.currentRoom);
            rooms.sort();
        }

        if (!STATE.currentRoom && rooms.length > 0) {
            STATE.currentRoom = rooms[0];
        }

        if (rooms.length === 0 && !STATE.currentRoom) {
            dynamicContent.innerHTML = `
                <div class="max-w-xl mx-auto mt-10 bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700 text-center">
                    <h2 class="text-2xl font-bold text-white mb-6">لا توجد قاعات بعد</h2>
                    <button onclick="window.addRoom()" class="bg-brand hover:bg-brand-dark text-black font-bold py-3 px-8 rounded-xl transition shadow-lg">➕ إنشاء أول قاعة</button>
                </div>
            `;
            return;
        }

        let tabsHtml = rooms.map(r => `
            <button onclick="window.switchRoom('${r}')" class="room-tab ${STATE.currentRoom === r ? 'room-tab-active' : 'room-tab-inactive'} shadow-sm">
                ${r}
            </button>
        `).join('');

        let floorHtml = '';
        const currentTables = STATE.tableMapData.filter(t => t.Room === STATE.currentRoom);
        currentTables.forEach(t => {
            const shapeStr = (typeof t.Shape === 'object' && t.Shape) ? t.Shape.value : (t.Shape || 'round-4');
            const posX = t.PosX || 50;
            const posY = t.PosY || 50;
            const scale = t.Scale || 1.0;
            const isSelected = STATE.selectedTableId == t.id;

            floorHtml += `
                <div class="table-element ${isSelected ? 'selected-for-edit' : ''}" data-id="${t.id}" style="left: ${posX}px; top: ${posY}px;" onclick="window.selectTableForEdit('${t.id}')">
                    ${window.generateTableSVG(shapeStr, "#10b981", scale)}
                    <span class="table-number-label">T${t.TableNumber}</span>
                    <div class="table-delete-btn" onclick="window.deleteTable('${t.id}', event)">✕</div>
                </div>
            `;
        });

        const html = `
            <div class="max-w-6xl mx-auto pb-10">
                <!-- Room Tabs -->
                <div class="flex items-center justify-between mb-6 bg-gray-800 p-2 rounded-xl border border-gray-700 overflow-x-auto">
                    <div class="flex items-center gap-2">
                        ${tabsHtml}
                        <button onclick="window.addRoom()" class="room-tab bg-gray-700 text-gray-300 hover:text-white hover:bg-gray-600 ml-2">➕ إضافة قاعة</button>
                    </div>
                    <button onclick="window.deleteRoom()" class="room-tab bg-red-900/30 text-red-400 hover:bg-red-600 hover:text-white border border-red-800/50 mr-4">🗑️ حذف القاعة</button>
                </div>
                
                <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <!-- Tools Panel -->
                    <div id="rooms-tools-panel" class="lg:col-span-1 bg-gray-800 border border-gray-700 rounded-2xl p-5 shadow-xl h-fit sticky top-24">
                        ${window.renderTableTools()}
                    </div>
                    
                    <!-- Floor Map -->
                    <div class="lg:col-span-3">
                        <h3 class="text-lg font-bold text-white mb-4 flex justify-between items-end">
                            <span>أرضية ${STATE.currentRoom}</span>
                            <span class="text-sm font-normal text-gray-400 border border-gray-700 rounded-full px-3 py-1 bg-gray-800 shadow-inner">${currentTables.length} طاولات</span>
                        </h3>
                        <div id="floor-canvas" class="floor-canvas shadow-inner border-2 border-dashed border-gray-700/50 bg-[#161625]">
                            ${floorHtml}
                        </div>
                    </div>
                </div>
            </div>
        `;

        dynamicContent.innerHTML = html;
        window.initDragAndDrop();
        window.updateTablePreview();

    } catch (e) {
        console.error("Rooms Settings Error:", e);
        dynamicContent.innerHTML = `<div class="p-6 text-center text-red-500 bg-red-900/20 border border-red-800 rounded-lg">فشل تحميل إعدادات القاعات</div>`;
    }
};

window.renderTableTools = function () {
    // Check if we are editing an existing table or adding a new one
    const selectedTable = STATE.selectedTableId ? STATE.tableMapData.find(t => t.id == STATE.selectedTableId) : null;

    if (selectedTable) {
        return `
            <h3 class="text-lg font-bold text-brand mb-4 border-b border-gray-700 pb-2 flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                تعديل الطاولة T${selectedTable.TableNumber}
            </h3>
            
            <div class="scale-control-container mb-6">
                <label class="block text-sm text-gray-300 mb-3 font-bold">تغيير الحجم (Scale): <span id="scale-value-display" class="text-brand">${(selectedTable.Scale || 1.0).toFixed(1)}x</span></label>
                <input type="range" min="0.5" max="2.5" step="0.1" value="${selectedTable.Scale || 1.0}" 
                    class="brand-slider" oninput="window.updateTableScale(this.value)">
                <div class="flex justify-between text-[10px] text-gray-500 mt-2">
                    <span>صغير</span>
                    <span>كبير جداً</span>
                </div>
            </div>

            <button onclick="window.deselectTable()" class="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition mb-3">إلغاء التحديد</button>
            <button onclick="window.deleteTable('${selectedTable.id}')" class="w-full bg-red-900/30 text-red-400 border border-red-800/50 hover:bg-red-600 hover:text-white font-bold py-3 rounded-xl transition">حذف الطاولة</button>
        `;
    }

    return `
        <h3 class="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2 flex items-center gap-2">
            <svg class="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            إضافة طاولة
        </h3>
        
        <div class="mb-4">
            <label class="block text-xs text-gray-400 mb-1.5">نوع الطاولة:</label>
            <select id="tool-table-type" onchange="window.updateTableOptions()" class="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-brand outline-none transition appearance-none">
                <option value="round">دائرة (Round)</option>
                <option value="square">مربع (Square)</option>
                <option value="rect">مستطيل (Rectangular)</option>
                <option value="bar">بار (Bar)</option>
            </select>
        </div>

        <div class="mb-4">
            <label class="block text-xs text-gray-400 mb-1.5">عدد الكراسي:</label>
            <select id="tool-table-chairs" onchange="window.updateTablePreview()" class="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-brand outline-none transition appearance-none">
                <!-- Autopopulated -->
            </select>
        </div>

        <div class="mb-5">
            <label class="block text-xs text-gray-400 mb-1.5">رقم الطاولة:</label>
            <input type="number" id="new-table-number" min="1" placeholder="أدخل الرقم..." class="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-brand outline-none transition font-bold font-mono">
        </div>

        <div class="live-preview-box" id="table-live-preview">
            <!-- Preview SVG -->
        </div>

        <button onclick="window.addTableToRoom()" class="w-full bg-brand hover:bg-brand-dark text-black font-bold py-3 rounded-xl transition shadow-md flex items-center justify-center gap-2">
            <span>إضافة للقاعة</span>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
        </button>
    `;
};

window.updateTableOptions = function () {
    const type = document.getElementById('tool-table-type').value;
    const chairsSelect = document.getElementById('tool-table-chairs');
    if (!chairsSelect) return;

    let options = [];
    if (type === 'round') options = [2, 4];
    else if (type === 'square') options = [4];
    else if (type === 'rect') options = [6, 8, 10, 12];
    else if (type === 'bar') options = [1];

    chairsSelect.innerHTML = options.map(o => `<option value="${o}">${o} كراسي</option>`).join('');
    window.updateTablePreview();
};

window.updateTablePreview = function () {
    const type = document.getElementById('tool-table-type')?.value;
    const chairs = document.getElementById('tool-table-chairs')?.value;
    const previewBox = document.getElementById('table-live-preview');
    if (!previewBox || !type) return;

    const shapeId = `${type}-${chairs}`;
    previewBox.innerHTML = `<div class="transform scale-125">${window.generateTableSVG(shapeId)}</div>`;
};

window.selectTableForEdit = function (id) {
    if (STATE.selectedTableId == id) return;
    STATE.selectedTableId = id;
    window.renderSettingsRooms();
};

window.deselectTable = function () {
    STATE.selectedTableId = null;
    window.renderSettingsRooms();
};

window.updateTableScale = function (val) {
    const scale = parseFloat(val);
    document.getElementById('scale-value-display').innerText = `${scale.toFixed(1)}x`;

    // Visually update the table
    const tableEl = document.querySelector(`.table-element[data-id="${STATE.selectedTableId}"]`);
    if (tableEl) {
        const svgContainer = tableEl.querySelector('svg');
        if (svgContainer) {
            svgContainer.style.transform = `scale(${scale})`;
        }
    }

    // Debounced Save to Baserow
    clearTimeout(window._saveScaleTimeout);
    window._saveScaleTimeout = setTimeout(async () => {
        const tableIndex = STATE.tableMapData.findIndex(t => t.id == STATE.selectedTableId);
        if (tableIndex > -1) {
            STATE.tableMapData[tableIndex].Scale = scale;
            try {
                await fetch(`https://baserow.vidsai.site/api/database/rows/table/${TABLEMAP_TABLE_ID}/${STATE.selectedTableId}/?user_field_names=true`, {
                    method: 'PATCH',
                    headers: { "Authorization": `Token ${BASEROW_TOKEN}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ "Scale": scale })
                });
            } catch (e) { console.error(e); }
        }
    }, 500);
};

// Modal Control
window.openRoomModal = function (title, value, callback) {
    document.getElementById('room-modal-title').innerText = title;
    document.getElementById('room-modal-input').value = value || '';
    const confirmBtn = document.getElementById('room-modal-confirm-btn');
    confirmBtn.onclick = () => {
        const newVal = document.getElementById('room-modal-input').value.trim();
        if (newVal) {
            callback(newVal);
            window.closeRoomModal();
        }
    };
    document.getElementById('room-modal').classList.remove('hidden');
    setTimeout(() => document.getElementById('room-modal-input').focus(), 100);
};

window.closeRoomModal = function () {
    document.getElementById('room-modal').classList.add('hidden');
};

window.addRoom = function () {
    window.openRoomModal("إضافة قاعة جديدة", "", (name) => {
        const cleanName = name.trim();
        const rooms = [...new Set(STATE.tableMapData.map(t => t.Room).filter(Boolean))];
        if (rooms.includes(cleanName)) {
            window.showToast("هذه القاعة موجودة مسبقاً", "error");
            return;
        }
        STATE.currentRoom = cleanName;
        window.renderSettingsRooms();
    });
};

window.switchRoom = function (r) {
    if (STATE.currentRoom === r) return;
    STATE.currentRoom = r;
    STATE.selectedTableId = null; // Clear selection on room switch
    window.renderSettingsRooms();
};

window.deleteRoom = async function () {
    if (!STATE.currentRoom) return;
    if (!confirm(`سيتم حذف كل الطاولات في قاعة "${STATE.currentRoom}" نهائياً! هل أنت متأكد؟`)) return;

    const currentTables = STATE.tableMapData.filter(t => t.Room === STATE.currentRoom);
    if (currentTables.length > 0) {
        window.showToast("جاري الحذف...", "success");
        try {
            for (const table of currentTables) {
                await fetch(`https://baserow.vidsai.site/api/database/rows/table/${TABLEMAP_TABLE_ID}/${table.id}/`, {
                    method: 'DELETE',
                    headers: { "Authorization": `Token ${BASEROW_TOKEN}` }
                });
            }
            STATE.tableMapData = STATE.tableMapData.filter(t => t.Room !== STATE.currentRoom);
        } catch (e) {
            console.error(e);
            window.showToast("حدث خطأ أثناء حذف القاعة", "error");
            return;
        }
    }

    STATE.currentRoom = null;
    window.renderSettingsRooms();
};

window.addTableToRoom = async function () {
    const numInput = document.getElementById('new-table-number');
    const type = document.getElementById('tool-table-type').value;
    const chairs = document.getElementById('tool-table-chairs').value;
    const room = STATE.currentRoom;

    if (!numInput || !numInput.value || !room) {
        window.showToast("الرجاء إدخال رقم للطاولة", "error");
        return;
    }
    const num = parseInt(numInput.value, 10);
    const shapeId = `${type}-${chairs}`;

    const exists = STATE.tableMapData.find(t => t.TableNumber == num);
    if (exists) {
        window.showToast(`الطاولة رقم ${num} موجودة مسبقاً في قاعة ${exists.Room}`, "error");
        return;
    }

    const payload = {
        "Room": room,
        "TableNumber": num,
        "Shape": shapeId,
        "Chairs": parseInt(chairs),
        "PosX": 250,
        "PosY": 200,
        "Scale": 1.0
    };

    const btn = document.querySelector('button[onclick="window.addTableToRoom()"]');
    if (btn) btn.disabled = true;

    try {
        const res = await fetch(`https://baserow.vidsai.site/api/database/rows/table/${TABLEMAP_TABLE_ID}/?user_field_names=true`, {
            method: 'POST',
            headers: { "Authorization": `Token ${BASEROW_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("Failed to add table");

        const data = await res.json();
        STATE.tableMapData.push(data);
        window.showToast("تم إضافة الطاولة", "success");
        window.renderSettingsRooms();

    } catch (e) {
        console.error(e);
        window.showToast("خطأ أثناء الإضافة", "error");
        if (btn) btn.disabled = false;
    }
};

window.deleteTable = async function (rowId, e) {
    if (e) e.stopPropagation();
    if (!confirm("هل تريد حذف هذه الطاولة؟")) return;

    try {
        const res = await fetch(`https://baserow.vidsai.site/api/database/rows/table/${TABLEMAP_TABLE_ID}/${rowId}/`, {
            method: 'DELETE',
            headers: { "Authorization": `Token ${BASEROW_TOKEN}` }
        });
        if (!res.ok) throw new Error("Failed to delete table");

        STATE.tableMapData = STATE.tableMapData.filter(t => t.id != rowId);
        STATE.selectedTableId = null;
        window.showToast("تم الحذف بنجاح", "success");
        window.renderSettingsRooms();
    } catch (e) {
        console.error(e);
        window.showToast("فشل الحذف", "error");
    }
};

window.initDragAndDrop = function () {
    const canvas = document.getElementById('floor-canvas');
    if (!canvas) return;

    canvas.addEventListener('mousedown', window.handleDragStart);
    canvas.addEventListener('touchstart', window.handleDragStart, { passive: false });

    if (window._dragListenersAdded) return;

    document.addEventListener('mousemove', window.handleDragMove);
    document.addEventListener('mouseup', window.handleDragEnd);
    document.addEventListener('touchmove', window.handleDragMove, { passive: false });
    document.addEventListener('touchend', window.handleDragEnd);

    window._dragListenersAdded = true;
};

window.handleDragStart = function (e) {
    if (STATE.currentActiveView !== 'settings_rooms') return;

    const target = e.target.closest('.table-element');
    if (!target) return;
    if (e.target.closest('.table-delete-btn')) return;

    if (e.type === 'touchstart') e.preventDefault();

    STATE.isDragging = true;
    STATE.dragTarget = target;

    const canvas = document.getElementById('floor-canvas');
    const canvasRect = canvas.getBoundingClientRect();

    let clientX = (e.type === 'touchstart') ? e.touches[0].clientX : e.clientX;
    let clientY = (e.type === 'touchstart') ? e.touches[0].clientY : e.clientY;

    const targetRect = target.getBoundingClientRect();

    STATE.dragOffset = {
        x: clientX - targetRect.left,
        y: clientY - targetRect.top
    };

    target.style.zIndex = 1000;
};

window.handleDragMove = function (e) {
    if (!STATE.isDragging || !STATE.dragTarget) return;

    if (e.type === 'touchmove') e.preventDefault();

    const canvas = document.getElementById('floor-canvas');
    const canvasRect = canvas.getBoundingClientRect();

    let clientX = (e.type === 'touchmove') ? e.touches[0].clientX : e.clientX;
    let clientY = (e.type === 'touchmove') ? e.touches[0].clientY : e.clientY;

    let rawX = clientX - canvasRect.left - STATE.dragOffset.x;
    let rawY = clientY - canvasRect.top - STATE.dragOffset.y;

    STATE.dragTarget.style.left = `${rawX}px`;
    STATE.dragTarget.style.top = `${rawY}px`;
};

window.handleDragEnd = async function (e) {
    if (!STATE.isDragging || !STATE.dragTarget) return;

    const target = STATE.dragTarget;
    STATE.isDragging = false;
    STATE.dragTarget = null;
    target.style.zIndex = "";

    const rowId = target.getAttribute('data-id');
    const finalX = parseInt(target.style.left, 10) || 0;
    const finalY = parseInt(target.style.top, 10) || 0;

    const tableIndex = STATE.tableMapData.findIndex(t => t.id == rowId);
    if (tableIndex > -1) {
        STATE.tableMapData[tableIndex].PosX = finalX;
        STATE.tableMapData[tableIndex].PosY = finalY;

        try {
            await fetch(`https://baserow.vidsai.site/api/database/rows/table/${TABLEMAP_TABLE_ID}/${rowId}/?user_field_names=true`, {
                method: 'PATCH',
                headers: { "Authorization": `Token ${BASEROW_TOKEN}`, "Content-Type": "application/json" },
                body: JSON.stringify({ "PosX": finalX, "PosY": finalY })
            });
            window.showToast("تم حفظ الموقع", "success");
        } catch (err) { console.error(err); }
    }
};
