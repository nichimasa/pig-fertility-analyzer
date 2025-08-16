document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('csvFile');
    const encodingSelect = document.getElementById('encoding');
    const startAnalysisBtn = document.getElementById('start-analysis-btn');
    const analysisContainer = document.querySelector('.analysis-container');
    const loadingIndicator = document.getElementById('loading-indicator');
    
    // フィルター要素 - 花泉1号
    const buildingFilter1 = document.getElementById('building-filter-1');
    const monthFilter1 = document.getElementById('month-filter-1');
    const parityFilter1 = document.getElementById('parity-filter-1');
    const boarFilter1 = document.getElementById('boar-filter-1');
    const resetFilterBtn1 = document.getElementById('reset-filter-btn-1');
    const applyFilterBtn1 = document.getElementById('apply-filter-btn-1');
    const filterDescription1 = document.getElementById('filter-description-1');
    
    // フィルター要素 - 花泉2号
    const buildingFilter2 = document.getElementById('building-filter-2');
    const monthFilter2 = document.getElementById('month-filter-2');
    const parityFilter2 = document.getElementById('parity-filter-2');
    const boarFilter2 = document.getElementById('boar-filter-2');
    const resetFilterBtn2 = document.getElementById('reset-filter-btn-2');
    const applyFilterBtn2 = document.getElementById('apply-filter-btn-2');
    const filterDescription2 = document.getElementById('filter-description-2');
    
    // 結果表示エリア - 花泉1号
    const overallStats1 = document.getElementById('overall-stats-1');
    const buildingStats1 = document.getElementById('building-stats-1');
    const parityStats1 = document.getElementById('parity-stats-1');
    const boarStats1 = document.getElementById('boar-stats-1');
    
    // 結果表示エリア - 花泉2号
    const overallStats2 = document.getElementById('overall-stats-2');
    const buildingStats2 = document.getElementById('building-stats-2');
    const parityStats2 = document.getElementById('parity-stats-2');
    const boarStats2 = document.getElementById('boar-stats-2');
    
    let selectedFile = null;
    let allData = [];
    let farm1Data = [];
    let farm2Data = [];
    let farm1FilteredData = [];
    let farm2FilteredData = [];
    
    // 農場ごとのリスト
    let farm1BuildingList = [];
    let farm1ParityList = [];
    let farm1BoarList = [];
    let farm2BuildingList = [];
    let farm2ParityList = [];
    let farm2BoarList = [];
    
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
        analysisContainer.style.display = 'none';
        
        // ファイル読み込みと分析を開始
        const encoding = encodingSelect.value;
        
        setTimeout(function() {
            Papa.parse(selectedFile, {
                header: true,
                encoding: encoding,
                complete: function(results) {
                    console.log("Parsed data:", results);
                    allData = results.data.filter(row => row['種付日'] && row['種付日'].trim() !== '');
                    
                    // 農場ごとにデータを分割
                    farm1Data = allData.filter(row => row['農場'] === '花泉1号');
                    farm2Data = allData.filter(row => row['農場'] === '花泉2号');
                    
                    // 初期状態ではフィルターなし
                    farm1FilteredData = [...farm1Data];
                    farm2FilteredData = [...farm2Data];
                    
                    // 各農場のリストを抽出
                    farm1BuildingList = [...new Set(farm1Data.map(row => row['豚舎'] || '不明'))].filter(building => building);
                    farm1ParityList = [...new Set(farm1Data.map(row => row['産次'] || '不明'))].filter(parity => parity);
                    farm1BoarList = [...new Set(farm1Data.map(row => row['雄豚・精液・あて雄'] || '不明'))].filter(boar => boar);
                    
                    farm2BuildingList = [...new Set(farm2Data.map(row => row['豚舎'] || '不明'))].filter(building => building);
                    farm2ParityList = [...new Set(farm2Data.map(row => row['産次'] || '不明'))].filter(parity => parity);
                    farm2BoarList = [...new Set(farm2Data.map(row => row['雄豚・精液・あて雄'] || '不明'))].filter(boar => boar);
                    
                    // フィルターオプションを設定
                    populateFilterOptions();
                    
                    // 読み込み完了、分析結果表示
                    loadingIndicator.style.display = 'none';
                    analysisContainer.style.display = 'flex';
                    
                    // 両農場の統計を計算・表示
                    calculateFarm1Stats();
                    calculateFarm2Stats();
                    
                    // フィルターの状態を更新
                    updateFilterDescription1();
                    updateFilterDescription2();
                },
                error: function(error) {
                    console.error("Error parsing CSV:", error);
                    loadingIndicator.style.display = 'none';
                    alert("CSVファイルの解析中にエラーが発生しました。文字コードを確認してください。");
                }
            });
        }, 500);
    });document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('csvFile');
    const encodingSelect = document.getElementById('encoding');
    const startAnalysisBtn = document.getElementById('start-analysis-btn');
    const analysisContainer = document.querySelector('.analysis-container');
    const loadingIndicator = document.getElementById('loading-indicator');
    
    // フィルター要素 - 花泉1号
    const buildingFilter1 = document.getElementById('building-filter-1');
    const monthFilter1 = document.getElementById('month-filter-1');
    const parityFilter1 = document.getElementById('parity-filter-1');
    const boarFilter1 = document.getElementById('boar-filter-1');
    const resetFilterBtn1 = document.getElementById('reset-filter-btn-1');
    const applyFilterBtn1 = document.getElementById('apply-filter-btn-1');
    const filterDescription1 = document.getElementById('filter-description-1');
    
    // フィルター要素 - 花泉2号
    const buildingFilter2 = document.getElementById('building-filter-2');
    const monthFilter2 = document.getElementById('month-filter-2');
    const parityFilter2 = document.getElementById('parity-filter-2');
    const boarFilter2 = document.getElementById('boar-filter-2');
    const resetFilterBtn2 = document.getElementById('reset-filter-btn-2');
    const applyFilterBtn2 = document.getElementById('apply-filter-btn-2');
    const filterDescription2 = document.getElementById('filter-description-2');
    
    // 結果表示エリア - 花泉1号
    const overallStats1 = document.getElementById('overall-stats-1');
    const buildingStats1 = document.getElementById('building-stats-1');
    const parityStats1 = document.getElementById('parity-stats-1');
    const boarStats1 = document.getElementById('boar-stats-1');
    
    // 結果表示エリア - 花泉2号
    const overallStats2 = document.getElementById('overall-stats-2');
    const buildingStats2 = document.getElementById('building-stats-2');
    const parityStats2 = document.getElementById('parity-stats-2');
    const boarStats2 = document.getElementById('boar-stats-2');
    
    let selectedFile = null;
    let allData = [];
    let farm1Data = [];
    let farm2Data = [];
    let farm1FilteredData = [];
    let farm2FilteredData = [];
    
    // 農場ごとのリスト
    let farm1BuildingList = [];
    let farm1ParityList = [];
    let farm1BoarList = [];
    let farm2BuildingList = [];
    let farm2ParityList = [];
    let farm2BoarList = [];
    
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
        analysisContainer.style.display = 'none';
        
        // ファイル読み込みと分析を開始
        const encoding = encodingSelect.value;
        
        setTimeout(function() {
            Papa.parse(selectedFile, {
                header: true,
                encoding: encoding,
                complete: function(results) {
                    console.log("Parsed data:", results);
                    allData = results.data.filter(row => row['種付日'] && row['種付日'].trim() !== '');
                    
                    // 農場ごとにデータを分割
                    farm1Data = allData.filter(row => row['農場'] === '花泉1号');
                    farm2Data = allData.filter(row => row['農場'] === '花泉2号');
                    
                    // 初期状態ではフィルターなし
                    farm1FilteredData = [...farm1Data];
                    farm2FilteredData = [...farm2Data];
                    
                    // 各農場のリストを抽出
                    farm1BuildingList = [...new Set(farm1Data.map(row => row['豚舎'] || '不明'))].filter(building => building);
                    farm1ParityList = [...new Set(farm1Data.map(row => row['産次'] || '不明'))].filter(parity => parity);
                    farm1BoarList = [...new Set(farm1Data.map(row => row['雄豚・精液・あて雄'] || '不明'))].filter(boar => boar);
                    
                    farm2BuildingList = [...new Set(farm2Data.map(row => row['豚舎'] || '不明'))].filter(building => building);
                    farm2ParityList = [...new Set(farm2Data.map(row => row['産次'] || '不明'))].filter(parity => parity);
                    farm2BoarList = [...new Set(farm2Data.map(row => row['雄豚・精液・あて雄'] || '不明'))].filter(boar => boar);
                    
                    // フィルターオプションを設定
                    populateFilterOptions();
                    
                    // 読み込み完了、分析結果表示
                    loadingIndicator.style.display = 'none';
                    analysisContainer.style.display = 'flex';
                    
                    // 両農場の統計を計算・表示
                    calculateFarm1Stats();
                    calculateFarm2Stats();
                    
                    // フィルターの状態を更新
                    updateFilterDescription1();
                    updateFilterDescription2();
                },
                error: function(error) {
                    console.error("Error parsing CSV:", error);
                    loadingIndicator.style.display = 'none';
                    alert("CSVファイルの解析中にエラーが発生しました。文字コードを確認してください。");
                }
            });
        }, 500);
    });document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('csvFile');
    const encodingSelect = document.getElementById('encoding');
    const startAnalysisBtn = document.getElementById('start-analysis-btn');
    const analysisContainer = document.querySelector('.analysis-container');
    const loadingIndicator = document.getElementById('loading-indicator');
    
    // フィルター要素 - 花泉1号
    const buildingFilter1 = document.getElementById('building-filter-1');
    const monthFilter1 = document.getElementById('month-filter-1');
    const parityFilter1 = document.getElementById('parity-filter-1');
    const boarFilter1 = document.getElementById('boar-filter-1');
    const resetFilterBtn1 = document.getElementById('reset-filter-btn-1');
    const applyFilterBtn1 = document.getElementById('apply-filter-btn-1');
    const filterDescription1 = document.getElementById('filter-description-1');
    
    // フィルター要素 - 花泉2号
    const buildingFilter2 = document.getElementById('building-filter-2');
    const monthFilter2 = document.getElementById('month-filter-2');
    const parityFilter2 = document.getElementById('parity-filter-2');
    const boarFilter2 = document.getElementById('boar-filter-2');
    const resetFilterBtn2 = document.getElementById('reset-filter-btn-2');
    const applyFilterBtn2 = document.getElementById('apply-filter-btn-2');
    const filterDescription2 = document.getElementById('filter-description-2');
    
    // 結果表示エリア - 花泉1号
    const overallStats1 = document.getElementById('overall-stats-1');
    const buildingStats1 = document.getElementById('building-stats-1');
    const parityStats1 = document.getElementById('parity-stats-1');
    const boarStats1 = document.getElementById('boar-stats-1');
    
    // 結果表示エリア - 花泉2号
    const overallStats2 = document.getElementById('overall-stats-2');
    const buildingStats2 = document.getElementById('building-stats-2');
    const parityStats2 = document.getElementById('parity-stats-2');
    const boarStats2 = document.getElementById('boar-stats-2');
    
    let selectedFile = null;
    let allData = [];
    let farm1Data = [];
    let farm2Data = [];
    let farm1FilteredData = [];
    let farm2FilteredData = [];
    
    // 農場ごとのリスト
    let farm1BuildingList = [];
    let farm1ParityList = [];
    let farm1BoarList = [];
    let farm2BuildingList = [];
    let farm2ParityList = [];
    let farm2BoarList = [];
    
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
        analysisContainer.style.display = 'none';
        
        // ファイル読み込みと分析を開始
        const encoding = encodingSelect.value;
        
        setTimeout(function() {
            Papa.parse(selectedFile, {
                header: true,
                encoding: encoding,
                complete: function(results) {
                    console.log("Parsed data:", results);
                    allData = results.data.filter(row => row['種付日'] && row['種付日'].trim() !== '');
                    
                    // 農場ごとにデータを分割
                    farm1Data = allData.filter(row => row['農場'] === '花泉1号');
                    farm2Data = allData.filter(row => row['農場'] === '花泉2号');
                    
                    // 初期状態ではフィルターなし
                    farm1FilteredData = [...farm1Data];
                    farm2FilteredData = [...farm2Data];
                    
                    // 各農場のリストを抽出
                    farm1BuildingList = [...new Set(farm1Data.map(row => row['豚舎'] || '不明'))].filter(building => building);
                    farm1ParityList = [...new Set(farm1Data.map(row => row['産次'] || '不明'))].filter(parity => parity);
                    farm1BoarList = [...new Set(farm1Data.map(row => row['雄豚・精液・あて雄'] || '不明'))].filter(boar => boar);
                    
                    farm2BuildingList = [...new Set(farm2Data.map(row => row['豚舎'] || '不明'))].filter(building => building);
                    farm2ParityList = [...new Set(farm2Data.map(row => row['産次'] || '不明'))].filter(parity => parity);
                    farm2BoarList = [...new Set(farm2Data.map(row => row['雄豚・精液・あて雄'] || '不明'))].filter(boar => boar);
                    
                    // フィルターオプションを設定
                    populateFilterOptions();
                    
                    // 読み込み完了、分析結果表示
                    loadingIndicator.style.display = 'none';
                    analysisContainer.style.display = 'flex';
                    
                    // 両農場の統計を計算・表示
                    calculateFarm1Stats();
                    calculateFarm2Stats();
                    
                    // フィルターの状態を更新
                    updateFilterDescription1();
                    updateFilterDescription2();
                },
                error: function(error) {
                    console.error("Error parsing CSV:", error);
                    loadingIndicator.style.display = 'none';
                    alert("CSVファイルの解析中にエラーが発生しました。文字コードを確認してください。");
                }
            });
        }, 500);
    });

    // フィルターオプションを設定
    function populateFilterOptions() {
        // 花泉1号のフィルターオプション
        buildingFilter1.innerHTML = '<option value="all">すべて</option>';
        farm1BuildingList.forEach(building => {
            const option = document.createElement('option');
            option.value = building;
            option.textContent = building;
            buildingFilter1.appendChild(option);
        });
        
        parityFilter1.innerHTML = '<option value="all">すべて</option>';
        farm1ParityList.forEach(parity => {
            const option = document.createElement('option');
            option.value = parity;
            option.textContent = parity;
            parityFilter1.appendChild(option);
        });
        
        boarFilter1.innerHTML = '<option value="all">すべて</option>';
        farm1BoarList.forEach(boar => {
            const option = document.createElement('option');
            option.value = boar;
            option.textContent = boar;
            boarFilter1.appendChild(option);
        });
        
        // 花泉2号のフィルターオプション
        buildingFilter2.innerHTML = '<option value="all">すべて</option>';
        farm2BuildingList.forEach(building => {
            const option = document.createElement('option');
            option.value = building;
            option.textContent = building;
            buildingFilter2.appendChild(option);
        });
        
        parityFilter2.innerHTML = '<option value="all">すべて</option>';
        farm2ParityList.forEach(parity => {
            const option = document.createElement('option');
            option.value = parity;
            option.textContent = parity;
            parityFilter2.appendChild(option);
        });
        
        boarFilter2.innerHTML = '<option value="all">すべて</option>';
        farm2BoarList.forEach(boar => {
            const option = document.createElement('option');
            option.value = boar;
            option.textContent = boar;
            boarFilter2.appendChild(option);
        });
    }
    
    // 日付のフォーマット
    function formatDate(date) {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}/${day}`;
    }
    
    // フィルターリセットボタン - 花泉1号
    resetFilterBtn1.addEventListener('click', function() {
        buildingFilter1.value = 'all';
        monthFilter1.value = 'all';
        parityFilter1.value = 'all';
        boarFilter1.value = 'all';
        
        farm1FilteredData = [...farm1Data];
        calculateFarm1Stats();
        updateFilterDescription1();
    });
    
    // フィルター適用ボタン - 花泉1号
    applyFilterBtn1.addEventListener('click', function() {
        applyFilters1();
        calculateFarm1Stats();
        updateFilterDescription1();
    });
    
    // フィルター状態の説明文を更新 - 花泉1号
    function updateFilterDescription1() {
        let description = '条件: ';
        const filterStates = [];
        
        if (buildingFilter1.value !== 'all') filterStates.push(`豚舎=${buildingFilter1.value}`);
        if (monthFilter1.value !== 'all') filterStates.push(`${monthFilter1.value}月`);
        if (parityFilter1.value !== 'all') filterStates.push(`産次=${parityFilter1.value}`);
        if (boarFilter1.value !== 'all') filterStates.push(`雄豚=${boarFilter1.value}`);
        
        description += filterStates.length > 0 ? filterStates.join(', ') : 'すべてのデータ';
        
        // データ数も表示
        description += ` (${farm1FilteredData.length}件 / 全${farm1Data.length}件)`;
        
        filterDescription1.textContent = description;
    }
    
    // フィルター適用関数 - 花泉1号
    function applyFilters1() {
        farm1FilteredData = farm1Data.filter(row => {
            // 豚舎フィルター
            if (buildingFilter1.value !== 'all' && row['豚舎'] !== buildingFilter1.value) {
                return false;
            }
            
            // 産次フィルター
            if (parityFilter1.value !== 'all' && row['産次'] !== parityFilter1.value) {
                return false;
            }
            
            // 雄豚フィルター
            if (boarFilter1.value !== 'all' && row['雄豚・精液・あて雄'] !== boarFilter1.value) {
                return false;
            }
            
            // 月フィルター
            if (monthFilter1.value !== 'all' && row['種付日']) {
                const date = new Date(row['種付日']);
                if (!isNaN(date.getTime())) {
                    const month = date.getMonth() + 1;
                    if (parseInt(monthFilter1.value) !== month) {
                        return false;
                    }
                }
            }
            
            return true;
        });
        
        return farm1FilteredData;
    }
    
    // フィルターリセットボタン - 花泉2号
    resetFilterBtn2.addEventListener('click', function() {
        buildingFilter2.value = 'all';
        monthFilter2.value = 'all';
        parityFilter2.value = 'all';
        boarFilter2.value = 'all';
        
        farm2FilteredData = [...farm2Data];
        calculateFarm2Stats();
        updateFilterDescription2();
    });
    
    // フィルター適用ボタン - 花泉2号
    applyFilterBtn2.addEventListener('click', function() {
        applyFilters2();
        calculateFarm2Stats();
        updateFilterDescription2();
    });
    
    // フィルター状態の説明文を更新 - 花泉2号
    function updateFilterDescription2() {
        let description = '条件: ';
        const filterStates = [];
        
        if (buildingFilter2.value !== 'all') filterStates.push(`豚舎=${buildingFilter2.value}`);
        if (monthFilter2.value !== 'all') filterStates.push(`${monthFilter2.value}月`);
        if (parityFilter2.value !== 'all') filterStates.push(`産次=${parityFilter2.value}`);
        if (boarFilter2.value !== 'all') filterStates.push(`雄豚=${boarFilter2.value}`);
        
        description += filterStates.length > 0 ? filterStates.join(', ') : 'すべてのデータ';
        
        // データ数も表示
        description += ` (${farm2FilteredData.length}件 / 全${farm2Data.length}件)`;
        
        filterDescription2.textContent = description;
    }
    
    // フィルター適用関数 - 花泉2号
    function applyFilters2() {
        farm2FilteredData = farm2Data.filter(row => {
            // 豚舎フィルター
            if (buildingFilter2.value !== 'all' && row['豚舎'] !== buildingFilter2.value) {
                return false;
            }
            
            // 産次フィルター
            if (parityFilter2.value !== 'all' && row['産次'] !== parityFilter2.value) {
                return false;
            }
            
            // 雄豚フィルター
            if (boarFilter2.value !== 'all' && row['雄豚・精液・あて雄'] !== boarFilter2.value) {
                return false;
            }
            
            // 月フィルター
            if (monthFilter2.value !== 'all' && row['種付日']) {
                const date = new Date(row['種付日']);
                if (!isNaN(date.getTime())) {
                    const month = date.getMonth() + 1;
                    if (parseInt(monthFilter2.value) !== month) {
                        return false;
                    }
                }
            }
            
            return true;
        });
        
        return farm2FilteredData;
    }
    
    // 花泉1号の統計計算・表示
    function calculateFarm1Stats() {
        // 全体統計
        calculateFarm1OverallStats();
        
        // 豚舎別統計
        calculateFarm1BuildingStats();
        
        // 産次別統計
        calculateFarm1ParityStats();
        
        // 雄豚・精液別統計
        calculateFarm1BoarStats();
    }
    
    // 花泉2号の統計計算・表示
    function calculateFarm2Stats() {
        // 全体統計
        calculateFarm2OverallStats();
        
        // 豚舎別統計
        calculateFarm2BuildingStats();
        
        // 産次別統計
        calculateFarm2ParityStats();
        
        // 雄豚・精液別統計
        calculateFarm2BoarStats();
    }
    
    // 花泉1号の全体統計
    function calculateFarm1OverallStats() {
        const total = farm1FilteredData.length;
        const pregnant = farm1FilteredData.filter(row => {
            const result = (row['妊娠鑑定結果'] || '').trim();
            return result === '受胎確定';
        }).length;
        
        const rate = total > 0 ? (pregnant / total * 100).toFixed(2) : 0;
        
        // HTML生成
        let html = `
            <h3>全体受胎率</h3>
            <div class="stat-card">
                <p class="rate">${rate}%</p>
                <p>総数: ${total}頭</p>
                <p>受胎: ${pregnant}頭</p>
            </div>
            <div class="chart-container" id="overall-chart-1"></div>
        `;
        
        overallStats1.innerHTML = html;
        
        // 円グラフ
        if (total > 0) {
            createPieChart('overall-chart-1', '全体受胎率', [pregnant, total - pregnant], ['受胎', '不受胎/未確認'], ['#27ae60', '#e74c3c']);
        }
    }
    
    // 花泉1号の豚舎別統計
    function calculateFarm1BuildingStats() {
        const buildingData = {};
        
        farm1FilteredData.forEach(row => {
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
        
        // HTML生成
        let html = `
            <h3>豚舎別受胎率</h3>
            <table class="data-table">
                <tr>
                    <th>豚舎</th>
                    <th>総数</th>
                    <th>受胎数</th>
                    <th>受胎率</th>
                </tr>
        `;
        
        // 全体の集計
        let totalAll = 0;
        let pregnantAll = 0;
        
        for (const building in buildingData) {
            const rate = buildingData[building].total > 0 ? 
                (buildingData[building].pregnant / buildingData[building].total * 100).toFixed(2) : 0;
            
            html += `
                <tr>
                    <td>${building}</td>
                    <td>${buildingData[building].total}</td>
                    <td>${buildingData[building].pregnant}</td>
                    <td>${rate}%</td>
                </tr>
            `;
            
            totalAll += buildingData[building].total;
            pregnantAll += buildingData[building].pregnant;
        }
        
        // 合計行
        const totalRate = totalAll > 0 ? (pregnantAll / totalAll * 100).toFixed(2) : 0;
        html += `<tr class="total-row"><td>合計</td><td>${totalAll}</td><td>${pregnantAll}</td><td>${totalRate}%</td></tr>`;
        
        html += `</table>`;
        html += `<div class="chart-container" id="building-chart-1"></div>`;
        
        buildingStats1.innerHTML = html;
        
        // 円グラフ
        if (totalAll > 0) {
            createDataDistributionPieChart('building-chart-1', '豚舎別データ分布', buildingData);
        }
    }
    
    // 花泉1号の産次別統計
    function calculateFarm1ParityStats() {
        const parityData = {};
        
        farm1FilteredData.forEach(row => {
            const parity = row['産次'] || '不明';
            if (!parityData[parity]) {
                parityData[parity] = { total: 0, pregnant: 0 };
            }
            
            parityData[parity].total++;
            const result = (row['妊娠鑑定結果'] || '').trim();
            if (result === '受胎確定') {
                parityData[parity].pregnant++;
            }
        });
        
        // 産次順にソート
        const sortedParityData = {};
        Object.keys(parityData)
            .sort((a, b) => {
                const numA = parseInt(a);
                const numB = parseInt(b);
                if (isNaN(numA) || isNaN(numB)) {
                    return a.localeCompare(b); // 数値に変換できない場合は文字列比較
                }
                return numA - numB;
            })
            .forEach(parity => {
                sortedParityData[parity] = parityData[parity];
            });
        
        // HTML生成
        let html = `
            <h3>産次別受胎率</h3>
            <table class="data-table">
                <tr>
                    <th>産次</th>
                    <th>総数</th>
                    <th>受胎数</th>
                    <th>受胎率</th>
                </tr>
        `;
        
        // 全体の集計
        let totalAll = 0;
        let pregnantAll = 0;
        
        for (const parity in sortedParityData) {
            const rate = sortedParityData[parity].total > 0 ? 
                (sortedParityData[parity].pregnant / sortedParityData[parity].total * 100).toFixed(2) : 0;
            
            html += `
                <tr>
                    <td>${parity}</td>
                    <td>${sortedParityData[parity].total}</td>
                    <td>${sortedParityData[parity].pregnant}</td>
                    <td>${rate}%</td>
                </tr>
            `;
            
            totalAll += sortedParityData[parity].total;
            pregnantAll += sortedParityData[parity].pregnant;
        }
        
        // 合計行
        const totalRate = totalAll > 0 ? (pregnantAll / totalAll * 100).toFixed(2) : 0;
        html += `<tr class="total-row"><td>合計</td><td>${totalAll}</td><td>${pregnantAll}</td><td>${totalRate}%</td></tr>`;
        
        html += `</table>`;
        html += `<div class="chart-container" id="parity-chart-1"></div>`;
        
        parityStats1.innerHTML = html;
        
        // 円グラフ
        if (totalAll > 0) {
            createDataDistributionPieChart('parity-chart-1', '産次別データ分布', sortedParityData);
        }
    }
    
    // 花泉1号の雄豚・精液別統計
    function calculateFarm1BoarStats() {
        const boarData = {};
        
        farm1FilteredData.forEach(row => {
            const boar = row['雄豚・精液・あて雄'] || '不明';
            if (!boarData[boar]) {
                boarData[boar] = { total: 0, pregnant: 0 };
            }
            
            boarData[boar].total++;
            const result = (row['妊娠鑑定結果'] || '').trim();
            if (result === '受胎確定') {
                boarData[boar].pregnant++;
            }
        });
        
        // HTML生成
        let html = `
            <h3>雄豚・精液別受胎率</h3>
            <table class="data-table">
                <tr>
                    <th>雄豚・精液</th>
                    <th>総数</th>
                    <th>受胎数</th>
                    <th>受胎率</th>
                </tr>
        `;
        
        // 全体の集計
        let totalAll = 0;
        let pregnantAll = 0;
        
        for (const boar in boarData) {
            const rate = boarData[boar].total > 0 ? 
                (boarData[boar].pregnant / boarData[boar].total * 100).toFixed(2) : 0;
            
            html += `
                <tr>
                    <td>${boar}</td>
                    <td>${boarData[boar].total}</td>
                    <td>${boarData[boar].pregnant}</td>
                    <td>${rate}%</td>
                </tr>
            `;
            
            totalAll += boarData[boar].total;
            pregnantAll += boarData[boar].pregnant;
        }
        
        // 合計行
        const totalRate = totalAll > 0 ? (pregnantAll / totalAll * 100).toFixed(2) : 0;
        html += `<tr class="total-row"><td>合計</td><td>${totalAll}</td><td>${pregnantAll}</td><td>${totalRate}%</td></tr>`;
        
        html += `</table>`;
        html += `<div class="chart-container" id="boar-chart-1"></div>`;
        
        boarStats1.innerHTML = html;
        
        // 円グラフ
        if (totalAll > 0) {
            createDataDistributionPieChart('boar-chart-1', '雄豚・精液別データ分布', boarData);
        }
    }

    // 花泉2号の全体統計
    function calculateFarm2OverallStats() {
        const total = farm2FilteredData.length;
        const pregnant = farm2FilteredData.filter(row => {
            const result = (row['妊娠鑑定結果'] || '').trim();
            return result === '受胎確定';
        }).length;
        
        const rate = total > 0 ? (pregnant / total * 100).toFixed(2) : 0;
        
        // HTML生成
        let html = `
            <h3>全体受胎率</h3>
            <div class="stat-card">
                <p class="rate">${rate}%</p>
                <p>総数: ${total}頭</p>
                <p>受胎: ${pregnant}頭</p>
            </div>
            <div class="chart-container" id="overall-chart-2"></div>
        `;
        
        overallStats2.innerHTML = html;
        
        // 円グラフ
        if (total > 0) {
            createPieChart('overall-chart-2', '全体受胎率', [pregnant, total - pregnant], ['受胎', '不受胎/未確認'], ['#27ae60', '#e74c3c']);
        }
    }
    
    // 花泉2号の豚舎別統計
    function calculateFarm2BuildingStats() {
        const buildingData = {};
        
        farm2FilteredData.forEach(row => {
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
        
        // HTML生成
        let html = `
            <h3>豚舎別受胎率</h3>
            <table class="data-table">
                <tr>
                    <th>豚舎</th>
                    <th>総数</th>
                    <th>受胎数</th>
                    <th>受胎率</th>
                </tr>
        `;
        
        // 全体の集計
        let totalAll = 0;
        let pregnantAll = 0;
        
        for (const building in buildingData) {
            const rate = buildingData[building].total > 0 ? 
                (buildingData[building].pregnant / buildingData[building].total * 100).toFixed(2) : 0;
            
            html += `
                <tr>
                    <td>${building}</td>
                    <td>${buildingData[building].total}</td>
                    <td>${buildingData[building].pregnant}</td>
                    <td>${rate}%</td>
                </tr>
            `;
            
            totalAll += buildingData[building].total;
            pregnantAll += buildingData[building].pregnant;
        }
        
        // 合計行
        const totalRate = totalAll > 0 ? (pregnantAll / totalAll * 100).toFixed(2) : 0;
        html += `<tr class="total-row"><td>合計</td><td>${totalAll}</td><td>${pregnantAll}</td><td>${totalRate}%</td></tr>`;
        
        html += `</table>`;
        html += `<div class="chart-container" id="building-chart-2"></div>`;
        
        buildingStats2.innerHTML = html;
        
        // 円グラフ
        if (totalAll > 0) {
            createDataDistributionPieChart('building-chart-2', '豚舎別データ分布', buildingData);
        }
    }
    
    // 花泉2号の産次別統計
    function calculateFarm2ParityStats() {
        const parityData = {};
        
        farm2FilteredData.forEach(row => {
            const parity = row['産次'] || '不明';
            if (!parityData[parity]) {
                parityData[parity] = { total: 0, pregnant: 0 };
            }
            
            parityData[parity].total++;
            const result = (row['妊娠鑑定結果'] || '').trim();
            if (result === '受胎確定') {
                parityData[parity].pregnant++;
            }
        });
        
        // 産次順にソート
        const sortedParityData = {};
        Object.keys(parityData)
            .sort((a, b) => {
                const numA = parseInt(a);
                const numB = parseInt(b);
                if (isNaN(numA) || isNaN(numB)) {
                    return a.localeCompare(b); // 数値に変換できない場合は文字列比較
                }
                return numA - numB;
            })
            .forEach(parity => {
                sortedParityData[parity] = parityData[parity];
            });
        
        // HTML生成
        let html = `
            <h3>産次別受胎率</h3>
            <table class="data-table">
                <tr>
                    <th>産次</th>
                    <th>総数</th>
                    <th>受胎数</th>
                    <th>受胎率</th>
                </tr>
        `;
        
        // 全体の集計
        let totalAll = 0;
        let pregnantAll = 0;
        
        for (const parity in sortedParityData) {
            const rate = sortedParityData[parity].total > 0 ? 
                (sortedParityData[parity].pregnant / sortedParityData[parity].total * 100).toFixed(2) : 0;
            
            html += `
                <tr>
                    <td>${parity}</td>
                    <td>${sortedParityData[parity].total}</td>
                    <td>${sortedParityData[parity].pregnant}</td>
                    <td>${rate}%</td>
                </tr>
            `;
            
            totalAll += sortedParityData[parity].total;
            pregnantAll += sortedParityData[parity].pregnant;
        }
        
        // 合計行
        const totalRate = totalAll > 0 ? (pregnantAll / totalAll * 100).toFixed(2) : 0;
        html += `<tr class="total-row"><td>合計</td><td>${totalAll}</td><td>${pregnantAll}</td><td>${totalRate}%</td></tr>`;
        
        html += `</table>`;
        html += `<div class="chart-container" id="parity-chart-2"></div>`;
        
        parityStats2.innerHTML = html;
        
        // 円グラフ
        if (totalAll > 0) {
            createDataDistributionPieChart('parity-chart-2', '産次別データ分布', sortedParityData);
        }
    }
    
    // 花泉2号の雄豚・精液別統計
    function calculateFarm2BoarStats() {
        const boarData = {};
        
        farm2FilteredData.forEach(row => {
            const boar = row['雄豚・精液・あて雄'] || '不明';
            if (!boarData[boar]) {
                boarData[boar] = { total: 0, pregnant: 0 };
            }
            
            boarData[boar].total++;
            const result = (row['妊娠鑑定結果'] || '').trim();
            if (result === '受胎確定') {
                boarData[boar].pregnant++;
            }
        });
        
        // HTML生成
        let html = `
            <h3>雄豚・精液別受胎率</h3>
            <table class="data-table">
                <tr>
                    <th>雄豚・精液</th>
                    <th>総数</th>
                    <th>受胎数</th>
                    <th>受胎率</th>
                </tr>
        `;
        
        // 全体の集計
        let totalAll = 0;
        let pregnantAll = 0;
        
        for (const boar in boarData) {
            const rate = boarData[boar].total > 0 ? 
                (boarData[boar].pregnant / boarData[boar].total * 100).toFixed(2) : 0;
            
            html += `
                <tr>
                    <td>${boar}</td>
                    <td>${boarData[boar].total}</td>
                    <td>${boarData[boar].pregnant}</td>
                    <td>${rate}%</td>
                </tr>
            `;
            
            totalAll += boarData[boar].total;
            pregnantAll += boarData[boar].pregnant;
        }
        
        // 合計行
        const totalRate = totalAll > 0 ? (pregnantAll / totalAll * 100).toFixed(2) : 0;
        html += `<tr class="total-row"><td>合計</td><td>${totalAll}</td><td>${pregnantAll}</td><td>${totalRate}%</td></tr>`;
        
        html += `</table>`;
        html += `<div class="chart-container" id="boar-chart-2"></div>`;
        
        boarStats2.innerHTML = html;
        
        // 円グラフ
        if (totalAll > 0) {
            createDataDistributionPieChart('boar-chart-2', '雄豚・精液別データ分布', boarData);
        }
    }
    
    // 円グラフ作成
    function createPieChart(containerId, title, data, labels, colors) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        
        const canvas = document.createElement('canvas');
        container.appendChild(canvas);
        
        // グラフ作成
        new Chart(canvas, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors || ['#4CAF50', '#F44336']
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
    
    // データ分布の円グラフ作成
    function createDataDistributionPieChart(containerId, title, data) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        
        const canvas = document.createElement('canvas');
        container.appendChild(canvas);
        
        // データ準備
        const labels = Object.keys(data);
        const values = labels.map(key => data[key].total);
        
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
                    data: values,
                    backgroundColor: labels.map((_, i) => backgroundColors[i % backgroundColors.length])
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            font: {
                                size: 12
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: title,
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const key = context.label;
                                const total = data[key].total;
                                const pregnant = data[key].pregnant;
                                const rate = (pregnant / total * 100).toFixed(2);
                                return `${key}: ${pregnant}/${total} (${rate}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
});
