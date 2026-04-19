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
        // Always reload fresh data from Baserow
        const tableRes = await fetch(`https://baserow.vidsai.site/api/database/rows/table/${TABLEMAP_TABLE_ID}/?user_field_names=true&size=200`, {
            headers: { "Authorization": `Token ${BASEROW_TOKEN}` }
        });
        if (tableRes.ok) {
            const mapData = await tableRes.json();
            STATE.tableMapData = mapData.results || [];
        }

        let rooms = [...new Set(STATE.tableMapData.map(t => t.Room).filter(Boolean))].sort();
        if (!STATE.currentRoom && rooms.length > 0) {
            STATE.currentRoom = rooms[0];
        }

        const orders = STATE.lastFetchedOrders || [];
        const activeCalls = STATE.activeCalls || [];
        const sysCurrency = localStorage.getItem('system_currency') || 'DA';

        const topBarHTML = `
            <div class="flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-sm mb-6">
                <div class="flex items-center gap-3">
                    <span class="live-indicator" title="تحديث مباشر"></span>
                    <h3 class="text-white font-bold text-xl">مراقبة الطاولات والطلبات</h3>
                </div>
                <div class="flex gap-2 w-full md:w-auto">
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

        let floorHtml = '';
        const currentTables = STATE.tableMapData.filter(t => t.Room === STATE.currentRoom);

        currentTables.forEach(t => {
            const numStr = String(t.TableNumber);
            const isCalling = activeCalls.some(c => String(c) === numStr);

            const tableOrders = orders.filter(o => o.Table && String(o.Table).replace(/[^0-9]/g, '') === numStr);
            let hasActiveOrder = false;
            let totalAmount = 0;
            let orderForTable = null;

            tableOrders.forEach(o => {
                let st = (typeof o.Status === 'object' && o.Status) ? o.Status.value : o.Status;
                st = String(st || '').trim();
                
                // قائمة الحالات التي تعني أن الطلب "منتهي" أو "غير نشط"
                const inactiveStatuses = ['مدفوع', 'ملغى', 'Payé', 'Annulé', 'Paid', 'Cancelled'];
                
                if (!inactiveStatuses.includes(st)) {
                    hasActiveOrder = true;
                    orderForTable = o;
                    totalAmount += parseFloat(String(o.total || o.Total || o.price || o.Price || 0).replace(/[^0-9.]/g, '')) || 0;
                }
            });

            let statusClass = "table-status-free";
            let chairColor = "#22c55e"; // Default Green (Free/Paid)

            if (isCalling) {
                statusClass = "table-status-calling";
                chairColor = "#ef4444"; // Red for Calling
            } else if (hasActiveOrder) {
                statusClass = "table-status-occupied";
                
                // Color Logic based on Order Status
                let isReady = false;
                let isNewOrPrep = false;
                
                tableOrders.forEach(o => {
                    const st = (typeof o.Status === 'object' && o.Status) ? o.Status.value : o.Status;
                    if (st === 'جاهز') isReady = true;
                    else if (st === 'جديد' || st === 'قيد التحضير') isNewOrPrep = true;
                });

                if (isNewOrPrep) {
                    chairColor = "#ef4444"; // Red (Not ready yet)
                } else if (isReady) {
                    chairColor = "#eab308"; // Yellow (Ready)
                } else {
                    chairColor = "#f59e0b"; // Fallback Orange
                }
            }

            const shapeStr = (typeof t.Shape === 'object' && t.Shape) ? t.Shape.value : (t.Shape || 'round-4');
            // Positions are stored as percentages (0-100)
            let leftPct = parseFloat(t.PosX) || 10;
            let topPct = parseFloat(t.PosY) || 10;

            const tScale = t.Scale || 1.0;
            const tRot = t.Rotation || 0;

            let orderIdArg = 'null';
            if (orderForTable && orderForTable.id) {
                orderIdArg = `'${orderForTable.id}'`;
            }

            floorHtml += `
                <div class="table-element ${statusClass}" 
                     style="left: ${leftPct}%; top: ${topPct}%; cursor: pointer; pointer-events: auto;" 
                     onclick="window.handleTableMapClick('${numStr}', ${isCalling}, ${hasActiveOrder}, ${orderIdArg})">
                    ${window.generateTableSVG ? window.generateTableSVG(shapeStr, chairColor, tScale, tRot) : '<svg width="70" height="70"><circle cx="35" cy="35" r="22" fill="#374151"/></svg>'}
                    <span class="table-number-label">T${t.TableNumber}</span>
                    ${isCalling ? `<div class="calling-overlay"><span>⚠️ نداء</span></div>` : ''}
                </div>
            `;
        });

        let Legend = `
        <div class="flex items-center gap-5 text-sm font-bold bg-gray-800 p-4 rounded-xl border border-gray-700 w-fit mx-auto shadow mt-6">
            <div class="flex items-center gap-2"><div class="w-4 h-4 rounded-full bg-green-500"></div> فارغة</div>
            <div class="flex items-center gap-2"><div class="w-4 h-4 rounded-full bg-yellow-500"></div> مشغولة</div>
            <div class="flex items-center gap-2"><div class="w-4 h-4 rounded-full bg-red-500 animate-pulse outline outline-2 outline-offset-1 outline-red-500"></div> نداء طاولة</div>
        </div>
        `;

        const html = `
            ${topBarHTML}
            
            <div class="flex items-center justify-center mb-6 bg-gray-800 p-2 rounded-xl border border-gray-700 overflow-x-auto mx-auto w-fit max-w-full shadow-sm">
                <div class="flex items-center gap-2">
                    ${tabsHtml || '<span class="text-gray-400 text-sm px-4 py-2">لا توجد قاعات مضافة عبر إعدادات القاعات.</span>'}
                </div>
            </div>
            
            <div class="max-w-5xl mx-auto shadow-2xl rounded-3xl p-2 bg-gray-800 border border-gray-700">
                <div class="floor-canvas select-none" style="border:none; cursor: default;">
                    ${floorHtml}
                </div>
            </div>
            
            ${Legend}
        `;

        dynamicContent.innerHTML = html;

    } catch (e) {
        console.error("TableView Error:", e);
        dynamicContent.innerHTML = `<div class="p-8 text-center text-red-400 font-bold bg-red-900/20 border border-red-800 rounded-2xl max-w-lg mx-auto mt-20 shadow-xl">⚠️ فشل تحميل واجهة القاعات.<br><br><span class="text-sm font-normal mt-2 block">تأكد من إعداد الطاولات في شاشة "إعدادات القاعات" وأن اتصالك بالإنترنت مستقر.</span></div>`;
    }
};

window.switchTableRoom = function (r) {
    if (STATE.currentRoom === r) return;
    STATE.currentRoom = r;
    window.renderTableView();
};

window.handleTableMapClick = function (tableNumber, isCalling, hasActiveOrder, orderId) {
    // Handle calling tables - resolve the call
    if (isCalling) {
        window.resolveTableCall(tableNumber);
        return;
    }
    
    // Handle tables with active orders (yellow/red) - open edit modal
    if (hasActiveOrder && orderId && orderId !== 'null' && orderId !== null) {
        if (typeof window.openEditOrderModal === 'function') {
            window.openEditOrderModal(orderId);
        } else {
            window.showToast(`الطاولة ${tableNumber} - لا يمكن فتح الطلب حالياً`, "info");
        }
        return;
    }
    
    // Handle free tables (green) - open new order modal
    if (typeof window.openNewOrderModal === 'function') {
        window.openNewOrderModal('table');
        setTimeout(() => {
            const manualSelect = document.getElementById('manual-table-number');
            if (manualSelect) manualSelect.value = tableNumber;
        }, 300);
    } else {
        window.showToast(`لا يمكنك إنشاء طلب بدون صلاحية الكاشير`, "error");
    }
};