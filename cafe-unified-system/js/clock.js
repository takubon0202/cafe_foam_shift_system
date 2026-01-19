/**
 * 共創カフェ 統合シフト・勤怠管理システム - 打刻画面処理
 * シフト枠に対応した打刻機能（遅刻・早退自動判定）
 */

(function() {
    'use strict';

    const elements = {
        currentDate: document.getElementById('currentDate'),
        currentTime: document.getElementById('currentTime'),
        currentShift: document.getElementById('currentShift'),
        staffSelect: document.getElementById('staffSelect'),
        todayShiftSlots: document.getElementById('todayShiftSlots'),
        slotSelectGroup: document.getElementById('slotSelectGroup'),
        slotButtons: document.getElementById('slotButtons'),
        statusDisplay: document.getElementById('statusDisplay'),
        btnClockIn: document.getElementById('btnClockIn'),
        btnClockOut: document.getElementById('btnClockOut'),
        historyList: document.getElementById('historyList'),
        // 研修テストモード用
        testModeToggle: document.getElementById('testModeToggle'),
        testModePanel: document.getElementById('testModePanel'),
        btnTestClockIn: document.getElementById('btnTestClockIn'),
        btnTestClockOut: document.getElementById('btnTestClockOut'),
        testHistoryList: document.getElementById('testHistoryList'),
        btnClearTestHistory: document.getElementById('btnClearTestHistory')
    };

    let selectedSlot = null;
    let todayRecords = [];
    let myShifts = [];
    let testRecords = [];

    /**
     * 初期化
     */
    async function init() {
        // シフト枠設定をGASから読み込み
        if (typeof fetchShiftSlotConfig === 'function') {
            try {
                await fetchShiftSlotConfig();
                console.log('[clock:init] シフト枠設定読み込み完了');
            } catch (error) {
                console.warn('[clock:init] シフト枠設定の読み込みエラー:', error);
            }
        }

        updateDateTime();
        setInterval(updateDateTime, 1000);
        populateStaffSelect();
        renderSlotButtons();
        setupEventListeners();
        loadLastStaff();
        initTestMode();
    }

    /**
     * 日時表示を更新
     */
    function updateDateTime() {
        const now = Utils.getJSTDate();
        elements.currentDate.textContent = Utils.formatDateJP(now);
        elements.currentTime.textContent = Utils.formatTime(now);

        // 現在のシフト枠を表示
        const today = Utils.formatDate(now);
        const availableSlots = getAvailableSlots(today);
        const currentSlot = getCurrentShiftSlot(now, availableSlots);

        if (currentSlot) {
            elements.currentShift.textContent = `${currentSlot.label}シフト（${currentSlot.start}〜${currentSlot.end}）`;
        } else {
            const nextSlot = getNextShiftSlot(now, availableSlots);
            if (nextSlot) {
                elements.currentShift.textContent = `次のシフト: ${nextSlot.label}（${nextSlot.start}〜）`;
            } else if (availableSlots.length === 0) {
                elements.currentShift.textContent = '本日は営業枠がありません';
            } else {
                elements.currentShift.textContent = '本日のシフトは終了しました';
            }
        }
    }

    /**
     * 現在のシフト枠を取得
     */
    function getCurrentShiftSlot(now, availableSlots) {
        const time = Utils.formatTimeShort(now);
        for (const slot of availableSlots) {
            if (time >= slot.start && time <= slot.end) {
                return slot;
            }
        }
        return null;
    }

    /**
     * 次のシフト枠を取得
     */
    function getNextShiftSlot(now, availableSlots) {
        const time = Utils.formatTimeShort(now);
        const slots = [...availableSlots].sort((a, b) => a.start.localeCompare(b.start));

        for (const slot of slots) {
            if (time < slot.start) {
                return slot;
            }
        }
        return null;
    }

    /**
     * シフト枠ボタンを動的に生成
     */
    function renderSlotButtons() {
        const today = Utils.formatDate();
        const availableSlots = getAvailableSlots(today);

        if (availableSlots.length === 0) {
            elements.slotButtons.innerHTML = '<p class="today-shift__empty">本日の営業枠はありません</p>';
            return;
        }

        const html = availableSlots.map(slot => `
            <button type="button" class="slot-btn" data-slot="${slot.id}">
                <span class="slot-btn__label">${slot.label}</span>
                <span class="slot-btn__time">${slot.start}〜${slot.end}</span>
            </button>
        `).join('');

        elements.slotButtons.innerHTML = html;
    }

    /**
     * スタッフ選択肢を生成
     */
    function populateStaffSelect() {
        const options = CONFIG.STAFF_LIST.map(staff => {
            const roleLabel = CONFIG.ROLES[staff.role]?.label || '';
            const roleTag = roleLabel && roleLabel !== 'スタッフ' ? `（${roleLabel}）` : '';
            return `<option value="${staff.id}">${staff.name}（${staff.id}）${roleTag}</option>`;
        }).join('');

        elements.staffSelect.innerHTML = '<option value="">-- 選択してください --</option>' + options;
    }

    /**
     * イベントリスナーを設定
     */
    function setupEventListeners() {
        elements.staffSelect.addEventListener('change', handleStaffChange);

        // シフト枠ボタン（動的生成のためデリゲーション）
        elements.slotButtons.addEventListener('click', (e) => {
            const btn = e.target.closest('.slot-btn');
            if (btn) {
                handleSlotSelect(btn.dataset.slot);
            }
        });

        elements.btnClockIn.addEventListener('click', () => handlePunch('in'));
        elements.btnClockOut.addEventListener('click', () => handlePunch('out'));
    }

    /**
     * 前回選択したスタッフを復元
     */
    function loadLastStaff() {
        const lastStaffId = Utils.getFromStorage(CONFIG.STORAGE_KEYS.LAST_STAFF_ID);
        if (lastStaffId) {
            elements.staffSelect.value = lastStaffId;
            handleStaffChange();
        }
    }

    /**
     * スタッフ選択変更時の処理
     */
    function handleStaffChange() {
        const staffId = elements.staffSelect.value;
        if (staffId) {
            Utils.saveToStorage(CONFIG.STORAGE_KEYS.LAST_STAFF_ID, staffId);
            loadMyShifts(staffId);
            loadTodayRecords(staffId);
        } else {
            elements.todayShiftSlots.innerHTML = '<p class="today-shift__empty">スタッフを選択してください</p>';
            elements.slotSelectGroup.style.display = 'none';
            selectedSlot = null;
            updateButtonStates();
        }
    }

    /**
     * 本日の自分のシフトをロード
     */
    function loadMyShifts(staffId) {
        const today = Utils.formatDate();
        const availableSlots = getAvailableSlots(today);
        const availableSlotIds = availableSlots.map(s => s.id);

        // ローカルストレージからシフト申請を取得
        const allShifts = Utils.getFromStorage(CONFIG.STORAGE_KEYS.SHIFTS) || [];
        myShifts = allShifts.filter(s => s.staffId === staffId && s.date === today);

        if (availableSlots.length === 0) {
            elements.todayShiftSlots.innerHTML = '<p class="today-shift__empty">本日は営業枠がありません</p>';
            elements.slotSelectGroup.style.display = 'none';
            return;
        }

        if (myShifts.length > 0) {
            const slotsHtml = myShifts.map(shift => {
                const slotInfo = getSlotInfo(shift.slotId, today) || CONFIG.SHIFT_SLOTS[shift.slotId];
                if (!slotInfo) return '';
                return `<span class="today-shift__slot">${slotInfo.label}（${slotInfo.start}〜${slotInfo.end}）</span>`;
            }).join('');
            elements.todayShiftSlots.innerHTML = slotsHtml || '<p class="today-shift__empty">本日のシフト申請はありません</p>';
            elements.slotSelectGroup.style.display = 'block';

            // 申請済みのシフト枠のみ表示
            updateSlotButtons(availableSlots, availableSlotIds);
        } else {
            elements.todayShiftSlots.innerHTML = '<p class="today-shift__empty">本日のシフト申請はありません</p>';
            elements.slotSelectGroup.style.display = 'block';
            // 全営業枠表示
            updateSlotButtons(availableSlots, availableSlotIds);
        }
    }

    /**
     * シフト枠ボタンを更新
     */
    function updateSlotButtons(availableSlots, availableSlotIds) {
        elements.slotButtons.querySelectorAll('.slot-btn').forEach(btn => {
            const slotId = btn.dataset.slot;
            const isAvailable = availableSlotIds.includes(slotId);
            const hasShift = myShifts.length === 0 || myShifts.some(s => s.slotId === slotId);

            btn.style.display = (isAvailable && hasShift) ? 'flex' : 'none';
            btn.classList.remove('slot-btn--selected');
            btn.disabled = !isAvailable;
        });

        // 自動で最初の枠を選択
        const visibleButtons = Array.from(elements.slotButtons.querySelectorAll('.slot-btn'))
            .filter(btn => btn.style.display !== 'none' && !btn.disabled);

        if (visibleButtons.length > 0) {
            handleSlotSelect(visibleButtons[0].dataset.slot);
        }
    }

    /**
     * シフト枠選択時の処理
     */
    function handleSlotSelect(slotId) {
        selectedSlot = slotId;
        elements.slotButtons.querySelectorAll('.slot-btn').forEach(btn => {
            btn.classList.toggle('slot-btn--selected', btn.dataset.slot === slotId);
        });
        updateStatusDisplay();
        updateButtonStates();
    }

    /**
     * 今日の打刻記録をロード（高速化版）
     * ローカルデータを先に表示してからGASを非同期で取得
     */
    async function loadTodayRecords(staffId) {
        const today = Utils.formatDate();

        // まずローカルデータを即座に表示（UX改善）
        const localRecords = Utils.getFromStorage(CONFIG.STORAGE_KEYS.CLOCK_RECORDS) || [];
        todayRecords = localRecords.filter(r => r.date === today);
        renderHistory();
        updateStatusDisplay();

        // GASが設定されていない場合はここで終了
        if (!isConfigValid()) {
            return;
        }

        // GASからバックグラウンドでデータを取得（ローディング表示なし）
        try {
            const response = await Utils.apiRequest('getRecords', { date: today });
            if (response.success || response.ok) {
                const gasRecords = response.records || [];
                // GASのデータがある場合は更新
                if (gasRecords.length > 0) {
                    todayRecords = gasRecords;
                    renderHistory();
                    updateStatusDisplay();
                }
            }
        } catch (error) {
            // GASエラーは無視（ローカルデータで動作継続）
            console.warn('GAS記録取得スキップ:', error.message);
        }
    }

    /**
     * ステータス表示を更新
     */
    function updateStatusDisplay() {
        const staffId = elements.staffSelect.value;
        if (!staffId) {
            elements.statusDisplay.className = 'status';
            elements.statusDisplay.innerHTML = '<p class="status__text">スタッフを選択してください</p>';
            return;
        }

        const staffName = getStaffName(staffId);
        const today = Utils.formatDate();
        const availableSlots = getAvailableSlots(today);

        if (availableSlots.length === 0) {
            elements.statusDisplay.className = 'status';
            elements.statusDisplay.innerHTML = '<p class="status__text">本日は営業枠がありません</p>';
            return;
        }

        if (!selectedSlot) {
            elements.statusDisplay.className = 'status';
            elements.statusDisplay.innerHTML = `<p class="status__text">${staffName}さん: シフト枠を選択してください</p>`;
            return;
        }

        const slotInfo = getSlotInfo(selectedSlot, today) || CONFIG.SHIFT_SLOTS[selectedSlot];
        const slotRecords = todayRecords.filter(r =>
            r.staffId === staffId && r.slotId === selectedSlot
        );

        const lastRecord = slotRecords.sort((a, b) =>
            new Date(b.timestamp) - new Date(a.timestamp)
        )[0];

        if (!lastRecord) {
            elements.statusDisplay.className = 'status';
            elements.statusDisplay.innerHTML = `<p class="status__text">${staffName}さん: ${slotInfo?.label || selectedSlot}枠 未打刻</p>`;
        } else if (lastRecord.clockType === 'in') {
            elements.statusDisplay.className = 'status status--in';
            elements.statusDisplay.innerHTML = `<p class="status__text">${staffName}さん: ${slotInfo?.label || selectedSlot}枠 出勤中（${lastRecord.time}〜）</p>`;
        } else {
            elements.statusDisplay.className = 'status status--out';
            elements.statusDisplay.innerHTML = `<p class="status__text">${staffName}さん: ${slotInfo?.label || selectedSlot}枠 退勤済み</p>`;
        }
    }

    /**
     * ボタンの有効/無効を更新
     */
    function updateButtonStates() {
        const staffId = elements.staffSelect.value;
        const hasStaff = staffId !== '';
        const hasSlot = selectedSlot !== null;
        const today = Utils.formatDate();
        const availableSlots = getAvailableSlots(today);
        const hasAvailableSlots = availableSlots.length > 0;

        elements.btnClockIn.disabled = !hasStaff || !hasSlot || !hasAvailableSlots;
        elements.btnClockOut.disabled = !hasStaff || !hasSlot || !hasAvailableSlots;
    }

    /**
     * 打刻処理
     */
    async function handlePunch(clockType) {
        const staffId = elements.staffSelect.value;
        const staffName = getStaffName(staffId);
        const today = Utils.formatDate();

        if (!staffId || !selectedSlot) {
            Utils.showMessage('スタッフとシフト枠を選択してください', 'error');
            return;
        }

        const slotInfo = getSlotInfo(selectedSlot, today) || CONFIG.SHIFT_SLOTS[selectedSlot];
        const slotRecords = todayRecords.filter(r =>
            r.staffId === staffId && r.slotId === selectedSlot
        );
        const lastRecord = slotRecords.sort((a, b) =>
            new Date(b.timestamp) - new Date(a.timestamp)
        )[0];

        // 二重打刻チェック
        if (clockType === 'in' && lastRecord?.clockType === 'in') {
            Utils.showMessage('このシフト枠はすでに出勤済みです', 'error');
            return;
        }
        if (clockType === 'out' && lastRecord?.clockType === 'out') {
            Utils.showMessage('このシフト枠はすでに退勤済みです', 'error');
            return;
        }
        if (clockType === 'out' && !lastRecord) {
            Utils.showMessage('先に出勤打刻をしてください', 'error');
            return;
        }

        const now = Utils.getJSTDate();
        const time = Utils.formatTimeShort(now);

        // 遅刻・早退判定
        const status = Utils.determineClockStatus(clockType, time, slotInfo);

        const record = {
            id: Utils.generateId(),
            date: Utils.formatDate(now),
            staffId: staffId,
            staffName: staffName,
            slotId: selectedSlot,
            slotLabel: slotInfo.label,
            clockType: clockType,
            time: time,
            status: status,
            timestamp: now.toISOString()
        };

        if (!isConfigValid()) {
            // ローカルに保存
            const localRecords = Utils.getFromStorage(CONFIG.STORAGE_KEYS.CLOCK_RECORDS) || [];
            localRecords.push(record);
            Utils.saveToStorage(CONFIG.STORAGE_KEYS.CLOCK_RECORDS, localRecords);
            todayRecords.push(record);
            renderHistory();
            updateStatusDisplay();

            let message = clockType === 'in'
                ? `${slotInfo.label}シフト 出勤を記録しました`
                : `${slotInfo.label}シフト 退勤を記録しました`;

            if (status === 'late') {
                message += '（遅刻）';
            } else if (status === 'early_leave') {
                message += '（早退）';
            }

            Utils.showMessage(message, 'success');
            return;
        }

        try {
            Utils.showLoading(true, '打刻中...');
            const response = await Utils.apiRequest('punch', record);

            if (response.success || response.ok) {
                todayRecords.push(record);
                renderHistory();
                updateStatusDisplay();

                let message = clockType === 'in'
                    ? `${slotInfo.label}シフト 出勤を記録しました`
                    : `${slotInfo.label}シフト 退勤を記録しました`;

                if (status === 'late') {
                    message += '（遅刻）';
                } else if (status === 'early_leave') {
                    message += '（早退）';
                }

                Utils.showMessage(message, 'success');
            } else {
                Utils.showMessage(response.message || response.error || '打刻に失敗しました', 'error');
            }
        } catch (error) {
            console.error('打刻エラー:', error);
            Utils.showMessage('通信エラーが発生しました', 'error');
        } finally {
            Utils.showLoading(false);
        }
    }

    /**
     * 打刻履歴をレンダリング
     */
    function renderHistory() {
        const staffId = elements.staffSelect.value;

        const records = todayRecords
            .filter(r => !staffId || r.staffId === staffId)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        if (records.length === 0) {
            elements.historyList.innerHTML = '<p class="no-history">打刻履歴はありません</p>';
            return;
        }

        const html = '<ul class="history-list">' + records.map(record => {
            const typeClass = record.clockType === 'in' ? 'clock-in' : 'clock-out';
            const typeLabel = record.clockType === 'in' ? '出勤' : '退勤';
            let statusBadge = '';

            if (record.status === 'late') {
                statusBadge = '<span class="badge badge--warning">遅刻</span>';
            } else if (record.status === 'early_leave') {
                statusBadge = '<span class="badge badge--warning">早退</span>';
            }

            return `
                <li class="history-item history-item--${typeClass}">
                    <div>
                        <span class="history-type">${typeLabel}</span>
                        ${record.slotLabel ? `<small style="color: var(--color-gray-500); margin-left: 0.5rem;">${record.slotLabel}</small>` : ''}
                        ${statusBadge}
                    </div>
                    <span class="history-time">${record.time}</span>
                </li>
            `;
        }).join('') + '</ul>';

        elements.historyList.innerHTML = html;
    }

    // ========== 研修打刻テストモード ==========

    /**
     * テストモードの初期化
     */
    function initTestMode() {
        if (!elements.testModeToggle) return;

        // 保存されたテスト記録を読み込み
        testRecords = Utils.getFromStorage('cafe_test_clock_records') || [];
        renderTestHistory();

        // トグルスイッチのイベント
        elements.testModeToggle.addEventListener('change', handleTestModeToggle);

        // テスト打刻ボタンのイベント
        if (elements.btnTestClockIn) {
            elements.btnTestClockIn.addEventListener('click', () => handleTestPunch('in'));
        }
        if (elements.btnTestClockOut) {
            elements.btnTestClockOut.addEventListener('click', () => handleTestPunch('out'));
        }
        if (elements.btnClearTestHistory) {
            elements.btnClearTestHistory.addEventListener('click', handleClearTestHistory);
        }
    }

    /**
     * テストモードの切り替え
     */
    function handleTestModeToggle() {
        const isEnabled = elements.testModeToggle.checked;
        elements.testModePanel.style.display = isEnabled ? 'block' : 'none';

        if (isEnabled) {
            Utils.showMessage('研修テストモードが有効になりました', 'success');
        }
    }

    /**
     * テスト打刻処理
     */
    function handleTestPunch(clockType) {
        const staffId = elements.staffSelect.value;
        const staffName = getStaffName(staffId);

        if (!staffId) {
            Utils.showMessage('スタッフを選択してください', 'error');
            return;
        }

        // 二重打刻チェック
        const lastTestRecord = testRecords.filter(r => r.staffId === staffId)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

        if (clockType === 'in' && lastTestRecord?.clockType === 'in') {
            Utils.showMessage('テスト: すでに出勤済みです', 'error');
            return;
        }
        if (clockType === 'out' && lastTestRecord?.clockType === 'out') {
            Utils.showMessage('テスト: すでに退勤済みです', 'error');
            return;
        }
        if (clockType === 'out' && !lastTestRecord) {
            Utils.showMessage('テスト: 先にテスト出勤をしてください', 'error');
            return;
        }

        const now = Utils.getJSTDate();
        const time = Utils.formatTimeShort(now);

        // テスト用のシフト枠情報（現在時刻から30分間）
        const testSlotInfo = {
            id: 'test',
            label: 'テスト枠',
            start: time,
            end: addMinutes(time, 30)
        };

        // テスト用の遅刻・早退判定（常に正常）
        const status = 'normal';

        const record = {
            id: Utils.generateId(),
            date: Utils.formatDate(now),
            staffId: staffId,
            staffName: staffName,
            slotId: 'test',
            slotLabel: 'テスト枠',
            clockType: clockType,
            time: time,
            status: status,
            timestamp: now.toISOString(),
            isTest: true
        };

        testRecords.push(record);
        Utils.saveToStorage('cafe_test_clock_records', testRecords);
        renderTestHistory();

        const message = clockType === 'in'
            ? `テスト出勤を記録しました（${time}）`
            : `テスト退勤を記録しました（${time}）`;

        Utils.showMessage(message, 'success');
    }

    /**
     * 時刻に分を追加
     */
    function addMinutes(timeStr, minutes) {
        const [h, m] = timeStr.split(':').map(Number);
        const totalMinutes = h * 60 + m + minutes;
        const newH = Math.floor(totalMinutes / 60) % 24;
        const newM = totalMinutes % 60;
        return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
    }

    /**
     * テスト履歴をレンダリング
     */
    function renderTestHistory() {
        if (!elements.testHistoryList) return;

        const staffId = elements.staffSelect.value;
        const records = testRecords
            .filter(r => !staffId || r.staffId === staffId)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        if (records.length === 0) {
            elements.testHistoryList.innerHTML = '<p class="no-history">テスト打刻履歴はありません</p>';
            return;
        }

        const html = '<ul class="test-history-list">' + records.map(record => {
            const typeClass = record.clockType === 'in' ? 'clock-in' : 'clock-out';
            const typeLabel = record.clockType === 'in' ? 'テスト出勤' : 'テスト退勤';

            return `
                <li class="test-history-item test-history-item--${typeClass}">
                    <div>
                        <span class="test-history-type">${typeLabel}</span>
                        <small style="color: var(--color-text-muted); margin-left: 0.5rem;">${record.staffName}</small>
                    </div>
                    <span class="test-history-time">${record.time}</span>
                </li>
            `;
        }).join('') + '</ul>';

        elements.testHistoryList.innerHTML = html;
    }

    /**
     * テスト履歴をクリア
     */
    function handleClearTestHistory() {
        if (!confirm('テスト打刻履歴をすべて削除しますか？')) {
            return;
        }

        testRecords = [];
        Utils.saveToStorage('cafe_test_clock_records', testRecords);
        renderTestHistory();
        Utils.showMessage('テスト履歴をクリアしました', 'success');
    }

    // 初期化
    document.addEventListener('DOMContentLoaded', init);
})();
