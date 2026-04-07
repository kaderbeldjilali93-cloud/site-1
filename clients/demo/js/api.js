// =========================================================
// 🌐 API Calls (دوال الاتصال بقاعدة بيانات Baserow)
// =========================================================

window.fetchOrders = async function (tableId) {
    try {
        const response = await fetch(`https://baserow.vidsai.site/api/database/rows/table/${tableId}/?user_field_names=true`, {
            method: 'GET',
            headers: { "Authorization": `Token ${BASEROW_TOKEN}` }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.results.reverse();
    } catch (error) {
        console.warn("API Fetch Error (Silent Fail):", error.message);
        return STATE.lastFetchedOrders || [];
    }
};

window.fetchMenu = async function () {
    try {
        const response = await fetch(`https://baserow.vidsai.site/api/database/rows/table/${MENU_TABLE_ID}/?user_field_names=true`, {
            method: 'GET',
            headers: { "Authorization": `Token ${BASEROW_TOKEN}` }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        const todayStr = window.getLocalYYYYMMDD();
        const lastAutoResetDate = localStorage.getItem('last_auto_reset_date');

        if (lastAutoResetDate !== todayStr) {
            const itemsToReset = data.results.filter(item => {
                const availVal = (typeof item.Availability === 'object' && item.Availability) ? item.Availability.value : item.Availability;
                return availVal === 'نفذت الكمية';
            });

            if (itemsToReset.length > 0) {
                itemsToReset.forEach(item => {
                    if (typeof item.Availability === 'object' && item.Availability !== null) {
                        item.Availability.value = 'متوفر';
                    } else {
                        item.Availability = 'متوفر';
                    }
                    fetch(`https://baserow.vidsai.site/api/database/rows/table/${MENU_TABLE_ID}/${item.id}/?user_field_names=true`, {
                        method: 'PATCH',
                        headers: { "Authorization": `Token ${BASEROW_TOKEN}`, "Content-Type": "application/json" },
                        body: JSON.stringify({ "Availability": "متوفر" })
                    }).catch(err => console.warn("Silent auto-reset failed:", err));
                });
            }
            localStorage.setItem('last_auto_reset_date', todayStr);
        }

        return data.results;
    } catch (error) {
        console.warn("Menu Fetch Error (Silent Fail):", error.message);
        return STATE.cachedMenuItems || [];
    }
};

window.updateOrderStatus = async function (rowId, newStatus) {
    const btn = document.getElementById(`btn-done-${rowId}`);
    if (btn) { btn.innerHTML = `...`; btn.disabled = true; }

    try {
        await fetch(`https://baserow.vidsai.site/api/database/rows/table/${ORDERS_TABLE_ID}/${rowId}/?user_field_names=true`, {
            method: 'PATCH',
            headers: { "Authorization": `Token ${BASEROW_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify({ "Status": newStatus })
        });
        const data = await window.fetchOrders(ORDERS_TABLE_ID);
        STATE.latestKdsOrders = data;
        STATE.lastFetchedOrders = data;

        const currentView = localStorage.getItem(STATE.storageKeys.lastView);
        if (STATE.currentRole === 'kitchen' || currentView === 'kds') {
            window.renderKDS(data);
        } else if (currentView === 'cashier') {
            window.renderCashier(data);
        } else if (currentView === 'analytics') {
            window.renderAnalytics(data, 'today');
        } else {
            window.renderKDS(data);
        }
        window.showToast("تم تحديث حالة الطلب بنجاح ✅", "success");
    } catch (error) {
        console.warn("API Error:", error.message);
        window.showToast("فشل تحديث الحالة. تأكد من الاتصال.", "error");
        if (btn) { btn.innerHTML = 'جاهز ✅'; btn.disabled = false; }
    }
};

window.updateMenuItem = async function (rowId, updateData, btnId = null) {
    const btn = btnId ? document.getElementById(btnId) : null;
    let originalBtnText = '';

    if (btn) {
        originalBtnText = btn.innerHTML;
        btn.innerHTML = `<div class="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current"></div> جاري...`;
        btn.disabled = true;
        btn.classList.add('opacity-70', 'cursor-not-allowed', 'flex', 'items-center', 'justify-center', 'gap-2');
    }

    try {
        const response = await fetch(`https://baserow.vidsai.site/api/database/rows/table/${MENU_TABLE_ID}/${rowId}/?user_field_names=true`, {
            method: 'PATCH',
            headers: { "Authorization": `Token ${BASEROW_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify(updateData)
        });

        if (!response.ok) {
            throw new Error("فشل الاتصال بقاعدة البيانات");
        }

        const data = await window.fetchMenu();

        const currentView = localStorage.getItem(STATE.storageKeys.lastView);
        if (currentView === 'menu_promo') {
            window.renderPromoEditor(data);
        } else {
            window.renderMenuEditor(data);
        }

        window.showSuccessPopup();
    } catch (error) {
        console.warn("API Error:", error.message);
        window.showToast(error.message || "فشل تحديث العنصر.", "error");
    } finally {
        if (btn) {
            btn.innerHTML = originalBtnText;
            btn.disabled = false;
            btn.classList.remove('opacity-70', 'cursor-not-allowed', 'flex', 'items-center', 'justify-center', 'gap-2');
        }
    }
};

window.fetchWaiterCalls = async function () {
    try {
        const response = await fetch(`https://baserow.vidsai.site/api/database/rows/table/${CALLS_TABLE_ID}/?user_field_names=true&size=100`, {
            method: 'GET',
            headers: { "Authorization": `Token ${BASEROW_TOKEN}` }
        });
        if (!response.ok) return;
        const data = await response.json();
        const results = data.results;

        const currentActiveCalls = [];
        const currentActiveRows = {};
        const newCallIds = [];

        results.forEach(row => {
            let rawStatus = row.status || row.Status;
            if (typeof rawStatus === 'object' && rawStatus !== null && rawStatus.value) rawStatus = rawStatus.value;
            const statusVal = String(rawStatus || '').trim();

            if (statusVal === 'قيد الانتظار') {
                const rawTable = row.table || row.Table;
                const tableNum = parseInt(String(rawTable || '').trim());
                if (!isNaN(tableNum)) {
                    currentActiveCalls.push(tableNum);
                    currentActiveRows[tableNum] = row.id;
                    if (!STATE.activeCalls.includes(tableNum)) newCallIds.push(tableNum);
                }
            }
        });

        if (newCallIds.length > 0) {
            if (!STATE.isMuted) { new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(() => { }); }
            newCallIds.forEach(t => window.showToast(`نداء جديد من طاولة ${t}`, "success"));
        }

        STATE.activeCalls = currentActiveCalls;
        STATE.activeCallRows = currentActiveRows;

        const badge = document.getElementById('tables-badge');
        if (badge) {
            if (STATE.activeCalls.length > 0) badge.classList.remove('hidden');
            else badge.classList.add('hidden');
        }

        if (localStorage.getItem(STATE.storageKeys.lastView) === 'tables') window.renderTableView();

    } catch (e) {
        console.warn("Failed to fetch waiter calls (Network Error):", e.message);
    }
};

window.resolveTableCall = async function (tableNum) {
    const rowId = STATE.activeCallRows[tableNum];
    if (!rowId) {
        window.showToast("خطأ: لا يمكن العثور على معرف النداء", "error");
        return;
    }

    try {
        const response = await fetch(`https://baserow.vidsai.site/api/database/rows/table/${CALLS_TABLE_ID}/${rowId}/?user_field_names=true`, {
            method: 'PATCH',
            headers: {
                "Authorization": `Token ${BASEROW_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ "status": "تمت الاستجابة" })
        });
        if (!response.ok) throw new Error("API Error");
    } catch (e) {
        console.warn("Failed to update call status on server, updating UI locally:", e.message);
    }

    STATE.activeCalls = STATE.activeCalls.filter(t => t !== tableNum);
    delete STATE.activeCallRows[tableNum];

    window.renderTableView();

    const badge = document.getElementById('tables-badge');
    if (badge) {
        if (STATE.activeCalls.length > 0) badge.classList.remove('hidden');
        else badge.classList.add('hidden');
    }

    window.showToast(`تمت الاستجابة للطاولة ${tableNum}`, 'success');
    window.fetchWaiterCalls().catch(() => console.warn("Sync failed"));
};