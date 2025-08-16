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
    
    // 全体の受胎率計算
    function calculateOverallStats() {
        const total = pigData.length;
        // 妊娠判定結果をチェック
        const pregnant = pigData.filter(row => {
            const result = (row['妊娠鑑定結果'] || '').trim();
            // 分析ツール内で「受胎」と判断するワードを増やす
            return result === '〇' || result === '陽性' || result === '妊娠' || 
                   result === '受胎' || result === '受胎確定' || result === '受胎済';
        }).length;
        
        const rate = total > 0 ? (pregnant / total * 100).toFixed(2) : 0;
        
        summaryStats.innerHTML = `
            <div class="stat-card">
                <h3>全体の受胎率</h3>
                <p class="rate">${rate}%</p>
                <p>総数: ${total}頭</p>
                <p>受胎: ${pregnant}頭</p>
            </div>
        `;
        
        createBasicChart(pregnant, total - pregnant);
    }
    
    // 基本的なグラフ作成
    function createBasicChart(pregnant, notPregnant) {
        const chartsDiv = document.getElementById('charts');
        chartsDiv.innerHTML = '';
        
        const canvas = document.createElement('canvas');
        chartsDiv.appendChild(canvas);
        
        new Chart(canvas, {
            type: 'pie',
            data: {
                labels: ['受胎', '不受胎/未確認'],
                datasets: [{
                    data: [pregnant, notPregnant],
                    backgroundColor: ['#4CAF50', '#F44336']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: '受胎率グラフ'
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
            if (result === '〇' || result === '陽性' || result === '妊娠' || 
                result === '受胎' || result === '受胎確定' || result === '受胎済') {
                farmData[farm].pregnant++;
            }
        });
        
        displayAnalysisResults(farmData, '農場別受胎率');
    }
    
    // 豚舎別分析
    function analyzeByBuilding() {
        const buildingData = {};
        
        pigData.forEach(row => {
            const building = row['豚舎'] || '不明';
            if (!buildingData[building]) {
                buildingData[building] = { total: 0, pregnant: 0 };
            }
            
            buildingData[building].total++;
            const result = (row['妊娠鑑定結果'] || '').trim();
            if (result === '〇' || result === '陽性' || result === '妊娠' || 
                result === '受胎' || result === '受胎確定' || result === '受胎済') {
                buildingData[building].pregnant++;
            }
        });
        
        displayAnalysisResults(buildingData, '豚舎別受胎率');
    }
    
    // 月別分析
    function analyzeByMonth() {
        const monthData = {};
        
        pigData.forEach(row => {
            if (row['種付日']) {
                const date = new Date(row['種付日']);
                if (!isNaN(date.getTime())) {
                    const month = date.getMonth() + 1;
                    if (!monthData[month]) {
                        monthData[month] = { total: 0, pregnant: 0 };
                    }
                    
                    monthData[month].total++;
                    const result = (row['妊娠鑑定結果'] || '').trim();
                    if (result === '〇' || result === '陽性' || result === '妊娠' || 
                        result === '受胎' || result === '受胎確定' || result === '受胎済') {
                        monthData[month].pregnant++;
                    }
                }
            }
        });
        
        displayAnalysisResults(monthData, '月別受胎率');
    }
    
    // 産次別分析
    function analyzeByParity() {
        const parityData = {};
        
        pigData.forEach(row => {
            const parity = row['産次'] || '不明';
            if (!parityData[parity]) {
                parityData[parity] = { total: 0, pregnant: 0 };
            }
            
            parityData[parity].total++;
            const result = (row['妊娠鑑定結果'] || '').trim();
            if (result === '〇' || result === '陽性' || result === '妊娠' || 
                result === '受胎' || result === '受胎確定' || result === '受胎済') {
                parityData[parity].pregnant++;
            }
        });
        
        displayAnalysisResults(parityData, '産次別受胎率');
    }
    
    // 雄豚・精液別分析
    function analyzeByBoar() {
        const boarData = {};
        
        pigData.forEach(row => {
            const boar = row['雄豚・精液・あて雄'] || '不明';
            if (!boarData[boar]) {
                boarData[boar] = { total: 0, pregnant: 0 };
            }
            
            boarData[boar].total++;
            const result = (row['妊娠鑑定結果'] || '').trim();
            if (result === '〇' || result === '陽性' || result === '妊娠' || 
                result === '受胎' || result === '受胎確定' || result === '受胎済') {
                boarData[boar].pregnant++;
            }
        });
        
        displayAnalysisResults(boarData, '雄豚・精液別受胎率');
    }
    
    // 分析結果表示
    function displayAnalysisResults(data, title) {
        let resultHTML = `<h3>${title}</h3><table><tr><th>区分</th><th>総数</th><th>受胎数</th><th>受胎率</th></tr>`;
        
        for (const key in data) {
            const rate = data[key].total > 0 ? (data[key].pregnant / data[key].total * 100).toFixed(2) : 0;
            resultHTML += `<tr><td>${key}</td><td>${data[key].total}</td><td>${data[key].pregnant}</td><td>${rate}%</td></tr>`;
        }
        
        resultHTML += '</table>';
        advancedResults.innerHTML = resultHTML;
        
        // グラフ作成
        createAnalysisChart(data, title);
    }
    
    // 分析結果のグラフ作成
    function createAnalysisChart(data, title) {
        const canvas = document.createElement('canvas');
        advancedResults.appendChild(canvas);
        
        const labels = Object.keys(data);
        const rates = labels.map(key => 
            data[key].total > 0 ? (data[key].pregnant / data[key].total * 100) : 0
        );
        
        new Chart(canvas, {
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
                        text: title
                    }
                }
            }
        });
    }
});
