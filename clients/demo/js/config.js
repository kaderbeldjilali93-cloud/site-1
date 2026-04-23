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

window.isOrderFromToday = function (timeStr) {
    if (!timeStr) return false;
    const orderDate = new Date(timeStr);
    const today = new Date();
    return orderDate.getDate() === today.getDate() &&
        orderDate.getMonth() === today.getMonth() &&
        orderDate.getFullYear() === today.getFullYear();
};

window.isOrderFromSelectedDate = function (timeStr, selectedDateStr) {
    if (!timeStr || !selectedDateStr) return false;
    const orderDate = new Date(timeStr);
    const [year, month, day] = selectedDateStr.split('-').map(Number);
    return orderDate.getFullYear() === year &&
        orderDate.getMonth() === (month - 1) &&
        orderDate.getDate() === day;
};