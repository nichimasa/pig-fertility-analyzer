document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('csvFile');
    const encodingSelect = document.getElementById('encoding');
    const startAnalysisBtn = document.getElementById('start-analysis-btn');
    const analyzeBtn = document.getElementById('analyze-btn');
    const summaryStats = document.getElementById('summary-stats');
    const advancedResults = document.getElementById('advanced-results');
    const resultsSection = document.querySelector('.results-section');
    const advancedSection = document.querySelector('.advanced-analysis');
    const loadingIndicator = document.getElementById('loading-indicator');
    
    let selectedFile = null;
    let pigData = [];
    let farmList = []; // 農場リスト
    
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
                    
                    // 農場リストを抽出
                    farmList = [...new Set(pigData.map(row => row['農場'] || '不明'))].filter(farm => farm);
                    
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
                <table>
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
                        text: title
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
                        text: '農場別データ分布'
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
        const analysisType = document.getElementById('analysis-type').value;
        
        switch(analysisType) {
            case 'farm':
                analyzeByFarm();
                break;
            case 'building':
                analyzeByBuilding();
                break;
            case 'month':
                analyzeByMonth();
                break;
            case 'parity':
                analyzeByParity();
                break;
            case 'boar':
                analyzeByBoar();
                break;
        }
    });
    
    // 農場別分析
    function analyzeByFarm() {
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
        
        displayAnalysisResults(farmData, '農場別受胎率');
    }
    
    // 豚舎別分析（農場ごと）
    function analyzeByBuilding() {
        // 農場ごとの豚舎データ
        const farmBuildingData = {};
        
        // まず農場ごとにグループ化
        farmList.forEach(farm => {
            const farmPigs = pigData.filter(row => (row['農場'] || '不明') === farm);
            const buildingData = {};
            
            farmPigs.forEach(row => {
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
            
            farmBuildingData[farm] = buildingData;
        });
        
        displayFarmAnalysisResults(farmBuildingData, '豚舎別受胎率（農場ごと）');
    }
    
    // 月別分析（農場ごと）
    function analyzeByMonth() {
        // 農場ごとの月別データ
        const farmMonthData = {};
        
        // まず農場ごとにグループ化
        farmList.forEach(farm => {
            const farmPigs = pigData.filter(row => (row['農場'] || '不明') === farm);
            const monthData = {};
            
            farmPigs.forEach(row => {
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
            
            farmMonthData[farm] = monthData;
        });
        
        displayFarmAnalysisResults(farmMonthData, '月別受胎率（農場ごと）');
    }
    
    // 産次別分析（農場ごと）
    function analyzeByParity() {
        // 農場ごとの産次データ
        const farmParityData = {};
        
        // まず農場ごとにグループ化
        farmList.forEach(farm => {
            const farmPigs = pigData.filter(row => (row['農場'] || '不明') === farm);
            const parityData = {};
            
            farmPigs.forEach(row => {
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
            
            farmParityData[farm] = parityData;
        });
        
        displayFarmAnalysisResults(farmParityData, '産次別受胎率（農場ごと）');
    }
    
    // 雄豚・精液別分析（農場ごと）
    function analyzeByBoar() {
        // 農場ごとの雄豚データ
        const farmBoarData = {};
        
        // まず農場ごとにグループ化
        farmList.forEach(farm => {
            const farmPigs = pigData.filter(row => (row['農場'] || '不明') === farm);
            const boarData = {};
            
            farmPigs.forEach(row => {
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
            
            farmBoarData[farm] = boarData;
        });
        
        displayFarmAnalysisResults(farmBoarData, '雄豚・精液別受胎率（農場ごと）');
    }
    
    // 単純な分析結果表示（農場別など単一カテゴリ）
    function displayAnalysisResults(data, title) {
        // テーブル作成
        let resultHTML = `<h3>${title}</h3><table><tr><th>区分</th><th>総数</th><th>受胎数</th><th>受胎率</th></tr>`;
        
        for (const key in data) {
            const rate = data[key].total > 0 ? (data[key].pregnant / data[key].total * 100).toFixed(2) : 0;
            resultHTML += `<tr><td>${key}</td><td>${data[key].total}</td><td>${data[key].pregnant}</td><td>${rate}%</td></tr>`;
        }
        
        resultHTML += '</table>';
        advancedResults.innerHTML = resultHTML;
        
        // グラフコンテナ作成
        const chartContainer = document.createElement('div');
        chartContainer.className = 'charts-container';
        advancedResults.appendChild(chartContainer);
        
        // 円グラフ用キャンバス
        const pieCanvas = document.createElement('canvas');
        pieCanvas.id = 'analysis-pie-chart';
        chartContainer.appendChild(pieCanvas);
        
        // 棒グラフ用キャンバス
        const barCanvas = document.createElement('canvas');
        barCanvas.id = 'analysis-bar-chart';
        chartContainer.appendChild(barCanvas);
        
        // データ準備
        const labels = Object.keys(data);
        const values = labels.map(key => data[key].total);
        const pregnantValues = labels.map(key => data[key].pregnant);
        const rates = labels.map(key => 
            data[key].total > 0 ? (data[key].pregnant / data[key].total * 100) : 0
        );
        
        // 色の配列
        const backgroundColors = [
            'rgba(54, 162, 235, 0.5)', 'rgba(255, 99, 132, 0.5)', 
            'rgba(255, 206, 86, 0.5)', 'rgba(75, 192, 192, 0.5)',
            'rgba(153, 102, 255, 0.5)', 'rgba(255, 159, 64, 0.5)',
            'rgba(199, 199, 199, 0.5)', 'rgba(83, 102, 255, 0.5)', 
            'rgba(40, 159, 64, 0.5)', 'rgba(210, 199, 199, 0.5)'
        ];
        
        // 円グラフ作成
        new Chart(pieCanvas, {
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
                    },
                    title: {
                        display: true,
                        text: `${title} - 頭数分布`
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
        
        // 棒グラフ作成（受胎率）
        new Chart(barCanvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: '受胎率 (%)',
                    data: rates,
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: `${title} - 受胎率`
                    }
                }
            }
        });
    }
    
    // 農場ごとの詳細分析結果表示
    function displayFarmAnalysisResults(farmData, title) {
        let resultHTML = `<h3>${title}</h3>`;
        
        // 各農場ごとにテーブルとグラフを作成
        for (const farm in farmData) {
            resultHTML += `<h4>農場: ${farm}</h4>`;
            resultHTML += `<table>
                <tr>
                    <th>区分</th>
                    <th>総数</th>
                    <th>受胎数</th>
                    <th>受胎率</th>
                </tr>`;
            
            const data = farmData[farm];
            for (const key in data) {
                const rate = data[key].total > 0 ? (data[key].pregnant / data[key].total * 100).toFixed(2) : 0;
                resultHTML += `<tr><td>${key}</td><td>${data[key].total}</td><td>${data[key].pregnant}</td><td>${rate}%</td></tr>`;
            }
            
            resultHTML += `</table>`;
        }
        
        advancedResults.innerHTML = resultHTML;
        
        // 各農場ごとにグラフを作成
        for (const farm in farmData) {
            const data = farmData[farm];
            
            // グラフコンテナ作成
            const farmChartContainer = document.createElement('div');
            farmChartContainer.className = 'farm-charts-container';
            farmChartContainer.innerHTML = `<h4>農場: ${farm} - グラフ</h4>`;
            advancedResults.appendChild(farmChartContainer);
            
            // 円グラフ用キャンバス
            const pieCanvas = document.createElement('canvas');
            pieCanvas.id = `farm-${farm}-pie-chart`.replace(/\s+/g, '-');
            farmChartContainer.appendChild(pieCanvas);
            
            // 棒グラフ用キャンバス
            const barCanvas = document.createElement('canvas');
            barCanvas.id = `farm-${farm}-bar-chart`.replace(/\s+/g, '-');
            farmChartContainer.appendChild(barCanvas);
            
            // データ準備
            const labels = Object.keys(data);
            const values = labels.map(key => data[key].total);
            const pregnantValues = labels.map(key => data[key].pregnant);
            const rates = labels.map(key => 
                data[key].total > 0 ? (data[key].pregnant / data[key].total * 100) : 0
            );
            
            // 色の配列
            const backgroundColors = [
                'rgba(54, 162, 235, 0.5)', 'rgba(255, 99, 132, 0.5)', 
                'rgba(255, 206, 86, 0.5)', 'rgba(75, 192, 192, 0.5)',
                'rgba(153, 102, 255, 0.5)', 'rgba(255, 159, 64, 0.5)',
                'rgba(199, 199, 199, 0.5)', 'rgba(83, 102, 255, 0.5)', 
                'rgba(40, 159, 64, 0.5)', 'rgba(210, 199, 199, 0.5)'
            ];
            
            // 円グラフ作成
            new Chart(pieCanvas, {
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
                        },
                        title: {
                            display: true,
                            text: `${farm} - 頭数分布`
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
            
            // 棒グラフ作成（受胎率）
            new Chart(barCanvas, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: '受胎率 (%)',
                        data: rates,
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: `${farm} - 受胎率`
                        }
                    }
                }
            });
        }
    }
});
