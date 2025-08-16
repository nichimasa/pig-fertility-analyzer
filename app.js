document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('csvFile');
    const encodingSelect = document.getElementById('encoding');
    const startAnalysisBtn = document.getElementById('start-analysis-btn');
    const analyzeBtn = document.getElementById('analyze-btn');
    const resetFilterBtn = document.getElementById('reset-filter-btn');
    const summaryStats = document.getElementById('summary-stats');
    const advancedResults = document.getElementById('advanced-results');
    const resultsSection = document.querySelector('.results-section');
    const advancedSection = document.querySelector('.advanced-analysis');
    const loadingIndicator = document.getElementById('loading-indicator');
    
    // フィルター要素
    const farmFilter = document.getElementById('farm-filter');
    const buildingFilter = document.getElementById('building-filter');
    const monthFilter = document.getElementById('month-filter');
    const weekFilter = document.getElementById('week-filter');
    const parityFilter = document.getElementById('parity-filter');
    const boarFilter = document.getElementById('boar-filter');
    
    let selectedFile = null;
    let pigData = [];
    let filteredData = [];
    let farmList = []; // 農場リスト
    let buildingList = []; // 豚舎リスト
    let parityList = []; // 産次リスト
    let boarList = []; // 雄豚リスト
    let weekList = []; // 週リスト
    
    // ファイル選択時の処理
    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            selectedFile = e.target.files[0];
            startAnalysisBtn.disabled = false;
            // ファイル名を表示
            const fileName = document.createElement('p');
            fileName.textContent = `選択されたファイル: ${selectedFile.name}`;
            fileName.className = 'selected-file';
            
            // 既存のファイル名表示を削除
            const existingFileName = document.querySelector('.selected-file');
            if (existingFileName) {
                existingFileName.remove();
            }
            
            fileInput.parentNode.insertBefore(fileName, startAnalysisBtn);
        } else {
            selectedFile = null;
            startAnalysisBtn.disabled = true;
        }
    });
    
    // 分析開始ボタンクリック時の処理
    startAnalysisBtn.addEventListener('click', function() {
        if (!selectedFile) return;
        
        // 読み込み中の表示
        loadingIndicator.style.display = 'block';
        resultsSection.style.display = 'none';
        advancedSection.style.display = 'none';
        
        // ファイル読み込みと分析を開始
        const encoding = encodingSelect.value;
        
        setTimeout(function() {
            Papa.parse(selectedFile, {
                header: true,
                encoding: encoding,
                complete: function(results) {
                    console.log("Parsed data:", results);
                    pigData = results.data.filter(row => row['種付日'] && row['種付日'].trim() !== '');
                    filteredData = [...pigData]; // 初期状態ではフィルターなし
                    
                    // 各種リストを抽出
                    farmList = [...new Set(pigData.map(row => row['農場'] || '不明'))].filter(farm => farm);
                    buildingList = [...new Set(pigData.map(row => row['豚舎'] || '不明'))].filter(building => building);
                    parityList = [...new Set(pigData.map(row => row['産次'] || '不明'))].filter(parity => parity);
                    boarList = [...new Set(pigData.map(row => row['雄豚・精液・あて雄'] || '不明'))].filter(boar => boar);
                    
                    // 週リストを作成
                    const weekData = {};
                    pigData.forEach(row => {
                        if (row['種付日']) {
                            const date = new Date(row['種付日']);
                            if (!isNaN(date.getTime())) {
                                const weekInfo = getWeekInfo(date);
                                const weekKey = `${weekInfo.year}-W${weekInfo.week}`;
                                if (!weekData[weekKey]) {
                                    weekData[weekKey] = {
                                        year: weekInfo.year,
                                        week: weekInfo.week,
                                        start: weekInfo.start,
                                        end: weekInfo.end
                                    };
                                }
                            }
                        }
                    });
                    
                    // 週リストをソート
                    weekList = Object.values(weekData).sort((a, b) => {
                        if (a.year !== b.year) return a.year - b.year;
                        return a.week - b.week;
                    });
                    
                    // フィルターオプションを設定
                    populateFilterOptions();
                    
                    // 読み込み完了、分析結果表示
                    loadingIndicator.style.display = 'none';
                    calculateOverallStats();
                    resultsSection.style.display = 'block';
                    advancedSection.style.display = 'block';
                },
                error: function(error) {
                    console.error("Error parsing CSV:", error);
                    loadingIndicator.style.display = 'none';
                    alert("CSVファイルの解析中にエラーが発生しました。文字コードを確認してください。");
                }
            });
        }, 500); // 少し遅延させてUIの反応を良くする
    });
    
    // フィルターオプションを設定
    function populateFilterOptions() {
        // 農場フィルター
        farmFilter.innerHTML = '<option value="all">すべて</option>';
        farmList.forEach(farm => {
            const option = document.createElement('option');
            option.value = farm;
            option.textContent = farm;
            farmFilter.appendChild(option);
        });
        
        // 豚舎フィルター
        buildingFilter.innerHTML = '<option value="all">すべて</option>';
        buildingList.forEach(building => {
            const option = document.createElement('option');
            option.value = building;
            option.textContent = building;
            buildingFilter.appendChild(option);
        });
        
        // 産次フィルター
        parityFilter.innerHTML = '<option value="all">すべて</option>';
        parityList.forEach(parity => {
            const option = document.createElement('option');
            option.value = parity;
            option.textContent = parity;
            parityFilter.appendChild(option);
        });
        
        // 雄豚フィルター
        boarFilter.innerHTML = '<option value="all">すべて</option>';
        boarList.forEach(boar => {
            const option = document.createElement('option');
            option.value = boar;
            option.textContent = boar;
            boarFilter.appendChild(option);
        });
        
        // 週フィルター
        weekFilter.innerHTML = '<option value="all">すべて</option>';
        weekList.forEach(weekInfo => {
            const startDate = formatDate(weekInfo.start);
            const endDate = formatDate(weekInfo.end);
            const option = document.createElement('option');
            option.value = `${weekInfo.year}-W${weekInfo.week}`;
            option.textContent = `${weekInfo.year}年 第${weekInfo.week}週 (${startDate}～${endDate})`;
            weekFilter.appendChild(option);
        });
    }
    
    // 日付のフォーマット
    function formatDate(date) {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}/${day}`;
    }
    
    // 日付から週情報を取得
    function getWeekInfo(date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        
        // 日付をその週の月曜日に調整
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 日曜日の場合は前の週の月曜日
        const monday = new Date(d.setDate(diff));
        
        // 週の日曜日
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        
        // 年と週番号を取得
        const firstDayOfYear = new Date(monday.getFullYear(), 0, 1);
        const pastDaysOfYear = (monday - firstDayOfYear) / 86400000;
        const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        
        return {
            year: monday.getFullYear(),
            week: weekNumber,
            start: new Date(monday),
            end: new Date(sunday)
        };
    }
    
    // フィルターリセットボタン
    resetFilterBtn.addEventListener('click', function() {
        farmFilter.value = 'all';
        buildingFilter.value = 'all';
        monthFilter.value = 'all';
        weekFilter.value = 'all';
        parityFilter.value = 'all';
        boarFilter.value = 'all';
        
        filteredData = [...pigData];
        updateFilteredDataCount();
    });
    
    // フィルター適用関数
    function applyFilters() {
        filteredData = pigData.filter(row => {
            // 農場フィルター
            if (farmFilter.value !== 'all' && row['農場'] !== farmFilter.value) {
                return false;
            }
            
            // 豚舎フィルター
            if (buildingFilter.value !== 'all' && row['豚舎'] !== buildingFilter.value) {
                return false;
            }
            
            // 産次フィルター
            if (parityFilter.value !== 'all' && row['産次'] !== parityFilter.value) {
                return false;
            }
            
            // 雄豚フィルター
            if (boarFilter.value !== 'all' && row['雄豚・精液・あて雄'] !== boarFilter.value) {
                return false;
            }
            
            // 月フィルター
            if (monthFilter.value !== 'all' && row['種付日']) {
                const date = new Date(row['種付日']);
                if (!isNaN(date.getTime())) {
                    const month = date.getMonth() + 1;
                    if (parseInt(monthFilter.value) !== month) {
                        return false;
                    }
                }
            }
            
            // 週フィルター
            if (weekFilter.value !== 'all' && row['種付日']) {
                const date = new Date(row['種付日']);
                if (!isNaN(date.getTime())) {
                    const weekInfo = getWeekInfo(date);
                    const weekKey = `${weekInfo.year}-W${weekInfo.week}`;
                    if (weekFilter.value !== weekKey) {
                        return false;
                    }
                }
            }
            
            return true;
        });
        
        updateFilteredDataCount();
        return filteredData;
    }
    
    // フィルター適用後のデータ数を表示
    function updateFilteredDataCount() {
        const filterCountElem = document.querySelector('.filtered-count');
        if (filterCountElem) {
            filterCountElem.remove();
        }
        
        const countInfo = document.createElement('div');
        countInfo.className = 'filtered-count';
        countInfo.textContent = `現在のフィルター条件: ${filteredData.length}件 / 全${pigData.length}件`;
        
        const filterSection = document.querySelector('.filter-section');
        filterSection.appendChild(countInfo);
    }
    
    // フィルター変更イベント
    [farmFilter, buildingFilter, monthFilter, weekFilter, parityFilter, boarFilter].forEach(filter => {
        filter.addEventListener('change', function() {
            applyFilters();
        });
    });
    
    // 全体および農場別の受胎率計算
    function calculateOverallStats() {
        // 全体データ
        const total = pigData.length;
        const pregnant = pigData.filter(row => {
            const result = (row['妊娠鑑定結果'] || '').trim();
            return result === '受胎確定';
        }).length;
        
        const rate = total > 0 ? (pregnant / total * 100).toFixed(2) : 0;
        
        // 農場別データ
        const farmData = {};
        
        pigData.forEach(row => {
            const farm = row['農場'] || '不明';
            if (!farmData[farm]) {
                farmData[farm] = { total: 0, pregnant: 0 };
            }
            
            farmData[farm].total++;
            const result = (row['妊娠鑑定結果'] || '').trim();
            if (result === '受胎確定') {
                farmData[farm].pregnant++;
            }
        });
        
        // HTML生成 - 全体サマリー
        let summaryHTML = `
            <div class="stat-card overall">
                <h3>全体の受胎率</h3>
                <p class="rate">${rate}%</p>
                <p>総数: ${total}頭</p>
                <p>受胎: ${pregnant}頭</p>
            </div>
            <div class="farm-summary">
                <h3>農場別受胎率</h3>
                <table class="data-table">
                    <tr>
                        <th>農場</th>
                        <th>総数</th>
                        <th>受胎数</th>
                        <th>受胎率</th>
                    </tr>
        `;
        
        for (const farm in farmData) {
            const farmRate = farmData[farm].total > 0 ? 
                (farmData[farm].pregnant / farmData[farm].total * 100).toFixed(2) : 0;
            
            summaryHTML += `
                <tr>
                    <td>${farm}</td>
                    <td>${farmData[farm].total}</td>
                    <td>${farmData[farm].pregnant}</td>
                    <td>${farmRate}%</td>
                </tr>
            `;
        }
        
        summaryHTML += `
                </table>
            </div>
        `;
        
        summaryStats.innerHTML = summaryHTML;
        
        // 全体の円グラフ
        createPieChart('overall-pie-chart', '全体受胎率', [pregnant, total - pregnant], ['受胎', '不受胎/未確認']);
        
        // 農場別の円グラフ
        createFarmPieChart(farmData);
    }
    
    // 全体の円グラフ作成
    function createPieChart(elementId, title, data, labels) {
        // グラフ用のコンテナ作成
        const container = document.createElement('div');
        container.className = 'chart-container';
        container.id = elementId + '-container';
        
        const canvas = document.createElement('canvas');
        canvas.id = elementId;
        container.appendChild(canvas);
        
        // すでに存在する場合は削除
        const existingContainer = document.getElementById(container.id);
        if (existingContainer) {
            existingContainer.remove();
        }
        
        summaryStats.appendChild(container);
        
        // グラフ作成
        new Chart(canvas, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: ['#4CAF50', '#F44336']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: title,
                        font: {
                            size: 16
                        }
                    }
                }
            }
        });
    }
    
    // 農場別の円グラフ作成
    function createFarmPieChart(farmData) {
        // グラフ用のコンテナ作成
        const container = document.createElement('div');
        container.className = 'chart-container';
        container.id = 'farm-pie-chart-container';
        
        const canvas = document.createElement('canvas');
        canvas.id = 'farm-pie-chart';
        container.appendChild(canvas);
        
        // すでに存在する場合は削除
        const existingContainer = document.getElementById(container.id);
        if (existingContainer) {
            existingContainer.remove();
        }
        
        summaryStats.appendChild(container);
        
        // データ準備
        const labels = Object.keys(farmData);
        const pregnantData = labels.map(farm => farmData[farm].pregnant);
        const notPregnantData = labels.map(farm => farmData[farm].total - farmData[farm].pregnant);
        
        // 色の配列
        const backgroundColors = [
            '#4CAF50', '#2196F3', '#FFC107', '#9C27B0', '#FF5722',
            '#607D8B', '#E91E63', '#00BCD4', '#8BC34A', '#FF9800'
        ];
        
        // グラフ作成
        new Chart(canvas, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: labels.map(farm => farmData[farm].total),
                    backgroundColor: labels.map((_, i) => backgroundColors[i % backgroundColors.length])
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: '農場別データ分布',
                        font: {
                            size: 16
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const farm = context.label;
                                const total = farmData[farm].total;
                                const pregnant = farmData[farm].pregnant;
                                const rate = (pregnant / total * 100).toFixed(2);
                                return `${farm}: ${pregnant}/${total} (${rate}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // 詳細分析実行
    analyzeBtn.addEventListener('click', function() {
        // フィルター適用
        applyFilters();
        
        const analysisType = document.getElementById('analysis-type').value;
        
        // フィルターの状態を表示する文字列を作成
        let filterDescription = '条件: ';
        const filterStates = [];
        
        if (farmFilter.value !== 'all') filterStates.push(`農場=${farmFilter.value}`);
        if (buildingFilter.value !== 'all') filterStates.push(`豚舎=${buildingFilter.value}`);
        if (monthFilter.value !== 'all') filterStates.push(`${monthFilter.value}月`);
        if (weekFilter.value !== 'all') {
            const weekOption = weekFilter.options[weekFilter.selectedIndex];
            filterStates.push(weekOption.textContent);
        }
        if (parityFilter.value !== 'all') filterStates.push(`産次=${parityFilter.value}`);
        if (boarFilter.value !== 'all') filterStates.push(`雄豚=${boarFilter.value}`);
        
        filterDescription += filterStates.length > 0 ? filterStates.join(', ') : 'すべてのデータ';
        
        switch(analysisType) {
            case 'farm':
                analyzeByFarm(filterDescription);
                break;
            case 'building':
                analyzeByBuilding(filterDescription);
                break;
            case 'month':
                analyzeByMonth(filterDescription);
                break;
            case 'week':
                analyzeByWeek(filterDescription);
                break;
            case 'parity':
                analyzeByParity(filterDescription);
                break;
            case 'boar':
                analyzeByBoar(filterDescription);
                break;
        }
    });
    
    // 農場別分析
    function analyzeByFarm(filterDescription) {
        const farmData = {};
        
        filteredData.forEach(row => {
            const farm = row['農場'] || '不明';
            if (!farmData[farm]) {
                farmData[farm] = { total: 0, pregnant: 0 };
            }
            
            farmData[farm].total++;
            const result = (row['妊娠鑑定結果'] || '').trim();
            if (result === '受胎確定') {
                farmData[farm].pregnant++;
            }
        });
        
        displayAnalysisResults(farmData, '農場別受胎率', filterDescription);
    }
    
    // 豚舎別分析
    function analyzeByBuilding(filterDescription) {
        const buildingData = {};
        
        filteredData.forEach(row => {
            const building = row['豚舎'] || '不明';
            if (!buildingData[building]) {
                buildingData[building] = { total: 0, pregnant: 0 };
            }
            
            buildingData[building].total++;
            const result = (row['妊娠鑑定結果'] || '').trim();
            if (result === '受胎確定') {
                buildingData[building].pregnant++;
            }
        });
        
        displayAnalysisResults(buildingData, '豚舎別受胎率', filterDescription);
    }
    
    // 月別分析
    function analyzeByMonth(filterDescription) {
        const monthData = {};
        
        filteredData.forEach(row => {
            if (row['種付日']) {
                const date = new Date(row['種付日']);
                if (!isNaN(date.getTime())) {
                    const month = date.getMonth() + 1;
                    if (!monthData[month]) {
                        monthData[month] = { total: 0, pregnant: 0 };
                    }
                    
                    monthData[month].total++;
                    const result = (row['妊娠鑑定結果'] || '').trim();
                    if (result === '受胎確定') {
                        monthData[month].pregnant++;
                    }
                }
            }
        });
        
        // 月を数値順にソート
        const sortedMonthData = {};
        Object.keys(monthData).sort((a, b) => parseInt(a) - parseInt(b)).forEach(month => {
            sortedMonthData[month + '月'] = monthData[month];
        });
        
        displayAnalysisResults(sortedMonthData, '月別受胎率', filterDescription);
    }
    
    // 週別分析
    function analyzeByWeek(filterDescription) {
        const weekData = {};
        
        filteredData.forEach(row => {
            if (row['種付日']) {
                const date = new Date(row['種付日']);
                if (!isNaN(date.getTime())) {
                    const weekInfo
