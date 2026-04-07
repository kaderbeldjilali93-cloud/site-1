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

window.handlePaymentToggle = function (rowId) {
    const order = STATE.processedCashierOrders.find(o => o.id === rowId);
    if (!order) return;

    STATE.currentCheckoutOrder = order;

    const price = parseFloat((order.total || order.Total || order.price || order.Price || 0).toString().replace(/[^0-9.]/g, '')) || 0;
    const tableStr = order.Table || order.table || 'سفري';
    const sysCurrency = localStorage.getItem('system_currency') || 'DA';

    document.getElementById('checkout-title').innerText = `تأكيد الدفع: الطلب ${order.dailySequence} - ${tableStr}`;
    document.getElementById('checkout-amount').innerText = `${price.toLocaleString()} ${sysCurrency}`;

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
    const payBtn = document.getElementById(`btn-pay-${rowId}`);
    let originalHTML = '';
    let originalClassName = '';

    if (payBtn) {
        originalHTML = payBtn.innerHTML;
        originalClassName = payBtn.className;

        payBtn.innerHTML = 'مدفوع';
        payBtn.className = 'px-3 py-1 rounded-full text-xs border border-blue-700 bg-blue-800 text-white font-bold transition shadow-lg pointer-events-none whitespace-nowrap';
    }

    const updateLocalStatus = (ordersArray) => {
        if (!ordersArray) return;
        const order = ordersArray.find(o => o.id === rowId);
        if (order) {
            if (typeof order.Status === 'object' && order.Status !== null) {
                order.Status.value = 'مدفوع';
            } else {
                order.Status = 'مدفوع';
            }
        }
    };
    updateLocalStatus(STATE.lastFetchedOrders);
    updateLocalStatus(STATE.latestKdsOrders);
    updateLocalStatus(STATE.processedCashierOrders);

    if (shouldPrint) {
        const orderToPrint = STATE.processedCashierOrders.find(o => o.id === rowId);
        if (orderToPrint) window.printReceipt(orderToPrint);
    }

    try {
        await fetch(`https://baserow.vidsai.site/api/database/rows/table/${ORDERS_TABLE_ID}/${rowId}/?user_field_names=true`, {
            method: 'PATCH',
            headers: {
                "Authorization": `Token ${BASEROW_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ "Status": 'مدفوع' })
        });

        window.showToast("تم تأكيد الدفع بنجاح", "success");

        setTimeout(async () => {
            try {
                const currentView = localStorage.getItem(STATE.storageKeys.lastView);
                if (currentView === 'cashier') {
                    window.renderCashier(STATE.lastFetchedOrders);
                } else if (currentView === 'analytics') {
                    window.renderAnalytics(STATE.analyticsData, 'today');
                }

                const freshData = await window.fetchOrders(ORDERS_TABLE_ID);
                STATE.latestKdsOrders = freshData;
                STATE.lastFetchedOrders = freshData;

            } catch (e) {
                console.warn("حدث خطأ أثناء المزامنة بعد التأخير:", e);
            }
        }, 2000);

    } catch (error) {
        console.warn("API Error:", error.message);
        window.showToast("فشل تأكيد الدفع. تأكد من الاتصال.", "error");

        const revertLocalStatus = (ordersArray) => {
            if (!ordersArray) return;
            const order = ordersArray.find(o => o.id === rowId);
            if (order) {
                if (typeof order.Status === 'object' && order.Status !== null) {
                    order.Status.value = 'جاهز';
                } else {
                    order.Status = 'جاهز';
                }
            }
        };
        revertLocalStatus(STATE.lastFetchedOrders);
        revertLocalStatus(STATE.latestKdsOrders);
        revertLocalStatus(STATE.processedCashierOrders);

        if (payBtn) {
            payBtn.innerHTML = originalHTML;
            payBtn.className = originalClassName;
        }
    }
};

window.printReceipt = function (order) {
    const printSec = document.getElementById('print-section');
    const price = parseFloat((order.total || order.Total || order.price || order.Price || 0).toString().replace(/[^0-9.]/g, '')) || 0;
    const tableStr = order.Table || order.table || 'سفري';
    const dateStr = new Date().toLocaleString('ar-DZ');
    const sysCurrency = localStorage.getItem('system_currency') || 'DA';

    const rName = localStorage.getItem('menu_restaurant_name') || 'RestoPro';
    const rTop = localStorage.getItem('print_receipt_top') || 'أهلاً بكم في مطعمنا';
    const rBottom = localStorage.getItem('print_receipt_bottom') || 'شكراً لزيارتكم!';
    const rQrCode = localStorage.getItem('print_qr_code') || '';

    const detailsList = (order.Details || "").split(/[\n،,]/).filter(i => i.trim() !== "");
    let itemsHtml = '';
    detailsList.forEach(item => {
        let text = item.trim();
        if (text !== '') {
            let itemName = text;
            let itemPrice = '';

            if (text.includes('=')) {
                let parts = text.split('=');
                itemName = parts[0].trim();
                itemPrice = parts[1].trim();
            } else if (text.includes('-')) {
                let parts = text.split('-');
                let lastPart = parts[parts.length - 1].trim();
                if (/^[\d\.]+/.test(lastPart)) {
                    itemPrice = lastPart;
                    parts.pop();
                    itemName = parts.join('-').trim();
                }
            }

            itemsHtml += `<div style="display:flex; justify-content:space-between; margin-bottom: 6px; font-size: 11px;">
                <span style="flex:1;">${itemName}</span>
                <span style="font-weight:bold; white-space:nowrap; margin-left: 8px;">${itemPrice}</span>
            </div>`;
        }
    });

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
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; margin-bottom: 12px; background-color: #f0f0f0; padding: 4px;">
            <span>المجموع:</span>
            <span>${price.toLocaleString()} ${sysCurrency}</span>
        </div>
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

window.renderCashier = function (orders) {
    STATE.lastFetchedOrders = orders;
    const getPrice = (o) => parseFloat((o.total || o.Total || o.price || o.Price || 0).toString().replace(/[^0-9.]/g, '')) || 0;
    const getStatus = (o) => (typeof o.Status === 'object' && o.Status) ? o.Status.value : o.Status;
    const sysCurrency = localStorage.getItem('system_currency') || 'DA';

    let baseOrders = orders.filter(o => {
        const time = o['Created at'] || o.Time || o.time || o.created_on;
        return window.isOrderFromSelectedDate(time, STATE.selectedCashierDate);
    });

    baseOrders = window.calculateDailySequence(baseOrders);
    baseOrders = window.processOrderAlerts(baseOrders);
    STATE.processedCashierOrders = baseOrders;

    let filteredOrders = STATE.cashierStatusFilter === 'الكل'
        ? baseOrders
        : baseOrders.filter(o => getStatus(o) === STATE.cashierStatusFilter);

    const dynamicContent = document.getElementById('dynamic-content');
    if (!dynamicContent) return;
    dynamicContent.innerHTML = '';

    let totalSales = 0; baseOrders.forEach(o => totalSales += getPrice(o));
    const avgOrderValue = baseOrders.length > 0 ? (totalSales / baseOrders.length).toFixed(2) : 0;

    const tableHeader = document.createElement('div');
    tableHeader.className = "flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sticky top-0 bg-gray-800 py-4 -mx-6 -mt-6 px-6 pt-6 z-30 border-b border-gray-700 gap-4";
    tableHeader.innerHTML = `
        <div class="flex items-center gap-3">
            <span class="live-indicator" title="تحديث مباشر"></span>
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

    const kpiSection = document.createElement('div');
    kpiSection.className = "grid grid-cols-1 md:grid-cols-3 gap-6 mb-8";
    kpiSection.innerHTML = `
        <div class="bg-gray-800 p-5 rounded-xl border-r-4 border-brand shadow-lg"><p class="text-gray-400 text-sm mb-1">إجمالي المبيعات</p><h3 class="text-3xl font-bold text-white">${totalSales.toLocaleString()} <span class="text-sm text-brand">${sysCurrency}</span></h3></div>
        <div class="bg-gray-800 p-5 rounded-xl border-r-4 border-blue-500 shadow-lg"><p class="text-gray-400 text-sm mb-1">إجمالي الطلبات</p><h3 class="text-3xl font-bold text-white">${baseOrders.length}</h3></div>
        <div class="bg-gray-800 p-5 rounded-xl border-r-4 border-green-500 shadow-lg"><p class="text-gray-400 text-sm mb-1">متوسط السلة</p><h3 class="text-3xl font-bold text-white">${avgOrderValue} <span class="text-sm text-green-500">${sysCurrency}</span></h3></div>
    `;
    dynamicContent.appendChild(kpiSection);

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

    const tableContainer = document.createElement('div');
    tableContainer.className = "overflow-x-auto bg-gray-800 rounded-lg shadow border border-gray-700";
    let tableHTML = `<table class="w-full text-left border-collapse"><thead><tr class="bg-gray-700 text-gray-300 text-sm"><th class="p-4 text-right">رقم الطلب</th><th class="p-4 text-right">الوقت</th><th class="p-4 text-right">الطاولة</th><th class="p-4 text-right w-1/3">التفاصيل</th><th class="p-4 text-left">السعر</th><th class="p-4 text-center">الحالة الإجراء</th></tr></thead><tbody class="divide-y divide-gray-700 text-gray-300 text-sm">`;

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
                <button onclick="window.openEditOrderModal(${order.id})" class="px-4 py-1.5 rounded-lg text-xs border border-blue-500 bg-blue-500/20 text-blue-300 font-bold hover:bg-blue-600 hover:text-white transition shadow-sm whitespace-nowrap">تعديل</button>
                <button id="btn-pay-${order.id}" onclick="window.handlePaymentToggle(${order.id})" class="px-4 py-1.5 rounded-lg text-xs border border-brand bg-brand text-black font-bold hover:bg-brand-dark transition shadow-md whitespace-nowrap">تحصيل</button>
            </div>`;
        }

        tableHTML += `<tr class="hover:bg-gray-750 transition duration-150 ${rowAlertClass}"><td class="p-4 text-right font-mono font-bold text-white">${order.dailySequence}</td><td class="p-4 text-right text-gray-400">${window.formatOrderTime(order)}</td><td class="p-4 text-right font-bold">${order.Table || 'Takeaway'}</td><td class="p-4 text-right truncate max-w-xs">${order.Details || '-'}</td><td class="p-4 text-left font-bold text-white">${getPrice(order).toLocaleString()} ${sysCurrency}</td><td class="p-4 text-center">${statusHTML}</td></tr>`;
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