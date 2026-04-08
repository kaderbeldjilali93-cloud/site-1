// =========================================================
// 🚀 App Core (التوجيه، تسجيل الدخول، والدوال المساعدة)
// =========================================================

const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginForm = document.getElementById('loginForm');
const contentFrame = document.getElementById('content-frame');
const dynamicContent = document.getElementById('dynamic-content');
const welcomeState = document.getElementById('welcome-state');
const loader = document.getElementById('loader');
const logoutModal = document.getElementById('logout-modal');
const checkoutModal = document.getElementById('checkout-modal');
const sidebar = document.getElementById('sidebar');

window.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem(STATE.storageKeys.username);
    const savedRole = localStorage.getItem(STATE.storageKeys.role);
    const lastView = localStorage.getItem(STATE.storageKeys.lastView);

    if (savedUser && savedRole && CLIENTS_DB[savedUser]) {
        window.authenticateUser(savedUser, CLIENTS_DB[savedUser].links, savedRole);
        if (savedRole === 'kitchen') window.loadView('kds');
        else if (lastView && CLIENTS_DB[savedUser].links[lastView]) window.loadView(lastView);
        else window.loadView('kds');
    }
});

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const usernameInput = document.getElementById('restaurantName').value.trim();
        const passwordInput = document.getElementById('password').value;
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;

        submitBtn.innerHTML = `<span class="flex items-center justify-center gap-2"><div class="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-black"></div> جاري التحقق...</span>`;
        submitBtn.disabled = true;

        let role = null;
        let currentLinks = null;

        try {
            const response = await fetch(`https://baserow.vidsai.site/api/database/rows/table/${SETTINGS_TABLE_ID}/?user_field_names=true`, {
                method: 'GET',
                headers: { "Authorization": `Token ${BASEROW_TOKEN}` }
            });

            if (!response.ok) throw new Error("API Error");
            const data = await response.json();

            if (data.results && data.results.length > 0) {
                const row = data.results[0];
                const adminPass = row.AdminPass ?? '123';
                const kitchenPass = row.KitchenPass ?? 'k123';

                if (passwordInput === adminPass) role = 'admin';
                else if (passwordInput === kitchenPass) role = 'kitchen';

                if (role) {
                    currentLinks = CLIENTS_DB[usernameInput] ? CLIENTS_DB[usernameInput].links : CLIENTS_DB['demo'].links;
                    if (row.Currency) localStorage.setItem('system_currency', row.Currency);
                }
            } else {
                throw new Error("No data in settings");
            }
        } catch (err) {
            console.warn("Cloud login failed, using fallback:", err);
            const clientData = CLIENTS_DB[usernameInput];
            if (clientData) {
                if (passwordInput === clientData.adminPass) role = 'admin';
                else if (passwordInput === clientData.kitchenPass) role = 'kitchen';
                if (role) currentLinks = clientData.links;
            }
        }

        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;

        if (role) {
            window.authenticateUser(usernameInput, currentLinks, role);
            if (role === 'kitchen') window.loadView('kds');
            else window.loadView('kds');
            window.showToast(`مرحباً بك! تم تسجيل الدخول بصلاحية ${role === 'admin' ? 'المدير' : 'المطبخ'}`, "success");
        } else {
            window.showToast("اسم المستخدم أو كلمة المرور غير صحيحة ❌", "error");
        }
    });
}

window.authenticateUser = function (username, links, role) {
    localStorage.setItem(STATE.storageKeys.username, username);
    localStorage.setItem(STATE.storageKeys.role, role);

    STATE.currentUser = username;
    STATE.currentLinks = links;
    STATE.currentRole = role;

    const tablesBtn = document.getElementById('btn-tables');

    if (role === 'kitchen') {
        sidebar.classList.remove('flex', 'md:relative', 'md:translate-x-0');
        sidebar.classList.add('hidden');
        if (tablesBtn) tablesBtn.style.display = 'none';
    } else {
        sidebar.classList.remove('hidden');
        sidebar.classList.add('flex', 'md:relative', 'md:translate-x-0');
        if (tablesBtn) tablesBtn.style.display = 'flex';

        window.fetchWaiterCalls();
        if (STATE.waiterInterval) clearInterval(STATE.waiterInterval);
        STATE.waiterInterval = setInterval(window.fetchWaiterCalls, 5000);
    }

    loginScreen.style.display = 'none';
    dashboardScreen.style.display = 'flex';
};

