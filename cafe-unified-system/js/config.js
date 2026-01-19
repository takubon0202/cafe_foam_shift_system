/**
 * 共創カフェ 統合シフト・勤怠管理システム - 設定ファイル
 * attendance-system + cafe-shift-system 統合版
 */

const CONFIG = {
    // =======================================================================
    // API設定
    // =======================================================================

    // Google Apps Script WebアプリURL
    GAS_URL: {
        production: 'https://script.google.com/macros/s/AKfycbxqWXUs4Z7XHWtOamIxp0NV3xFwLlU2MytWoLx8-bB8XugyuyhaO_MfTAdtwwQumVQ2/exec',
        development: 'https://script.google.com/macros/s/AKfycbxqWXUs4Z7XHWtOamIxp0NV3xFwLlU2MytWoLx8-bB8XugyuyhaO_MfTAdtwwQumVQ2/exec'
    },

    // 現在の環境
    ENV: 'development',

    // デモモード（trueの場合、常に本日を営業日として扱う）
    DEMO_MODE: false,

    // 管理画面パスワード
    ADMIN_PASSWORD: 'gakkan2025',

    // =======================================================================
    // カフェ情報
    // =======================================================================

    CAFE_NAME: '共創カフェ',

    // 営業期間
    OPERATION_PERIOD: {
        // プレオープン期間
        preopen: {
            start: '2026-01-21',
            end: '2026-01-27'
        },
        // グランドオープン期間
        grandopen: {
            start: '2026-04-06',
            end: '2026-04-30'
        },
        // 現在のアクティブ期間
        start: '2026-01-21',
        end: '2026-01-27'
    },

    // 特別日
    SPECIAL_DATES: {},

    // 営業時間情報（日付により異なるため参考値）
    BUSINESS_HOURS: {
        morning: '10:40〜13:40',
        afternoon: '14:40〜17:40'
    },

    // =======================================================================
    // シフト枠定義（日付ごとに異なる時間帯対応）
    // =======================================================================

    // グローバルシフト枠（レガシー互換・フォールバック用）
    SHIFT_SLOTS: {
        SLOT_1: {
            id: 'SLOT_1',
            label: '枠1',
            start: '14:40',
            end: '16:10',
            period: 'afternoon',
            duration: 90,
            requiredStaff: 3
        },
        SLOT_2: {
            id: 'SLOT_2',
            label: '枠2',
            start: '16:10',
            end: '17:40',
            period: 'afternoon',
            duration: 90,
            requiredStaff: 3
        }
    },

    // 日付ごとのシフト枠定義（新構造）
    // 管理画面から動的に追加・編集可能
    DATE_SHIFT_SLOTS: {
        '2026-01-21': [
            { id: 'SLOT_1', label: '枠1', start: '14:40', end: '16:10', requiredStaff: 3 },
            { id: 'SLOT_2', label: '枠2', start: '16:10', end: '17:40', requiredStaff: 3 }
        ],
        '2026-01-22': [
            { id: 'SLOT_1', label: '枠1', start: '14:40', end: '16:10', requiredStaff: 3 },
            { id: 'SLOT_2', label: '枠2', start: '16:10', end: '17:40', requiredStaff: 3 }
        ],
        '2026-01-23': [
            { id: 'SLOT_1', label: '枠1', start: '10:40', end: '12:10', requiredStaff: 3 },
            { id: 'SLOT_2', label: '枠2', start: '12:10', end: '13:40', requiredStaff: 3 }
        ],
        '2026-01-26': [
            { id: 'SLOT_1', label: '枠1', start: '14:40', end: '16:10', requiredStaff: 3 },
            { id: 'SLOT_2', label: '枠2', start: '16:10', end: '17:40', requiredStaff: 3 }
        ],
        '2026-01-27': [
            { id: 'SLOT_1', label: '枠1', start: '10:40', end: '12:10', requiredStaff: 3 },
            { id: 'SLOT_2', label: '枠2', start: '12:10', end: '13:40', requiredStaff: 3 }
        ]
    },

    // =======================================================================
    // 営業日・営業枠設定
    // =======================================================================

    // 営業日リスト（2026年1月）
    OPERATION_DATES: [
        // 1/19週
        { date: '2026-01-21', weekday: 3, hasMorning: false, hasAfternoon: true },
        { date: '2026-01-22', weekday: 4, hasMorning: false, hasAfternoon: true },
        { date: '2026-01-23', weekday: 5, hasMorning: true, hasAfternoon: false },
        // 1/26週
        { date: '2026-01-26', weekday: 1, hasMorning: false, hasAfternoon: true },
        { date: '2026-01-27', weekday: 2, hasMorning: true, hasAfternoon: false }
    ],

    // 日付ごとの営業枠ID設定
    DATE_SLOTS: {
        '2026-01-21': ['SLOT_1', 'SLOT_2'],
        '2026-01-22': ['SLOT_1', 'SLOT_2'],
        '2026-01-23': ['SLOT_1', 'SLOT_2'],
        '2026-01-26': ['SLOT_1', 'SLOT_2'],
        '2026-01-27': ['SLOT_1', 'SLOT_2']
    },

    // =======================================================================
    // 週定義（週1制約用）
    // =======================================================================

    // 週の定義（weekKey = その週の月曜日の日付）
    WEEKS: [
        {
            weekKey: '2026-01-19',
            label: '1/19週',
            description: '1月第3週',
            dates: ['2026-01-21', '2026-01-22', '2026-01-23']
        },
        {
            weekKey: '2026-01-26',
            label: '1/26週',
            description: '1月第4週',
            dates: ['2026-01-26', '2026-01-27']
        }
    ],

    // 週1制約（1週間に登録できるシフト数）
    WEEKLY_SHIFT_LIMIT: 1,

    // 各シフトの必要人数
    REQUIRED_STAFF_PER_SLOT: 3,

    // =======================================================================
    // スタッフリスト（32名・学生番号・役職付き）
    // =======================================================================

    STAFF_LIST: [
        { id: '25011003', name: '小畑 璃海', role: 'staff' },
        { id: '25011008', name: '志鎌 智果', role: 'staff' },
        { id: '25011018', name: '薄井 菜々歩', role: 'staff' },
        { id: '25011034', name: '小野寺 陸斗', role: 'staff' },
        { id: '25011039', name: '和根崎 悠平', role: 'staff' },
        { id: '25011045', name: '石井 陽大', role: 'staff' },
        { id: '25011152', name: '鶴巻 結衣', role: 'staff' },
        { id: '25011174', name: '武山 海瑠', role: 'staff' },
        { id: '25011192', name: '福田 蒼馬', role: 'staff' },
        { id: '25011229', name: '山本 凛人', role: 'staff' },
        { id: '25011253', name: '川村 悠紅', role: 'staff' },
        { id: '25011315', name: '鈴木 初美', role: 'staff' },
        { id: '25011335', name: '石原 礼野', role: 'staff' },
        { id: '25011370', name: '鈴木 心美', role: 'staff' },
        { id: '25011422', name: '山田 暁', role: 'staff' },
        { id: '25011444', name: '河鰭 寧々', role: 'staff' },
        { id: '25011466', name: '鈴木 大翔', role: 'staff' },
        { id: '25011472', name: '伊藤 凛香', role: 'staff' },
        { id: '25011490', name: '鈴木 らら', role: 'staff' },
        { id: '25011571', name: '鈴木 悠敏', role: 'staff' },
        { id: '25011584', name: '柴田 悠登', role: 'staff' },
        { id: '25011605', name: '高山 琉音', role: 'staff' },
        { id: '25011614', name: '高橋 奏', role: 'staff' },
        { id: '25011621', name: '門間 琉央', role: 'staff' },
        { id: '25011627', name: '加藤 大青', role: 'staff' },
        { id: '25011690', name: '木村 苺香', role: 'staff' },
        { id: '25011698', name: '佐々 眞陽', role: 'staff' },
        { id: '25011754', name: '山﨑 琢己', role: 'admin' },
        { id: '25011845', name: '延谷 碧', role: 'staff' },
        { id: '25011920', name: '佐藤 斗和', role: 'staff' },
        { id: '25011958', name: '渡邉 瑛介', role: 'staff' },
        { id: '25011985', name: '中村 星翔', role: 'staff' }
    ],

    // 役割定義
    ROLES: {
        admin: { label: '管理者', color: '#DC2626' },
        leader: { label: 'リーダー', color: '#FF9800' },
        staff: { label: 'スタッフ', color: '#16a34a' }
    },

    // =======================================================================
    // 打刻設定
    // =======================================================================

    // 打刻の許容範囲（分）
    PUNCH_TOLERANCE: {
        early: 10,  // 開始10分前から打刻可能
        late: 30    // 開始30分後まで遅刻として記録
    },

    // =======================================================================
    // ローカルストレージ設定
    // =======================================================================

    STORAGE_KEYS: {
        // 新システムのキー
        LAST_STAFF_ID: 'cafe_unified_last_staff_id',
        AUTH_TOKEN: 'cafe_unified_auth',
        SHIFTS: 'cafe_unified_shifts',
        CLOCK_RECORDS: 'cafe_unified_clock',

        // 旧システムのキー（移行用）
        OLD_ATTENDANCE_RECORDS: 'attendance_records',
        OLD_ATTENDANCE_SHIFTS: 'attendance_shift_requests',
        OLD_CAFE_SHIFTS: 'shift_submissions',
        OLD_CAFE_CLOCK: 'clock_records'
    },

    // =======================================================================
    // その他設定
    // =======================================================================

    // メッセージ表示時間（ミリ秒）
    MESSAGE_DURATION: 3000,

    // APIタイムアウト（ミリ秒）- 8秒に短縮してUX改善
    API_TIMEOUT: 8000
};

