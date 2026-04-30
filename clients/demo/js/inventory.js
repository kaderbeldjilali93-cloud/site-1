// =========================================================
// 📦 Inventory Management Module (RestoPro)
// =========================================================

// Ensure global STATE array exists
window.STATE = window.STATE || {};
STATE.inventoryItems = STATE.inventoryItems || [];

// Main Render Function
window.renderInventory = async function () {
    const dynamicContent = document.getElementById('dynamic-content');
    dynamicContent.innerHTML = `
        <div class="flex flex-col items-center justify-center py-20 gap-4">
            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand"></div>
            <p class="text-brand font-medium">جاري تحميل بيانات المخزون...</p>
        </div>`;

    try {
        const _t = Date.now();
        // Fetch inventory
        const invRes = await fetch(`https://baserow.vidsai.site/api/database/rows/table/${INVENTORY_TABLE_ID}/?user_field_names=true&size=200&_t=${_t}`, {
            headers: { "Authorization": `Token ${BASEROW_TOKEN}` },
            cache: 'no-store'
        });

        if (!invRes.ok) throw new Error("فشل في تحميل المخزون");
        
        const data = await invRes.json();
        STATE.inventoryItems = data.results || [];

        // Also fetch menu if not cached (needed for recipes)
        if (!STATE.cachedMenuItems || STATE.cachedMenuItems.length === 0) {
            STATE.cachedMenuItems = await window.fetchMenu();
        }

        renderInventoryUI();
    } catch (error) {
        console.error("Inventory Load Error:", error);
        dynamicContent.innerHTML = `
            <div class="flex flex-col items-center justify-center py-20 gap-4">
                <p class="text-red-500 font-bold">حدث خطأ أثناء تحميل المخزون. يرجى التحقق من إعدادات الشبكة.</p>
                <button onclick="window.renderInventory()" class="bg-gray-800 text-white px-6 py-2 rounded-lg">إعادة المحاولة</button>
            </div>`;
    }
};

