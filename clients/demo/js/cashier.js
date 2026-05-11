// =========================================================
// 💰 Cashier Logic (الكاشير، الدفع، الطباعة، والدمج)
// =========================================================

window.handleCashierDateChange = function (e) {
    STATE.selectedCashierDate = e.target.value;
    window.renderCashier(STATE.lastFetchedOrders);
};

window.setCashierFilter = function (status) {
    STATE.cashierStatusFilter = status;
    window.renderCashier(STATE.lastFetchedOrders);
};

/**
 * Shared helper: Parse order Details text and compute the correct subtotal.
 * Handles two formats:
 *   A) "{qty}x {name} = {rowTotal}"  → rowTotal is ALREADY price*qty → add as-is
 *   B) "{name} = {price}" or "{name} - {price}"  → single-unit price → add as-is
 * Returns { subtotal, discountPercent, items[] }
 */
window._parseOrderForMath = function (order) {
    let subtotal = 0;
    let discountPercent = 0;
    const items = [];

    const detailsRaw = order.Details || "";

    // Extract gamification discount
    const discountMatch = detailsRaw.match(/🎁 جائزة: خصم\s+(\d+)%/);
    if (discountMatch) {
        discountPercent = parseInt(discountMatch[1], 10);
    }

    // Split lines (newline is the canonical separator from saveOrderEdit)
    const lines = detailsRaw.split(/\n/).filter(l => l.trim() !== "");

    lines.forEach(line => {
        const text = line.trim();
        if (text === '' || text.includes('🎁 جائزة:') || text.includes('-- ')) return;

        let itemName = text;
        let qty = 1;
        let unitPrice = 0;
        let rowTotal = 0;

        // Format A: "2x Burger = 1000" (User clarified: the number after = is the UNIT PRICE)
        const fullMatch = text.match(/^(\d+)\s*[xX\*]\s*(.+?)\s*=\s*([\d.]+)/);
        if (fullMatch) {
            qty = parseInt(fullMatch[1], 10) || 1;
            itemName = fullMatch[2].replace(/✅|\[جاهز\]/g, '').trim();
            unitPrice = parseFloat(fullMatch[3]) || 0;
            rowTotal = qty * unitPrice;
        }
        // Format B: "Burger = 500" (no qty prefix → single unit)
        else if (text.includes('=')) {
            const parts = text.split('=');
            itemName = parts[0].replace(/✅|\[جاهز\]/g, '').trim();
            rowTotal = parseFloat(parts[parts.length - 1].replace(/[^0-9.]/g, '')) || 0;
            unitPrice = rowTotal;
        }
        // Format C: "Burger - 500"
        else if (text.includes('-')) {
            const parts = text.split('-');
            const lastPart = parts[parts.length - 1].trim();
            if (/^\d/.test(lastPart)) {
                rowTotal = parseFloat(lastPart.replace(/[^0-9.]/g, '')) || 0;
                unitPrice = rowTotal;
                parts.pop();
                itemName = parts.join('-').replace(/✅|\[جاهز\]/g, '').trim();
            }
        }

        subtotal += rowTotal;
        items.push({ name: itemName, qty, unitPrice, rowTotal });
    });

    // Fallback: if parsing yields 0 but order has a stored total, use that
    if (subtotal === 0) {
        subtotal = parseFloat(
            (order.total || order.Total || order.price || order.Price || 0)
                .toString().replace(/[^0-9.]/g, '')
        ) || 0;
    }

    const discountAmount = subtotal * (discountPercent / 100);
    const finalTotal = subtotal - discountAmount;

    return { subtotal, discountPercent, discountAmount, finalTotal, items };
};

window.handlePaymentToggle = function (rowId) {
    const order = STATE.processedCashierOrders.find(o => o.id === rowId);
    if (!order) return;

    STATE.currentCheckoutOrder = order;

    // 1. Calculate via shared math helper
    const calc = window._parseOrderForMath(order);

    // Store calculated values in the order object for persistence
    STATE.currentCheckoutOrder.calculatedSubtotal = calc.subtotal;
    STATE.currentCheckoutOrder.calculatedDiscount = calc.discountAmount;
    STATE.currentCheckoutOrder.calculatedFinalTotal = calc.finalTotal;

    const sysCurrency = localStorage.getItem('system_currency') || 'DA';
    const tableStr = order.Table || order.table || 'سفري';

    document.getElementById('checkout-title').innerText = `تأكيد الدفع: الطلب ${order.dailySequence} - ${tableStr}`;

    // 2. Update Modal UI with breakdown if discount exists
    const amountDisplay = document.getElementById('checkout-amount');
    if (calc.discountPercent > 0) {
        amountDisplay.innerHTML = `
            <div class="flex flex-col gap-1">
                <div class="text-gray-400 text-xs flex justify-between px-2">
                    <span>المجموع الفرعي:</span>
                    <span class="line-through">${calc.subtotal.toLocaleString()} ${sysCurrency}</span>
                </div>
                <div class="text-green-500 text-xs flex justify-between px-2 font-bold">
                    <span>خصم الجائزة (${calc.discountPercent}%):</span>
                    <span>-${calc.discountAmount.toLocaleString()} ${sysCurrency}</span>
                </div>
                <div class="mt-2 pt-2 border-t border-gray-700 text-3xl font-black text-brand tracking-wider">
                    ${calc.finalTotal.toLocaleString()} ${sysCurrency}
                </div>
            </div>
        `;
    } else {
        amountDisplay.innerText = `${calc.subtotal.toLocaleString()} ${sysCurrency}`;
    }

    document.getElementById('checkout-modal').classList.remove('hidden');
};