// =======================================================================
// ヘルパー関数
// =======================================================================

/**
 * 現在の環境に応じたGAS URLを取得
 */
function getGasUrl() {
    return CONFIG.GAS_URL[CONFIG.ENV];
}

/**
 * 設定が正しく行われているかチェック
 */
function isConfigValid() {
    const url = getGasUrl();
    return url && url !== 'YOUR_GAS_WEB_APP_URL_HERE' && url.startsWith('https://');
}

/**
 * 日付をYYYY-MM-DD形式にフォーマット
 */
function formatDateStr(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * YYYY-MM-DD形式の文字列からDateオブジェクトを作成
 * タイムゾーンの問題を避けるため、ローカル時間の午前0時を使用
 */
function parseDateStr(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') {
        console.warn('[parseDateStr] 無効な日付文字列:', dateStr);
        return new Date(NaN);
    }

    // アポストロフィを除去
    if (dateStr.startsWith("'")) {
        dateStr = dateStr.substring(1);
    }

    // ISO形式の場合は正しくパースしてローカル日付を取得
    if (dateStr.includes('T')) {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            // ローカルタイムゾーンでの日付のみを取得して再作成
            return new Date(date.getFullYear(), date.getMonth(), date.getDate());
        }
    }

    // YYYY-MM-DD形式
    const parts = dateStr.split('-');
    if (parts.length !== 3) {
        console.warn('[parseDateStr] 不正な形式:', dateStr);
        return new Date(NaN);
    }

    const [year, month, day] = parts.map(Number);

    // 値の検証
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
        console.warn('[parseDateStr] 数値変換エラー:', dateStr);
        return new Date(NaN);
    }

    // 1899/1900年の無効な日付をチェック
    if (year < 1901) {
        console.warn('[parseDateStr] 無効な年:', year);
        return new Date(NaN);
    }

    // ローカルタイムゾーンの午前0時でDateを作成
    return new Date(year, month - 1, day);
}