window.renderInventoryUI = function () {
    const dynamicContent = document.getElementById('dynamic-content');
    
    let totalValue = 0;
    let lowStockCount = 0;
    let uniqueItems = STATE.inventoryItems.length;

    STATE.inventoryItems.forEach(item => {
        const stock = parseFloat(item.Stock) || 0;
        const price = parseFloat(item.Unit_Price) || 0;
        const alertLimit = parseFloat(item.Alert_Limit) || 0;
        
        totalValue += (stock * price);
        if (stock <= alertLimit) lowStockCount++;
    });

    let html = `
    <div class="px-6 py-8 animate-fade-in text-white min-h-screen">
        <!-- Header -->
        <div class="flex flex-wrap justify-between items-center mb-8 gap-4">
            <div>
                <h2 class="text-3xl font-black text-white tracking-tight">إدارة المخزون</h2>
                <p class="text-gray-400 text-sm mt-1">المواد الأولية، التكاليف، والوصفات</p>
            </div>
            <div class="flex gap-3">
                <button onclick="window.showRecipeModal()" class="bg-gray-800 hover:bg-gray-700 text-brand font-bold py-2.5 px-5 rounded-xl border border-brand/30 shadow-[0_0_15px_rgba(212,175,55,0.15)] transition-all flex items-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                    ربط الوصفات
                </button>
                <button onclick="window.showInventoryModal()" class="bg-brand hover:bg-brand-dark text-black font-black py-2.5 px-6 rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-transform active:scale-95 flex items-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                    إضافة عنصر
                </button>
            </div>
        </div>

        <!-- KPIs -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="glass-3d bg-emerald-900/40 border border-emerald-500/20 p-6 rounded-2xl shadow-xl relative overflow-hidden group">
                <div class="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
                <p class="text-emerald-400 font-bold text-sm mb-1">قيمة المخزون الإجمالية</p>
                <h3 class="text-3xl font-black text-white number-font">${totalValue.toFixed(2)} <span class="text-sm font-normal text-gray-400">د.ج</span></h3>
            </div>
            <div onclick="window.filterInventory('low')" class="cursor-pointer glass-3d bg-red-900/20 border border-red-500/20 p-6 rounded-2xl shadow-xl relative overflow-hidden group hover:bg-red-900/40 transition-all">
                <div class="absolute -right-6 -top-6 w-24 h-24 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/30 transition-all"></div>
                <p class="text-red-400 font-bold text-sm mb-1">تنبيهات نقص المخزون</p>
                <h3 class="text-3xl font-black text-white number-font">${lowStockCount} <span class="text-sm font-normal text-gray-400">مكونات</span></h3>
            </div>
            <div class="glass-3d bg-gray-800/60 border border-gray-600/30 p-6 rounded-2xl shadow-xl relative overflow-hidden group">
                <div class="absolute -right-6 -top-6 w-24 h-24 bg-brand-500/10 rounded-full blur-2xl group-hover:bg-brand-500/20 transition-all"></div>
                <p class="text-gray-400 font-bold text-sm mb-1">المكونات المسجلة</p>
                <h3 class="text-3xl font-black text-white number-font">${uniqueItems}</h3>
            </div>
        </div>

        <!-- Toolbar -->
        <div class="flex flex-wrap justify-between items-center bg-gray-800/50 p-4 rounded-t-2xl border border-gray-700/50 gap-4 backdrop-blur-sm">
            <div class="relative w-full md:w-64">
                <svg class="w-5 h-5 absolute right-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                <input type="text" id="inv-search" onkeyup="window.filterInventory()" placeholder="بحث في المخزون..." class="w-full bg-gray-900 border border-gray-700 rounded-lg pr-10 pl-4 py-2 text-white focus:border-brand outline-none transition">
            </div>
            <div class="flex gap-2">
                <button onclick="window.filterInventory('all')" id="filter-all" class="inv-filter bg-brand text-black font-bold px-4 py-2 rounded-lg text-sm transition shadow-md">الكل</button>
                <button onclick="window.filterInventory('low')" id="filter-low" class="inv-filter bg-gray-700 text-gray-300 hover:bg-gray-600 font-bold px-4 py-2 rounded-lg text-sm transition">نقص المخزون</button>
            </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto bg-gray-800/40 border border-gray-700/50 rounded-b-2xl backdrop-blur-sm shadow-xl">
            <table class="w-full text-right whitespace-nowrap">
                <thead class="bg-gray-900/80 text-gray-400 text-xs uppercase tracking-wider">
                    <tr>
                        <th class="px-6 py-4 font-bold rounded-tr-lg">المكون</th>
                        <th class="px-6 py-4 font-bold">الكمية (المستوى)</th>
                        <th class="px-6 py-4 font-bold">سعر الوحدة</th>
                        <th class="px-6 py-4 font-bold">القيمة الإجمالية</th>
                        <th class="px-6 py-4 font-bold text-center rounded-tl-lg">إجراءات</th>
                    </tr>
                </thead>
                <tbody id="inventory-tbody" class="divide-y divide-gray-700/50">
                    ${generateInventoryTableHTML(STATE.inventoryItems)}
                </tbody>
            </table>
        </div>
    </div>
    
    <!-- Modals Container -->
    <div id="inv-modals-container"></div>
    `;

    dynamicContent.innerHTML = html;
    renderInventoryModals();
};

