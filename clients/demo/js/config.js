// js/config.js
const BASEROW_TOKEN = "DfaoAk1o41H4iPUtkblY2ZKzXcbHxizb"; 
const ORDERS_TABLE_ID = "37"; 
const MENU_TABLE_ID = "36"; 
const CALLS_TABLE_ID = "753"; 
const SETTINGS_TABLE_ID = "754"; 

const CLIENTS_DB = {
    "demo": { adminPass: "123", kitchenPass: "k123", links: { kds: "api_mode", cashier: "api_mode", menu_quick: "api_mode", menu_add: "api_mode", menu_promo: "api_mode", settings_restaurant: "api_mode", settings_print: "api_mode", settings_account: "api_mode" } },
    "burger_king": { adminPass: "0000", kitchenPass: "k0000", links: { kds: "api_mode", cashier: "api_mode", menu_quick: "api_mode", menu_add: "api_mode", menu_promo: "api_mode", settings_restaurant: "api_mode", settings_print: "api_mode", settings_account: "api_mode" } }
};

window.getLocalYYYYMMDD = function() {
    const d = new Date();
    if (d.getHours() < 6) d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

let currentDeleteItemId = null; 

const STATE = {
    currentUser: null,
    currentRole: null, 
    currentLinks: {}, 
    pollingInterval: null, 
    knownOrders: {}, 
    isFirstFetch: true, 
    analyticsData: [], 
    activeCalls: [], 
    activeCallRows: {}, 
    waiterInterval: null,
    isMuted: false, 
    selectedCashierDate: window.getLocalYYYYMMDD(), 
    selectedAnalyticsDate: window.getLocalYYYYMMDD(), 
    lastFetchedOrders: [], 
    latestKdsOrders: [], 
    processedCashierOrders: [], 
    kdsActiveTab: 'tables', 
    cashierStatusFilter: 'جاهز',
    currentCheckoutOrder: null, 
    currentEditOrder: null,
    originalEditDetails: "",
    originalEditPrice: 0,
    newlyAddedItems: [],
    cachedMenuItems: null,
    storageKeys: { username: "rp_username", role: "rp_role", lastView: "rp_last_view" }
};