/**
 * 曜日名を取得
 */
function getWeekdayName(weekday) {
    const names = ['日', '月', '火', '水', '木', '金', '土'];
    return names[weekday];
}

/**
 * 日付を表示用にフォーマット（例: 1/15（木））
 * 無効な日付の場合は空文字列を返す
 */
function formatDateDisplay(dateStr) {
    if (!dateStr) {
        return '';
    }

    const d = parseDateStr(dateStr);

    // 無効な日付の場合
    if (isNaN(d.getTime())) {
        console.warn('[formatDateDisplay] 無効な日付:', dateStr);
        return '';
    }

    const month = d.getMonth() + 1;
    const day = d.getDate();
    const weekday = getWeekdayName(d.getDay());
    return `${month}/${day}（${weekday}）`;
}

/**
 * 日付から週キーを取得
 * DEMO_MODE時は動的に生成された週リストを使用
 */
function getWeekKey(dateStr) {
    // DEMO_MODEの場合は動的に週リストを取得
    const weeks = getWeeks();

    for (const week of weeks) {
        if (week.dates.includes(dateStr)) {
            return week.weekKey;
        }
    }

    // 見つからない場合は、日付から月曜日を計算して週キーを生成
    if (dateStr && CONFIG.DEMO_MODE) {
        const date = parseDateStr(dateStr);
        if (!isNaN(date.getTime())) {
            const dayOfWeek = date.getDay();
            const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            const monday = new Date(date);
            monday.setDate(date.getDate() + diff);
            return formatDateStr(monday);
        }
    }

    return null;
}

/**
 * 週キーから週情報を取得
 * DEMO_MODE時は動的に生成された週リストを使用
 */
function getWeekInfo(weekKey) {
    if (!weekKey) return null;

    // DEMO_MODEの場合は動的に週リストを取得
    const weeks = getWeeks();
    const found = weeks.find(w => w.weekKey === weekKey);

    if (found) return found;

    // 見つからない場合は、weekKeyから週情報を生成
    if (CONFIG.DEMO_MODE && weekKey) {
        const monday = parseDateStr(weekKey);
        if (!isNaN(monday.getTime())) {
            const dates = [];
            for (let d = 0; d < 5; d++) {
                const date = new Date(monday);
                date.setDate(monday.getDate() + d);
                dates.push(formatDateStr(date));
            }
            const month = monday.getMonth() + 1;
            const day = monday.getDate();
            return {
                weekKey: weekKey,
                label: `${month}/${day}週`,
                dates: dates
            };
        }
    }

    return null;
}

/**
 * 日付の営業情報を取得（カスタムシフト枠も考慮）
 */
