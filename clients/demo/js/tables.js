// =========================================================
// 🔔 Tables Logic (نداءات الطاولات)
// =========================================================

window.renderTableView = async function () {
    const dynamicContent = document.getElementById('dynamic-content');
    if (!dynamicContent) return;

    if (!dynamicContent.innerHTML) {
        dynamicContent.innerHTML = `<div class="flex items-center justify-center p-10"><div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand"></div></div>`;
    }

    try {
        const tableRes = await fetch(`https://baserow.vidsai.site/api/database/rows/table/${TABLEMAP_TABLE_ID}/?user_field_names=true&size=200`, {
            headers: { "Authorization": `Token ${BASEROW_TOKEN}` }
        });
        if (tableRes.ok) {
            const mapData = await tableRes.json();
            STATE.tableMapData = mapData.results || [];
        }

        const freshOrders = await window.fetchOrders(ORDERS_TABLE_ID);
        STATE.lastFetchedOrders = freshOrders || [];

        let rooms = [...new Set(STATE.tableMapData.map(t => t.Room).filter(Boolean))].sort();

        // --- Routing Logic: Waiter Restriction ---
        if (STATE.currentRole === 'waiter' && STATE.assignedRoom) {
            STATE.currentRoom = STATE.assignedRoom;
        }

        if (rooms.length > 0 && (!STATE.currentRoom || !rooms.includes(STATE.currentRoom))) {
            STATE.currentRoom = rooms[0];
        }

        const orders = STATE.lastFetchedOrders;
        const activeCalls = STATE.activeCalls || [];

        const topBarHTML = `
            <div class="flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-sm mb-6">
                <div class="flex items-center gap-3">
                    <span class="live-indicator" title="تحديث مباشر"></span>
                    <h3 class="text-white font-bold text-xl">مراقبة الطاولات والطلبات</h3>
                </div>
                <div class="flex items-center gap-2 w-full md:w-auto">
                    <button onclick="window.renderTableView()" class="bg-gray-700 hover:bg-gray-600 text-white p-2.5 rounded-lg transition shadow flex items-center justify-center" title="تحديث البيانات">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    </button>
                    <button onclick="window.openNewOrderModal('table')" class="flex-1 md:flex-none bg-brand hover:bg-brand-dark text-black font-bold py-2.5 px-6 rounded-lg transition shadow flex items-center justify-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                        لطاولة جديدة
                    </button>
                    <button onclick="window.openNewOrderModal('quick')" class="flex-1 md:flex-none bg-gray-700 hover:bg-gray-600 text-white font-bold py-2.5 px-6 rounded-lg transition shadow flex items-center justify-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        مباشر (سريع)
                    </button>
                </div>
            </div>
        `;

        let tabsHtml = rooms.map(r => `
            <button onclick="window.switchTableRoom('${r}')" class="room-tab ${STATE.currentRoom === r ? 'room-tab-active' : 'room-tab-inactive'} shadow-sm">
                ${r}
            </button>
        `).join('');

        // Hide tabs if restricted to assigned room
        if (STATE.currentRole === 'waiter' && STATE.assignedRoom) {
            tabsHtml = '';
        }

        let floorHtml = '';
        const currentTables = STATE.tableMapData.filter(t => t.Room === STATE.currentRoom);

        currentTables.forEach(t => {
            const numStr = String(t.TableNumber);
            const expectedTableFormat = `الطاولة ${numStr} - ${STATE.currentRoom}`;
            let matchingRawCall = null;
            const isCalling = activeCalls.some(c => {
                const cStr = String(c).trim();
                if (cStr === numStr || cStr === expectedTableFormat) {
                    matchingRawCall = cStr;
                    return true;
                }

                // استخراج رقم الطاولة بمرونة فائقة (يبحث عن الرقم بعد كلمة طاولة أو table أو رقم)
                const tblMatch = cStr.match(/(?:طاولة|الطاولة|table|رقم)[^\d]*(\d+)/i);
                let extractedNum = null;
                if (tblMatch) {
                    extractedNum = tblMatch[1];
                } else if (/^\d+$/.test(cStr)) {
                    extractedNum = cStr;
                }

                if (extractedNum === numStr) {
                    // التحقق من اسم القاعة إذا كان موجوداً في النص
                    if (/(?:قاعة|room|-)/i.test(cStr)) {
                        // التأكد من أن القاعة الحالية المحددة في الداشبورد مذكورة في النص
                        if (cStr.includes(STATE.currentRoom)) {
                            matchingRawCall = cStr;
                            return true;
                        }
                    } else {
                        // النص لا يحتوي على إشارة للقاعة (مثل رقم فقط)، نقبله
                        matchingRawCall = cStr;
                        return true;
                    }
                }
                return false;
            });

            // ========== مطابقة الطلبات بالطاولة ==========
            const tableOrders = orders.filter(o => {
                const tblRaw = String(o.Table || '').trim();
                const rawTime = o['Created at'] || o.Time || o.time || o.created_on || o.CreatedOn || o.Date || '';

                // تجاهل فحص اليوم إذا كان الحقل مفقوداً (نفس منطق KDS)
                if (rawTime && !window.isOrderFromToday(rawTime)) return false;

                // تجاهل الطلبات السريعة تماماً
                if (o.order_type === 'quick' || tblRaw === 'سفري') return false;

                // مطابقة بالتنسيق الموحد "الطاولة X - قاعة Y"
                if (tblRaw === expectedTableFormat) return true;

                // استخراج رقم الطاولة واسم القاعة من النص
                const parsed = tblRaw.match(/^(?:الطاولة|طاولة|Table)\s*(\d+)\s*-\s*(.+)$/i);
                if (parsed) return parsed[1] === numStr && parsed[2].trim() === STATE.currentRoom;

                // إذا كان رقم فقط، نتحقق من حقل Room بشكل صارم
                if (/^\d+$/.test(tblRaw) && tblRaw === numStr) {
                    const r = String(o.Room || o.room || '').trim();
                    return r === STATE.currentRoom; // يجب أن يتطابق - لا نقبل قاعة فارغة
                }
                return false;
            });

            let hasActiveOrder = false;
            let orderForTable = null;
            const activeStatuses = ['جديد', 'قيد التحضير', 'نصف جاهز', 'جاهز', 'مستلم'];

            for (const o of tableOrders) {
                const st = (typeof o.Status === 'object' && o.Status) ? String(o.Status.value || '').trim() : String(o.Status || '').trim();
                if (activeStatuses.includes(st)) {
                    hasActiveOrder = true;
                    orderForTable = o;
                    break;
                }
            }

            let statusClass = "table-status-free";
            let chairColor = "#22c55e"; // أخضر

            if (isCalling) {
                statusClass = "table-status-calling";
                chairColor = "#ef4444";
            } else if (hasActiveOrder) {
                statusClass = "table-status-occupied";
                const orderSt = (typeof orderForTable.Status === 'object' && orderForTable.Status)
                    ? String(orderForTable.Status.value || '').trim()
                    : String(orderForTable.Status || '').trim();

                if (orderSt === 'جاهز') chairColor = "#eab308"; // أصفر
                else if (orderSt === 'نصف جاهز') chairColor = "#fca5a5"; // أحمر بارد
                else chairColor = "#ef4444"; // أحمر
            }

            const shapeStr = (typeof t.Shape === 'object' && t.Shape) ? t.Shape.value : (t.Shape || 'round-4');
            let posX = parseFloat(t.PosX) || 10;
            let posY = parseFloat(t.PosY) || 10;
            let leftPct = (posX > 100) ? Math.round((posX / 1100) * 100) : Math.round(posX);
            let topPct = (posY > 100) ? Math.round((posY / 700) * 100) : Math.round(posY);
            const tScale = t.Scale || 1.0;
            const tRot = t.Rotation || 0;

            // تأكد من تمرير المعرف بشكل صحيح
            const orderIdVal = orderForTable ? orderForTable.id : null;

            floorHtml += `
                <div class="table-element ${statusClass}" 
                     style="left: ${leftPct}%; top: ${topPct}%; cursor: pointer; pointer-events: auto; z-index: 10;" 
                     onclick="window.handleTableMapClick('${numStr}', ${isCalling}, ${hasActiveOrder}, ${orderIdVal}, '${matchingRawCall ? matchingRawCall.replace(/'/g, "\\'") : ''}')">
                    ${window.generateTableSVG ? window.generateTableSVG(shapeStr, chairColor, tScale, tRot) : '<svg width="70" height="70"><circle cx="35" cy="35" r="22" fill="#374151"/></svg>'}
                    <span class="table-number-label">T${numStr}</span>
                    ${isCalling ? `<div class="calling-overlay"><span>⚠️ نداء</span></div>` : ''}
                </div>
            `;
        });

        const Legend = `
        <div class="flex flex-wrap items-center justify-center gap-5 text-xs font-bold bg-gray-800 p-4 rounded-xl border border-gray-700 w-fit mx-auto shadow mt-6">
            <div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-green-500"></div> فارغة</div>
            <div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-red-500"></div> قيد التحضير</div>
            <div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-red-300"></div> نصف جاهزة</div>
            <div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-yellow-500"></div> جاهزة</div>
            <div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-red-500 animate-pulse outline outline-2 outline-offset-1 outline-red-500"></div> نداء نادل</div>
        </div>
        `;

        dynamicContent.innerHTML = `
            ${topBarHTML}
            <div class="flex items-center justify-center mb-6 bg-gray-800 p-2 rounded-xl border border-gray-700 overflow-x-auto mx-auto w-fit max-w-full shadow-sm">
                <div class="flex items-center gap-2">
                    ${tabsHtml || '<span class="text-gray-400 text-sm px-4 py-2">لا توجد قاعات مضافة.</span>'}
                </div>
            </div>
            <div class="max-w-5xl mx-auto shadow-2xl rounded-3xl p-2 bg-gray-800/50 border border-gray-700/50 relative overflow-hidden">
                <div class="floor-canvas" style="min-height: 500px; position: relative;">
                    ${floorHtml}
                </div>
            </div>
            ${Legend}
        `;

    } catch (e) {
        console.error("TableView Error:", e);
        dynamicContent.innerHTML = `<div class="p-8 text-center text-white bg-red-600/20 border border-red-600 rounded-xl">⚠️ خطأ في تحميل الطاولات: ${e.message}</div>`;
    }
};

