// =========================================================
// ⚙️ System Configuration & State Management
// =========================================================

const BASEROW_TOKEN = 'DfaoAk1o41H4iPUtkblY2ZKzXcbHxizb';
const ORDERS_TABLE_ID = '37';
const TABLEMAP_TABLE_ID = '758';
const CALLS_TABLE_ID = '753';
const MENU_TABLE_ID = '36';
const STAFF_TABLE_ID = '757';
const SETTINGS_TABLE_ID = '754';
const INVENTORY_TABLE_ID = '759';

window.getLocalYYYYMMDD = function() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const STATE = {
    currentUser: null,
    currentRole: null,
    currentLinks: {},
    currentActiveView: null,
    pollingInterval: null,
    knownOrders: {},
    isFirstFetch: true,
    analyticsData: [],
    activeCalls: [],
    activeCallRows: {},
    waiterInterval: null,
    isMuted: false,
    assignedRoom: null,
    assignedStation: null,
    assignedKitchenRoom: null,
    staffRoleFilter: 'all',
    kdsAdminFilter: { type: 'all', value: '' },
    selectedCashierDate: window.getLocalYYYYMMDD(),
    selectedAnalyticsDate: window.getLocalYYYYMMDD(),
    lastFetchedOrders: [],
    latestKdsOrders: [],
    processedCashierOrders: [],
    kdsActiveTab: 'tables',
    cashierStatusFilter: 'الكل',
    cashierRoomFilter: 'الكل',
    currentCheckoutOrder: null,
    currentEditOrder: null,
    originalEditDetails: "",
    originalEditPrice: 0,
    originalItemsList: [],
    newlyAddedItems: [],
    newOrderType: 'quick',
    cachedMenuItems: null,
    tableMapData: [],
    currentRoom: null,
    selectedShape: null,
    selectedTableId: null,
    selectedTableIds: [],
    copiedTables: [],
    isDragging: false,
    dragTarget: null,
    dragOffset: { x: 0, y: 0 },
    // Split bill state
    currentSplitOrder: null,
    splitItems: [],
    splitTotalPrice: 0,
    splitPersonCount: 2,
    splitMode: 'even',
    storageKeys: { 
        username: "rp_username", 
        role: "rp_role", 
        lastView: "rp_last_view",
        room: "rp_assigned_room",
        station: "rp_assigned_station"
    }
};


// Fallback versions - سيتم تعويضها بالنسخ المحسّنة في app.js
if (typeof window.isOrderFromToday !== 'function') {
    window.isOrderFromToday = function (timeStr) {
        if (!timeStr) return false;
        try {
            var todayStr = window.getLocalYYYYMMDD();
            if (String(timeStr).includes(todayStr)) return true;
            var d = new Date(timeStr);
            if (isNaN(d.getTime())) return false;
            var y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), dd = String(d.getDate()).padStart(2,'0');
            return y+'-'+m+'-'+dd === todayStr;
        } catch(e) { return false; }
    };
}
if (typeof window.isOrderFromSelectedDate !== 'function') {
    window.isOrderFromSelectedDate = function (timeStr, dateStr) {
        if (!timeStr || !dateStr) return false;
        try {
            if (String(timeStr).includes(dateStr)) return true;
            var d = new Date(timeStr);
            if (isNaN(d.getTime())) return false;
            var y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), dd = String(d.getDate()).padStart(2,'0');
            return y+'-'+m+'-'+dd === dateStr;
        } catch(e) { return false; }
    };
}