/**
 * Solar Hijri (Shamsi) <-> Gregorian (Miladi) date conversion utility.
 */

const jm_days = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];

export interface JalaliDate {
  jy: number; // Jalali Year (e.g. 1405)
  jm: number; // Jalali Month (1 to 12)
  jd: number; // Jalali Day (1 to 31)
}

/**
 * Converts a Gregorian date to Jalali.
 */
export function gregorianToJalali(gy: number, gm: number, gd: number): JalaliDate {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let gy2 = (gm > 2) ? (gy + 1) : gy;
  let sys_d = 355666 + (1461 * gy) + Math.floor((1461 * gy) / 4) - Math.floor((gy2 - 1) / 100) + Math.floor((gy2 - 1) / 400) + gd + g_d_m[gm - 1];
  let jy = Math.floor((sys_d - 355666) / 365.24);
  let j_day_no = sys_d - (355666 + Math.floor(jy * 365.24));
  if (j_day_no < 1) {
    jy--;
    j_day_no = sys_d - (355666 + Math.floor(jy * 365.24));
  }
  let jm = 1;
  if (j_day_no > 186) {
    j_day_no -= 186;
    jm = 7 + Math.floor((j_day_no - 1) / 30);
    j_day_no = ((j_day_no - 1) % 30) + 1;
  } else {
    jm = 1 + Math.floor((j_day_no - 1) / 31);
    j_day_no = ((j_day_no - 1) % 31) + 1;
  }
  return { jy: jy + 979, jm, jd: j_day_no };
}

/**
 * Converts a Jalali date back to Gregorian.
 */
export function jalaliToGregorian(jy: number, jm: number, jd: number): Date {
  jy = jy - 979;
  jm = jm - 1;
  jd = jd - 1;

  let j_day_no = jy * 365 + Math.floor(jy / 33) * 8 + Math.floor(((jy % 33) + 3) / 4);
  for (let i = 0; i < jm; ++i) {
    j_day_no += jm_days[i];
  }
  j_day_no += jd;

  let g_day_no = j_day_no + 79;
  let gy = 1600 + 400 * Math.floor(g_day_no / 146097); /* 146097 = 365*400 + 400/4 - 400/100 + 400/400 */
  g_day_no = g_day_no % 146097;

  let leap = 1;
  if (g_day_no >= 36525) { /* 36525 = 365*100 + 100/4 - 100/100 */
    g_day_no--;
    gy += 100 * Math.floor(g_day_no / 36524); /* 36524 = 365*100 + 100/4 - 100/100 - 1 */
    g_day_no = g_day_no % 36524;

    if (g_day_no >= 365) {
      g_day_no++;
    } else {
      leap = 0;
    }
  }

  gy += 4 * Math.floor(g_day_no / 1461); /* 1461 = 365*4 + 4/4 */
  g_day_no = g_day_no % 1461;

  if (g_day_no >= 366) {
    leap = 0;
    g_day_no--;
    gy += Math.floor(g_day_no / 365);
    g_day_no = g_day_no % 365;
  }

  let i = 0;
  const g_days_in_month = [31, 28 + leap, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  for (i = 0; i < 12; i++) {
    if (g_day_no < g_days_in_month[i]) {
      break;
    }
    g_day_no -= g_days_in_month[i];
  }
  return new Date(gy, i, g_day_no + 1);
}

/**
 * Parses a Gregorian date string (e.g. "2026-07-05" or "2026/07/05 14:30") and returns its Jalali representation.
 */
export function parseAndConvertToJalali(dateStr: string): JalaliDate | null {
  if (!dateStr) return null;
  try {
    const cleaned = dateStr.replace(/\//g, "-").trim();
    const d = new Date(cleaned);
    if (isNaN(d.getTime())) {
      // Try parsing manually in case of DD-MM-YYYY or other custom layouts
      const parts = cleaned.split(/[- :]/);
      if (parts.length >= 3) {
        let y = parseInt(parts[0]);
        let m = parseInt(parts[1]);
        let r = parseInt(parts[2]);
        // Simple sanity check for DD-MM-YYYY vs YYYY-MM-DD
        if (y < 31 && r > 1000) {
          const temp = y;
          y = r;
          r = temp;
        }
        if (y > 1000 && m >= 1 && m <= 12 && r >= 1 && r <= 31) {
          return gregorianToJalali(y, m, r);
        }
      }
      return null;
    }
    return gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  } catch (e) {
    return null;
  }
}

/**
 * Helper to format JalaliDate into standard string e.g. "1405/04/14"
 */
export function formatJalali(jd: JalaliDate | null): string {
  if (!jd) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${jd.jy}/${pad(jd.jm)}/${pad(jd.jd)}`;
}

/**
 * Compares two Jalali dates (a < b: -1, a > b: 1, equal: 0)
 */
export function compareJalali(a: JalaliDate, b: JalaliDate): number {
  if (a.jy !== b.jy) return a.jy - b.jy;
  if (a.jm !== b.jm) return a.jm - b.jm;
  return a.jd - b.jd;
}

export const PERS_MONTH_NAMES = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند"
];