window.switchTableRoom = function (r) {
    STATE.currentRoom = r;
    window.renderTableView();
};

window.handleTableMapClick = function (tableNumber, isCalling, hasActiveOrder, orderId, matchingRawCall) {
    console.log("Table Clicked:", { tableNumber, isCalling, hasActiveOrder, orderId, matchingRawCall });

    if (isCalling) {
        if (typeof window.resolveTableCall === 'function') {
            window.resolveTableCall(matchingRawCall || tableNumber);
        }
        // Do NOT return here, so that if the table also has an order, the edit modal will still open.
    }

    // إذا كانت الطاولة مشغولة ولديها طلب، نفتح مودال التعديل فوراً

    if (hasActiveOrder && orderId) {
        if (typeof window.openEditOrderModal === 'function') {
            window.openEditOrderModal(orderId);
            return;
        } else {
            console.error("openEditOrderModal function not found!");
        }
    }

    // إذا كانت فارغة، تفتح مودال طلب جديد
    if (typeof window.openNewOrderModal === 'function') {
        window.openNewOrderModal('table', true);
        setTimeout(() => {
            const roomSelect = document.getElementById('manual-room-select');
            const tableSelect = document.getElementById('manual-table-select');

            if (roomSelect && STATE.currentRoom) {
                roomSelect.value = STATE.currentRoom;
                // يجب تحديث قائمة الطاولات أولاً قبل اختيار الطاولة
                if (typeof window.updateTableListByRoom === 'function') {
                    window.updateTableListByRoom();
                }

                if (tableSelect) {
                    const expectedValue = `الطاولة ${tableNumber} - ${STATE.currentRoom}`;
                    tableSelect.value = expectedValue;
                }
            }
        }, 300);
    }
};
