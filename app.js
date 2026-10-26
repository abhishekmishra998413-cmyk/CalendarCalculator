/**
 * CHRONOS - CALENDAR & DATE CALCULATOR
 * Accurate Gregorian Calendar Algorithms & Interactive Web UI
 */

// ==========================================
//           CONSTANTS & CORE ARRAYS
// ==========================================
const MONTH_NAMES = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December"
];

const DAYS_IN_MONTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ==========================================
//       MATHEMATICALLY ACCURATE ENGINE
// ==========================================

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

function getDaysInMonth(month, year) {
  // month: 1-indexed (1 = Jan, ..., 12 = Dec)
  if (month === 2 && isLeapYear(year)) return 29;
  return DAYS_IN_MONTHS[month - 1];
}

/**
 * Sakamoto's Algorithm for Day of Week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 */
function getDayOfWeek(day, month, year) {
  const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
  let y = year;
  if (month < 3) {
    y -= 1;
  }
  return (y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + t[month - 1] + day) % 7;
}

function daysBeforeYear(y) {
  const prev = y - 1;
  return prev * 365 + Math.floor(prev / 4) - Math.floor(prev / 100) + Math.floor(prev / 400);
}

/**
 * Maps date to absolute day count since 0001-01-01 (Rata Die)
 */
function dateToAbsoluteDays(day, month, year) {
  let total = daysBeforeYear(year);
  for (let m = 1; m < month; ++m) {
    total += getDaysInMonth(m, year);
  }
  total += day;
  return total;
}

/**
 * Maps absolute days back to {day, month, year} via binary search
 */
