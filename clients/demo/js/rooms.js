// clients/demo/js/rooms.js

window.generateTableSVG = function (shape, chairColor = "#22c55e") {
    const tableColor = "#374151";
    const strokeColor = "#4b5563";
    let svg = "";

    switch (shape) {
        case "round-2":
            svg = `
            <svg width="70" height="70" viewBox="0 0 70 70">
                <ellipse cx="35" cy="8" rx="10" ry="6" fill="${chairColor}"/>
                <ellipse cx="35" cy="62" rx="10" ry="6" fill="${chairColor}"/>
                <circle cx="35" cy="35" r="22" fill="${tableColor}" stroke="${strokeColor}" stroke-width="2"/>
            </svg>`;
            break;
        case "round-4":
            svg = `
            <svg width="90" height="90" viewBox="0 0 90 90">
                <ellipse cx="45" cy="8" rx="12" ry="8" fill="${chairColor}"/>
                <ellipse cx="45" cy="82" rx="12" ry="8" fill="${chairColor}"/>
                <ellipse cx="82" cy="45" rx="8" ry="12" fill="${chairColor}"/>
                <ellipse cx="8" cy="45" rx="8" ry="12" fill="${chairColor}"/>
                <circle cx="45" cy="45" r="28" fill="${tableColor}" stroke="${strokeColor}" stroke-width="2"/>
            </svg>`;
            break;
        case "square-4":
            svg = `
            <svg width="80" height="80" viewBox="0 0 80 80">
                <ellipse cx="40" cy="8" rx="12" ry="6" fill="${chairColor}"/>
                <ellipse cx="40" cy="72" rx="12" ry="6" fill="${chairColor}"/>
                <ellipse cx="72" cy="40" rx="6" ry="12" fill="${chairColor}"/>
                <ellipse cx="8" cy="40" rx="6" ry="12" fill="${chairColor}"/>
                <rect x="18" y="18" width="44" height="44" rx="6" fill="${tableColor}" stroke="${strokeColor}" stroke-width="2"/>
            </svg>`;
            break;
        case "rect-6":
            svg = `
            <svg width="140" height="80" viewBox="0 0 140 80">
                <!-- Top chairs -->
                <ellipse cx="35" cy="8" rx="12" ry="6" fill="${chairColor}"/>
                <ellipse cx="70" cy="8" rx="12" ry="6" fill="${chairColor}"/>
                <ellipse cx="105" cy="8" rx="12" ry="6" fill="${chairColor}"/>
                <!-- Bottom chairs -->
                <ellipse cx="35" cy="72" rx="12" ry="6" fill="${chairColor}"/>
                <ellipse cx="70" cy="72" rx="12" ry="6" fill="${chairColor}"/>
                <ellipse cx="105" cy="72" rx="12" ry="6" fill="${chairColor}"/>
                <!-- Table -->
                <rect x="15" y="18" width="110" height="44" rx="6" fill="${tableColor}" stroke="${strokeColor}" stroke-width="2"/>
            </svg>`;
            break;
        case "rect-8":
            svg = `
            <svg width="180" height="80" viewBox="0 0 180 80">
                <!-- Top chairs -->
                <ellipse cx="35" cy="8" rx="12" ry="6" fill="${chairColor}"/>
                <ellipse cx="70" cy="8" rx="12" ry="6" fill="${chairColor}"/>
                <ellipse cx="105" cy="8" rx="12" ry="6" fill="${chairColor}"/>
                <ellipse cx="140" cy="8" rx="12" ry="6" fill="${chairColor}"/>
                <!-- Bottom chairs -->
                <ellipse cx="35" cy="72" rx="12" ry="6" fill="${chairColor}"/>
                <ellipse cx="70" cy="72" rx="12" ry="6" fill="${chairColor}"/>
                <ellipse cx="105" cy="72" rx="12" ry="6" fill="${chairColor}"/>
                <ellipse cx="140" cy="72" rx="12" ry="6" fill="${chairColor}"/>
                <!-- Table -->
                <rect x="15" y="18" width="150" height="44" rx="6" fill="${tableColor}" stroke="${strokeColor}" stroke-width="2"/>
            </svg>`;
            break;
        case "bar-1":
            svg = `
            <svg width="40" height="40" viewBox="0 0 40 40">
                <circle cx="20" cy="10" r="6" fill="${chairColor}"/>
                <rect x="14" y="20" width="12" height="15" rx="3" fill="${tableColor}" stroke="${strokeColor}" stroke-width="2"/>
            </svg>`;
            break;
        default:
            svg = `<svg width="70" height="70"><circle cx="35" cy="35" r="25" fill="#374151" stroke="#4b5563"/></svg>`;
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
        if (!STATE.currentRoom && rooms.length > 0) {
            STATE.currentRoom = rooms[0];
        }
        if (!STATE.selectedShape) {
            STATE.selectedShape = 'round-4';
        }

        if (rooms.length === 0) {
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

        const shapes = [
            { id: 'round-2', name: '⚪ 2 أفراد' },
            { id: 'round-4', name: '⚪ 4 أفراد' },
            { id: 'square-4', name: '▢ 4 أفراد' },
            { id: 'rect-6', name: '▬ 6 أفراد' },
            { id: 'rect-8', name: '▬ 8 أفراد' },
            { id: 'bar-1', name: '• بار' }
        ];

        let shapesHtml = shapes.map(s => `
            <div onclick="window.selectShape('${s.id}')" class="shape-picker-card ${STATE.selectedShape === s.id ? 'selected' : ''}">
                <div class="h-10 flex items-center justify-center transform scale-75">${window.generateTableSVG(s.id)}</div>
                <span class="text-xs text-gray-300 font-bold whitespace-nowrap">${s.name}</span>
            </div>
        `).join('');

        let floorHtml = '';
        const currentTables = STATE.tableMapData.filter(t => t.Room === STATE.currentRoom);
        currentTables.forEach(t => {
            const shapeStr = (typeof t.Shape === 'object' && t.Shape) ? t.Shape.value : (t.Shape || 'round-4');
            const posX = t.PosX || 50;
            const posY = t.PosY || 50;
            const chairColor = "#22c55e"; // Default green

            floorHtml += `
                <div class="table-element hover:z-50" data-id="${t.id}" style="left: ${posX}px; top: ${posY}px;">
                    ${window.generateTableSVG(shapeStr, chairColor)}
                    <span class="table-number-label">T${t.TableNumber}</span>
                    <div class="table-delete-btn" onclick="window.deleteTable('${t.id}')">✕</div>
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
                    <div class="lg:col-span-1 bg-gray-800 border border-gray-700 rounded-2xl p-5 shadow-xl h-fit sticky top-24">
                        <h3 class="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2">➕ إضافة طاولة</h3>
                        
                        <div class="mb-5">
                            <label class="block text-sm text-gray-400 mb-2">اختر الشكل:</label>
                            <div class="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                ${shapesHtml}
                            </div>
                        </div>
                        
                        <div class="mb-5">
                            <label class="block text-sm text-gray-400 mb-2">رقم الطاولة:</label>
                            <input type="number" id="new-table-number" min="1" class="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand outline-none transition font-bold font-mono">
                        </div>
                        
                        <button onclick="window.addTableToRoom()" class="w-full bg-brand hover:bg-brand-dark text-black font-bold py-3 rounded-xl transition shadow-md flex items-center justify-center gap-2">
                            <span>إضافة للقاعة</span>
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                        </button>
                        
                        <div class="mt-6 p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
                            <p class="text-xs text-brand font-bold mb-1">💡 تلميح:</p>
                            <p class="text-xs text-gray-400 leading-relaxed">قم بسحب الطاولات في المساحة المجاورة لتنظيم القاعة. يتم حفظ المواقع تلقائياً.</p>
                        </div>
                    </div>
                    
                    <!-- Floor Map -->
                    <div class="lg:col-span-3">
                        <h3 class="text-lg font-bold text-white mb-4 flex justify-between items-end">
                            <span>أرضية ${STATE.currentRoom}</span>
                            <span class="text-sm font-normal text-gray-400 border border-gray-700 rounded-full px-3 py-1 bg-gray-800 shadow-inner">${currentTables.length} طاولات</span>
                        </h3>
                        <div id="floor-canvas" class="floor-canvas shadow-inner">
                            ${floorHtml}
                        </div>
                    </div>
                </div>
            </div>
        `;

        dynamicContent.innerHTML = html;
        window.initDragAndDrop();

    } catch (e) {
        console.error("Rooms Settings Error:", e);
        dynamicContent.innerHTML = `<div class="p-6 text-center text-red-500 bg-red-900/20 border border-red-800 rounded-lg">فشل تحميل إعدادات القاعات</div>`;
    }
};

window.switchRoom = function (r) {
    if (STATE.currentRoom === r) return;
    STATE.currentRoom = r;
    window.renderSettingsRooms();
};

window.selectShape = function (shape) {
    STATE.selectedShape = shape;
    window.renderSettingsRooms();
};

window.addRoom = function () {
    const name = prompt("اسم القاعة الجديدة:");
    if (!name || name.trim() === '') return;
    const cleanName = name.trim();
    const rooms = [...new Set(STATE.tableMapData.map(t => t.Room).filter(Boolean))];
    if (rooms.includes(cleanName)) {
        window.showToast("هذه القاعة موجودة مسبقاً", "error");
        return;
    }
    STATE.currentRoom = cleanName;
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
    const shape = STATE.selectedShape;
    const room = STATE.currentRoom;

    if (!numInput || !numInput.value || !shape || !room) {
        window.showToast("الرجاء تحديد شکل ورقم للطاولة", "error");
        return;
    }
    const num = parseInt(numInput.value, 10);

    const exists = STATE.tableMapData.find(t => t.TableNumber === num);
    if (exists) {
        window.showToast(`الطاولة رقم ${num} موجودة مسبقاً في قاعة ${exists.Room}`, "error");
        return;
    }

    const chairsMap = { "round-2": 2, "round-4": 4, "square-4": 4, "rect-6": 6, "rect-8": 8, "bar-1": 1 };
    const chairs = chairsMap[shape] || 4;

    const payload = {
        "Room": room,
        "TableNumber": num,
        "Shape": shape,
        "Chairs": chairs,
        "PosX": 200,
        "PosY": 200
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

window.deleteTable = async function (rowId) {
    if (!confirm("هل تريد حذف هذه الطاولة؟")) return;

    try {
        const res = await fetch(`https://baserow.vidsai.site/api/database/rows/table/${TABLEMAP_TABLE_ID}/${rowId}/`, {
            method: 'DELETE',
            headers: { "Authorization": `Token ${BASEROW_TOKEN}` }
        });
        if (!res.ok) throw new Error("Failed to delete table");

        STATE.tableMapData = STATE.tableMapData.filter(t => t.id !== parseInt(rowId) && t.id !== String(rowId));
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

    const newCanvas = canvas.cloneNode(true);
    canvas.parentNode.replaceChild(newCanvas, canvas);

    newCanvas.addEventListener('mousedown', window.handleDragStart);
    document.addEventListener('mousemove', window.handleDragMove);
    document.addEventListener('mouseup', window.handleDragEnd);

    newCanvas.addEventListener('touchstart', window.handleDragStart, { passive: false });
    document.addEventListener('touchmove', window.handleDragMove, { passive: false });
    document.addEventListener('touchend', window.handleDragEnd);
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

    let clientX = e.clientX;
    let clientY = e.clientY;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    }

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

    let clientX = e.clientX;
    let clientY = e.clientY;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    }

    let rawX = clientX - canvasRect.left - STATE.dragOffset.x;
    let rawY = clientY - canvasRect.top - STATE.dragOffset.y;

    const targetWidth = STATE.dragTarget.offsetWidth;
    const targetHeight = STATE.dragTarget.offsetHeight;

    const minX = 0;
    const minY = 0;
    const maxX = canvasRect.width - targetWidth;
    const maxY = canvasRect.height - targetHeight;

    let finalX = Math.max(minX, Math.min(rawX, maxX));
    let finalY = Math.max(minY, Math.min(rawY, maxY));

    STATE.dragTarget.style.left = `${finalX}px`;
    STATE.dragTarget.style.top = `${finalY}px`;
};

window._saveTableTimeout = null;

window.handleDragEnd = async function (e) {
    if (!STATE.isDragging || !STATE.dragTarget) return;

    const target = STATE.dragTarget;
    STATE.isDragging = false;
    STATE.dragTarget = null;
    target.style.zIndex = "";

    const rowId = target.getAttribute('data-id');
    const finalX = parseInt(target.style.left, 10) || 0;
    const finalY = parseInt(target.style.top, 10) || 0;

    const tableIndex = STATE.tableMapData.findIndex(t => t.id === parseInt(rowId) || t.id === String(rowId));
    if (tableIndex > -1) {
        STATE.tableMapData[tableIndex].PosX = finalX;
        STATE.tableMapData[tableIndex].PosY = finalY;
    }

    clearTimeout(window._saveTableTimeout);
    window._saveTableTimeout = setTimeout(async () => {
        try {
            await fetch(`https://baserow.vidsai.site/api/database/rows/table/${TABLEMAP_TABLE_ID}/${rowId}/?user_field_names=true`, {
                method: 'PATCH',
                headers: { "Authorization": `Token ${BASEROW_TOKEN}`, "Content-Type": "application/json" },
                body: JSON.stringify({ "PosX": finalX, "PosY": finalY })
            });
            window.showToast("تم حفظ الموقع", "success");
        } catch (err) {
            console.error("Failed to save position", err);
        }
    }, 500);
};