function getOperationDate(dateStr) {
    if (CONFIG.DEMO_MODE) {
        const date = parseDateStr(dateStr);
        const dayOfWeek = date.getDay();

        if (dayOfWeek === 0 || dayOfWeek === 6) {
            return null;
        }

        return {
            date: dateStr,
            weekday: dayOfWeek,
            hasMorning: dayOfWeek === 2 || dayOfWeek === 5,
            hasAfternoon: true
        };
    }

    // CONFIG.OPERATION_DATESから検索
    const found = CONFIG.OPERATION_DATES.find(d => d.date === dateStr);
    if (found) return found;

    // カスタムシフト枠が存在する日付も営業日として扱う
    const customSlots = getDateShiftSlots(dateStr);
    if (customSlots && customSlots.length > 0) {
        const date = parseDateStr(dateStr);
        return {
            date: dateStr,
            weekday: date.getDay(),
            hasMorning: true,
            hasAfternoon: true
        };
    }

    return null;
}

/**
 * 指定日が営業日かどうか（カスタムシフト枠も考慮）
 */
function isOperationDate(dateStr) {
    if (CONFIG.DEMO_MODE) {
        const date = parseDateStr(dateStr);
        const dayOfWeek = date.getDay();
        return dayOfWeek >= 1 && dayOfWeek <= 5;
    }

    // CONFIG.OPERATION_DATESに存在するか
    if (CONFIG.OPERATION_DATES.some(d => d.date === dateStr)) {
        return true;
    }

    // カスタムシフト枠が存在する日付も営業日
    const customSlots = getDateShiftSlots(dateStr);
    return customSlots && customSlots.length > 0;
}

/**
 * 指定日の営業枠を取得（日付ごとのシフト枠定義に対応）
 */
function getAvailableSlots(dateStr) {
    // まずDATE_SHIFT_SLOTSをチェック（新構造）
    const dateSlots = getDateShiftSlots(dateStr);
    if (dateSlots && dateSlots.length > 0) {
        return dateSlots;
    }

    // フォールバック: 旧構造
    const opDate = getOperationDate(dateStr);
    if (!opDate) return [];

    const slots = [];
    const slotIds = CONFIG.DATE_SLOTS[dateStr] || [];
    slotIds.forEach(id => {
        if (CONFIG.SHIFT_SLOTS[id]) {
            slots.push(CONFIG.SHIFT_SLOTS[id]);
        }
    });
    return slots;
}

/**
 * 指定日のシフト枠定義を取得（DATE_SHIFT_SLOTSから）
 * ローカルストレージのカスタム設定も考慮
 */
function getDateShiftSlots(dateStr) {
    // まずローカルストレージからカスタム設定をチェック
    const customSlots = getCustomShiftSlots();
    if (customSlots && customSlots[dateStr] !== undefined) {
        // 空配列の場合は削除された日付として扱う
        if (customSlots[dateStr].length === 0) {
            console.log('[getDateShiftSlots] 削除された日付:', dateStr);
            return [];
        }
        console.log('[getDateShiftSlots] カスタム設定を使用:', dateStr, customSlots[dateStr].length, '枠');
        return customSlots[dateStr];
    }
    // CONFIG.DATE_SHIFT_SLOTSから取得
    const defaultSlots = CONFIG.DATE_SHIFT_SLOTS[dateStr] || null;
    if (defaultSlots) {
        console.log('[getDateShiftSlots] デフォルト設定を使用:', dateStr, defaultSlots.length, '枠');
    }
    return defaultSlots;
}

// =======================================================================
// シフト枠設定のキャッシュ管理
// =======================================================================

// グローバルキャッシュ変数
let _shiftSlotConfigCache = null;
let _shiftSlotConfigLoading = false;
let _shiftSlotConfigLoadPromise = null;

/**
 * シフト枠設定を取得（GAS優先、ローカル併用）
 * キャッシュがあればキャッシュを返す
 */
function getCustomShiftSlots() {
    // キャッシュがあれば返す
    if (_shiftSlotConfigCache !== null) {
        return _shiftSlotConfigCache;
    }

    // ローカルストレージから取得（フォールバック）
    try {
        const stored = localStorage.getItem('cafe_custom_shift_slots');
        return stored ? JSON.parse(stored) : null;
    } catch (e) {
        console.warn('[getCustomShiftSlots] エラー:', e);
        return null;
    }
}

/**
 * シフト枠設定をGASから取得してキャッシュに保存
 * @returns {Promise<Object>} シフト枠設定
 */