function absoluteDaysToDate(days) {
  let low = 1, high = 1000000;
  let year = 1;
  while (low <= high) {
    const mid = Math.floor(low + (high - low) / 2);
    if (daysBeforeYear(mid) < days) {
      year = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  let rem = days - daysBeforeYear(year);
  let month = 1;
  for (let m = 1; m <= 12; ++m) {
    const dim = getDaysInMonth(m, year);
    if (rem <= dim) {
      month = m;
      break;
    }
    rem -= dim;
  }
  return { day: rem, month, year };
}

function getDayOfYear(day, month, year) {
  let doy = 0;
  for (let m = 1; m < month; ++m) {
    doy += getDaysInMonth(m, year);
  }
  doy += day;
  return doy;
}

function getISOWeekNumber(d, m, y) {
  const target = new Date(Date.UTC(y, m - 1, d));
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setUTCMonth(0, 1);
  if (target.getUTCDay() !== 4) {
    target.setUTCMonth(0, 1 + ((4 - target.getUTCDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

// ==========================================
//              STATE & UI REFS
// ==========================================
const state = {
  currentTab: 'tab-month',
  viewYear: new Date().getFullYear(),
  viewMonth: new Date().getMonth() + 1, // 1-indexed
  selectedDate: {
    day: new Date().getDate(),
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  },
  mathOp: 'add'
};

const UI = {
  themeToggleBtn: document.getElementById('themeToggleBtn'),
  themeToggleLabel: document.getElementById('themeToggleLabel'),
  liveClockTime: document.getElementById('liveClockTime'),
  liveClockDate: document.getElementById('liveClockDate'),
  quickTodayBtn: document.getElementById('quickTodayBtn'),
  toastNotification: document.getElementById('toastNotification'),

  // Tabs
  navItems: document.querySelectorAll('.nav-item'),
  tabPanes: document.querySelectorAll('.tab-pane'),
  currentTabTitle: document.getElementById('currentTabTitle'),
  currentTabSubtitle: document.getElementById('currentTabSubtitle'),

  // Month Tab
  prevMonthBtn: document.getElementById('prevMonthBtn'),
  nextMonthBtn: document.getElementById('nextMonthBtn'),
  monthSelect: document.getElementById('monthSelect'),
  yearInput: document.getElementById('yearInput'),
  calendarGridDays: document.getElementById('calendarGridDays'),
  monthTotalDaysPill: document.getElementById('monthTotalDaysPill'),
  monthLeapPill: document.getElementById('monthLeapPill'),
  monthStartWeekdayPill: document.getElementById('monthStartWeekdayPill'),

  // Drawer
  detailDayNumber: document.getElementById('detailDayNumber'),
  detailMonthYear: document.getElementById('detailMonthYear'),
  detailFullDate: document.getElementById('detailFullDate'),
  detailSubtitle: document.getElementById('detailSubtitle'),
  detailWeekday: document.getElementById('detailWeekday'),
  detailWeekNum: document.getElementById('detailWeekNum'),
  detailDaysLeft: document.getElementById('detailDaysLeft'),
  detailYearPct: document.getElementById('detailYearPct'),

  // Year Tab
  fullYearInput: document.getElementById('fullYearInput'),
  prevYearBtn: document.getElementById('prevYearBtn'),
  nextYearBtn: document.getElementById('nextYearBtn'),
  printCalendarBtn: document.getElementById('printCalendarBtn'),
  yearSummaryLeap: document.getElementById('yearSummaryLeap'),
  yearSummaryFirstDay: document.getElementById('yearSummaryFirstDay'),
  yearSummaryLastDay: document.getElementById('yearSummaryLastDay'),
  yearSummaryWeeks: document.getElementById('yearSummaryWeeks'),
  fullYearGridContainer: document.getElementById('fullYearGridContainer'),

  // Diff Tab
  diffStartDate: document.getElementById('diffStartDate'),
  diffEndDate: document.getElementById('diffEndDate'),
  calculateDiffBtn: document.getElementById('calculateDiffBtn'),
  swapDiffDatesBtn: document.getElementById('swapDiffDatesBtn'),
  diffTotalDays: document.getElementById('diffTotalDays'),
  diffHumanBreakdown: document.getElementById('diffHumanBreakdown'),
  diffInclusiveDays: document.getElementById('diffInclusiveDays'),
  diffBusinessDays: document.getElementById('diffBusinessDays'),
  diffWeekendDays: document.getElementById('diffWeekendDays'),
  diffWeeksAndDays: document.getElementById('diffWeeksAndDays'),
  diffTotalHours: document.getElementById('diffTotalHours'),

  // Math Tab
  mathBaseDate: document.getElementById('mathBaseDate'),
  mathYears: document.getElementById('mathYears'),
  mathMonths: document.getElementById('mathMonths'),
  mathWeeks: document.getElementById('mathWeeks'),
  mathDays: document.getElementById('mathDays'),
  toggleButtons: document.querySelectorAll('.toggle-btn'),
  mathResultDate: document.getElementById('mathResultDate'),
  mathResultWeekday: document.getElementById('mathResultWeekday'),
  mathOpSummary: document.getElementById('mathOpSummary'),
  mathDayOfYear: document.getElementById('mathDayOfYear'),
  mathWeekOfYear: document.getElementById('mathWeekOfYear'),
  mathIsLeap: document.getElementById('mathIsLeap'),
  presetChips: document.querySelectorAll('[data-preset-days]'),

  // Age Tab
  ageBirthDate: document.getElementById('ageBirthDate'),
  ageTargetDate: document.getElementById('ageTargetDate'),
  bdayDays: document.getElementById('bdayDays'),
  bdayHours: document.getElementById('bdayHours'),
  bdayMinutes: document.getElementById('bdayMinutes'),
  bdaySeconds: document.getElementById('bdaySeconds'),
  ageExactBreakdown: document.getElementById('ageExactBreakdown'),
  ageTotalDays: document.getElementById('ageTotalDays'),
  ageTotalHours: document.getElementById('ageTotalHours'),
  ageHeartbeats: document.getElementById('ageHeartbeats'),
  ageBreaths: document.getElementById('ageBreaths'),
  ageSleepingHours: document.getElementById('ageSleepingHours'),
  ageBornDay: document.getElementById('ageBornDay'),

  // Leap Tab
  leapYearInput: document.getElementById('leapYearInput'),
  leapCheckBtn: document.getElementById('leapCheckBtn'),
  leapResultBadge: document.getElementById('leapResultBadge'),
  leapBadgeTitle: document.getElementById('leapBadgeTitle'),
  leapBadgeSubtitle: document.getElementById('leapBadgeSubtitle'),
  ruleDiv4: document.getElementById('ruleDiv4'),
  ruleText4: document.getElementById('ruleText4'),
  ruleStatus4: document.getElementById('ruleStatus4'),
  ruleDiv100: document.getElementById('ruleDiv100'),
  ruleText100: document.getElementById('ruleText100'),
  ruleStatus100: document.getElementById('ruleStatus100'),
  ruleDiv400: document.getElementById('ruleDiv400'),
  ruleText400: document.getElementById('ruleText400'),
  ruleStatus400: document.getElementById('ruleStatus400'),
  nearbyLeapContainer: document.getElementById('nearbyLeapContainer')
};

// ==========================================
//            TOAST NOTIFICATION
// ==========================================
function showToast(message) {
  UI.toastNotification.textContent = message;
  UI.toastNotification.classList.add('show');
  setTimeout(() => {
    UI.toastNotification.classList.remove('show');
  }, 2500);
}

// ==========================================
//             LIVE CLOCK ENGINE
// ==========================================
function updateClock() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const dateStr = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  UI.liveClockTime.textContent = timeStr;
  UI.liveClockDate.textContent = dateStr;
}
setInterval(updateClock, 1000);
updateClock();

// ==========================================
//             THEME TOGGLING
// ==========================================
function initTheme() {
  const savedTheme = localStorage.getItem('chronos_theme') || 'dark';
  document.body.setAttribute('data-theme', savedTheme);
  UI.themeToggleLabel.textContent = savedTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
}

UI.themeToggleBtn.addEventListener('click', () => {
  const current = document.body.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.body.setAttribute('data-theme', next);
  localStorage.setItem('chronos_theme', next);
  UI.themeToggleLabel.textContent = next === 'dark' ? 'Light Mode' : 'Dark Mode';
  showToast(`Switched to ${next} mode`);
});

// ==========================================
//             TAB NAVIGATION
// ==========================================
const TAB_TITLES = {
  'tab-month': { title: 'Month Calendar', subtitle: 'Explore interactive monthly calendar grids and dates' },
  'tab-year': { title: 'Full Year View', subtitle: 'Complete 12-month annual calendar and print-ready overview' },
  'tab-diff': { title: 'Date Difference', subtitle: 'Exact spans, business days, and weekend count between two dates' },
  'tab-math': { title: 'Add / Subtract Days', subtitle: 'Perform precise date arithmetic and offset calculations' },
  'tab-age': { title: 'Age & Life Milestones', subtitle: 'Exact age breakdown, next birthday timer, and life statistics' },
  'tab-leap': { title: 'Leap Year Checker', subtitle: 'Step-by-step verification of Gregorian leap year rules' }
};

UI.navItems.forEach(btn => {
  btn.addEventListener('click', () => {
    const tabId = btn.getAttribute('data-tab');
    switchTab(tabId);
  });
});

function switchTab(tabId) {
  state.currentTab = tabId;

  UI.navItems.forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-tab') === tabId);
  });

  UI.tabPanes.forEach(pane => {
    pane.classList.toggle('active', pane.id === tabId);
  });

  if (TAB_TITLES[tabId]) {
    UI.currentTabTitle.textContent = TAB_TITLES[tabId].title;
    UI.currentTabSubtitle.textContent = TAB_TITLES[tabId].subtitle;
  }

  // Trigger tab-specific renders
  if (tabId === 'tab-year') {
    renderFullYearCalendar(parseInt(UI.fullYearInput.value, 10));
  } else if (tabId === 'tab-diff') {
    calculateDateDifference();
  } else if (tabId === 'tab-math') {
    calculateDateArithmetic();
  } else if (tabId === 'tab-age') {
    calculateAgeAndMilestones();
  } else if (tabId === 'tab-leap') {
    verifyLeapYear(parseInt(UI.leapYearInput.value, 10));
  }
}

// Quick Jump to Today
UI.quickTodayBtn.addEventListener('click', () => {
  const today = new Date();
  state.viewYear = today.getFullYear();
  state.viewMonth = today.getMonth() + 1;
  state.selectedDate = { day: today.getDate(), month: state.viewMonth, year: state.viewYear };

  UI.yearInput.value = state.viewYear;
  UI.monthSelect.value = state.viewMonth;

  if (state.currentTab !== 'tab-month') {
    switchTab('tab-month');
  }

  renderMonthCalendar();
  showToast("Jumped to Today's Date!");
});

// ==========================================
//           TAB 1: MONTH CALENDAR
// ==========================================
function populateMonthSelect() {
  UI.monthSelect.innerHTML = '';
  MONTH_NAMES.forEach((m, idx) => {
    const opt = document.createElement('option');
    opt.value = idx + 1;
    opt.textContent = m;
    UI.monthSelect.appendChild(opt);
  });
}

function renderMonthCalendar() {
  const m = state.viewMonth;
  const y = state.viewYear;

  const totalDays = getDaysInMonth(m, y);
  const startDay = getDayOfWeek(1, m, y);
  const leap = isLeapYear(y);

  // Meta pills
  UI.monthTotalDaysPill.textContent = `${totalDays} Days`;
  UI.monthLeapPill.textContent = leap ? 'Leap Year' : 'Common Year';
  UI.monthStartWeekdayPill.textContent = `Starts on ${WEEKDAYS[startDay]}`;

  UI.calendarGridDays.innerHTML = '';

  // Blank filler cells before the 1st
  for (let i = 0; i < startDay; ++i) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'day-cell empty';
    UI.calendarGridDays.appendChild(emptyCell);
  }

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === y && (today.getMonth() + 1) === m;

  for (let d = 1; d <= totalDays; ++d) {
    const cell = document.createElement('div');
    cell.className = 'day-cell';

    const dow = (startDay + d - 1) % 7;
    if (dow === 0 || dow === 6) {
      cell.classList.add('weekend-day');
    }

    if (isCurrentMonth && d === today.getDate()) {
      cell.classList.add('today');
    }

    if (state.selectedDate.day === d && state.selectedDate.month === m && state.selectedDate.year === y) {
      cell.classList.add('selected');
    }

    const numSpan = document.createElement('span');
    numSpan.className = 'day-num';
    numSpan.textContent = d;
    cell.appendChild(numSpan);

    if (isCurrentMonth && d === today.getDate()) {
      const tag = document.createElement('span');
      tag.className = 'day-tag';
      tag.textContent = 'TODAY';
      cell.appendChild(tag);
    }

    cell.addEventListener('click', () => {
      state.selectedDate = { day: d, month: m, year: y };
      document.querySelectorAll('.day-cell').forEach(c => c.classList.remove('selected'));
      cell.classList.add('selected');
      updateDateDrawer(d, m, y);
    });

    UI.calendarGridDays.appendChild(cell);
  }

  // Update Drawer with current selected or 1st day
  updateDateDrawer(state.selectedDate.day, state.selectedDate.month, state.selectedDate.year);
}

function updateDateDrawer(d, m, y) {
  // Ensure valid day for the current month
  const maxDay = getDaysInMonth(m, y);
  if (d > maxDay) d = maxDay;

  const dow = getDayOfWeek(d, m, y);
  const doy = getDayOfYear(d, m, y);
  const totalYearDays = isLeapYear(y) ? 366 : 365;
  const daysLeft = totalYearDays - doy;
  const pct = ((doy / totalYearDays) * 100).toFixed(1);
  const weekNum = getISOWeekNumber(d, m, y);

  UI.detailDayNumber.textContent = d;
  UI.detailMonthYear.textContent = `${MONTH_NAMES[m - 1].substring(0, 3)} ${y}`;
  UI.detailFullDate.textContent = `${WEEKDAYS[dow]}, ${MONTH_NAMES[m - 1]} ${d}, ${y}`;
  UI.detailSubtitle.textContent = `Day ${doy} of ${totalYearDays} in ${y}`;

  UI.detailWeekday.textContent = WEEKDAYS[dow];
  UI.detailWeekNum.textContent = `Week ${weekNum}`;
  UI.detailDaysLeft.textContent = `${daysLeft} days`;
  UI.detailYearPct.textContent = `${pct}%`;
}

// Navigation event listeners
UI.prevMonthBtn.addEventListener('click', () => {
  state.viewMonth -= 1;
  if (state.viewMonth < 1) {
    state.viewMonth = 12;
    state.viewYear -= 1;
    UI.yearInput.value = state.viewYear;
  }
  UI.monthSelect.value = state.viewMonth;
  renderMonthCalendar();
});

UI.nextMonthBtn.addEventListener('click', () => {
  state.viewMonth += 1;
  if (state.viewMonth > 12) {
    state.viewMonth = 1;
    state.viewYear += 1;
    UI.yearInput.value = state.viewYear;
  }
  UI.monthSelect.value = state.viewMonth;
  renderMonthCalendar();
});

UI.monthSelect.addEventListener('change', (e) => {
  state.viewMonth = parseInt(e.target.value, 10);
  renderMonthCalendar();
});

UI.yearInput.addEventListener('change', (e) => {
  let val = parseInt(e.target.value, 10);
  if (isNaN(val) || val < 1) val = 1;
  if (val > 9999) val = 9999;
  state.viewYear = val;
  e.target.value = val;
  renderMonthCalendar();
});

// ==========================================
//          TAB 2: FULL YEAR VIEW
// ==========================================
function renderFullYearCalendar(year) {
  if (isNaN(year) || year < 1) year = 2026;
  const leap = isLeapYear(year);
  const totalDays = leap ? 366 : 365;
  const firstDow = getDayOfWeek(1, 1, year);
  const lastDow = getDayOfWeek(31, 12, year);

  UI.yearSummaryLeap.textContent = leap ? 'Yes (366 days)' : 'No (365 days)';
  UI.yearSummaryFirstDay.textContent = WEEKDAYS[firstDow];
  UI.yearSummaryLastDay.textContent = WEEKDAYS[lastDow];
  UI.yearSummaryWeeks.textContent = leap && (firstDow === 3 || firstDow === 4) ? '53 Weeks' : '52 Weeks';

  UI.fullYearGridContainer.innerHTML = '';
  const today = new Date();

  for (let m = 1; m <= 12; ++m) {
    const card = document.createElement('div');
    card.className = 'mini-month-card';

    const title = document.createElement('div');
    title.className = 'mini-month-title';
    title.textContent = MONTH_NAMES[m - 1];
    card.appendChild(title);

    const head = document.createElement('div');
    head.className = 'mini-grid-head';
    WEEKDAYS_SHORT.forEach(d => {
      const s = document.createElement('span');
      s.textContent = d[0];
      head.appendChild(s);
    });
    card.appendChild(head);

    const daysGrid = document.createElement('div');
    daysGrid.className = 'mini-grid-days';

    const startDow = getDayOfWeek(1, m, year);
    const mDays = getDaysInMonth(m, year);

    for (let i = 0; i < startDow; ++i) {
      const empty = document.createElement('div');
      empty.className = 'mini-day';
      daysGrid.appendChild(empty);
    }

    const isCurrentMonth = today.getFullYear() === year && (today.getMonth() + 1) === m;

    for (let d = 1; d <= mDays; ++d) {
      const dayEl = document.createElement('div');
      dayEl.className = 'mini-day';
      dayEl.textContent = d;

      const dow = (startDow + d - 1) % 7;
      if (dow === 0 || dow === 6) dayEl.classList.add('weekend');
      if (isCurrentMonth && d === today.getDate()) dayEl.classList.add('today');

      daysGrid.appendChild(dayEl);
    }

    card.appendChild(daysGrid);
    UI.fullYearGridContainer.appendChild(card);
  }
}

UI.fullYearInput.addEventListener('change', (e) => {
  renderFullYearCalendar(parseInt(e.target.value, 10));
});

UI.prevYearBtn.addEventListener('click', () => {
  let val = parseInt(UI.fullYearInput.value, 10) - 1;
  if (val < 1) val = 1;
  UI.fullYearInput.value = val;
  renderFullYearCalendar(val);
});

UI.nextYearBtn.addEventListener('click', () => {
  let val = parseInt(UI.fullYearInput.value, 10) + 1;
  UI.fullYearInput.value = val;
  renderFullYearCalendar(val);
});

UI.printCalendarBtn.addEventListener('click', () => {
  window.print();
});

// ==========================================
//          TAB 3: DATE DIFFERENCE
// ==========================================
function calculateDateDifference() {
  const startStr = UI.diffStartDate.value;
  const endStr = UI.diffEndDate.value;
  if (!startStr || !endStr) return;

  const [y1, m1, d1] = startStr.split('-').map(Number);
  const [y2, m2, d2] = endStr.split('-').map(Number);

  const abs1 = dateToAbsoluteDays(d1, m1, y1);
  const abs2 = dateToAbsoluteDays(d2, m2, y2);

  const diff = Math.abs(abs2 - abs1);
  const inclusive = diff + 1;

  // Business days
  const minDate = abs1 <= abs2 ? { d: d1, m: m1, y: y1 } : { d: d2, m: m2, y: y2 };
  const fullWeeks = Math.floor(inclusive / 7);
  let businessDays = fullWeeks * 5;
  const rem = inclusive % 7;
  const startDow = getDayOfWeek(minDate.d, minDate.m, minDate.y);

  for (let i = 0; i < rem; ++i) {
    const dow = (startDow + i) % 7;
    if (dow !== 0 && dow !== 6) businessDays++;
  }

  const weekendDays = inclusive - businessDays;
  const weeks = Math.floor(diff / 7);
  const remainingDays = diff % 7;
  const hours = diff * 24;

  // Human Breakdown
  let sY = y1, sM = m1, sD = d1;
  let eY = y2, eM = m2, eD = d2;
  if (abs1 > abs2) {
    [sY, eY] = [eY, sY];
    [sM, eM] = [eM, sM];
    [sD, eD] = [eD, sD];
  }

  if (eD < sD) {
    eM -= 1;
    if (eM < 1) {
      eM = 12;
      eY -= 1;
    }
    eD += getDaysInMonth(eM, eY);
  }

  if (eM < sM) {
    eM += 12;
    eY -= 1;
  }

  const outYears = eY - sY;
  const outMonths = eM - sM;
  const outDays = eD - sD;

  UI.diffTotalDays.textContent = diff.toLocaleString();
  UI.diffHumanBreakdown.textContent = `${outYears}y, ${outMonths}m, ${outDays}d`;
  UI.diffInclusiveDays.textContent = `${inclusive.toLocaleString()} days`;
  UI.diffBusinessDays.textContent = `${businessDays.toLocaleString()} days`;
  UI.diffWeekendDays.textContent = `${weekendDays.toLocaleString()} days`;
  UI.diffWeeksAndDays.textContent = `${weeks} weeks, ${remainingDays} days`;
  UI.diffTotalHours.textContent = `${hours.toLocaleString()} hrs`;
}

UI.calculateDiffBtn.addEventListener('click', calculateDateDifference);

UI.swapDiffDatesBtn.addEventListener('click', () => {
  const tmp = UI.diffStartDate.value;
  UI.diffStartDate.value = UI.diffEndDate.value;
  UI.diffEndDate.value = tmp;
  calculateDateDifference();
  showToast("Dates swapped!");
});

// ==========================================
//        TAB 4: ADD / SUBTRACT DAYS
// ==========================================
function calculateDateArithmetic() {
  const baseStr = UI.mathBaseDate.value;
  if (!baseStr) return;

  const [y, m, d] = baseStr.split('-').map(Number);
  const addY = parseInt(UI.mathYears.value, 10) || 0;
  const addM = parseInt(UI.mathMonths.value, 10) || 0;
  const addW = parseInt(UI.mathWeeks.value, 10) || 0;
  const addD = parseInt(UI.mathDays.value, 10) || 0;

  const totalOffsetDays = (addW * 7) + addD;
  const sign = state.mathOp === 'add' ? 1 : -1;

  // Month & year offset
  let targetY = y + (sign * addY);
  let targetM = m + (sign * addM);

  while (targetM > 12) {
    targetM -= 12;
    targetY += 1;
  }
  while (targetM < 1) {
    targetM += 12;
    targetY -= 1;
  }

  const maxDays = getDaysInMonth(targetM, targetY);
  let targetD = Math.min(d, maxDays);

  // Day offset
  let abs = dateToAbsoluteDays(targetD, targetM, targetY);
  abs += (sign * totalOffsetDays);
  if (abs < 1) abs = 1;

  const res = absoluteDaysToDate(abs);
  const dow = getDayOfWeek(res.day, res.month, res.year);
  const doy = getDayOfYear(res.day, res.month, res.year);
  const weekNum = getISOWeekNumber(res.day, res.month, res.year);
  const leap = isLeapYear(res.year);

  const formattedDate = `${String(res.day).padStart(2, '0')}-${String(res.month).padStart(2, '0')}-${res.year}`;
  UI.mathResultDate.textContent = formattedDate;
  UI.mathResultWeekday.textContent = `${WEEKDAYS[dow]}, ${MONTH_NAMES[res.month - 1]} ${res.day}, ${res.year}`;

  const summaryParts = [];
  if (addY) summaryParts.push(`${addY} yr${addY > 1 ? 's' : ''}`);
  if (addM) summaryParts.push(`${addM} mo${addM > 1 ? 's' : ''}`);
  if (addW) summaryParts.push(`${addW} wk${addW > 1 ? 's' : ''}`);
  if (addD) summaryParts.push(`${addD} day${addD > 1 ? 's' : ''}`);
  if (summaryParts.length === 0) summaryParts.push("0 days");

  UI.mathOpSummary.textContent = `${sign === 1 ? '+' : '−'} ${summaryParts.join(', ')}`;
  UI.mathDayOfYear.textContent = `Day ${doy} of ${leap ? 366 : 365}`;
  UI.mathWeekOfYear.textContent = `Week ${weekNum}`;
  UI.mathIsLeap.textContent = leap ? 'Yes (366 days)' : 'No (365 days)';
}

UI.toggleButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    UI.toggleButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.mathOp = btn.getAttribute('data-op');
    calculateDateArithmetic();
  });
});

