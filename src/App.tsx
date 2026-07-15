/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  Upload, 
  Plus, 
  Trash2, 
  FileText, 
  CheckCircle, 
  Filter, 
  Tag, 
  Code, 
  Copy, 
  RotateCcw, 
  RefreshCw,
  Sparkles, 
  Check, 
  FileSpreadsheet, 
  AlertCircle,
  HelpCircle,
  TrendingUp,
  MessageSquare,
  Folder,
  FolderPlus,
  FolderOpen,
  X,
  Eye,
  EyeOff,
  Layers,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Camera,
  Download,
  Sliders,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toPng } from 'html-to-image';
import { ChatRow, WhitelistWord, WhitelistGroup, WordMetadata, AnalysisResult } from './types';
import WordCloud from './components/WordCloud';
import { 
  parseAndConvertToJalali, 
  formatJalali, 
  compareJalali, 
  PERS_MONTH_NAMES, 
  jalaliToGregorian, 
  gregorianToJalali, 
  JalaliDate 
} from './lib/jalali';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';

// Default CSV Dataset to provide an incredible initial experience
const DEFAULT_CSV_CONTENT = `متن گفتگو,دسته بندی,شناسه تیکت,تاریخ میلادی
سلام، پشتیبانی محترم، کیفیت محصول عالی بود ولی فرآیند تحویل کمی طول کشید.,کیفیت و تحویل,1001,2026-07-01
سلام خسته نباشید، پشتیبانی خیلی سریع و عالی پاسخ داد. ممنون از خدمات خوبتون.,پشتیبانی مشتری,1002,2026-07-02
سلام، چرا مبلغ بازگشتی هنوز به حساب من واریز نشده؟ دو روزه منتظرم و پیگیری می‌کنم.,مالی,1003,2026-07-03
سلام، من برای معامله بیت کوین و خرید تتر از نوبیتکس و والکس استفاده می‌کنم ولی بیت پین هم خوبه.,ارزهای دیجیتال,1004,2026-07-04
اپلیکیشن شما سرعتش خیلی پایینه، لطفا کیفیت فنی اپ رو ارتقا بدید.,فنی,1005,2026-07-05
بسته‌بندی کالا خراب بود و کالا آسیب دیده بود. فرآیند مرجوعی چطوریاست؟,مرجوعی کالا,1006,2026-07-06
تخفیف‌های شما عالی هستند، خریدهای زیادی انجام دادم و کاملا راضی‌ام.,فروش,1007,2026-07-07
پشتیبانی تلفنی خیلی دیر پاسخ میده ولی پشتیبانی آنلاین و پیگیری سریع شما عالیه.,پشتیبانی مشتری,1008,2026-07-08
تتر و تون کوین سرعت انتقال خیلی بالایی دارند و کارمزدشون توی صرافی کوکوین کمتره.,ارزهای دیجیتال,1009,2026-07-09
امکان پیگیری سفارشات در سایت خیلی دقیق و مفیده و به سرعت کار ما کمک می‌کنه.,فنی,1010,2026-07-10
یک تیکت نمونه اضافی برای روز یازدهم جهت تست ترند تاریخ.,تست,1011,2026-07-11
یک تیکت نمونه اضافی برای روز دوازدهم جهت تست ترند تاریخ.,تست,1012,2026-07-12`;

const DEFAULT_WHITELIST_GROUPS: WhitelistGroup[] = [
  {
    id: 'g1',
    name: 'مسائل عمومی و پشتیبانی',
    isActive: true,
    color: 'indigo',
    createdAt: Date.now() - 300000,
    words: [
      { id: 'w1_1', word: 'پشتیبانی', createdAt: Date.now() - 800000 },
      { id: 'w1_2', word: 'کیفیت', createdAt: Date.now() - 700000 },
      { id: 'w1_3', word: 'تحویل', createdAt: Date.now() - 600000 },
      { id: 'w1_4', word: 'سرعت', createdAt: Date.now() - 500000 },
      { id: 'w1_5', word: 'مبلغ', createdAt: Date.now() - 400000 },
      { id: 'w1_6', word: 'تخفیف', createdAt: Date.now() - 300000 },
      { id: 'w1_7', word: 'مرجوعی', createdAt: Date.now() - 200000 },
      { id: 'w1_8', word: 'پیگیری', createdAt: Date.now() - 100000 },
    ]
  },
  {
    id: 'g2',
    name: 'لیست ارزها',
    isActive: true,
    color: 'emerald',
    createdAt: Date.now() - 200000,
    words: [
      { id: 'w2_1', word: 'تتر', createdAt: Date.now() - 150000 },
      { id: 'w2_2', word: 'بیت کوین', createdAt: Date.now() - 140000 },
      { id: 'w2_3', word: 'تون', createdAt: Date.now() - 130000 },
      { id: 'w2_4', word: 'اتریوم', createdAt: Date.now() - 120000 },
    ]
  },
  {
    id: 'g3',
    name: 'لیست صرافی‌ها',
    isActive: true,
    color: 'amber',
    createdAt: Date.now() - 100000,
    words: [
      { id: 'w3_1', word: 'کوکوین', createdAt: Date.now() - 90000 },
      { id: 'w3_2', word: 'بیت پین', createdAt: Date.now() - 80000 },
      { id: 'w3_3', word: 'نوبیتکس', createdAt: Date.now() - 70000 },
      { id: 'w3_4', word: 'والکس', createdAt: Date.now() - 60000 },
    ]
  }
];

const DEFAULT_WHITELIST = [
  { id: 'w1', word: 'پشتیبانی', createdAt: Date.now() - 800000 },
  { id: 'w2', word: 'کیفیت', createdAt: Date.now() - 700000 },
  { id: 'w3', word: 'تحویل', createdAt: Date.now() - 600000 },
  { id: 'w4', word: 'سرعت', createdAt: Date.now() - 500000 },
  { id: 'w5', word: 'مبلغ', createdAt: Date.now() - 400000 },
  { id: 'w6', word: 'تخفیف', createdAt: Date.now() - 300000 },
  { id: 'w7', word: 'مرجوعی', createdAt: Date.now() - 200000 },
  { id: 'w8', word: 'پیگیری', createdAt: Date.now() - 100000 },
];

const DEFAULT_STOP_WORDS = [
  'و', 'در', 'به', 'از', 'که', 'این', 'با', 'برای', 'هم', 'تا', 'رو', 'را', 'یک', 'است', 'هست', 
  'شد', 'بود', 'کند', 'دارد', 'کرد', 'میکند', 'شده', 'های', 'ام', 'ای', 'کی', 'چه', 'آیا', 'من', 
  'تو', 'ما', 'شما', 'آنها', 'او', 'کار', 'مورد', 'روی', 'بخش', 'خود', 'دیگر', 'صفحه', 'ممنون', 
  'سلام', 'لطفا', 'تیکت', 'سلام،', 'پشتیبانی', 'مرسی', 'تشکر', 'میکنم', 'کنند', 'باشد', 'باشه', 
  'کردن', 'شدن', 'دارم', 'داری', 'داریم', 'دارید', 'دارند', 'بودم', 'بودی', 'بودیم', 'بودید', 
  'بودند', 'هستم', 'هستی', 'هستیم', 'هستید', 'هستند', 'نیست', 'نیستم', 'نیستی', 'نیستیم', 'نیستید', 
  'نیستند', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه', 'ده', 'خیلی', 'کمی', 'بسیار', 
  'زیاد', 'کم', 'بیشتر', 'کمتر', 'خوب', 'بد', 'عالی', 'افتضاح', 'متوسط', 'بابت', 'توی', 'روی', 'زیر',
  'بین', 'پیش', 'پس', 'بعد', 'قبل', 'درباره', 'مبنی', 'جهت', 'انجام', 'ارائه', 'داشتن', 'خواستن',
  'توانستن', 'آمدن', 'رفتن', 'دادن', 'گرفتن', 'زدن', 'دیدن', 'گفتن', 'شنیدن', 'نوشتن', 'خواندن',
  'چون', 'چرا', 'چگونه', 'چطور', 'چیزی', 'چیز', 'کس', 'کسی', 'همه', 'هیچ', 'هر', 'هیچکس', 'هرکس',
  'کجا', 'کدام', 'کدوم', 'الان', 'حالا', 'الآن', 'دیروز', 'امروز', 'فردا', 'شب', 'روز', 'ساعت',
  'یا', 'اما', 'ولی', 'بلکه', 'اگر', 'اگه', 'مگر', 'مگه', 'زیرا', 'چراکه', 'بنابراین', 'لذا',
  'the', 'and', 'to', 'of', 'in', 'is', 'that', 'it', 'for', 'on', 'with', 'as', 'at', 'by', 'an', 'be', 'this', 'are', 'from',
  'یا', 'با', 'تا', 'شما', 'آن', 'آنها', 'وی', 'او', 'ما', 'من', 'تو', 'ایشان', 'جناب', 'آقا', 'خانم',
  'درباره', 'نسبت', 'طبق', 'براساس', 'بر', 'علیه', 'بدون', 'مثل', 'مانند', 'همچون', 'همانند',
  'چند', 'خیلی', 'بسیار', 'کمی', 'اندکی', 'زیادی', 'بیش', 'کم', 'بزرگ', 'کوچک', 'جدید', 'قدیم',
  'سلام', 'احترام', 'پشتیبان', 'خسته', 'نباشید', 'روزتون', 'وقتتون', 'بخیر', 'سلام،', 'ممنون،'
];

// Helper to extract Chat/Ticket ID from row data
const getChatId = (row: ChatRow): string => {
  const keys = Object.keys(row.data);
  const possibleKeys = [
    'شناسه تیکت', 'تیکت', 'شناسه چت', 'شناسه گفتگو', 'چت آی دی', 'چت ایدی', 'چت آی‌دی',
    'ticket_id', 'ticket id', 'chat_id', 'chat id', 'id', 'identifier'
  ];
  
  for (const pk of possibleKeys) {
    const foundKey = keys.find(k => k.toLowerCase().trim() === pk.toLowerCase() || k.toLowerCase().includes(pk.toLowerCase()));
    if (foundKey && row.data[foundKey]) {
      return row.data[foundKey].trim();
    }
  }
  return row.id;
};

// Preset colors for Whitelist Groups
export const COLOR_PRESETS = [
  { id: 'indigo', name: 'نیلی', hex: '#6366f1', bgClass: 'bg-indigo-500', textClass: 'text-indigo-600 dark:text-indigo-400' },
  { id: 'emerald', name: 'زمردی', hex: '#10b981', bgClass: 'bg-emerald-500', textClass: 'text-emerald-600 dark:text-emerald-400' },
  { id: 'amber', name: 'کهربایی', hex: '#f59e0b', bgClass: 'bg-amber-500', textClass: 'text-amber-600 dark:text-amber-400' },
  { id: 'rose', name: 'سرخ', hex: '#f43f5e', bgClass: 'bg-rose-500', textClass: 'text-rose-600 dark:text-rose-400' },
  { id: 'violet', name: 'بنفش', hex: '#8b5cf6', bgClass: 'bg-violet-500', textClass: 'text-violet-600 dark:text-violet-400' },
  { id: 'cyan', name: 'فیروزه‌ای', hex: '#06b6d4', bgClass: 'bg-cyan-500', textClass: 'text-cyan-600 dark:text-cyan-400' },
];

export const injectCustomColorStyle = (hex: string) => {
  if (!hex || !hex.startsWith('#')) return;
  const cleanHex = hex.replace('#', '');
  const styleId = `custom-color-style-${cleanHex}`;
  if (document.getElementById(styleId)) return;

  const styleTag = document.createElement('style');
  styleTag.id = styleId;
  styleTag.innerHTML = `
    .bg-${cleanHex} { background-color: ${hex} !important; }
    .text-${cleanHex} { color: ${hex} !important; }
    .border-${cleanHex} { border-color: ${hex} !important; }
    .badge-${cleanHex} { background-color: ${hex}15 !important; color: ${hex} !important; border-color: ${hex}30 !important; }
    .activeBg-${cleanHex} { background-color: ${hex}15 !important; border-color: ${hex}40 !important; }
    .hoverBg-${cleanHex}:hover { background-color: ${hex}0a !important; }
    .accentBadge-${cleanHex} { background-color: ${hex}15 !important; color: ${hex} !important; border-color: ${hex}40 !important; }
    .button-${cleanHex} { background-color: ${hex} !important; color: #ffffff !important; }
    .button-${cleanHex}:hover { filter: brightness(1.1) !important; }
    .highlight-${cleanHex} { background-color: ${hex}15 !important; color: ${hex} !important; border-color: ${hex}30 !important; font-weight: 600; padding: 0.125rem 0.375rem; border-radius: 0.375rem; border-width: 1px; transition: all 0.2s; cursor: pointer; }
    .highlight-${cleanHex}:hover { background-color: ${hex}30 !important; }
  `;
  document.head.appendChild(styleTag);
};