async function fetchShiftSlotConfig() {
    // 既に読み込み中の場合は、その Promise を返す
    if (_shiftSlotConfigLoading && _shiftSlotConfigLoadPromise) {
        return _shiftSlotConfigLoadPromise;
    }

    // GAS URLが設定されていない場合はローカルから取得
    if (!isConfigValid()) {
        console.log('[fetchShiftSlotConfig] GAS未設定、ローカルから取得');
        return getCustomShiftSlots();
    }

    _shiftSlotConfigLoading = true;

    _shiftSlotConfigLoadPromise = new Promise(async (resolve) => {
        try {
            const url = getGasUrl();
            const response = await fetch(`${url}?action=getShiftSlotConfig`, {
                method: 'GET',
                mode: 'cors'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success && result.slots) {
                _shiftSlotConfigCache = result.slots;
                // ローカルストレージにも保存（オフライン対応）
                saveCustomShiftSlotsLocal(result.slots);
                console.log('[fetchShiftSlotConfig] GASから取得成功:', Object.keys(result.slots).length, '日分');
                resolve(result.slots);
            } else {
                console.warn('[fetchShiftSlotConfig] GASから空のデータ:', result);
                resolve(getCustomShiftSlots());
            }
        } catch (error) {
            console.error('[fetchShiftSlotConfig] GAS取得エラー:', error);
            // エラー時はローカルから取得
            resolve(getCustomShiftSlots());
        } finally {
            _shiftSlotConfigLoading = false;
            _shiftSlotConfigLoadPromise = null;
        }
    });

    return _shiftSlotConfigLoadPromise;
}

/**
 * シフト枠設定キャッシュをクリア
 */
function clearShiftSlotConfigCache() {
    _shiftSlotConfigCache = null;
    console.log('[clearShiftSlotConfigCache] キャッシュをクリア');
}

/**
 * シフト枠設定キャッシュを更新
 */
function updateShiftSlotConfigCache(slots) {
    _shiftSlotConfigCache = slots;
    saveCustomShiftSlotsLocal(slots);
}

/**
 * カスタムシフト設定をローカルストレージに保存（内部用）
 */
function saveCustomShiftSlotsLocal(slots) {
    try {
        localStorage.setItem('cafe_custom_shift_slots', JSON.stringify(slots));
        return true;
    } catch (e) {
        console.error('[saveCustomShiftSlotsLocal] エラー:', e);
        return false;
    }
}

/**
 * カスタムシフト設定をローカルストレージに保存
 * @deprecated GAS連携後は saveShiftSlotToGAS を使用
 */
function saveCustomShiftSlots(slots) {
    _shiftSlotConfigCache = slots;
    return saveCustomShiftSlotsLocal(slots);
}

/**
 * シフト枠をGASに保存
 * @param {string} dateStr - 日付 (YYYY-MM-DD)
 * @param {Object} slot - シフト枠データ
 * @returns {Promise<Object>} 結果
 */
async function saveShiftSlotToGAS(dateStr, slot) {
    if (!isConfigValid()) {
        console.warn('[saveShiftSlotToGAS] GAS未設定、ローカルのみに保存');
        // ローカルのみに保存
        const customSlots = getCustomShiftSlots() || {};
        if (!customSlots[dateStr]) {
            customSlots[dateStr] = [];
        }
        customSlots[dateStr].push(slot);
        saveCustomShiftSlots(customSlots);
        return { success: true, slot: slot };
    }

    try {
        const url = getGasUrl();
        const response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'saveShiftSlot',
                dateStr: dateStr,
                slot: slot
            })
        });

        const result = await response.json();

        if (result.success) {
            // キャッシュを更新
            const customSlots = getCustomShiftSlots() || {};
            if (!customSlots[dateStr]) {
                customSlots[dateStr] = [];
            }
            // 既存のスロットを検索して更新または追加
            const existingIndex = customSlots[dateStr].findIndex(s => s.id === result.slot.id);
            if (existingIndex >= 0) {
                customSlots[dateStr][existingIndex] = result.slot;
            } else {
                customSlots[dateStr].push(result.slot);
            }
            updateShiftSlotConfigCache(customSlots);
        }

        return result;
    } catch (error) {
        console.error('[saveShiftSlotToGAS] エラー:', error);
        return { success: false, error: error.message };
    }
}

/**
 * シフト枠をGASから削除
 * @param {string} dateStr - 日付 (YYYY-MM-DD)
 * @param {string} slotId - シフト枠ID（省略時は日付の全シフト枠を削除）
 * @returns {Promise<Object>} 結果
 */
async function deleteShiftSlotFromGAS(dateStr, slotId) {
    if (!isConfigValid()) {
        console.warn('[deleteShiftSlotFromGAS] GAS未設定、ローカルのみ削除');
        // ローカルのみ削除
        const customSlots = getCustomShiftSlots() || {};
        if (customSlots[dateStr]) {
            if (slotId) {
                customSlots[dateStr] = customSlots[dateStr].filter(s => s.id !== slotId);
                if (customSlots[dateStr].length === 0) {
                    customSlots[dateStr] = [];
                }
            } else {
                customSlots[dateStr] = [];
            }
            saveCustomShiftSlots(customSlots);
        }
        return { success: true };
    }

    try {
        const url = getGasUrl();
        const response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'deleteShiftSlotConfig',
                dateStr: dateStr,
                slotId: slotId
            })
        });

        const result = await response.json();

        if (result.success) {
            // キャッシュを更新
            const customSlots = getCustomShiftSlots() || {};
            if (customSlots[dateStr]) {
                if (slotId) {
                    customSlots[dateStr] = customSlots[dateStr].filter(s => s.id !== slotId);
                    if (customSlots[dateStr].length === 0) {
                        customSlots[dateStr] = [];
                    }
                } else {
                    customSlots[dateStr] = [];
                }
                updateShiftSlotConfigCache(customSlots);
            }
        }

        return result;
    } catch (error) {
        console.error('[deleteShiftSlotFromGAS] エラー:', error);
        return { success: false, error: error.message };
    }
}