function generateInventoryTableHTML(items) {
    if (items.length === 0) {
        return `<tr><td colspan="5" class="px-6 py-8 text-center text-gray-500 font-medium">لا توجد بيانات متاحة</td></tr>`;
    }

    return items.map(item => {
        const stock = parseFloat(item.Stock) || 0;
        const price = parseFloat(item.Unit_Price) || 0;
        const limit = parseFloat(item.Alert_Limit) || 0;
        const unit = item.Unit || '';
        const name = item.Name || 'بدون اسم';
        const total = (stock * price).toFixed(2);
        
        let statusColor = "bg-emerald-500";
        let textStatus = "text-emerald-400";
        let progressPct = Math.min(100, Math.max(0, (stock / (limit * 3 || 1)) * 100)); // Arbitrary max logic for visual
        
        if (stock <= limit) {
            statusColor = "bg-red-500";
            textStatus = "text-red-400";
            progressPct = Math.max(5, (stock / limit) * 50); 
        } else if (stock <= limit * 1.5) {
            statusColor = "bg-yellow-500";
            textStatus = "text-yellow-400";
        }

        return `
        <tr class="hover:bg-gray-700/30 transition-colors group inv-row" data-name="${name.toLowerCase()}" data-status="${stock <= limit ? 'low' : 'ok'}">
            <td class="px-6 py-4">
                <div class="font-bold text-gray-100 flex items-center gap-2">
                    ${stock <= limit ? '<span class="flex h-2 w-2 relative"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span class="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>' : ''}
                    ${name}
                </div>
            </td>
            <td class="px-6 py-4">
                <div class="flex items-center gap-4">
                    <div class="flex items-center bg-gray-900 rounded-lg border border-gray-700 overflow-hidden shadow-inner">
                        <button onclick="window.quickAdjustStock(${item.id}, -1)" class="px-3 py-1 hover:bg-gray-700 text-gray-400 hover:text-white transition font-bold">-</button>
                        <span class="w-16 text-center font-bold text-white number-font">${stock} ${unit}</span>
                        <button onclick="window.quickAdjustStock(${item.id}, 1)" class="px-3 py-1 hover:bg-gray-700 text-brand transition font-bold">+</button>
                    </div>
                    <div class="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden hidden md:block">
                        <div class="h-full ${statusColor} transition-all duration-500" style="width: ${progressPct}%"></div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 text-gray-300 font-medium number-font">${price.toFixed(2)} د.ج / ${unit}</td>
            <td class="px-6 py-4 font-bold text-brand-light number-font">${total} د.ج</td>
            <td class="px-6 py-4 text-center">
                <div class="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick="window.showInventoryModal(${item.id})" class="p-2 bg-gray-700 hover:bg-brand/20 hover:text-brand text-gray-300 rounded-lg transition" title="تعديل">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                    <button onclick="window.deleteInventoryItem(${item.id})" class="p-2 bg-gray-700 hover:bg-red-500/20 hover:text-red-400 text-gray-300 rounded-lg transition" title="حذف">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

window.filterInventory = function(type) {
    // Handle tab styling
    if (type) {
        document.querySelectorAll('.inv-filter').forEach(btn => {
            btn.className = "inv-filter bg-gray-700 text-gray-300 hover:bg-gray-600 font-bold px-4 py-2 rounded-lg text-sm transition";
        });
        const activeBtn = document.getElementById(`filter-${type}`);
        if(activeBtn) activeBtn.className = "inv-filter bg-brand text-black font-bold px-4 py-2 rounded-lg text-sm transition shadow-md";
        STATE.invActiveFilter = type;
    }

    const filterType = STATE.invActiveFilter || 'all';
    const query = (document.getElementById('inv-search') ? document.getElementById('inv-search').value.toLowerCase() : '');
    
    document.querySelectorAll('.inv-row').forEach(row => {
        const nameMatch = row.dataset.name.includes(query);
        const statusMatch = (filterType === 'all') || (filterType === 'low' && row.dataset.status === 'low');
        
        if (nameMatch && statusMatch) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
};

window.quickAdjustStock = async function(id, change) {
    const item = STATE.inventoryItems.find(i => i.id === id);
    if (!item) return;
    
    const newStock = Math.max(0, (parseFloat(item.Stock) || 0) + change);
    item.Stock = newStock; // Optimistic UI update
    
    // Quick Re-render
    window.renderInventoryUI();
    
    // Silent API Patch
    try {
        await fetch(`https://baserow.vidsai.site/api/database/rows/table/${INVENTORY_TABLE_ID}/${id}/?user_field_names=true`, {
            method: 'PATCH',
            headers: { "Authorization": `Token ${BASEROW_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify({ "Stock": newStock })
        });
    } catch(e) { console.warn("Quick adjust failed", e); }
};

// ==========================================
// Modals & Forms
// ==========================================
function renderInventoryModals() {
    const container = document.getElementById('inv-modals-container');
    container.innerHTML = `
        <!-- Item Modal -->
        <div id="inv-item-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div class="bg-gray-800 border-t-4 border-brand rounded-2xl p-6 w-full max-w-md shadow-2xl animate-zoom-in">
                <h3 id="inv-modal-title" class="text-xl font-bold text-white mb-6">إضافة مكون جديد</h3>
                <input type="hidden" id="inv-id">
                <div class="space-y-4">
                    <div>
                        <label class="block text-xs text-gray-300 mb-1.5 font-bold">اسم المكون</label>
                        <input type="text" id="inv-name" placeholder="مثال: خبز برغر" class="w-full p-3 bg-gray-700 border border-gray-500 rounded-lg text-white placeholder-gray-400 outline-none focus:border-brand focus:ring-1 focus:ring-brand transition">
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs text-gray-300 mb-1.5 font-bold">الوحدة</label>
                            <select id="inv-unit" class="w-full p-3 bg-gray-700 border border-gray-500 rounded-lg text-white outline-none focus:border-brand focus:ring-1 focus:ring-brand transition">
                                <option value="" disabled selected>اختر الوحدة</option>
                                <option value="كغ">كيلوغرام (كغ)</option>
                                <option value="غ">غرام (غ)</option>
                                <option value="لتر">لتر (L)</option>
                                <option value="مل">مليلتر (ml)</option>
                                <option value="حبة">حبة (قطعة)</option>
                                <option value="علبة">علبة</option>
                                <option value="صندوق">صندوق</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs text-gray-300 mb-1.5 font-bold">الكمية الحالية</label>
                            <input type="number" id="inv-stock" step="0.01" placeholder="الكمية" class="w-full p-3 bg-gray-700 border border-gray-500 rounded-lg text-white placeholder-gray-400 outline-none focus:border-brand focus:ring-1 focus:ring-brand transition number-font">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs text-gray-300 mb-1.5 font-bold">سعر الوحدة (د.ج)</label>
                            <input type="number" id="inv-price" step="0.01" placeholder="السعر" class="w-full p-3 bg-gray-700 border border-gray-500 rounded-lg text-white placeholder-gray-400 outline-none focus:border-brand focus:ring-1 focus:ring-brand transition number-font">
                        </div>
                        <div>
                            <label class="block text-xs text-gray-300 mb-1.5 font-bold">حد التنبيه (Low Stock)</label>
                            <select id="inv-alert" class="w-full p-3 bg-gray-700 border border-gray-500 rounded-lg text-white outline-none focus:border-brand focus:ring-1 focus:ring-brand transition number-font">
                                <option value="0">بدون تنبيه</option>
                                ${Array.from({length: 100}, (_, i) => `<option value="${i+1}">${i+1}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                </div>
                <div class="flex justify-end gap-3 mt-8">
                    <button onclick="document.getElementById('inv-item-modal').classList.add('hidden')" class="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold transition">إلغاء</button>
                    <button onclick="window.saveInventoryItem()" id="inv-save-btn" class="px-5 py-2.5 bg-brand hover:bg-brand-dark text-black rounded-lg font-bold transition shadow-[0_0_15px_rgba(212,175,55,0.4)]">حفظ المكون</button>
                </div>
            </div>
        </div>

        <!-- Recipe Modal -->
        <div id="recipe-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div class="bg-gray-800 border-t-4 border-brand rounded-2xl p-6 w-full max-w-2xl shadow-2xl animate-zoom-in max-h-[90vh] flex flex-col">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold text-white">ربط الوصفات والمكونات</h3>
                    <button onclick="document.getElementById('recipe-modal').classList.add('hidden')" class="text-gray-400 hover:text-white"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                </div>
                
                <div class="overflow-y-auto pr-2 custom-scrollbar flex-1 space-y-6">
                    <!-- Select Menu Item -->
                    <div>
                        <label class="block text-xs text-gray-400 mb-1.5 font-bold">اختر الطبق من المنيو</label>
                        <select id="recipe-menu-select" onchange="window.loadRecipeDetails()" class="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white outline-none focus:border-brand transition">
                            <option value="" disabled selected>-- اختر طبقاً --</option>
                            ${(STATE.cachedMenuItems || []).map(m => `<option value="${m.id}">${m.Name || m.name || 'بدون اسم'}</option>`).join('')}
                        </select>
                    </div>

                    <!-- Current Recipe Area -->
                    <div id="recipe-builder-area" class="hidden space-y-4">
                        <div class="p-4 bg-gray-900/50 rounded-xl border border-gray-700">
                            <h4 class="text-brand font-bold text-sm mb-3">المكونات الحالية للطبق</h4>
                            <div id="recipe-ingredients-list" class="space-y-2 mb-4">
                                <!-- Ingredients injected here -->
                            </div>
                            
                            <div class="flex gap-2 items-end mt-4 pt-4 border-t border-gray-700/50">
                                <div class="flex-1">
                                    <label class="block text-xs text-gray-400 mb-1 font-bold">مكون من المخزون</label>
                                    <select id="recipe-new-ing" class="w-full p-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white outline-none">
                                        <option value="" disabled selected>اختر مكون...</option>
                                        ${(STATE.inventoryItems || []).map(i => `<option value="${i.Name}">${i.Name} (${i.Unit})</option>`).join('')}
                                    </select>
                                </div>
                                <div class="w-24">
                                    <label class="block text-xs text-gray-400 mb-1 font-bold">الكمية</label>
                                    <input type="number" id="recipe-new-qty" step="0.01" value="1" class="w-full p-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-center number-font outline-none">
                                </div>
                                <button onclick="window.addIngredientToRecipe()" class="bg-gray-700 hover:bg-gray-600 text-brand px-4 py-2.5 rounded-lg font-bold transition">إضافة</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-700">
                    <button onclick="document.getElementById('recipe-modal').classList.add('hidden')" class="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold transition">إغلاق</button>
                    <button onclick="window.saveRecipe()" id="recipe-save-btn" class="px-5 py-2.5 bg-brand hover:bg-brand-dark text-black rounded-lg font-bold transition shadow-[0_0_15px_rgba(212,175,55,0.4)] hidden">حفظ الوصفة</button>
                </div>
            </div>
        </div>
    `;
}

window.showInventoryModal = function(id = null) {
    document.getElementById('inv-id').value = id || '';
    document.getElementById('inv-modal-title').innerText = id ? 'تعديل مكون' : 'إضافة مكون جديد';
    
    if (id) {
        const item = STATE.inventoryItems.find(i => i.id === id);
        if (item) {
            document.getElementById('inv-name').value = item.Name || '';
            document.getElementById('inv-stock').value = item.Stock || 0;
            
            const unitSelect = document.getElementById('inv-unit');
            if (item.Unit) {
                if (!Array.from(unitSelect.options).some(opt => opt.value === item.Unit)) {
                    unitSelect.add(new Option(item.Unit, item.Unit));
                }
                unitSelect.value = item.Unit;
            } else {
                unitSelect.value = '';
            }

            document.getElementById('inv-price').value = item.Unit_Price || 0;
            
            const alertSelect = document.getElementById('inv-alert');
            const alertVal = Math.round(item.Alert_Limit || 0);
            if (!Array.from(alertSelect.options).some(opt => String(opt.value) === String(alertVal))) {
                alertSelect.add(new Option(alertVal, alertVal));
            }
            alertSelect.value = alertVal;
        }
    } else {
        document.getElementById('inv-name').value = '';
        document.getElementById('inv-stock').value = '';
        document.getElementById('inv-unit').value = '';
        document.getElementById('inv-price').value = '';
        document.getElementById('inv-alert').value = '0';
    }
    
    document.getElementById('inv-item-modal').classList.remove('hidden');
};

window.saveInventoryItem = async function() {
    const id = document.getElementById('inv-id').value;
    const payload = {
        "Name": document.getElementById('inv-name').value.trim(),
        "Stock": document.getElementById('inv-stock').value,
        "Unit": document.getElementById('inv-unit').value.trim(),
        "Unit_Price": document.getElementById('inv-price').value,
        "Alert_Limit": document.getElementById('inv-alert').value
    };

    if(!payload.Name) return window.showToast("يرجى إدخال اسم المكون", "error");

    const btn = document.getElementById('inv-save-btn');
    btn.innerText = "جاري الحفظ...";
    btn.disabled = true;

    try {
        const url = id 
            ? `https://baserow.vidsai.site/api/database/rows/table/${INVENTORY_TABLE_ID}/${id}/?user_field_names=true`
            : `https://baserow.vidsai.site/api/database/rows/table/${INVENTORY_TABLE_ID}/?user_field_names=true`;
        
        const method = id ? 'PATCH' : 'POST';

        const res = await fetch(url, {
            method: method,
            headers: { "Authorization": `Token ${BASEROW_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("API Error");

        window.showToast("تم الحفظ بنجاح", "success");
        document.getElementById('inv-item-modal').classList.add('hidden');
        await window.renderInventory(); // Full refresh to update KPIs and Cache
    } catch (e) {
        window.showToast("حدث خطأ أثناء الحفظ", "error");
    } finally {
        btn.innerText = "حفظ المكون";
        btn.disabled = false;
    }
};

window.deleteInventoryItem = async function(id) {
    if (!confirm("هل أنت متأكد من حذف هذا المكون نهائياً؟")) return;
    try {
        await fetch(`https://baserow.vidsai.site/api/database/rows/table/${INVENTORY_TABLE_ID}/${id}/`, {
            method: 'DELETE',
            headers: { "Authorization": `Token ${BASEROW_TOKEN}` }
        });
        window.showToast("تم الحذف بنجاح", "success");
        await window.renderInventory();
    } catch(e) {
        window.showToast("فشل الحذف", "error");
    }
};

// ==========================================
// Recipe Builder Logic
// ==========================================
let currentRecipeIngredients = [];

window.showRecipeModal = function() {
    document.getElementById('recipe-modal').classList.remove('hidden');
    document.getElementById('recipe-menu-select').value = "";
    document.getElementById('recipe-builder-area').classList.add('hidden');
    document.getElementById('recipe-save-btn').classList.add('hidden');
};

window.loadRecipeDetails = function() {
    const menuId = document.getElementById('recipe-menu-select').value;
    if (!menuId) return;

    const menuItem = STATE.cachedMenuItems.find(m => String(m.id) === String(menuId));
    currentRecipeIngredients = [];

    if (menuItem && menuItem.Recipe) {
        // Parse "Burger Bun: 1, Minced Meat: 150"
        const parts = menuItem.Recipe.split(',');
        parts.forEach(p => {
            const split = p.split(':');
            if(split.length === 2) {
                currentRecipeIngredients.push({ name: split[0].trim(), qty: parseFloat(split[1].trim()) });
            }
        });
    }

    renderRecipeIngredients();
    document.getElementById('recipe-builder-area').classList.remove('hidden');
    document.getElementById('recipe-save-btn').classList.remove('hidden');
};

window.renderRecipeIngredients = function() {
    const list = document.getElementById('recipe-ingredients-list');
    if (currentRecipeIngredients.length === 0) {
        list.innerHTML = `<p class="text-sm text-gray-500 italic">لم يتم ربط أي مكونات بعد.</p>`;
        return;
    }

    list.innerHTML = currentRecipeIngredients.map((ing, idx) => `
        <div class="flex justify-between items-center bg-gray-800 p-3 rounded-lg border border-gray-700">
            <div class="font-bold text-gray-200">${ing.name} <span class="text-xs text-brand ml-2 number-font">x${ing.qty}</span></div>
            <button onclick="window.removeIngredientFromRecipe(${idx})" class="text-red-400 hover:text-red-300 transition">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
        </div>
    `).join('');
};

window.addIngredientToRecipe = function() {
    const name = document.getElementById('recipe-new-ing').value;
    const qty = parseFloat(document.getElementById('recipe-new-qty').value);

    if (!name || isNaN(qty) || qty <= 0) return window.showToast("يرجى تحديد مكون وكمية صحيحة", "error");

    const existing = currentRecipeIngredients.find(i => i.name === name);
    if (existing) existing.qty += qty;
    else currentRecipeIngredients.push({ name, qty });

    renderRecipeIngredients();
};

window.removeIngredientFromRecipe = function(idx) {
    currentRecipeIngredients.splice(idx, 1);
    renderRecipeIngredients();
};

window.saveRecipe = async function() {
    const menuId = document.getElementById('recipe-menu-select').value;
    if (!menuId) return;

    // Convert array back to string: "Item1: 2, Item2: 150"
    const recipeString = currentRecipeIngredients.map(i => `${i.name}: ${i.qty}`).join(', ');

    const btn = document.getElementById('recipe-save-btn');
    btn.innerText = "جاري الحفظ...";
    btn.disabled = true;

    try {
        await fetch(`https://baserow.vidsai.site/api/database/rows/table/${MENU_TABLE_ID}/${menuId}/?user_field_names=true`, {
            method: 'PATCH',
            headers: { "Authorization": `Token ${BASEROW_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify({ "Recipe": recipeString })
        });
        
        window.showToast("تم تحديث الوصفة بنجاح", "success");
        // Update local cache
        const menuItem = STATE.cachedMenuItems.find(m => String(m.id) === String(menuId));
        if (menuItem) menuItem.Recipe = recipeString;
        
        document.getElementById('recipe-modal').classList.add('hidden');
    } catch(e) {
        window.showToast("فشل تحديث الوصفة", "error");
    } finally {
        btn.innerText = "حفظ الوصفة";
        btn.disabled = false;
    }
};

// =========================================================
// ⚙️ Auto-Deduct Logic (Called from Cashier / KDS)
// =========================================================
window.processInventoryDeduction = async function(orderDetailsString) {
    if (!orderDetailsString) return;

    // Ensure inventory data exists for calculations
    if (!STATE.inventoryItems || STATE.inventoryItems.length === 0) {
        try {
            const res = await fetch(`https://baserow.vidsai.site/api/database/rows/table/${INVENTORY_TABLE_ID}/?user_field_names=true&size=200`, { headers: { "Authorization": `Token ${BASEROW_TOKEN}` }});
            if (res.ok) { const data = await res.json(); STATE.inventoryItems = data.results || []; }
        } catch (e) { console.warn('Silent Inventory Fetch Fail', e); return; }
    }

    if (!STATE.cachedMenuItems || STATE.cachedMenuItems.length === 0) {
        try { STATE.cachedMenuItems = await window.fetchMenu(); } 
        catch(e) { console.warn('Silent Menu Fetch Fail', e); return; }
    }

    // Parse Order String (Format expected: "2x Burger\n1x Cola")
    // Note: The system format might have prices like "1x برغر - 1200"
    const lines = orderDetailsString.split('\\n');
    const orderItems = [];
    
    lines.forEach(line => {
        // Regex extracts quantity and name, ignoring price suffix if present
        const match = line.match(/^(\\d+)[xX]\\s+(.+?)(?:\\s+-\\s+\\d+.*)?$/);
        if (match) {
            orderItems.push({ qty: parseInt(match[1], 10), name: match[2].trim() });
        }
    });

    const inventoryDeductions = {};

    orderItems.forEach(orderItem => {
        // Find matching menu item robustly
        const menuItem = STATE.cachedMenuItems.find(m => {
            const mName = (m.Name || m.name || '').trim();
            return mName === orderItem.name || mName.includes(orderItem.name) || orderItem.name.includes(mName);
        });

        if (menuItem && menuItem.Recipe) {
            // Recipe expected format: "Burger Bun: 1, Minced Meat: 150"
            const ingredients = menuItem.Recipe.split(',');
            ingredients.forEach(ing => {
                const parts = ing.split(':');
                if (parts.length === 2) {
                    const ingName = parts[0].trim();
                    const ingQty = parseFloat(parts[1].trim()) * orderItem.qty;
                    if (!isNaN(ingQty)) {
                        if (!inventoryDeductions[ingName]) inventoryDeductions[ingName] = 0;
                        inventoryDeductions[ingName] += ingQty;
                    }
                }
            });
        }
    });

    // Execute Deductions against Baserow (Silent Execution)
    for (const [ingName, totalDeduct] of Object.entries(inventoryDeductions)) {
        const invItem = STATE.inventoryItems.find(i => (i.Name || '').trim() === ingName);
        if (invItem) {
            const currentStock = parseFloat(invItem.Stock) || 0;
            const newStock = Math.max(0, currentStock - totalDeduct);
            
            try {
                fetch(`https://baserow.vidsai.site/api/database/rows/table/${INVENTORY_TABLE_ID}/${invItem.id}/?user_field_names=true`, {
                    method: 'PATCH',
                    headers: { "Authorization": `Token ${BASEROW_TOKEN}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ "Stock": String(newStock) })
                }).then(res => res.json()).then(data => {
                    invItem.Stock = data.Stock; // Update local state silently
                }).catch(e => console.warn('Inventory Deduction Patch Fail:', e));
            } catch (e) {
                console.warn('Inventory Deduction Request Error:', e);
            }
        }
    }
};
