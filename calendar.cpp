#include <iostream>
#include <iomanip>
#include <string>
#include <limits>
#include <cmath>
#include <algorithm>

using namespace std;

// Array of Month Names (1-indexed mapping for convenience)
const string MONTH_NAMES[12] = {
    "January",   "February", "March",    "April",
    "May",       "June",     "July",     "August",
    "September", "October",  "November", "December"
};

// Standard number of days in each month for a non-leap year
const int DAYS_IN_MONTHS[12] = {
    31, 28, 31, 30, 31, 30,
    31, 31, 30, 31, 30, 31
};

// Array of Weekday Names (Full)
const string WEEKDAYS[7] = {
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
};

// Array of Weekday Abbreviations (3 letters)
const string WEEKDAYS_SHORT[7] = {
    "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"
};

// Date structure
struct Date {
    int day;
    int month;
    int year;
};

// ==========================================
//           CORE CALCULATION FUNCTIONS
// ==========================================

/**
 * @brief Determines whether a given year is a leap year in the Gregorian calendar.
 *
 * Rules:
 *  1. Divisible by 4 -> Leap Year
 *  2. Divisible by 100 -> NOT a Leap Year (unless also divisible by 400)
 *  3. Divisible by 400 -> Leap Year
 */
bool isLeapYear(int year) {
    return (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);
}

/**
 * @brief Returns the total number of days in a given month.
 *
 * @param month 1-indexed month (1 = January, ..., 12 = December).
 * @param year  The calendar year.
 * @return Number of days (28, 29, 30, or 31).
 */
int getDaysInMonth(int month, int year) {
    if (month < 1 || month > 12) return 0;
    if (month == 2 && isLeapYear(year)) {
        return 29;
    }
    return DAYS_IN_MONTHS[month - 1];
}

/**
 * @brief Validates if a date is logically sound in the Gregorian calendar.
 */
bool isValidDate(int day, int month, int year) {
    if (year < 1 || month < 1 || month > 12) return false;
    int maxDays = getDaysInMonth(month, year);
    return (day >= 1 && day <= maxDays);
}

/**
 * @brief Computes the day of the week using Sakamoto's algorithm.
 *
 * @param day   Day of the month (1-31).
 * @param month Month (1-12).
 * @param year  Year (e.g., 2026).
 * @return Weekday index (0 = Sunday, 1 = Monday, ..., 6 = Saturday).
 */
int getDayOfWeek(int day, int month, int year) {
    static const int monthOffsets[] = { 0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4 };
    if (month < 3) {
        year -= 1;
    }
    int dow = (year + year / 4 - year / 100 + year / 400 + monthOffsets[month - 1] + day) % 7;
    return (dow + 7) % 7;
}

/**
 * @brief Returns the total number of days elapsed from 0001-01-01 up to the start of year y.
 */
long long daysBeforeYear(long long y) {
    long long prev = y - 1;
    return prev * 365 + prev / 4 - prev / 100 + prev / 400;
}

/**
 * @brief Converts a Gregorian calendar date to an absolute day count since 0001-01-01 (Rata Die).
 */
long long dateToAbsoluteDays(int day, int month, int year) {
    long long totalDays = daysBeforeYear(year);
    for (int m = 1; m < month; ++m) {
        totalDays += getDaysInMonth(m, year);
    }
    totalDays += day;
    return totalDays;
}

/**
 * @brief Converts an absolute day count back to a Gregorian Date struct.
 */