/**
 * シフト枠を一括インポート（GAS）
 * @param {Array} slots - シフト枠データの配列
 * @returns {Promise<Object>} 結果
 */
async function importShiftSlotsToGAS(slots) {
    if (!isConfigValid()) {
        console.warn('[importShiftSlotsToGAS] GAS未設定、ローカルのみに保存');
        // ローカルのみに保存
        const customSlots = getCustomShiftSlots() || {};
        slots.forEach(slotData => {
            const dateStr = slotData.date;
            if (!customSlots[dateStr]) {
                customSlots[dateStr] = [];
            }
            const newSlot = {
                id: `SLOT_${Date.now()}_${customSlots[dateStr].length}`,
                label: slotData.label || '',
                start: slotData.start,
                end: slotData.end,
                requiredStaff: slotData.requiredStaff || 3
            };
            customSlots[dateStr].push(newSlot);
        });
        saveCustomShiftSlots(customSlots);
        return { success: true, count: slots.length };
    }

    try {
        const url = getGasUrl();
        const response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'importShiftSlots',
                slots: slots
            })
        });

        const result = await response.json();

        if (result.success) {
            // キャッシュをリフレッシュ
            clearShiftSlotConfigCache();
            await fetchShiftSlotConfig();
        }

        return result;
    } catch (error) {
        console.error('[importShiftSlotsToGAS] エラー:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 日付にシフト枠を追加
 */
function addShiftSlot(dateStr, slotData) {
    const customSlots = getCustomShiftSlots() || {};

    // カスタム設定がない場合、デフォルト設定をコピーしてから追加
    if (!customSlots[dateStr] || customSlots[dateStr].length === 0) {
        // デフォルト設定が存在する場合はコピー
        const defaultSlots = CONFIG.DATE_SHIFT_SLOTS[dateStr];
        if (defaultSlots && defaultSlots.length > 0) {
            // ディープコピーして元の設定を変更しない
            customSlots[dateStr] = JSON.parse(JSON.stringify(defaultSlots));
        } else {
            customSlots[dateStr] = [];
        }
    }

    // 新しいIDを生成（既存のIDと重複しないように）
    const existingIds = customSlots[dateStr].map(s => s.id);
    let newId = `SLOT_${customSlots[dateStr].length + 1}`;
    let counter = customSlots[dateStr].length + 1;
    while (existingIds.includes(newId)) {
        counter++;
        newId = `SLOT_${counter}`;
    }

    const newSlot = {
        id: newId,
        label: slotData.label || `枠${counter}`,
        start: slotData.start,
        end: slotData.end,
        requiredStaff: slotData.requiredStaff || 3
    };

    customSlots[dateStr].push(newSlot);
    saveCustomShiftSlots(customSlots);

    // DATE_SLOTSも更新
    if (!CONFIG.DATE_SLOTS[dateStr]) {
        CONFIG.DATE_SLOTS[dateStr] = [];
    }
    if (!CONFIG.DATE_SLOTS[dateStr].includes(newId)) {
        CONFIG.DATE_SLOTS[dateStr].push(newId);
    }

    // OPERATION_DATESも更新
    if (!CONFIG.OPERATION_DATES.find(d => d.date === dateStr)) {
        const date = parseDateStr(dateStr);
        CONFIG.OPERATION_DATES.push({
            date: dateStr,
            weekday: date.getDay(),
            hasMorning: true,
            hasAfternoon: true
        });
    }

    return newSlot;
}

/**
 * 日付のシフト枠を削除（カスタム設定のみ）
 */
function removeShiftSlot(dateStr, slotId) {
    const customSlots = getCustomShiftSlots() || {};
    if (customSlots[dateStr]) {
        customSlots[dateStr] = customSlots[dateStr].filter(s => s.id !== slotId);
        if (customSlots[dateStr].length === 0) {
            delete customSlots[dateStr];
        }
        saveCustomShiftSlots(customSlots);
    }
    return true;
}

/**
 * 日付のシフト枠を完全に削除（デフォルト設定も上書き）
 * カスタム設定で空配列を設定することで、デフォルト設定を無効化
 */
function removeShiftSlotCompletely(dateStr, slotId) {
    const customSlots = getCustomShiftSlots() || {};

    // その日のシフト枠を取得（デフォルトまたはカスタム）
    const currentSlots = getDateShiftSlots(dateStr) || [];
    const newSlots = currentSlots.filter(s => s.id !== slotId);

    // カスタム設定として保存（デフォルト設定を上書き）
    customSlots[dateStr] = newSlots;
    saveCustomShiftSlots(customSlots);

    return true;
}

/**
 * 日付の全シフト枠を削除
 */
function removeAllShiftSlotsForDate(dateStr) {
    const customSlots = getCustomShiftSlots() || {};
    customSlots[dateStr] = [];  // 空配列でデフォルトを無効化
    saveCustomShiftSlots(customSlots);
    return true;
}

/**
 * 指定日の営業枠ID配列を取得
 */
function getAvailableSlotIds(dateStr) {
    // まずDATE_SHIFT_SLOTSをチェック（新構造）
    const dateSlots = getDateShiftSlots(dateStr);
    if (dateSlots && dateSlots.length > 0) {
        return dateSlots.map(s => s.id);
    }

    if (CONFIG.DEMO_MODE) {
        const date = parseDateStr(dateStr);
        const dayOfWeek = date.getDay();

        if (dayOfWeek === 0 || dayOfWeek === 6) {
            return [];
        }

        return ['SLOT_1', 'SLOT_2'];
    }
    return CONFIG.DATE_SLOTS[dateStr] || [];
}

/**
 * 指定日に指定シフト枠が営業しているか
 */
function isSlotAvailable(dateStr, slotId) {
    const slots = getAvailableSlotIds(dateStr);
    return slots.includes(slotId);
}

/**
 * スタッフIDから名前を取得
 */
function getStaffName(staffId) {
    const staff = CONFIG.STAFF_LIST.find(s => s.id === staffId);
    return staff ? staff.name : '';
}

/**
 * スタッフIDからスタッフ情報を取得
 */
function getStaffById(staffId) {
    return CONFIG.STAFF_LIST.find(s => s.id === staffId) || null;
}

/**
 * 名前からスタッフ情報を取得
 */
function getStaffByName(name) {
    return CONFIG.STAFF_LIST.find(s => s.name === name) || null;
}

/**
 * 営業日リストを取得（カスタムシフト枠の日付も含む）
 */
function getOperationDates() {
    if (CONFIG.DEMO_MODE) {
        const dates = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < 14; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const dayOfWeek = date.getDay();

            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                dates.push(formatDateStr(date));
            }
        }
        return dates;
    }

    // 基本の営業日
    const baseDates = CONFIG.OPERATION_DATES.map(d => d.date);

    // カスタムシフト枠の日付も追加
    const customSlots = getCustomShiftSlots();
    if (customSlots) {
        Object.keys(customSlots).forEach(dateStr => {
            if (!baseDates.includes(dateStr)) {
                baseDates.push(dateStr);
            }
        });
    }

    // 日付順でソート
    return baseDates.sort();
}

