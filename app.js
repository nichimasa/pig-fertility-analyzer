// Firebaseの設定
const firebaseConfig = {
  apiKey: "AIzaSyAnnxQRTEhZkgYn58FiKq9FpHUx3hOxPnU",
  authDomain: "pig-fertility-analyzer.firebaseapp.com",
  projectId: "pig-fertility-analyzer",
  storageBucket: "pig-fertility-analyzer.appspot.com",
  messagingSenderId: "246286434358",
  appId: "1:246286434358:web:f37be99c02854fcef2d897"
};

// Firebase初期化
firebase.initializeApp(firebaseConfig);

// Firebase各サービスへの参照
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// グローバル変数の定義
let currentUser = null; 

document.addEventListener('DOMContentLoaded', function() {
    // Firebase認証関連の要素
    const authSection = document.getElementById('authSection');
    const userSection = document.getElementById('userSection');
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    const signInBtn = document.getElementById('signInBtn');
    const signUpBtn = document.getElementById('signUpBtn');
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    const signOutBtn = document.getElementById('signOutBtn');
    const userEmail = document.getElementById('userEmail');
    const savedFilesSection = document.querySelector('.saved-files-section');
    const savedFilesList = document.querySelector('.saved-files-list');
    
    // DOM要素の参照を取得
    const fileInput = document.getElementById('csvFile');
    const encodingSelect = document.getElementById('encoding');
    const startAnalysisBtn = document.getElementById('start-analysis-btn');
    const analysisContainer = document.querySelector('.analysis-container');
    const loadingIndicator = document.getElementById('loading-indicator');
    
    // フィルター要素 - 花泉1号
    const yearFilter1 = document.getElementById('year-filter-1');
    const monthFilter1 = document.getElementById('month-filter-1');
    const weekFilter1 = document.getElementById('week-filter-1');
    const buildingFilter1 = document.getElementById('building-filter-1');
    const parityFilter1 = document.getElementById('parity-filter-1');
    const boarFilter1 = document.getElementById('boar-filter-1');
    const resetFilterBtn1 = document.getElementById('reset-filter-btn-1');
    const applyFilterBtn1 = document.getElementById('apply-filter-btn-1');
    const filterDescription1 = document.getElementById('filter-description-1');
    
    // フィルター要素 - 花泉2号
    const yearFilter2 = document.getElementById('year-filter-2');
    const monthFilter2 = document.getElementById('month-filter-2');
    const weekFilter2 = document.getElementById('week-filter-2');
    const buildingFilter2 = document.getElementById('building-filter-2');
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
    const nonPregnantStats1 = document.getElementById('non-pregnant-stats-1');
    
    // 結果表示エリア - 花泉2号
    const overallStats2 = document.getElementById('overall-stats-2');
    const buildingStats2 = document.getElementById('building-stats-2');
    const parityStats2 = document.getElementById('parity-stats-2');
    const boarStats2 = document.getElementById('boar-stats-2');
    const nonPregnantStats2 = document.getElementById('non-pregnant-stats-2');
    
    let selectedFile = null;
    let allData = [];
    let farm1Data = [];
    let farm2Data = [];
    let farm1FilteredData = [];
    let farm2FilteredData = [];
    
    // 農場ごとのリスト
    let farm1YearList = [];
    let farm1BuildingList = [];
    let farm1ParityList = [];
    let farm1BoarList = [];
    let farm1WeekList = [];
    
    let farm2YearList = [];
    let farm2BuildingList = [];
    let farm2ParityList = [];
    let farm2BoarList = [];
    let farm2WeekList = [];
    
    // ユーティリティ関数を定義
    function sortBoarNames(a, b) {
        // 特殊ケース: '不明'は常に最後に
        if (a === '不明') return 1;
        if (b === '不明') return -1;
        
        // アルファベットと数字を分離する正規表現
        const regExp = /([A-Za-z]+)(\d*)/;
        
        const matchA = a.match(regExp);
        const matchB = b.match(regExp);
        
        // マッチしない場合は文字列としてそのまま比較
        if (!matchA || !matchB) return a.localeCompare(b);
        
        const alphaA = matchA[1]; // アルファベット部分
        const alphaB = matchB[1];
        
        // アルファベットが異なる場合はそれで比較
        if (alphaA !== alphaB) return alphaA.localeCompare(alphaB);
        
        // アルファベットが同じ場合は数字部分を数値として比較
        const numA = matchA[2] ? parseInt(matchA[2], 10) : 0;
        const numB = matchB[2] ? parseInt(matchB[2], 10) : 0;
        
        return numA - numB;
    }

    // 豚舎名をソートする関数（経産種豚舎 → 育成種豚舎の順）
    function sortBuildingNames(a, b) {
        // 特殊ケース: '不明'は常に最後に
        if (a === '不明') return 1;
        if (b === '不明') return -1;
        
        // 経産種豚舎が最初に来るようにする
        if (a.includes('経産種豚舎') && !b.includes('経産種豚舎')) return -1;
        if (!a.includes('経産種豚舎') && b.includes('経産種豚舎')) return 1;
        
        // どちらも経産か育成の場合は数字で比較
        if ((a.includes('経産種豚舎') && b.includes('経産種豚舎')) || 
            (a.includes('育成種豚舎') && b.includes('育成種豚舎'))) {
            // 数字部分を抽出して比較
            const numA = parseInt(a.match(/(\d+)/)?.[1] || '0', 10);
            const numB = parseInt(b.match(/(\d+)/)?.[1] || '0', 10);
            return numA - numB;
        }
        
        // それ以外は通常の文字列比較
        return a.localeCompare(b);
    }
    
  // 認証状態監視
auth.onAuthStateChanged(user => {
    console.log("認証状態変更:", user ? "ログイン中" : "未ログイン");
    currentUser = user;
    
    updateUIBasedOnAuth();
    
    if (user) {
        console.log("ユーザーID:", user.uid);
        // 保存済みファイル一覧を読み込む
        setTimeout(() => {
            loadSavedFilesList();
        }, 1000);
    }
});
    
   // UI更新（認証状態に応じて）
function updateUIBasedOnAuth() {
    if (!authSection || !userSection) {
        console.log("UI要素が見つかりません");
        return; // UI要素が見つからない場合は処理を中断
    }
    
    if (currentUser) {
        // ログイン済み
        authSection.style.display = 'none';
        userSection.style.display = 'block';
        userEmail.textContent = currentUser.email || currentUser.displayName || currentUser.uid;
    } else {
        // 未ログイン
        authSection.style.display = 'block';
        userSection.style.display = 'none';
        if (savedFilesSection) {
            savedFilesSection.style.display = 'none';
        }
    }
}// UI更新（認証状態に応じて）
function updateUIBasedOnAuth() {
    // 必要な要素の存在チェック
    const authSection = document.getElementById('authSection');
    const userSection = document.getElementById('userSection');
    const userEmail = document.getElementById('userEmail');
    const savedFilesSection = document.querySelector('.saved-files-section');
    
    if (!authSection || !userSection) {
        console.log("UI要素が見つかりません");
        return; // UI要素が見つからない場合は処理を中断
    }
    
    if (currentUser) {
        // ログイン済み
        authSection.style.display = 'none';
        userSection.style.display = 'block';
        if (userEmail) {
            userEmail.textContent = currentUser.email || currentUser.displayName || currentUser.uid;
        }
    } else {
        // 未ログイン
        authSection.style.display = 'block';
        userSection.style.display = 'none';
        if (savedFilesSection) {
            savedFilesSection.style.display = 'none';
        }
    }
}

    // メールでサインイン
    signInBtn.addEventListener('click', function() {
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        if (!email || !password) {
            alert('メールアドレスとパスワードを入力してください');
            return;
        }
        
        auth.signInWithEmailAndPassword(email, password)
            .then(userCredential => {
                console.log('ログイン成功:', userCredential.user.email);
                emailInput.value = '';
                passwordInput.value = '';
            })
            .catch(error => {
                console.error('ログインエラー:', error);
                alert(`ログインエラー: ${error.message}`);
            });
    });
    
    // 新規ユーザー登録
    signUpBtn.addEventListener('click', function() {
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        if (!email || !password) {
            alert('メールアドレスとパスワードを入力してください');
            return;
        }
        
        if (password.length < 6) {
            alert('パスワードは6文字以上にしてください');
            return;
        }
        
        auth.createUserWithEmailAndPassword(email, password)
            .then(userCredential => {
                console.log('ユーザー登録成功:', userCredential.user.email);
                emailInput.value = '';
                passwordInput.value = '';
            })
            .catch(error => {
                console.error('登録エラー:', error);
                alert(`登録エラー: ${error.message}`);
            });
    });
    
    // Googleでログイン
    googleSignInBtn.addEventListener('click', function() {
        const provider = new firebase.auth.GoogleAuthProvider();
        
        auth.signInWithPopup(provider)
            .then(result => {
                console.log('Googleログイン成功:', result.user.displayName);
            })
            .catch(error => {
                console.error('Googleログインエラー:', error);
                alert(`Googleログインエラー: ${error.message}`);
            });
    });
    
    // ログアウト
    signOutBtn.addEventListener('click', function() {
        auth.signOut()
            .then(() => {
                console.log('ログアウト成功');
            })
            .catch(error => {
                console.error('ログアウトエラー:', error);
            });
    });
    
    // UI更新（認証状態に応じて）
    function updateUIBasedOnAuth() {
        if (currentUser) {
            // ログイン済み
            authSection.style.display = 'none';
            userSection.style.display = 'block';
            userEmail.textContent = currentUser.email || currentUser.displayName || currentUser.uid;
        } else {
            // 未ログイン
            authSection.style.display = 'block';
            userSection.style.display = 'none';
            savedFilesSection.style.display = 'none';
        }
    }
    
    // ファイル選択時の処理
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            console.log("File selected:", e.target.files);
            
            if (e.target.files && e.target.files.length > 0) {
                selectedFile = e.target.files[0];
                console.log("Selected file:", selectedFile.name);
                
                // 分析開始ボタンを有効化（setTimeout で少し遅延させて確実に実行）
                setTimeout(function() {
                    if (startAnalysisBtn) {
                        startAnalysisBtn.disabled = false;
                        console.log("Start button enabled");
                    }
                }, 100);
                
                // ファイル名を表示
                const fileName = document.createElement('p');
                fileName.textContent = `選択されたファイル: ${selectedFile.name}`;
                fileName.className = 'selected-file';
                
                // 既存のファイル名表示を削除
                const existingFileName = document.querySelector('.selected-file');
                if (existingFileName) {
                    existingFileName.remove();
                }
                
                if (fileInput.parentNode) {
                    fileInput.parentNode.insertBefore(fileName, startAnalysisBtn);
                }
            } else {
                selectedFile = null;
                if (startAnalysisBtn) {
                    startAnalysisBtn.disabled = true;
                }
            }
        });
    }
    
    // 分析開始ボタンクリック時の処理
    startAnalysisBtn.addEventListener('click', function() {
        if (!selectedFile) return;
        
        // 未ログインの場合はログインを促す
        if (!currentUser) {
            alert('データを保存するにはログインしてください');
            authSection.scrollIntoView({ behavior: 'smooth' });
            return;
        }
        
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
                  try {
                console.log("Firebase保存開始");
                saveCSVToFirebase(selectedFile.name, allData)
                    .then(() => {
                        console.log("Firebase保存完了");
                    })
                    .catch(err => {
                        console.error("Firebase保存エラー:", err);
                    });
            } catch (error) {
                console.error("保存処理実行エラー:", error);
            }
                    
    // CSVデータをFirebaseに保存（シンプル版）
function saveCSVToFirebase(fileName, csvData) {
    console.log("保存関数開始:", fileName);
    
    if (!currentUser) {
        console.error("ユーザーがログインしていません");
        alert('保存するにはログインしてください');
        return Promise.reject("未ログイン");
    }
    
    // 基本情報
    const userId = currentUser.uid;
    const timestamp = firebase.firestore.FieldValue.serverTimestamp();
    const saveDate = new Date().toISOString();
    
    console.log("保存ユーザー:", userId);
    console.log("データ件数:", csvData.length);
    
    // メタデータ保存
    return db.collection('users').doc(userId).collection('csvFiles').add({
        fileName: fileName,
        saveDate: saveDate,
        createdAt: timestamp,
        dataCount: csvData.length
    })
    .then(docRef => {
        console.log("メタデータ保存完了:", docRef.id);
        
        // JSONデータ作成
        const jsonData = JSON.stringify(csvData);
        const storagePath = `users/${userId}/csvFiles/${docRef.id}.json`;
        
        console.log("Storage保存開始:", storagePath);
        return storage.ref(storagePath).putString(jsonData, 'raw');
    })
    .then(() => {
        console.log("Storage保存完了");
        alert(`ファイル「${fileName}」を保存しました`);
        
        // 一覧更新
        setTimeout(loadSavedFilesList, 1000);
        return true;
    })
        .catch(error => {
            console.error('保存エラー:', error);
            alert('ファイルの保存に失敗しました');
        });
    }
    
    // 保存済みファイル一覧を取得（シンプル版）
function loadSavedFilesList() {
    console.log("ファイル一覧読み込み開始");
    
    if (!currentUser) {
        console.log("ユーザーがログインしていません");
        return;
    }
    
    const userId = currentUser.uid;
    console.log("ユーザーID:", userId);
    
    if (!savedFilesSection || !savedFilesList) {
        console.error("UI要素が見つかりません");
        return;
    }
    
    savedFilesSection.style.display = 'block';
    savedFilesList.innerHTML = '<p>読み込み中...</p>';
    
    db.collection('users').doc(userId).collection('csvFiles')
        .orderBy('createdAt', 'desc')
        .get()
        .then(snapshot => {
            console.log("ファイル数:", snapshot.size);
            
            if (snapshot.empty) {
                savedFilesList.innerHTML = '<p>保存されたファイルはありません</p>';
                return;
            }
            
            savedFilesList.innerHTML = '';
            
            snapshot.forEach(doc => {
                const fileData = doc.data();
                const fileId = doc.id;
                console.log("ファイル読み込み:", fileId, fileData.fileName);
                
                const fileDate = fileData.saveDate ? new Date(fileData.saveDate) : new Date();
                const formattedDate = `${fileDate.getFullYear()}/${fileDate.getMonth()+1}/${fileDate.getDate()} ${fileDate.getHours()}:${String(fileDate.getMinutes()).padStart(2, '0')}`;
                
                const fileItem = document.createElement('div');
                fileItem.className = 'saved-file-item';
                fileItem.innerHTML = `
                    <div class="saved-file-info">
                        <div class="saved-file-name">${fileData.fileName}</div>
                        <div class="saved-file-date">保存日時: ${formattedDate}</div>
                    </div>
                    <div class="saved-file-actions">
                        <button class="load-file-btn" data-id="${fileId}">読み込み</button>
                        <button class="delete-file-btn" data-id="${fileId}">削除</button>
                    </div>
                `;
                
                savedFilesList.appendChild(fileItem);
            });
            
            // イベントリスナーの設定
            setupFileActionListeners();
        })
        .catch(error => {
            console.error("ファイル一覧エラー:", error);
            savedFilesList.innerHTML = `<p>ファイル一覧の取得に失敗しました: ${error.message}</p>`;
        });
}
    
    // ファイルアクションのイベントリスナー設定
    function setupFileActionListeners() {
        // 読み込みボタンのイベントリスナー
        document.querySelectorAll('.load-file-btn').forEach(button => {
            button.addEventListener('click', function() {
                const fileId = this.getAttribute('data-id');
                loadSavedFile(fileId);
            });
        });
        
        // 削除ボタンのイベントリスナー
        document.querySelectorAll('.delete-file-btn').forEach(button => {
            button.addEventListener('click', function() {
                const fileId = this.getAttribute('data-id');
                deleteSavedFile(fileId);
            });
        });
    }
    
    // 保存済みファイルを読み込む
    function loadSavedFile(fileId) {
        if (!currentUser) return;
        
        // メタデータをFirestoreから取得
        db.collection('users').doc(currentUser.uid).collection('csvFiles').doc(fileId)
            .get()
            .then(doc => {
                if (!doc.exists) {
                    throw new Error('ファイルが見つかりません');
                }
                
                const fileData = doc.data();
                
                // StorageからJSONデータを取得
                const storagePath = `users/${currentUser.uid}/csvFiles/${fileId}.json`;
                const storageRef = storage.ref(storagePath);
                
                return storageRef.getDownloadURL()
                    .then(url => {
                        // URLからデータを取得
                        return fetch(url)
                            .then(response => response.text())
                            .then(jsonText => {
                                // JSON文字列をパース
                                const csvData = JSON.parse(jsonText);
                                
                                // 読み込み中の表示
                                loadingIndicator.style.display = 'block';
                                analysisContainer.style.display = 'none';
                                
                                // データ処理・分析実行
                                setTimeout(function() {
                                    // データを設定
                                    allData = csvData;
                                    
                                    // 農場ごとにデータを分割
                                    farm1Data = allData.filter(row => row['農場'] === '花泉1号');
                                    farm2Data = allData.filter(row => row['農場'] === '花泉2号');
                                    
                                    // 初期状態ではフィルターなし
                                    farm1FilteredData = [...farm1Data];
                                    farm2FilteredData = [...farm2Data];
                                    
                                    // 各種リストを抽出
                                    extractFarm1Lists();
                                    extractFarm2Lists();
                                    
                                    // フィルターオプションを設定
                                    populateFilterOptions();
                                    
                                    // 分析結果表示
                                    loadingIndicator.style.display = 'none';
                                    analysisContainer.style.display = 'flex';
                                    
                                    // 統計計算・表示
                                    calculateFarm1Stats();
                                    calculateFarm2Stats();
                                    
                                    // フィルターの状態を更新
                                    updateFilterDescription1();
                                    updateFilterDescription2();
                                    
                                    // ファイル名表示
                                    const fileName = document.createElement('p');
                                    fileName.textContent = `読み込んだファイル: ${fileData.fileName}`;
                                    fileName.className = 'selected-file';
                                    
                                    // 既存のファイル名表示を削除
                                    const existingFileName = document.querySelector('.selected-file');
                                    if (existingFileName) {
                                        existingFileName.remove();
                                    }
                                    
                                    fileInput.parentNode.insertBefore(fileName, startAnalysisBtn);
                                }, 500);
                            });
                    });
            })
            .catch(error => {
                console.error('ファイル読み込みエラー:', error);
                alert('ファイルの読み込みに失敗しました');
                loadingIndicator.style.display = 'none';
            });
    }
    
    // 保存済みファイルを削除
    function deleteSavedFile(fileId) {
        if (!currentUser) return;
        
        if (confirm('このファイルを削除してもよろしいですか？')) {
            // Firestoreからメタデータを削除
            db.collection('users').doc(currentUser.uid).collection('csvFiles').doc(fileId)
                .delete()
                .then(() => {
                    // Storageからファイルを削除
                    const storagePath = `users/${currentUser.uid}/csvFiles/${fileId}.json`;
                    const storageRef = storage.ref(storagePath);
                    
                    return storageRef.delete()
                        .then(() => {
                            alert('ファイルを削除しました');
                            // 保存済みファイル一覧を更新
                            loadSavedFilesList();
                        });
                })
                .catch(error => {
                    console.error('ファイル削除エラー:', error);
                    alert('ファイルの削除に失敗しました');
                });
        }
    }

    // 農場1の各種リストを抽出
    function extractFarm1Lists() {
        // 年リスト抽出
        const yearSet = new Set();
        farm1Data.forEach(row => {
            if (row['種付日']) {
                const date = new Date(row['種付日']);
                if (!isNaN(date.getTime())) {
                    yearSet.add(date.getFullYear());
                }
            }
        });
        farm1YearList = Array.from(yearSet).sort();
        
        // 豚舎リスト抽出
        farm1BuildingList = [...new Set(farm1Data.map(row => row['豚舎'] || '不明'))].filter(building => building);
        
        // 産次リスト抽出
        farm1ParityList = [...new Set(farm1Data.map(row => row['産次'] || '不明'))].filter(parity => parity);
        
        // 雄豚リスト抽出
        farm1BoarList = [...new Set(farm1Data.map(row => row['雄豚・精液・あて雄'] || '不明'))].filter(boar => boar);
        
        // 週リスト抽出
        const weekData = {};
        farm1Data.forEach(row => {
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
                            end: weekInfo.end,
                            displayKey: `${weekInfo.year}年第${weekInfo.week}週 (${formatDate(weekInfo.start)}～${formatDate(weekInfo.end)})`
                        };
                    }
                }
            }
        });
        
        // 週リストをソート
        farm1WeekList = Object.values(weekData).sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.week - b.week;
        });
    }
    
    // 農場2の各種リストを抽出
    function extractFarm2Lists() {
        // 年リスト抽出
        const yearSet = new Set();
        farm2Data.forEach(row => {
            if (row['種付日']) {
                const date = new Date(row['種付日']);
                if (!isNaN(date.getTime())) {
                    yearSet.add(date.getFullYear());
                }
            }
        });
        farm2YearList = Array.from(yearSet).sort();
        
        // 豚舎リスト抽出
        farm2BuildingList = [...new Set(farm2Data.map(row => row['豚舎'] || '不明'))].filter(building => building);
        
        // 産次リスト抽出
        farm2ParityList = [...new Set(farm2Data.map(row => row['産次'] || '不明'))].filter(parity => parity);
        
        // 雄豚リスト抽出
        farm2BoarList = [...new Set(farm2Data.map(row => row['雄豚・精液・あて雄'] || '不明'))].filter(boar => boar);
        
        // 週リスト抽出
        const weekData = {};
        farm2Data.forEach(row => {
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
                            end: weekInfo.end,
                            displayKey: `${weekInfo.year}年第${weekInfo.week}週 (${formatDate(weekInfo.start)}～${formatDate(weekInfo.end)})`
                        };
                    }
                }
            }
        });
        
        // 週リストをソート
        farm2WeekList = Object.values(weekData).sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.week - b.week;
        });
    }
    
    // フィルターオプションを設定
    function populateFilterOptions() {
        // 花泉1号のフィルターオプション
        // 年フィルター
        yearFilter1.innerHTML = '<option value="all">すべて</option>';
        farm1YearList.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = `${year}年`;
            yearFilter1.appendChild(option);
        });
        
        // 豚舎フィルター
        buildingFilter1.innerHTML = '<option value="all">すべて</option>';
        farm1BuildingList.forEach(building => {
            const option = document.createElement('option');
            option.value = building;
            option.textContent = building;
            buildingFilter1.appendChild(option);
        });
        
        // 産次フィルター
        parityFilter1.innerHTML = '<option value="all">すべて</option>';
        farm1ParityList.forEach(parity => {
            const option = document.createElement('option');
            option.value = parity;
            option.textContent = parity;
            parityFilter1.appendChild(option);
        });
        
        // 雄豚フィルター
        boarFilter1.innerHTML = '<option value="all">すべて</option>';
        farm1BoarList.forEach(boar => {
            const option = document.createElement('option');
            option.value = boar;
            option.textContent = boar;
            boarFilter1.appendChild(option);
        });
        
        // 週フィルター
        weekFilter1.innerHTML = '<option value="all">すべて</option>';
        farm1WeekList.forEach(weekInfo => {
            const option = document.createElement('option');
            option.value = `${weekInfo.year}-W${weekInfo.week}`;
            option.textContent = weekInfo.displayKey;
            weekFilter1.appendChild(option);
        });
        
        // 花泉2号のフィルターオプション
        // 年フィルター
        yearFilter2.innerHTML = '<option value="all">すべて</option>';
        farm2YearList.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = `${year}年`;
            yearFilter2.appendChild(option);
        });
        
        // 豚舎フィルター
        buildingFilter2.innerHTML = '<option value="all">すべて</option>';
        farm2BuildingList.forEach(building => {
            const option = document.createElement('option');
            option.value = building;
            option.textContent = building;
            buildingFilter2.appendChild(option);
        });
        
        // 産次フィルター
        parityFilter2.innerHTML = '<option value="all">すべて</option>';
        farm2ParityList.forEach(parity => {
            const option = document.createElement('option');
            option.value = parity;
            option.textContent = parity;
            parityFilter2.appendChild(option);
        });
        
        // 雄豚フィルター
        boarFilter2.innerHTML = '<option value="all">すべて</option>';
        farm2BoarList.forEach(boar => {
            const option = document.createElement('option');
            option.value = boar;
            option.textContent = boar;
            boarFilter2.appendChild(option);
        });
        
        // 週フィルター
        weekFilter2.innerHTML = '<option value="all">すべて</option>';
        farm2WeekList.forEach(weekInfo => {
            const option = document.createElement('option');
            option.value = `${weekInfo.year}-W${weekInfo.week}`;
            option.textContent = weekInfo.displayKey;
            weekFilter2.appendChild(option);
        });
        
        // 年フィルターが変わったら週フィルターを更新
        yearFilter1.addEventListener('change', function() {
            updateWeekFilterByYear(1);
        });
        
        yearFilter2.addEventListener('change', function() {
            updateWeekFilterByYear(2);
        });
    }
    
    // 年フィルターに基づいて週フィルターを更新
    function updateWeekFilterByYear(farmNum) {
        const yearFilter = farmNum === 1 ? yearFilter1 : yearFilter2;
        const weekFilter = farmNum === 1 ? weekFilter1 : weekFilter2;
        const weekList = farmNum === 1 ? farm1WeekList : farm2WeekList;
        
        const selectedYear = yearFilter.value;
        
        // 「すべて」を選択した場合は全週を表示
        if (selectedYear === 'all') {
            weekFilter.innerHTML = '<option value="all">すべて</option>';
            weekList.forEach(weekInfo => {
                const option = document.createElement('option');
                option.value = `${weekInfo.year}-W${weekInfo.week}`;
                option.textContent = weekInfo.displayKey;
                weekFilter.appendChild(option);
            });
        } else {
            // 選択した年の週だけをフィルタリング
            const filteredWeeks = weekList.filter(weekInfo => weekInfo.year == selectedYear);
            
            weekFilter.innerHTML = '<option value="all">すべて</option>';
            filteredWeeks.forEach(weekInfo => {
                const option = document.createElement('option');
                option.value = `${weekInfo.year}-W${weekInfo.week}`;
                option.textContent = weekInfo.displayKey;
                weekFilter.appendChild(option);
            });
        }
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

    // フィルターリセットボタン - 花泉1号
    resetFilterBtn1.addEventListener('click', function() {
        yearFilter1.value = 'all';
        monthFilter1.value = 'all';
        weekFilter1.value = 'all';
        buildingFilter1.value = 'all';
        parityFilter1.value = 'all';
        boarFilter1.value = 'all';
        
        // 週フィルターを更新
        updateWeekFilterByYear(1);
        
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
        
        if (yearFilter1.value !== 'all') filterStates.push(`${yearFilter1.value}年`);
        if (monthFilter1.value !== 'all') filterStates.push(`${monthFilter1.value}月`);
        if (weekFilter1.value !== 'all') {
            const weekOption = weekFilter1.options[weekFilter1.selectedIndex];
            filterStates.push(weekOption.textContent);
        }
        if (buildingFilter1.value !== 'all') filterStates.push(`豚舎=${buildingFilter1.value}`);
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
            // 年フィルター
            if (yearFilter1.value !== 'all' && row['種付日']) {
                const date = new Date(row['種付日']);
                if (!isNaN(date.getTime())) {
                    const year = date.getFullYear();
                    if (parseInt(yearFilter1.value) !== year) {
                        return false;
                    }
                }
            }
            
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
            
            // 週フィルター
            if (weekFilter1.value !== 'all' && row['種付日']) {
                const date = new Date(row['種付日']);
                if (!isNaN(date.getTime())) {
                    const weekInfo = getWeekInfo(date);
                    const weekKey = `${weekInfo.year}-W${weekInfo.week}`;
                    if (weekFilter1.value !== weekKey) {
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
        yearFilter2.value = 'all';
        monthFilter2.value = 'all';
        weekFilter2.value = 'all';
        buildingFilter2.value = 'all';
        parityFilter2.value = 'all';
        boarFilter2.value = 'all';
        
        // 週フィルターを更新
        updateWeekFilterByYear(2);
        
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
        
        if (yearFilter2.value !== 'all') filterStates.push(`${yearFilter2.value}年`);
        if (monthFilter2.value !== 'all') filterStates.push(`${monthFilter2.value}月`);
        if (weekFilter2.value !== 'all') {
            const weekOption = weekFilter2.options[weekFilter2.selectedIndex];
            filterStates.push(weekOption.textContent);
        }
        if (buildingFilter2.value !== 'all') filterStates.push(`豚舎=${buildingFilter2.value}`);
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
            // 年フィルター
            if (yearFilter2.value !== 'all' && row['種付日']) {
                const date = new Date(row['種付日']);
                if (!isNaN(date.getTime())) {
                    const year = date.getFullYear();
                    if (parseInt(yearFilter2.value) !== year) {
                        return false;
                    }
                }
            }
            
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
            
            // 週フィルター
            if (weekFilter2.value !== 'all' && row['種付日']) {
                const date = new Date(row['種付日']);
                if (!isNaN(date.getTime())) {
                    const weekInfo = getWeekInfo(date);
                    const weekKey = `${weekInfo.year}-W${weekInfo.week}`;
                    if (weekFilter2.value !== weekKey) {
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
        
        // 不受胎母豚一覧
        calculateFarm1NonPregnantStats();
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
        
        // 不受胎母豚一覧
        calculateFarm2NonPregnantStats();
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
        
        // 豚舎をソート（経産種豚舎 → 育成種豚舎の順）
        const sortedBuildingData = {};
        Object.keys(buildingData)
            .sort(sortBuildingNames)
            .forEach(building => {
                sortedBuildingData[building] = buildingData[building];
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
        
        for (const building in sortedBuildingData) {  // sortedBuildingDataを使用
            const rate = sortedBuildingData[building].total > 0 ? 
                (sortedBuildingData[building].pregnant / sortedBuildingData[building].total * 100).toFixed(2) : 0;
            
            html += `
                <tr>
                    <td>${building}</td>
                    <td>${sortedBuildingData[building].total}</td>
                    <td>${sortedBuildingData[building].pregnant}</td>
                    <td>${rate}%</td>
                </tr>
            `;
            
            totalAll += sortedBuildingData[building].total;
            pregnantAll += sortedBuildingData[building].pregnant;
        }
        
        // 合計行
        const totalRate = totalAll > 0 ? (pregnantAll / totalAll * 100).toFixed(2) : 0;
        html += `<tr class="total-row"><td>合計</td><td>${totalAll}</td><td>${pregnantAll}</td><td>${totalRate}%</td></tr>`;
        
        html += `</table>`;
        html += `<div class="chart-container" id="building-chart-1"></div>`;
        
        buildingStats1.innerHTML = html;
        
        // 円グラフ
        if (totalAll > 0) {
            createDataDistributionPieChart('building-chart-1', '豚舎別データ分布', sortedBuildingData);  // sortedBuildingDataを使用
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
        
        // 雄豚をアルファベット順→数字順にソート
        const sortedBoarData = {};
        Object.keys(boarData)
            .sort(sortBoarNames)
            .forEach(boar => {
                sortedBoarData[boar] = boarData[boar];
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
        
        for (const boar in sortedBoarData) {  // sortedBoarDataを使用
            const rate = sortedBoarData[boar].total > 0 ? 
                (sortedBoarData[boar].pregnant / sortedBoarData[boar].total * 100).toFixed(2) : 0;
            
            html += `
                <tr>
                    <td>${boar}</td>
                    <td>${sortedBoarData[boar].total}</td>
                    <td>${sortedBoarData[boar].pregnant}</td>
                    <td>${rate}%</td>
                </tr>
            `;
            
            totalAll += sortedBoarData[boar].total;
            pregnantAll += sortedBoarData[boar].pregnant;
        }
        
        // 合計行
        const totalRate = totalAll > 0 ? (pregnantAll / totalAll * 100).toFixed(2) : 0;
        html += `<tr class="total-row"><td>合計</td><td>${totalAll}</td><td>${pregnantAll}</td><td>${totalRate}%</td></tr>`;
        
        html += `</table>`;
        html += `<div class="chart-container" id="boar-chart-1"></div>`;
        
        boarStats1.innerHTML = html;
        
        // 円グラフ
        if (totalAll > 0) {
            createDataDistributionPieChart('boar-chart-1', '雄豚・精液別データ分布', sortedBoarData);  // sortedBoarDataを使用
        }
    }
    
    // 花泉1号の不受胎母豚一覧
    function calculateFarm1NonPregnantStats() {
        // 不受胎データをフィルタリング
        const nonPregnantData = farm1FilteredData.filter(row => {
            const result = (row['妊娠鑑定結果'] || '').trim();
            return result !== '受胎確定';  // 空白チェックの条件を削除
        });
        
        // テーブル生成
        let html = `
            <h3>不受胎母豚一覧</h3>
        `;
        
        if (nonPregnantData.length === 0) {
            html += `<p class="no-data">該当データがありません</p>`;
            nonPregnantStats1.innerHTML = html;
            return;
        }
        
        html += `
            <div class="table-container">
                <table class="non-pregnant-table">
                    <tr>
                        <th>種付日</th>
                        <th>母豚番号</th>
                        <th>雄豚・精液</th>
                        <th>分娩予定日</th>
                        <th>産次</th>
                        <th>離乳後交配日数</th>
                        <th>流産日</th>
                        <th>母豚廃用日</th>
                    </tr>
        `;
        
        // データをソート（種付日の降順）
        nonPregnantData.sort((a, b) => {
            const dateA = new Date(a['種付日'] || '');
            const dateB = new Date(b['種付日'] || '');
            return dateB - dateA; // 降順
        });
        
        // 行の生成
        nonPregnantData.forEach(row => {
            html += `
                <tr>
                    <td>${row['種付日'] || ''}</td>
                    <td>${row['母豚番号'] || ''}</td>
                    <td>${row['雄豚・精液・あて雄'] || ''}</td>
                    <td>${row['分娩予定日'] || ''}</td>
                    <td>${row['産次'] || ''}</td>
                    <td>${row['離乳後交配日数'] || ''}</td>
                    <td>${row['流産日'] || ''}</td>
                    <td>${row['母豚廃用日'] || ''}</td>
                </tr>
            `;
        });
        
        html += `
                </table>
            </div>
        `;
        
        nonPregnantStats1.innerHTML = html;
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
        
        // 豚舎をソート（経産種豚舎 → 育成種豚舎の順）
        const sortedBuildingData = {};
        Object.keys(buildingData)
            .sort(sortBuildingNames)
            .forEach(building => {
                sortedBuildingData[building] = buildingData[building];
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
        
        for (const building in sortedBuildingData) {  // sortedBuildingDataを使用
            const rate = sortedBuildingData[building].total > 0 ? 
                (sortedBuildingData[building].pregnant / sortedBuildingData[building].total * 100).toFixed(2) : 0;
            
            html += `
                <tr>
                    <td>${building}</td>
                    <td>${sortedBuildingData[building].total}</td>
                    <td>${sortedBuildingData[building].pregnant}</td>
                    <td>${rate}%</td>
                </tr>
            `;
            
            totalAll += sortedBuildingData[building].total;
            pregnantAll += sortedBuildingData[building].pregnant;
        }
        
        // 合計行
        const totalRate = totalAll > 0 ? (pregnantAll / totalAll * 100).toFixed(2) : 0;
        html += `<tr class="total-row"><td>合計</td><td>${totalAll}</td><td>${pregnantAll}</td><td>${totalRate}%</td></tr>`;
        
        html += `</table>`;
        html += `<div class="chart-container" id="building-chart-2"></div>`;
        
        buildingStats2.innerHTML = html;
        
        // 円グラフ
        if (totalAll > 0) {
            createDataDistributionPieChart('building-chart-2', '豚舎別データ分布', sortedBuildingData);  // sortedBuildingDataを使用
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
        
        // 雄豚をアルファベット順→数字順にソート
        const sortedBoarData = {};
        Object.keys(boarData)
            .sort(sortBoarNames)
            .forEach(boar => {
                sortedBoarData[boar] = boarData[boar];
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
        
        for (const boar in sortedBoarData) {  // sortedBoarDataを使用
            const rate = sortedBoarData[boar].total > 0 ? 
                (sortedBoarData[boar].pregnant / sortedBoarData[boar].total * 100).toFixed(2) : 0;
            
            html += `
                <tr>
                    <td>${boar}</td>
                    <td>${sortedBoarData[boar].total}</td>
                    <td>${sortedBoarData[boar].pregnant}</td>
                    <td>${rate}%</td>
                </tr>
            `;
            
            totalAll += sortedBoarData[boar].total;
            pregnantAll += sortedBoarData[boar].pregnant;
        }
        
        // 合計行
        const totalRate = totalAll > 0 ? (pregnantAll / totalAll * 100).toFixed(2) : 0;
        html += `<tr class="total-row"><td>合計</td><td>${totalAll}</td><td>${pregnantAll}</td><td>${totalRate}%</td></tr>`;
        
        html += `</table>`;
        html += `<div class="chart-container" id="boar-chart-2"></div>`;
        
        boarStats2.innerHTML = html;
        
        // 円グラフ
        if (totalAll > 0) {
            createDataDistributionPieChart('boar-chart-2', '雄豚・精液別データ分布', sortedBoarData);  // sortedBoarDataを使用
        }
    }
    
    // 花泉2号の不受胎母豚一覧
    function calculateFarm2NonPregnantStats() {
        // 不受胎データをフィルタリング
        const nonPregnantData = farm2FilteredData.filter(row => {
            const result = (row['妊娠鑑定結果'] || '').trim();
            return result !== '受胎確定';  // 空白チェックの条件を削除
        });
        
        // テーブル生成
        let html = `
            <h3>不受胎母豚一覧</h3>
        `;
        
        if (nonPregnantData.length === 0) {
            html += `<p class="no-data">該当データがありません</p>`;
            nonPregnantStats2.innerHTML = html;
            return;
        }
        
        html += `
            <div class="table-container">
                <table class="non-pregnant-table">
                    <tr>
                        <th>種付日</th>
                        <th>母豚番号</th>
                        <th>雄豚・精液</th>
                        <th>分娩予定日</th>
                        <th>産次</th>
                        <th>離乳後交配日数</th>
                        <th>流産日</th>
                        <th>母豚廃用日</th>
                    </tr>
        `;
        
        // データをソート（種付日の降順）
        nonPregnantData.sort((a, b) => {
            const dateA = new Date(a['種付日'] || '');
            const dateB = new Date(b['種付日'] || '');
            return dateB - dateA; // 降順
        });
        
        // 行の生成
        nonPregnantData.forEach(row => {
            html += `
                <tr>
                    <td>${row['種付日'] || ''}</td>
                    <td>${row['母豚番号'] || ''}</td>
                    <td>${row['雄豚・精液・あて雄'] || ''}</td>
                    <td>${row['分娩予定日'] || ''}</td>
                    <td>${row['産次'] || ''}</td>
                    <td>${row['離乳後交配日数'] || ''}</td>
                    <td>${row['流産日'] || ''}</td>
                    <td>${row['母豚廃用日'] || ''}</td>
                </tr>
            `;
        });
        
        html += `
                </table>
            </div>
        `;
        
        nonPregnantStats2.innerHTML = html;
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