[UI.mathBaseDate, UI.mathYears, UI.mathMonths, UI.mathWeeks, UI.mathDays].forEach(el => {
  el.addEventListener('input', calculateDateArithmetic);
});

UI.presetChips.forEach(chip => {
  chip.addEventListener('click', () => {
    const days = parseInt(chip.getAttribute('data-preset-days'), 10);
    UI.mathYears.value = 0;
    UI.mathMonths.value = 0;
    UI.mathWeeks.value = 0;
    UI.mathDays.value = days;
    calculateDateArithmetic();
    showToast(`Preset: +${days} days applied`);
  });
});

// ==========================================
//          TAB 5: AGE & MILESTONES
// ==========================================
let countdownInterval = null;

function calculateAgeAndMilestones() {
  const birthStr = UI.ageBirthDate.value;
  const targetStr = UI.ageTargetDate.value;
  if (!birthStr || !targetStr) return;

  const [bY, bM, bD] = birthStr.split('-').map(Number);
  const [tY, tM, tD] = targetStr.split('-').map(Number);

  const bAbs = dateToAbsoluteDays(bD, bM, bY);
  const tAbs = dateToAbsoluteDays(tD, tM, tY);

  if (tAbs < bAbs) {
    showToast("Target date is before birth date!");
    return;
  }

  const totalDays = tAbs - bAbs;
  const hours = totalDays * 24;
  const heartbeats = Math.floor(totalDays * 24 * 60 * 80); // ~80 bpm
  const breaths = Math.floor(totalDays * 24 * 60 * 16); // ~16 bpm
  const sleepHours = totalDays * 8;
  const bornDow = getDayOfWeek(bD, bM, bY);

  // Exact Years, Months, Days breakdown
  let curY = tY, curM = tM, curD = tD;
  if (curD < bD) {
    curM -= 1;
    if (curM < 1) {
      curM = 12;
      curY -= 1;
    }
    curD += getDaysInMonth(curM, curY);
  }
  if (curM < bM) {
    curM += 12;
    curY -= 1;
  }

  const ageYears = curY - bY;
  const ageMonths = curM - bM;
  const ageDays = curD - bD;

  UI.ageExactBreakdown.textContent = `${ageYears} Years, ${ageMonths} Months, ${ageDays} Days`;
  UI.ageTotalDays.textContent = totalDays.toLocaleString();
  UI.ageTotalHours.textContent = hours.toLocaleString();
  UI.ageHeartbeats.textContent = heartbeats.toLocaleString();
  UI.ageBreaths.textContent = breaths.toLocaleString();
  UI.ageSleepingHours.textContent = `${sleepHours.toLocaleString()} hrs`;
  UI.ageBornDay.textContent = WEEKDAYS[bornDow];

  // Birthday Countdown Live Timer
  if (countdownInterval) clearInterval(countdownInterval);
  updateBirthdayCountdown(bM, bD);
  countdownInterval = setInterval(() => updateBirthdayCountdown(bM, bD), 1000);
}