/**
 * 営業期間を取得（カスタムシフト枠も考慮して動的に拡張）
 */
function getOperationPeriod() {
    if (CONFIG.DEMO_MODE) {
        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + 13);
        return {
            start: formatDateStr(today),
            end: formatDateStr(endDate)
        };
    }

    // 基本の営業期間
    let start = CONFIG.OPERATION_PERIOD.start;
    let end = CONFIG.OPERATION_PERIOD.end;

    // カスタムシフト枠の日付も考慮して期間を拡張
    const customSlots = getCustomShiftSlots();
    if (customSlots) {
        Object.keys(customSlots).forEach(dateStr => {
            // 空配列の日付はスキップ（削除された日付）
            if (customSlots[dateStr] && customSlots[dateStr].length > 0) {
                if (dateStr < start) start = dateStr;
                if (dateStr > end) end = dateStr;
            }
        });
    }

    return { start, end };
}

/**
 * 週リストを取得（DEMO_MODE対応・カスタムシフト枠対応）
 */
function getWeeks() {
    if (CONFIG.DEMO_MODE) {
        const weeks = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 今週の月曜日を取得
        const dayOfWeek = today.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(today);
        monday.setDate(today.getDate() + diff);

        // 3週間分を生成
        for (let w = 0; w < 3; w++) {
            const weekStart = new Date(monday);
            weekStart.setDate(monday.getDate() + (w * 7));

            const weekKey = formatDateStr(weekStart);
            const dates = [];

            for (let d = 0; d < 5; d++) {
                const date = new Date(weekStart);
                date.setDate(weekStart.getDate() + d);
                dates.push(formatDateStr(date));
            }

            const month = weekStart.getMonth() + 1;
            const day = weekStart.getDate();

            weeks.push({
                weekKey: weekKey,
                label: `${month}/${day}週`,
                dates: dates
            });
        }

        return weeks;
    }

    // カスタムシフト枠を取得
    const customSlots = getCustomShiftSlots();
    console.log('[getWeeks] カスタムシフト枠:', customSlots);

    if (!customSlots || Object.keys(customSlots).length === 0) {
        console.log('[getWeeks] カスタムなし、CONFIG.WEEKSを返す');
        return CONFIG.WEEKS;
    }

    // CONFIG.WEEKSをクローンして変更を加える
    const weeks = JSON.parse(JSON.stringify(CONFIG.WEEKS));
    console.log('[getWeeks] ベース週リスト:', weeks.map(w => w.weekKey));

    // カスタムシフト枠の日付を適切な週に追加
    Object.keys(customSlots).forEach(dateStr => {
        // 空のスロット（削除された日付）はスキップ
        if (!customSlots[dateStr] || customSlots[dateStr].length === 0) return;

        // この日付が既に週に含まれているかチェック
        let found = false;
        for (const week of weeks) {
            if (week.dates.includes(dateStr)) {
                found = true;
                break;
            }
        }

        if (!found) {
            // この日付が属する週を計算
            const date = parseDateStr(dateStr);
            if (isNaN(date.getTime())) return;

            const dayOfWeek = date.getDay();
            const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            const monday = new Date(date);
            monday.setDate(date.getDate() + diff);
            const weekKey = formatDateStr(monday);

            // 既存の週を検索または新規作成
            let targetWeek = weeks.find(w => w.weekKey === weekKey);
            if (!targetWeek) {
                // 新しい週を作成
                const month = monday.getMonth() + 1;
                const day = monday.getDate();
                targetWeek = {
                    weekKey: weekKey,
                    label: `${month}/${day}週`,
                    dates: []
                };
                weeks.push(targetWeek);
            }

            // 日付を週に追加
            if (!targetWeek.dates.includes(dateStr)) {
                targetWeek.dates.push(dateStr);
                targetWeek.dates.sort();
                console.log('[getWeeks] 日付を追加:', dateStr, '→ 週:', targetWeek.weekKey);
            }
        }
    });

    // 週をweekKeyでソート
    weeks.sort((a, b) => a.weekKey.localeCompare(b.weekKey));

    console.log('[getWeeks] 最終週リスト:', weeks.map(w => ({ key: w.weekKey, dates: w.dates })));
    return weeks;
}

