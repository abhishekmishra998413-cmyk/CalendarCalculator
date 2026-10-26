# 📅 Chronos — Calendar & Date Calculator

A comprehensive, mathematically accurate, and beautifully styled **Calendar & Date Calculator Suite** featuring both:
1. **Interactive Web Application** (`index.html`, `style.css`, `app.js` + `launch.bat`): Zero-dependency, modern responsive web app running directly in your browser.
2. **High-Performance C++ Core** ([`calendar.cpp`](calendar.cpp) / [`code.txt`](code.txt)): Fast, lightweight command-line engine using Sakamoto's algorithm and Rata Die day mapping.

---

## ⚡ Quick Start (Web Application)

### Option A: Double-Click Launcher (Windows)
Double-click [`launch.bat`](launch.bat) in this folder. It immediately opens the application in your default browser.

### Option B: Open in Browser Directly
Double-click [`index.html`](index.html) or right-click $\rightarrow$ **Open with** $\rightarrow$ **Google Chrome / Microsoft Edge / Firefox**.

---

## 🛠 Web Application Features

1. **Interactive Month Calendar Grid**:
   - Navigate months and years with keyboard shortcuts or navigation arrows.
   - Weekend highlighting (`Sun`, `Sat`) and dynamic today marker (`TODAY` tag).
   - Click-to-inspect Date Drawer: reveals ISO week number, day of year, days remaining, and percentage of year elapsed.
   - Quick "Jump to Today" shortcut.

2. **Full Year (12 Months) View**:
   - Clean 3x4 grid rendering all 12 months for any year (1 to 9999).
   - Annual summary: leap year status, total days (365/366), starting weekday, ending weekday, and total weeks.
   - **Print-to-PDF / Paper Support**: Formatted print styles for clean calendar printing.

3. **Date Difference & Business Days**:
   - Exact total days difference between two dates.
   - Inclusive total days calculation.
   - **Business Days (Mon–Fri)** vs. **Weekend Days (Sat–Sun)** computed in $\mathcal{O}(1)$ time.
   - Breakdown into Years, Months, Days, Weeks, and Hours.

4. **Add / Subtract Days (Date Arithmetic)**:
   - Add or subtract combinations of Years, Months, Weeks, and Days.
   - Fast presets: `+1 Week`, `+30 Days`, `+90 Days`, `+180 Days`, `+1 Year`.
   - Real-time result showing target date, weekday, and year progress.

5. **Age & Milestone Calculator**:
   - Computes exact age in Years, Months, and Days.
   - **Live Next Birthday Countdown Timer**: Real-time updating countdown (Days, Hours, Minutes, Seconds).
   - Life stats: Total days lived, total hours, estimated heartbeats (~80 bpm), estimated breaths (~16 bpm), and sleep hours.
   - Day of the week you were born.

6. **Leap Year & Gregorian Rule Checker**:
   - Visual step-by-step validator for the 3 Gregorian Leap Year rules:
     1. $y \pmod 4 == 0$
     2. $y \pmod{100} == 0$ (century check)
     3. $y \pmod{400} == 0$ (century exception)
   - Interactive list of nearby leap years.

7. **Themes & Design**:
   - Dark Mode / Light Mode with seamless transition and `localStorage` persistence.
   - Real-time local time clock in the sidebar.
   - Responsive design for mobile, tablet, and desktop.

---

## 💻 C++ Core Application

The project also includes a standalone C++ implementation ([`calendar.cpp`](calendar.cpp)) implementing the same mathematical models:
- **Weekday Calculation**: Sakamoto's Algorithm $\mathcal{O}(1)$
- **Absolute Date Mapping**: Rata Die (day count from `0001-01-01`)
- **Reverse Day Mapping**: Binary Search over Gregorian cycles

### Compiling C++:
```bash
# MinGW / GCC
g++ -O2 -std=c++11 calendar.cpp -o calendar
./calendar

# MSVC
cl /EHsc /O2 calendar.cpp
calendar.exe
```

---

## 📁 Project Structure

```
calendarcalculator/
│── index.html       # Web Application structure & markup
│── style.css        # Modern glassmorphism CSS & theme definitions
│── app.js           # Core calendar algorithms & interactive UI logic
│── launch.bat       # 1-click Windows launcher for the Web App
│── calendar.cpp     # C++ console implementation
│── code.txt         # Backup copy of C++ source
└── README.md        # Documentation and guides
```