window.logout = function () { logoutModal.classList.remove('hidden'); };
window.closeLogoutModal = function () { logoutModal.classList.add('hidden'); };

window.confirmLogout = function () {
    if (STATE.pollingInterval) clearInterval(STATE.pollingInterval);
    if (STATE.waiterInterval) clearInterval(STATE.waiterInterval);

    localStorage.removeItem(STATE.storageKeys.username);
    localStorage.removeItem(STATE.storageKeys.role);
    localStorage.removeItem(STATE.storageKeys.lastView);

    STATE.currentUser = null;
    STATE.currentRole = null;
    STATE.currentLinks = {};
    STATE.knownOrders = {};
    STATE.isFirstFetch = true;

    sidebar.classList.remove('hidden');
    sidebar.classList.add('flex', 'md:relative', 'md:translate-x-0');

    window.closeLogoutModal();
    dashboardScreen.style.display = 'none';
    loginScreen.style.display = 'flex';

    contentFrame.src = '';
    contentFrame.classList.add('hidden');
    dynamicContent.classList.add('hidden');
    welcomeState.style.display = 'flex';
    loader.style.display = 'none';

    document.getElementById('restaurantName').value = '';
    document.getElementById('password').value = '';
    window.updateNavStyles('');
};

window.showSuccessPopup = function () {
    const modal = document.getElementById('success-modal');
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 1500);
};

window.updateFileName = function (input) {
    const label = document.getElementById('file-upload-label');
    if (!label) return;
    if (input.files && input.files.length > 0) {
        const fileName = input.files[0].name;
        label.className = "w-full flex items-center justify-start gap-2 bg-gray-700 text-white font-bold rounded-lg px-4 py-3 cursor-pointer transition shadow-inner border border-gray-600";
        label.innerHTML = `
            <svg class="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            <span class="truncate">${fileName}</span>
        `;
    } else {
        label.className = "w-full flex items-center justify-center gap-2 bg-gray-800 text-gray-300 font-medium rounded-lg px-4 py-3 cursor-pointer hover:bg-gray-700 transition shadow-sm border border-gray-600";
        label.innerHTML = `
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
            <span>اختر صورة...</span>
        `;
    }
};

window.toggleCustomCategory = function (select) {
    const customInput = document.getElementById('custom-category-input');
    if (!customInput) return;
    if (select.value === 'custom') {
        customInput.classList.remove('hidden');
        customInput.focus();
    } else if (select.value === 'delete_category') {
        customInput.classList.add('hidden');
        if (window.openDeleteCategoryModal) window.openDeleteCategoryModal();
        select.value = 'pizza'; // إرجاع القيمة الافتراضية
    } else {
        customInput.classList.add('hidden');
    }
};

window.toggleMenuAccordion = function () {
    const submenu = document.getElementById('menu-submenu');
    const icon = document.getElementById('menu-accordion-icon');
    if (submenu.classList.contains('hidden')) {
        submenu.classList.remove('hidden');
        submenu.classList.add('flex');
        icon.classList.add('rotate-180');
    } else {
        submenu.classList.add('hidden');
        submenu.classList.remove('flex');
        icon.classList.remove('rotate-180');
    }
};

window.toggleSettingsAccordion = function () {
    const submenu = document.getElementById('settings-submenu');
    const icon = document.getElementById('settings-accordion-icon');
    if (submenu.classList.contains('hidden')) {
        submenu.classList.remove('hidden');
        submenu.classList.add('flex');
        icon.classList.add('rotate-180');
    } else {
        submenu.classList.add('hidden');
        submenu.classList.remove('flex');
        icon.classList.remove('rotate-180');
    }
};

