// clients/demo/js/rooms.js

window.generateTableSVG = function (shape, chairColor = "#10b981", scale = 1.0, rotation = 0) {
    const tableColor = "#4b5563";
    const strokeColor = "#6b7280";
    let svg = "";

    const s = parseFloat(scale || 1.0);
    const r = parseInt(rotation || 0);
    const transformStyle = `transform: scale(${s}) rotate(${r}deg); transform-origin: center;`;

    // Normalizing shape string
    const shapeId = (typeof shape === 'object' && shape) ? shape.value : (shape || 'round-4');

    if (shapeId.startsWith('bar-')) {
        const count = parseInt(shapeId.split('-')[1]) || 1;
        const w = Math.max(40, count * 30 + 10);
        let chairs = "";
        for (let i = 0; i < count; i++) {
            chairs += `<circle cx="${20 + i * 30}" cy="10" r="7" fill="${chairColor}"/>`;
        }
        svg = `<svg width="${w}" height="45" viewBox="0 0 ${w} 45" style="${transformStyle}">${chairs}<rect x="10" y="22" width="${w - 20}" height="15" rx="3" fill="${tableColor}" stroke="${strokeColor}" stroke-width="2"/></svg>`;
    } else {
        switch (shapeId) {
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
                svg = `<svg width="100" height="100" viewBox="0 0 100 100" style="${transformStyle}"><ellipse cx="35" cy="8" rx="10" ry="6" fill="${chairColor}"/><ellipse cx="65" cy="8" rx="10" ry="6" fill="${chairColor}"/><ellipse cx="35" cy="92" rx="10" ry="6" fill="${chairColor}"/><ellipse cx="65" cy="92" rx="10" ry="6" fill="${chairColor}"/><ellipse cx="8" cy="35" rx="6" ry="10" fill="${chairColor}"/><ellipse cx="8" cy="65" rx="6" ry="10" fill="${chairColor}"/><ellipse cx="92" cy="35" rx="6" ry="10" fill="${chairColor}"/><ellipse cx="92" cy="65" rx="6" ry="10" fill="${chairColor}"/><rect x="20" y="20" width="60" height="60" rx="8" fill="${tableColor}" stroke="${strokeColor}" stroke-width="2"/></svg>`;
                break;
            case "rect-6":
                svg = `<svg width="140" height="80" viewBox="0 0 140 80" style="${transformStyle}"><ellipse cx="35" cy="8" rx="12" ry="6" fill="${chairColor}"/><ellipse cx="70" cy="8" rx="12" ry="6" fill="${chairColor}"/><ellipse cx="105" cy="8" rx="12" ry="6" fill="${chairColor}"/><ellipse cx="35" cy="72" rx="12" ry="6" fill="${chairColor}"/><ellipse cx="70" cy="72" rx="12" ry="6" fill="${chairColor}"/><ellipse cx="105" cy="72" rx="12" ry="6" fill="${chairColor}"/><rect x="15" y="18" width="110" height="44" rx="6" fill="${tableColor}" stroke="${strokeColor}" stroke-width="2"/></svg>`;
                break;
            case "rect-8":
                svg = `<svg width="180" height="80" viewBox="0 0 180 80" style="${transformStyle}"><ellipse cx="35" cy="8" rx="12" ry="6" fill="${chairColor}"/><ellipse cx="70" cy="8" rx="12" ry="6" fill="${chairColor}"/><ellipse cx="105" cy="8" rx="12" ry="6" fill="${chairColor}"/><ellipse cx="140" cy="8" rx="12" ry="6" fill="${chairColor}"/><ellipse cx="35" cy="72" rx="12" ry="6" fill="${chairColor}"/><ellipse cx="70" cy="72" rx="12" ry="6" fill="${chairColor}"/><ellipse cx="105" cy="72" rx="12" ry="6" fill="${chairColor}"/><ellipse cx="140" cy="72" rx="12" ry="6" fill="${chairColor}"/><rect x="15" y="18" width="150" height="44" rx="6" fill="${tableColor}" stroke="${strokeColor}" stroke-width="2"/></svg>`;
                break;
            default:
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
        // Only load from Baserow if we don't have data yet (first load / page refresh)
        if (!STATE.tableMapData || STATE.tableMapData.length === 0) {
            const res = await fetch(`https://baserow.vidsai.site/api/database/rows/table/${TABLEMAP_TABLE_ID}/?user_field_names=true&size=200`, {
                headers: { "Authorization": `Token ${BASEROW_TOKEN}` }
            });
            if (res.ok) {
                const data = await res.json();
                STATE.tableMapData = data.results || [];

                // One-time migration: convert any legacy pixel values (>95) to percentages
                for (const t of STATE.tableMapData) {
                    const px = parseFloat(t.PosX) || 0;
                    const py = parseFloat(t.PosY) || 0;
                    if (px > 95 || py > 95) {
                        const newX = Math.min(90, (px / 1200) * 100);
                        const newY = Math.min(90, (py / 700) * 100);
                        t.PosX = newX;
                        t.PosY = newY;
                        fetch(`https://baserow.vidsai.site/api/database/rows/table/${TABLEMAP_TABLE_ID}/${t.id}/?user_field_names=true`, {
                            method: 'PATCH',
                            headers: { "Authorization": `Token ${BASEROW_TOKEN}`, "Content-Type": "application/json" },
                            body: JSON.stringify({ "PosX": newX, "PosY": newY })
                        }).catch(e => console.warn('Migration save error:', e));
                    }
                }
            } else {
                throw new Error("Failed to load data from Baserow");
            }
        }

        let rooms = [...new Set(STATE.tableMapData.map(t => t.Room).filter(Boolean))].sort();

        // حفظ القاعات الجديدة المضافة يدوياً في الجلسة لمنع اختفائها قبل إضافة طاولة
        if (!STATE.sessionRooms) STATE.sessionRooms = [];
        STATE.sessionRooms.forEach(sr => {
            if (!rooms.includes(sr)) rooms.push(sr);
        });
        rooms.sort();

        if (!STATE.currentRoom && rooms.length > 0) {
            STATE.currentRoom = rooms[0];
        }

        // التأكد من أن القاعة الحالية موجودة في القائمة حتى لو كانت جديدة وفارغة
        if (STATE.currentRoom && !rooms.includes(STATE.currentRoom)) {
            rooms.push(STATE.currentRoom);
            rooms.sort();
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
            // Standardized coordinate loading - handle both pixels (legacy) and percentages
            let posX = parseFloat(t.PosX) || 10;
            let posY = parseFloat(t.PosY) || 10;

            // If data is > 100, it's definitely old pixel data - convert it
            let leftPct = (posX > 100) ? Math.round((posX / 1100) * 100) : Math.round(posX);
            let topPct = (posY > 100) ? Math.round((posY / 700) * 100) : Math.round(posY);

            const scale = t.Scale || 1.0;
            const rotation = t.Rotation || 0;
            const isSelected = STATE.selectedTableId == t.id;

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
                            onclick="if(event.target === this && !STATE.wasLassoing && !STATE.wasDragging) window.deselectTable()">
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
    if (!STATE.selectedTableIds) STATE.selectedTableIds = [];

    if (STATE.selectedTableIds.length > 1) {
        return `
            <h3 class="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2 flex items-center gap-2">
                <svg class="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
                تم تحديد ${STATE.selectedTableIds.length} طاولات
            </h3>
            
            <button onclick="window.copySelectedTables()" class="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition shadow-lg mb-3 flex items-center justify-center gap-2">
                <svg class="w-4 h-4" transform="scale(-1, 1)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                نسخ الطاولات (Ctrl+C)
            </button>
            <button onclick="window.deleteSelectedTables()" class="w-full bg-red-900/10 text-red-500 border border-red-800/20 hover:bg-red-600 hover:text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                حذف الطاولات (Delete)
            </button>
        `;
    }

    const selectedTable = STATE.selectedTableId ? STATE.tableMapData.find(t => t.id == STATE.selectedTableId) : null;

    if (selectedTable) {
        return `
            <h3 class="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2 flex items-center gap-2">
                <svg class="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                تعديل الطاولة T${selectedTable.TableNumber}
            </h3>
            
            <div class="mb-4">
                <label class="block text-xs text-gray-400 mb-1.5 font-bold">رقم الطاولة:</label>
                <div class="flex gap-2">
                    <input type="number" id="edit-table-number" min="1" value="${selectedTable.TableNumber}" class="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-brand outline-none transition font-bold font-mono">
                    <button onclick="window.updateTableNumber()" class="bg-gray-700 hover:bg-brand hover:text-black text-white px-4 rounded-lg font-bold transition text-sm">تحديث</button>
                </div>
            </div>

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
        
        ${(STATE.copiedTables && STATE.copiedTables.length > 0) ? `
        <button onclick="window.pasteCopiedTables()" class="w-full bg-gray-700/50 hover:bg-gray-600 border border-gray-600 text-white font-bold py-3 rounded-xl transition shadow-md mt-3 flex items-center justify-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
            لصق (${STATE.copiedTables.length}) طاولات تم نسخها
        </button>` : ''}
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
    if (!STATE.selectedTableIds) STATE.selectedTableIds = [];
    if (!window._isCtrlPressed) {
        STATE.selectedTableIds = [String(id)];
        STATE.selectedTableId = id;
    } else {
        if (STATE.selectedTableIds.includes(String(id))) {
            STATE.selectedTableIds = STATE.selectedTableIds.filter(x => x !== String(id));
        } else {
            STATE.selectedTableIds.push(String(id));
        }
        STATE.selectedTableId = STATE.selectedTableIds.length === 1 ? STATE.selectedTableIds[0] : null;
    }

    document.querySelectorAll('.table-element').forEach(el => {
        if (STATE.selectedTableIds.includes(String(el.getAttribute('data-id')))) {
            el.classList.add('selected-for-edit');
        } else {
            el.classList.remove('selected-for-edit');
        }
    });

    const toolsPanel = document.getElementById('rooms-tools-panel');
    if (toolsPanel) {
        toolsPanel.innerHTML = window.renderTableTools();
    }
};

window.deselectTable = function () {
    STATE.selectedTableId = null;
    STATE.selectedTableIds = [];

    document.querySelectorAll('.table-element').forEach(el => {
        el.classList.remove('selected-for-edit');
    });

    const toolsPanel = document.getElementById('rooms-tools-panel');
    if (toolsPanel) {
        toolsPanel.innerHTML = window.renderTableTools();
        window.updateTableOptions();
    }
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

window.updateTableNumber = async function () {
    const input = document.getElementById('edit-table-number');
    if (!input || !STATE.selectedTableId) return;

    const newNum = parseInt(input.value, 10);
    if (isNaN(newNum) || newNum < 1) {
        window.showToast("رقم الطاولة غير صالح", "error");
        return;
    }

    const tableIndex = STATE.tableMapData.findIndex(t => t.id == STATE.selectedTableId);
    if (tableIndex === -1) return;

    const table = STATE.tableMapData[tableIndex];

    const exists = STATE.tableMapData.find(t => t.TableNumber == newNum && t.Room === table.Room && t.id != STATE.selectedTableId);
    if (exists) {
        window.showToast(`الطاولة رقم ${newNum} موجودة مسبقاً في قاعة ${table.Room}`, "error");
        return;
    }

    try {
        const res = await fetch(`https://baserow.vidsai.site/api/database/rows/table/${TABLEMAP_TABLE_ID}/${STATE.selectedTableId}/?user_field_names=true`, {
            method: 'PATCH',
            headers: { "Authorization": `Token ${BASEROW_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify({ "TableNumber": newNum })
        });

        if (!res.ok) throw new Error("Failed to update table number");

        STATE.tableMapData[tableIndex].TableNumber = newNum;
        window.showToast("تم تحديث رقم الطاولة بنجاح", "success");
        window.renderSettingsRooms();
    } catch (err) {
        console.error(err);
        window.showToast("حدث خطأ أثناء تحديث رقم الطاولة", "error");
    }
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
        if (!cleanName) return;

        const rooms = [...new Set(STATE.tableMapData.map(t => t.Room).filter(Boolean))];
        if (rooms.includes(cleanName) || (STATE.sessionRooms && STATE.sessionRooms.includes(cleanName))) {
            window.showToast("هذه القاعة موجودة مسبقاً", "error");
            return;
        }

        if (!STATE.sessionRooms) STATE.sessionRooms = [];
        STATE.sessionRooms.push(cleanName);

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

window.saveTableMap = async function () {
    clearTimeout(window._saveScaleTimeout);
    clearTimeout(window._saveRotationTimeout);

    const currentTables = STATE.tableMapData.filter(t => t.Room === STATE.currentRoom);
    if (currentTables.length === 0) {
        window.showToast("لا توجد طاولات لحفظها في هذه القاعة", "info");
        return;
    }

    // Show loading state on the button
    const saveBtn = document.querySelector('button[onclick="window.saveTableMap()"]');
    const originalContent = saveBtn ? saveBtn.innerHTML : "";
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = `<span class="animate-spin mr-2">⏳</span> جاري الحفظ...`;
    }

    let successCount = 0;

    try {
        for (const t of currentTables) {
            // Ensure values are integers for maximum database compatibility
            const cleanX = Math.round(parseFloat(t.PosX));
            const cleanY = Math.round(parseFloat(t.PosY));
            const cleanScale = parseFloat(t.Scale) || 1.0;
            const cleanRot = parseInt(t.Rotation) || 0;

            const resp = await fetch(`https://baserow.vidsai.site/api/database/rows/table/${TABLEMAP_TABLE_ID}/${t.id}/?user_field_names=true`, {
                method: 'PATCH',
                headers: { "Authorization": `Token ${BASEROW_TOKEN}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    "PosX": cleanX,
                    "PosY": cleanY,
                    "Scale": cleanScale,
                    "Rotation": cleanRot
                })
            });
            if (resp.ok) successCount++;
        }

        window.showToast(`تم حفظ ${successCount} طاولة بنجاح ✓`, "success");
        // Force refresh local data to be sure we are synced with server
        STATE.tableMapData = [];
        await window.renderSettingsRooms();
    } catch (e) {
        console.error("Save failure:", e);
        window.showToast("حدث خطأ أثناء الاتصال بالسيرفر", "error");
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalContent;
        }
    }
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
            if (STATE.sessionRooms) {
                STATE.sessionRooms = STATE.sessionRooms.filter(sr => sr !== STATE.currentRoom);
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

    const exists = STATE.tableMapData.find(t => t.TableNumber == num && t.Room === room);
    if (exists) {
        window.showToast(`الطاولة رقم ${num} موجودة مسبقاً في قاعة ${exists.Room}`, "error");
        return;
    }

    const existingTablesInRoom = STATE.tableMapData.filter(t => t.Room === room).length;
    // Offset each table so they don't stack directly on top of each other
    const offsetX = 30 + (existingTablesInRoom * 5) % 40;
    const offsetY = 30 + (existingTablesInRoom * 5) % 40;

    const payload = {
        "Room": room,
        "TableNumber": num,
        "Shape": shapeId,
        "Chairs": parseInt(chairs),
        "PosX": offsetX,
        "PosY": offsetY,
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

    // Starting lasso selection
    if (!target) {
        if (e.target.closest('#floor-canvas') || e.target.id === 'floor-canvas') {
            if (e.type === 'touchstart') e.preventDefault();
            STATE.isLassoing = true;
            STATE.lassoStart = { x: (e.type === 'touchstart') ? e.touches[0].clientX : e.clientX, y: (e.type === 'touchstart') ? e.touches[0].clientY : e.clientY };
            STATE.selectedTableId = null;
            STATE.selectedTableIds = [];

            let existingBox = document.getElementById('lasso-box');
            if (existingBox) existingBox.remove();

            const box = document.createElement('div');
            box.id = 'lasso-box';
            box.style.position = 'fixed';
            box.style.border = '2px dashed #00b894';
            box.style.backgroundColor = 'rgba(0, 184, 148, 0.15)';
            box.style.zIndex = '9999';
            box.style.left = STATE.lassoStart.x + 'px';
            box.style.top = STATE.lassoStart.y + 'px';
            box.style.width = '0px';
            box.style.height = '0px';
            box.style.pointerEvents = 'none';
            document.body.appendChild(box);

            window.deselectTable();
        }
        return;
    }

    if (e.target.closest('.table-delete-btn')) return;

    if (e.type === 'touchstart') e.preventDefault();

    // Multi-select dragging setup
    if (!STATE.selectedTableIds) STATE.selectedTableIds = [];
    const targetId = target.getAttribute('data-id');

    // If dragging an unselected item, temporarily make it the only drag target, but if it is selected, drag all selected
    let dragIds = [targetId];
    if (STATE.selectedTableIds.includes(targetId)) {
        dragIds = STATE.selectedTableIds;
    }

    STATE.isDragging = true;
    STATE.dragTarget = target;
    STATE.dragOffsets = {};
    STATE.wasDragging = false; // Resets drag flag

    const canvas = document.getElementById('floor-canvas');
    const canvasRect = canvas.getBoundingClientRect();

    let clientX = (e.type === 'touchstart') ? e.touches[0].clientX : e.clientX;
    let clientY = (e.type === 'touchstart') ? e.touches[0].clientY : e.clientY;

    dragIds.forEach(id => {
        const el = document.querySelector(`.table-element[data-id="${id}"]`);
        if (el) {
            const currentLeftPct = parseFloat(el.style.left) || 0;
            const currentTopPct = parseFloat(el.style.top) || 0;
            const currentLeftPx = (currentLeftPct / 100) * canvasRect.width;
            const currentTopPx = (currentTopPct / 100) * canvasRect.height;
            const mouseXInCanvas = clientX - canvasRect.left;
            const mouseYInCanvas = clientY - canvasRect.top;

            STATE.dragOffsets[id] = {
                x: mouseXInCanvas - currentLeftPx,
                y: mouseYInCanvas - currentTopPx
            };
            el.style.zIndex = 1000;
        }
    });
};

window.handleDragMove = function (e) {
    if (e.type === 'touchmove') e.preventDefault();
    let clientX = (e.type === 'touchmove') ? e.touches[0].clientX : e.clientX;
    let clientY = (e.type === 'touchmove') ? e.touches[0].clientY : e.clientY;

    // Lasso drawing and bounding box checking
    if (STATE.isLassoing) {
        const box = document.getElementById('lasso-box');
        if (!box) return;

        const left = Math.min(clientX, STATE.lassoStart.x);
        const top = Math.min(clientY, STATE.lassoStart.y);
        const width = Math.abs(clientX - STATE.lassoStart.x);
        const height = Math.abs(clientY - STATE.lassoStart.y);

        box.style.left = left + 'px';
        box.style.top = top + 'px';
        box.style.width = width + 'px';
        box.style.height = height + 'px';

        const boxRect = box.getBoundingClientRect();
        STATE.selectedTableIds = [];

        document.querySelectorAll('.table-element').forEach(el => {
            const rect = el.getBoundingClientRect();
            if (!(rect.right < boxRect.left || rect.left > boxRect.right || rect.bottom < boxRect.top || rect.top > boxRect.bottom)) {
                el.classList.add('selected-for-edit');
                STATE.selectedTableIds.push(el.getAttribute('data-id'));
            } else {
                el.classList.remove('selected-for-edit');
            }
        });

        STATE.selectedTableId = STATE.selectedTableIds.length === 1 ? STATE.selectedTableIds[0] : null;

        const toolsPanel = document.getElementById('rooms-tools-panel');
        if (toolsPanel) toolsPanel.innerHTML = window.renderTableTools();
        return;
    }

    if (!STATE.isDragging || !STATE.dragTarget) return;

    const canvas = document.getElementById('floor-canvas');
    const canvasRect = canvas.getBoundingClientRect();

    let mouseXInCanvas = clientX - canvasRect.left;
    let mouseYInCanvas = clientY - canvasRect.top;

    // Move all dragged tables
    let dragIds = STATE.dragOffsets ? Object.keys(STATE.dragOffsets) : [];
    dragIds.forEach(id => {
        const el = document.querySelector(`.table-element[data-id="${id}"]`);
        if (el && STATE.dragOffsets[id]) {
            let rawX = mouseXInCanvas - STATE.dragOffsets[id].x;
            let rawY = mouseYInCanvas - STATE.dragOffsets[id].y;

            el.style.left = `${(rawX / canvasRect.width) * 100}%`;
            el.style.top = `${(rawY / canvasRect.height) * 100}%`;
        }
    });
};

window.handleDragEnd = async function (e) {
    if (STATE.isLassoing) {
        STATE.isLassoing = false;
        STATE.wasLassoing = true;
        setTimeout(() => STATE.wasLassoing = false, 100);

        const box = document.getElementById('lasso-box');
        if (box) box.remove();
        return;
    }

    if (!STATE.isDragging || !STATE.dragTarget) return;

    STATE.isDragging = false;
    STATE.dragTarget = null;

    const canvas = document.getElementById('floor-canvas');
    if (!canvas) return;
    const canvasRect = canvas.getBoundingClientRect();

    // Snap and save multiple targets
    let dragIds = STATE.dragOffsets ? Object.keys(STATE.dragOffsets) : [];
    if (dragIds.length === 0 && target) dragIds = [target.getAttribute('data-id')];

    dragIds.forEach(id => {
        const el = document.querySelector(`.table-element[data-id="${id}"]`);
        if (el) {
            el.style.zIndex = "";
            const svg = el.querySelector('svg') || el;
            const targetRect = svg.getBoundingClientRect();

            const elWidthPct = (targetRect.width / canvasRect.width) * 100;
            const elHeightPct = (targetRect.height / canvasRect.height) * 100;

            let currentXPct = parseFloat(el.style.left) || 0;
            let currentYPct = parseFloat(el.style.top) || 0;

            const finalX = Math.round(Math.max(0, Math.min(100 - elWidthPct, currentXPct)));
            const finalY = Math.round(Math.max(0, Math.min(100 - elHeightPct, currentYPct)));

            const tableIndex = STATE.tableMapData.findIndex(t => t.id == id);
            if (tableIndex > -1) {
                STATE.tableMapData[tableIndex].PosX = finalX;
                STATE.tableMapData[tableIndex].PosY = finalY;

                el.style.left = finalX + '%';
                el.style.top = finalY + '%';

                fetch(`https://baserow.vidsai.site/api/database/rows/table/${TABLEMAP_TABLE_ID}/${id}/?user_field_names=true`, {
                    method: 'PATCH',
                    headers: { "Authorization": `Token ${BASEROW_TOKEN}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ "PosX": finalX, "PosY": finalY })
                }).catch(() => { });
            }
        }
    });
};

window.deleteSelectedTables = async function () {
    if (!STATE.selectedTableIds || STATE.selectedTableIds.length === 0) return;

    window.showDeleteConfirm(
        "حذف الطاولات المحددة؟",
        `سيتم حذف ${STATE.selectedTableIds.length} طاولات نهائياً! هل أنت متأكد؟`,
        async () => {
            window.showToast("جاري الحذف...", "success");
            try {
                for (const id of STATE.selectedTableIds) {
                    await fetch(`https://baserow.vidsai.site/api/database/rows/table/${TABLEMAP_TABLE_ID}/${id}/`, {
                        method: 'DELETE',
                        headers: { "Authorization": `Token ${BASEROW_TOKEN}` }
                    });
                }
                STATE.tableMapData = STATE.tableMapData.filter(t => !STATE.selectedTableIds.includes(String(t.id)));
                STATE.selectedTableIds = [];
                STATE.selectedTableId = null;
                window.showToast("تم الحذف بنجاح", "success");
                window.renderSettingsRooms();
            } catch (e) {
                console.error(e);
                window.showToast("حدث خطأ أثناء حذف الطاولات", "error");
            }
        }
    );
};

window.copySelectedTables = function () {
    if (!STATE.selectedTableIds || STATE.selectedTableIds.length === 0) return;
    
    STATE.copiedTables = STATE.tableMapData.filter(t => STATE.selectedTableIds.includes(String(t.id)));
    window.showToast(`تم نسخ ${STATE.copiedTables.length} طاولات`, "success");
};

window.pasteCopiedTables = async function () {
    if (!STATE.copiedTables || STATE.copiedTables.length === 0) {
        window.showToast("لا يوجد شيء للصقه", "info");
        return;
    }

    const room = STATE.currentRoom;
    if (!room) return;

    window.showToast("جاري لصق الطاولات...", "info");
    
    let addedCount = 0;
    for (const tableToCopy of STATE.copiedTables) {
        // Generate a new unique TableNumber for the room
        let maxTableNum = 0;
        STATE.tableMapData.forEach(t => {
            if (t.Room === room) {
                const num = parseInt(t.TableNumber);
                if (!isNaN(num) && num > maxTableNum) {
                    maxTableNum = num;
                }
            }
        });
        const newTableNum = maxTableNum + 1;

        // Offset position slightly (+5%) to not overlap exactly
        let newX = Math.min(95, parseFloat(tableToCopy.PosX) + 5);
        let newY = Math.min(95, parseFloat(tableToCopy.PosY) + 5);

        const shapeVal = (typeof tableToCopy.Shape === 'object' && tableToCopy.Shape) ? tableToCopy.Shape.value : (tableToCopy.Shape || 'round-4');

        const payload = {
            "Room": room,
            "TableNumber": newTableNum,
            "Shape": shapeVal,
            "Chairs": parseInt(tableToCopy.Chairs) || 4,
            "PosX": newX,
            "PosY": newY,
            "Scale": parseFloat(tableToCopy.Scale) || 1.0,
            "Rotation": parseInt(tableToCopy.Rotation) || 0
        };

        try {
            const res = await fetch(`https://baserow.vidsai.site/api/database/rows/table/${TABLEMAP_TABLE_ID}/?user_field_names=true`, {
                method: 'POST',
                headers: { "Authorization": `Token ${BASEROW_TOKEN}`, "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                STATE.tableMapData.push(data);
                addedCount++;
            }
        } catch (e) {
            console.error("Paste error", e);
        }
    }

    if (addedCount > 0) {
        window.showToast(`تم لصق ${addedCount} طاولات بنجاح`, "success");
        window.renderSettingsRooms();
    } else {
        window.showToast("حدث خطأ أثناء اللصق", "error");
    }
};

// Global keydown listeners for shortcuts
document.addEventListener('keydown', function(e) {
    if (STATE.currentActiveView !== 'settings_rooms') return;
    
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
        return;
    }

    if (e.key === 'Delete' || e.key === 'Backspace') {
        if (STATE.selectedTableIds && STATE.selectedTableIds.length > 0) {
            e.preventDefault();
            window.deleteSelectedTables();
        }
    } else if (e.ctrlKey && (e.code === 'KeyC' || e.key === 'c' || e.key === 'C' || e.key === 'ؤ')) {
        if (STATE.selectedTableIds && STATE.selectedTableIds.length > 0) {
            e.preventDefault();
            window.copySelectedTables();
        }
    } else if (e.ctrlKey && (e.code === 'KeyV' || e.key === 'v' || e.key === 'V' || e.key === 'ر')) {
        if (STATE.copiedTables && STATE.copiedTables.length > 0) {
            e.preventDefault();
            window.pasteCopiedTables();
        }
    }
});
