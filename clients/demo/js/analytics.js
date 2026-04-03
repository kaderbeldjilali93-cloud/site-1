// =========================================================
// 📊 Analytics Logic (الإحصائيات والرسوم البيانية)
// =========================================================

window.renderAnalytics = async function(orders = STATE.analyticsData, filterType = 'today') {
    const dynamicContent = document.getElementById('dynamic-content');
    if(!dynamicContent) return;
    
    dynamicContent.innerHTML = '<div class="flex h-full items-center justify-center"><div class="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-brand"></div></div>';
    const sysCurrency = localStorage.getItem('system_currency') || 'DA';

    try {
        const menuItems = await window.fetchMenu();
        const categoryMap = {};
        menuItems.forEach(item => {
            const itemName = (item.Name || item.name || '').toLowerCase().trim();
            const itemCat = (typeof item.Category === 'object' && item.Category) ? item.Category.value : (item.Category || '');
            if(itemName) categoryMap[itemName] = itemCat.toLowerCase();
        });

        const getPrice = (o) => parseFloat((o.total || o.Total || o.price || o.Price || 0).toString().replace(/[^0-9.]/g, '')) || 0; 
        const filteredOrders = orders.filter(o => {
            const rawTime = o['Created at'] || o.Time || o.time || o.created_on;
            if (!rawTime) return false;
            const t = window.parseCustomDate(rawTime);
            const now = new Date();
            if (filterType === 'today') return window.isOrderFromToday(rawTime);
            if (filterType === 'custom') return window.isOrderFromSelectedDate(rawTime, STATE.selectedAnalyticsDate);
            if (filterType === 'week') { const oneWeekAgo = new Date(); oneWeekAgo.setDate(now.getDate() - 7); return t >= oneWeekAgo; }
            if (filterType === 'month') { const oneMonthAgo = new Date(); oneMonthAgo.setDate(now.getDate() - 30); return t >= oneMonthAgo; }
            return true;
        });

        const foodCounts = {};
        const drinkCounts = {};
        let totalSales = 0;
        const salesByTime = {};

        filteredOrders.forEach(order => {
            const price = getPrice(order);
            totalSales += price;
            const t = order['Created at'] || order.Time;
            if(t) {
                const dateObj = window.parseCustomDate(t);
                let key = (filterType === 'today' || filterType === 'custom') ? dateObj.getHours() + ":00" : dateObj.getDate() + "/" + (dateObj.getMonth()+1);
                salesByTime[key] = (salesByTime[key] || 0) + price;
            }

            const details = (order.Details || "").split(/[,،▫\-\n]/);
            details.forEach(itemStr => {
                let cleanStr = itemStr.trim();
                if (!cleanStr) return;

                let qty = 1;
                let name = cleanStr;

                const startMatch = cleanStr.match(/^(\d+)\s*(?:[xX\*]|\s)\s*(.+)/);
                const endMatch = cleanStr.match(/(.+)\s*(?:[xX\*]|\()(\d+)\)?$/);

                if (startMatch) { qty = parseInt(startMatch[1]) || 1; name = startMatch[2].trim(); } 
                else if (endMatch) { name = endMatch[1].trim(); qty = parseInt(endMatch[2]) || 1; }

                name = name.replace(/^[-▫▪•\.]+\s*/, '').trim();
                if (!name || name === 'لا توجد تفاصيل' || name.includes('مدمج')) return;

                const lowerName = name.toLowerCase();
                let category = categoryMap[lowerName] || '';
                if (!category) {
                    const foundKey = Object.keys(categoryMap).find(k => lowerName.includes(k) || k.includes(lowerName));
                    if (foundKey) category = categoryMap[foundKey];
                }
                
                const drinkKeywords = ['boissons', 'drinks', 'mushrubat', 'مشروبات', 'عصائر', 'pepsi', 'coca', 'water', 'jus', 'soda', 'gazouz', 'hamoud', 'rouiba', 'ramy'];
                if (drinkKeywords.some(k => category.includes(k) || lowerName.includes(k))) drinkCounts[name] = (drinkCounts[name] || 0) + qty;
                else foodCounts[name] = (foodCounts[name] || 0) + qty;
            });
        });

        const topFoods = Object.entries(foodCounts).sort((a,b) => b[1] - a[1]).slice(0, 5);
        const topDrinks = Object.entries(drinkCounts).sort((a,b) => b[1] - a[1]).slice(0, 5);
        const avgOrder = filteredOrders.length ? (totalSales / filteredOrders.length).toFixed(2) : 0;

        dynamicContent.innerHTML = '';
        const btnClass = (type) => `px-4 py-1.5 rounded-lg text-sm font-medium transition ${filterType === type ? 'bg-brand text-black' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`;
        const datePickerBorderClass = filterType === 'custom' ? 'border-brand ring-2 ring-brand' : 'border-gray-600 hover:border-brand focus-within:border-brand focus-within:ring-2 focus-within:ring-brand';
        
        dynamicContent.innerHTML += `
            <div class="flex flex-col md:flex-row justify-end items-start md:items-center mb-8 sticky top-0 bg-gray-800 py-4 -mx-6 -mt-6 px-6 pt-6 z-30 border-b border-gray-700 gap-4">
                <div class="flex flex-wrap items-center gap-3">
                    <div class="flex bg-gray-800 p-1 rounded-xl">
                        <button onclick="window.renderAnalytics(STATE.analyticsData, 'today')" class="${btnClass('today')}">اليوم</button>
                        <button onclick="window.renderAnalytics(STATE.analyticsData, 'week')" class="${btnClass('week')}">الأسبوع</button>
                        <button onclick="window.renderAnalytics(STATE.analyticsData, 'month')" class="${btnClass('month')}">الشهر</button>
                    </div>
                    <div class="relative flex items-center bg-gray-800 border ${datePickerBorderClass} rounded-xl transition-all overflow-hidden group">
                        <div class="absolute right-3 text-brand pointer-events-none z-0">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <input type="date" value="${STATE.selectedAnalyticsDate}" onchange="window.handleAnalyticsDateChange(event)" class="w-full bg-transparent text-white pl-3 pr-9 py-1.5 outline-none text-sm cursor-pointer relative font-mono z-10" style="color-scheme: dark;">
                    </div>
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700 shadow-xl relative overflow-hidden hover:border-brand transition-colors"><p class="text-gray-400 text-sm font-medium mb-1">إجمالي المبيعات</p><h3 class="text-3xl font-bold text-white tracking-tight">${totalSales.toLocaleString()} <span class="text-lg text-brand font-normal">${sysCurrency}</span></h3></div>
                <div class="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700 shadow-xl relative overflow-hidden hover:border-blue-500 transition-colors"><p class="text-gray-400 text-sm font-medium mb-1">عدد الطلبات</p><h3 class="text-3xl font-bold text-white tracking-tight">${filteredOrders.length}</h3></div>
                <div class="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700 shadow-xl relative overflow-hidden hover:border-green-500 transition-colors"><p class="text-gray-400 text-sm font-medium mb-1">متوسط السلة</p><h3 class="text-3xl font-bold text-white tracking-tight">${avgOrder} <span class="text-lg text-green-500 font-normal">${sysCurrency}</span></h3></div>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div class="bg-gray-800 p-5 rounded-2xl border border-gray-700 shadow-lg flex flex-col items-center h-80"><h3 class="text-white font-bold mb-4 w-full flex items-center gap-2">نسب المأكولات</h3><div class="relative w-full h-40"><canvas id="foodChart"></canvas></div></div>
                <div class="bg-gray-800 p-5 rounded-2xl border border-gray-700 shadow-lg flex flex-col items-center h-80"><h3 class="text-white font-bold mb-4 w-full flex items-center gap-2">نسب المشروبات</h3><div class="relative w-full h-40"><canvas id="drinkChart"></canvas></div></div>
                <div class="bg-gray-800 p-5 rounded-2xl border border-gray-700 shadow-lg h-80"><h3 class="text-white font-bold mb-4">النشاط الزمني</h3><div class="relative w-full h-64"><canvas id="lineChart"></canvas></div></div>
            </div>
        `;

        const createTable = (title, items) => {
            if (items.length === 0) return `<div class="bg-gray-800 p-6 rounded-2xl border border-gray-700 text-center text-gray-500">لا توجد بيانات ${title}</div>`;
            const rows = items.map((item, index) => `<tr class="border-b border-gray-700 last:border-0 hover:bg-gray-750 transition"><td class="py-3 pl-4 w-12"><span class="w-6 h-6 flex items-center justify-center bg-brand text-black rounded-full text-xs font-bold shadow">${index + 1}</span></td><td class="py-3 text-gray-200 font-medium">${item[0]}</td><td class="py-3 pr-4 text-right text-gray-400 font-mono">${item[1]}</td></tr>`).join('');
            return `<div class="bg-gray-800 rounded-2xl border border-gray-700 shadow-lg overflow-hidden"><div class="p-4 bg-gray-750 border-b border-gray-700 flex items-center gap-2"><h3 class="text-white font-bold">الأكثر مبيعاً (${title})</h3></div><table class="w-full text-left text-sm"><thead class="bg-gray-900 text-gray-400 uppercase text-xs"><tr><th class="py-3 pl-4">#</th><th class="py-3">المنتج</th><th class="py-3 pr-4 text-right">الكمية</th></tr></thead><tbody>${rows}</tbody></table></div>`;
        };

        const tablesGrid = document.createElement('div');
        tablesGrid.className = "grid grid-cols-1 md:grid-cols-2 gap-6 pb-10";
        tablesGrid.innerHTML = createTable('مأكولات', topFoods) + createTable('مشروبات', topDrinks);
        dynamicContent.appendChild(tablesGrid);

        const commonOptions = { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { display: false } }, borderWidth: 3, layout: { padding: 20 }, borderColor: '#1f2937', hoverOffset: 15, animation: { duration: 1500, easing: 'easeOutQuart' } };
        if(topFoods.length > 0) new Chart(document.getElementById('foodChart'), { type: 'doughnut', data: { labels: topFoods.map(i => i[0]), datasets: [{ data: topFoods.map(i => i[1]), backgroundColor: ['#FF9900', '#F59E0B', '#D97706', '#B45309', '#78350F'] }] }, options: commonOptions });
        if(topDrinks.length > 0) new Chart(document.getElementById('drinkChart'), { type: 'doughnut', data: { labels: topDrinks.map(i => i[0]), datasets: [{ data: topDrinks.map(i => i[1]), backgroundColor: ['#3B82F6', '#60A5FA', '#93C5FD', '#2563EB', '#1D4ED8'] }] }, options: commonOptions });

        const timeLabels = Object.keys(salesByTime).sort((a, b) => {
            if (filterType === 'today' || filterType === 'custom') return parseInt(a) - parseInt(b);
            const [d1, m1] = a.split('/').map(Number);
            const [d2, m2] = b.split('/').map(Number);
            return (m1 !== m2) ? m1 - m2 : d1 - d2;
        });
        const salesData = timeLabels.map(k => salesByTime[k]);
        const ctxLine = document.getElementById('lineChart').getContext('2d');
        const gradient = ctxLine.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(255, 153, 0, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 153, 0, 0.0)');

        if(timeLabels.length > 0) {
            new Chart(ctxLine, { type: 'line', data: { labels: timeLabels, datasets: [{ label: 'المبيعات', data: salesData, borderColor: '#FF9900', backgroundColor: gradient, fill: true, tension: 0.4, pointBackgroundColor: '#fff', pointBorderColor: '#FF9900', pointRadius: 4 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { grid: { color: '#374151' }, ticks: { color: '#9CA3AF' }, beginAtZero: true }, x: { grid: { display: false }, ticks: { color: '#9CA3AF' } } }, plugins: { legend: { display: false } }, animation: { duration: 1500, easing: 'easeOutQuart' } } });
        } else { document.getElementById('lineChart').parentNode.innerHTML = "<p class='text-gray-600 text-center py-20'>لا توجد بيانات زمنية</p>"; }

    } catch (error) {
        console.warn("Analytics Error:", error.message);
        dynamicContent.innerHTML = `<div class="text-red-400 p-10 text-center border border-red-900 rounded bg-red-900/20">حدث خطأ أثناء معالجة البيانات: ${error.message}</div>`;
    }
};

window.handleAnalyticsDateChange = function(e) {
    STATE.selectedAnalyticsDate = e.target.value;
    window.renderAnalytics(STATE.analyticsData, 'custom');
};
