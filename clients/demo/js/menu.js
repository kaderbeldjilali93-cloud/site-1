// =========================================================
// 🍔 Menu & Order Editing Logic (المنيو وتعديل الطلبات)
// =========================================================

// --- 1. دوال تعديل وإنشاء الطلبات ---

window.openEditOrderModal_DrawMenu = async function (categoryToSelect = null) {
    if (!STATE.cachedMenuItems) {
        STATE.cachedMenuItems = await window.fetchMenu();
    }

    const grid = document.getElementById('edit-menu-grid');
    const catContainer = document.getElementById('edit-menu-categories');
    const sysCurrency = localStorage.getItem('system_currency') || 'DA';

    // 1. استخراج كل التصنيفات الفريدة
    const availableItems = STATE.cachedMenuItems.filter(item => {
        const avail = (typeof item.Availability === 'object' && item.Availability) ? item.Availability.value : item.Availability;
        return avail !== 'نفذت الكمية';
    });

    const categories = [...new Set(availableItems.map(item =>
        (typeof item.Category === 'object' && item.Category) ? item.Category.value : (item.Category || 'أخرى')
    ))];

    if (!categoryToSelect && categories.length > 0) categoryToSelect = categories[0];

    // 2. رسم تصنيفات (Tabs)
    catContainer.innerHTML = categories.map(cat => `
        <button onclick="window.openEditOrderModal_DrawMenu('${cat}')" 
            class="px-5 py-2 rounded-xl whitespace-nowrap font-bold text-xs transition-all ${categoryToSelect === cat ? 'bg-brand text-black shadow-lg shadow-brand/20 scale-105' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}">
            ${cat}
        </button>
    `).join('');

    // 3. رسم الأصناف (Cards with Images)
    grid.innerHTML = '';
    const filteredItems = availableItems.filter(item => {
        const cat = (typeof item.Category === 'object' && item.Category) ? item.Category.value : (item.Category || 'أخرى');
        return cat === categoryToSelect;
    });

    filteredItems.forEach(item => {
        const name = item.Name || item.name;
        const price = parseFloat(item.PromoPrice || item.promoprice) || parseFloat(item.Price || item.price || 0);

        let imgUrl = 'https://placehold.co/400x300?text=Food';
        const imgField = item.image || item.Image || item.img || item.Img || item.picture || item.Picture;

        if (Array.isArray(imgField) && imgField.length > 0) {
            imgUrl = imgField[0].url || imgField[0].thumbnails?.large?.url || imgField[0].url;
        } else if (typeof imgField === 'string' && imgField.trim() !== '') {
            imgUrl = imgField;
        }

        const card = document.createElement('div');
        // توحيد طول البطاقة بالكامل (h-48) لضمان الاصطفاف
        card.className = "bg-gray-800/60 rounded-xl border border-gray-700/50 overflow-hidden hover:border-brand/50 transition-all cursor-pointer group flex flex-col h-48 shadow-lg";
        card.onclick = () => window.addItemToEditOrder(name, price);

        card.innerHTML = `
            <div class="relative h-24 shrink-0 bg-gray-900/80 flex items-center justify-center p-2">
                <img src="${imgUrl}" class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" 
                     onerror="this.src='https://placehold.co/400x300?text=Food'" alt="${name}">
                <div class="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-gray-900/40 to-transparent"></div>
            </div>
            <div class="p-3 flex flex-col justify-between flex-1">
                <span class="text-[11px] font-bold text-gray-200 line-clamp-2 leading-tight group-hover:text-brand transition-colors text-center">${name}</span>
                <div class="flex items-center justify-between mt-2">
                    <span class="text-brand font-black text-xs tabular-nums">${price.toLocaleString()} <small class="text-[8px] font-normal text-gray-500">${sysCurrency}</small></span>
                    <div class="bg-brand/10 p-1.5 rounded-lg text-brand group-hover:bg-brand group-hover:text-black transition-all">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"></path></svg>
                    </div>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
};

window.openEditOrderModal = async function (orderId) {
    const allOrders = [
        ...(STATE.processedCashierOrders || []),
        ...(STATE.lastFetchedOrders || []),
        ...(STATE.latestKdsOrders || [])
    ];
    const order = allOrders.find(o => String(o.id) === String(orderId));
    if (!order) {
        window.showToast("لم يتم العثور على بيانات الطلب", "error");
        return;
    }

    STATE.currentEditOrder = order;
    STATE.originalEditDetails = order.Details || "";
    STATE.originalEditPrice = parseFloat((order.total || order.Total || order.price || order.Price || 0).toString().replace(/[^0-9.]/g, '')) || 0;
    STATE.newlyAddedItems = [];
    
    // تحويل التفاصيل النصية إلى قائمة أصناف قابلة للحذف
    STATE.originalItemsList = [];
    if (STATE.originalEditDetails) {
        const lines = STATE.originalEditDetails.split('\n').filter(l => l.trim() !== "");
        lines.forEach(line => {
            // محاولة استخراج الاسم والسعر من الصيغة: "1x اسم المنتج = 100"
            const match = line.match(/(.*)\s*=\s*(\d+)/);
            if (match) {
                STATE.originalItemsList.push({
                    id: Math.random(),
                    text: line,
                    name: match[1].trim(),
                    price: parseFloat(match[2])
                });
            } else {
                STATE.originalItemsList.push({
                    id: Math.random(),
                    text: line,
                    name: line,
                    price: 0 // إذا لم نجد السعر نعتبره 0 لتجنب أخطاء الحساب
                });
            }
        });
    }

    const titleLabel = order.dailySequence || `#${order.id}`;
    const titleEl = document.getElementById('edit-order-title');
    if (titleEl) titleEl.innerText = `${titleLabel} - ${order.Table || 'سفري'}`;

    // إخفاء خانة اختيار الطاولة لأننا نقوم بتعديل طلب موجود مسبقاً
    const tableContainer = document.getElementById('new-order-table-container');
    if (tableContainer) tableContainer.classList.add('hidden');

    window.updateEditOrderUI();
    const modal = document.getElementById('edit-order-modal');
    if (modal) modal.classList.remove('hidden');

    window.openEditOrderModal_DrawMenu();
};

window.openNewOrderModal = async function (type = 'quick', isPreSelected = false) {
    STATE.currentEditOrder = null;
    STATE.newlyAddedItems = [];
    STATE.originalEditDetails = "";
    STATE.originalEditPrice = 0;
    STATE.newOrderType = type;

    // 1. تعبئة قائمة الطاولات المتوفرة من STATE.tableMapData
    const select = document.getElementById('manual-table-number');
    const container = document.getElementById('new-order-table-container');

    if (select) {
        select.innerHTML = '<option value="" disabled selected>إختر رقم الطاولة...</option>';
        const allRooms = [...new Set(STATE.tableMapData.map(t => t.Room).filter(Boolean))];

        allRooms.forEach(room => {
            const roomTables = STATE.tableMapData.filter(t => t.Room === room);
            if (roomTables.length > 0) {
                // إضافة اسم القاعة كخيار غير قابل للاختيار بدلاً من optgroup لتجنب السطر الأبيض
                const header = document.createElement('option');
                header.disabled = true;
                header.className = "bg-gray-800 text-brand font-bold py-2";
                header.innerText = `─── ${room} ───`;
                select.appendChild(header);

                roomTables.forEach(t => {
                    const opt = document.createElement('option');
                    // التنسيق الموحد لأسماء الطاولات عبر النظام بالكامل لضمان المزامنة في نداءات الطاولات
                    const formattedValue = `الطاولة ${t.TableNumber} - ${room}`;
                    opt.value = formattedValue;
                    opt.innerText = `طاولة ${t.TableNumber} (${room})`;
                    opt.className = "bg-gray-900 text-white";
                    select.appendChild(opt);
                });
            }
        });
    }

    if (container) {
        // إخفاء خانة اختيار الطاولة إذا كانت طاولة سريعة أو إذا تم النقر عليها مباشرة من الخريطة
        if (type === 'quick' || isPreSelected) {
            container.classList.add('hidden');
        } else {
            container.classList.remove('hidden');
        }
    }

    STATE.originalEditDetails = "";
    STATE.originalItemsList = [];

    const detailsEl = document.getElementById('edit-order-original-details');
    if (detailsEl) detailsEl.innerText = "ابدأ بإضافة الأصناف...";

    const titleEl = document.getElementById('edit-order-title');
    if (titleEl) titleEl.innerText = "طلب جديد";

    window.updateEditOrderUI();
    const modal = document.getElementById('edit-order-modal');
    if (modal) modal.classList.remove('hidden');

    window.openEditOrderModal_DrawMenu();
};

window.addItemToEditOrder = function (name, price) {
    STATE.newlyAddedItems.push({ id: Date.now() + Math.random(), name, price });
    window.updateEditOrderUI();
};

window.removeAddedItem = function (itemId) {
    STATE.newlyAddedItems = STATE.newlyAddedItems.filter(item => item.id !== itemId);
    window.updateEditOrderUI();
};

window.updateEditOrderUI = function () {
    const sysCurrency = localStorage.getItem('system_currency') || 'DA';
    const containerNew = document.getElementById('edit-order-new-items');
    const containerOriginal = document.getElementById('edit-order-original-details');
    
    if (!containerNew || !containerOriginal) return;

    // 1. رسم الأصناف الأصلية مع إمكانية الحذف
    containerOriginal.innerHTML = '';
    let currentTotal = 0;
    
    if (!STATE.currentEditOrder) {
        containerOriginal.innerHTML = '<p class="text-xs text-brand font-bold">بدء طلب جديد...</p>';
    } else if (STATE.originalItemsList.length === 0) {
        containerOriginal.innerHTML = '<p class="text-xs text-gray-500 italic">لا توجد أصناف أصلية (أو تم حذفها بالكامل).</p>';
    } else {
        STATE.originalItemsList.forEach(item => {
            currentTotal += item.price;
            containerOriginal.innerHTML += `
                <div class="flex justify-between items-center bg-gray-800/40 p-2 rounded mb-2 border border-gray-700/50">
                    <span class="text-xs text-gray-300 truncate flex-1">${item.name}</span>
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] text-gray-500 font-mono">${item.price}</span>
                        <button onclick="window.removeOriginalItem(${item.id})" class="text-red-400 hover:text-red-300 p-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                </div>
            `;
        });
    }

    // 2. رسم الأصناف الجديدة المضافة
    containerNew.innerHTML = '';
    let addedTotal = 0;
    
    if (STATE.newlyAddedItems.length === 0) {
        containerNew.innerHTML = '<p class="text-xs text-gray-500 italic bg-gray-800/40 p-2 rounded">لم يتم إضافة جديد.</p>';
    } else {
        STATE.newlyAddedItems.forEach(item => {
            addedTotal += item.price;
            containerNew.innerHTML += `
                <div class="flex justify-between items-center bg-brand/5 p-2 rounded border border-brand/20 shadow-sm animate-fade-in">
                    <span class="text-sm font-bold text-white truncate flex-1 pl-2 border-l-2 border-brand">${item.name}</span>
                    <div class="flex items-center gap-3">
                        <span class="text-sm text-brand font-mono">${item.price}</span>
                        <button onclick="window.removeAddedItem(${item.id})" class="text-red-500 hover:text-red-400 p-1.5 rounded" title="إلغاء الإضافة">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                </div>
            `;
        });
    }

    const finalPrice = currentTotal + addedTotal;
    const totalEl = document.getElementById('edit-order-total');
    if (totalEl) totalEl.innerText = `${finalPrice.toLocaleString()} ${sysCurrency}`;
};

window.removeOriginalItem = function (itemId) {
    STATE.originalItemsList = STATE.originalItemsList.filter(item => item.id !== itemId);
    window.updateEditOrderUI();
};

window.closeEditOrderModal = function () {
    const modal = document.getElementById('edit-order-modal');
    if (modal) modal.classList.add('hidden');
    STATE.currentEditOrder = null;
};

window.saveOrderEdit = async function () {
    const isNewOrder = STATE.currentEditOrder === null;

    // للطلب الجديد: يجب إضافة صنف واحد على الأقل
    // لتعديل طلب موجود: يمكن الحفظ حتى لو حذفنا أصناف فقط بدون إضافة جديدة
    if (isNewOrder && STATE.newlyAddedItems.length === 0) {
        window.showToast("الرجاء إضافة منتج للطلب", "error");
        return;
    }
    if (!isNewOrder && STATE.newlyAddedItems.length === 0 && STATE.originalItemsList.length === 0) {
        window.showToast("لا يمكن حفظ طلب فارغ بالكامل", "error");
        return;
    }

    const btn = document.getElementById('btn-save-edit');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
        btn.innerHTML = 'جاري الحفظ...';
        btn.disabled = true;
    }

    const originalTotal = STATE.originalItemsList.reduce((sum, item) => sum + item.price, 0);
    const addedTotal = STATE.newlyAddedItems.reduce((sum, item) => sum + item.price, 0);
    const finalPrice = originalTotal + addedTotal;

    const originalLines = STATE.originalItemsList.map(item => item.text).join('\n');
    const addedLines = STATE.newlyAddedItems.map(item => `1x ${item.name} = ${item.price}`).join('\n');
    
    let finalDetails = "";
    if (originalLines && addedLines) finalDetails = `${originalLines}\n${addedLines}`;
    else finalDetails = originalLines || addedLines;

    let priceKey = 'Total';
    if (!isNewOrder) {
        if ('Total' in STATE.currentEditOrder) priceKey = 'Total';
        else if ('total' in STATE.currentEditOrder) priceKey = 'total';
        else if ('price' in STATE.currentEditOrder) priceKey = 'price';
        else if ('Price' in STATE.currentEditOrder) priceKey = 'Price';
    }

    const url = isNewOrder
        ? `https://baserow.vidsai.site/api/database/rows/table/${ORDERS_TABLE_ID}/?user_field_names=true`
        : `https://baserow.vidsai.site/api/database/rows/table/${ORDERS_TABLE_ID}/${STATE.currentEditOrder.id}/?user_field_names=true`;

    const method = isNewOrder ? 'POST' : 'PATCH';

    const payload = {
        "Details": finalDetails,
        [priceKey]: String(finalPrice)
    };
    if (isNewOrder) {
        const manualTable = document.getElementById('manual-table-number')?.value || "";
        payload["Table"] = manualTable || (STATE.newOrderType === 'table' ? "طاولة جديدة" : "سفري");
        
        // إذا تم اختيار طاولة، يجب أن يكون نوع الطلب table تلقائياً لضمان التصنيف الصحيح
        if (manualTable || STATE.newOrderType === 'table') {
            payload["order_type"] = "table";
            // استخراج اسم القاعة وحفظه كحقل منفصل لتسهيل المطابقة في نداءات الطاولات والمطبخ
            const roomMatch = manualTable.match(/-\s*(.+)$/);
            if (roomMatch) payload["Room"] = roomMatch[1].trim();
        } else {
            payload["order_type"] = STATE.newOrderType || "quick";
        }
        
        payload["Status"] = "قيد التحضير";
    }

    try {
        const response = await fetch(url, {
            method: method,
            headers: { "Authorization": `Token ${BASEROW_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("Failed to save");

        window.showToast(isNewOrder ? "تم إنشاء الطلب بنجاح" : "تم تحديث الطلب بنجاح", "success");
        window.closeEditOrderModal();

        const data = await window.fetchOrders(ORDERS_TABLE_ID);
        STATE.latestKdsOrders = data;
        STATE.lastFetchedOrders = data;

        const currentView = STATE.currentActiveView || localStorage.getItem(STATE.storageKeys.lastView);
        if (STATE.currentRole === 'kitchen' || currentView === 'kds') {
            window.renderKDS(data);
        } else if (currentView === 'cashier') {
            window.renderCashier(data);
        } else if (currentView === 'tables') {
            window.renderTableView();
        }

    } catch (e) {
        window.showToast("حدث خطأ أثناء الحفظ", "error");
    } finally {
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
};

// --- 2. دوال إدارة المنيو والتعديلات السريعة ---

window.setAvailabilityState = function (id, action) {
    const statusInput = document.getElementById(`status-${id}`);
    const toggleBtn = document.getElementById(`toggle-${id}`);
    const exhaustedBtn = document.getElementById(`exhausted-${id}`);

    let currentStatus = statusInput.value;
    let newStatus = currentStatus;

    if (action === 'exhausted') {
        newStatus = 'نفذت الكمية';
    } else if (action === 'toggle') {
        if (currentStatus === 'متوفر') {
            newStatus = 'غير متوفر';
        } else {
            newStatus = 'متوفر';
        }
    }

    statusInput.value = newStatus;

    if (newStatus === 'نفذت الكمية') {
        toggleBtn.className = "text-xs px-3 py-2.5 rounded text-white transition bg-gray-600 hover:bg-gray-500";
        toggleBtn.innerText = "متوفر";
        exhaustedBtn.className = "text-xs px-3 py-2.5 rounded transition bg-red-600 text-white border-2 border-white font-bold shadow-md";
    } else if (newStatus === 'متوفر') {
        toggleBtn.className = "text-xs px-3 py-2.5 rounded text-white transition bg-green-600 hover:bg-green-700";
        toggleBtn.innerText = "متوفر";
        exhaustedBtn.className = "text-xs px-3 py-2.5 rounded transition bg-gray-700 text-gray-300 hover:bg-red-600 hover:text-white";
    } else if (newStatus === 'غير متوفر') {
        toggleBtn.className = "text-xs px-3 py-2.5 rounded text-white transition bg-red-600 hover:bg-red-700";
        toggleBtn.innerText = "غير متوفر";
        exhaustedBtn.className = "text-xs px-3 py-2.5 rounded transition bg-gray-700 text-gray-300 hover:bg-red-600 hover:text-white";
    }
};

window.renderMenuEditor = function (items) {
    const dynamicContent = document.getElementById('dynamic-content');
    if (!dynamicContent) return;
    dynamicContent.innerHTML = '';
    const sysCurrency = localStorage.getItem('system_currency') || 'DA';

    const categoryOrder = ['pizza', 'burger', 'boissons', 'suppléments'];
    items.sort((a, b) => {
        let catA = (typeof a.Category === 'object' && a.Category) ? a.Category.value : (a.Category || '');
        let catB = (typeof b.Category === 'object' && b.Category) ? b.Category.value : (b.Category || '');

        catA = String(catA).trim().toLowerCase();
        catB = String(catB).trim().toLowerCase();

        let indexA = categoryOrder.indexOf(catA);
        let indexB = categoryOrder.indexOf(catB);

        if (indexA === -1) indexA = 999;
        if (indexB === -1) indexB = 999;

        if (indexA !== indexB) {
            return indexA - indexB;
        } else {
            return (a.id || 0) - (b.id || 0);
        }
    });

    const grid = document.createElement('div');
    grid.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10";

    items.forEach(item => {
        const name = item.Name || item.name || "بدون اسم";
        const desc = item.Description || item.description || "";
        const price = item.Price || item.price || 0;
        const imgUrl = (item.image && item.image.length > 0) ? item.image[0].url : "https://placehold.co/400x300/374151/FFFFFF?text=No+Image";
        const category = (typeof item.Category === 'object' && item.Category) ? item.Category.value : (item.Category || 'عام');
        const availObj = item.Availability || item.availability;
        const availVal = (typeof availObj === 'object' && availObj) ? availObj.value : availObj;

        let currentStatus = availVal || "متوفر";
        if (!["متوفر", "غير متوفر", "نفذت الكمية"].includes(currentStatus)) {
            currentStatus = "متوفر";
        }

        let toggleClass = "";
        let toggleText = "";
        let exhaustedClass = "bg-gray-700 text-gray-300 hover:bg-red-600 hover:text-white";

        if (currentStatus === "نفذت الكمية") {
            toggleClass = "bg-gray-600 hover:bg-gray-500";
            toggleText = "متوفر";
            exhaustedClass = "bg-red-600 text-white border-2 border-white font-bold shadow-md";
        } else if (currentStatus === "متوفر") {
            toggleClass = "bg-green-600 hover:bg-green-700";
            toggleText = "متوفر";
        } else {
            toggleClass = "bg-red-600 hover:bg-red-700";
            toggleText = "غير متوفر";
        }

        const card = document.createElement('div');
        card.className = "bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-lg flex flex-col relative";

        card.innerHTML = `
            <div class="h-40 overflow-hidden relative group">
                <img src="${imgUrl}" class="w-full h-full object-cover">
                <button onclick="window.openDeleteModal(${item.id}, '${name.replace(/'/g, "\\'")}')" class="absolute top-2 left-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded shadow-lg transition opacity-0 group-hover:opacity-100" title="حذف الطبق">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
                <span class="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">${category}</span>
            </div>
            <div class="p-4 flex-1 flex flex-col gap-4">
                <div>
                    <label class="text-xs text-gray-400 block mb-1">اسم الطبق</label>
                    <input type="text" id="name-${item.id}" value="${name}" class="w-full bg-gray-900 border border-gray-600 text-white text-lg font-bold text-center rounded px-3 py-2 focus:border-brand focus:ring-1 focus:ring-brand outline-none transition shadow-inner" placeholder="اسم الطبق">
                </div>
                <div>
                    <label class="text-xs text-gray-400 block mb-1">المكونات</label>
                    <textarea id="desc-${item.id}" rows="2" class="w-full bg-gray-900 border border-gray-600 text-gray-300 text-xs rounded px-3 py-2 focus:border-brand focus:ring-1 focus:ring-brand outline-none resize-none transition" placeholder="مكونات الطبق...">${desc}</textarea>
                </div>
                <div>
                    <label class="text-xs text-gray-400 block mb-1">السعر (${sysCurrency})</label>
                    <input type="number" min="0" id="price-${item.id}" value="${price}" onfocus="this.select()" class="w-full bg-gray-900 border border-gray-600 text-white rounded px-3 py-2 focus:ring-2 focus:ring-brand outline-none transition">
                </div>
                <div class="flex items-center justify-between mt-auto pt-2 gap-2">
                    <input type="hidden" id="status-${item.id}" value="${currentStatus}">
                    <div class="flex gap-1">
                        <button id="toggle-${item.id}" onclick="window.setAvailabilityState(${item.id}, 'toggle')" class="text-xs px-3 py-2.5 rounded text-white transition ${toggleClass}">${toggleText}</button>
                        <button id="exhausted-${item.id}" onclick="window.setAvailabilityState(${item.id}, 'exhausted')" class="text-xs px-3 py-2.5 rounded transition ${exhaustedClass}">نفدت الكمية</button>
                    </div>
                    <button id="btn-save-${item.id}" onclick="window.saveMenuItem(${item.id})" class="bg-brand hover:bg-brand-dark text-black font-bold px-4 py-2.5 rounded text-sm transition shadow-md whitespace-nowrap">حفظ</button>
                </div>
            </div>`;
        grid.appendChild(card);
    });
    dynamicContent.appendChild(grid);
};

window.renderPromoEditor = function (items) {
    const dynamicContent = document.getElementById('dynamic-content');
    if (!dynamicContent) return;
    dynamicContent.innerHTML = '';
    const sysCurrency = localStorage.getItem('system_currency') || 'DA';

    const categoryOrder = ['pizza', 'burger', 'boissons', 'suppléments'];
    items.sort((a, b) => {
        let catA = (typeof a.Category === 'object' && a.Category) ? a.Category.value : (a.Category || '');
        let catB = (typeof b.Category === 'object' && b.Category) ? b.Category.value : (b.Category || '');

        catA = String(catA).trim().toLowerCase();
        catB = String(catB).trim().toLowerCase();

        let indexA = categoryOrder.indexOf(catA);
        let indexB = categoryOrder.indexOf(catB);

        if (indexA === -1) indexA = 999;
        if (indexB === -1) indexB = 999;

        if (indexA !== indexB) {
            return indexA - indexB;
        } else {
            return (a.id || 0) - (b.id || 0);
        }
    });

    const grid = document.createElement('div');
    grid.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10";

    items.forEach(item => {
        const name = item.Name || item.name || "بدون اسم";
        const price = parseFloat(item.Price || item.price || 0);
        const promoPrice = parseFloat(item.PromoPrice || item.promoprice);
        const imgUrl = (item.image && item.image.length > 0) ? item.image[0].url : "https://placehold.co/400x300/374151/FFFFFF?text=No+Image";
        const category = (typeof item.Category === 'object' && item.Category) ? item.Category.value : (item.Category || 'عام');

        let hasPromo = !isNaN(promoPrice) && promoPrice > 0 && promoPrice < price;
        let discountPercent = 0;
        if (hasPromo) {
            discountPercent = Math.round(((price - promoPrice) / price) * 100);
        }

        const card = document.createElement('div');
        card.className = `bg-gray-800 border ${hasPromo ? 'border-brand shadow-[0_0_15px_rgba(255,153,0,0.2)]' : 'border-gray-700'} rounded-xl overflow-hidden shadow-lg flex flex-col transition-all`;

        let badgeHtml = hasPromo ? `<span class="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-lg animate-pulse">-${discountPercent}% 🔥</span>` : '';

        card.innerHTML = `
            <div class="h-40 overflow-hidden relative">
                <img src="${imgUrl}" class="w-full h-full object-cover">
                <span class="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">${category}</span>
                ${badgeHtml}
            </div>
            <div class="p-4 flex-1 flex flex-col gap-3">
                <div><h3 class="text-lg font-bold text-white truncate" title="${name}">${name}</h3></div>
                
                <div class="flex justify-between items-center bg-gray-900 px-3 py-2 rounded border border-gray-700">
                    <span class="text-xs text-gray-400">السعر الأصلي</span>
                    <span class="text-sm font-bold text-gray-200 ${hasPromo ? 'line-through decoration-red-500 opacity-60' : ''}">${price} ${sysCurrency}</span>
                </div>

                <div>
                    <label class="text-xs text-brand block mb-1 font-bold">السعر الترويجي (${sysCurrency})</label>
                    <input type="number" min="0" id="promo-${item.id}" value="${hasPromo ? promoPrice : ''}" placeholder="أدخل سعر العرض..." class="w-full bg-gray-900 border border-brand text-white rounded px-3 py-2 focus:ring-2 focus:ring-brand outline-none transition">
                </div>

                <div class="flex items-center gap-2 mt-auto pt-2">
                    <button onclick="window.savePromoPrice(${item.id})" class="flex-1 bg-brand hover:bg-brand-dark text-black font-bold py-2.5 rounded transition shadow-md flex justify-center items-center gap-2">
                        <span>حفظ العرض</span>
                    </button>
                    <button onclick="window.clearPromoPrice(${item.id})" class="bg-red-600 hover:bg-red-700 text-white p-2.5 rounded transition" title="إلغاء العرض">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
            </div>`;
        grid.appendChild(card);
    });
    dynamicContent.appendChild(grid);
};

window.renderMenuAdd = async function () {
    const dynamicContent = document.getElementById('dynamic-content');
    if (!dynamicContent) return;
    dynamicContent.innerHTML = '';
    const sysCurrency = localStorage.getItem('system_currency') || 'DA';

    // جلب التصنيفات الموجودة من قاعدة البيانات
    const defaultCategories = [
        { value: 'pizza', label: 'بيتزا (Pizza)' },
        { value: 'burger', label: 'برجر (Burger)' },
        { value: 'boissons', label: 'مشروبات (Boissons)' },
        { value: 'suppléments', label: 'إضافات (Suppléments)' }
    ];
    const defaultValues = defaultCategories.map(c => c.value.toLowerCase());

    try {
        if (!STATE.cachedMenuItems || STATE.cachedMenuItems.length === 0) {
            STATE.cachedMenuItems = await window.fetchMenu();
        }
        const existingCats = new Set();
        (STATE.cachedMenuItems || []).forEach(item => {
            const cat = (typeof item.Category === 'object' && item.Category) ? item.Category.value : (item.Category || '');
            const catTrimmed = String(cat).trim();
            if (catTrimmed && !defaultValues.includes(catTrimmed.toLowerCase())) {
                existingCats.add(catTrimmed);
            }
        });
        existingCats.forEach(cat => {
            defaultCategories.push({ value: cat, label: cat });
        });
    } catch (e) {
        console.warn('Could not load existing categories:', e);
    }

    let categoryOptionsHtml = defaultCategories.map(c =>
        `<option value="${c.value}">${c.label}</option>`
    ).join('\n                            ');
    categoryOptionsHtml += '\n                            <option value="custom" class="text-brand font-bold bg-gray-800">+ إضافة تصنيف جديد...</option>';
    categoryOptionsHtml += '\n                            <option value="delete_category" class="text-red-500 font-bold bg-gray-800">- حذف تصنيف...</option>';

    const container = document.createElement('div');
    container.className = "max-w-2xl mx-auto pb-10 mt-6";

    const card = document.createElement('div');
    card.className = "bg-gray-800 border border-gray-700 rounded-2xl shadow-xl p-6 md:p-8";

    card.innerHTML = `
        <div class="space-y-8">
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">اسم الطبق <span class="text-red-500">*</span></label>
                <input type="text" id="add-name" class="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand outline-none transition" placeholder="مثال: بيتزا مارغريتا">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">الوصف / المكونات</label>
                <textarea id="add-desc" rows="3" class="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand outline-none resize-none transition" placeholder="مثال: صلصة طماطم، جبن موزاريلا، ريحان..."></textarea>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">السعر (${sysCurrency}) <span class="text-red-500">*</span></label>
                    <input type="number" min="0" id="add-price" onfocus="this.select()" class="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand outline-none transition" placeholder="مثال: 500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">التصنيف</label>
                    <div class="relative">
                        <select id="add-category" onchange="window.toggleCustomCategory(this)" class="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand outline-none transition appearance-none">
                            ${categoryOptionsHtml}
                        </select>
                        <div class="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                    <input type="text" id="custom-category-input" class="w-full bg-gray-800 border border-brand text-white rounded-lg px-4 py-3 mt-3 focus:ring-2 focus:ring-brand outline-none transition hidden shadow-inner" placeholder="اكتب اسم التصنيف الجديد هنا (مثال: طاكوس، حلويات)...">
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">صورة الطبق</label>
                <div class="w-full flex justify-center mb-3">
                    <div id="add-image-preview-container" class="hidden relative w-48 h-48 rounded-2xl border-2 border-gray-600 overflow-hidden bg-gray-900 shadow-inner group">
                        <img id="add-image-preview" src="" class="w-full h-full object-cover">
                        <button type="button" onclick="window.removeAddDishImage()" class="absolute top-2 left-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded shadow-lg transition" title="حذف الصورة">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                </div>
                <div class="relative" id="add-image-upload-wrapper">
                    <input type="file" id="add-image" accept="image/*" class="hidden" onchange="window.previewAddDishImage(this)">
                    <label for="add-image" class="w-full flex items-center justify-center gap-2 bg-gray-800 text-gray-300 font-medium rounded-lg px-4 py-3 cursor-pointer hover:bg-gray-700 transition shadow-sm border border-gray-600">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                        <span>اختر صورة...</span>
                    </label>
                </div>
                <p class="text-xs text-gray-500 mt-2">يُفضل استخدام صور واضحة ومناسبة (jpg, png).</p>
            </div>

            <div class="pt-4 mt-6 border-t border-gray-700">
                <button id="btn-submit-dish" onclick="window.submitNewDish()" class="w-full bg-brand hover:bg-brand-dark text-black font-bold text-lg py-4 rounded-xl transition shadow-lg transform hover:scale-[1.01]">
                    إضافة الطبق الآن
                </button>
            </div>
        </div>
    `;

    container.appendChild(card);
    dynamicContent.appendChild(container);
};

window.previewAddDishImage = function (input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('add-image-preview').src = e.target.result;
            document.getElementById('add-image-preview-container').classList.remove('hidden');
            document.getElementById('add-image-upload-wrapper').classList.add('hidden');
        };
        reader.readAsDataURL(input.files[0]);
    }
};

window.removeAddDishImage = function () {
    const input = document.getElementById('add-image');
    if (input) input.value = '';
    const preview = document.getElementById('add-image-preview');
    if (preview) preview.src = '';
    const container = document.getElementById('add-image-preview-container');
    if (container) container.classList.add('hidden');
    const wrapper = document.getElementById('add-image-upload-wrapper');
    if (wrapper) wrapper.classList.remove('hidden');
};

window.openDeleteModal = function (id, name) {
    currentDeleteItemId = id;
    document.getElementById('delete-item-name').innerText = name;
    document.getElementById('delete-modal').classList.remove('hidden');
};

window.closeDeleteModal = function () {
    currentDeleteItemId = null;
    document.getElementById('delete-item-name').innerText = '';
    document.getElementById('delete-modal').classList.add('hidden');
};

window.confirmDelete = async function () {
    if (!currentDeleteItemId) return;

    const btn = document.getElementById('btn-confirm-delete');
    const originalBtnText = btn.innerHTML;
    btn.innerHTML = `<div class="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div> جاري الحذف...`;
    btn.disabled = true;
    btn.classList.add('opacity-70', 'cursor-not-allowed');

    try {
        const response = await fetch(`https://baserow.vidsai.site/api/database/rows/table/${MENU_TABLE_ID}/${currentDeleteItemId}/`, {
            method: 'DELETE',
            headers: { "Authorization": `Token ${BASEROW_TOKEN}` }
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || "Failed to delete item");
        }

        window.showToast("تم حذف الطبق بنجاح", "success");
        window.closeDeleteModal();
        STATE.cachedMenuItems = null; // Fix caching issue where deleted item's category remained

        const newData = await window.fetchMenu();
        window.renderMenuEditor(newData);

    } catch (error) {
        console.error("Baserow API Error Details:", error);
        window.showToast("خطأ: " + error.message, "error");
    } finally {
        btn.innerHTML = originalBtnText;
        btn.disabled = false;
        btn.classList.remove('opacity-70', 'cursor-not-allowed');
    }
};

window.saveMenuItem = async function (id) {
    const newName = document.getElementById(`name-${id}`).value;
    const newDesc = document.getElementById(`desc-${id}`).value;
    const priceRaw = String(document.getElementById(`price-${id}`).value).trim();
    const status = document.getElementById(`status-${id}`).value;

    if (priceRaw === '' || Number(priceRaw) < 0) {
        window.showToast("الرجاء إدخال سعر صحيح", "error");
        return;
    }

    const price = Number(priceRaw);
    await window.updateMenuItem(id, { "Name": newName, "Description": newDesc, "Price": price, "Availability": status }, 'btn-save-' + id);
};

window.savePromoPrice = async function (id) {
    const promoRaw = String(document.getElementById(`promo-${id}`).value).trim();
    if (promoRaw === '' || Number(promoRaw) < 0) {
        window.showToast("الرجاء إدخال سعر ترويجي صحيح.", "error");
        return;
    }
    const promoPrice = Number(promoRaw);
    await window.updateMenuItem(id, { "PromoPrice": promoPrice }, null);
};

window.clearPromoPrice = async function (id) {
    const promoInput = document.getElementById(`promo-${id}`);
    if (promoInput) promoInput.value = '';
    await window.updateMenuItem(id, { "PromoPrice": null }, null);
};

window.submitNewDish = async function () {
    const btn = document.getElementById('btn-submit-dish');
    const nameInput = document.getElementById('add-name');
    const descInput = document.getElementById('add-desc');
    const priceInput = document.getElementById('add-price');
    const catInput = document.getElementById('add-category');
    const imgInput = document.getElementById('add-image');

    const name = nameInput.value.trim();
    const desc = descInput.value.trim();
    const priceRaw = priceInput.value.trim();
    const category = catInput.value;
    const imageFile = imgInput.files ? imgInput.files[0] : null;

    let finalCategory = category;
    if (category === 'custom') {
        finalCategory = document.getElementById('custom-category-input').value.trim();
        if (!finalCategory) {
            window.showToast("الرجاء كتابة اسم التصنيف الجديد", "error");
            document.getElementById('custom-category-input').focus();
            return;
        }
    }

    if (!name) {
        window.showToast("الرجاء إدخال اسم الطبق", "error");
        nameInput.focus();
        return;
    }

    if (priceRaw === '' || Number(priceRaw) < 0) {
        window.showToast("الرجاء إدخال سعر صحيح", "error");
        priceInput.focus();
        return;
    }

    const price = Number(priceRaw);

    const originalBtnText = btn.innerHTML;
    btn.innerHTML = `<span class="flex items-center justify-center gap-2"><div class="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-black"></div> جاري الرفع...</span>`;
    btn.disabled = true;
    btn.classList.add('opacity-70', 'cursor-not-allowed');

    try {
        let uploadedFileName = null;

        if (imageFile) {
            const formData = new FormData();
            formData.append("file", imageFile);

            const uploadResponse = await fetch(`https://baserow.vidsai.site/api/user-files/upload-file/`, {
                method: 'POST',
                headers: { "Authorization": `Token ${BASEROW_TOKEN}` },
                body: formData
            });

            if (!uploadResponse.ok) {
                const errUpload = await uploadResponse.json();
                throw new Error("فشل رفع الصورة: " + (errUpload.error || ""));
            }

            const uploadedFileObj = await uploadResponse.json();
            if (uploadedFileObj && uploadedFileObj.name) {
                uploadedFileName = uploadedFileObj.name;
            }
        }

        const payload = {
            "Name": name,
            "Description": desc,
            "Price": price,
            "Category": finalCategory,
            "Availability": "متوفر"
        };

        if (uploadedFileName) {
            payload["image"] = [{ "name": uploadedFileName }];
        }

        const response = await fetch(`https://baserow.vidsai.site/api/database/rows/table/${MENU_TABLE_ID}/?user_field_names=true`, {
            method: 'POST',
            headers: {
                "Authorization": `Token ${BASEROW_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errData = await response.json();
            let errorMsg = errData.error || "Failed to create item";
            if (errData.detail) {
                if (typeof errData.detail === 'object') {
                    const details = Object.entries(errData.detail).map(([field, msgs]) => `${field}: ${msgs.join(', ')}`).join(' | ');
                    errorMsg += " - التفاصيل: " + details;
                } else {
                    errorMsg += " - " + String(errData.detail);
                }
            }
            throw new Error(errorMsg);
        }

        window.showSuccessPopup();
        STATE.cachedMenuItems = null; // مسح الكاش لتحديث التصنيفات عند الإضافة القادمة

        nameInput.value = '';
        descInput.value = '';
        priceInput.value = '';
        if (imgInput) imgInput.value = '';
        catInput.value = 'pizza';
        window.removeAddDishImage();

        const customCatInput = document.getElementById('custom-category-input');
        if (customCatInput) {
            customCatInput.value = '';
            customCatInput.classList.add('hidden');
        }

    } catch (error) {
        console.error("Baserow API Error Details:", error);
        window.showToast("خطأ: " + error.message, "error");
    } finally {
        btn.innerHTML = originalBtnText;
        btn.disabled = false;
        btn.classList.remove('opacity-70', 'cursor-not-allowed');
    }
};

window.openDeleteCategoryModal = function () {
    const defaultCats = ['pizza', 'burger', 'boissons', 'suppléments'];
    let items = STATE.cachedMenuItems || [];
    const allCats = new Set();

    items.forEach(item => {
        let cat = (typeof item.Category === 'object' && item.Category) ? item.Category.value : (item.Category || '');
        if (cat) allCats.add(String(cat).trim());
    });

    defaultCats.forEach(c => {
        if (!allCats.has(c)) {
            allCats.add(c);
        }
    });

    let optionsHtml = Array.from(allCats).map(cat => `<option value="${cat}">${cat}</option>`).join('\n                ');

    const modalHtml = `
    <div id="delete-category-modal" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4">
        <div class="bg-gray-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-gray-700 animate-fade-in relative text-right" dir="rtl">
            <h3 class="text-xl text-red-500 font-bold mb-4 flex items-center gap-2">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                حذف تصنيف
            </h3>
            <p class="text-gray-300 text-sm mb-4">اختر تصنيفاً لحذفه نهائياً. سيتم أيضاً حذف <span class="text-red-400 font-bold text-base">جميع الأطباق</span> التابعة له.</p>
            <select id="modal-category-select" class="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-4 py-3 mb-6 focus:ring-2 focus:ring-red-500 outline-none transition appearance-none">
                ${optionsHtml}
            </select>
            <div class="flex gap-4">
                <button onclick="window.confirmDeleteAnyCategory()" class="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold transition">حذف التصنيف</button>
                <button onclick="document.getElementById('delete-category-modal').remove()" class="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-3 rounded-lg font-bold transition">إلغاء</button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
};

window.confirmDeleteAnyCategory = async function () {
    const select = document.getElementById('modal-category-select');
    if (!select) return;
    const category = select.value;
    const defaultCats = ['pizza', 'burger', 'boissons', 'suppléments', 'custom'];

    if (defaultCats.includes(category.toLowerCase())) {
        window.showToast("لا يمكن حذف التصنيفات الأساسية", "error");
        document.getElementById('delete-category-modal').remove();
        return;
    }

    if (!confirm(`تأكيد أخير: هل أنت متأكد من حذف تصنيف "${category}" بشكل نهائي مع جميع أطباقه؟`)) {
        return;
    }

    const modal = document.getElementById('delete-category-modal');
    modal.innerHTML = `
        <div class="bg-gray-800 rounded-2xl w-full max-w-sm p-8 shadow-2xl border border-gray-700 flex flex-col items-center justify-center text-center animate-fade-in">
            <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-red-500 mb-4"></div>
            <p class="text-white font-bold text-lg">جاري حذف التصنيف والأطباق...</p>
            <p class="text-gray-400 text-sm mt-2">الرجاء الانتظار</p>
        </div>`;

    try {
        let itemsToDelete = [];
        if (STATE.cachedMenuItems) {
            itemsToDelete = STATE.cachedMenuItems.filter(item => {
                const cat = (typeof item.Category === 'object' && item.Category) ? item.Category.value : (item.Category || '');
                return String(cat).trim() === category;
            });
        }

        const deletePromises = itemsToDelete.map(item =>
            fetch(`https://baserow.vidsai.site/api/database/rows/table/${MENU_TABLE_ID}/${item.id}/`, {
                method: 'DELETE',
                headers: { "Authorization": `Token ${BASEROW_TOKEN}` }
            })
        );

        await Promise.all(deletePromises);

        window.showToast("تم حذف التصنيف بنجاح", "success");
        STATE.cachedMenuItems = null;
        document.getElementById('delete-category-modal').remove();
        await window.renderMenuAdd();

    } catch (error) {
        console.error("Error deleting category:", error);
        window.showToast("حدث خطأ أثناء الحذف", "error");
        document.getElementById('delete-category-modal').remove();
    }
};