/**
 * 総シフト枠数を計算
 */
function getTotalSlotCount() {
    const dates = getOperationDates();
    let count = 0;
    dates.forEach(date => {
        const slots = getAvailableSlotIds(date);
        count += slots.length;
    });
    return count;
}

/**
 * 特定シフト枠の必要人数を取得
 * @param {string} slotId - シフト枠ID
 * @param {string} dateStr - 日付（オプション）
 * @returns {number} - 必要人数（デフォルト: 3）
 */
function getRequiredStaff(slotId, dateStr) {
    // 日付が指定されている場合、その日のシフト枠から取得
    if (dateStr) {
        const dateSlots = getDateShiftSlots(dateStr);
        if (dateSlots) {
            const slot = dateSlots.find(s => s.id === slotId);
            if (slot && typeof slot.requiredStaff === 'number') {
                return slot.requiredStaff;
            }
        }
    }

    // グローバル設定から取得
    const slot = CONFIG.SHIFT_SLOTS[slotId];
    if (slot && typeof slot.requiredStaff === 'number') {
        return slot.requiredStaff;
    }
    // フォールバック: グローバル設定を使用
    return CONFIG.REQUIRED_STAFF_PER_SLOT || 3;
}

/**
 * シフト枠情報を取得
 * @param {string} slotId - シフト枠ID
 * @param {string} dateStr - 日付（オプション）
 * @returns {Object|null} - シフト枠情報
 */
function getSlotInfo(slotId, dateStr) {
    // 日付が指定されている場合、その日のシフト枠から取得
    if (dateStr) {
        const dateSlots = getDateShiftSlots(dateStr);
        if (dateSlots) {
            const slot = dateSlots.find(s => s.id === slotId);
            if (slot) {
                return slot;
            }
        }
    }

    // グローバル設定から取得
    return CONFIG.SHIFT_SLOTS[slotId] || null;
}

/**
 * 全ての営業日とシフト枠を取得（管理画面用）
 */
function getAllShiftSlots() {
    const result = {};

    // CONFIG.DATE_SHIFT_SLOTSから
    Object.keys(CONFIG.DATE_SHIFT_SLOTS || {}).forEach(dateStr => {
        result[dateStr] = CONFIG.DATE_SHIFT_SLOTS[dateStr];
    });

    // カスタム設定から（上書き）
    const customSlots = getCustomShiftSlots();
    if (customSlots) {
        Object.keys(customSlots).forEach(dateStr => {
            result[dateStr] = customSlots[dateStr];
        });
    }

    return result;
}