window.parseCustomDate = function (dateStr) {
    if (!dateStr) return new Date(NaN);
    let date = new Date(dateStr);
    if (!isNaN(date.getTime())) return date;
    if (typeof dateStr === 'string') {
        const parts = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
        if (parts) {
            const day = parseInt(parts[1], 10);
            const month = parseInt(parts[2], 10) - 1;
            const year = parseInt(parts[3], 10);
            const hour = parts[4] ? parseInt(parts[4], 10) : 0;
            const minute = parts[5] ? parseInt(parts[5], 10) : 0;
            const second = parts[6] ? parseInt(parts[6], 10) : 0;
            return new Date(year, month, day, hour, minute, second);
        }
    }
    return new Date(NaN);
};

window.toggleMute = function () {
    STATE.isMuted = !STATE.isMuted;
    const iconOn = document.getElementById('icon-sound-on');
    const iconOff = document.getElementById('icon-sound-off');
    if (STATE.isMuted) {
        iconOn.classList.add('hidden');
        iconOff.classList.remove('hidden');
        window.showToast('تم كتم الصوت الإشعارات 🔕', 'success');
    } else {
        iconOff.classList.add('hidden');
        iconOn.classList.remove('hidden');
        window.showToast('تم تفعيل صوت الإشعارات 🔊', 'success');
    }
};

