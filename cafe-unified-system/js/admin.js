/**
 * 共創カフェ 統合シフト・勤怠管理システム - 管理画面
 */

(function() {
    'use strict';

    const elements = {
        authSection: document.getElementById('authSection'),
        adminSection: document.getElementById('adminSection'),
        adminPassword: document.getElementById('adminPassword'),
        btnLogin: document.getElementById('btnLogin'),
        authError: document.getElementById('authError'),
        // タブ
        tabs: document.querySelectorAll('.tab'),
        tabContents: document.querySelectorAll('.tab-content'),
        // 勤怠一覧
        filterDate: document.getElementById('filterDate'),
        filterName: document.getElementById('filterName'),
        btnSearch: document.getElementById('btnSearch'),
        btnClear: document.getElementById('btnClear'),
        totalAttendance: document.getElementById('totalAttendance'),
        totalHours: document.getElementById('totalHours'),
        lateCount: document.getElementById('lateCount'),
        earlyLeaveCount: document.getElementById('earlyLeaveCount'),
        tableBody: document.getElementById('tableBody'),
        btnExportCsv: document.getElementById('btnExportCsv'),
        // 週別確認
        weeklyViolations: document.getElementById('weeklyViolations'),
        weeklyOverview: document.getElementById('weeklyOverview'),
        // シフト管理
        shiftDate: document.getElementById('shiftDate'),
        shiftDateTitle: document.getElementById('shiftDateTitle'),
        shiftSlotsContainer: document.getElementById('shiftSlotsContainer'),
        btnExportShiftCsv: document.getElementById('btnExportShiftCsv'),
        // シフト設定
        newShiftDate: document.getElementById('newShiftDate'),
        newShiftLabel: document.getElementById('newShiftLabel'),
        newShiftStart: document.getElementById('newShiftStart'),
        newShiftEnd: document.getElementById('newShiftEnd'),
        newShiftStaff: document.getElementById('newShiftStaff'),
        btnAddShiftSlot: document.getElementById('btnAddShiftSlot'),
        currentShiftConfig: document.getElementById('currentShiftConfig'),
        // インポート機能
        btnDownloadCsvTemplate: document.getElementById('btnDownloadCsvTemplate'),
        btnDownloadExcelTemplate: document.getElementById('btnDownloadExcelTemplate'),
        shiftImportFile: document.getElementById('shiftImportFile'),
        importFileName: document.getElementById('importFileName'),
        importPreview: document.getElementById('importPreview'),
        importPreviewContent: document.getElementById('importPreviewContent'),
        btnImportShifts: document.getElementById('btnImportShifts'),
        // データベース移行
        btnMigrateShiftConfig: document.getElementById('btnMigrateShiftConfig'),
        // スタッフ
        staffList: document.getElementById('staffList'),
        staffStatsBody: document.getElementById('staffStatsBody'),
        // データ管理
        btnExportData: document.getElementById('btnExportData'),
        btnClearData: document.getElementById('btnClearData'),
        btnMigrate: document.getElementById('btnMigrate'),
        migrationSection: document.getElementById('migrationSection'),
        // その他
        btnLogout: document.getElementById('btnLogout')
    };

    let allRecords = [];
    let allShiftRequests = [];
    let pendingImportData = [];

    /**
     * 初期化
     */
    async function init() {
        checkAuth();
        setupEventListeners();
        checkMigrationNeeded();

        // GASからシフト枠設定を読み込み（強制リフレッシュ）
        if (typeof fetchShiftSlotConfig === 'function') {
            try {
                Utils.showLoading(true, 'シフト枠設定を読み込み中...');
                await fetchShiftSlotConfig(true); // 強制リフレッシュでDBから最新を取得
                console.log('[admin.init] シフト枠設定を読み込みました');
            } catch (error) {
                console.warn('[admin.init] シフト枠設定の読み込みエラー:', error);
            } finally {
                Utils.showLoading(false);
            }
        }
    }

    /**
     * 認証状態をチェック
     */
    function checkAuth() {
        const token = Utils.getFromStorage(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        if (token === 'authenticated') {
            showAdminSection();
        }
    }

    /**
     * 移行が必要かチェック
     */
    function checkMigrationNeeded() {
        const hasOldData = Utils.hasOldSystemData();
        if (elements.migrationSection) {
            elements.migrationSection.style.display = hasOldData ? 'block' : 'none';
        }
    }

    /**
     * イベントリスナーを設定
     */
    function setupEventListeners() {
        // ログイン
        elements.btnLogin.addEventListener('click', handleLogin);
        elements.adminPassword.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleLogin();
        });

        // タブ切り替え
        elements.tabs.forEach(tab => {
            tab.addEventListener('click', () => handleTabChange(tab.dataset.tab));
        });

        // 勤怠一覧
        elements.btnSearch.addEventListener('click', handleSearch);
        elements.btnClear.addEventListener('click', handleClear);
        elements.btnExportCsv.addEventListener('click', handleExportCsv);

        // シフト管理
        elements.shiftDate.addEventListener('change', handleShiftDateChange);
        elements.btnExportShiftCsv.addEventListener('click', handleExportShiftCsv);

        // シフト設定
        if (elements.btnAddShiftSlot) {
            elements.btnAddShiftSlot.addEventListener('click', handleAddShiftSlot);
        }

        // インポート機能
        if (elements.btnDownloadCsvTemplate) {
            elements.btnDownloadCsvTemplate.addEventListener('click', handleDownloadCsvTemplate);
        }
        if (elements.btnDownloadExcelTemplate) {
            elements.btnDownloadExcelTemplate.addEventListener('click', handleDownloadExcelTemplate);
        }
        if (elements.shiftImportFile) {
            elements.shiftImportFile.addEventListener('change', handleFileSelect);
        }
        if (elements.btnImportShifts) {
            elements.btnImportShifts.addEventListener('click', handleImportShifts);
        }
        if (elements.btnMigrateShiftConfig) {
            elements.btnMigrateShiftConfig.addEventListener('click', handleMigrateShiftConfig);
        }

        // データ管理
        elements.btnExportData.addEventListener('click', handleExportData);
        elements.btnClearData.addEventListener('click', handleClearData);
        elements.btnMigrate.addEventListener('click', handleMigration);

        // ログアウト
        elements.btnLogout.addEventListener('click', handleLogout);
    }

    /**
     * ログイン処理
     */
    function handleLogin() {
        const password = elements.adminPassword.value;
        if (password === CONFIG.ADMIN_PASSWORD) {
            Utils.saveToStorage(CONFIG.STORAGE_KEYS.AUTH_TOKEN, 'authenticated');
            elements.authError.textContent = '';
            showAdminSection();
        } else {
            elements.authError.textContent = 'パスワードが正しくありません';
        }
    }

    /**
     * 管理画面を表示
     */
    function showAdminSection() {
        elements.authSection.style.display = 'none';
        elements.adminSection.style.display = 'block';
        loadData();
    }

    /**
     * データを読み込み
     */
    function loadData() {
        allRecords = Utils.getFromStorage(CONFIG.STORAGE_KEYS.CLOCK_RECORDS) || [];
        allShiftRequests = Utils.getFromStorage(CONFIG.STORAGE_KEYS.SHIFTS) || [];

        initAttendanceTab();
        initWeeklyTab();
        initShiftTab();
        initShiftConfigTab();
        initStaffTab();
    }

    /**
     * タブ切り替え
     */
    function handleTabChange(tabId) {
        elements.tabs.forEach(tab => {
            tab.classList.toggle('tab--active', tab.dataset.tab === tabId);
        });

        elements.tabContents.forEach(content => {
            const isActive = content.id === `tab${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`;
            content.classList.toggle('tab-content--active', isActive);
        });
    }

    // ========== 勤怠一覧タブ ==========

    function initAttendanceTab() {
        populateNameFilter();
        elements.filterDate.value = Utils.formatDate();
        handleSearch();
    }

    function populateNameFilter() {
        const options = CONFIG.STAFF_LIST.map(staff =>
            `<option value="${staff.name}">${staff.name}（${staff.id}）</option>`
        ).join('');
        elements.filterName.innerHTML = '<option value="">全員</option>' + options;
    }

    function handleSearch() {
        const filterDate = elements.filterDate.value;
        const filterName = elements.filterName.value;

        let records = [...allRecords];

        if (filterDate) {
            records = records.filter(r => r.date === filterDate);
        }
        if (filterName) {
            records = records.filter(r => r.staffName === filterName || r.name === filterName);
        }

        const processedData = processAttendanceRecords(records);
        renderAttendanceTable(processedData);
        updateAttendanceSummary(processedData);
    }

    function processAttendanceRecords(records) {
        const grouped = {};

        records.forEach(record => {
            const staffName = record.staffName || record.name || '';
            const key = `${record.date}_${staffName}_${record.slotId || record.slot || 'default'}`;
            if (!grouped[key]) {
                grouped[key] = {
                    date: record.date,
                    name: staffName,
                    staffId: record.staffId || '',
                    slotId: record.slotId || record.slot,
                    slotLabel: record.slotLabel || CONFIG.SHIFT_SLOTS[record.slotId]?.label || '-',
                    inTime: null,
                    outTime: null,
                    inStatus: null,
                    outStatus: null
                };
            }

            // clockType (新形式) または type (旧形式) に対応
            const clockType = (record.clockType || record.type || '').toLowerCase();
            if (clockType === 'in') {
                grouped[key].inTime = record.time;
                grouped[key].inStatus = record.status;
            } else if (clockType === 'out') {
                grouped[key].outTime = record.time;
                grouped[key].outStatus = record.status;
            }
        });

        return Object.values(grouped).sort((a, b) => {
            if (a.date !== b.date) return b.date.localeCompare(a.date);
            return a.name.localeCompare(b.name);
        });
    }

    function renderAttendanceTable(data) {
        if (data.length === 0) {
            elements.tableBody.innerHTML = '<tr><td colspan="6" class="table__empty">データがありません</td></tr>';
            return;
        }

        const html = data.map(row => {
            let statusBadge = '';
            if (row.inStatus === 'late') {
                statusBadge = '<span class="badge badge--warning">遅刻</span>';
            } else if (row.outStatus === 'early_leave') {
                statusBadge = '<span class="badge badge--warning">早退</span>';
            } else if (row.inTime && row.outTime) {
                statusBadge = '<span class="badge badge--success">完了</span>';
            } else if (row.inTime) {
                statusBadge = '<span class="badge badge--error">未退勤</span>';
            }

            return `
                <tr>
                    <td>${Utils.escapeHtml(row.date)}</td>
                    <td>${Utils.escapeHtml(row.name)}</td>
                    <td>${Utils.escapeHtml(row.slotLabel)}</td>
                    <td>${row.inTime || '-'}</td>
                    <td>${row.outTime || '-'}</td>
                    <td>${statusBadge}</td>
                </tr>
            `;
        }).join('');

        elements.tableBody.innerHTML = html;
    }

    function updateAttendanceSummary(data) {
        const attendance = data.filter(d => d.inTime).length;
        elements.totalAttendance.textContent = attendance;

        let totalMinutes = 0;
        data.forEach(d => {
            if (d.inTime && d.outTime) {
                const [inH, inM] = d.inTime.split(':').map(Number);
                const [outH, outM] = d.outTime.split(':').map(Number);
                let mins = (outH * 60 + outM) - (inH * 60 + inM);
                if (mins < 0) mins += 24 * 60;
                totalMinutes += mins;
            }
        });
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        elements.totalHours.textContent = `${hours}:${String(mins).padStart(2, '0')}`;

        const lateCount = data.filter(d => d.inStatus === 'late').length;
        const earlyLeaveCount = data.filter(d => d.outStatus === 'early_leave').length;
        elements.lateCount.textContent = lateCount;
        elements.earlyLeaveCount.textContent = earlyLeaveCount;
    }

    function handleClear() {
        elements.filterDate.value = '';
        elements.filterName.value = '';
        handleSearch();
    }

    function handleExportCsv() {
        const filterDate = elements.filterDate.value;
        const filterName = elements.filterName.value;

        let records = [...allRecords];
        if (filterDate) records = records.filter(r => r.date === filterDate);
        if (filterName) records = records.filter(r => (r.staffName || r.name) === filterName);

        const data = processAttendanceRecords(records);

        if (data.length === 0) {
            Utils.showMessage('出力するデータがありません', 'error');
            return;
        }

        const headers = ['日付', '学生番号', '名前', 'シフト枠', '出勤', '退勤', '状態'];
        const rows = data.map(row => {
            let status = '';
            if (row.inStatus === 'late') status = '遅刻';
            else if (row.outStatus === 'early_leave') status = '早退';
            else if (row.inTime && row.outTime) status = '完了';
            else if (row.inTime) status = '未退勤';

            return [row.date, row.staffId, row.name, row.slotLabel, row.inTime || '', row.outTime || '', status];
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        Utils.downloadCSV(csvContent, `勤怠記録_${Utils.formatDate()}.csv`);
        Utils.showMessage('CSVをエクスポートしました', 'success');
    }

    // ========== 週別確認タブ ==========

    function initWeeklyTab() {
        loadWeeklyOverview();
    }

    function loadWeeklyOverview() {
        // 週ごと・メンバーごとにグループ化
        const weeklyMap = {};
        allShiftRequests.forEach(sub => {
            const weekKey = sub.weekKey || getWeekKey(sub.date);
            const key = `${weekKey}_${sub.staffId}`;
            if (!weeklyMap[key]) {
                weeklyMap[key] = [];
            }
            weeklyMap[key].push(sub);
        });

        // 週1制約違反を検出
        const violations = [];
        Object.entries(weeklyMap).forEach(([key, subs]) => {
            if (subs.length > 1) {
                violations.push({
                    weekKey: subs[0].weekKey || getWeekKey(subs[0].date),
                    staffId: subs[0].staffId,
                    staffName: subs[0].staffName,
                    count: subs.length,
                    shifts: subs
                });
            }
        });

        // 違反表示
        if (violations.length === 0) {
            elements.weeklyViolations.innerHTML = '<p class="no-violations">週1制約違反はありません</p>';
        } else {
            let violationHtml = '<div class="violation-alert"><h3>週1制約違反が検出されました</h3><ul>';
            violations.forEach(v => {
                const week = CONFIG.WEEKS.find(w => w.weekKey === v.weekKey);
                violationHtml += `
                    <li class="violation-item">
                        <strong>${week ? week.label : v.weekKey}</strong>:
                        ${Utils.escapeHtml(v.staffName)}（${v.staffId}）- ${v.count}件登録
                    </li>
                `;
            });
            violationHtml += '</ul></div>';
            elements.weeklyViolations.innerHTML = violationHtml;
        }

        // 週別概要
        let overviewHtml = '';
        CONFIG.WEEKS.forEach(week => {
            const weekSubs = allShiftRequests.filter(s => {
                const weekKey = s.weekKey || getWeekKey(s.date);
                return weekKey === week.weekKey;
            });
            const memberCount = new Set(weekSubs.map(s => s.staffId)).size;

            overviewHtml += `
                <div class="card week-summary">
                    <h3 class="week-summary__title">${week.label}</h3>
                    <p class="week-summary__count">${memberCount}名がシフト登録済み</p>
                    <div class="week-summary__dates">
            `;

            week.dates.forEach(dateStr => {
                const dateSubs = weekSubs.filter(s => s.date === dateStr);
                if (dateSubs.length > 0) {
                    overviewHtml += `
                        <div class="date-summary">
                            <span class="date-summary__date">${formatDateDisplay(dateStr)}</span>
                            <span class="date-summary__count">${dateSubs.length}名</span>
                        </div>
                    `;
                }
            });

            overviewHtml += '</div></div>';
        });

        elements.weeklyOverview.innerHTML = overviewHtml;
    }

    // ========== シフト管理タブ ==========

    function initShiftTab() {
        populateShiftDateSelect();
        if (elements.shiftDate.value) {
            handleShiftDateChange();
        }
    }

    function populateShiftDateSelect() {
        const options = getOperationDates().map(date => {
            const d = parseDateStr(date);
            const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
            const availableSlots = getAvailableSlots(date);
            const slotCount = availableSlots.length;
            return `<option value="${date}">${d.getMonth() + 1}/${d.getDate()}（${weekdays[d.getDay()]}）- ${slotCount}枠</option>`;
        }).join('');

        elements.shiftDate.innerHTML = '<option value="">-- 日付を選択 --</option>' + options;
    }

    function parseDateStr(dateStr) {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    function handleShiftDateChange() {
        const date = elements.shiftDate.value;
        if (!date) return;

        const d = parseDateStr(date);
        const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
        elements.shiftDateTitle.textContent = `${d.getMonth() + 1}/${d.getDate()}（${weekdays[d.getDay()]}）`;

        const dayShifts = allShiftRequests.filter(r => r.date === date);
        const availableSlots = getAvailableSlots(date);

        if (!elements.shiftSlotsContainer) return;

        if (availableSlots.length === 0) {
            elements.shiftSlotsContainer.innerHTML = '<p class="shift-slot-admin__empty">この日のシフト枠はありません</p>';
            return;
        }

        let html = '';
        availableSlots.forEach(slot => {
            const slotShifts = dayShifts.filter(s => s.slotId === slot.id);
            const required = slot.requiredStaff || CONFIG.REQUIRED_STAFF_PER_SLOT || 3;

            let staffHtml = '';
            if (slotShifts.length > 0) {
                staffHtml = slotShifts.map(s => {
                    const staff = getStaffById(s.staffId);
                    const roleColor = CONFIG.ROLES[staff?.role]?.color || '#ccc';
                    return `
                        <div class="staff-tag-row">
                            <span class="staff-tag">
                                <span class="staff-tag__role" style="background-color: ${roleColor}"></span>
                                ${Utils.escapeHtml(s.staffName)}（${s.staffId}）
                            </span>
                            <button type="button" class="btn btn--tiny btn--danger btn-delete-shift"
                                data-shift-id="${s.id}" data-staff-name="${Utils.escapeHtml(s.staffName)}"
                                data-date="${date}" data-slot-label="${slot.label}">
                                取消
                            </button>
                        </div>
                    `;
                }).join('');
            } else {
                staffHtml = '<p class="shift-slot-admin__empty">申請者なし</p>';
            }

            html += `
                <div class="shift-slot-admin">
                    <div class="shift-slot-admin__header">
                        <span class="shift-slot-admin__label">${slot.label}（${slot.start}〜${slot.end}）</span>
                        <span class="shift-slot-admin__count">${slotShifts.length}/${required}</span>
                    </div>
                    <div class="shift-slot-admin__staff">
                        ${staffHtml}
                    </div>
                </div>
            `;
        });

        elements.shiftSlotsContainer.innerHTML = html;

        // シフト削除ボタンにイベントリスナーを追加
        elements.shiftSlotsContainer.querySelectorAll('.btn-delete-shift').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // closest()を使用してボタン要素を確実に取得
                const button = e.target.closest('.btn-delete-shift');
                if (!button) return;
                const shiftId = button.dataset.shiftId;
                const staffName = button.dataset.staffName;
                const dateStr = button.dataset.date;
                const slotLabel = button.dataset.slotLabel;
                handleDeleteShiftApplication(shiftId, staffName, dateStr, slotLabel);
            });
        });
    }

    /**
     * シフト申請を削除
     */
    async function handleDeleteShiftApplication(shiftId, staffName, dateStr, slotLabel) {
        const d = parseDateStr(dateStr);
        const dateLabel = `${d.getMonth() + 1}/${d.getDate()}`;

        if (!confirm(`${staffName}さんの${dateLabel} ${slotLabel}のシフト申請を削除しますか？`)) {
            return;
        }

        try {
            Utils.showLoading(true, 'シフトを削除中...');

            // GASが設定されている場合は、GASからも削除
            if (isConfigValid()) {
                try {
                    const response = await Utils.apiRequest('deleteShift', { shiftId });
                    if (!response.success) {
                        console.warn('GASでの削除に失敗:', response.message);
                    }
                } catch (error) {
                    console.warn('GASでのシフト削除エラー:', error);
                }
            }

            // ローカルストレージから削除
            allShiftRequests = allShiftRequests.filter(s => s.id !== shiftId);
            Utils.saveToStorage(CONFIG.STORAGE_KEYS.SHIFTS, allShiftRequests);

            Utils.showMessage(`${staffName}さんのシフトを削除しました`, 'success');
            handleShiftDateChange();
            initStaffTab();

        } catch (error) {
            console.error('シフト削除エラー:', error);
            Utils.showMessage('シフトの削除に失敗しました', 'error');
        } finally {
            Utils.showLoading(false);
        }
    }

    function handleExportShiftCsv() {
        if (allShiftRequests.length === 0) {
            Utils.showMessage('出力するシフトデータがありません', 'error');
            return;
        }

        const headers = ['日付', '枠', '開始時刻', '終了時刻', '学生番号', 'スタッフ名', '週'];
        const rows = [];

        getOperationDates().forEach(date => {
            const availableSlots = getAvailableSlots(date);

            availableSlots.forEach(slot => {
                const shifts = allShiftRequests.filter(r => r.date === date && r.slotId === slot.id);
                if (shifts.length > 0) {
                    shifts.forEach(s => {
                        const week = CONFIG.WEEKS.find(w => w.weekKey === s.weekKey);
                        rows.push([date, slot.label, slot.start, slot.end, s.staffId, s.staffName, week?.label || '-']);
                    });
                } else {
                    rows.push([date, slot.label, slot.start, slot.end, '-', '（未定）', '-']);
                }
            });
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        Utils.downloadCSV(csvContent, `シフト表_${Utils.formatDate()}.csv`);
        Utils.showMessage('シフト表をエクスポートしました', 'success');
    }

    // ========== シフト設定タブ ==========

    function initShiftConfigTab() {
        if (elements.newShiftDate) {
            const today = new Date();
            elements.newShiftDate.value = formatDateStr(today);
        }
        renderCurrentShiftConfig();
    }

    function formatDateStr(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function renderCurrentShiftConfig() {
        if (!elements.currentShiftConfig) return;

        const allSlots = getAllShiftSlots();
        const dates = Object.keys(allSlots).sort();

        if (dates.length === 0) {
            elements.currentShiftConfig.innerHTML = '<p class="shift-slot-admin__empty">シフト設定がありません</p>';
            return;
        }

        let html = '';
        dates.forEach(dateStr => {
            const d = parseDateStr(dateStr);
            const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
            const slots = allSlots[dateStr];

            // 空配列の場合はスキップ（削除された日付）
            if (!slots || slots.length === 0) return;

            html += `
                <div class="shift-config-date">
                    <h4 class="shift-config-date__title">${d.getMonth() + 1}/${d.getDate()}（${weekdays[d.getDay()]}）</h4>
                    <div class="shift-config-slots">
            `;

            slots.forEach(slot => {
                html += `
                    <div class="shift-config-slot">
                        <div class="shift-config-slot__info">
                            <span class="shift-config-slot__label">${slot.label}</span>
                            <span class="shift-config-slot__time">${slot.start}〜${slot.end}</span>
                            <span class="shift-config-slot__staff">必要人数: ${slot.requiredStaff || 3}名</span>
                        </div>
                        <button type="button" class="btn btn--small btn--danger btn-delete-slot"
                            data-date="${dateStr}" data-slot-id="${slot.id}" data-slot-label="${slot.label}">
                            削除
                        </button>
                    </div>
                `;
            });

            html += '</div></div>';
        });

        elements.currentShiftConfig.innerHTML = html;

        // 削除ボタンにイベントリスナーを追加
        const deleteButtons = elements.currentShiftConfig.querySelectorAll('.btn-delete-slot');
        console.log('[renderCurrentShiftConfig] 削除ボタン数:', deleteButtons.length);

        deleteButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                // closest()を使用してボタン要素を確実に取得
                const button = e.target.closest('.btn-delete-slot');
                if (!button) return;
                const dateStr = button.dataset.date;
                const slotId = button.dataset.slotId;
                const slotLabel = button.dataset.slotLabel;
                console.log('[btn-delete-slot] クリック:', { dateStr, slotId, slotLabel });
                handleDeleteShiftSlot(dateStr, slotId, slotLabel);
            });
        });
    }

    /**
     * シフト枠を削除
     */
    async function handleDeleteShiftSlot(dateStr, slotId, slotLabel) {
        console.log('[handleDeleteShiftSlot] 削除リクエスト:', { dateStr, slotId, slotLabel });

        const d = parseDateStr(dateStr);
        const dateLabel = `${d.getMonth() + 1}/${d.getDate()}`;

        if (!confirm(`${dateLabel}の「${slotLabel}」を削除しますか？\n\nこの枠に登録されているシフト申請も無効になります。`)) {
            console.log('[handleDeleteShiftSlot] ユーザーがキャンセル');
            return;
        }

        try {
            Utils.showLoading(true, 'シフト枠を削除中...');

            // GAS API経由で削除
            if (typeof deleteShiftSlotFromGAS === 'function') {
                const result = await deleteShiftSlotFromGAS(dateStr, slotId);
                if (result.success) {
                    console.log('[handleDeleteShiftSlot] GAS削除完了:', dateStr, slotId);
                } else {
                    throw new Error(result.error || '削除に失敗しました');
                }
            } else {
                // フォールバック: ローカルのみ
                removeShiftSlotCompletely(dateStr, slotId);
                console.log('[handleDeleteShiftSlot] ローカル削除完了:', dateStr, slotId);
            }

            Utils.showMessage(`${dateLabel}の${slotLabel}を削除しました`, 'success');
            renderCurrentShiftConfig();
            populateShiftDateSelect();

        } catch (error) {
            console.error('[handleDeleteShiftSlot] エラー:', error);
            Utils.showMessage('シフト枠の削除に失敗しました: ' + error.message, 'error');
        } finally {
            Utils.showLoading(false);
        }
    }

    async function handleAddShiftSlot() {
        console.log('[handleAddShiftSlot] 開始');

        const dateStr = elements.newShiftDate?.value;
        const label = elements.newShiftLabel?.value || '';
        const start = elements.newShiftStart?.value;
        const end = elements.newShiftEnd?.value;
        const requiredStaff = parseInt(elements.newShiftStaff?.value) || 3;

        console.log('[handleAddShiftSlot] 入力値:', { dateStr, label, start, end, requiredStaff });

        if (!dateStr) {
            Utils.showMessage('日付を選択してください', 'error');
            return;
        }
        if (!start || !end) {
            Utils.showMessage('開始時刻と終了時刻を入力してください', 'error');
            return;
        }
        if (start >= end) {
            Utils.showMessage('終了時刻は開始時刻より後にしてください', 'error');
            return;
        }

        // 新しいスロットデータを作成
        const slotData = {
            label: label,
            start: start,
            end: end,
            requiredStaff: requiredStaff
        };

        try {
            Utils.showLoading(true, 'シフト枠を登録中...');

            let result;

            // GAS API経由で保存
            if (typeof saveShiftSlotToGAS === 'function') {
                console.log('[handleAddShiftSlot] saveShiftSlotToGAS を呼び出し');
                result = await saveShiftSlotToGAS(dateStr, slotData);
                console.log('[handleAddShiftSlot] 結果:', result);
            } else {
                console.log('[handleAddShiftSlot] addShiftSlot を呼び出し（フォールバック）');
                // フォールバック: ローカルのみ
                const newSlot = addShiftSlot(dateStr, slotData);
                result = { success: !!newSlot, slot: newSlot, local: true };
            }

            if (result.success) {
                const slotLabel = result.slot?.label || label || '枠';
                const message = `${dateStr}に${slotLabel}（${start}〜${end}）を追加しました`;

                // 警告がある場合は警告表示、なければ成功表示
                if (result.warning) {
                    Utils.showMessage(message + '（' + result.warning + '）', 'warning');
                } else if (result.local) {
                    Utils.showMessage(message + '（ローカル保存）', 'success');
                } else {
                    Utils.showMessage(message + '（DB保存）', 'success');
                }

                // 画面を更新
                renderCurrentShiftConfig();
                populateShiftDateSelect();

                // フォームをリセット
                if (elements.newShiftLabel) elements.newShiftLabel.value = '';
            } else {
                throw new Error(result.error || '保存に失敗しました');
            }

        } catch (error) {
            console.error('[handleAddShiftSlot] エラー:', error);
            Utils.showMessage('シフト枠の登録に失敗しました: ' + error.message, 'error');
        } finally {
            Utils.showLoading(false);
        }
    }

    // ========== スタッフタブ ==========

    function initStaffTab() {
        renderStaffList();
        renderStaffStats();
    }

    function renderStaffList() {
        const html = CONFIG.STAFF_LIST.map(staff => {
            const role = CONFIG.ROLES[staff.role] || { label: 'スタッフ', color: '#ccc' };
            const initial = staff.name.charAt(0);

            return `
                <div class="staff-item">
                    <div class="staff-item__avatar">${initial}</div>
                    <div class="staff-item__info">
                        <p class="staff-item__name">${Utils.escapeHtml(staff.name)}</p>
                        <p class="staff-item__id">${staff.id}</p>
                        <p class="staff-item__role" style="color: ${role.color}">${role.label}</p>
                    </div>
                </div>
            `;
        }).join('');

        elements.staffList.innerHTML = html;
    }

    function renderStaffStats() {
        const html = CONFIG.STAFF_LIST.map(staff => {
            const shiftCount = allShiftRequests.filter(r => r.staffId === staff.id).length;
            const attendanceCount = allRecords.filter(r => {
                const clockType = (r.clockType || r.type || '').toLowerCase();
                return (r.staffId === staff.id || r.name === staff.name || r.staffName === staff.name) && clockType === 'in';
            }).length;

            return `
                <tr>
                    <td>${Utils.escapeHtml(staff.id)}</td>
                    <td>${Utils.escapeHtml(staff.name)}</td>
                    <td>${shiftCount}</td>
                    <td>${attendanceCount}</td>
                </tr>
            `;
        }).join('');

        elements.staffStatsBody.innerHTML = html || '<tr><td colspan="4" class="table__empty">データなし</td></tr>';
    }

    // ========== データ管理 ==========

    function handleExportData() {
        const exportObj = {
            exportedAt: new Date().toISOString(),
            version: '1.0',
            system: 'cafe-unified-system',
            shifts: allShiftRequests,
            clockRecords: allRecords
        };

        const dataStr = JSON.stringify(exportObj, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `cafe-unified-export-${Utils.formatDate()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        Utils.showMessage('データをエクスポートしました', 'success');
    }

    function handleClearData() {
        if (!confirm('すべてのデータを削除しますか？この操作は取り消せません。')) {
            return;
        }

        if (!confirm('本当に削除しますか？')) {
            return;
        }

        Utils.removeFromStorage(CONFIG.STORAGE_KEYS.SHIFTS);
        Utils.removeFromStorage(CONFIG.STORAGE_KEYS.CLOCK_RECORDS);

        loadData();
        Utils.showMessage('データを削除しました', 'success');
    }

    function handleMigration() {
        if (!confirm('旧システムからデータを移行しますか？既存のデータは保持されます。')) {
            return;
        }

        const result = Utils.migrateOldData();

        if (result.success) {
            Utils.showMessage(`移行完了: シフト${result.shifts}件, 打刻${result.clock}件`, 'success');
            loadData();
            checkMigrationNeeded();
        } else {
            Utils.showMessage('移行するデータがありませんでした', 'error');
        }
    }

    function handleLogout() {
        Utils.removeFromStorage(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        elements.adminSection.style.display = 'none';
        elements.authSection.style.display = 'flex';
        elements.adminPassword.value = '';
    }

    // ========== インポート機能 ==========

    /**
     * CSVテンプレートをダウンロード
     */
    function handleDownloadCsvTemplate() {
        const headers = ['日付', '枠名', '開始時刻', '終了時刻', '必要人数'];
        const sampleData = [
            ['2026-01-20', '枠1', '14:40', '16:10', '3'],
            ['2026-01-20', '枠2', '16:20', '17:50', '3'],
            ['2026-01-21', '午前枠', '10:00', '12:00', '2'],
            ['2026-01-21', '午後枠', '13:00', '15:00', '2']
        ];

        // BOMを追加してExcelで文字化けしないように
        const BOM = '\uFEFF';
        const csvContent = BOM + [
            '# シフト枠一括登録テンプレート',
            '# 記入方法:',
            '#   日付: YYYY-MM-DD形式（例: 2026-01-20）',
            '#   枠名: 任意の名前（例: 枠1、午前枠）',
            '#   開始時刻: HH:MM形式（例: 14:40）',
            '#   終了時刻: HH:MM形式（例: 16:10）',
            '#   必要人数: 数字（例: 3）',
            '# 注意: この行と上の行は削除してください（#で始まる行は無視されます）',
            '',
            headers.join(','),
            ...sampleData.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'シフト枠テンプレート.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        Utils.showMessage('CSVテンプレートをダウンロードしました', 'success');
    }

    /**
     * Excelテンプレートをダウンロード
     */
    function handleDownloadExcelTemplate() {
        if (typeof XLSX === 'undefined') {
            Utils.showMessage('Excelライブラリが読み込まれていません', 'error');
            return;
        }

        // データシート
        const dataHeaders = ['日付', '枠名', '開始時刻', '終了時刻', '必要人数'];
        const sampleData = [
            ['2026-01-20', '枠1', '14:40', '16:10', 3],
            ['2026-01-20', '枠2', '16:20', '17:50', 3],
            ['2026-01-21', '午前枠', '10:00', '12:00', 2],
            ['2026-01-21', '午後枠', '13:00', '15:00', 2]
        ];

        const dataSheet = XLSX.utils.aoa_to_sheet([dataHeaders, ...sampleData]);

        // 列幅を設定
        dataSheet['!cols'] = [
            { wch: 12 }, // 日付
            { wch: 10 }, // 枠名
            { wch: 10 }, // 開始時刻
            { wch: 10 }, // 終了時刻
            { wch: 10 }  // 必要人数
        ];

        // 記入方法シート
        const instructions = [
            ['シフト枠一括登録 - 記入方法'],
            [''],
            ['【列の説明】'],
            ['日付', 'YYYY-MM-DD形式で入力（例: 2026-01-20）'],
            ['枠名', '任意の名前（例: 枠1、午前枠、臨時枠）'],
            ['開始時刻', 'HH:MM形式で入力（例: 14:40）'],
            ['終了時刻', 'HH:MM形式で入力（例: 16:10）'],
            ['必要人数', '数字で入力（例: 3）'],
            [''],
            ['【注意事項】'],
            ['1. 「シフト枠」シートにデータを入力してください'],
            ['2. 1行目（ヘッダー行）は削除しないでください'],
            ['3. 日付は必ずYYYY-MM-DD形式で入力してください'],
            ['4. 時刻は24時間表記で入力してください'],
            ['5. 必要人数は1以上の整数を入力してください'],
            [''],
            ['【サンプルデータ】'],
            ['サンプルデータは削除または上書きしてお使いください']
        ];

        const instructionSheet = XLSX.utils.aoa_to_sheet(instructions);
        instructionSheet['!cols'] = [{ wch: 15 }, { wch: 50 }];

        // ワークブックを作成
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, dataSheet, 'シフト枠');
        XLSX.utils.book_append_sheet(wb, instructionSheet, '記入方法');

        // ダウンロード
        XLSX.writeFile(wb, 'シフト枠テンプレート.xlsx');
        Utils.showMessage('Excelテンプレートをダウンロードしました', 'success');
    }

    /**
     * ファイル選択時の処理
     */
    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) {
            resetImportState();
            return;
        }

        const fileName = file.name;
        const fileExt = fileName.split('.').pop().toLowerCase();

        if (!['csv', 'xlsx', 'xls'].includes(fileExt)) {
            Utils.showMessage('CSV または Excel ファイルを選択してください', 'error');
            resetImportState();
            return;
        }

        // ファイル名を表示
        if (elements.importFileName) {
            elements.importFileName.textContent = fileName;
            elements.importFileName.classList.add('file-upload__name--selected');
        }

        // ファイルを読み込み
        const reader = new FileReader();

        if (fileExt === 'csv') {
            reader.onload = (event) => {
                try {
                    const csvData = event.target.result;
                    parseCSV(csvData);
                } catch (error) {
                    console.error('CSV解析エラー:', error);
                    showImportError(['CSVファイルの解析に失敗しました: ' + error.message]);
                }
            };
            reader.readAsText(file, 'UTF-8');
        } else {
            reader.onload = (event) => {
                try {
                    const data = new Uint8Array(event.target.result);
                    parseExcel(data);
                } catch (error) {
                    console.error('Excel解析エラー:', error);
                    showImportError(['Excelファイルの解析に失敗しました: ' + error.message]);
                }
            };
            reader.readAsArrayBuffer(file);
        }
    }

    /**
     * CSVデータを解析
     */
    function parseCSV(csvData) {
        const lines = csvData.split(/\r?\n/).filter(line => {
            const trimmed = line.trim();
            return trimmed && !trimmed.startsWith('#');
        });

        if (lines.length < 2) {
            showImportError(['データが見つかりません。ヘッダー行とデータ行を含めてください。']);
            return;
        }

        // ヘッダー行を取得
        const headers = parseCSVLine(lines[0]);

        // 必須列のインデックスを確認
        const dateIdx = findColumnIndex(headers, ['日付', 'date']);
        const labelIdx = findColumnIndex(headers, ['枠名', 'label', '名前']);
        const startIdx = findColumnIndex(headers, ['開始時刻', '開始', 'start', '開始時間']);
        const endIdx = findColumnIndex(headers, ['終了時刻', '終了', 'end', '終了時間']);
        const staffIdx = findColumnIndex(headers, ['必要人数', '人数', 'staff', '必要スタッフ']);

        if (dateIdx === -1 || startIdx === -1 || endIdx === -1) {
            showImportError(['必須列が見つかりません。「日付」「開始時刻」「終了時刻」列は必須です。']);
            return;
        }

        // データ行を解析
        const data = [];
        const errors = [];

        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            if (values.length === 0 || values.every(v => !v.trim())) continue;

            const row = {
                date: values[dateIdx]?.trim() || '',
                label: values[labelIdx]?.trim() || '',
                start: values[startIdx]?.trim() || '',
                end: values[endIdx]?.trim() || '',
                requiredStaff: parseInt(values[staffIdx]) || 3
            };

            const rowErrors = validateImportRow(row, i + 1);
            if (rowErrors.length > 0) {
                errors.push(...rowErrors);
            } else {
                data.push(row);
            }
        }

        if (errors.length > 0) {
            showImportError(errors);
            return;
        }

        if (data.length === 0) {
            showImportError(['有効なデータが見つかりません。']);
            return;
        }

        pendingImportData = data;
        showImportPreview(data);
    }

    /**
     * Excelデータを解析
     */
    function parseExcel(data) {
        if (typeof XLSX === 'undefined') {
            showImportError(['Excelライブラリが読み込まれていません。']);
            return;
        }

        const wb = XLSX.read(data, { type: 'array' });

        // 最初のシート（または「シフト枠」シート）を使用
        let sheetName = wb.SheetNames[0];
        if (wb.SheetNames.includes('シフト枠')) {
            sheetName = 'シフト枠';
        }

        const ws = wb.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        if (jsonData.length < 2) {
            showImportError(['データが見つかりません。ヘッダー行とデータ行を含めてください。']);
            return;
        }

        // ヘッダー行を取得
        const headers = jsonData[0].map(h => String(h).trim());

        // 必須列のインデックスを確認
        const dateIdx = findColumnIndex(headers, ['日付', 'date']);
        const labelIdx = findColumnIndex(headers, ['枠名', 'label', '名前']);
        const startIdx = findColumnIndex(headers, ['開始時刻', '開始', 'start', '開始時間']);
        const endIdx = findColumnIndex(headers, ['終了時刻', '終了', 'end', '終了時間']);
        const staffIdx = findColumnIndex(headers, ['必要人数', '人数', 'staff', '必要スタッフ']);

        if (dateIdx === -1 || startIdx === -1 || endIdx === -1) {
            showImportError(['必須列が見つかりません。「日付」「開始時刻」「終了時刻」列は必須です。']);
            return;
        }

        // データ行を解析
        const parsedData = [];
        const errors = [];

        for (let i = 1; i < jsonData.length; i++) {
            const values = jsonData[i];
            if (!values || values.length === 0 || values.every(v => !v)) continue;

            // 日付の変換（Excelのシリアル値対応）
            let dateValue = values[dateIdx];
            if (typeof dateValue === 'number') {
                const excelDate = XLSX.SSF.parse_date_code(dateValue);
                dateValue = `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`;
            } else {
                dateValue = String(dateValue || '').trim();
            }

            // 時刻の変換（Excelのシリアル値対応）
            let startValue = formatExcelTime(values[startIdx]);
            let endValue = formatExcelTime(values[endIdx]);

            const row = {
                date: dateValue,
                label: String(values[labelIdx] || '').trim(),
                start: startValue,
                end: endValue,
                requiredStaff: parseInt(values[staffIdx]) || 3
            };

            const rowErrors = validateImportRow(row, i + 1);
            if (rowErrors.length > 0) {
                errors.push(...rowErrors);
            } else {
                parsedData.push(row);
            }
        }

        if (errors.length > 0) {
            showImportError(errors);
            return;
        }

        if (parsedData.length === 0) {
            showImportError(['有効なデータが見つかりません。']);
            return;
        }

        pendingImportData = parsedData;
        showImportPreview(parsedData);
    }

    /**
     * Excelの時刻値をフォーマット
     */
    function formatExcelTime(value) {
        if (value === null || value === undefined || value === '') return '';

        // 既に文字列の場合
        if (typeof value === 'string') {
            return value.trim();
        }

        // Excelのシリアル値（0-1の小数）の場合
        if (typeof value === 'number' && value >= 0 && value < 1) {
            const totalMinutes = Math.round(value * 24 * 60);
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        }

        return String(value).trim();
    }

    /**
     * CSV行を解析（カンマ区切り、引用符対応）
     */
    function parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);

        return result;
    }

    /**
     * 列インデックスを検索
     */
    function findColumnIndex(headers, possibleNames) {
        for (let i = 0; i < headers.length; i++) {
            const header = headers[i].toLowerCase().trim();
            if (possibleNames.some(name => header.includes(name.toLowerCase()))) {
                return i;
            }
        }
        return -1;
    }

    /**
     * インポート行を検証
     */
    function validateImportRow(row, rowNum) {
        const errors = [];

        // 日付の検証
        if (!row.date) {
            errors.push(`${rowNum}行目: 日付が入力されていません`);
        } else if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date)) {
            errors.push(`${rowNum}行目: 日付の形式が不正です（YYYY-MM-DD形式で入力してください）`);
        }

        // 時刻の検証
        if (!row.start) {
            errors.push(`${rowNum}行目: 開始時刻が入力されていません`);
        } else if (!/^\d{1,2}:\d{2}$/.test(row.start)) {
            errors.push(`${rowNum}行目: 開始時刻の形式が不正です（HH:MM形式で入力してください）`);
        }

        if (!row.end) {
            errors.push(`${rowNum}行目: 終了時刻が入力されていません`);
        } else if (!/^\d{1,2}:\d{2}$/.test(row.end)) {
            errors.push(`${rowNum}行目: 終了時刻の形式が不正です（HH:MM形式で入力してください）`);
        }

        // 時刻の前後関係
        if (row.start && row.end && row.start >= row.end) {
            errors.push(`${rowNum}行目: 終了時刻は開始時刻より後にしてください`);
        }

        // 必要人数の検証
        if (row.requiredStaff < 1 || row.requiredStaff > 10) {
            errors.push(`${rowNum}行目: 必要人数は1〜10の範囲で入力してください`);
        }

        return errors;
    }

    /**
     * インポートエラーを表示
     */
    function showImportError(errors) {
        pendingImportData = [];

        if (elements.importPreview) {
            elements.importPreview.style.display = 'block';
        }

        if (elements.importPreviewContent) {
            elements.importPreviewContent.innerHTML = `
                <div class="import-error">
                    <p class="import-error__title">エラーが見つかりました</p>
                    <ul class="import-error__list">
                        ${errors.slice(0, 10).map(e => `<li>${Utils.escapeHtml(e)}</li>`).join('')}
                        ${errors.length > 10 ? `<li>...他 ${errors.length - 10} 件のエラー</li>` : ''}
                    </ul>
                </div>
            `;
        }

        if (elements.btnImportShifts) {
            elements.btnImportShifts.disabled = true;
        }
    }

    /**
     * インポートプレビューを表示
     */
    function showImportPreview(data) {
        if (elements.importPreview) {
            elements.importPreview.style.display = 'block';
        }

        if (elements.importPreviewContent) {
            const tableRows = data.map(row => `
                <tr>
                    <td>${Utils.escapeHtml(row.date)}</td>
                    <td>${Utils.escapeHtml(row.label || '自動生成')}</td>
                    <td>${Utils.escapeHtml(row.start)}</td>
                    <td>${Utils.escapeHtml(row.end)}</td>
                    <td>${row.requiredStaff}</td>
                </tr>
            `).join('');

            elements.importPreviewContent.innerHTML = `
                <table class="import-preview-table">
                    <thead>
                        <tr>
                            <th>日付</th>
                            <th>枠名</th>
                            <th>開始</th>
                            <th>終了</th>
                            <th>人数</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
                <p class="import-preview__summary">${data.length}件のシフト枠を登録します</p>
            `;
        }

        if (elements.btnImportShifts) {
            elements.btnImportShifts.disabled = false;
        }
    }

    /**
     * インポート状態をリセット
     */
    function resetImportState() {
        pendingImportData = [];

        if (elements.importFileName) {
            elements.importFileName.textContent = '選択されていません';
            elements.importFileName.classList.remove('file-upload__name--selected');
        }

        if (elements.importPreview) {
            elements.importPreview.style.display = 'none';
        }

        if (elements.importPreviewContent) {
            elements.importPreviewContent.innerHTML = '';
        }

        if (elements.btnImportShifts) {
            elements.btnImportShifts.disabled = true;
        }

        if (elements.shiftImportFile) {
            elements.shiftImportFile.value = '';
        }
    }

    /**
     * シフト枠を一括インポート
     */
    async function handleImportShifts() {
        console.log('[handleImportShifts] 開始');
        console.log('[handleImportShifts] pendingImportData:', pendingImportData);

        if (pendingImportData.length === 0) {
            Utils.showMessage('インポートするデータがありません', 'error');
            return;
        }

        if (!confirm(`${pendingImportData.length}件のシフト枠を登録します。よろしいですか？`)) {
            return;
        }

        try {
            Utils.showLoading(true, 'シフト枠をインポート中...');

            let result;

            // GAS API経由でインポート
            if (typeof importShiftSlotsToGAS === 'function') {
                console.log('[handleImportShifts] importShiftSlotsToGAS関数を使用');

                try {
                    result = await importShiftSlotsToGAS(pendingImportData);
                    console.log('[handleImportShifts] 結果:', result);
                } catch (gasError) {
                    console.error('[handleImportShifts] GAS呼び出しエラー:', gasError);
                    result = { success: false, error: gasError.message };
                }

                if (result.success) {
                    const count = result.count || pendingImportData.length;

                    // 警告がある場合（ローカルフォールバック時）
                    if (result.warning) {
                        Utils.showMessage(`${count}件のシフト枠を登録しました（${result.warning}）`, 'warning');
                    } else if (result.local) {
                        Utils.showMessage(`${count}件のシフト枠をローカルに登録しました。データベースへの移行を推奨します。`, 'warning');
                    } else {
                        Utils.showMessage(`${count}件のシフト枠をデータベースに登録しました`, 'success');
                    }
                } else {
                    throw new Error(result.error || 'インポートに失敗しました');
                }
            } else {
                console.log('[handleImportShifts] ローカルフォールバックを使用');
                // フォールバック: ローカルのみ
                let addedCount = 0;

                pendingImportData.forEach(row => {
                    const newSlot = addShiftSlot(row.date, {
                        label: row.label,
                        start: row.start,
                        end: row.end,
                        requiredStaff: row.requiredStaff
                    });

                    if (newSlot) {
                        addedCount++;
                    }
                });

                Utils.showMessage(`${addedCount}件のシフト枠をローカルに登録しました`, 'success');
            }

            // 状態をリセット
            resetImportState();

            // 画面を更新
            console.log('[handleImportShifts] 画面を更新中...');

            // キャッシュをクリアしてから再描画
            if (typeof clearShiftSlotConfigCache === 'function') {
                clearShiftSlotConfigCache();
            }

            renderCurrentShiftConfig();
            populateShiftDateSelect();
            console.log('[handleImportShifts] 完了');

        } catch (error) {
            console.error('[handleImportShifts] エラー:', error);

            // エラーでもローカル保存を試みる
            if (confirm(`エラーが発生しました: ${error.message}\n\nローカルにデータを保存しますか？`)) {
                try {
                    let addedCount = 0;
                    pendingImportData.forEach(row => {
                        const newSlot = addShiftSlot(row.date, {
                            label: row.label,
                            start: row.start,
                            end: row.end,
                            requiredStaff: row.requiredStaff
                        });
                        if (newSlot) addedCount++;
                    });

                    Utils.showMessage(`${addedCount}件のシフト枠をローカルに登録しました`, 'warning');
                    resetImportState();
                    renderCurrentShiftConfig();
                    populateShiftDateSelect();
                } catch (localError) {
                    console.error('[handleImportShifts] ローカル保存エラー:', localError);
                    Utils.showMessage('シフト枠のインポートに失敗しました: ' + error.message, 'error');
                }
            } else {
                Utils.showMessage('シフト枠のインポートに失敗しました: ' + error.message, 'error');
            }
        } finally {
            Utils.showLoading(false);
        }
    }

    /**
     * デフォルトのシフト枠設定をデータベースに移行
     */
    async function handleMigrateShiftConfig() {
        // CONFIG.DATE_SHIFT_SLOTSからデータを取得
        const defaultSlots = CONFIG.DATE_SHIFT_SLOTS;

        if (!defaultSlots || Object.keys(defaultSlots).length === 0) {
            Utils.showMessage('移行するデフォルト設定がありません', 'error');
            return;
        }

        // 移行するデータを配列形式に変換
        const slotsToMigrate = [];
        Object.keys(defaultSlots).forEach(dateStr => {
            const slots = defaultSlots[dateStr];
            if (slots && Array.isArray(slots)) {
                slots.forEach(slot => {
                    slotsToMigrate.push({
                        date: dateStr,
                        id: slot.id,
                        label: slot.label,
                        start: slot.start,
                        end: slot.end,
                        requiredStaff: slot.requiredStaff || 3
                    });
                });
            }
        });

        if (slotsToMigrate.length === 0) {
            Utils.showMessage('移行するシフト枠がありません', 'error');
            return;
        }

        // 確認ダイアログ
        const dateCount = Object.keys(defaultSlots).length;
        if (!confirm(`${dateCount}日分、${slotsToMigrate.length}件のシフト枠をデータベースに移行します。\n\n移行する日付:\n${Object.keys(defaultSlots).join('\n')}\n\nよろしいですか？`)) {
            return;
        }

        try {
            Utils.showLoading(true, 'シフト枠設定を移行中...');

            // GAS API経由でインポート
            if (typeof importShiftSlotsToGAS === 'function') {
                const result = await importShiftSlotsToGAS(slotsToMigrate);
                if (result.success) {
                    Utils.showMessage(`${result.count || slotsToMigrate.length}件のシフト枠をデータベースに移行しました`, 'success');
                } else {
                    throw new Error(result.error || '移行に失敗しました');
                }
            } else {
                throw new Error('GAS連携機能が利用できません');
            }

            // 画面を更新
            renderCurrentShiftConfig();
            populateShiftDateSelect();

        } catch (error) {
            console.error('[handleMigrateShiftConfig] エラー:', error);
            Utils.showMessage('シフト枠設定の移行に失敗しました: ' + error.message, 'error');
        } finally {
            Utils.showLoading(false);
        }
    }

    // 初期化
    document.addEventListener('DOMContentLoaded', init);
})();