function updateBirthdayCountdown(bM, bD) {
  const now = new Date();
  let nextBdayYear = now.getFullYear();

  // If birthday this year has already passed, check next year
  let bdayThisYear = new Date(nextBdayYear, bM - 1, bD, 0, 0, 0);
  if (now > bdayThisYear) {
    nextBdayYear += 1;
    bdayThisYear = new Date(nextBdayYear, bM - 1, bD, 0, 0, 0);
  }

  const diffMs = bdayThisYear - now;
  if (diffMs <= 0) {
    UI.bdayDays.textContent = "0";
    UI.bdayHours.textContent = "0";
    UI.bdayMinutes.textContent = "0";
    UI.bdaySeconds.textContent = "0";
    return;
  }

  const totalSecs = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  UI.bdayDays.textContent = days;
  UI.bdayHours.textContent = hours;
  UI.bdayMinutes.textContent = mins;
  UI.bdaySeconds.textContent = secs;
}

UI.ageBirthDate.addEventListener('change', calculateAgeAndMilestones);
UI.ageTargetDate.addEventListener('change', calculateAgeAndMilestones);

// ==========================================
//          TAB 6: LEAP YEAR CHECKER
// ==========================================
function verifyLeapYear(year) {
  if (isNaN(year) || year < 1) year = 2026;

  const div4 = (year % 4 === 0);
  const div100 = (year % 100 === 0);
  const div400 = (year % 400 === 0);
  const isLeap = (div4 && !div100) || div400;

  // Badge
  UI.leapResultBadge.className = `leap-result-badge ${isLeap ? 'leap' : 'common'}`;
  UI.leapBadgeTitle.textContent = isLeap ? 'Leap Year! (366 Days)' : 'Not a Leap Year (365 Days)';
  UI.leapBadgeSubtitle.textContent = isLeap
    ? `${year} has 366 days and February has 29 days.`
    : `${year} has 365 days and February has 28 days.`;

  // Rule 1
  UI.ruleText4.textContent = `${year} ÷ 4 = ${Math.floor(year / 4)} remainder ${year % 4} (${div4 ? 'True' : 'False'})`;
  UI.ruleStatus4.className = `rule-status ${div4 ? 'pass' : 'fail'}`;
  UI.ruleStatus4.textContent = div4 ? '✓' : '✕';

  // Rule 2
  UI.ruleText100.textContent = div100
    ? `${year} ÷ 100 = ${Math.floor(year / 100)} remainder 0 (Century year detected)`
    : `${year} ÷ 100 = ${Math.floor(year / 100)} remainder ${year % 100} (Not a century year)`;
  UI.ruleStatus100.className = `rule-status ${div100 ? 'fail' : 'neutral'}`;
  UI.ruleStatus100.textContent = div100 ? '✕' : '—';

  // Rule 3
  if (div100) {
    UI.ruleText400.textContent = div400
      ? `${year} ÷ 400 = ${Math.floor(year / 400)} remainder 0 (Century exception applies)`
      : `${year} ÷ 400 = ${Math.floor(year / 400)} remainder ${year % 400} (Century exception does not apply)`;
    UI.ruleStatus400.className = `rule-status ${div400 ? 'pass' : 'fail'}`;
    UI.ruleStatus400.textContent = div400 ? '✓' : '✕';
  } else {
    UI.ruleText400.textContent = "Only century years need to be divisible by 400.";
    UI.ruleStatus400.className = "rule-status neutral";
    UI.ruleStatus400.textContent = "—";
  }

  // Nearby leap years
  UI.nearbyLeapContainer.innerHTML = '';
  for (let y = year - 16; y <= year + 16; ++y) {
    if (y > 0 && isLeapYear(y)) {
      const chip = document.createElement('button');
      chip.className = 'chip';
      chip.textContent = y;
      chip.addEventListener('click', () => {
        UI.leapYearInput.value = y;
        verifyLeapYear(y);
      });
      UI.nearbyLeapContainer.appendChild(chip);
    }
  }
}

UI.leapCheckBtn.addEventListener('click', () => {
  verifyLeapYear(parseInt(UI.leapYearInput.value, 10));
});

UI.leapYearInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    verifyLeapYear(parseInt(UI.leapYearInput.value, 10));
  }
});

// ==========================================
//               INITIALIZATION
// ==========================================
function initApp() {
  initTheme();
  populateMonthSelect();

  const today = new Date();
  const todayISO = today.toISOString().split('T')[0];

  // Default dates
  UI.yearInput.value = today.getFullYear();
  UI.monthSelect.value = today.getMonth() + 1;
  UI.fullYearInput.value = today.getFullYear();

  UI.diffStartDate.value = todayISO;
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 30);
  UI.diffEndDate.value = tomorrow.toISOString().split('T')[0];

  UI.mathBaseDate.value = todayISO;
  UI.ageTargetDate.value = todayISO;

  // Initial renders
  renderMonthCalendar();
  calculateDateDifference();
  calculateDateArithmetic();
  calculateAgeAndMilestones();
  verifyLeapYear(today.getFullYear());
}

document.addEventListener('DOMContentLoaded', initApp);
