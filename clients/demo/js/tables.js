// =========================================================
// 🔔 Tables Logic (نداءات الطاولات)
// =========================================================

window.renderTableView = function () {
    const dynamicContent = document.getElementById('dynamic-content');
    if (!dynamicContent) return;

    dynamicContent.innerHTML = `
        <div class="flex flex-col sm:flex-row gap-6 mb-8 mt-2">
            <button onclick="window.openNewOrderModal('table')" class="flex-1 bg-brand hover:bg-brand-dark text-black font-extrabold py-8 rounded-3xl shadow-[0_0_20px_rgba(255,153,0,0.2)] flex flex-col items-center justify-center gap-4 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(255,153,0,0.4)] border border-brand text-2xl">
                <svg class="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                <span class="tracking-wide">إضافة طلب لطاولة</span>
            </button>
            <button onclick="window.openNewOrderModal('quick')" class="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-8 rounded-3xl shadow-[0_0_20px_rgba(37,99,235,0.2)] flex flex-col items-center justify-center gap-4 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] border border-blue-500 text-2xl">
                <svg class="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                <span class="tracking-wide">إضافة طلب سريع</span>
            </button>
        </div>
        <div class="flex justify-between items-center mb-6 bg-gray-800 py-4 px-6 rounded-xl border border-gray-700 shadow-md">
            <div class="flex items-center gap-3">
                <span class="live-indicator" title="تحديث مباشر"></span>
                <h3 class="text-white font-bold text-lg">مراقبة نداءات الطاولات</h3>
            </div>
            <div class="text-gray-400 text-sm hidden sm:block pointer-events-none">اضغط على الطاولة الحمراء لإلغاء النداء</div>
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