export const getGroupColorClasses = (colorId?: string) => {
  const activeColor = colorId || 'indigo';

  if (activeColor.startsWith('#')) {
    injectCustomColorStyle(activeColor);
    const cleanHex = activeColor.replace('#', '');
    return {
      bg: `bg-${cleanHex}`,
      text: `text-${cleanHex}`,
      border: `border-${cleanHex}`,
      badge: `badge-${cleanHex}`,
      activeBg: `activeBg-${cleanHex}`,
      hoverBg: `hoverBg-${cleanHex}`,
      textLight: activeColor,
      textDark: activeColor,
      borderPulse: `focus:border-${cleanHex}`,
      accentBadge: `accentBadge-${cleanHex}`,
      buttonClass: `button-${cleanHex}`,
      highlightSpan: `highlight-${cleanHex}`,
    };
  }

  switch (activeColor) {
    case 'emerald':
      return {
        bg: 'bg-emerald-500',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-500',
        badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        activeBg: 'bg-emerald-500/10 border-emerald-500/30 dark:bg-emerald-500/15',
        hoverBg: 'hover:bg-emerald-500/5',
        textLight: '#059669',
        textDark: '#34d399',
        borderPulse: 'focus:border-emerald-500/50',
        accentBadge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
        buttonClass: 'bg-emerald-600 hover:bg-emerald-500 text-white',
        highlightSpan: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold px-1.5 py-0.5 rounded border border-emerald-500/20 hover:bg-emerald-500/20 transition-all cursor-pointer',
      };
    case 'amber':
      return {
        bg: 'bg-amber-500',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-500',
        badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        activeBg: 'bg-amber-500/10 border-amber-500/30 dark:bg-amber-500/15',
        hoverBg: 'hover:bg-amber-500/5',
        textLight: '#d97706',
        textDark: '#fbbf24',
        borderPulse: 'focus:border-amber-500/50',
        accentBadge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
        buttonClass: 'bg-amber-600 hover:bg-amber-500 text-white',
        highlightSpan: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold px-1.5 py-0.5 rounded border border-amber-500/20 hover:bg-amber-500/20 transition-all cursor-pointer',
      };
    case 'rose':
      return {
        bg: 'bg-rose-500',
        text: 'text-rose-600 dark:text-rose-400',
        border: 'border-rose-500',
        badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        activeBg: 'bg-rose-500/10 border-rose-500/30 dark:bg-rose-500/15',
        hoverBg: 'hover:bg-rose-500/5',
        textLight: '#e11d48',
        textDark: '#f43f5e',
        borderPulse: 'focus:border-rose-500/50',
        accentBadge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25',
        buttonClass: 'bg-rose-600 hover:bg-rose-500 text-white',
        highlightSpan: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold px-1.5 py-0.5 rounded border border-rose-500/20 hover:bg-rose-500/20 transition-all cursor-pointer',
      };
    case 'violet':
      return {
        bg: 'bg-violet-500',
        text: 'text-violet-600 dark:text-violet-400',
        border: 'border-violet-500',
        badge: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
        activeBg: 'bg-violet-500/10 border-violet-500/30 dark:bg-violet-500/15',
        hoverBg: 'hover:bg-violet-500/5',
        textLight: '#7c3aed',
        textDark: '#a78bfa',
        borderPulse: 'focus:border-violet-500/50',
        accentBadge: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/25',
        buttonClass: 'bg-violet-600 hover:bg-violet-500 text-white',
        highlightSpan: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 font-semibold px-1.5 py-0.5 rounded border border-violet-500/20 hover:bg-violet-500/20 transition-all cursor-pointer',
      };
    case 'cyan':
      return {
        bg: 'bg-cyan-500',
        text: 'text-cyan-600 dark:text-cyan-400',
        border: 'border-cyan-500',
        badge: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
        activeBg: 'bg-cyan-500/10 border-cyan-500/30 dark:bg-cyan-500/15',
        hoverBg: 'hover:bg-cyan-500/5',
        textLight: '#0891b2',
        textDark: '#22d3ee',
        borderPulse: 'focus:border-cyan-500/50',
        accentBadge: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/25',
        buttonClass: 'bg-cyan-600 hover:bg-cyan-500 text-white',
        highlightSpan: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-semibold px-1.5 py-0.5 rounded border border-cyan-500/20 hover:bg-cyan-500/20 transition-all cursor-pointer',
      };
    case 'indigo':
    default:
      return {
        bg: 'bg-indigo-500',
        text: 'text-indigo-600 dark:text-indigo-400',
        border: 'border-indigo-500',
        badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
        activeBg: 'bg-indigo-500/10 border-indigo-500/30 dark:bg-indigo-500/15',
        hoverBg: 'hover:bg-indigo-500/5',
        textLight: '#4f46e5',
        textDark: '#818cf8',
        borderPulse: 'focus:border-indigo-500/50',
        accentBadge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25',
        buttonClass: 'bg-indigo-600 hover:bg-indigo-500 text-white',
        highlightSpan: 'bg-[#0057D9]/10 text-[#0057D9] font-semibold px-1.5 py-0.5 rounded border border-[#0057D9]/20 hover:bg-[#0057D9]/20 transition-all cursor-pointer',
      };
  }
};

const getDaysInMonth = (year: number, month: number) => {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  // Year is leap check for Solar Hijri:
  const leapYears = [1, 5, 9, 13, 17, 22, 26, 30];
  const isLeap = leapYears.includes(year % 33);
  return isLeap ? 30 : 29;
};

