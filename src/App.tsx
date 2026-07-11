/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatRow, WhitelistWord, WhitelistGroup, WordMetadata, AnalysisResult } from './types';
import WordCloud from './components/WordCloud';

// Default CSV Dataset to provide an incredible initial experience
const DEFAULT_CSV_CONTENT = `متن گفتگو,دسته بندی,شناسه تیکت
سلام، پشتیبانی محترم، کیفیت محصول عالی بود ولی فرآیند تحویل کمی طول کشید.,کیفیت و تحویل,1001
سلام خسته نباشید، پشتیبانی خیلی سریع و عالی پاسخ داد. ممنون از خدمات خوبتون.,پشتیبانی مشتری,1002
سلام، چرا مبلغ بازگشتی هنوز به حساب من واریز نشده؟ دو روزه منتظرم و پیگیری می‌کنم.,مالی,1003
سلام، من برای معامله بیت کوین و خرید تتر از نوبیتکس و والکس استفاده می‌کنم ولی بیت پین هم خوبه.,ارزهای دیجیتال,1004
اپلیکیشن شما سرعتش خیلی پایینه، لطفا کیفیت فنی اپ رو ارتقا بدید.,فنی,1005
بسته‌بندی کالا خراب بود و کالا آسیب دیده بود. فرآیند مرجوعی چطوریاست؟,مرجوعی کالا,1006
تخفیف‌های شما عالی هستند، خریدهای زیادی انجام دادم و کاملا راضی‌ام.,فروش,1007
پشتیبانی تلفنی خیلی دیر پاسخ میده ولی پشتیبانی آنلاین و پیگیری سریع شما عالیه.,پشتیبانی مشتری,1008
تتر و تون کوین سرعت انتقال خیلی بالایی دارند و کارمزدشون توی صرافی کوکوین کمتره.,ارزهای دیجیتال,1009
امکان پیگیری سفارشات در سایت خیلی دقیق و مفیده و به سرعت کار ما کمک می‌کنه.,فنی,1010`;

