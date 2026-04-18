// clients/demo/js/rooms.js

window.generateTableSVG = function (shape, chairColor = "#10b981", scale = 1.0, rotation = 0) {
    const tableColor = "#4b5563";
    const strokeColor = "#6b7280";
    let svg = "";

    const s = parseFloat(scale || 1.0);
    const r = parseInt(rotation || 0);
    const transformStyle = `transform: scale(${s}) rotate(${r}deg); transform-origin: center;`;

    switch (shape) {
        case "round-2":
            svg = `<svg width="70" height="70" viewBox="0 0 70 70" style="${transformStyle}"><ellipse cx="35" cy="8" rx="10" ry="6" fill="${chairColor}"/><ellipse cx="35" cy="62" rx="10" ry="6" fill="${chairColor}"/><circle cx="35" cy="35" r="22" fill="${tableColor}" stroke="${strokeColor}" stroke-width="2"/></svg>`;
            break;
        case "round-4":
            svg = `<svg width="90" height="90" viewBox="0 0 90 90" style="${transformStyle}"><ellipse cx="45" cy="8" rx="12" ry="8" fill="${chairColor}"/><ellipse cx="45" cy="82" rx="12" ry="8" fill="${chairColor}"/><ellipse cx="82" cy="45" rx="8" ry="12" fill="${chairColor}"/><ellipse cx="8" cy="45" rx="8" ry="12" fill="${chairColor}"/><circle cx="45" cy="45" r="28" fill="${tableColor}" stroke="${strokeColor}" stroke-width="2"/></svg>`;
            break;
        case "square-2":
            svg = `<svg width="80" height="80" viewBox="0 0 80 80" style="${transformStyle}"><ellipse cx="40" cy="8" rx="12" ry="6" fill="${chairColor}"/><ellipse cx="40" cy="72" rx="12" ry="6" fill="${chairColor}"/><rect x="20" y="20" width="40" height="40" rx="4" fill="${tableColor}" stroke="${strokeColor}" stroke-width="2"/></svg>`;
            break;
        case "square-4":
            svg = `<svg width="80" height="80" viewBox="0 0 80 80" style="${transformStyle}"><ellipse cx="40" cy="8" rx="12" ry="6" fill="${chairColor}"/><ellipse cx="40" cy="72" rx="12" ry="6" fill="${chairColor}"/><ellipse cx="72" cy="40" rx="6" ry="12" fill="${chairColor}"/><ellipse cx="8" cy="40" rx="6" ry="12" fill="${chairColor}"/><rect x="18" y="18" width="44" height="44" rx="6" fill="${tableColor}" stroke="${strokeColor}" stroke-width="2"/></svg>`;
            break;
        case "square-8":
            svg = `<svg width="100" height="100" viewBox="0 0 100 100" style="${transformStyle}">
                <ellipse cx="35" cy="8" rx="10" ry="6" fill="${chairColor}"/><ellipse cx="65" cy="8" rx="10" ry="6" fill="${chairColor}"/>
                <ellipse cx="35" cy="92" rx="10" ry="6" fill="${chairColor}"/><ellipse cx="65" cy="92" rx="10" ry="6" fill="${chairColor}"/>
                <ellipse cx="8" cy="35" rx="6" ry="10" fill="${chairColor}"/><ellipse cx="8" cy="65" rx="6" ry="10" fill="${chairColor}"/>
                <ellipse cx="92" cy="35" rx="6" ry="10" fill="${chairColor}"/><ellipse cx="92" cy="65" rx="6" ry="10" fill="${chairColor}"/>
                <rect x="20" y="20" width="60" height="60" rx="8" fill="${tableColor}" stroke="${strokeColor}" stroke-width="2"/></svg>`;
            break;
        case "rect-6":
            svg = `<svg width="140" height="80" viewBox="0 0 140 80" style="${transformStyle}"><ellipse cx="35" cy="8" rx="12" ry="6" fill="${chairColor}"/><ellipse cx="70" cy="8" rx="12" ry="6" fill="${chairColor}"/><ellipse cx="105" cy="8" rx="12" ry="6" fill="${chairColor}"/><ellipse cx="35" cy="72" rx="12" ry="6" fill="${chairColor}"/><ellipse cx="70" cy="72" rx="12" ry="6" fill="${chairColor}"/><ellipse cx="105" cy="72" rx="12" ry="6" fill="${chairColor}"/><rect x="15" y="18" width="110" height="44" rx="6" fill="${tableColor}" stroke="${strokeColor}" stroke-width="2"/></svg>`;
            break;
        case "rect-8":
            svg = `<svg width="180" height="80" viewBox="0 0 180 80" style="${transformStyle}"><ellipse cx="35" cy="8" rx="12" ry="6" fill="${chairColor}"/><ellipse cx="70" cy="8" rx="12" ry="6" fill="${chairColor}"/><ellipse cx="105" cy="8" rx="12" ry="6" fill="${chairColor}"/><ellipse cx="140" cy="8" rx="12" ry="6" fill="${chairColor}"/><ellipse cx="35" cy="72" rx="12" ry="6" fill="${chairColor}"/><ellipse cx="70" cy="72" rx="12" ry="6" fill="${chairColor}"/><ellipse cx="105" cy="72" rx="12" ry="6" fill="${chairColor}"/><ellipse cx="140" cy="72" rx="12" ry="6" fill="${chairColor}"/><rect x="15" y="18" width="150" height="44" rx="6" fill="${tableColor}" stroke="${strokeColor}" stroke-width="2"/></svg>`;
            break;
        default:
            if (shape.startsWith('bar-')) {
                const count = parseInt(shape.split('-')[1]) || 1;
                const w = Math.max(40, count * 30 + 10);
                let chairs = "";
                for(let i=0; i<count; i++) {
                    chairs += `<circle cx="${20 + i*30}" cy="10" r="7" fill="${chairColor}"/>`;
                }
                svg = `<svg width="${w}" height="45" viewBox="0 0 ${w} 45" style="${transformStyle}">${chairs}<rect x="10" y="22" width="${w-20}" height="15" rx="3" fill="${tableColor}" stroke="${strokeColor}" stroke-width="2"/></svg>`;
            } else {
                svg = `<svg width="70" height="70" style="${transformStyle}"><circle cx="35" cy="35" r="25" fill="${tableColor}" stroke="${strokeColor}"/></svg>`;
            }
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
            } else {
                throw new Error("Failed to load data from Baserow");
            }
        }

        let rooms = [...new Set(STATE.tableMapData.map(t => t.Room).filter(Boolean))].sort();

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
            <button onclick="window.switchRoom('${r}')" class="room-tab ${STATE.currentRoom === r ? 'room-indicator-active' : 'room-tab-inactive'} shadow-sm">
                ${r}
            </button>
        `).join('');

        let floorHtml = '';
        const currentTables = STATE.tableMapData.filter(t => t.Room === STATE.currentRoom);
        currentTables.forEach(t => {
            const shapeStr = (typeof t.Shape === 'object' && t.Shape) ? t.Shape.value : (t.Shape || 'round-4');
            // Ensure positions are treated as percentages for consistency across views
            let leftPct = parseFloat(t.PosX || 50);
            let topPct = parseFloat(t.PosY || 50);
            
            // Retro-compatibility: if values are large, assume they were pixels on a ~1000px base
            if (leftPct > 100) leftPct = (leftPct / 1000) * 100;
            if (topPct > 100) topPct = (topPct / 800) * 100;

            floorHtml += `
                <div class="table-element ${isSelected ? 'selected-for-edit' : ''}" data-id="${t.id}" 
                     style="left: ${leftPct}%; top: ${topPct}%;" 
                     onclick="window.selectTableForEdit('${t.id}')">
                    ${window.generateTableSVG(shapeStr, "#10b981", scale, rotation)}
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
                    <button onclick="window.deleteRoom()" class="room-tab bg-gray-700/50 text-gray-400 hover:bg-red-600 hover:text-white border border-gray-600 mr-4 flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        حذف القاعة
                    </button>
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
                        <div id="floor-canvas" class="floor-canvas max-w-5xl shadow-inner border-2 border-dashed border-gray-700/50 bg-[#161625] mx-auto"
                            onclick="if(event.target === this) window.deselectTable()">
                            ${floorHtml}
                        </div>
                    </div>
                </div>
            </div>
        `;

        dynamicContent.innerHTML = html;
        window.initDragAndDrop();
        window.updateTableOptions(); // This will auto-fill chairs and update preview

    } catch (e) {
        console.error("Rooms Settings Error:", e);
        dynamicContent.innerHTML = `<div class="p-6 text-center text-red-500 bg-red-900/20 border border-red-800 rounded-lg">فشل تحميل إعدادات القاعات - يرجى مراجعة الاتصال</div>`;
    }
};

window.renderTableTools = function () {
    const selectedTable = STATE.selectedTableId ? STATE.tableMapData.find(t => t.id == STATE.selectedTableId) : null;

    if (selectedTable) {
        return `
            <h3 class="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2 flex items-center gap-2">
                <svg class="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                تعديل الطاولة T${selectedTable.TableNumber}
            </h3>
            
            <div class="scale-control-container mb-4">
                <label class="block text-xs text-gray-400 mb-2 font-bold">تغيير الحجم: <span id="scale-value-display" class="text-brand">${parseFloat(selectedTable.Scale || 1.0).toFixed(1)}x</span></label>
                <input type="range" min="0.5" max="2.5" step="0.1" value="${selectedTable.Scale || 1.0}" 
                    class="brand-slider" oninput="window.updateTableScale(this.value)">
            </div>

            <div class="scale-control-container mb-6">
                <label class="block text-xs text-gray-400 mb-2 font-bold">تدوير الطاولة (Snap 45°): <span id="rotation-value-display" class="text-brand">${parseInt(selectedTable.Rotation || 0)}°</span></label>
                <input type="range" min="0" max="315" step="45" value="${parseInt(selectedTable.Rotation || 0)}" 
                    class="brand-slider" oninput="window.updateTableRotation(this.value)">
                <div class="flex justify-between text-[10px] text-gray-500 mt-2">
                    <span>0°</span>
                    <span>90°</span>
                    <span>180°</span>
                    <span>270°</span>
                </div>
            </div>

            <button onclick="window.saveTableMap()" class="w-full bg-brand hover:bg-brand-dark text-black font-black py-3 rounded-xl transition shadow-lg mb-3 flex items-center justify-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                حفظ التعديلات
            </button>
            <button onclick="window.deleteTable('${selectedTable.id}')" class="w-full bg-red-900/10 text-red-500 border border-red-800/20 hover:bg-red-600 hover:text-white font-bold py-3 rounded-xl transition">حذف الطاولة</button>
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
            </select>
        </div>

        <div class="mb-5">
            <label class="block text-xs text-gray-400 mb-1.5">رقم الطاولة:</label>
            <input type="number" id="new-table-number" min="1" placeholder="أدخل الرقم..." class="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-brand outline-none transition font-bold font-mono">
        </div>

        <div class="live-preview-box" id="table-live-preview"></div>

        <button onclick="window.addTableToRoom()" class="w-full bg-brand hover:bg-brand-dark text-black font-bold py-3 rounded-xl transition shadow-md flex items-center justify-center gap-2">
            <span>إضافة للقاعة</span>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
        </button>
    `;
};

window.updateTableOptions = function () {
    const typeSelect = document.getElementById('tool-table-type');
    const chairsSelect = document.getElementById('tool-table-chairs');
    if (!typeSelect || !chairsSelect) return;

    const type = typeSelect.value;
    let options = [];
    if (type === 'round') options = [2, 4];
    else if (type === 'square') options = [2, 4, 8];
    else if (type === 'rect') options = [6, 8, 10, 12];
    else if (type === 'bar') options = [1, 2, 3, 4, 5, 6];

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
    const display = document.getElementById('scale-value-display');
    if (display) display.innerText = `${scale.toFixed(1)}x`;

    const tableEl = document.querySelector(`.table-element[data-id="${STATE.selectedTableId}"]`);
    if (tableEl) {
        const svg = tableEl.querySelector('svg');
        if (svg) {
            // Get current rotation
            const table = STATE.tableMapData.find(t => t.id == STATE.selectedTableId);
            const rot = table ? (table.Rotation || 0) : 0;
            svg.style.transform = `scale(${scale}) rotate(${rot}deg)`;
        }
    }

    const tableIndex = STATE.tableMapData.findIndex(t => t.id == STATE.selectedTableId);
    if (tableIndex > -1) {
        STATE.tableMapData[tableIndex].Scale = scale;
        
        // Save immediately to Baserow
        clearTimeout(window._saveScaleTimeout);
        window._saveScaleTimeout = setTimeout(async () => {
            try {
                await fetch(`https://baserow.vidsai.site/api/database/rows/table/${TABLEMAP_TABLE_ID}/${STATE.selectedTableId}/?user_field_names=true`, {
                    method: 'PATCH',
                    headers: { "Authorization": `Token ${BASEROW_TOKEN}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ "Scale": scale })
                });
                console.log("Scale saved:", scale);
            } catch (e) { console.error("Failed to save scale:", e); }
        }, 500);
    }
};

window.updateTableRotation = function (val) {
    const deg = parseInt(val);
    const display = document.getElementById('rotation-value-display');
    if (display) display.innerText = `${deg}°`;

    const tableEl = document.querySelector(`.table-element[data-id="${STATE.selectedTableId}"]`);
    if (tableEl) {
        const svg = tableEl.querySelector('svg');
        if (svg) {
            // Get current scale
            const table = STATE.tableMapData.find(t => t.id == STATE.selectedTableId);
            const scale = table ? (table.Scale || 1.0) : 1.0;
            svg.style.transform = `scale(${scale}) rotate(${deg}deg)`;
        }
    }

    clearTimeout(window._saveRotationTimeout);
    window._saveRotationTimeout = setTimeout(async () => {
        const tableIndex = STATE.tableMapData.findIndex(t => t.id == STATE.selectedTableId);
        if (tableIndex > -1) {
            STATE.tableMapData[tableIndex].Rotation = deg;
            try {
                await fetch(`https://baserow.vidsai.site/api/database/rows/table/${TABLEMAP_TABLE_ID}/${STATE.selectedTableId}/?user_field_names=true`, {
                    method: 'PATCH',
                    headers: { "Authorization": `Token ${BASEROW_TOKEN}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ "Rotation": deg })
                });
            } catch (e) { console.error(e); }
        }
    }, 500);
};

// Modal Control
window.openRoomModal = function (title, value, callback) {
    const m = document.getElementById('room-modal');
    const t = document.getElementById('room-modal-title');
    const i = document.getElementById('room-modal-input');
    const c = document.getElementById('room-modal-confirm-btn');
    if (!m || !t || !i || !c) return;

    t.innerText = title;
    i.value = value || '';
    c.onclick = () => {
        const newVal = i.value.trim();
        if (newVal) {
            callback(newVal);
            window.closeRoomModal();
        }
    };
    m.classList.remove('hidden');
    setTimeout(() => i.focus(), 100);
};

window.closeRoomModal = function () {
    const m = document.getElementById('room-modal');
    if (m) m.classList.add('hidden');
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
    STATE.selectedTableId = null;
    window.renderSettingsRooms();
};

window.saveTableMap = function() {
    window.renderSettingsRooms(); // Just re-render for now as updates are auto-saved or handled by dragEnd
    window.showToast("تم حفظ جميع التعديلات بنجاح", "success");
};

window.deleteRoom = async function () {
    if (!STATE.currentRoom) return;

    window.showDeleteConfirm(
        "حذف القاعة؟",
        `سيتم حذف كل الطاولات في قاعة "${STATE.currentRoom}" نهائياً! هل أنت متأكد؟`,
        async () => {
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
        }
    );
};

window.addTableToRoom = async function () {
    const numInput = document.getElementById('new-table-number');
    const typeSelect = document.getElementById('tool-table-type');
    const chairsSelect = document.getElementById('tool-table-chairs');
    const room = STATE.currentRoom;

    if (!numInput || !numInput.value || !room) {
        window.showToast("الرجاء إدخال رقم للطاولة", "error");
        return;
    }
    const num = parseInt(numInput.value, 10);
    const type = typeSelect.value;
    const chairs = chairsSelect.value;
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
        "Scale": 1.0,
        "Rotation": 0
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
        window.showToast("تم إضافة الطاولة بنجاح", "success");
        window.renderSettingsRooms();

    } catch (e) {
        console.error(e);
        window.showToast("حدث خطأ أثناء إضافة الطاولة", "error");
        if (btn) btn.disabled = false;
    }
};

window.deleteTable = async function (rowId, e) {
    if (e) e.stopPropagation();

    window.showDeleteConfirm(
        "حذف الطاولة؟",
        "هل أنت متأكد من رغبتك في حذف هذه الطاولة؟ لا يمكن التراجع عن هذا الإجراء.",
        async () => {
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
                window.showToast("فشل في حذف الطاولة", "error");
            }
        }
    );
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
    const canvas = document.getElementById('floor-canvas');
    if (!canvas) return;
    const canvasRect = canvas.getBoundingClientRect();
    
    // Calculate position as percentage of canvas
    const finalX = ((parseInt(target.style.left, 10) || 0) / canvasRect.width) * 100;
    const finalY = ((parseInt(target.style.top, 10) || 0) / canvasRect.height) * 100;

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
            window.showToast("تم حفظ الموقع بدقة", "success");
        } catch (err) {
            console.error(err);
            window.showToast("فشل في حفظ موقع الطاولة", "error");
        }
    }
};