Date absoluteDaysToDate(long long days) {
    long long low = 1, high = 1000000;
    long long year = 1;
    while (low <= high) {
        long long mid = low + (high - low) / 2;
        if (daysBeforeYear(mid) < days) {
            year = mid;
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }

    long long rem = days - daysBeforeYear(year);
    int month = 1;
    for (int m = 1; m <= 12; ++m) {
        int dim = getDaysInMonth(m, static_cast<int>(year));
        if (rem <= dim) {
            month = m;
            break;
        }
        rem -= dim;
    }
    int day = static_cast<int>(rem);
    return { day, month, static_cast<int>(year) };
}

/**
 * @brief Computes absolute day difference between two dates.
 */
long long getDaysDifference(Date d1, Date d2) {
    long long a1 = dateToAbsoluteDays(d1.day, d1.month, d1.year);
    long long a2 = dateToAbsoluteDays(d2.day, d2.month, d2.year);
    return std::abs(a2 - a1);
}

/**
 * @brief Adds or subtracts days to a given date.
 */
Date addDays(Date d, long long offset) {
    long long absDays = dateToAbsoluteDays(d.day, d.month, d.year);
    absDays += offset;
    if (absDays < 1) {
        absDays = 1; // Lower bound at 0001-01-01
    }
    return absoluteDaysToDate(absDays);
}

/**
 * @brief Counts business days (Monday-Friday) between two dates inclusive.
 */
long long countBusinessDaysInclusive(Date d1, Date d2) {
    long long abs1 = dateToAbsoluteDays(d1.day, d1.month, d1.year);
    long long abs2 = dateToAbsoluteDays(d2.day, d2.month, d2.year);
    if (abs1 > abs2) {
        swap(d1, d2);
        swap(abs1, abs2);
    }

    long long totalDays = abs2 - abs1 + 1;
    long long fullWeeks = totalDays / 7;
    long long businessDays = fullWeeks * 5;
    long long remainder = totalDays % 7;

    int startDow = getDayOfWeek(d1.day, d1.month, d1.year);
    for (int i = 0; i < remainder; ++i) {
        int dow = (startDow + i) % 7;
        if (dow != 0 && dow != 6) {
            businessDays++;
        }
    }
    return businessDays;
}

/**
 * @brief Calculates human-intuitive breakdown in Years, Months, and Days between two dates.
 */
void calculateDateBreakdown(Date d1, Date d2, int &outYears, int &outMonths, int &outDays) {
    if (dateToAbsoluteDays(d1.day, d1.month, d1.year) > dateToAbsoluteDays(d2.day, d2.month, d2.year)) {
        swap(d1, d2);
    }

    int y1 = d1.year, m1 = d1.month, day1 = d1.day;
    int y2 = d2.year, m2 = d2.month, day2 = d2.day;

    if (day2 < day1) {
        m2 -= 1;
        if (m2 < 1) {
            m2 = 12;
            y2 -= 1;
        }
        day2 += getDaysInMonth(m2, y2);
    }

    if (m2 < m1) {
        m2 += 12;
        y2 -= 1;
    }

    outDays = day2 - day1;
    outMonths = m2 - m1;
    outYears = y2 - y1;
}

/**
 * @brief Returns day of the year (1 to 365/366).
 */
int getDayOfYear(Date d) {
    int days = 0;
    for (int m = 1; m < d.month; ++m) {
        days += getDaysInMonth(m, d.year);
    }
    days += d.day;
    return days;
}

// ==========================================
//           CALENDAR DISPLAY FUNCTIONS
// ==========================================

/**
 * @brief Prints the calendar for a specific month.
 */
void printMonthCalendar(int month, int year) {
    string headerTitle = MONTH_NAMES[month - 1] + " " + to_string(year);
    int totalWidth = 35;
    int padding = (totalWidth - static_cast<int>(headerTitle.length())) / 2;

    cout << "\n" << string(totalWidth, '=') << "\n";
    cout << string(padding > 0 ? padding : 0, ' ') << headerTitle << "\n";
    cout << string(totalWidth, '-') << "\n";

    // Print Weekday headers
    for (int i = 0; i < 7; ++i) {
        cout << setw(5) << WEEKDAYS_SHORT[i];
    }
    cout << "\n";
    cout << string(totalWidth, '-') << "\n";

    int startDay = getDayOfWeek(1, month, year);
    int totalDays = getDaysInMonth(month, year);

    // Padding before the first day
    for (int i = 0; i < startDay; ++i) {
        cout << "     ";
    }

    int currentDow = startDay;
    for (int day = 1; day <= totalDays; ++day) {
        cout << setw(5) << day;
        currentDow++;

        if (currentDow > 6) {
            cout << "\n";
            currentDow = 0;
        }
    }

    if (currentDow != 0) {
        cout << "\n";
    }
    cout << string(totalWidth, '-') << "\n";
}

/**
 * @brief Displays leap year status and day statistics for a given year.
 */
void displayYearSummary(int year) {
    bool leap = isLeapYear(year);
    cout << "\n=========================================\n";
    cout << "           YEAR SUMMARY: " << year << "\n";
    cout << "=========================================\n";
    cout << " * Leap Year : " << (leap ? "Yes (366 days)" : "No (365 days)") << "\n";
    cout << " * February  : " << (leap ? "29 days" : "28 days") << "\n";
    cout << " * Starts on : " << WEEKDAYS[getDayOfWeek(1, 1, year)] << "\n";
    cout << " * Ends on   : " << WEEKDAYS[getDayOfWeek(31, 12, year)] << "\n";
    cout << "=========================================\n";
}

/**
 * @brief Prints full 12-month calendar for a given year.
 */
void printFullYearCalendar(int year) {
    displayYearSummary(year);

    for (int m = 1; m <= 12; ++m) {
        printMonthCalendar(m, year);
    }
    cout << "\n" << string(35, '=') << "\n";
    cout << "       End of Calendar for " << year << "\n";
    cout << string(35, '=') << "\n\n";
}

// ==========================================
//          USER INPUT & MENU HELPERS
// ==========================================

int getValidInt(const string &prompt, int minVal = 1, int maxVal = numeric_limits<int>::max()) {
    int val;
    while (true) {
        cout << prompt;
        if (cin >> val) {
            if (val >= minVal && val <= maxVal) {
                return val;
            } else {
                cout << "  [!] Please enter a value between " << minVal << " and " << maxVal << ".\n";
            }
        } else {
            cout << "  [!] Invalid input! Please enter a valid number.\n";
            cin.clear();
            cin.ignore(numeric_limits<streamsize>::max(), '\n');
        }
    }
}

Date getValidDateInput(const string &promptTitle) {
    cout << "\n--- " << promptTitle << " ---\n";
    int year = getValidInt("  Enter year (1 - 9999): ", 1, 9999);
    int month = getValidInt("  Enter month (1 - 12): ", 1, 12);
    int maxDays = getDaysInMonth(month, year);
    string dayPrompt = "  Enter day (1 - " + to_string(maxDays) + "): ";
    int day = getValidInt(dayPrompt, 1, maxDays);
    return { day, month, year };
}

void printDateFormatted(Date d) {
    cout << setfill('0') << setw(2) << d.day << "-"
         << setw(2) << d.month << "-"
         << setw(4) << d.year << setfill(' ');
}

// ==========================================
//               MAIN MENU
// ==========================================

int main() {
    int choice = -1;

    cout << "=====================================================\n";
    cout << "             CALENDAR & DATE CALCULATOR              \n";
    cout << "=====================================================\n";

    do {
        cout << "\n[MAIN MENU]\n";
        cout << " 1. Display Single Month Calendar\n";
        cout << " 2. Display Full Year Calendar (12 Months)\n";
        cout << " 3. Find Day of the Week for a Date\n";
        cout << " 4. Calculate Days Between Two Dates\n";
        cout << " 5. Add or Subtract Days from a Date\n";
        cout << " 6. Age & Duration Breakdown (Y/M/D)\n";
        cout << " 7. Leap Year & Annual Information\n";
        cout << " 0. Exit Program\n";
        cout << "-----------------------------------------------------\n";

        choice = getValidInt("Select an option (0-7): ", 0, 7);

        switch (choice) {
            case 1: {
                int year = getValidInt("\nEnter year (1 - 9999): ", 1, 9999);
                int month = getValidInt("Enter month (1 - 12): ", 1, 12);
                printMonthCalendar(month, year);
                break;
            }
            case 2: {
                int year = getValidInt("\nEnter year (1 - 9999): ", 1, 9999);
                printFullYearCalendar(year);
                break;
            }
            case 3: {
                Date d = getValidDateInput("Date Lookup");
                int dow = getDayOfWeek(d.day, d.month, d.year);
                int doy = getDayOfYear(d);
                int totalYearDays = isLeapYear(d.year) ? 366 : 365;

                cout << "\n>> Date: ";
                printDateFormatted(d);
                cout << " (" << MONTH_NAMES[d.month - 1] << " " << d.day << ", " << d.year << ")\n";
                cout << ">> Day of the Week : " << WEEKDAYS[dow] << "\n";
                cout << ">> Day of the Year : Day " << doy << " of " << totalYearDays << "\n";
                cout << ">> Days Remaining  : " << (totalYearDays - doy) << " days\n";
                break;
            }
            case 4: {
                Date d1 = getValidDateInput("First Date");
                Date d2 = getValidDateInput("Second Date");

                long long totalDays = getDaysDifference(d1, d2);
                long long businessDays = countBusinessDaysInclusive(d1, d2);
                long long totalInclusive = totalDays + 1;
                long long weekendDays = totalInclusive - businessDays;

                cout << "\n=========================================\n";
                cout << "         DATE DIFFERENCE RESULT          \n";
                cout << "=========================================\n";
                cout << ">> Total Days Difference     : " << totalDays << " days\n";
                cout << ">> Total Days (Inclusive)    : " << totalInclusive << " days\n";
                cout << ">> Working / Business Days   : " << businessDays << " days\n";
                cout << ">> Weekend Days              : " << weekendDays << " days\n";
                cout << ">> Total Weeks               : " << (totalDays / 7) << " weeks and " << (totalDays % 7) << " days\n";
                cout << "=========================================\n";
                break;
            }
            case 5: {
                Date d = getValidDateInput("Base Date");
                cout << "\nEnter number of days to offset (positive to add, negative to subtract):\n";
                int offset = getValidInt("Offset days (-100000 to +100000): ", -100000, 100000);

                Date result = addDays(d, offset);
                cout << "\n>> Base Date     : ";
                printDateFormatted(d);
                cout << " (" << WEEKDAYS[getDayOfWeek(d.day, d.month, d.year)] << ")\n";

                cout << ">> Offset        : " << (offset >= 0 ? "+" : "") << offset << " days\n";

                cout << ">> Result Date   : ";
                printDateFormatted(result);
                cout << " (" << WEEKDAYS[getDayOfWeek(result.day, result.month, result.year)] << ")\n";
                break;
            }
            case 6: {
                Date birth = getValidDateInput("Start Date / Birthdate");
                Date current = getValidDateInput("Target Date / End Date");

                int years, months, days;
                calculateDateBreakdown(birth, current, years, months, days);
                long long totalDays = getDaysDifference(birth, current);

                cout << "\n=========================================\n";
                cout << "        AGE & DURATION BREAKDOWN         \n";
                cout << "=========================================\n";
                cout << ">> Breakdown   : " << years << " years, " << months << " months, " << days << " days\n";
                cout << ">> Total Days  : " << totalDays << " days\n";
                cout << ">> Total Hours : " << (totalDays * 24) << " hours (approx)\n";
                cout << "=========================================\n";
                break;
            }
            case 7: {
                int year = getValidInt("\nEnter year (1 - 9999): ", 1, 9999);
                displayYearSummary(year);
                break;
            }
            case 0: {
                cout << "\nThank you for using the Calendar & Date Calculator! Goodbye!\n";
                break;
            }
        }
    } while (choice != 0);

    return 0;
}