const DEFAULT_WHITELIST_GROUPS: WhitelistGroup[] = [
  {
    id: 'g1',
    name: 'مسائل عمومی و پشتیبانی',
    isActive: true,
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

export default function App() {
  // State for CSV Data
  const [csvRawText, setCsvRawText] = useState<string>(DEFAULT_CSV_CONTENT);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [chatRows, setChatRows] = useState<ChatRow[]>([]);
  const [selectedTextColumn, setSelectedTextColumn] = useState<string>('');
  
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

  useEffect(() => {
    localStorage.setItem('cx_stop_words', JSON.stringify(stopWords));
  }, [stopWords]);

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

  const [newWordInput, setNewWordInput] = useState<string>('');
  const [newGroupNameInput, setNewGroupNameInput] = useState<string>('');

  // State for Bidirectional JSON API sync
  const [isJsonMode, setIsJsonMode] = useState<boolean>(false);
  const [customJsonArray, setCustomJsonArray] = useState<string>('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Interaction States
  const [selectedWordMetadata, setSelectedWordMetadata] = useState<WordMetadata | null>(null);
  const [copiedState, setCopiedState] = useState<string | null>(null);

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

  // Theme support
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('cx_theme');
    return saved ? saved === 'dark' : false;
  });

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
      createdAt: Date.now(),
      words: []
    };

    setWhitelistGroups(prev => [...prev, newGroup]);
    setSelectedGroupId(newGroup.id);
    setNewGroupNameInput('');
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

    const rawMatches = chatRows.filter(row => {
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
  }, [chatRows, selectedGroup]);

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
    chatRows.forEach(row => {
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
      totalChats: chatRows.length,
      matchedChatsCount,
      wordFrequencies,
      wordDetails
    };
  }, [chatRows, selectedGroup, chatsMatchingSelectedGroup]);

  // Synchronize JSON mode
  // Generates the word cloud from ALL words in the chats related to the selected whitelist group, excluding stop words
  const wordCloudDataArray = useMemo<WordMetadata[]>(() => {
    if (chatsMatchingSelectedGroup.length === 0) {
      return [];
    }

    const freqMap: Record<string, { value: number; chatIndices: string[] }> = {};

    chatsMatchingSelectedGroup.forEach(row => {
      const text = row.text || '';
      
      // Keep only Persian letters, English letters, and numbers. Replace all others with space.
      const cleanText = text.replace(/[^\u0600-\u06FF\uFB8A\u067E\u0686\u06AF\u200C\u200D\w\s]/g, ' ');
      const rawWords = cleanText.split(/\s+/);
      
      rawWords.forEach(rawWord => {
        let word = rawWord.trim();
        word = word.replace(/[\u060C\u061F]/g, ''); // strip remaining Persian punctuation
        
        if (word.length >= 2) {
          const lowerWord = word.toLowerCase();
          
          // Whitelist words of the SELECTED group are ALWAYS preserved.
          const isSelectedGroupWord = selectedGroup?.words.some(
            w => w.word.trim().toLowerCase() === lowerWord
          );
          
          if (isSelectedGroupWord || !stopWordsSet.has(lowerWord)) {
            if (!freqMap[word]) {
              freqMap[word] = { value: 0, chatIndices: [] };
            }
            freqMap[word].value += 1;
            if (!freqMap[word].chatIndices.includes(row.id)) {
              freqMap[word].chatIndices.push(row.id);
            }
          }
        }
      });
    });

    // Transform freqMap into WordMetadata objects
    const candidates = Object.entries(freqMap).map(([text, data]) => ({
      text,
      value: data.value,
      percentage: 0,
      chatIndices: data.chatIndices
    }));

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
  }, [chatsMatchingSelectedGroup, selectedGroup, stopWordsSet]);

  // Synchronize the textarea when analysis values change so JSON mode has latest
  useEffect(() => {
    if (!isJsonMode) {
      setCustomJsonArray(JSON.stringify(wordCloudDataArray, null, 2));
    }
  }, [wordCloudDataArray, isJsonMode]);

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
          return (parsed as any[]).map((item: any) => ({
            text: String(item.text),
            value: Number(item.value),
            percentage: Number(item.percentage || 0),
            chatIndices: Array.isArray(item.chatIndices) ? item.chatIndices.map(String) : []
          }));
        }
      } catch (e) {
        // fallback to standard
      }
    }
    return wordCloudDataArray;
  }, [isJsonMode, customJsonArray, wordCloudDataArray]);

  // Extract and deduplicate Chat IDs for the currently selected word
  const selectedWordUniqueChatIds = useMemo(() => {
    if (!selectedWordMetadata) return [];
    
    // Find all rows that match the chatIndices of the selected word
    const matchingRows = chatRows.filter(row => selectedWordMetadata.chatIndices.includes(row.id));
    
    // Extract real Chat IDs and deduplicate them
    const chatIds = matchingRows.map(row => getChatId(row));
    const uniqueSet = new Set<string>(chatIds);
    return Array.from(uniqueSet).filter((id: string) => id && id.trim().length > 0);
  }, [selectedWordMetadata, chatRows]);

  // Filtered chats lists
  const matchedChatsList = useMemo(() => {
    return chatsMatchingSelectedGroup;
  }, [chatsMatchingSelectedGroup]);

  // Helper to highlight words in chat text
  const highlightMatchedWords = (text: string) => {
    if (!text) return '';
    let highlighted = text;
    
    // Use selected group words to highlight
    const groupWords = selectedGroup ? selectedGroup.words.map(w => w.word.trim()) : [];
    
    // Also highlight the currently clicked word from the word cloud if any
    if (selectedWordMetadata && !groupWords.some(w => w.toLowerCase() === selectedWordMetadata.text.toLowerCase())) {
      groupWords.push(selectedWordMetadata.text);
    }

    // Sort by length descending to avoid nested replacement issues
    const sortedWords = [...groupWords]
      .filter(w => w.length > 0)
      .sort((a, b) => b.length - a.length);

    if (sortedWords.length === 0) {
      return <div className="leading-relaxed text-sm" style={{ direction: 'rtl', textAlign: 'right' }}>{text}</div>;
    }

    // Build a unified regex to replace matches safely
    // To avoid HTML corruption during consecutive replacements, we tokenise first
    const tokens: { id: string; original: string; replacement: string }[] = [];
    
    sortedWords.forEach((word, index) => {
      const escapedWord = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`(${escapedWord})`, 'gi');
      
      highlighted = highlighted.replace(regex, (match) => {
        const tokenId = `___MATCH_TOKEN_${index}_${Math.random().toString(36).substr(2, 5)}___`;
        tokens.push({
          id: tokenId,
          original: match,
          replacement: `<span class="bg-[#0057D9]/10 text-[#0057D9] font-semibold px-1.5 py-0.5 rounded border border-[#0057D9]/20 hover:bg-[#0057D9]/20 transition-all cursor-pointer" title="کلمه کلیدی">${match}</span>`
        });
        return tokenId;
      });
    });

    // Re-inject highlighted spans
    tokens.forEach(token => {
      highlighted = highlighted.replace(token.id, token.replacement);
    });

    return <div dangerouslySetInnerHTML={{ __html: highlighted }} className="leading-relaxed text-sm text-slate-700" />;
  };

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

  const handleWordSelect = (word: WordMetadata) => {
    setSelectedWordMetadata(word);
  };

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
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">گفتگوهای شامل کلمات کلیدی</p>
              <h3 className={`text-lg font-bold mt-0.5 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                {analysisResult.matchedChatsCount} چت 
                <span className="text-xs text-slate-400 font-normal mr-1">
                  ({analysisResult.totalChats > 0 ? Math.round((analysisResult.matchedChatsCount / analysisResult.totalChats) * 100) : 0}٪)
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
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">کل تکرار کلمات لیست منتخب</p>
              <h3 className={`text-lg font-bold mt-0.5 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                {(Object.values(analysisResult.wordFrequencies) as number[]).reduce((sum, val) => sum + val, 0)} مرتبه
              </h3>
            </div>
          </div>
        </section>

        {/* LEFT COLUMN: WHITELIST MANAGEMENT & DYNAMIC API INPUT */}
        <section className="lg:col-span-4 space-y-6 flex flex-col">
          
          {/* WHITELIST MANAGEMENT PANEL */}
          <div id="whitelist-panel" className={`rounded-xl border shadow-sm p-5 flex flex-col transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}>
            <div className={`flex items-center justify-between pb-3 border-b mb-4 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-500" />
                <h3 className={`text-sm font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>مدیریت لیست‌های سفید (دسته‌بندی شده)</h3>
              </div>
            </div>

            <p className={`text-[11px] mb-3 leading-relaxed font-normal ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              در این بخش می‌توانید چندین لیست موضوعی مختلف تعریف کنید و کلمات مورد نظر را در هر دسته مدیریت کنید. با فعال/غیرفعال کردن هر لیست، کلمات آن فورا از محاسبات ابرکلمات اعمال یا حذف می‌شوند.
            </p>

            {/* Input Form for New Group */}
            <div className="flex gap-2 mb-3">
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

            {/* Groups Selection List */}
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 mb-4">
              {whitelistGroups.map((g) => {
                const isSelected = g.id === selectedGroupId;
                return (
                  <div
                    key={g.id}
                    onClick={() => setSelectedGroupId(g.id)}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                      isSelected 
                        ? (isDarkMode ? 'bg-indigo-500/10 border-indigo-500/30 shadow-xs' : 'bg-indigo-50/50 border-indigo-200 shadow-xs') 
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
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                        title="فعال / غیرفعال سازی لیست"
                      />
                      <span className={`font-semibold ${g.isActive ? (isDarkMode ? 'text-slate-200' : 'text-slate-800') : 'text-slate-500 line-through font-normal'}`}>
                        {g.name}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border ${isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700/60' : 'bg-slate-100 text-slate-500 border-slate-200/50'}`}>
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
              return (
                <div className={`border-t pt-3 mt-1 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-bold flex items-center gap-1 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                      <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
                      مدیریت کلمات لیست «{currentGroup.name}»
                    </span>
                  </div>

                  <div className="flex gap-2 mb-3">
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

                  {/* Whitelist Badges Container */}
                  <div className={`flex-grow max-h-[160px] overflow-y-auto pr-1 rounded-lg p-2.5 border ${isDarkMode ? 'bg-slate-950 border-slate-800/80' : 'bg-slate-50 border-slate-200/60'}`}>
                    {currentGroup.words.length === 0 ? (
                      <div className={`text-center py-4 text-[11px] font-normal ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        هیچ کلمه‌ای در این لیست قرار ندارد.
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {currentGroup.words.map((wordObj) => {
                          const frequency = analysisResult.wordFrequencies[wordObj.word] || 0;
                          return (
                            <div
                              key={wordObj.id}
                              className={`rounded py-0.5 px-2 flex items-center gap-1.5 shadow-xs text-xs hover:border-indigo-500/40 transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}
                            >
                              <span className="font-medium">{wordObj.word}</span>
                              {frequency > 0 && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${isDarkMode ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/25' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
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

          {/* STOP WORDS MANAGEMENT PANEL */}
          <div id="stop-words-panel" className={`rounded-xl border shadow-sm p-5 flex flex-col transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}>
            <div className={`flex items-center justify-between pb-3 border-b mb-4 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-rose-500" />
                <h3 className={`text-sm font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>مدیریت کلمات استاپ (Stop Words)</h3>
              </div>
              <button
                onClick={() => {
                  if (confirm("آیا مایلید لیست کلمات استاپ را به کلمات پیش‌فرض بازیابی کنید؟ کلمات افزوده شده شما پاک خواهند شد.")) {
                    setStopWords(DEFAULT_STOP_WORDS);
                  }
                }}
                className={`text-[10px] flex items-center gap-1 font-bold px-2 py-1 rounded transition-colors cursor-pointer ${
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

            <p className={`text-[11px] mb-3 leading-relaxed font-normal ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              کلماتی که مایل هستید در محاسبات ابرکلمات نهایی نشان داده نشوند (مانند حروف ربط و اضافه) را در این بخش مدیریت کنید. با افزودن یا حذف کلمات، تغییرات بلافاصله روی ابرکلمات نهایی اعمال می‌شود.
            </p>

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

        </section>

        {/* CENTER COLUMN: INTERACTIVE WORD CLOUD & SELECTED METADATA */}
        <section className="lg:col-span-8 space-y-6 flex flex-col">
          
          {/* WORD CLOUD VIEWER */}
          <div className={`rounded-xl border shadow-lg p-5 flex flex-col flex-grow transition-colors duration-300 ${isDarkMode ? 'bg-slate-900/40 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}>
            <div className={`flex items-center justify-between pb-3 border-b mb-4 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                <h3 className={`text-sm font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>ابر کلمات محاسباتی و تعاملی بازخوردهای مشتریان</h3>
              </div>
              <span className={`text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                رندر بر اساس {isJsonMode ? 'آرایه ویرایشی JSON' : 'تحلیل فایل بارگذاری شده'}
              </span>
            </div>

            <WordCloud 
              words={activeCloudWords} 
              onWordClick={handleWordSelect} 
              selectedWord={selectedWordMetadata}
              isDarkMode={isDarkMode}
            />
          </div>


        </section>

        {/* BOTTOM PANEL 1: CSV FILE UPLOAD & FULL DISPLAY */}
        <section className="lg:col-span-12 space-y-6">
          <div className={`rounded-xl border shadow-sm p-6 transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}>
            <div className={`flex flex-col md:flex-row md:items-center justify-between pb-4 border-b gap-4 mb-6 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${isDarkMode ? 'bg-[#0057D9]/10 border-[#0057D9]/25 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-[#0057D9]'}`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-sm font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>۱. بارگذاری و نمایش کامل فایل گفتگوها (CSV)</h3>
                  <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>فایل چت‌های تیم پشتیبانی خود را بارگذاری کنید</p>
                </div>
              </div>

              {/* Actions container: Column selector & Sample data restorer */}
              <div className="flex flex-wrap items-center gap-2.5">
                {csvHeaders.length > 0 && (
                  <div className={`flex items-center gap-2 border px-3 py-1.5 rounded-lg ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <span className={`text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>ستون متن گفتگو:</span>
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

                <button 
                  onClick={() => setCsvRawText(DEFAULT_CSV_CONTENT)} 
                  className={`font-bold text-xs px-3.5 py-2 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                    isDarkMode 
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700/80 shadow-sm' 
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs'
                  }`}
                  title="بازنشانی اطلاعات به چت‌های نمونه پیش‌فرض"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#0057D9]" />
                  <span>بارگذاری گفتگوهای نمونه</span>
                </button>
              </div>
            </div>

            {/* Drag & Drop File Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                isDragging 
                  ? 'border-[#0057D9] bg-[#0057D9]/10 scale-[0.99]' 
                  : (isDarkMode ? 'border-slate-800 bg-slate-950/20 hover:border-indigo-500 hover:bg-slate-900/30' : 'border-slate-200 hover:border-[#0057D9] hover:bg-slate-50/50')
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                accept=".csv"
                className="hidden"
              />
              <Upload className="w-8 h-8 text-[#0057D9] mx-auto mb-3 animate-bounce" />
              <h4 className={`text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>فایل CSV گفتگوها را بکشید و رها کنید</h4>
              <p className={`text-xs mt-1 max-w-md mx-auto leading-relaxed ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                یا اینجا کلیک کنید تا فایل خود را از حافظه سیستم انتخاب نمایید. نرم‌افزار به صورت خودکار ستون حاوی مکالمه را شناسایی خواهد کرد.
              </p>
            </div>

            {/* FULL DATASET TABLE */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-bold flex items-center gap-1.5 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  نمایش کل محتوای فایل چت ({chatRows.length} ردیف داده بارگذاری شده)
                </span>
              </div>

              <div className={`overflow-x-auto border rounded-lg max-h-72 overflow-y-auto shadow-inner ${isDarkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50/50 border-slate-200'}`}>
                {chatRows.length === 0 ? (
                  <div className={`text-center py-12 text-xs ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    هیچ داده‌ای بارگذاری نشده است. فایلی آپلود کرده یا روی "بازنشانی به داده پیش‌فرض" کلیک کنید.
                  </div>
                ) : (
                  <table className="w-full text-right border-collapse text-xs">
                    <thead>
                      <tr className={`sticky top-0 font-bold border-b backdrop-blur-md ${isDarkMode ? 'bg-slate-950 text-slate-300 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        <th className={`p-3 w-12 text-center border-l ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>ردیف</th>
                        {csvHeaders.map((header) => (
                          <th key={header} className={`p-3 font-semibold border-l last:border-l-0 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'} ${header === selectedTextColumn ? (isDarkMode ? 'text-indigo-400 bg-indigo-500/10' : 'text-[#0057D9] bg-indigo-50/40') : ''}`}>
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800 bg-slate-900/10' : 'divide-slate-100 bg-white'}`}>
                      {chatRows.map((row, idx) => (
                        <tr key={row.id} className={`transition-colors ${isDarkMode ? 'hover:bg-indigo-500/10' : 'hover:bg-indigo-50/20'}`}>
                          <td className={`p-3 font-mono text-center border-l ${isDarkMode ? 'text-slate-500 border-slate-800' : 'text-slate-400 border-slate-100'}`}>{idx + 1}</td>
                          {csvHeaders.map((header) => (
                            <td key={header} className={`p-3 font-medium border-l last:border-l-0 ${isDarkMode ? 'text-slate-300 border-slate-800' : 'text-slate-600 border-slate-100'} ${header === selectedTextColumn ? (isDarkMode ? 'font-semibold text-slate-100 bg-indigo-500/10' : 'font-semibold text-slate-800 bg-indigo-50/20') : ''}`}>
                              {row.data[header]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* BOTTOM PANEL 2: FILTERED CHATS BASED ON WHITELIST */}
        <section id="filtered-chats-panel" className="lg:col-span-12">
          <div className={`rounded-xl border shadow-sm p-6 transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}>
            
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b gap-4 mb-6 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${isDarkMode ? 'bg-[#0057D9]/10 border-[#0057D9]/25 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-[#0057D9]'}`}>
                  <Filter className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-sm font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>۲. مکالمات فیلتر شده بر اساس کلمات کلیدی لیست سفید</h3>
                  <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>فهرست پیام‌هایی که شامل واژه‌های فیلتر شده هستند</p>
                </div>
              </div>

              <div className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 border ${isDarkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                <span>نمایش {matchedChatsList.length} گفتگو از {chatRows.length} گفتگو</span>
              </div>
            </div>

            <p className={`text-xs mb-4 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              در زیر، تمامی پیام‌هایی که شامل حداقل یکی از واژه‌های تعریف شده در «لیست سفید» شما هستند را مشاهده می‌کنید. برای شفافیت، کلمات تطبیق داده شده با هایلایت <span className={`font-semibold px-1.5 py-0.5 rounded border ${isDarkMode ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-[#0057D9]/10 text-[#0057D9] border-[#0057D9]/15'}`}>آبی اعتماد</span> مشخص گردیده‌اند و گفتگوها بر اساس شناسه چت یکتا فیلتر شده‌اند تا از نمایش رکوردهای تکراری جلوگیری شود.
            </p>

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

                    return (
                      <div 
                        key={row.id}
                        className={`p-4 rounded-lg border transition-all flex flex-col md:flex-row justify-between gap-4 shadow-xs ${
                          isDarkMode 
                            ? 'bg-slate-950/40 border-slate-800 hover:border-indigo-500/50 hover:bg-slate-950' 
                            : 'bg-white border-slate-200 hover:border-[#0057D9]/30 hover:bg-slate-50/20 hover:shadow-md'
                        }`}
                      >
                        <div className="space-y-3 flex-grow">
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
