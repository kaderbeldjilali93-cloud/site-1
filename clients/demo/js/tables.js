// =========================================================
// 🔔 Tables Logic (نداءات الطاولات)
// =========================================================

window.renderTableView = function() {
    const dynamicContent = document.getElementById('dynamic-content');
    if(!dynamicContent) return;
    
    dynamicContent.innerHTML = `<div class="flex justify-between items-center mb-8 sticky top-0 bg-gray-800 py-4 -mx-6 -mt-6 px-6 pt-6 z-30 border-b border-gray-700"><div class="flex items-center gap-3"><span class="live-indicator" title="تحديث مباشر"></span></div><div class="text-gray-400 text-sm">اضغط على الطاولة الحمراء لإلغاء النداء</div></div>`;
    const grid = document.createElement('div');
    grid.className = "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6";

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
