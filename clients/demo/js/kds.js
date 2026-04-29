// =========================================================
// 👨‍🍳 KDS Logic (شاشة المطبخ) - v6.0
// =========================================================

window.setKdsTab = function (tab) {
    STATE.kdsActiveTab = tab;
    window.renderKDS(STATE.latestKdsOrders || []);
};

// === فلتر الأدمين للطباخين ===
window.setKdsAdminFilter = function (filterType, filterValue) {
    STATE.kdsAdminFilter = { type: filterType, value: filterValue };
    window.renderKDS(STATE.latestKdsOrders || []);
};

window.renderKDS = function (orders) {
    if (!STATE.kdsActiveTab) STATE.kdsActiveTab = 'tables';
    let filteredOrders = [...orders];

    filteredOrders = window.calculateDailySequence(filteredOrders);
    filteredOrders = window.processOrderAlerts(filteredOrders);

    const dynamicContent = document.getElementById('dynamic-content');
    if (!dynamicContent) return;

    dynamicContent.innerHTML = '';
    const getStatus = (o) => (typeof o.Status === 'object' && o.Status) ? o.Status.value : o.Status;
    const isAdmin = STATE.currentRole === 'admin';

    // === 1. فلترة الطلبات النشطة فقط (اليوم + حالة صالحة) ===
    const activeOrders = filteredOrders.filter(o => {
        const s = getStatus(o);
        const rawTime = o['Created at'] || o['Created'] || o.Time || o.time || o.created_on || '';
        const isToday = rawTime ? window.isOrderFromToday(rawTime) : true;
        const validStatuses = ['قيد التحضير', 'نصف جاهز', 'جاهز', 'pending', 'Pending', 'preparing', 'ready'];
        return validStatuses.includes(s) && isToday;
    });

    // === 2. فلترة حسب الطباخ (محطة / قاعة) ===
    const menuItems = STATE.cachedMenuItems || [];

    // تحديد فلتر العرض (الأدمين يمكنه اختيار طباخ، الطباخ يستعمل تخصيصه)
    var viewStation = null;
    var viewKitchenRoom = null;

    if (isAdmin && STATE.kdsAdminFilter) {
        // الأدمين يستعمل الفلتر المختار
        if (STATE.kdsAdminFilter.type === 'station') viewStation = STATE.kdsAdminFilter.value;
        if (STATE.kdsAdminFilter.type === 'room') viewKitchenRoom = STATE.kdsAdminFilter.value;
    } else if (!isAdmin) {
        // الطباخ يستعمل تخصيصه
        viewStation = STATE.assignedStation || null;
        viewKitchenRoom = STATE.assignedKitchenRoom || null;
    }

    var hasStationFilter = viewStation && viewStation !== 'الكل' && menuItems.length > 0;

    // دالة لفلترة أصناف الطلب حسب محطة الطباخ
    function filterDetailsByStation(details, station) {
        if (!station || station === 'الكل' || !details || menuItems.length === 0) return details;
        var lines = details.split('\n').filter(function (l) { return l.trim(); });
        if (lines.length === 0) return details;
        var filtered = lines.filter(function (line) {
            // استخراج اسم الصنف: "2x برغر كلاسيكي = 1200 DA" → "برغر كلاسيكي"
            var cleanLine = line.replace(/^\d+x\s*/, '').trim();
            var itemName = cleanLine.split(/\s*[=\-]\s*\d/)[0].trim();
            if (!itemName) return true;

            var menuItem = menuItems.find(function (m) {
                var mName = (m.Name || m.name || '').trim();
                return mName === itemName || itemName.includes(mName) || mName.includes(itemName);
            });
            if (menuItem) {
                var stRaw = (typeof menuItem.Station === 'object' && menuItem.Station) ? menuItem.Station.value : menuItem.Station;
                return stRaw === station;
            }
            return true; // إذا الصنف غير معروف في المنيو، نعرضه
        });
        return filtered.length > 0 ? filtered.join('\n') : null;
    }

    // تطبيق الفلترة
    var processedOrders;
    if (!hasStationFilter && !viewKitchenRoom) {
        processedOrders = activeOrders;
    } else {
        processedOrders = activeOrders.map(function (order) {
            var clone = Object.assign({}, order);

            // فلترة حسب القاعة
            if (viewKitchenRoom) {
                var orderRoom = order.Room || order.room || '';
                if (!orderRoom && String(order.Table || '').includes('-')) {
                    var match = String(order.Table).match(/-\s*(.+)$/);
                    if (match) orderRoom = match[1].trim();
                }
                if (orderRoom && orderRoom !== viewKitchenRoom) {
                    clone._hidden = true;
                    return clone;
                }
            }

            // فلترة حسب المحطة
            if (hasStationFilter) {
                var filteredDetails = filterDetailsByStation(clone.Details || '', viewStation);
                if (!filteredDetails) {
                    clone._hidden = true;
                } else {
                    clone._filteredDetails = filteredDetails;
                }
            }
            return clone;
        }).filter(function (o) { return !o._hidden; });
    }

    // === 3. تصنيف الطلبات ===
    const groupedOrders = { quick: [], delivery: [], rooms: {} };

    processedOrders.forEach(order => {
        let type = order.order_type || '';
        const tableRaw = String(order.Table || order.table || '').trim();
        let roomName = order.Room || order.room || '';

        if (!roomName && tableRaw.includes('-')) {
            const match = tableRaw.match(/-\s*(.+)$/);
            if (match) roomName = match[1].trim();
        }
        if (!roomName) roomName = 'عام';

        if (tableRaw.toLowerCase().includes('توصيل') || tableRaw.toLowerCase().includes('delivery')) {
            groupedOrders.delivery.push(order);
        } else if (type === 'table' || tableRaw.includes('طاولة') || tableRaw.includes('Table') || tableRaw.includes('-')) {
            if (!groupedOrders.rooms[roomName]) groupedOrders.rooms[roomName] = {};
            if (!groupedOrders.rooms[roomName][tableRaw]) groupedOrders.rooms[roomName][tableRaw] = [];
            groupedOrders.rooms[roomName][tableRaw].push(order);
        } else {
            groupedOrders.quick.push(order);
        }
    });

    // === 4. بناء الهيدر ===
    const header = document.createElement('div');
    header.className = "flex flex-col gap-3 mb-6 sticky top-0 bg-gray-800 py-4 -mx-6 -mt-6 px-6 pt-6 z-30 border-b border-gray-700";

    const hasNewQuick = groupedOrders.quick.some(o => o.isNew);
    const hasNewDelivery = groupedOrders.delivery.some(o => o.isNew);
    const hasNewTable = Object.values(groupedOrders.rooms).some(room =>
        Object.values(room).some(tOrders => tOrders.some(o => o.isNew))
    );

    const getTabClass = (tabName, hasNew) => {
        if (STATE.kdsActiveTab === tabName) return 'bg-brand text-black shadow-md';
        if (hasNew) return 'bg-red-600 animate-pulse text-white shadow-[0_0_15px_rgba(220,38,38,0.6)]';
        return 'text-gray-400 hover:bg-gray-700 hover:text-white';
    };

    // شريط التبويبات
    var headerHTML = `
        <div class="flex flex-wrap justify-between items-center gap-3">
            <div class="flex items-center gap-3">
                <span class="live-indicator" title="تحديث مباشر"></span>
            </div>
            <div class="flex bg-gray-900 p-1 rounded-xl border border-gray-700 shadow-inner flex-wrap gap-1">
                <button onclick="window.setKdsTab('tables')" class="px-6 py-2.5 rounded-lg text-sm font-bold transition ${getTabClass('tables', hasNewTable)}">طلبات الطاولات</button>
                <button onclick="window.setKdsTab('quick')" class="px-6 py-2.5 rounded-lg text-sm font-bold transition ${getTabClass('quick', hasNewQuick)} relative">الطلبات السريعة ${groupedOrders.quick.length > 0 ? `<span class="bg-black/30 px-2 py-0.5 rounded-full ml-1.5 text-xs">${groupedOrders.quick.length}</span>` : ''}</button>
                <button onclick="window.setKdsTab('delivery')" class="px-6 py-2.5 rounded-lg text-sm font-bold transition ${getTabClass('delivery', hasNewDelivery)} relative">طلبات التوصيل ${groupedOrders.delivery.length > 0 ? `<span class="bg-black/30 px-2 py-0.5 rounded-full ml-1.5 text-xs">${groupedOrders.delivery.length}</span>` : ''}</button>
            </div>
            <div class="text-gray-300 font-mono text-sm hidden xl:block">${new Date().toLocaleTimeString('ar-DZ')}</div>
        </div>
    `;

    // === شريط فلتر الأدمين (فقط للأدمين) ===
    if (isAdmin) {
        var adminFilter = STATE.kdsAdminFilter || { type: 'all', value: '' };
        var filterBtnClass = function (t, v) {
            return (adminFilter.type === t && adminFilter.value === v)
                ? 'bg-brand text-black font-bold'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white';
        };

        headerHTML += `<div class="flex flex-wrap items-center gap-2 mt-2">`;
        headerHTML += `<span class="text-gray-400 text-xs font-bold">عرض شاشة:</span>`;
        headerHTML += `<button onclick="window.setKdsAdminFilter('all','')" class="text-xs px-3 py-1.5 rounded-lg transition ${filterBtnClass('all', '')}">كل الطلبات</button>`;

        // أزرار فلتر القاعات
        var rooms = [];
        (STATE.tableMapData || []).forEach(function (t) {
            var r = t.Room || t.room || '';
            if (r && !rooms.includes(r)) rooms.push(r);
        });
        rooms.forEach(function (r) {
            headerHTML += `<button onclick="window.setKdsAdminFilter('room','${r}')" class="text-xs px-3 py-1.5 rounded-lg transition ${filterBtnClass('room', r)}">🏠 ${r}</button>`;
        });

        // أزرار فلتر المحطات
        var stations = [];
        menuItems.forEach(function (item) {
            var st = (typeof item.Station === 'object' && item.Station !== null) ? item.Station.value : (item.Station || '');
            st = String(st).trim();
            if (st && !stations.includes(st)) stations.push(st);
        });
        stations.forEach(function (st) {
            headerHTML += `<button onclick="window.setKdsAdminFilter('station','${st}')" class="text-xs px-3 py-1.5 rounded-lg transition ${filterBtnClass('station', st)}">🍳 ${st}</button>`;
        });

        headerHTML += `</div>`;
    }

    header.innerHTML = headerHTML;
    dynamicContent.appendChild(header);

    // === 5. بناء الشبكة ===
    const grid = document.createElement('div');
    grid.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start pb-10";

    const renderOrderList = (ordersArray) => {
        return ordersArray.map(o => {
            const rawTime = o['Created at'] || o['Created'] || o.Time || o.time || o.created_on || '';
            const elapsedMins = window.calculateElapsedMinutes(rawTime);
            const timerStyle = window.getTimerStyle(elapsedMins);
            const timerText = window.formatTimerText(elapsedMins);
            const s = getStatus(o);

            let stationIsReady = false;
            if (viewStation && viewStation !== 'الكل') {
                const details = o._filteredDetails || '';
                const lines = details.split('\n').filter(l => l.trim());
                if (lines.length > 0) {
                    stationIsReady = lines.every(l => l.includes('[جاهز]') || l.includes('✅'));
                } else {
                    stationIsReady = true;
                }
            } else {
                stationIsReady = (s === 'جاهز');
            }

            let btnHtml = '';
            if (s === 'قيد التحضير' || s === 'نصف جاهز') {
                if (stationIsReady) {
                    btnHtml = `<div class="text-center text-green-400 font-bold bg-green-900/30 py-2 rounded-lg border border-green-700/50">جاهز (بانتظار البقية)</div>`;
                } else {
                    btnHtml = `<button id="btn-done-${o.id}" onclick="window.handleOrderReady(${o.id})" class="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg transition shadow-md flex justify-center items-center gap-2"><span>جاهز من طرفي</span> ✅</button>`;
                }
            } else {
                btnHtml = `<div class="text-center text-yellow-400 font-bold bg-yellow-900/30 py-2 rounded-lg border border-yellow-700/50">جاهز كلياً</div>`;
            }

            let displayDetails = o._filteredDetails || o.Details || '-';

            return `
            <div class="bg-gray-900 rounded-xl p-3 border border-gray-700 shadow-sm flex flex-col h-fit mb-3 last:mb-0">
                <div class="flex justify-between items-center mb-3 border-b border-gray-700 pb-2">
                    <span class="text-xs text-gray-400 font-mono bg-gray-800 px-2 py-1 rounded">الطلب ${o.dailySequence}</span>
                    <span class="text-sm flex items-center gap-1 transition-colors duration-300 ${timerStyle} font-bold">⏱️ ${timerText}</span>
                </div>
                <div class="text-sm text-white mb-4 leading-loose pl-3 border-l-2 border-brand whitespace-pre-line font-medium">${displayDetails}</div>
                <div class="mt-auto pt-2">
                    ${btnHtml}
                </div>
            </div>`;
        }).join('');
    };

    if (STATE.kdsActiveTab === 'tables') {
        const roomEntries = Object.entries(groupedOrders.rooms);
        if (roomEntries.length === 0) {
            grid.className = "flex flex-col items-center justify-center h-64 text-gray-500 w-full";
            grid.innerHTML = `<div class="text-6xl mb-4 opacity-50">🍽️</div><div class="text-xl font-medium">لا توجد طلبات طاولات نشطة حالياً</div>`;
        } else {
            roomEntries.forEach(([roomName, tables]) => {
                const roomHeader = document.createElement('div');
                roomHeader.className = "col-span-full mt-4 mb-2 text-xl font-bold text-brand border-b border-gray-700 pb-2 flex items-center gap-2";
                roomHeader.innerHTML = `
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                    <span>${roomName}</span>
                `;
                grid.appendChild(roomHeader);

                Object.entries(tables).forEach(([tableName, tOrders]) => {
                    const card = document.createElement('div');
                    const isCooking = tOrders.some(o => ['قيد التحضير', 'نصف جاهز'].includes(getStatus(o)));
                    const isEating = tOrders.every(o => getStatus(o) === 'جاهز');

                    let cardClass = "";
                    let headerClass = "";

                    if (isCooking) {
                        const hasNew = tOrders.some(o => o.isNew);
                        const hasHalfReady = tOrders.some(o => getStatus(o) === 'نصف جاهز');
                        const hasPreparing = tOrders.some(o => getStatus(o) === 'قيد التحضير');

                        if (hasHalfReady && !hasPreparing) {
                            cardClass = `bg-gray-800 border-2 border-red-300 shadow-[0_0_15px_rgba(252,165,165,0.4)] rounded-2xl flex flex-col overflow-hidden ${hasNew ? 'animate-pulse' : ''}`;
                            headerClass = "bg-red-400 text-black";
                        } else {
                            cardClass = `bg-gray-800 border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] rounded-2xl flex flex-col overflow-hidden ${hasNew ? 'animate-pulse' : ''}`;
                            headerClass = "bg-red-600 text-white";
                        }
                    } else if (isEating) {
                        cardClass = `bg-gray-800 border-2 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)] rounded-2xl flex flex-col overflow-hidden`;
                        headerClass = "bg-yellow-500 text-black";
                    } else {
                        cardClass = `bg-gray-800 border-2 border-gray-500 rounded-2xl flex flex-col overflow-hidden`;
                        headerClass = "bg-gray-600 text-white";
                    }

                    card.className = cardClass.replace('flex-col', 'flex-col h-fit');
                    card.innerHTML = `
                        <div class="${headerClass} font-bold p-3 text-center text-lg flex justify-between items-center shadow-md">
                            <span class="truncate max-w-[70%]">${tableName}</span>
                            <span class="bg-black/20 text-current text-xs font-bold px-2 py-1 rounded-full border border-black/30">${tOrders.length} طلبيات</span>
                        </div>
                        <div class="p-3 flex flex-col gap-3 h-fit">
                            ${renderOrderList(tOrders)}
                        </div>
                    `;
                    grid.appendChild(card);
                });
            });
        }
    } else {
        const tkOrders = STATE.kdsActiveTab === 'quick' ? groupedOrders.quick : groupedOrders.delivery;
        const tabTitle = STATE.kdsActiveTab === 'quick' ? 'طلبات سريعة' : 'توصيل';
        const themeBorder = STATE.kdsActiveTab === 'quick' ? 'border-blue-500' : 'border-purple-500';
        const themeBg = STATE.kdsActiveTab === 'quick' ? 'bg-blue-600' : 'bg-purple-600';

        if (tkOrders.length === 0) {
            grid.className = "flex flex-col items-center justify-center h-64 text-gray-500 w-full";
            grid.innerHTML = `<div class="text-6xl mb-4 opacity-50">📋</div><div class="text-xl font-medium">لا توجد طلبات حالياً</div>`;
        } else {
            tkOrders.forEach(o => {
                const card = document.createElement('div');
                const hasNew = o.isNew;
                const s = getStatus(o);

                let borderColorClass = '';
                if (s === 'قيد التحضير') borderColorClass = `${themeBorder} shadow-[0_0_15px_rgba(100,100,255,0.3)]`;
                else if (s === 'نصف جاهز') borderColorClass = `border-red-400 shadow-[0_0_15px_rgba(248,113,113,0.3)]`;
                else borderColorClass = 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]';

                card.className = `bg-gray-800 border-2 ${borderColorClass} rounded-2xl flex flex-col overflow-hidden h-fit ${hasNew ? 'animate-pulse' : ''}`;

                const rawTime = o['Created at'] || o['Created'] || o.Time || o.time || o.created_on || '';
                const elapsedMins = window.calculateElapsedMinutes(rawTime);
                const timerStyle = window.getTimerStyle(elapsedMins);
                const timerText = window.formatTimerText(elapsedMins);

                let stationIsReady = false;
                if (viewStation && viewStation !== 'الكل') {
                    const details = o._filteredDetails || '';
                    const lines = details.split('\n').filter(l => l.trim());
                    if (lines.length > 0) {
                        stationIsReady = lines.every(l => l.includes('[جاهز]') || l.includes('✅'));
                    } else {
                        stationIsReady = true;
                    }
                } else {
                    stationIsReady = (s === 'جاهز');
                }

                let btnHtml = '';
                if (s === 'قيد التحضير' || s === 'نصف جاهز') {
                    if (stationIsReady) {
                        btnHtml = `<div class="text-center text-green-400 font-bold bg-green-900/30 py-3 rounded-xl border border-green-700/50 mt-auto">جاهز (بانتظار البقية)</div>`;
                    } else {
                        btnHtml = `<button id="btn-done-${o.id}" onclick="window.handleOrderReady(${o.id})" class="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition shadow-lg flex justify-center items-center gap-2 mt-auto text-lg hover:scale-[1.02]"><span>جاهز من طرفي</span> ✅</button>`;
                    }
                } else {
                    btnHtml = `<div class="text-center text-yellow-400 font-bold bg-yellow-900/30 py-3 rounded-xl border border-yellow-700/50 mt-auto">جاهز كلياً</div>`;
                }

                const displayDetails = o._filteredDetails || o.Details || '-';

                let ordersHTML = `
                <div class="bg-gray-900 rounded-xl p-4 border border-gray-700 m-3 flex flex-col shadow-inner h-fit">
                    <div class="flex justify-between items-center mb-3 border-b border-gray-700 pb-3">
                        <span class="text-sm text-gray-400 font-mono bg-gray-800 px-2 py-1 rounded">الطلب ${o.dailySequence}</span>
                        <span class="text-sm flex items-center gap-1 transition-colors duration-300 ${timerStyle} font-bold">⏱️ ${timerText}</span>
                    </div>
                    <div class="text-xs text-gray-400 mb-4 bg-gray-800 inline-block px-3 py-1.5 rounded-lg border border-gray-700 w-fit">الوجهة: <span class="text-white font-bold text-sm">${o.Table || o.table || 'غير محدد'}</span></div>
                    <div class="text-base text-white mb-6 leading-loose pl-3 border-l-4 ${themeBorder} whitespace-pre-line font-medium">${displayDetails}</div>
                    <div class="mt-auto">
                        ${btnHtml}
                    </div>
                </div>`;

                let headerBg = '';
                if (s === 'قيد التحضير') headerBg = themeBg;
                else if (s === 'نصف جاهز') headerBg = 'bg-red-400 text-black';
                else headerBg = 'bg-yellow-500 text-black';
                card.innerHTML = `<div class="${headerBg} font-bold p-3 text-center text-lg flex justify-between items-center shadow-md"><span>${tabTitle}</span></div>${ordersHTML}`;
                grid.appendChild(card);
            });
        }
    }

    dynamicContent.appendChild(grid);
};