export default function App() {
  // State for CSV Data
  const [csvRawText, setCsvRawText] = useState<string>(DEFAULT_CSV_CONTENT);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [chatRows, setChatRows] = useState<ChatRow[]>([]);
  const [selectedTextColumn, setSelectedTextColumn] = useState<string>('');
  
  // Shamsi Date states for filtering
  const [selectedDateColumn, setSelectedDateColumn] = useState<string>('');
  const [isDateFilterEnabled, setIsDateFilterEnabled] = useState<boolean>(false);
  
  // Shamsi Date Picker Range (From 1405/04/01 to 1405/04/12 by default for sample dataset)
  const [shamsiStartYear, setShamsiStartYear] = useState<number>(1405);
  const [shamsiStartMonth, setShamsiStartMonth] = useState<number>(4);
  const [shamsiStartDay, setShamsiStartDay] = useState<number>(1);
  
  const [shamsiEndYear, setShamsiEndYear] = useState<number>(1405);
  const [shamsiEndMonth, setShamsiEndMonth] = useState<number>(4);
  const [shamsiEndDay, setShamsiEndDay] = useState<number>(12);
  
  // UI and Sorting States
  const [isFullTableExpanded, setIsFullTableExpanded] = useState<boolean>(false);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [whitelistWordsSortBy, setWhitelistWordsSortBy] = useState<'alphabetical' | 'frequency' | 'date'>('date');

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // 1. Process all chat rows to parse dates and map to Shamsi
  const processedChatRows = useMemo(() => {
    return chatRows.map(row => {
      let rawDateStr = selectedDateColumn ? row.data[selectedDateColumn] : '';
      let jalaliDate = rawDateStr ? parseAndConvertToJalali(rawDateStr) : null;
      return {
        ...row,
        jalaliDate,
        formattedJalali: jalaliDate ? formatJalali(jalaliDate) : 'نامشخص'
      };
    });
  }, [chatRows, selectedDateColumn]);

  // 2. Filter processed chat rows based on Shamsi date range if enabled
  const activeFilteredChatRows = useMemo(() => {
    if (!isDateFilterEnabled || !selectedDateColumn) {
      return processedChatRows;
    }
    
    const startDateObj = { jy: shamsiStartYear, jm: shamsiStartMonth, jd: shamsiStartDay };
    const endDateObj = { jy: shamsiEndYear, jm: shamsiEndMonth, jd: shamsiEndDay };
    
    return processedChatRows.filter(row => {
      if (!row.jalaliDate) return false;
      const cmpStart = compareJalali(row.jalaliDate, startDateObj);
      const cmpEnd = compareJalali(row.jalaliDate, endDateObj);
      return cmpStart >= 0 && cmpEnd <= 0;
    });
  }, [processedChatRows, isDateFilterEnabled, selectedDateColumn, shamsiStartYear, shamsiStartMonth, shamsiStartDay, shamsiEndYear, shamsiEndMonth, shamsiEndDay]);

  const sortedChatRows = useMemo(() => {
    if (!sortColumn) return activeFilteredChatRows;
    return [...activeFilteredChatRows].sort((a, b) => {
      const valA = (a.data[sortColumn] || '').toString();
      const valB = (b.data[sortColumn] || '').toString();
      
      const numA = Number(valA);
      const numB = Number(valB);
      if (!isNaN(numA) && !isNaN(numB)) {
        return sortDirection === 'asc' ? numA - numB : numB - numA;
      }
      
      return sortDirection === 'asc'
        ? valA.localeCompare(valB, 'fa', { sensitivity: 'base' })
        : valB.localeCompare(valA, 'fa', { sensitivity: 'base' });
    });
  }, [activeFilteredChatRows, sortColumn, sortDirection]);
  
  // Theme support
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('cx_theme');
    return saved ? saved === 'dark' : false;
  });

  // Dockable Management Sidebar collapsed/expanded state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('cx_theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#020617';
      document.body.style.color = '#e2e8f0';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#f8fafc';
      document.body.style.color = '#0f172a';
    }
  }, [isDarkMode]);

  // State for Whitelist Groups (multi-list support)
  const [whitelistGroups, setWhitelistGroups] = useState<WhitelistGroup[]>(() => {
    const saved = localStorage.getItem('cx_whitelist_groups');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error reading saved groups:", e);
      }
    }
    return DEFAULT_WHITELIST_GROUPS;
  });

  // State for customizable Stop Words
  const [stopWords, setStopWords] = useState<string[]>(() => {
    const saved = localStorage.getItem('cx_stop_words');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error reading saved stop words:", e);
      }
    }
    return DEFAULT_STOP_WORDS;
  });

  const [stopWordsInput, setStopWordsInput] = useState<string>('');
  const [stopWordsSearch, setStopWordsSearch] = useState<string>('');
  const [activeManagementTab, setActiveManagementTab] = useState<'whitelist' | 'stopWords'>('whitelist');
  const [isFilteredChatsExpanded, setIsFilteredChatsExpanded] = useState<boolean>(true);

  // SQLite Database synchronization state
  const [initialLoadComplete, setInitialLoadComplete] = useState<boolean>(false);

  // Load initial data from SQLite backend on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/data');
        if (res.ok) {
          const data = await res.json();
          if (data.whitelistGroups && Array.isArray(data.whitelistGroups)) {
            setWhitelistGroups(data.whitelistGroups);
            setAppliedWhitelistGroups(data.whitelistGroups);
            if (data.whitelistGroups.length > 0) {
              setSelectedGroupId(data.whitelistGroups[0].id);
              setAppliedSelectedGroupId(data.whitelistGroups[0].id);
            }
          }
          if (data.stopWords && Array.isArray(data.stopWords)) {
            setStopWords(data.stopWords);
            setAppliedStopWords(data.stopWords);
          }
          if (data.theme) {
            setIsDarkMode(data.theme === 'dark');
          }
        }
      } catch (err) {
        console.error("Failed to load initial data from SQLite server:", err);
      } finally {
        setInitialLoadComplete(true);
      }
    };
    fetchData();
  }, []);

  // Sync state to localStorage as a client-side offline fallback
  useEffect(() => {
    localStorage.setItem('cx_stop_words', JSON.stringify(stopWords));
  }, [stopWords]);

  // Save all states automatically to SQLite backend upon any modification
  useEffect(() => {
    if (!initialLoadComplete) return;

    const saveData = async () => {
      try {
        await fetch('/api/save-all', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            whitelistGroups,
            stopWords,
            theme: isDarkMode ? 'dark' : 'light'
          })
        });
      } catch (err) {
        console.error("Failed to save data to SQLite backend:", err);
      }
    };

    // Debounce to prevent flooding the database with keystroke requests
    const timer = setTimeout(saveData, 500);
    return () => clearTimeout(timer);
  }, [whitelistGroups, stopWords, isDarkMode, initialLoadComplete]);

  const stopWordsSet = useMemo(() => {
    return new Set(stopWords.map(w => w.trim().toLowerCase()).filter(Boolean));
  }, [stopWords]);

  const [selectedGroupId, setSelectedGroupId] = useState<string>(() => {
    const saved = localStorage.getItem('cx_whitelist_groups');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          return parsed[0].id;
        }
      } catch (e) {}
    }
    return 'g1';
  });

  // Applied counterparts for high-performance decoupled word cloud rendering
  const [appliedStopWords, setAppliedStopWords] = useState<string[]>(() => stopWords);
  const [appliedWhitelistGroups, setAppliedWhitelistGroups] = useState<WhitelistGroup[]>(() => whitelistGroups);
  const [appliedSelectedGroupId, setAppliedSelectedGroupId] = useState<string>(() => selectedGroupId);

  const appliedStopWordsSet = useMemo(() => {
    return new Set(appliedStopWords.map(w => w.trim().toLowerCase()).filter(Boolean));
  }, [appliedStopWords]);

  const appliedSelectedGroup = useMemo<WhitelistGroup | undefined>(() => {
    return appliedWhitelistGroups.find(g => g.id === appliedSelectedGroupId) || appliedWhitelistGroups[0];
  }, [appliedWhitelistGroups, appliedSelectedGroupId]);

  const appliedChatsMatchingSelectedGroup = useMemo<ChatRow[]>(() => {
    if (!appliedSelectedGroup) return [];
    const groupWords = appliedSelectedGroup.words.map(w => w.word.trim().toLowerCase()).filter(Boolean);
    if (groupWords.length === 0) return [];

    const rawMatches = activeFilteredChatRows.filter(row => {
      const text = (row.text || '').toLowerCase();
      return groupWords.some(word => text.includes(word));
    });

    const seenChatIds = new Set<string>();
    const uniqueMatches: ChatRow[] = [];

    rawMatches.forEach(row => {
      const cid = getChatId(row);
      if (!seenChatIds.has(cid)) {
        seenChatIds.add(cid);
        uniqueMatches.push(row);
      }
    });

    return uniqueMatches;
  }, [activeFilteredChatRows, appliedSelectedGroup]);

  // Track if there are pending modifications not yet rendered in the word cloud
  const hasPendingChanges = useMemo(() => {
    const stopWordsChanged = JSON.stringify(stopWords) !== JSON.stringify(appliedStopWords);
    const groupsChanged = JSON.stringify(whitelistGroups) !== JSON.stringify(appliedWhitelistGroups);
    const selectionChanged = selectedGroupId !== appliedSelectedGroupId;
    return stopWordsChanged || groupsChanged || selectionChanged;
  }, [stopWords, appliedStopWords, whitelistGroups, appliedWhitelistGroups, selectedGroupId, appliedSelectedGroupId]);

  // Describe the unsaved adjustments for the user banner
  const pendingChangesSummary = useMemo(() => {
    const list: string[] = [];
    
    const stopWordsDiffCount = Math.abs(stopWords.length - appliedStopWords.length) + 
      stopWords.filter(w => !appliedStopWords.includes(w)).length;
    if (stopWordsDiffCount > 0) {
      list.push(`کلمات استاپ (${stopWordsDiffCount} تغییر)`);
    }

    const groupsDiff = JSON.stringify(whitelistGroups) !== JSON.stringify(appliedWhitelistGroups);
    if (groupsDiff) {
      list.push(`لیست سفید`);
    }

    if (selectedGroupId !== appliedSelectedGroupId) {
      const currentGroup = whitelistGroups.find(g => g.id === selectedGroupId);
      if (currentGroup) {
        list.push(`تغییر دسته فعال به «${currentGroup.name}»`);
      }
    }

    return list;
  }, [stopWords, appliedStopWords, whitelistGroups, appliedWhitelistGroups, selectedGroupId, appliedSelectedGroupId]);

  // Function to apply configuration state to the active word cloud
  const handleApplyChanges = () => {
    setAppliedStopWords(stopWords);
    setAppliedWhitelistGroups(whitelistGroups);
    setAppliedSelectedGroupId(selectedGroupId);
  };

  const [newWordInput, setNewWordInput] = useState<string>('');
  const [newGroupNameInput, setNewGroupNameInput] = useState<string>('');
  const [newGroupColor, setNewGroupColor] = useState<string>('indigo');

  // State for Bidirectional JSON API sync
  const [isJsonMode, setIsJsonMode] = useState<boolean>(false);
  const [customJsonArray, setCustomJsonArray] = useState<string>('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Interaction States
  const [selectedWordMetadata, setSelectedWordMetadata] = useState<WordMetadata | null>(null);
  const [copiedState, setCopiedState] = useState<string | null>(null);
  const [wordCloudUseAllChats, setWordCloudUseAllChats] = useState<boolean>(false);
  
  // Selection of chats for PNG image export (Max 5)
  const [selectedChatsForImage, setSelectedChatsForImage] = useState<ChatRow[]>([]);
  const [chatSelectionError, setChatSelectionError] = useState<string | null>(null);
  const [isExportingImage, setIsExportingImage] = useState<boolean>(false);
  const [isPreviewImageExpanded, setIsPreviewImageExpanded] = useState<boolean>(false);

  const handleToggleChatForImage = (row: ChatRow) => {
    setSelectedChatsForImage(prev => {
      const exists = prev.some(c => c.id === row.id);
      if (exists) {
        return prev.filter(c => c.id !== row.id);
      }
      if (prev.length >= 5) {
        setChatSelectionError('شما می‌توانید حداکثر ۵ گفتگو را برای خروجی تصویر انتخاب کنید.');
        setTimeout(() => setChatSelectionError(null), 5000);
        return prev;
      }
      return [...prev, row];
    });
  };

  const handleDownloadChatsImage = async () => {
    const element = document.getElementById('chats-export-image');
    if (!element) return;
    
    setIsExportingImage(true);
    try {
      // Short delay for rendering cycle to settle
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const dataUrl = await toPng(element, {
        quality: 0.98,
        pixelRatio: 2, // 2x scale for crystal-clear retina resolution
        backgroundColor: isDarkMode ? '#0b0f19' : '#f8fafc',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          width: '950px',
        }
      });
      
      const link = document.createElement('a');
      link.download = `selected-chats-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error exporting image:', err);
      setChatSelectionError('خطایی در تولید تصویر رخ داد. لطفاً دوباره تلاش کنید.');
      setTimeout(() => setChatSelectionError(null), 5000);
    } finally {
      setIsExportingImage(false);
    }
  };

  // Custom Confirmation Dialog states (bypasses sandboxed iframe allow-modals limits)
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    type: 'group' | 'word' | 'reset';
    groupId: string;
    wordId?: string;
    groupName: string;
    wordText?: string;
  } | null>(null);

  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save Whitelist groups to localStorage on change
  useEffect(() => {
    localStorage.setItem('cx_whitelist_groups', JSON.stringify(whitelistGroups));
  }, [whitelistGroups]);

  // Compute active words dynamically for the analysis engine to utilize
  const whitelist = useMemo<WhitelistWord[]>(() => {
    const list: WhitelistWord[] = [];
    whitelistGroups.forEach(g => {
      if (g.isActive) {
        g.words.forEach(w => {
          if (!list.some(existing => existing.word.toLowerCase() === w.word.toLowerCase())) {
            list.push(w);
          }
        });
      }
    });
    return list;
  }, [whitelistGroups]);

  // Robust CSV Parser (Client-side) with Unicode / BOM support
  const parseCSV = (text: string) => {
    try {
      // Clean up UTF-8 BOM if present in Unicode files (common for Excel exported Persian/Unicode CSVs)
      let cleanText = text;
      if (cleanText && (cleanText.charCodeAt(0) === 0xFEFF || cleanText.startsWith('\uFEFF'))) {
        cleanText = cleanText.substring(1);
      }

      const lines = cleanText.split(/\r?\n/).filter(line => line.trim() !== '');
      if (lines.length === 0) return;

      // Extract headers
      // Handle potential quoted commas in CSV headers
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"' || char === "'") {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim().replace(/^["']|["']$/g, ''));
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim().replace(/^["']|["']$/g, ''));
        return result;
      };

      const headers = parseCSVLine(lines[0]);
      setCsvHeaders(headers);

      // Parse records
      const parsedRows: ChatRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const rowData: Record<string, string> = {};
        
        headers.forEach((header, index) => {
          rowData[header] = values[index] || '';
        });

        parsedRows.push({
          id: `row-${i}`,
          originalIndex: i,
          data: rowData,
          text: '' // to be populated
        });
      }

      // Automatically detect the text/message column
      // We look for common Persian words like "متن", "پیام", "گفتگو", "چت" or English words like "text", "message", "chat", "body"
      const textKeywords = ['متن', 'پیام', 'گفتگو', 'چت', 'شرح', 'توضیحات', 'text', 'message', 'chat', 'feedback', 'body', 'content'];
      let detectedCol = headers[0];

      const foundKeyword = headers.find(header => 
        textKeywords.some(keyword => header.toLowerCase().includes(keyword.toLowerCase()))
      );

      if (foundKeyword) {
        detectedCol = foundKeyword;
      } else {
        // Fallback: Pick the column that has the longest average string length
        let maxAvgLen = 0;
        headers.forEach(header => {
          let totalLen = 0;
          parsedRows.forEach(row => {
            totalLen += (row.data[header] || '').length;
          });
          const avgLen = totalLen / parsedRows.length;
          if (avgLen > maxAvgLen) {
            maxAvgLen = avgLen;
            detectedCol = header;
          }
        });
      }

      setSelectedTextColumn(detectedCol);
      
      // Automatically detect the date column
      const dateKeywords = ['تاریخ', 'زمان', 'date', 'time', 'created', 'at', 'timestamp'];
      let detectedDateCol = '';
      const foundDateCol = headers.find(header => 
        dateKeywords.some(keyword => header.toLowerCase().includes(keyword.toLowerCase()))
      );
      if (foundDateCol) {
        detectedDateCol = foundDateCol;
      } else {
        // Fallback: search if any column values look like a date (e.g. contain dashes/slashes)
        const datePattern = /^[0-9]{4}[-/][0-9]{2}[-/][0-9]{2}/;
        for (const header of headers) {
          const sampleValue = parsedRows[0]?.data[header] || '';
          if (datePattern.test(sampleValue.trim())) {
            detectedDateCol = header;
            break;
          }
        }
      }
      setSelectedDateColumn(detectedDateCol);
      
      // Complete text mapping
      const finalizedRows = parsedRows.map(row => ({
        ...row,
        text: row.data[detectedCol] || ''
      }));

      setChatRows(finalizedRows);
    } catch (error) {
      console.error("Error parsing CSV:", error);
    }
  };

  // Re-run parser whenever csvRawText or selectedTextColumn changes
  useEffect(() => {
    parseCSV(csvRawText);
  }, [csvRawText]);

  // Update rows if selected text column changes manually
  useEffect(() => {
    if (chatRows.length > 0 && selectedTextColumn) {
      setChatRows(prev => prev.map(row => ({
        ...row,
        text: row.data[selectedTextColumn] || ''
      })));
    }
  }, [selectedTextColumn]);

  // Group-based whitelist management handlers
  const handleAddGroup = () => {
    const name = newGroupNameInput.trim();
    if (!name) return;

    const newGroup: WhitelistGroup = {
      id: `g-${Date.now()}`,
      name: name,
      isActive: true,
      color: newGroupColor,
      createdAt: Date.now(),
      words: []
    };

    setWhitelistGroups(prev => [...prev, newGroup]);
    setSelectedGroupId(newGroup.id);
    setNewGroupNameInput('');
    setNewGroupColor('indigo');
  };

  const handleDeleteGroup = (id: string, name: string) => {
    if (whitelistGroups.length <= 1) {
      setAlertMessage("حداقل باید یک لیست سفید فعال وجود داشته باشد تا فرآیند پردازش و فیلترگذاری کلمات به درستی انجام شود.");
      return;
    }
    setDeleteConfirmState({
      type: 'group',
      groupId: id,
      groupName: name
    });
  };

  const handleConfirmDeleteGroup = (id: string) => {
    setWhitelistGroups(prev => {
      const filtered = prev.filter(g => g.id !== id);
      if (selectedGroupId === id && filtered.length > 0) {
        setSelectedGroupId(filtered[0].id);
      }
      return filtered;
    });
    if (selectedWordMetadata) {
      setSelectedWordMetadata(null);
    }
    setDeleteConfirmState(null);
  };

  const handleToggleGroupActive = (id: string) => {
    setWhitelistGroups(prev => prev.map(g => {
      if (g.id === id) {
        return { ...g, isActive: !g.isActive };
      }
      return g;
    }));
    if (selectedWordMetadata) {
      setSelectedWordMetadata(null);
    }
  };

  const handleAddWordToGroup = () => {
    const trimmed = newWordInput.trim();
    if (!trimmed) return;
    if (!selectedGroupId) return;

    const wordsToAdd = trimmed.split(/[,،\s]+/).filter(w => w.trim() !== '');

    setWhitelistGroups(prev => prev.map(g => {
      if (g.id === selectedGroupId) {
        const existingWords = new Set(g.words.map(w => w.word.toLowerCase()));
        const newWords: WhitelistWord[] = [];
        
        wordsToAdd.forEach(word => {
          if (!existingWords.has(word.toLowerCase())) {
            newWords.push({
              id: `w-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              word: word,
              createdAt: Date.now()
            });
            existingWords.add(word.toLowerCase());
          }
        });
        
        return {
          ...g,
          words: [...g.words, ...newWords]
        };
      }
      return g;
    }));

    setNewWordInput('');
  };

  const handleRemoveWordFromGroup = (groupId: string, wordId: string) => {
    const group = whitelistGroups.find(g => g.id === groupId);
    const wordObj = group?.words.find(w => w.id === wordId);
    if (!group || !wordObj) return;

    setDeleteConfirmState({
      type: 'word',
      groupId: groupId,
      wordId: wordId,
      groupName: group.name,
      wordText: wordObj.word
    });
  };

  const handleConfirmRemoveWord = (groupId: string, wordId: string) => {
    setWhitelistGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          words: g.words.filter(w => w.id !== wordId)
        };
      }
      return g;
    }));
    if (selectedWordMetadata) {
      setSelectedWordMetadata(null);
    }
    setDeleteConfirmState(null);
  };

  const handleResetGroups = () => {
    setDeleteConfirmState({
      type: 'reset',
      groupId: '',
      groupName: ''
    });
  };

  const handleConfirmReset = () => {
    setWhitelistGroups(DEFAULT_WHITELIST_GROUPS);
    setSelectedGroupId('g1');
    setSelectedWordMetadata(null);
    setDeleteConfirmState(null);
  };

  // Get currently selected whitelist group
  const selectedGroup = useMemo<WhitelistGroup | undefined>(() => {
    return whitelistGroups.find(g => g.id === selectedGroupId) || whitelistGroups[0];
  }, [whitelistGroups, selectedGroupId]);

  // Find chats containing at least one word from the selected whitelist group
  const chatsMatchingSelectedGroup = useMemo<ChatRow[]>(() => {
    if (!selectedGroup) return [];
    const groupWords = selectedGroup.words.map(w => w.word.trim().toLowerCase()).filter(Boolean);
    if (groupWords.length === 0) return [];

    const rawMatches = activeFilteredChatRows.filter(row => {
      const text = (row.text || '').toLowerCase();
      return groupWords.some(word => text.includes(word));
    });

    // Deduplicate by Chat ID to prevent displaying duplicate chat cards
    const seenChatIds = new Set<string>();
    const uniqueMatches: ChatRow[] = [];

    rawMatches.forEach(row => {
      const cid = getChatId(row);
      if (!seenChatIds.has(cid)) {
        seenChatIds.add(cid);
        uniqueMatches.push(row);
      }
    });

    return uniqueMatches;
  }, [activeFilteredChatRows, selectedGroup]);

  // Legacy PERSIAN_STOP_WORDS removed to use customizable stopWordsSet state instead.

  // Core CX Analysis Engine
  const analysisResult = useMemo<AnalysisResult>(() => {
    const wordFrequencies: Record<string, number> = {};
    const wordDetails: Record<string, WordMetadata> = {};
    let matchedChatsCount = chatsMatchingSelectedGroup.length;

    const groupWords = selectedGroup ? selectedGroup.words : [];

    // Initialize counts for each whitelist word
    groupWords.forEach(item => {
      const cleanWord = item.word.trim();
      if (cleanWord) {
        wordFrequencies[cleanWord] = 0;
        wordDetails[cleanWord] = {
          text: cleanWord,
          value: 0,
          percentage: 0,
          chatIndices: []
        };
      }
    });

    // Match keywords in chats
    activeFilteredChatRows.forEach(row => {
      const chatText = row.text || '';

      groupWords.forEach(item => {
        const cleanWord = item.word.trim();
        if (!cleanWord) return;

        // Perform substring check
        const escapedWord = cleanWord.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(escapedWord, 'gi');
        const occurrences = (chatText.match(regex) || []).length;

        if (occurrences > 0) {
          wordFrequencies[cleanWord] += occurrences;
          wordDetails[cleanWord].value += occurrences;
          wordDetails[cleanWord].chatIndices.push(row.id);
        }
      });
    });

    // Calculate total count of Whitelist matches to get percentage weight
    const totalWhitelistOccurrences = Object.values(wordFrequencies).reduce((sum, val) => sum + val, 0);

    // Compute percentages
    Object.keys(wordDetails).forEach(key => {
      const detail = wordDetails[key];
      detail.percentage = totalWhitelistOccurrences > 0 
        ? Math.round((detail.value / totalWhitelistOccurrences) * 100)
        : 0;
    });

    return {
      totalChats: activeFilteredChatRows.length,
      matchedChatsCount,
      wordFrequencies,
      wordDetails
    };
  }, [activeFilteredChatRows, selectedGroup, chatsMatchingSelectedGroup]);

  // Synchronize JSON mode
  // Generates the word cloud from ALL words in the chats related to the selected whitelist group (or ALL chats if toggled), excluding stop words
  const wordCloudDataArray = useMemo<WordMetadata[]>(() => {
    const targetChats = wordCloudUseAllChats ? activeFilteredChatRows : appliedChatsMatchingSelectedGroup;
    if (targetChats.length === 0) {
      return [];
    }

    const freqMap: Record<string, { value: number; chatIndices: string[] }> = {};

    targetChats.forEach(row => {
      const text = row.text || '';
      
      // Keep only Persian letters, English letters, and numbers. Replace all others with space.
      const cleanText = text.replace(/[^\u0600-\u06FF\uFB8A\u067E\u0686\u06AF\u200C\u200D\w\s]/g, ' ');
      const rawWords = cleanText.split(/\s+/);
      
      rawWords.forEach(rawWord => {
        let word = rawWord.trim();
        word = word.replace(/[\u060C\u061F]/g, ''); // strip remaining Persian punctuation
        
        if (word.length >= 2) {
          const lowerWord = word.toLowerCase();
          
          if (wordCloudUseAllChats) {
            // When calculating based on all chats (and ignoring whitelist), ONLY filter out stop words.
            if (!appliedStopWordsSet.has(lowerWord)) {
              if (!freqMap[word]) {
                freqMap[word] = { value: 0, chatIndices: [] };
              }
              freqMap[word].value += 1;
              if (!freqMap[word].chatIndices.includes(row.id)) {
                freqMap[word].chatIndices.push(row.id);
              }
            }
          } else {
            // Standard mode: check if word matches a whitelist group or is not in stop words
            const matchedGroup = whitelistGroups.find(g =>
              g.words.some(w => w.word.trim().toLowerCase() === lowerWord)
            );
            
            if (matchedGroup || !appliedStopWordsSet.has(lowerWord)) {
              if (!freqMap[word]) {
                freqMap[word] = { value: 0, chatIndices: [] };
              }
              freqMap[word].value += 1;
              if (!freqMap[word].chatIndices.includes(row.id)) {
                freqMap[word].chatIndices.push(row.id);
              }
            }
          }
        }
      });
    });

    // Transform freqMap into WordMetadata objects
    const candidates = Object.entries(freqMap).map(([text, data]) => {
      const lowerCand = text.toLowerCase();
      // If we are in "use all chats" mode, do not assign any whitelist group style
      const matchedGroup = wordCloudUseAllChats
        ? null
        : whitelistGroups.find(g =>
            g.words.some(w => w.word.trim().toLowerCase() === lowerCand)
          );
      return {
        text,
        value: data.value,
        percentage: 0,
        chatIndices: data.chatIndices,
        groupName: matchedGroup?.name,
        groupColor: matchedGroup?.color
      };
    });

    // Sort by frequency descending and limit to top 50
    const sortedCandidates = candidates
      .sort((a, b) => b.value - a.value)
      .slice(0, 50);

    const totalOccurrences = sortedCandidates.reduce((sum, item) => sum + item.value, 0);

    sortedCandidates.forEach(item => {
      item.percentage = totalOccurrences > 0
        ? Math.round((item.value / totalOccurrences) * 100)
        : 0;
    });

    return sortedCandidates;
  }, [appliedChatsMatchingSelectedGroup, activeFilteredChatRows, wordCloudUseAllChats, appliedStopWordsSet, whitelistGroups]);

  // Synchronize the textarea when analysis values change so JSON mode has latest
  useEffect(() => {
    if (!isJsonMode) {
      setCustomJsonArray(JSON.stringify(wordCloudDataArray, null, 2));
    }
  }, [wordCloudDataArray, isJsonMode]);

  // Keep selectedChatsForImage in sync with active cloud chats
  useEffect(() => {
    const activeChats = wordCloudUseAllChats ? activeFilteredChatRows : appliedChatsMatchingSelectedGroup;
    setSelectedChatsForImage(prev => prev.filter(c => activeChats.some(m => m.id === c.id)));
  }, [appliedChatsMatchingSelectedGroup, activeFilteredChatRows, wordCloudUseAllChats]);

  // Handle parsing of user-edited JSON array
  const handleJsonInputChange = (val: string) => {
    setCustomJsonArray(val);
    try {
      const parsed = JSON.parse(val);
      if (!Array.isArray(parsed)) {
        setJsonError("فرمت اشتباه: ورودی باید یک آرایه JSON از اشیاء شامل text و value باشد.");
        return;
      }
      
      // Validate schema
      const isValid = (parsed as any[]).every((item: any) => 
        typeof item === 'object' && 
        item !== null && 
        'text' in item && 
        'value' in item
      );

      if (!isValid) {
        setJsonError("فرمت اشتباه: اشیاء آرایه باید حتما دارای کلیدهای 'text' و 'value' باشند.");
        return;
      }

      setJsonError(null);
    } catch (e: any) {
      setJsonError(`خطای نحوی JSON: ${e.message}`);
    }
  };

  // Compute final cloud dataset based on active mode
  const activeCloudWords = useMemo<WordMetadata[]>(() => {
    if (isJsonMode) {
      try {
        const parsed = JSON.parse(customJsonArray);
        if (Array.isArray(parsed)) {
          return (parsed as any[]).map((item: any) => {
            const textVal = String(item.text);
            const lowerCand = textVal.toLowerCase();
            const matchedGroup = whitelistGroups.find(g =>
              g.words.some(w => w.word.trim().toLowerCase() === lowerCand)
            );
            return {
              text: textVal,
              value: Number(item.value),
              percentage: Number(item.percentage || 0),
              chatIndices: Array.isArray(item.chatIndices) ? item.chatIndices.map(String) : [],
              groupName: item.groupName || matchedGroup?.name,
              groupColor: item.groupColor || matchedGroup?.color
            };
          });
        }
      } catch (e) {
        // fallback to standard
      }
    }
    return wordCloudDataArray;
  }, [isJsonMode, customJsonArray, wordCloudDataArray, whitelistGroups]);

  // Extract and deduplicate Chat IDs for the currently selected word
  const selectedWordUniqueChatIds = useMemo(() => {
    if (!selectedWordMetadata) return [];
    
    // Find all rows that match the chatIndices of the selected word
    const matchingRows = activeFilteredChatRows.filter(row => selectedWordMetadata.chatIndices.includes(row.id));
    
    // Extract real Chat IDs and deduplicate them
    const chatIds = matchingRows.map(row => getChatId(row));
    const uniqueSet = new Set<string>(chatIds);
    return Array.from(uniqueSet).filter((id: string) => id && id.trim().length > 0);
  }, [selectedWordMetadata, activeFilteredChatRows]);

  // Filtered chats lists
  const matchedChatsList = useMemo(() => {
    return wordCloudUseAllChats ? activeFilteredChatRows : appliedChatsMatchingSelectedGroup;
  }, [appliedChatsMatchingSelectedGroup, activeFilteredChatRows, wordCloudUseAllChats]);

  // Helper to highlight words in chat text
  const highlightMatchedWords = (text: string) => {
    if (!text) return '';
    let highlighted = text;
    
    // Use selected group words to highlight (or only the clicked word if using all chats)
    const groupWords = wordCloudUseAllChats
      ? (selectedWordMetadata ? [selectedWordMetadata.text] : [])
      : (appliedSelectedGroup ? appliedSelectedGroup.words.map(w => w.word.trim()) : []);
    
    // Also highlight the currently clicked word from the word cloud if any
    if (!wordCloudUseAllChats && selectedWordMetadata && !groupWords.some(w => w.toLowerCase() === selectedWordMetadata.text.toLowerCase())) {
      groupWords.push(selectedWordMetadata.text);
    }

    // Sort by length descending to avoid nested replacement issues
    const sortedWords = [...groupWords]
      .filter(w => w.length > 0)
      .sort((a, b) => b.length - a.length);

    if (sortedWords.length === 0) {
      return <div className="leading-relaxed text-sm" style={{ direction: 'rtl', textAlign: 'right' }}>{text}</div>;
    }

    const cl = getGroupColorClasses(appliedSelectedGroup?.color || 'indigo');

    // Build a unified regex to replace matches safely
    // To avoid HTML corruption during consecutive replacements, we tokenise first
    const tokens: { id: string; original: string; replacement: string }[] = [];
    
    sortedWords.forEach((word, index) => {
      const escapedWord = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`(${escapedWord})`, 'gi');
      
      highlighted = highlighted.replace(regex, (match) => {
        const tokenId = `___MATCH_TOKEN_${index}_${Math.random().toString(36).substr(2, 5)}___`;
        
        // Highlight word cloud selection with a special outline if matches, otherwise use group classes
        const isClickedWord = selectedWordMetadata && match.toLowerCase() === selectedWordMetadata.text.toLowerCase();
        const baseClass = isClickedWord 
          ? `${cl.highlightSpan} ring-2 ring-indigo-500/50 dark:ring-indigo-400/50 scale-105` 
          : cl.highlightSpan;

        tokens.push({
          id: tokenId,
          original: match,
          replacement: `<span class="${baseClass}" title="کلمه کلیدی">${match}</span>`
        });
        return tokenId;
      });
    });

    // Re-inject highlighted spans
    tokens.forEach(token => {
      highlighted = highlighted.replace(token.id, token.replacement);
    });

    return <div dangerouslySetInnerHTML={{ __html: highlighted }} className="leading-relaxed text-sm text-slate-700 dark:text-slate-300" />;
  };

  // Generate dynamic daily trend data for the selected Shamsi date range
  const trendData = useMemo(() => {
    if (!selectedDateColumn || processedChatRows.length === 0) {
      return [];
    }

    try {
      const startMiladi = jalaliToGregorian(shamsiStartYear, shamsiStartMonth, shamsiStartDay);
      const endMiladi = jalaliToGregorian(shamsiEndYear, shamsiEndMonth, shamsiEndDay);

      const daysList: { jalaliStr: string; label: string; count: number }[] = [];

      // Generate sequence of days (limiting to max 100 days to prevent infinite loops)
      let currentMiladi = new Date(startMiladi);
      let safetyCounter = 0;
      
      while (currentMiladi <= endMiladi && safetyCounter < 100) {
        const jd = gregorianToJalali(currentMiladi.getFullYear(), currentMiladi.getMonth() + 1, currentMiladi.getDate());
        const jalaliStr = formatJalali(jd);
        const label = `${PERS_MONTH_NAMES[jd.jm - 1]} ${jd.jd}`;
        daysList.push({ jalaliStr, label, count: 0 });
        
        // Increment day
        currentMiladi.setDate(currentMiladi.getDate() + 1);
        safetyCounter++;
      }

      if (daysList.length === 0) {
        return [];
      }

      // Count chats for each day in our range
      processedChatRows.forEach(row => {
        if (row.jalaliDate) {
          const rowJalaliStr = formatJalali(row.jalaliDate);
          const dayNode = daysList.find(d => d.jalaliStr === rowJalaliStr);
          if (dayNode) {
            dayNode.count += 1;
          }
        }
      });

      return daysList;
    } catch (e) {
      console.error("Error generating trendData:", e);
      return [];
    }
  }, [processedChatRows, selectedDateColumn, shamsiStartYear, shamsiStartMonth, shamsiStartDay, shamsiEndYear, shamsiEndMonth, shamsiEndDay]);

  // Drag and drop handlers for CSV upload
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === "text/csv" || file.name.endsWith('.csv')) {
        handleFileRead(file);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileRead(files[0]);
    }
  };

  const handleFileRead = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target && typeof event.target.result === 'string') {
        setCsvRawText(event.target.result);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const triggerCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedState(label);
    setTimeout(() => setCopiedState(null), 2000);
  };

  const handleWordSelect = useCallback((word: WordMetadata) => {
    setSelectedWordMetadata(word);
  }, []);

  const handleDirectAddWordToStopWords = useCallback((wordText: string) => {
    setStopWords(prev => {
      const lower = wordText.toLowerCase();
      if (prev.includes(lower)) return prev;
      return [...prev, lower];
    });
    setSelectedWordMetadata(prev => {
      if (prev && prev.text.toLowerCase() === wordText.toLowerCase()) {
        return null;
      }
      return prev;
    });
  }, []);

  const handleDirectAddWordToWhitelist = useCallback((wordText: string, groupId: string) => {
    if (!groupId) return;
    setWhitelistGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        const existingWords = new Set(g.words.map(w => w.word.toLowerCase()));
        if (!existingWords.has(wordText.toLowerCase())) {
          return {
            ...g,
            words: [
              ...g.words,
              {
                id: `w-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                word: wordText,
                createdAt: Date.now()
              }
            ]
          };
        }
      }
      return g;
    }));
  }, []);

  return (
    <div className={`min-h-screen pb-16 flex flex-col font-sans select-text transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* GORGEOUS TOP NAVIGATION HEADER */}
      <header className={`border-b sticky top-0 z-50 backdrop-blur-md shadow-xs transition-colors duration-300 ${isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#0057D9] rounded-sm rotate-45 flex items-center justify-center shrink-0 shadow-lg shadow-[#0057D9]/25">
              <div className="w-4 h-4 border-2 border-white -rotate-45"></div>
            </div>
            <div>
              <h1 className={`text-base md:text-lg font-bold tracking-tight flex items-center gap-2 ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                تحلیلگر محاسباتی  ابرکلمات تجربه مشتری (CX)
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Sidebar Toggle Button in Header */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={`p-2 rounded-lg border transition-all duration-300 cursor-pointer hidden md:flex items-center gap-1.5 ${
                !isSidebarCollapsed 
                  ? 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500 shadow-sm' 
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-900 shadow-xs dark:bg-slate-800 dark:border-slate-700 dark:text-slate-350'
              }`}
              title={isSidebarCollapsed ? 'نمایش سایدبار مدیریت کلمات' : 'پنهان‌سازی سایدبار مدیریت کلمات'}
            >
              <Sliders className="w-4 h-4" />
              <span className="text-xs font-bold">{isSidebarCollapsed ? 'مدیریت کلمات' : 'بستن مدیریت'}</span>
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-lg border transition-all duration-300 cursor-pointer ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700 shadow-sm' 
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-900 shadow-xs'
              }`}
              title={isDarkMode ? 'تغییر به حالت روشن' : 'تغییر به حالت تاریک'}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <div className="hidden sm:flex flex-col items-end text-left">
              <span className={`text-xs font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>کارشناس بهبود تجربه مشتری</span>
              <span className={`text-[9px] uppercase font-mono ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>وضعیت سیستم: آنلاین</span>
            </div>
            <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>

      {/* CORE WORKSPACE CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COMPACT FILE UPLOAD SECTION AT THE TOP */}
        <section className="lg:col-span-12">
          <div className={`rounded-xl border shadow-xs p-4 transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              
              {/* Left Side: Drag & Drop Zone (Small & Sleek) */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex-grow w-full md:w-auto border border-dashed rounded-lg py-2.5 px-4 flex items-center justify-between cursor-pointer transition-all duration-300 gap-3 ${
                  isDragging 
                    ? 'border-[#0057D9] bg-[#0057D9]/10' 
                    : (isDarkMode ? 'border-slate-800 bg-slate-950/40 hover:border-indigo-500 hover:bg-slate-900/40' : 'border-slate-200 hover:border-[#0057D9] hover:bg-slate-50')
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  accept=".csv"
                  className="hidden"
                />
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-[#0057D9] shrink-0 animate-bounce" />
                  <div className="text-right">
                    <h4 className={`text-xs font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>بارگذاری فایل CSV گفتگوها</h4>
                    <p className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>فایل را اینجا رها کنید یا برای انتخاب کلیک کنید</p>
                  </div>
                </div>
                <span className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded border hidden sm:inline ${isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                  تشخیص خودکار ستون گفتگو
                </span>
              </div>

              {/* Right Side: Options and Restore Sample Data */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0 justify-end">
                {csvHeaders.length > 0 && (
                  <div className={`flex items-center gap-2 border px-2.5 py-1.5 rounded-lg ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <span className={`text-[11px] font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>ستون متن گفتگو:</span>
                    <select
                      value={selectedTextColumn}
                      onChange={(e) => setSelectedTextColumn(e.target.value)}
                      className={`text-xs font-bold outline-none cursor-pointer border-none bg-transparent ${isDarkMode ? 'text-indigo-400' : 'text-[#0057D9]'}`}
                    >
                      {csvHeaders.map(header => (
                        <option key={header} value={header} className={isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-800'}>{header}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 
                  کد آماده برای دکمه تحلیل هوشمند چت‌ها با هوش مصنوعی (Gemini API)
                  شما می‌توانید با فعال‌سازی این بخش و فراخوانی متدهای فایل src/lib/gemini.ts، تحلیل خودکار موضوعات پیام‌ها را پیاده‌سازی کنید.
                  
                  <button 
                    onClick={async () => {
                      alert("در حال ارتباط با هوش مصنوعی گوگل برای تحلیل گفتگوها...");
                      // const result = await analyzeChatsWithAI(chatRows);
                      // alert(result);
                    }}
                    className={`font-bold text-xs px-3 py-2 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                      isDarkMode 
                        ? 'bg-indigo-650 hover:bg-indigo-600 text-white border-indigo-500 shadow-sm' 
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-700 shadow-sm'
                    }`}
                    title="تحلیل هوشمند چت‌ها با هوش مصنوعی"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>تحلیل هوشمند چت‌ها (Gemini)</span>
                  </button>
                */}


              </div>

            </div>

            {/* COLLAPSIBLE FULL DATASET TABLE */}
            <div className={`mt-3 pt-3 border-t ${isDarkMode ? 'border-slate-800/60' : 'border-slate-100'}`}>
              <button
                onClick={() => setIsFullTableExpanded(!isFullTableExpanded)}
                className="w-full flex items-center justify-between text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors py-1 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  <span>نمایش کل محتوای فایل چت ({chatRows.length} ردیف داده بارگذاری شده)</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-400 font-normal">
                  <span>{isFullTableExpanded ? 'بستن جدول' : 'مشاهده و مرتب‌سازی جدول'}</span>
                  {isFullTableExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </div>
              </button>

              <AnimatePresence>
                {isFullTableExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden mt-3"
                  >
                    <div className={`overflow-x-auto border rounded-lg max-h-56 overflow-y-auto shadow-inner ${isDarkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50/50 border-slate-200'}`}>
                      {chatRows.length === 0 ? (
                        <div className={`text-center py-8 text-xs ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                          هیچ داده‌ای بارگذاری نشده است. فایلی آپلود کرده یا روی "بارگذاری گفت‌وگوهای نمونه" کلیک کنید.
                        </div>
                      ) : (
                        <table className="w-full text-right border-collapse text-xs">
                          <thead>
                            <tr className={`sticky top-0 font-bold border-b backdrop-blur-md ${isDarkMode ? 'bg-slate-950 text-slate-300 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                              <th className={`p-2.5 w-12 text-center border-l ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>ردیف</th>
                              {csvHeaders.map((header) => {
                                const isSorted = sortColumn === header;
                                return (
                                  <th 
                                    key={header} 
                                    onClick={() => handleSort(header)}
                                    className={`p-2.5 font-semibold border-l last:border-l-0 cursor-pointer select-none hover:bg-indigo-500/10 transition-colors ${isDarkMode ? 'border-slate-800' : 'border-slate-200'} ${header === selectedTextColumn ? (isDarkMode ? 'text-indigo-400 bg-indigo-500/10' : 'text-[#0057D9] bg-indigo-50/40') : ''}`}
                                  >
                                    <div className="flex items-center justify-between gap-1.5">
                                      <span>{header}</span>
                                      <div className="flex items-center gap-0.5 shrink-0">
                                        <ArrowUpDown className={`w-3 h-3 ${isSorted ? 'text-indigo-500' : 'text-slate-400'}`} />
                                        {isSorted && (
                                          <span className="text-[9px] text-indigo-500 font-mono font-bold">
                                            {sortDirection === 'asc' ? '↑' : '↓'}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </th>
                                );
                              })}
                            </tr>
                          </thead>
                          <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800 bg-slate-900/10' : 'divide-slate-100 bg-white'}`}>
                            {sortedChatRows.map((row, idx) => (
                              <tr key={row.id} className={`transition-colors ${isDarkMode ? 'hover:bg-indigo-500/10' : 'hover:bg-indigo-50/20'}`}>
                                <td className={`p-2.5 font-mono text-center border-l ${isDarkMode ? 'text-slate-500 border-slate-800' : 'text-slate-400 border-slate-100'}`}>{idx + 1}</td>
                                {csvHeaders.map((header) => (
                                  <td key={header} className={`p-2.5 font-medium border-l last:border-l-0 ${isDarkMode ? 'text-slate-300 border-slate-800' : 'text-slate-600 border-slate-100'} ${header === selectedTextColumn ? (isDarkMode ? 'font-semibold text-slate-100 bg-indigo-500/10' : 'font-semibold text-slate-800 bg-indigo-50/20') : ''}`}>
                                    {row.data[header]}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </section>


        {/* METRICS & QUICK INSIGHTS BAR */}
        <section className="lg:col-span-12 grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className={`p-4 rounded-xl border shadow-sm flex items-center gap-4 transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}>
            <div className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">کل گفتگوهای بارگذاری شده</p>
              <h3 className={`text-lg font-bold mt-0.5 ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>{analysisResult.totalChats} چت</h3>
            </div>
          </div>

          <div className={`p-4 rounded-xl border shadow-sm flex items-center gap-4 transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}>
            <div className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-colors duration-300 ${isDarkMode ? 'bg-[#0057D9]/10 border-[#0057D9]/25 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                {wordCloudUseAllChats ? 'کل گفتگوهای تحلیل شده' : 'گفتگوهای شامل کلمات کلیدی'}
              </p>
              <h3 className={`text-lg font-bold mt-0.5 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                {wordCloudUseAllChats ? analysisResult.totalChats : analysisResult.matchedChatsCount} چت 
                <span className="text-xs text-slate-400 font-normal mr-1">
                  ({analysisResult.totalChats > 0 ? Math.round(((wordCloudUseAllChats ? analysisResult.totalChats : analysisResult.matchedChatsCount) / analysisResult.totalChats) * 100) : 0}٪)
                </span>
              </h3>
            </div>
          </div>

          <div className={`p-4 rounded-xl border shadow-sm flex items-center gap-4 transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}>
            <div className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">کلمات لیست سفید منتخب</p>
              <h3 className={`text-lg font-bold mt-0.5 ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>{selectedGroup ? selectedGroup.words.length : 0} کلمه</h3>
            </div>
          </div>

          <div className={`p-4 rounded-xl border shadow-sm flex items-center gap-4 transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}>
            <div className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-colors duration-300 ${isDarkMode ? 'bg-[#0057D9]/10 border-[#0057D9]/25 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                {wordCloudUseAllChats ? 'کل تکرار تمامی کلمات کلیدی' : 'کل تکرار کلمات لیست منتخب'}
              </p>
              <h3 className={`text-lg font-bold mt-0.5 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                {wordCloudUseAllChats 
                  ? activeCloudWords.reduce((sum, item) => sum + item.value, 0)
                  : (Object.values(analysisResult.wordFrequencies) as number[]).reduce((sum, val) => sum + val, 0)
                } مرتبه
              </h3>
            </div>
          </div>
        </section>

        {/* LEFT COLUMN: WHITELIST & STOP WORDS UNIFIED MANAGEMENT */}
        <section className={`${isSidebarCollapsed ? 'hidden' : 'lg:col-span-4'} flex flex-col transition-all duration-300`}>
          
          <div className={`rounded-xl border shadow-sm flex flex-col transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}>
            
            {/* Unified Tabs Header & Collapse Button */}
            <div className={`flex border-b items-center justify-between ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="flex flex-1">
                <button
                  onClick={() => setActiveManagementTab('whitelist')}
                  className={`flex-1 py-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeManagementTab === 'whitelist'
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-500/5'
                      : 'border-transparent text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>لیست‌های سفید</span>
                </button>
                <button
                  onClick={() => setActiveManagementTab('stopWords')}
                  className={`flex-1 py-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeManagementTab === 'stopWords'
                      ? 'border-rose-600 text-rose-600 dark:text-rose-400 bg-rose-500/5'
                      : 'border-transparent text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span>کلمات استاپ</span>
                </button>
              </div>

              {/* Collapse Button */}
              <button
                onClick={() => setIsSidebarCollapsed(true)}
                className={`p-3 border-r hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer ${
                  isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-150 text-slate-500'
                }`}
                title="پنهان کردن سایدبار مدیریت"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Container for active tab content */}
            <div className="p-5 flex flex-col">
              {activeManagementTab === 'whitelist' ? (
                <div id="whitelist-panel" className="flex flex-col">
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-dashed dark:border-slate-800 border-slate-100">
                    <h3 className={`text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>لیست‌های سفید (دسته‌بندی شده)</h3>
                  </div>

                  {/* Input Form for New Group */}
                  <div className="flex flex-col gap-2 mb-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newGroupNameInput}
                        onChange={(e) => setNewGroupNameInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddGroup();
                          }
                        }}
                        placeholder="نام لیست جدید (مثلاً: لیست صرافی‌ها)..."
                        className={`flex-grow text-xs px-3 py-2 rounded-lg focus:border-indigo-500 outline-none transition-all font-medium placeholder:text-slate-500 ${isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                      />
                      <button
                        onClick={handleAddGroup}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                        title="ایجاد لیست جدید"
                      >
                        <Plus className="w-4 h-4" />
                        <span>ایجاد</span>
                      </button>
                    </div>
                    {/* Inline Color Selection Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pr-1" style={{ direction: 'rtl' }}>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-bold">رنگ لیست:</span>
                        <div className="flex items-center gap-1.5">
                          {COLOR_PRESETS.map(preset => {
                            const isSelected = newGroupColor === preset.id;
                            return (
                              <button
                                key={preset.id}
                                onClick={() => setNewGroupColor(preset.id)}
                                className={`w-4 h-4 rounded-full ${preset.bgClass} cursor-pointer transition-all hover:scale-115 flex items-center justify-center shrink-0 ${
                                  isSelected ? 'ring-2 ring-offset-1 ring-indigo-500 dark:ring-offset-slate-950 scale-110' : 'opacity-70 hover:opacity-100'
                                }`}
                                title={preset.name}
                              />
                            );
                          })}
                        </div>
                      </div>

                      {/* Custom Color Picker Button */}
                      <div className="flex items-center gap-1.5 border-t sm:border-t-0 sm:border-r pt-1.5 sm:pt-0 sm:pr-2 dark:border-slate-800 border-slate-100 shrink-0">
                        <span className="text-[9px] text-slate-400 font-medium">رنگ سفارشی:</span>
                        <div className="relative flex items-center justify-center w-5 h-5 rounded-md border border-slate-300 dark:border-slate-700 overflow-hidden cursor-pointer shadow-xs transition-transform hover:scale-105 shrink-0">
                          <input
                            type="color"
                            value={newGroupColor.startsWith('#') ? newGroupColor : '#6366f1'}
                            onChange={(e) => setNewGroupColor(e.target.value)}
                            className="absolute inset-0 w-full h-full p-0 border-0 opacity-0 cursor-pointer"
                            title="انتخاب رنگ سفارشی"
                          />
                          <div 
                            className="w-full h-full rounded-md transition-colors"
                            style={{ 
                              backgroundColor: newGroupColor.startsWith('#') ? newGroupColor : '#6366f1',
                              backgroundImage: !newGroupColor.startsWith('#') ? 'linear-gradient(135deg, #6366f1, #10b981, #f59e0b, #f43f5e)' : 'none'
                            }} 
                          />
                        </div>
                        {newGroupColor.startsWith('#') && (
                          <span className="text-[9px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-1 py-0.5 rounded leading-none shrink-0" style={{ direction: 'ltr' }}>
                            {newGroupColor.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Groups Selection List */}
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 mb-4">
                    {whitelistGroups.map((g) => {
                      const isSelected = g.id === selectedGroupId;
                      const cl = getGroupColorClasses(g.color);
                      return (
                        <div
                          key={g.id}
                          onClick={() => setSelectedGroupId(g.id)}
                          className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                            isSelected 
                              ? `${cl.activeBg} ${g.color?.startsWith('#') ? cl.border : (isDarkMode ? `border-${g.color || 'indigo'}-500/40` : `border-${g.color || 'indigo'}-200`)} shadow-xs` 
                              : (isDarkMode ? 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-900/60' : 'bg-white border-slate-200 hover:bg-slate-50')
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={g.isActive}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleToggleGroupActive(g.id);
                              }}
                              className={`rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer`}
                              title="فعال / غیرفعال سازی لیست"
                            />
                            <span className={`font-semibold transition-colors ${g.isActive ? (isSelected ? cl.text : (isDarkMode ? 'text-slate-200' : 'text-slate-800')) : 'text-slate-500 line-through font-normal'}`}>
                              {g.name}
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${isSelected ? cl.badge : (isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700/60' : 'bg-slate-100 text-slate-500 border-slate-200/50')}`}>
                              {g.words.length} کلمه
                            </span>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteGroup(g.id, g.name);
                            }}
                            className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="حذف کامل این لیست"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Current Selected Group Word Management */}
                  {(() => {
                    const currentGroup = whitelistGroups.find(g => g.id === selectedGroupId) || whitelistGroups[0];
                    if (!currentGroup) return null;
                    const cl = getGroupColorClasses(currentGroup.color);

                    // Sort whitelist words based on selected sorting option
                    const sortedCurrentGroupWords = [...currentGroup.words].sort((a, b) => {
                      if (whitelistWordsSortBy === 'alphabetical') {
                        return a.word.localeCompare(b.word, 'fa', { sensitivity: 'base' });
                      } else if (whitelistWordsSortBy === 'frequency') {
                        const freqA = analysisResult.wordFrequencies[a.word] || 0;
                        const freqB = analysisResult.wordFrequencies[b.word] || 0;
                        return freqB - freqA; // highest frequency first
                      } else {
                        // 'date' (default: newest first)
                        return b.createdAt - a.createdAt;
                      }
                    });

                    return (
                      <div className={`border-t pt-3 mt-1 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-xs font-bold flex items-center gap-1 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                            <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
                            مدیریت کلمات لیست «{currentGroup.name}»
                          </span>
                        </div>



                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={newWordInput}
                            onChange={(e) => setNewWordInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleAddWordToGroup();
                              }
                            }}
                            placeholder="کلمه جدید (برای افزودن همزمان با ویرگول جدا کنید)..."
                            className={`flex-grow text-xs px-3 py-2 rounded-lg focus:border-indigo-500 outline-none placeholder:text-slate-500 ${isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                          />
                          <button
                            onClick={handleAddWordToGroup}
                            className={`p-2 rounded-lg transition-colors shrink-0 flex items-center justify-center cursor-pointer ${isDarkMode ? 'bg-slate-850 hover:bg-slate-750 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
                            title="افزودن به این لیست"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Sorting Controls for Whitelist Words */}
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="text-[10px] font-semibold text-slate-400">ترتیب کلمات:</span>
                          <button
                            onClick={() => setWhitelistWordsSortBy('date')}
                            className={`text-[9px] px-2 py-0.5 rounded transition-all cursor-pointer ${
                              whitelistWordsSortBy === 'date'
                                ? 'bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                          >
                            جدیدترین‌ها
                          </button>
                          <button
                            onClick={() => setWhitelistWordsSortBy('alphabetical')}
                            className={`text-[9px] px-2 py-0.5 rounded transition-all cursor-pointer ${
                              whitelistWordsSortBy === 'alphabetical'
                                ? 'bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                          >
                            الفبایی
                          </button>
                          <button
                            onClick={() => setWhitelistWordsSortBy('frequency')}
                            className={`text-[9px] px-2 py-0.5 rounded transition-all cursor-pointer ${
                              whitelistWordsSortBy === 'frequency'
                                ? 'bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                            title="نمایش بر اساس فراوانی تکرار کلمه در چت‌ها"
                          >
                            تعداد تکرار
                          </button>
                        </div>

                        {/* Whitelist Badges Container */}
                        <div className={`flex-grow max-h-[160px] overflow-y-auto pr-1 rounded-lg p-2.5 border ${isDarkMode ? 'bg-slate-950 border-slate-800/80' : 'bg-slate-50 border-slate-200/60'}`}>
                          {sortedCurrentGroupWords.length === 0 ? (
                            <div className={`text-center py-4 text-[11px] font-normal ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                              هیچ کلمه‌ای در این لیست قرار ندارد.
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {sortedCurrentGroupWords.map((wordObj) => {
                                const frequency = analysisResult.wordFrequencies[wordObj.word] || 0;
                                return (
                                  <div
                                    key={wordObj.id}
                                    className={`rounded-lg py-1 px-2.5 flex items-center gap-1.5 shadow-xs text-xs border transition-all hover:scale-102 ${cl.badge}`}
                                  >
                                    <span className="font-semibold">{wordObj.word}</span>
                                    {frequency > 0 && (
                                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border bg-white/40 dark:bg-black/20 ${cl.text}`}>
                                        {frequency}
                                      </span>
                                    )}
                                    <button
                                      onClick={() => handleRemoveWordFromGroup(currentGroup.id, wordObj.id)}
                                      className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                                      title="حذف کلمه از این لیست"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div id="stop-words-panel" className="flex flex-col">
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-dashed dark:border-slate-800 border-slate-100">
                    <h3 className={`text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>مدیریت کلمات استاپ (Stop Words)</h3>
                    <button
                      onClick={() => {
                        if (confirm("آیا مایلید لیست کلمات استاپ را به کلمات پیش‌فرض بازیابی کنید؟ کلمات افزوده شده شما پاک خواهند شد.")) {
                          setStopWords(DEFAULT_STOP_WORDS);
                        }
                      }}
                      className={`text-[9px] flex items-center gap-1 font-bold px-2 py-1 rounded transition-colors cursor-pointer ${
                        isDarkMode 
                          ? 'bg-slate-850 hover:bg-slate-800 text-slate-300 border-slate-800' 
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                      }`}
                      title="بازیابی کلمات پیش‌فرض"
                    >
                      <RotateCcw className="w-3 h-3 text-[#0057D9]" />
                      <span>بازنشانی پیش‌فرض</span>
                    </button>
                  </div>

                  {/* Input to add new stop words */}
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={stopWordsInput}
                      onChange={(e) => setStopWordsInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const trimmed = stopWordsInput.trim();
                          if (trimmed) {
                            const wordsToAdd = trimmed.split(/[,،\s]+/).filter(Boolean);
                            setStopWords(prev => {
                              const next = [...prev];
                              wordsToAdd.forEach(w => {
                                if (!next.includes(w.toLowerCase())) {
                                  next.push(w.toLowerCase());
                                }
                              });
                              return next;
                            });
                            setStopWordsInput('');
                          }
                        }
                      }}
                      placeholder="کلمه استاپ جدید (با ویرگول یا فاصله جدا کنید)..."
                      className={`flex-grow text-xs px-3 py-2 rounded-lg focus:border-rose-500 outline-none border transition-all font-medium placeholder:text-slate-500 ${
                        isDarkMode 
                          ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-rose-500/50' 
                          : 'bg-slate-50 border-slate-200 text-slate-850 focus:border-rose-500/50'
                      }`}
                    />
                    <button
                      onClick={() => {
                        const trimmed = stopWordsInput.trim();
                        if (trimmed) {
                          const wordsToAdd = trimmed.split(/[,،\s]+/).filter(Boolean);
                          setStopWords(prev => {
                            const next = [...prev];
                            wordsToAdd.forEach(w => {
                              if (!next.includes(w.toLowerCase())) {
                                next.push(w.toLowerCase());
                              }
                            });
                            return next;
                          });
                          setStopWordsInput('');
                        }
                      }}
                      className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                      title="افزودن کلمه استاپ"
                    >
                      <Plus className="w-4 h-4" />
                      <span>افزودن</span>
                    </button>
                  </div>

                  {/* Quick search & Filter inside Stop Words panel */}
                  <div className="mb-2 flex items-center gap-1.5">
                    <input
                      type="text"
                      value={stopWordsSearch}
                      onChange={(e) => setStopWordsSearch(e.target.value)}
                      placeholder="جستجو در لیست کلمات استاپ..."
                      className={`w-full text-[11px] px-2.5 py-1.5 rounded-md outline-none border transition-all font-medium placeholder:text-slate-500 ${
                        isDarkMode 
                          ? 'bg-slate-950 border-slate-800 text-slate-300 focus:border-rose-500/50' 
                          : 'bg-slate-50 border-slate-200 text-slate-600 focus:border-rose-500/50'
                      }`}
                    />
                    {stopWordsSearch && (
                      <button 
                        onClick={() => setStopWordsSearch('')}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer text-xs shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Stop Words Badges Container */}
                  <div className={`flex-grow max-h-[160px] overflow-y-auto pr-1 rounded-lg p-2.5 border ${isDarkMode ? 'bg-slate-950 border-slate-800/80' : 'bg-slate-50 border-slate-200/60'}`}>
                    {(() => {
                      const filtered = stopWords.filter(word => 
                        !stopWordsSearch.trim() || word.toLowerCase().includes(stopWordsSearch.toLowerCase().trim())
                      );
                      
                      if (filtered.length === 0) {
                        return (
                          <div className={`text-center py-4 text-[11px] font-normal ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            {stopWordsSearch ? 'کلمه‌ای یافت نشد.' : 'لیست کلمات استاپ خالی است.'}
                          </div>
                        );
                      }

                      return (
                        <div className="flex flex-wrap gap-1.5">
                          {filtered.map((word, idx) => (
                            <div
                              key={`${word}-${idx}`}
                              className={`rounded py-0.5 px-2 flex items-center gap-1.5 border shadow-xs text-xs hover:border-rose-500/40 transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}
                            >
                              <span className="font-medium">{word}</span>
                              <button
                                onClick={() => {
                                  setStopWords(prev => prev.filter(w => w !== word));
                                }}
                                className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                                title="حذف کلمه از لیست استاپ"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>تعداد کل کلمات استاپ: {stopWords.length} کلمه</span>
                  </div>
                </div>
              )}
            </div>

          </div>

        </section>

        {/* CENTER COLUMN: INTERACTIVE WORD CLOUD & SELECTED METADATA */}
        <section className={`${isSidebarCollapsed ? 'lg:col-span-12' : 'lg:col-span-8'} space-y-6 flex flex-col transition-all duration-300`}>
          
          {/* WORD CLOUD VIEWER */}
          <div className={`rounded-xl border shadow-lg p-5 flex flex-col flex-grow transition-colors duration-300 ${isDarkMode ? 'bg-slate-900/40 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}>
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b mb-4 gap-3 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    isSidebarCollapsed
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-md hover:bg-indigo-500'
                      : isDarkMode
                        ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                        : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-150'
                  }`}
                  title={isSidebarCollapsed ? 'نمایش سایدبار مدیریت کلمات' : 'پنهان‌سازی سایدبار مدیریت کلمات'}
                >
                  <Sliders className={`w-3.5 h-3.5 ${isSidebarCollapsed ? 'text-white' : 'text-indigo-500'}`} />
                  <span>{isSidebarCollapsed ? 'نمایش سایدبار مدیریت' : 'بستن سایدبار'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                  <h3 className={`text-xs sm:text-sm font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>ابر کلمات محاسباتی و تعاملی بازخوردهای مشتریان</h3>
                </div>
              </div>
              
              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleApplyChanges}
                  disabled={!hasPendingChanges}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    hasPendingChanges
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  }`}
                  title="اعمال کلمات جدید و بازسازی ابرکلمات"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${hasPendingChanges ? 'animate-spin' : ''}`} />
                  <span>بروزرسانی ابرکلمات</span>
                </button>
                <span className={`text-[11px] sm:text-xs font-semibold hidden sm:inline ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  رندر بر اساس {isJsonMode ? 'آرایه ویرایشی JSON' : 'تحلیل فایل بارگذاری شده'}
                </span>
              </div>
            </div>

            {hasPendingChanges && (
              <div className="mb-4 p-3 rounded-lg border flex flex-col sm:flex-row items-center justify-between gap-3 bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200 animate-pulse">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  <div className="text-xs font-medium" style={{ direction: 'rtl', textAlign: 'right' }}>
                    تغییراتی در <span className="font-bold">{pendingChangesSummary.join(' و ')}</span> ایجاد شده است که هنوز در ابرکلمات رندر نشده‌اند.
                  </div>
                </div>
                <button
                  onClick={handleApplyChanges}
                  className="w-full sm:w-auto bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>اعمال تغییرات و رندر جدید</span>
                </button>
              </div>
            )}

            {/* Real-time / Entire Chats vs List-based Toggle */}
            <div className={`mb-4 px-3 py-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors ${
              isDarkMode ? 'bg-slate-950/30 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-indigo-500">📊</span>
                <span className={`font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  محدوده محاسبه کلمات کلیدی:
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  wordCloudUseAllChats 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                    : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                }`}>
                  {wordCloudUseAllChats ? 'بر اساس کل چت‌ها' : 'بر اساس لیست‌های منتخب'}
                </span>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={wordCloudUseAllChats}
                  onChange={(e) => setWordCloudUseAllChats(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 dark:bg-slate-800 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500/30 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                <span className="mr-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  محاسبه بر اساس کل گفتگوها (بدون فیلتر لیست)
                </span>
              </label>
            </div>

            <WordCloud 
              words={activeCloudWords} 
              onWordClick={handleWordSelect} 
              selectedWord={selectedWordMetadata}
              isDarkMode={isDarkMode}
              whitelistGroups={whitelistGroups}
              selectedGroupId={selectedGroupId}
              onAddToStopWords={handleDirectAddWordToStopWords}
              onAddToWhitelist={handleDirectAddWordToWhitelist}
            />
          </div>

        </section>

        {/* BOTTOM PANEL 2: FILTERED CHATS BASED ON WHITELIST */}
        <section id="filtered-chats-panel" className="lg:col-span-12">
          <div className={`rounded-xl border shadow-sm p-6 transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}>
            
            <div 
              onClick={() => setIsFilteredChatsExpanded(!isFilteredChatsExpanded)}
              className={`flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b gap-4 cursor-pointer select-none hover:opacity-90 transition-opacity ${isFilteredChatsExpanded ? 'mb-6' : 'mb-0'} ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${isDarkMode ? 'bg-[#0057D9]/10 border-[#0057D9]/25 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-[#0057D9]'}`}>
                  <Filter className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-sm font-bold flex items-center gap-2 ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                    <span>{wordCloudUseAllChats ? '۲. کل مکالمات فعال بارگذاری شده جهت تحلیل' : '۲. مکالمات فیلتر شده بر اساس کلمات کلیدی لیست سفید'}</span>
                  </h3>
                  <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {wordCloudUseAllChats ? 'فهرست تمامی پیام‌هایی که برای ساخت ابرکلمات پردازش شدند' : 'فهرست پیام‌هایی که شامل واژه‌های فیلتر شده هستند'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 border ${isDarkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                  <span>نمایش {matchedChatsList.length} گفتگو از {chatRows.length} گفتگو</span>
                </div>
                <div className={`p-1.5 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                  {isFilteredChatsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {isFilteredChatsExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <p className={`text-xs mb-4 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {wordCloudUseAllChats ? (
                      <span>در زیر، تمامی پیام‌های بارگذاری شده (پس از فیلترهای بالا) را مشاهده می‌کنید. تمامی این پیام‌ها برای استخراج ابرکلمات بررسی شده‌اند. در صورت تمایل می‌توانید روی هر کلمه در ابرکلمات کلیک کنید تا در چت‌های زیر هایلایت شود.</span>
                    ) : (
                      <span>در زیر، تمامی پیام‌هایی که شامل حداقل یکی از واژه‌های تعریف شده در «لیست سفید» شما هستند را مشاهده می‌کنید. برای شفافیت، کلمات تطبیق داده شده با هایلایت <span className={`font-semibold px-1.5 py-0.5 rounded border ${isDarkMode ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-[#0057D9]/10 text-[#0057D9] border-[#0057D9]/15'}`}>آبی اعتماد</span> مشخص گردیده‌اند و گفتگوها بر اساس شناسه چت یکتا فیلتر شده‌اند تا از نمایش رکوردهای تکراری جلوگیری شود.</span>
                    )}
                  </p>

                  {/* Chat Selection Control Panel & Image Export */}
                  {selectedChatsForImage.length > 0 ? (
                    <div className={`p-4 mb-6 rounded-xl border transition-all ${
                      isDarkMode ? 'bg-slate-950/60 border-indigo-500/30' : 'bg-indigo-50/20 border-indigo-200'
                    }`}>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                            <Camera className="w-4 h-4 animate-pulse" />
                            <span>ابزار صادرات تصویر چت‌های منتخب ({selectedChatsForImage.length} از ۵)</span>
                          </h4>
                          <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            شما پیام‌های مدنظرتان را انتخاب کرده‌اید. در زیر می‌توانید پیش‌نمایش چیدمان تصویر را مشاهده کرده و آن را به صورت فایل PNG باکیفیت بارگیری کنید.
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
                          <button
                            onClick={() => {
                              setIsPreviewImageExpanded(!isPreviewImageExpanded);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                              isDarkMode ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300' : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                            }`}
                          >
                            <span>{isPreviewImageExpanded ? 'مخفی کردن پیش‌نمایش' : 'مشاهده پیش‌نمایش تصویر'}</span>
                          </button>
                          <button
                            onClick={handleDownloadChatsImage}
                            disabled={isExportingImage}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold text-white transition-all cursor-pointer flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 ${
                              isExportingImage ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                          >
                            {isExportingImage ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                            <span>{isExportingImage ? 'در حال تولید تصویر...' : 'دانلود تصویر PNG'}</span>
                          </button>
                          <button
                            onClick={() => setSelectedChatsForImage([])}
                            className="text-xs text-rose-500 hover:text-rose-600 px-2 py-1 font-semibold transition-colors cursor-pointer"
                          >
                            پاکسازی انتخاب‌ها
                          </button>
                        </div>
                      </div>

                      {chatSelectionError && (
                        <div className="mt-3 flex items-center gap-2 text-xs font-bold text-rose-500">
                          <AlertCircle className="w-4 h-4" />
                          <span>{chatSelectionError}</span>
                        </div>
                      )}

                      {/* Expandable Image Preview Area */}
                      {isPreviewImageExpanded && (
                        <div className="mt-4 border-t pt-4 border-slate-200/50 dark:border-slate-800/50">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-bold">پیش‌نمایش زنده تصویر خروجی (با ابعاد استاندارد ۹۵۰ پیکسل):</span>
                          </div>
                          
                          {/* Beautiful Scrollable Preview Wrapper */}
                          <div className="overflow-x-auto border rounded-xl bg-slate-100 dark:bg-slate-950 p-4 max-h-[500px]">
                            {/* This is the actual element that we will export */}
                            <div 
                              id="chats-export-image"
                              className={`w-[910px] p-6 rounded-xl flex flex-col gap-6 shadow-2xl relative border overflow-hidden ${
                                isDarkMode ? 'bg-slate-950 text-slate-100 border-slate-800' : 'bg-slate-50 text-slate-800 border-slate-200'
                              }`}
                              style={{ direction: 'rtl', fontFamily: 'Inter, system-ui' }}
                            >
                              {/* Decorative Tech Background Accent */}
                              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                              <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#0057D9]/5 rounded-full blur-3xl pointer-events-none" />

                              {/* Image Header */}
                              <div className="flex justify-between items-center pb-4 border-b border-slate-200/60 dark:border-slate-800/60 relative z-10">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                    <span className="text-[10px] tracking-wider font-mono uppercase text-indigo-500 dark:text-indigo-400 font-bold">SELECTED CHATS EXPORT</span>
                                  </div>
                                  <h2 className="text-base font-black text-slate-800 dark:text-white">گزارش تصویری گفتگوهای برگزیده پشتیبانی</h2>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400">تحلیل، دسته‌بندی و تطبیق داده شده بر اساس الگوهای لیست سفید شما</p>
                                </div>
                                
                                <div className="text-left space-y-1.5 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                                  <div>تاریخ تحلیل: {new Date().toLocaleDateString('fa-IR')}</div>
                                  <div>تعداد چت‌ها: {selectedChatsForImage.length} مورد</div>
                                  {selectedGroup && (
                                    <div className="flex items-center gap-1 justify-end">
                                      <span>لیست فعال:</span>
                                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                        getGroupColorClasses(selectedGroup.color).badge
                                      }`}>{selectedGroup.name}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Selected Cards Grid */}
                              <div className={`grid gap-4 z-10 relative ${
                                selectedChatsForImage.length === 1 ? 'grid-cols-1' :
                                selectedChatsForImage.length === 2 ? 'grid-cols-2' :
                                selectedChatsForImage.length === 3 ? 'grid-cols-3' : 'grid-cols-2'
                              }`}>
                                {selectedChatsForImage.map((row, index) => {
                                  const groupWords = selectedGroup ? selectedGroup.words : [];
                                  const containedKeywords = groupWords
                                    .map(w => w.word.trim())
                                    .filter(w => w.length > 0 && row.text.toLowerCase().includes(w.toLowerCase()));
                                  const chatId = getChatId(row);
                                  
                                  return (
                                    <div 
                                      key={row.id}
                                      className={`p-4 rounded-xl border flex flex-col justify-between gap-4 transition-all ${
                                        isDarkMode 
                                          ? 'bg-slate-900/60 border-slate-800' 
                                          : 'bg-white border-slate-200/80 shadow-xs'
                                      }`}
                                    >
                                      <div className="space-y-3">
                                        <div className="flex items-center justify-between border-b pb-2 border-slate-200/40 dark:border-slate-800/40">
                                          <div className="flex items-center gap-1.5">
                                            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                                              {index + 1}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">شناسه:</span>
                                            <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300">{chatId}</span>
                                          </div>
                                          {row.data['دسته بندی'] && (
                                            <span className={`border text-[9px] px-2 py-0.5 rounded-full font-bold ${
                                              isDarkMode ? 'bg-[#0057D9]/20 text-indigo-300 border-[#0057D9]/30' : 'bg-[#0057D9]/5 text-[#0057D9] border-[#0057D9]/15'
                                            }`}>
                                              {row.data['دسته بندی']}
                                            </span>
                                          )}
                                        </div>

                                        {/* Highlighted text container */}
                                        <div className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                                          {highlightMatchedWords(row.text)}
                                        </div>
                                      </div>

                                      {/* Contained Keywords Tag */}
                                      <div className="border-t pt-2 border-slate-200/40 dark:border-slate-800/40">
                                        <span className="text-[9px] text-slate-400 font-bold block mb-1">کلمات تطبیق یافته:</span>
                                        <div className="flex flex-wrap gap-1">
                                          {containedKeywords.map((kw, i) => (
                                            <span 
                                              key={i}
                                              className="bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs"
                                            >
                                              {kw}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Image Footer Watermark */}
                              <div className="flex justify-between items-center pt-4 border-t border-slate-200/60 dark:border-slate-800/60 text-[10px] text-slate-400 dark:text-slate-500 relative z-10">
                                <div>سامانه تحلیل هوشمند گفتگوها - گزارش خروجی خودکار</div>
                                <div className="font-mono text-[9px] tracking-widest text-indigo-500 dark:text-indigo-400 font-bold">SMART CHAT ANALYZER</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={`p-3.5 mb-6 rounded-lg text-xs border flex items-center gap-2.5 ${
                      isDarkMode ? 'bg-slate-900/40 border-slate-800/80 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}>
                      <span className="text-lg">💡</span>
                      <span>راهنمایی: با کلیک بر روی دکمه <strong>«انتخاب جهت تصویر»</strong> در هر کارت زیر، می‌توانید بین ۱ تا ۵ گفتگو را برگزینید تا تصویری خلاقانه، منظم و یکپارچه در قالب PNG از آن‌ها تهیه و دانلود کنید.</span>
                    </div>
                  )}

                  {/* FILTERED CARDS GRID */}
                  <div className="space-y-4">
                    {matchedChatsList.length === 0 ? (
                      <div className={`text-center py-12 text-xs border border-dashed rounded-lg ${isDarkMode ? 'text-slate-500 border-slate-800 bg-slate-950/10' : 'text-slate-400 border-slate-200 bg-slate-50'}`}>
                        هیچ چتی با کلمات کلیدی لیست سفید شما همخوانی ندارد. کلمات لیست سفید جدیدی اضافه کرده یا فایل گفتگوها را بررسی کنید.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 max-h-[450px] overflow-y-auto pr-1">
                        {matchedChatsList.map((row, idx) => {
                          // Find which whitelist words are present in this specific row
                          const groupWords = selectedGroup ? selectedGroup.words : [];
                          const containedKeywords = groupWords
                            .map(w => w.word.trim())
                            .filter(w => w.length > 0 && row.text.toLowerCase().includes(w.toLowerCase()));

                          const chatId = getChatId(row);
                          const isSelectedForImage = selectedChatsForImage.some(c => c.id === row.id);
                          const imageSelectionIndex = selectedChatsForImage.findIndex(c => c.id === row.id);

                          return (
                            <div 
                              key={row.id}
                              className={`p-4 rounded-lg border transition-all flex flex-col md:flex-row justify-between gap-4 shadow-xs ${
                                isSelectedForImage
                                  ? (isDarkMode ? 'border-indigo-500 bg-indigo-950/20 ring-1 ring-indigo-500/30' : 'border-indigo-400 bg-indigo-50/40 ring-1 ring-indigo-400/20')
                                  : (isDarkMode 
                                      ? 'bg-slate-950/40 border-slate-800 hover:border-indigo-500/30 hover:bg-slate-950' 
                                      : 'bg-white border-slate-200 hover:border-[#0057D9]/20 hover:bg-slate-50/20 hover:shadow-md')
                              }`}
                            >
                              <div className="space-y-3 flex-grow">
                                <div className="flex items-center gap-2 flex-wrap justify-between md:justify-start">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`w-5 h-5 rounded-full border text-[10px] font-mono flex items-center justify-center shrink-0 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                                      {idx + 1}
                                    </span>
                                    <span className={`text-[10px] font-mono flex items-center gap-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                      <span>شناسه گفتگو:</span>
                                      <span className={`border px-1.5 py-0.5 rounded font-semibold ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>{chatId}</span>
                                    </span>
                                    {row.data['دسته بندی'] && (
                                      <span className={`border text-[10px] px-2 py-0.5 rounded-md font-medium ${isDarkMode ? 'bg-[#0057D9]/15 text-indigo-300 border-[#0057D9]/30' : 'bg-[#0057D9]/5 text-[#0057D9] border-[#0057D9]/15'}`}>
                                        {row.data['دسته بندی']}
                                      </span>
                                    )}
                                  </div>

                                  {/* Selection Checkbox/Toggle Button */}
                                  <button
                                    onClick={() => handleToggleChatForImage(row)}
                                    className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                                      isSelectedForImage
                                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                                        : (isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900')
                                    }`}
                                    title="انتخاب برای خروجی تصویر"
                                  >
                                    {isSelectedForImage ? (
                                      <>
                                        <Check className="w-3 h-3 text-white" />
                                        <span>منتخب ({imageSelectionIndex + 1} از ۵)</span>
                                      </>
                                    ) : (
                                      <>
                                        <Plus className="w-3 h-3" />
                                        <span>انتخاب جهت تصویر</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                                
                                {/* Content with highlighter */}
                                <div className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                  {highlightMatchedWords(row.text)}
                                </div>
                              </div>

                              {/* Contained Keywords Tag */}
                              <div className={`flex flex-row md:flex-col items-start md:items-end gap-1.5 shrink-0 justify-end md:justify-center border-t md:border-t-0 pt-2.5 md:pt-0 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                                <span className="text-[9px] text-slate-400 font-bold block mb-1">کلمات یافت شده:</span>
                                <div className="flex flex-wrap gap-1 md:justify-end">
                                  {containedKeywords.map((kw, i) => (
                                    <span 
                                      key={i}
                                      onClick={() => {
                                        const metadata = activeCloudWords.find(w => w.text === kw);
                                        if (metadata) {
                                          handleWordSelect(metadata);
                                          // Scroll to metadata output
                                          document.getElementById('metadata-output')?.scrollIntoView({ behavior: 'smooth' });
                                        }
                                      }}
                                      className="bg-[#0057D9] text-white text-[9px] font-bold px-2 py-0.5 rounded hover:scale-105 transition-all cursor-pointer shadow-sm"
                                    >
                                      {kw}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium w-full transition-colors duration-300 ${isDarkMode ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
        <span>© {new Date().getFullYear()} سیستم تحلیل‌گر ابرکلمات بازخورد مشتریان</span>
      </footer>

      {/* CUSTOM CONFIRMATION MODAL OVERLAY (Bypasses sandboxed iframe modal blocks) */}
      <AnimatePresence>
        {deleteConfirmState && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmState(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
            />
            
            {/* Modal Dialog Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.35 }}
              className={`relative z-10 w-full max-w-md rounded-2xl border p-6 shadow-2xl transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-slate-900 border-slate-800 text-slate-100' 
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              {/* Header Icon & Title */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${
                  deleteConfirmState.type === 'reset' 
                    ? 'bg-amber-500/10 text-amber-500' 
                    : 'bg-rose-500/10 text-rose-500'
                }`}>
                  {deleteConfirmState.type === 'reset' ? (
                    <RotateCcw className="w-5 h-5" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                </div>
                <h3 className="text-base font-bold">
                  {deleteConfirmState.type === 'group' && `حذف لیست سفید`}
                  {deleteConfirmState.type === 'word' && `حذف کلمه کلیدی`}
                  {deleteConfirmState.type === 'reset' && `بازنشانی تنظیمات لیست`}
                </h3>
              </div>

              {/* Message Content */}
              <div className={`text-xs leading-relaxed mb-6 font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                {deleteConfirmState.type === 'group' && (
                  <p>
                    آیا از حذف کامل لیست سفید <strong className="text-rose-500">«{deleteConfirmState.groupName}»</strong> به همراه تمام کلمات داخل آن مطمئن هستید؟ این تغییر بلافاصله بر روی ابرکلمات اعمال خواهد شد و غیرقابل بازگشت است.
                  </p>
                )}
                {deleteConfirmState.type === 'word' && (
                  <p>
                    آیا مطمئن هستید که می‌خواهید کلمه کلیدی <strong className="text-rose-500">«{deleteConfirmState.wordText}»</strong> را از لیست <strong className={isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}>«{deleteConfirmState.groupName}»</strong> حذف کنید؟
                  </p>
                )}
                {deleteConfirmState.type === 'reset' && (
                  <p>
                    با تایید این گزینه، تمامی لیست‌های ساخته شده توسط شما حذف شده و کلمات پیش‌فرض صرافی‌ها، ارزها و پشتیبانی مجدداً بارگذاری می‌شوند. آیا مایل به ادامه هستید؟
                  </p>
                )}
              </div>

              {/* Dialog Buttons */}
              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmState(null)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    isDarkMode 
                      ? 'bg-slate-850 hover:bg-slate-800 text-slate-300' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (deleteConfirmState.type === 'group') {
                      handleConfirmDeleteGroup(deleteConfirmState.groupId);
                    } else if (deleteConfirmState.type === 'word') {
                      handleConfirmRemoveWord(deleteConfirmState.groupId, deleteConfirmState.wordId!);
                    } else if (deleteConfirmState.type === 'reset') {
                      handleConfirmReset();
                    }
                  }}
                  className={`px-4 py-2 rounded-lg text-xs font-bold text-white transition-colors cursor-pointer ${
                    deleteConfirmState.type === 'reset' 
                      ? 'bg-amber-600 hover:bg-amber-500 shadow-md shadow-amber-600/15' 
                      : 'bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-600/15'
                  }`}
                >
                  تایید و حذف قطعی
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOM ALERT MESSAGE DIALOG */}
      <AnimatePresence>
        {alertMessage && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAlertMessage(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
            />
            
            {/* Modal Alert Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.3 }}
              className={`relative z-10 w-full max-w-sm rounded-2xl border p-5 shadow-2xl transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-slate-900 border-slate-800 text-slate-100' 
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold leading-tight mt-0.5">اقدام غیرمجاز</h3>
                  <p className={`text-[11px] leading-relaxed mt-2.5 font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    {alertMessage}
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setAlertMessage(null)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer shadow-md shadow-indigo-600/15"
                >
                  متوجه شدم
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
