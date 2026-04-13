// =========================================================
// 🔔 Tables Logic (نداءات الطاولات)
// =========================================================

window.renderTableView = function () {
    const dynamicContent = document.getElementById('dynamic-content');
    if (!dynamicContent) return;

    dynamicContent.innerHTML = `
        <div class="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 bg-gray-800 py-4 px-6 rounded-xl border border-gray-700 shadow-md mt-2 gap-4">
            <div class="flex items-center gap-3">
                <span class="live-indicator" title="تحديث مباشر"></span>
                <h3 class="text-white font-bold text-xl">مراقبة الطاولات والطلبات</h3>
            </div>
            
            <div id="waiter-action-buttons" class="flex flex-wrap gap-4">
                <button onclick="window.openNewOrderModal('table')" class="bg-brand hover:bg-brand-dark text-black font-bold px-6 py-3 text-lg w-auto rounded-lg flex items-center gap-2 transition shadow-md">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                    <span>إضافة طلب لطاولة</span>
                </button>
                <button onclick="window.openNewOrderModal('quick')" class="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 text-lg w-auto rounded-lg flex items-center gap-2 transition shadow-md">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    <span>إضافة طلب سريع</span>
                </button>
            </div>
        </div>
    `;
    const grid = document.createElement('div');
    grid.className = "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-10";

    for (let i = 1; i <= 15; i++) {
        const isActive = STATE.activeCalls.includes(i);
        const card = document.createElement('div');
        card.className = `h-40 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden border-2 ${isActive ? 'bg-red-600 border-red-500 shadow-[0_0_30px_rgba(220,38,38,0.6)] animate-pulse text-white' : 'bg-gray-800 border-gray-700 hover:border-gray-500 text-gray-400 hover:bg-gray-750'}`;

        if (isActive) {
            card.onclick = () => window.resolveTableCall(i);
            card.innerHTML = `<div class="text-4xl mb-2 animate-bounce">⚠️</div><div class="text-xl font-bold">طاولة ${i}</div><div class="text-xs mt-1 bg-red-800 px-2 py-1 rounded text-red-100">تطلب مساعدة</div>`;
        } else {
            card.innerHTML = `<div class="text-4xl mb-2 opacity-50">🍽️</div><div class="text-lg font-medium">طاولة ${i}</div>`;
        }
        grid.appendChild(card);
    }
    dynamicContent.appendChild(grid);
};