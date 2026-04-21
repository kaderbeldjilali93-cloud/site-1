// =========================================================
// 👨‍🍳 KDS Logic (شاشة المطبخ)
// =========================================================

window.setKdsTab = function (tab) {
    STATE.kdsActiveTab = tab;
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

    const activeOrders = filteredOrders.filter(o => {
        const s = getStatus(o);
        const rawTime = o['Created at'] || o.Time || o.time || o.created_on;
        const isToday = window.isOrderFromToday(rawTime);

        return (s === 'قيد التحضير' || s === 'جاهز') && isToday;
    });

    const groupedOrders = { quick: [], delivery: [], rooms: {} };

    activeOrders.forEach(order => {
        let type = order.order_type || 'quick';
        const tableRaw = String(order.Table || order.table || '').trim();
        let roomName = order.Room || order.room || '';

        // استخراج اسم القاعة من حقل الطاولة إذا كان مفقوداً
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

    const header = document.createElement('div');
    header.className = "flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 sticky top-0 bg-gray-800 py-4 -mx-6 -mt-6 px-6 pt-6 z-30 border-b border-gray-700 gap-4";

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

    header.innerHTML = `
        <div class="flex items-center gap-3">
            <span class="live-indicator" title="تحديث مباشر"></span>
        </div>
        <div class="flex bg-gray-900 p-1 rounded-xl border border-gray-700 shadow-inner flex-wrap gap-1">
            <button onclick="window.setKdsTab('tables')" class="px-6 py-2.5 rounded-lg text-sm font-bold transition ${getTabClass('tables', hasNewTable)}">طلبات الطاولات</button>
            <button onclick="window.setKdsTab('quick')" class="px-6 py-2.5 rounded-lg text-sm font-bold transition ${getTabClass('quick', hasNewQuick)} relative">الطلبات السريعة ${groupedOrders.quick.length > 0 ? `<span class="bg-black/30 px-2 py-0.5 rounded-full ml-1.5 text-xs">${groupedOrders.quick.length}</span>` : ''}</button>
            <button onclick="window.setKdsTab('delivery')" class="px-6 py-2.5 rounded-lg text-sm font-bold transition ${getTabClass('delivery', hasNewDelivery)} relative">طلبات التوصيل ${groupedOrders.delivery.length > 0 ? `<span class="bg-black/30 px-2 py-0.5 rounded-full ml-1.5 text-xs">${groupedOrders.delivery.length}</span>` : ''}</button>
        </div>
        <div class="text-gray-300 font-mono text-sm hidden xl:block">${new Date().toLocaleTimeString('ar-DZ')}</div>
    `;
    dynamicContent.appendChild(header);

    const grid = document.createElement('div');
    grid.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start pb-10";

    const renderOrderList = (ordersArray) => {
        return ordersArray.map(o => {
            const rawTime = o['Created at'] || o.Time || o.time || o.created_on;
            const elapsedMins = window.calculateElapsedMinutes(rawTime);
            const timerStyle = window.getTimerStyle(elapsedMins);
            const timerText = window.formatTimerText(elapsedMins);
            const s = getStatus(o);

            const btnHtml = s === 'قيد التحضير'
                ? `<button id="btn-done-${o.id}" onclick="window.updateOrderStatus(${o.id}, 'جاهز')" class="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg transition shadow-md flex justify-center items-center gap-2"><span>جاهز</span> ✅</button>`
                : `<div class="text-center text-green-400 font-bold bg-green-900/30 py-2 rounded-lg border border-green-700/50">جاهز (في انتظار الدفع)</div>`;

            return `
            <div class="bg-gray-900 rounded-xl p-3 border border-gray-700 shadow-sm flex flex-col h-fit mb-3 last:mb-0">
                <div class="flex justify-between items-center mb-3 border-b border-gray-700 pb-2">
                    <span class="text-xs text-gray-400 font-mono bg-gray-800 px-2 py-1 rounded">الطلب ${o.dailySequence}</span>
                    <span class="text-sm flex items-center gap-1 transition-colors duration-300 ${timerStyle} font-bold">⏱️ ${timerText}</span>
                </div>
                <div class="text-sm text-white mb-4 leading-loose pl-3 border-l-2 border-brand whitespace-pre-line font-medium">${o.Details || '-'}</div>
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
                // عنوان القاعة
                const roomHeader = document.createElement('div');
                roomHeader.className = "col-span-full mt-4 mb-2 text-xl font-bold text-brand border-b border-gray-700 pb-2 flex items-center gap-2";
                roomHeader.innerHTML = `
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                    <span>${roomName}</span>
                `;
                grid.appendChild(roomHeader);

                // رسم كروت الطاولات لهذه القاعة
                Object.entries(tables).forEach(([tableName, tOrders]) => {
                    const card = document.createElement('div');
                    const isCooking = tOrders.some(o => getStatus(o) === 'قيد التحضير');
                    const isEating = tOrders.every(o => getStatus(o) === 'جاهز');
                    
                    let cardClass = "";
                    let headerClass = "";

                    if (isCooking) {
                        const hasNew = tOrders.some(o => o.isNew);
                        cardClass = `bg-gray-800 border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] rounded-2xl flex flex-col overflow-hidden ${hasNew ? 'animate-pulse' : ''}`;
                        headerClass = "bg-red-600 text-white";
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

                let borderColorClass = s === 'قيد التحضير'
                    ? `${themeBorder} shadow-[0_0_15px_rgba(100,100,255,0.3)]`
                    : 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]';

                card.className = `bg-gray-800 border-2 ${borderColorClass} rounded-2xl flex flex-col overflow-hidden h-fit ${hasNew ? 'animate-pulse' : ''}`;

                const rawTime = o['Created at'] || o.Time || o.time || o.created_on;
                const elapsedMins = window.calculateElapsedMinutes(rawTime);
                const timerStyle = window.getTimerStyle(elapsedMins);
                const timerText = window.formatTimerText(elapsedMins);

                const btnHtml = s === 'قيد التحضير'
                    ? `<button id="btn-done-${o.id}" onclick="window.updateOrderStatus(${o.id}, 'جاهز')" class="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition shadow-lg flex justify-center items-center gap-2 mt-auto text-lg hover:scale-[1.02]"><span>جاهز للتسليم</span> ✅</button>`
                    : `<div class="text-center text-yellow-400 font-bold bg-yellow-900/30 py-3 rounded-xl border border-yellow-700/50 mt-auto">جاهز (في انتظار الدفع)</div>`;

                let ordersHTML = `
                <div class="bg-gray-900 rounded-xl p-4 border border-gray-700 m-3 flex flex-col shadow-inner h-fit">
                    <div class="flex justify-between items-center mb-3 border-b border-gray-700 pb-3">
                        <span class="text-sm text-gray-400 font-mono bg-gray-800 px-2 py-1 rounded">الطلب ${o.dailySequence}</span>
                        <span class="text-sm flex items-center gap-1 transition-colors duration-300 ${timerStyle} font-bold">⏱️ ${timerText}</span>
                    </div>
                    <div class="text-xs text-gray-400 mb-4 bg-gray-800 inline-block px-3 py-1.5 rounded-lg border border-gray-700 w-fit">الوجهة: <span class="text-white font-bold text-sm">${o.Table || o.table || 'غير محدد'}</span></div>
                    <div class="text-base text-white mb-6 leading-loose pl-3 border-l-4 ${themeBorder} whitespace-pre-line font-medium">${o.Details || '-'}</div>
                    <div class="mt-auto">
                        ${btnHtml}
                    </div>
                </div>`;

                const headerBg = s === 'قيد التحضير' ? themeBg : 'bg-yellow-500 text-black';
                card.innerHTML = `<div class="${headerBg} text-white font-bold p-3 text-center text-lg flex justify-between items-center shadow-md"><span>${tabTitle}</span></div>${ordersHTML}`;
                grid.appendChild(card);
            });
        }
    }

    dynamicContent.appendChild(grid);
};