window.handleOrderReady = async function (orderId) {
    const order = STATE.lastFetchedOrders.find(o => o.id === orderId);
    if (!order) return;

    const isAdmin = STATE.currentRole === 'admin';
    let viewStation = null;
    if (isAdmin && STATE.kdsAdminFilter && STATE.kdsAdminFilter.type === 'station') {
        viewStation = STATE.kdsAdminFilter.value;
    } else if (!isAdmin) {
        viewStation = STATE.assignedStation;
    }

    const menuItems = STATE.cachedMenuItems || [];
    let updatedDetailsLines = [];
    let allLinesAreReady = true;

    const lines = (order.Details || '').split('\n').filter(l => l.trim());

    lines.forEach(line => {
        let cleanLine = line.trim();
        const isLineReady = cleanLine.includes('[جاهز]') || cleanLine.includes('✅');

        if (isLineReady) {
            updatedDetailsLines.push(cleanLine);
            return;
        }

        // استخراج اسم الصنف الفعلي بدون الكميات أو الأسعار
        const itemNameRaw = cleanLine.replace(/^\d+x\s*/, '').split(/\s*[=\-]\s*\d/)[0].trim();
        const menuItem = menuItems.find(m => {
            const mName = (m.Name || m.name || '').trim();
            return mName === itemNameRaw || itemNameRaw.includes(mName) || mName.includes(itemNameRaw);
        });

        const lineStation = menuItem ? ((typeof menuItem.Station === 'object' && menuItem.Station) ? menuItem.Station.value : menuItem.Station) : null;

        // إذا كان الصنف يتبع للمحطة الحالية (أو لا توجد محطة محددة)، نعتبره جاهزاً
        if (!viewStation || viewStation === 'الكل' || lineStation === viewStation) {
            updatedDetailsLines.push(cleanLine + ' ✅'); // تعديل النص لإظهاره كجاهز
        } else {
            // صنف تابع لمحطة أخرى ولم يجهز بعد
            updatedDetailsLines.push(cleanLine);
            allLinesAreReady = false;
        }
    });

    const newDetails = updatedDetailsLines.join('\n');
    const newStatus = allLinesAreReady ? 'جاهز' : 'نصف جاهز';

    if (typeof window.updateOrderStatus === 'function') {
        window.updateOrderStatus(orderId, newStatus, { Details: newDetails });
    }
};