window.closeCheckoutModal = function () {
    document.getElementById('checkout-modal').classList.add('hidden');
    STATE.currentCheckoutOrder = null;
};

window.confirmPayment = function (shouldPrint) {
    const order = STATE.currentCheckoutOrder;
    if (!order) return;

    window.closeCheckoutModal();
    window.processPayment(order.id, shouldPrint);
};

window.processPayment = async function (rowId, shouldPrint) {
    const order = STATE.currentCheckoutOrder || STATE.processedCashierOrders.find(o => o.id === rowId);
    if (!order) return;

    const payBtn = document.getElementById(`btn-pay-${rowId}`);
    let originalHTML = '';
    let originalClassName = '';

    if (payBtn) {
        originalHTML = payBtn.innerHTML;
        originalClassName = payBtn.className;
        payBtn.innerHTML = 'جاري...';
        payBtn.disabled = true;
    }

    // Determine the final total to persist (use calculation if exists, otherwise original)
    const finalPriceToSave = order.calculatedFinalTotal !== undefined ? order.calculatedFinalTotal : (parseFloat((order.total || order.Total || order.price || order.Price || 0).toString().replace(/[^0-9.]/g, '')) || 0);

    // Determine price key
    let priceKey = 'Total';
    if ('Total' in order) priceKey = 'Total';
    else if ('total' in order) priceKey = 'total';
    else if ('Price' in order) priceKey = 'Price';
    else if ('price' in order) priceKey = 'price';

    try {
        const res = await fetch(`https://baserow.vidsai.site/api/database/rows/table/${ORDERS_TABLE_ID}/${rowId}/?user_field_names=true`, {
            method: 'PATCH',
            headers: { "Authorization": `Token ${BASEROW_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify({ 
                "Status": 'مدفوع',
                [priceKey]: String(finalPriceToSave)
            })
        });

        if (!res.ok) throw new Error("API Save Failed");

        // Success: Update UI
        if (payBtn) {
            payBtn.innerHTML = 'مدفوع';
            payBtn.className = 'px-3 py-1 rounded-full text-xs border border-blue-700 bg-blue-800 text-white font-bold transition shadow-lg pointer-events-none whitespace-nowrap';
            payBtn.disabled = false;
        }

        const updateLocalStatus = (ordersArray) => {
            if (!ordersArray) return;
            const o = ordersArray.find(x => x.id === rowId);
            if (o) {
                if (typeof o.Status === 'object') o.Status.value = 'مدفوع'; else o.Status = 'مدفوع';
                o[priceKey] = String(finalPriceToSave);
            }
        };
        updateLocalStatus(STATE.lastFetchedOrders);
        updateLocalStatus(STATE.latestKdsOrders);
        updateLocalStatus(STATE.processedCashierOrders);

        if (shouldPrint) {
            // Update order object for printing with the correct final total
            const orderToPrint = { ...order, [priceKey]: finalPriceToSave };
            window.printReceipt(orderToPrint);
        }

        window.showToast("تم تأكيد الدفع بنجاح", "success");

        if (window.processInventoryDeduction) {
            window.processInventoryDeduction(order.Details || order.details);
        }

        setTimeout(async () => {
            const freshData = await window.fetchOrders(ORDERS_TABLE_ID);
            STATE.lastFetchedOrders = freshData;
            window.renderCashier(freshData);
        }, 800);

    } catch (error) {
        console.error("Payment error:", error);
        window.showToast("فشل تأكيد الدفع", "error");
        if (payBtn) {
            payBtn.innerHTML = originalHTML;
            payBtn.className = originalClassName;
            payBtn.disabled = false;
        }
    }
};

window.printReceipt = function (order) {
    const printSec = document.getElementById('print-section');
    const tableStr = order.Table || order.table || 'سفري';
    const dateStr = new Date().toLocaleString('ar-DZ');
    const sysCurrency = localStorage.getItem('system_currency') || 'DA';

    const rName = localStorage.getItem('menu_restaurant_name') || 'RestoPro';
    const rTop = localStorage.getItem('print_receipt_top') || 'أهلاً بكم في مطعمنا';
    const rBottom = localStorage.getItem('print_receipt_bottom') || 'شكراً لزيارتكم!';
    const rQrCode = localStorage.getItem('print_qr_code') || '';

    // Use the shared math helper for consistent calculation
    const calc = window._parseOrderForMath(order);

    // Build items HTML from parsed items
    let itemsHtml = '';
    calc.items.forEach(item => {
        itemsHtml += `<div style="display:flex; justify-content:space-between; margin-bottom: 6px; font-size: 11px;">
            <span style="flex:1;">${item.qty > 1 ? item.qty + 'x ' : ''}${item.name}</span>
            <span style="font-weight:bold; white-space:nowrap; margin-left: 8px;">${item.rowTotal.toLocaleString()}</span>
        </div>`;
    });

    let totalsHtml = '';
    if (calc.discountPercent > 0) {
        totalsHtml = `
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
                <span>المجموع الفرعي:</span>
                <span>${calc.subtotal.toLocaleString()} ${sysCurrency}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; color: #d97706; margin-bottom: 4px; font-weight: bold;">
                <span>خصم الجائزة (${calc.discountPercent}%):</span>
                <span>-${calc.discountAmount.toLocaleString()} ${sysCurrency}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; margin-top: 8px; background-color: #f0f0f0; padding: 6px; border: 1px solid #000;">
                <span>الإجمالي:</span>
                <span>${calc.finalTotal.toLocaleString()} ${sysCurrency}</span>
            </div>
        `;
    } else {
        totalsHtml = `
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; background-color: #f0f0f0; padding: 6px; border: 1px solid #000;">
                <span>المجموع:</span>
                <span>${calc.subtotal.toLocaleString()} ${sysCurrency}</span>
            </div>
        `;
    }

    printSec.innerHTML = `
        <div style="text-align: center; margin-bottom: 12px;">
            <h2 style="margin: 0; font-size: 24px; font-weight: 900;">${rName}</h2>
            ${rTop ? `<div style="font-size: 14px; font-weight: bold; color: #333; margin-top: 4px; white-space: pre-line;">${rTop}</div>` : ''}
        </div>
        <div style="border-top: 1px dashed #000; margin: 12px 0;"></div>
        <div style="font-size: 12px; margin-bottom: 12px; line-height: 1.6;">
            <div style="display:flex; justify-content:space-between;"><span>رقم الطلب:</span> <b>${order.dailySequence}</b></div>
            <div style="display:flex; justify-content:space-between;"><span>الطاولة:</span> <b>${tableStr}</b></div>
            <div style="display:flex; justify-content:space-between;"><span>التاريخ:</span> <span>${dateStr}</span></div>
            <div style="display:flex; justify-content:space-between;"><span>طريقة الدفع:</span> <span>نقداً</span></div>
        </div>
        <div style="border-top: 1px dashed #000; margin: 12px 0;"></div>
        <div style="margin-bottom: 12px;">
            <div style="font-weight: bold; margin-bottom: 8px; font-size: 13px; border-bottom: 1px solid #000; padding-bottom: 4px;">تفاصيل الطلب:</div>
            ${itemsHtml}
        </div>
        <div style="border-top: 1px dashed #000; margin: 12px 0;"></div>
        ${totalsHtml}
        <div style="border-top: 1px dashed #000; margin: 12px 0;"></div>
        <div style="text-align: center; font-size: 11px; margin-top: 15px; font-weight: bold; white-space: pre-line;">
            ${rBottom}
        </div>
        ${rQrCode ? `<div style="text-align: center; margin-top: 10px;"><img src="${rQrCode}" style="width: 100px; height: 100px; margin: 0 auto; display: block;" /></div>` : ''}
    `;

    setTimeout(() => {
        window.print();
    }, 100);
};

window.setCashierRoomFilter = function (room) {
    STATE.cashierRoomFilter = room;
    window.renderCashier(STATE.lastFetchedOrders);
};

window.renderCashier = function (orders) {
    STATE.lastFetchedOrders = orders;
    const getPrice = (o) => parseFloat((o.total || o.Total || o.price || o.Price || 0).toString().replace(/[^0-9.]/g, '')) || 0;
    const getStatus = (o) => (typeof o.Status === 'object' && o.Status) ? o.Status.value : o.Status;
    const sysCurrency = localStorage.getItem('system_currency') || 'DA';

    let baseOrders = (orders || []).filter(o => {
        const time = o['Created at'] || o.Time || o.time || o.created_on || o.CreatedOn || o.Date || '';
        return window.isOrderFromSelectedDate(time, STATE.selectedCashierDate);
    });

    baseOrders = window.calculateDailySequence(baseOrders);
    baseOrders = window.processOrderAlerts(baseOrders);
    STATE.processedCashierOrders = baseOrders;

    // ========== تصفية حسب القاعة ==========
    let roomFilteredOrders = baseOrders;
    if (STATE.cashierRoomFilter === 'طلبات سريعة') {
        roomFilteredOrders = baseOrders.filter(o => {
            const ot = o.order_type || '';
            const tbl = String(o.Table || '').trim();
            const isTableOrder = ot === 'table' || (tbl && tbl.includes('الطاولة'));
            return !isTableOrder || tbl === 'سفري' || tbl === 'طاولة جديدة';
        });
    } else if (STATE.cashierRoomFilter !== 'الكل') {
        roomFilteredOrders = baseOrders.filter(o => {
            const tbl = String(o.Table || '').trim();
            const room = String(o.Room || o.room || '').trim();
            if (room === STATE.cashierRoomFilter) return true;
            if (tbl.includes('- ' + STATE.cashierRoomFilter)) return true;
            return false;
        });
    }

    // ========== تصفية حسب الحالة ==========
    let filteredOrders = STATE.cashierStatusFilter === 'الكل'
        ? roomFilteredOrders
        : roomFilteredOrders.filter(o => getStatus(o) === STATE.cashierStatusFilter);

    const dynamicContent = document.getElementById('dynamic-content');
    if (!dynamicContent) return;
    dynamicContent.innerHTML = '';

    let totalSales = 0; roomFilteredOrders.forEach(o => totalSales += getPrice(o));
    const avgOrderValue = roomFilteredOrders.length > 0 ? (totalSales / roomFilteredOrders.length).toFixed(2) : 0;

    // ========== الهيدر ==========
    const tableHeader = document.createElement('div');
    tableHeader.className = "flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sticky top-0 bg-gray-800 py-4 -mx-6 -mt-6 px-6 pt-6 z-30 border-b border-gray-700 gap-4";
    tableHeader.innerHTML = `
        <div class="flex items-center gap-3">
            <span class="live-indicator" title="تحديث مباشر"></span>
            <button onclick="window.openNewOrderModal('quick')" class="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg transition shadow-md flex items-center gap-2 text-sm whitespace-nowrap shrink-0">
                <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                <span class="whitespace-nowrap">طلب سريع جديد</span>
            </button>
        </div>
        <div class="relative flex items-center bg-gray-800 border border-gray-600 rounded-lg hover:border-brand focus-within:border-brand focus-within:ring-2 focus-within:ring-brand transition-all overflow-hidden group">
            <div class="absolute right-3 text-brand pointer-events-none z-0">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </div>
            <input type="date" value="${STATE.selectedCashierDate}" onchange="window.handleCashierDateChange(event)" class="w-full bg-transparent text-white pl-3 pr-9 py-1.5 outline-none text-sm cursor-pointer relative font-mono z-10" style="color-scheme: dark;">
        </div>
    `;
    dynamicContent.appendChild(tableHeader);

    // ========== KPI ==========
    const kpiSection = document.createElement('div');
    kpiSection.className = "grid grid-cols-1 md:grid-cols-3 gap-6 mb-8";
    kpiSection.innerHTML = `
        <div class="bg-gray-800 p-5 rounded-xl border-r-4 border-brand shadow-lg"><p class="text-gray-400 text-sm mb-1">إجمالي المبيعات</p><h3 class="text-3xl font-bold text-white">${totalSales.toLocaleString()} <span class="text-sm text-brand">${sysCurrency}</span></h3></div>
        <div class="bg-gray-800 p-5 rounded-xl border-r-4 border-blue-500 shadow-lg"><p class="text-gray-400 text-sm mb-1">إجمالي الطلبات</p><h3 class="text-3xl font-bold text-white">${roomFilteredOrders.length}</h3></div>
        <div class="bg-gray-800 p-5 rounded-xl border-r-4 border-green-500 shadow-lg"><p class="text-gray-400 text-sm mb-1">متوسط السلة</p><h3 class="text-3xl font-bold text-white">${avgOrderValue} <span class="text-sm text-green-500">${sysCurrency}</span></h3></div>
    `;
    dynamicContent.appendChild(kpiSection);

    // ========== فلتر القاعات (جديد) ==========
    const allRooms = [...new Set((STATE.tableMapData || []).map(t => t.Room).filter(Boolean))].sort();
    const roomOptions = ['الكل', ...allRooms, 'طلبات سريعة'];

    const roomFiltersContainer = document.createElement('div');
    roomFiltersContainer.className = "flex gap-2 mb-4 overflow-x-auto pb-2 custom-scrollbar";
    roomFiltersContainer.innerHTML = roomOptions.map(room => {
        const isActive = STATE.cashierRoomFilter === room;
        const icon = room === 'طلبات سريعة' ? '⚡' : (room === 'الكل' ? '📋' : '🏠');
        const btnClass = isActive
            ? 'bg-brand text-black font-bold shadow-[0_0_10px_rgba(255,153,0,0.3)]'
            : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500';
        return `<button onclick="window.setCashierRoomFilter('${room}')" class="px-5 py-2 rounded-xl text-sm transition whitespace-nowrap ${btnClass}">${icon} ${room}</button>`;
    }).join('');
    dynamicContent.appendChild(roomFiltersContainer);

    // ========== فلتر الحالة ==========
    const filtersContainer = document.createElement('div');
    filtersContainer.className = "flex gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar";
    const statuses = ['الكل', 'قيد التحضير', 'جاهز', 'مدفوع'];
    filtersContainer.innerHTML = statuses.map(status => {
        const isActive = STATE.cashierStatusFilter === status;
        const btnClass = isActive
            ? 'bg-brand text-black font-bold shadow-[0_0_10px_rgba(255,153,0,0.3)]'
            : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500';
        return `<button onclick="window.setCashierFilter('${status}')" class="px-5 py-2 rounded-xl text-sm transition whitespace-nowrap ${btnClass}">${status}</button>`;
    }).join('');
    dynamicContent.appendChild(filtersContainer);

    // ========== الجدول ==========
    const tableContainer = document.createElement('div');
    tableContainer.className = "overflow-x-auto bg-gray-800 rounded-lg shadow border border-gray-700";
    let tableHTML = `<table class="w-full text-left border-collapse"><thead><tr class="bg-gray-700 text-gray-300 text-sm"><th class="p-4 text-right">رقم الطلب</th><th class="p-4 text-right">الوقت</th><th class="p-4 text-right">الطاولة</th><th class="p-4 text-right w-1/3">التفاصيل</th><th class="p-4 text-left">السعر</th><th class="p-4 text-center">الحالة / الإجراء</th></tr></thead><tbody class="divide-y divide-gray-700 text-gray-300 text-sm">`;

    filteredOrders.forEach(order => {
        const statusVal = getStatus(order) || 'Unknown';
        const statusColors = {
            'قيد التحضير': 'text-yellow-300 border-yellow-700 bg-yellow-900/20',
            'جاهز': 'text-green-300 border-green-700 bg-green-900/20',
            'مدفوع': 'text-blue-300 border-blue-700 bg-blue-900/20'
        };
        const statusClass = statusColors[statusVal] || 'text-gray-300 bg-gray-800 border-gray-600';

        let rowAlertClass = '';
        if (order.isNew) rowAlertClass = 'animate-new-order';
        else if (order.justReady) rowAlertClass = 'animate-ready-order';

        let statusHTML = `<span class="px-3 py-1 rounded-full text-xs border ${statusClass} inline-block">${statusVal}</span>`;
        if (statusVal === 'جاهز') {
            statusHTML = `
            <div class="flex gap-2 justify-center">
                <button onclick="window.openMergeModal(${order.id})" class="px-4 py-1.5 rounded-lg text-xs border border-blue-500 bg-blue-500/20 text-blue-300 font-bold hover:bg-blue-600 hover:text-white transition shadow-sm whitespace-nowrap">دمج</button>
                <button onclick="window.openSplitModal(${order.id})" class="px-4 py-1.5 rounded-lg text-xs border border-purple-500 bg-purple-500/20 text-purple-300 font-bold hover:bg-purple-600 hover:text-white transition shadow-sm whitespace-nowrap">تقسيم</button>
                <button onclick="window.openEditOrderModal(${order.id})" class="px-4 py-1.5 rounded-lg text-xs border border-blue-500 bg-blue-500/20 text-blue-300 font-bold hover:bg-blue-600 hover:text-white transition shadow-sm whitespace-nowrap">تعديل</button>
                <button id="btn-pay-${order.id}" onclick="window.handlePaymentToggle(${order.id})" class="px-4 py-1.5 rounded-lg text-xs border border-brand bg-brand text-black font-bold hover:bg-brand-dark transition shadow-md whitespace-nowrap">تحصيل</button>
            </div>`;
        }

        tableHTML += `<tr class="hover:bg-gray-750 transition duration-150 ${rowAlertClass}"><td class="p-4 text-right font-mono font-bold text-white">${order.dailySequence}</td><td class="p-4 text-right text-gray-400">${window.formatOrderTime(order)}</td><td class="p-4 text-right font-bold">${order.Table || 'سفري'}</td><td class="p-4 text-right truncate max-w-xs">${order.Details || '-'}</td><td class="p-4 text-left font-bold text-white">${getPrice(order).toLocaleString()} ${sysCurrency}</td><td class="p-4 text-center">${statusHTML}</td></tr>`;
    });
    tableHTML += `</tbody></table>`;
    tableContainer.innerHTML = tableHTML;
    dynamicContent.appendChild(tableContainer);
};

STATE.mergeSelection = [];

window.openMergeModal = function (preselectedId = null) {
    STATE.mergeSelection = preselectedId ? [preselectedId] : [];
    document.getElementById('merge-count').innerText = STATE.mergeSelection.length;

    const btnConfirm = document.getElementById('btn-confirm-merge');
    btnConfirm.disabled = true;
    btnConfirm.classList.add('opacity-50', 'cursor-not-allowed');
    btnConfirm.className = "bg-brand hover:bg-brand-dark text-black font-bold py-3 px-8 rounded-xl transition shadow-lg opacity-50 cursor-not-allowed";

    document.querySelector('#merge-modal h3 svg').classList.replace('text-purple-400', 'text-brand');
    document.getElementById('merge-count').classList.replace('text-purple-400', 'text-brand');

    const getStatus = (o) => (typeof o.Status === 'object' && o.Status) ? o.Status.value : o.Status;
    const eligibleOrders = STATE.processedCashierOrders.filter(o => {
        const s = getStatus(o);
        return s === 'قيد التحضير' || s === 'جاهز';
    });

    const listContainer = document.getElementById('merge-orders-list');
    listContainer.innerHTML = '';

    if (eligibleOrders.length < 2) {
        listContainer.innerHTML = '<div class="text-center text-gray-500 py-6">لا يوجد عدد كافٍ من الطلبات المفتوحة لدمجها.</div>';
        document.getElementById('merge-modal').classList.remove('hidden');
        return;
    }

    const sysCurrency = localStorage.getItem('system_currency') || 'DA';
    eligibleOrders.forEach(order => {
        const price = parseFloat((order.total || order.Total || order.price || order.Price || 0).toString().replace(/[^0-9.]/g, '')) || 0;
        const card = document.createElement('div');
        const isSelected = STATE.mergeSelection.includes(order.id);

        card.className = `flex items-center gap-4 bg-gray-900 p-3 rounded-xl border cursor-pointer transition ${isSelected ? 'border-brand bg-brand/10' : 'border-gray-700 hover:border-brand'}`;
        card.onclick = () => window.toggleMergeSelection(order.id, card);

        const checkboxHtml = isSelected ? '<svg class="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>' : '';
        const checkboxClass = isSelected ? 'border-brand bg-brand' : 'border-gray-500';

        card.innerHTML = `
            <div class="w-6 h-6 rounded border-2 flex items-center justify-center merge-checkbox transition ${checkboxClass}">${checkboxHtml}</div>
            <div class="flex-1">
                <div class="flex justify-between">
                    <span class="font-bold text-white">${order.dailySequence} - ${order.Table || 'سفري'}</span>
                    <span class="text-brand font-mono">${price} ${sysCurrency}</span>
                </div>
                <div class="text-xs text-gray-400 truncate max-w-sm mt-1">${order.Details || ''}</div>
            </div>
        `;
        card.dataset.id = order.id;
        listContainer.appendChild(card);
    });

    document.getElementById('merge-modal').classList.remove('hidden');
};

window.toggleMergeSelection = function (orderId, cardElement) {
    const checkbox = cardElement.querySelector('.merge-checkbox');
    if (STATE.mergeSelection.includes(orderId)) {
        STATE.mergeSelection = STATE.mergeSelection.filter(id => id !== orderId);
        cardElement.classList.remove('border-brand', 'bg-brand/10');
        cardElement.classList.add('border-gray-700');
        checkbox.classList.remove('border-brand', 'bg-brand');
        checkbox.classList.add('border-gray-500');
        checkbox.innerHTML = '';
    } else {
        STATE.mergeSelection.push(orderId);
        cardElement.classList.remove('border-gray-700');
        cardElement.classList.add('border-brand', 'bg-brand/10');
        checkbox.classList.remove('border-gray-500');
        checkbox.classList.add('border-brand', 'bg-brand');
        checkbox.innerHTML = '<svg class="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>';
    }

    document.getElementById('merge-count').innerText = STATE.mergeSelection.length;
    const btn = document.getElementById('btn-confirm-merge');
    if (STATE.mergeSelection.length >= 2) {
        btn.disabled = false;
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
        btn.disabled = true;
        btn.classList.add('opacity-50', 'cursor-not-allowed');
    }
};

window.closeMergeModal = function () {
    document.getElementById('merge-modal').classList.add('hidden');
    STATE.mergeSelection = [];
};

window.confirmMergeOrders = async function () {
    if (STATE.mergeSelection.length < 2) return;

    const btn = document.getElementById('btn-confirm-merge');
    const originalText = btn.innerHTML;
    btn.innerHTML = 'جاري الدمج...';
    btn.disabled = true;

    const selectedOrders = STATE.processedCashierOrders.filter(o => STATE.mergeSelection.includes(o.id));
    selectedOrders.sort((a, b) => a.id - b.id);

    const primaryOrder = selectedOrders[0];
    const secondaryOrders = selectedOrders.slice(1);

    let combinedDetails = primaryOrder.Details || "";
    let combinedPrice = parseFloat((primaryOrder.total || primaryOrder.Total || primaryOrder.price || primaryOrder.Price || 0).toString().replace(/[^0-9.]/g, '')) || 0;

    secondaryOrders.forEach(o => {
        const oPrice = parseFloat((o.total || o.Total || o.price || o.Price || 0).toString().replace(/[^0-9.]/g, '')) || 0;
        combinedPrice += oPrice;
        if (o.Details) combinedDetails += `\n-- مدمج --\n${o.Details}`;
    });

    let priceKey = 'Price';
    if ('Total' in primaryOrder) priceKey = 'Total';
    else if ('total' in primaryOrder) priceKey = 'total';
    else if ('price' in primaryOrder) priceKey = 'price';

    try {
        const updateRes = await fetch(`https://baserow.vidsai.site/api/database/rows/table/${ORDERS_TABLE_ID}/${primaryOrder.id}/?user_field_names=true`, {
            method: 'PATCH',
            headers: { "Authorization": `Token ${BASEROW_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify({ "Details": combinedDetails, [priceKey]: String(combinedPrice) })
        });
        if (!updateRes.ok) throw new Error("فشل تحديث الطلب الأساسي");

        for (const secOrder of secondaryOrders) {
            await fetch(`https://baserow.vidsai.site/api/database/rows/table/${ORDERS_TABLE_ID}/${secOrder.id}/`, {
                method: 'DELETE',
                headers: { "Authorization": `Token ${BASEROW_TOKEN}` }
            });
        }

        window.showToast("تم دمج الطلبات بنجاح ✅", "success");
        window.closeMergeModal();

        const freshData = await window.fetchOrders(ORDERS_TABLE_ID);
        window.renderCashier(freshData);

    } catch (e) {
        console.error(e);
        window.showToast("حدث خطأ أثناء عملية الدمج", "error");
    } finally {
        btn.innerHTML = originalText;
    }
};

window.openSplitModal = function (orderId) {
    const order = STATE.processedCashierOrders.find(o => o.id === orderId);
    if (!order) {
        window.showToast("لم يتم العثور على الطلب", "error");
        return;
    }
    STATE.currentSplitOrder = order;

    // Use the shared math helper for discount-aware calculations
    const calc = window._parseOrderForMath(order);

    // Store items for split selection
    STATE.splitItems = calc.items.map((item, index) => ({
        id: index,
        name: item.name,
        price: item.unitPrice,
        qty: item.qty,
        rowTotal: item.rowTotal,
        originalLine: `${item.qty}x ${item.name} = ${item.rowTotal}`,
        selected: false
    }));

    // Store the raw subtotal and the discount-adjusted final total
    STATE.splitTotalPrice = calc.subtotal;
    STATE.splitRealFinalTotal = calc.finalTotal;
    STATE.splitDiscountPercent = calc.discountPercent;
    STATE.splitDiscountAmount = calc.discountAmount;

    const titleEl = document.getElementById('split-order-title');
    if (titleEl) titleEl.innerText = `${order.dailySequence} - ${order.Table || 'سفري'}`;

    const sysCurrency = localStorage.getItem('system_currency') || 'DA';

    // Display the REAL final total (after discount) as the base for splitting
    const totalAmountEl = document.getElementById('split-total-amount');
    const manualTotalAmountEl = document.getElementById('split-manual-total-amount');

    if (calc.discountPercent > 0) {
        const discountNote = `<span class="text-green-400 text-xs mr-2">(خصم ${calc.discountPercent}%)</span>`;
        if (totalAmountEl) totalAmountEl.innerHTML = `${calc.finalTotal.toLocaleString()} ${sysCurrency} ${discountNote}`;
        if (manualTotalAmountEl) manualTotalAmountEl.innerHTML = `${calc.finalTotal.toLocaleString()} ${sysCurrency} ${discountNote}`;
    } else {
        if (totalAmountEl) totalAmountEl.innerText = `${calc.finalTotal.toLocaleString()} ${sysCurrency}`;
        if (manualTotalAmountEl) manualTotalAmountEl.innerText = `${calc.finalTotal.toLocaleString()} ${sysCurrency}`;
    }

    STATE.splitPersonCount = 2;
    window.setSplitMode('even');
    document.getElementById('split-modal').classList.remove('hidden');
};

window.closeSplitModal = function () {
    STATE.currentSplitOrder = null;
    STATE.splitItems = [];
    STATE.splitTotalPrice = 0;
    STATE.splitRealFinalTotal = 0;
    STATE.splitDiscountPercent = 0;
    STATE.splitDiscountAmount = 0;
    document.getElementById('split-modal').classList.add('hidden');
};

window.setSplitMode = function (mode) {
    STATE.splitMode = mode;
    
    const btnEven = document.getElementById('split-tab-even');
    const btnManual = document.getElementById('split-tab-manual');
    const secEven = document.getElementById('split-even-section');
    const secManual = document.getElementById('split-manual-section');

    if (mode === 'even') {
        if (secEven) secEven.classList.remove('hidden');
        if (secManual) secManual.classList.add('hidden');
        if (btnEven) { btnEven.classList.add('bg-brand', 'text-black'); btnEven.classList.remove('bg-gray-800', 'text-white'); }
        if (btnManual) { btnManual.classList.add('bg-gray-800', 'text-white'); btnManual.classList.remove('bg-brand', 'text-black'); }

        window.updateSplitPersonCount(0);
    } else {
        if (secManual) secManual.classList.remove('hidden');
        if (secEven) secEven.classList.add('hidden');
        if (btnManual) { btnManual.classList.add('bg-brand', 'text-black'); btnManual.classList.remove('bg-gray-800', 'text-white'); }
        if (btnEven) { btnEven.classList.add('bg-gray-800', 'text-white'); btnEven.classList.remove('bg-brand', 'text-black'); }

        window.renderSplitItems();
    }
};

window.updateSplitPersonCount = function (delta) {
    STATE.splitPersonCount = Math.max(2, Math.min(20, (STATE.splitPersonCount || 2) + delta));
    const countEl = document.getElementById('split-person-count');
    if (countEl) countEl.innerText = STATE.splitPersonCount;

    // Use the REAL final total (after discount) for even split
    const realTotal = STATE.splitRealFinalTotal || STATE.splitTotalPrice;
    const shareAmount = Math.ceil(realTotal / STATE.splitPersonCount);

    const evenShareEl = document.getElementById('split-even-share');
    const currentAmountEl = document.getElementById('split-current-amount');
    const sysCurrency = localStorage.getItem('system_currency') || 'DA';

    if (evenShareEl) evenShareEl.innerText = `${shareAmount} ${sysCurrency}`;
    if (currentAmountEl) currentAmountEl.innerText = `${shareAmount} ${sysCurrency}`;
};

window.renderSplitItems = function () {
    const list = document.getElementById('split-items-list');
    if (!list) return;
    list.innerHTML = '';
    const sysCurrency = localStorage.getItem('system_currency') || 'DA';

    STATE.splitItems.forEach((item, index) => {
        const rowTotal = item.price * item.qty;
        const itemHtml = `
            <div class="flex items-center justify-between bg-gray-800 p-3 rounded-xl border ${item.selected ? 'border-brand shadow-[0_0_8px_rgba(255,153,0,0.2)]' : 'border-gray-700'} cursor-pointer hover:bg-gray-750 transition" onclick="window.toggleSplitItem(${index})">
                <div class="flex items-center gap-3">
                    <div class="w-6 h-6 rounded border ${item.selected ? 'border-brand bg-brand text-black' : 'border-gray-500 bg-gray-900'} flex items-center justify-center transition">
                        ${item.selected ? '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>' : ''}
                    </div>
                    <span class="text-white font-bold text-sm select-none">${item.qty}x ${item.name}</span>
                </div>
                <span class="text-brand font-mono font-bold select-none">${rowTotal.toLocaleString()} ${sysCurrency}</span>
            </div>
        `;
        list.insertAdjacentHTML('beforeend', itemHtml);
    });

    // Calculate selection totals using the real final total (discount-aware)
    const selectedTotal = STATE.splitItems.filter(i => i.selected).reduce((sum, i) => sum + (i.price * i.qty), 0);
    const realFinalTotal = STATE.splitRealFinalTotal || STATE.splitTotalPrice;
    const remaining = realFinalTotal - selectedTotal;

    const selEl = document.getElementById('split-selected-total');
    const remEl = document.getElementById('split-remaining-total');
    const curEl = document.getElementById('split-current-amount');

    if (selEl) selEl.innerText = `${selectedTotal.toLocaleString()} ${sysCurrency}`;
    if (remEl) {
        remEl.innerText = `${remaining.toLocaleString()} ${sysCurrency}`;
        remEl.className = remaining < 0
            ? 'text-red-400 font-bold text-lg'
            : 'text-gray-300 font-bold text-lg';
    }
    if (curEl) curEl.innerText = `${selectedTotal.toLocaleString()} ${sysCurrency}`;
};

window.toggleSplitItem = function (index) {
    if (STATE.splitItems[index]) {
        STATE.splitItems[index].selected = !STATE.splitItems[index].selected;
        window.renderSplitItems();
    }
};

window.confirmSplitPayment = async function (shouldPrint) {
    const order = STATE.currentSplitOrder;
    if (!order) return;

    const btn = document.getElementById('btn-confirm-split');
    const originalText = btn ? btn.innerHTML : 'تأكيد ودفع';
    if (btn) {
        btn.innerHTML = 'جاري التنفيذ...';
        btn.disabled = true;
    }

    let priceKey = 'Total';
    if ('Total' in order) priceKey = 'Total';
    else if ('total' in order) priceKey = 'total';
    else if ('Price' in order) priceKey = 'Price';
    else if ('price' in order) priceKey = 'price';

    try {
        if (STATE.splitMode === 'even') {
            const count = STATE.splitPersonCount;
            const realTotal = STATE.splitRealFinalTotal || STATE.splitTotalPrice;
            const shareAmount = Math.ceil(realTotal / count);

            for (let i = 1; i < count; i++) {
                const payload = {
                    "Details": `حصة من تقسيم #${order.dailySequence}`,
                    [priceKey]: String(shareAmount),
                    "Table": order.Table || 'سفري',
                    "Status": "مدفوع",
                    "order_type": order.order_type || "quick"
                };
                const res = await fetch(`https://baserow.vidsai.site/api/database/rows/table/${ORDERS_TABLE_ID}/?user_field_names=true`, {
                    method: 'POST',
                    headers: { "Authorization": `Token ${BASEROW_TOKEN}`, "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error("Failed to create split order share");
            }

            const patchPayload = {
                "Details": `${order.Details || ''}\n-- تم تقسيم الفاتورة (بالتساوي على ${count} أشخاص) --`,
                [priceKey]: String(shareAmount),
                "Status": "مدفوع"
            };

            const patchRes = await fetch(`https://baserow.vidsai.site/api/database/rows/table/${ORDERS_TABLE_ID}/${order.id}/?user_field_names=true`, {
                method: 'PATCH',
                headers: { "Authorization": `Token ${BASEROW_TOKEN}`, "Content-Type": "application/json" },
                body: JSON.stringify(patchPayload)
            });
            if (!patchRes.ok) throw new Error("Failed to patch original order");

            if (shouldPrint && typeof window.printReceipt === 'function') {
                for (let i = 1; i <= count; i++) {
                    setTimeout(() => {
                        window.printReceipt({
                            ...order,
                            dailySequence: `${order.dailySequence} (حصة ${i})`,
                            Details: `حصة ${i} من ${count}\n${patchPayload.Details}`,
                            [priceKey]: String(shareAmount)
                        });
                    }, i * 1500);
                }
            }

        } else if (STATE.splitMode === 'manual') {
            const selectedItems = STATE.splitItems.filter(i => i.selected);
            if (selectedItems.length === 0) {
                window.showToast("الرجاء تحديد صنف واحد على الأقل", "error");
                if (btn) { btn.innerHTML = originalText; btn.disabled = false; }
                return;
            }

            const newDetails = selectedItems.map(i => i.originalLine).join('\n');
            const newTotal = selectedItems.reduce((sum, i) => sum + (i.price * i.qty), 0);

            const postPayload = {
                "Details": newDetails,
                [priceKey]: String(newTotal),
                "Table": order.Table || 'سفري',
                "Status": "مدفوع",
                "order_type": order.order_type || "quick"
            };

            const res = await fetch(`https://baserow.vidsai.site/api/database/rows/table/${ORDERS_TABLE_ID}/?user_field_names=true`, {
                method: 'POST',
                headers: { "Authorization": `Token ${BASEROW_TOKEN}`, "Content-Type": "application/json" },
                body: JSON.stringify(postPayload)
            });
            if (!res.ok) throw new Error("Failed to create manual split order");

            const remainingItems = STATE.splitItems.filter(i => !i.selected);
            const remainingDetails = remainingItems.map(i => i.originalLine).join('\n');
            const remainingTotal = remainingItems.reduce((sum, i) => sum + (i.price * i.qty), 0);
            
            const rawCurrentStatus = (typeof order.Status === 'object' && order.Status !== null) ? order.Status.value : order.Status;
            const currentStatus = rawCurrentStatus || "جاهز";
            const newStatus = remainingItems.length === 0 ? "مدفوع" : currentStatus;

            const patchPayload = {
                "Details": remainingDetails,
                [priceKey]: String(remainingTotal),
                "Status": newStatus
            };

            const patchRes = await fetch(`https://baserow.vidsai.site/api/database/rows/table/${ORDERS_TABLE_ID}/${order.id}/?user_field_names=true`, {
                method: 'PATCH',
                headers: { "Authorization": `Token ${BASEROW_TOKEN}`, "Content-Type": "application/json" },
                body: JSON.stringify(patchPayload)
            });
            if (!patchRes.ok) throw new Error("Failed to patch original order - manual mode");

            if (shouldPrint && typeof window.printReceipt === 'function') {
                setTimeout(() => {
                    window.printReceipt({
                        ...order,
                        dailySequence: `${order.dailySequence} (حصة)`,
                        Details: newDetails,
                        [priceKey]: String(newTotal)
                    });
                }, 500);
            }
        }

        window.showToast("تم تقسيم الفاتورة بنجاح ✅", "success");
        const freshData = await window.fetchOrders(ORDERS_TABLE_ID);
        STATE.lastFetchedOrders = freshData;
        STATE.latestKdsOrders = freshData;
        
        const currentView = STATE.currentActiveView || localStorage.getItem(STATE.storageKeys.lastView);
        if (currentView === 'cashier') {
            window.renderCashier(freshData);
        } else if (currentView === 'tables') {
            window.renderTableView();
        } else if (currentView === 'kds') {
            window.renderKDS(freshData);
        }
        window.showSuccessPopup();

    } catch (e) {
        console.warn("Split Billing Error:", e);
        window.showToast("حدث خطأ أثناء التقسيم، راجع الـ Console", "error");
    } finally {
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
};