window.showToast = function (message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    const isSuccess = type === 'success';
    const borderColor = isSuccess ? 'border-green-500' : 'border-red-500';
    const iconColor = isSuccess ? 'text-green-500' : 'text-red-500';
    const iconSvg = isSuccess
        ? '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>'
        : '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';

    toast.className = `bg-gray-800 text-white px-4 py-3 rounded-lg shadow-2xl border-r-4 ${borderColor} flex items-center gap-3 transform -translate-x-[120%] opacity-0 transition-all duration-500 ease-out pointer-events-auto min-w-[300px] z-50`;
    toast.innerHTML = `<div class="${iconColor} flex-shrink-0">${iconSvg}</div><div class="font-medium text-sm leading-snug">${message}</div>`;
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.remove('-translate-x-[120%]', 'opacity-0'));
    setTimeout(() => {
        toast.classList.add('-translate-x-[120%]', 'opacity-0');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
};

window.toggleSidebar = function () {
    document.getElementById('sidebar').classList.toggle('translate-x-full');
    document.getElementById('sidebar-overlay').classList.toggle('hidden');
};

window.toggleFullscreen = function () {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(err => console.log(err));
    else if (document.exitFullscreen) document.exitFullscreen();
};

window.formatOrderTime = function (order) {
    const rawTime = order['Created at'] || order.Time || order.time || order.created_on;
    if (!rawTime) return '--:--';
    try {
        const date = window.parseCustomDate(rawTime);
        if (isNaN(date.getTime())) return rawTime;
        return date.toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch (e) { return '--:--'; }
};

window.calculateElapsedMinutes = function (rawTime) {
    if (!rawTime) return 0;
    try {
        const orderDate = window.parseCustomDate(rawTime);
        if (isNaN(orderDate.getTime())) return 0;
        const diffMins = Math.floor((new Date() - orderDate) / 60000);
        return diffMins >= 0 ? diffMins : 0;
    } catch (e) { return 0; }
};

window.getTimerStyle = function (minutes) {
    if (minutes <= 1) return "text-green-400";
    if (minutes <= 3) return "text-yellow-400";
    return "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse font-bold";
};

window.formatTimerText = function (minutes) {
    if (minutes <= 0) return 'الآن';
    if (minutes === 1) return 'دقيقة واحدة';
    if (minutes === 2) return 'دقيقتين';
    if (minutes >= 3 && minutes <= 10) return `${minutes} دقائق`;
    return `${minutes} دقيقة`;
};

window.isOrderFromToday = function (rawTime) {
    if (!rawTime) return false;
    try {
        const orderDate = window.parseCustomDate(rawTime);
        if (isNaN(orderDate.getTime())) return false;
        const now = new Date();
        let businessDayStart = new Date();
        businessDayStart.setHours(6, 0, 0, 0);
        if (now.getHours() < 6) businessDayStart.setDate(businessDayStart.getDate() - 1);
        return orderDate >= businessDayStart;
    } catch (e) { return false; }
};

window.isOrderFromSelectedDate = function (rawTime, dateString) {
    if (!rawTime || !dateString) return false;
    try {
        const orderDate = window.parseCustomDate(rawTime);
        if (isNaN(orderDate.getTime())) return false;
        const [year, month, day] = dateString.split('-').map(Number);
        const businessDayStart = new Date(year, month - 1, day);
        businessDayStart.setHours(6, 0, 0, 0);
        const businessDayEnd = new Date(businessDayStart);
        businessDayEnd.setDate(businessDayEnd.getDate() + 1);
        return orderDate >= businessDayStart && orderDate < businessDayEnd;
    } catch (e) {
        return false;
    }
};

window.calculateDailySequence = function (orders) {
    return [...orders].reverse().map((order, index) => ({
        ...order,
        dailySequence: `#D-${String(index + 1).padStart(3, '0')}`
    })).reverse();
};

window.processOrderAlerts = function (orders) {
    const getStatus = (o) => (typeof o.Status === 'object' && o.Status) ? o.Status.value : o.Status;

    orders.forEach(order => {
        const currentStatus = getStatus(order);

        if (!STATE.isFirstFetch) {
            if (STATE.knownOrders[order.id] === undefined) {
                order.isNew = true;
                if (!STATE.isMuted) { new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(() => { }); }
            }
            else if (STATE.knownOrders[order.id] !== 'جاهز' && currentStatus === 'جاهز') {
                order.justReady = true;
                if (!STATE.isMuted) { new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(() => { }); }
            }
        }

        STATE.knownOrders[order.id] = currentStatus;
    });

    STATE.isFirstFetch = false;
    return orders;
};

window.removeImage = function (id) {
    const preview = document.getElementById(`img-preview-${id}`);
    if (preview) {
        preview.src = 'https://placehold.co/400x300/374151/FFFFFF?text=No+Image';
    }
    const btn = document.getElementById(`btn-remove-${id}`);
    if (btn) btn.classList.add('hidden');
};

window.loadView = async function (viewType) {
    if (window.innerWidth < 768) {
        document.getElementById('sidebar').classList.add('translate-x-full');
        document.getElementById('sidebar-overlay').classList.add('hidden');
    }

    if (STATE.pollingInterval) { clearInterval(STATE.pollingInterval); STATE.pollingInterval = null; }

    if (STATE.currentRole === 'kitchen' && viewType !== 'kds') return;
    if (STATE.currentRole === 'admin') { window.updateNavStyles(viewType); localStorage.setItem(STATE.storageKeys.lastView, viewType); }

    welcomeState.style.display = 'none';
    contentFrame.classList.add('hidden');
    contentFrame.src = '';
    dynamicContent.classList.remove('hidden');
    loader.style.display = 'flex';
    loader.classList.remove('hidden');

    const activeBtn = document.getElementById(`btn-${viewType}`);
    const pageTitleEl = document.getElementById('global-page-title');
    if (activeBtn && pageTitleEl) {
        const textSpan = activeBtn.querySelector('.font-medium');
        if (textSpan) {
            pageTitleEl.innerText = textSpan.innerText.trim();
        } else {
            pageTitleEl.innerText = activeBtn.innerText.trim();
        }
    }

    try {
        if (viewType === 'kds') {
            const runKDS = async () => {
                try {
                    const data = await window.fetchOrders(ORDERS_TABLE_ID);
                    STATE.latestKdsOrders = data;
                    window.renderKDS(data);
                } catch (e) { console.warn(e); }
            };
            await runKDS();
            STATE.pollingInterval = setInterval(runKDS, 10000);
        }
        else if (viewType === 'cashier') {
            const runCashier = async () => { try { const data = await window.fetchOrders(ORDERS_TABLE_ID); window.renderCashier(data); } catch (e) { console.warn(e); } };
            await runCashier();
            STATE.pollingInterval = setInterval(runCashier, 10000);
        }
        else if (viewType === 'menu_quick') {
            const data = await window.fetchMenu();
            window.renderMenuEditor(data);
        }
        else if (viewType === 'menu_promo') {
            const data = await window.fetchMenu();
            window.renderPromoEditor(data);
        }
        else if (viewType === 'menu_add') {
            await window.renderMenuAdd();
        }
        else if (viewType === 'analytics') {
            const data = await window.fetchOrders(ORDERS_TABLE_ID);
            STATE.analyticsData = data;
            await window.renderAnalytics(data, 'today');
        }
        else if (viewType === 'tables') {
            window.renderTableView();
        }
        else if (viewType === 'settings_restaurant') {
            await window.renderSettingsRestaurant();
        }
        else if (viewType === 'settings_print') {
            await window.renderSettingsPrint();
        }
        else if (viewType === 'settings_account') {
            await window.renderSettingsAccount();
        }

        const url = STATE.currentLinks[viewType];
        if (url && url !== "api_mode" && !dynamicContent.innerHTML) {
            if (url.includes("YOUR_DEMO")) window.showToast("⚠️ هذا حساب تجريبي. البيانات غير حقيقية.", "error");
            else window.showToast("الرابط غير متوفر أو قيد التطوير.", "error");
        }
    } catch (e) {
        console.error("Router Error:", e);
        window.showToast("حدث خطأ في تحميل الشاشة", "error");
    } finally {
        loader.style.display = 'none';
    }
};

window.updateNavStyles = function (activeView) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-brand', 'text-black', 'text-white');
        btn.classList.add('text-gray-300', 'hover:bg-gray-800');
    });
    document.querySelectorAll('.sub-nav-btn').forEach(btn => {
        btn.classList.remove('text-brand', 'bg-gray-700', 'font-bold');
        btn.classList.add('text-gray-400', 'hover:text-white', 'hover:bg-gray-700');
    });

    const activeBtn = document.getElementById(`btn-${activeView}`);
    if (activeBtn) {
        if (activeBtn.classList.contains('sub-nav-btn')) {
            activeBtn.classList.remove('text-gray-400', 'hover:text-white', 'hover:bg-gray-700');
            activeBtn.classList.add('text-brand', 'bg-gray-700', 'font-bold');

            const parentMenuBtn = document.getElementById('btn-menu-parent');
            const parentSettingsBtn = document.getElementById('btn-settings-parent');

            if (activeView.startsWith('menu_') && parentMenuBtn) {
                parentMenuBtn.classList.remove('text-gray-300', 'hover:bg-gray-800');
                parentMenuBtn.classList.add('text-white');

                const submenu = document.getElementById('menu-submenu');
                const icon = document.getElementById('menu-accordion-icon');
                if (submenu && submenu.classList.contains('hidden')) {
                    submenu.classList.remove('hidden');
                    submenu.classList.add('flex');
                    icon.classList.add('rotate-180');
                }
            } else if (activeView.startsWith('settings_') && parentSettingsBtn) {
                parentSettingsBtn.classList.remove('text-gray-300', 'hover:bg-gray-800');
                parentSettingsBtn.classList.add('text-white');

                const submenu = document.getElementById('settings-submenu');
                const icon = document.getElementById('settings-accordion-icon');
                if (submenu && submenu.classList.contains('hidden')) {
                    submenu.classList.remove('hidden');
                    submenu.classList.add('flex');
                    icon.classList.add('rotate-180');
                }
            }
        } else {
            activeBtn.classList.remove('text-gray-300', 'hover:bg-gray-800');
            activeBtn.classList.add('bg-brand', 'text-black');
        }
    }
};