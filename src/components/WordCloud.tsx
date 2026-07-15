/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, memo, useState, useEffect } from 'react';
import ReactWordcloud from 'react-wordcloud';
import { WordMetadata, WhitelistGroup } from '../types';
import { Download, Plus, EyeOff, Sparkles, Maximize2, Minimize2 } from 'lucide-react';

interface WordCloudProps {
  words: WordMetadata[];
  onWordClick: (word: WordMetadata) => void;
  selectedWord: WordMetadata | null;
  isDarkMode?: boolean;
  whitelistGroups: WhitelistGroup[];
  selectedGroupId: string;
  onAddToStopWords: (word: string) => void;
  onAddToWhitelist: (word: string, groupId: string) => void;
  language?: 'fa' | 'en';
}

function WordCloud({ 
  words, 
  onWordClick, 
  selectedWord, 
  isDarkMode = false,
  whitelistGroups = [],
  selectedGroupId = '',
  onAddToStopWords,
  onAddToWhitelist,
  language = 'fa'
}: WordCloudProps) {
  const [hoveredWord, setHoveredWord] = useState<WordMetadata | null>(null);
  const [targetGroupId, setTargetGroupId] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const t = (fa: string, en: string) => language === 'fa' ? fa : en;

  // Toggle body scroll during fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  // Sync default or active group ID
  useEffect(() => {
    if (selectedGroupId) {
      setTargetGroupId(selectedGroupId);
    } else if (whitelistGroups && whitelistGroups.length > 0) {
      setTargetGroupId(whitelistGroups[0].id);
    }
  }, [selectedGroupId, whitelistGroups]);

  // Sort and limit to top 50 words to keep layout clean and readable
  const processedWords = useMemo(() => {
    return [...words]
      .sort((a, b) => b.value - a.value)
      .slice(0, 50);
  }, [words]);

  const maxCount = useMemo(() => Math.max(...processedWords.map(w => w.value), 1), [processedWords]);
  const minCount = useMemo(() => Math.min(...processedWords.map(w => w.value), 1), [processedWords]);
  const sizeRange = maxCount - minCount || 1;

  // Configuration options for react-wordcloud
  const options = useMemo(() => ({
    deterministic: true,
    fontFamily: "Vazirmatn, Inter, sans-serif",
    fontSizes: [14, 46] as [number, number],
    fontStyle: "normal",
    fontWeight: "bold",
    padding: 8,
    // Persian text is highly illegible when rotated, so we keep rotation at exactly 0 degrees
    rotations: 1,
    rotationAngles: [0, 0] as [number, number],
    scale: "sqrt" as const,
    spiral: "archimedean" as const,
    transitionDuration: 400,
    enableTooltip: false,
  }), []);

  // Customized callbacks for color, tooltip, and interactive clicks
  const callbacks = useMemo(() => {
    const colorHexMap: Record<string, string> = {
      indigo: '#6366f1',
      emerald: '#10b981',
      amber: '#f59e0b',
      rose: '#f43f5e',
      violet: '#8b5cf6',
      cyan: '#06b6d4',
    };

    return {
      getWordColor: (word: any) => {
        const isSelected = selectedWord?.text === word.text;
        const ratio = (word.value - minCount) / sizeRange;

        if (isSelected) {
          if (word.groupColor) {
            return colorHexMap[word.groupColor] || word.groupColor;
          }
          return isDarkMode ? '#38BDF8' : '#0057D9'; // Bright highlighting for selected
        }

        if (word.groupColor) {
          return colorHexMap[word.groupColor] || word.groupColor;
        }

        if (isDarkMode) {
          if (ratio > 0.75) return '#F8FAFC'; // Slate 50
          if (ratio > 0.4) return '#7DD3FC';  // Sky 300
          if (ratio > 0.15) return '#CBD5E1'; // Slate 300
          return '#64748B';                   // Slate 500
        } else {
          if (ratio > 0.75) return '#0F172A'; // Slate 900
          if (ratio > 0.4) return '#2563EB';  // Blue 600
          if (ratio > 0.15) return '#475569'; // Slate 600
          return '#94A3B8';                   // Slate 400
        }
      },
      getWordTooltip: (word: any) => {
        const groupInfo = word.groupName ? ` | ${language === 'fa' ? 'لیست' : 'List'}: ${word.groupName}` : '';
        return `${language === 'fa' ? 'کلمه' : 'Word'}: ${word.text} | ${language === 'fa' ? 'تعداد تکرار' : 'Occurrence count'}: ${word.value}${groupInfo}`;
      },
      onWordClick: (word: any) => {
        // Find the original WordMetadata reference and trigger callback
        const matched = words.find(w => w.text === word.text);
        if (matched) {
          onWordClick(matched);
        }
      },
      onWordMouseEnter: (word: any) => {
        const matched = words.find(w => w.text === word.text);
        if (matched) {
          setHoveredWord(matched);
        }
      },
      onWordMouseLeave: () => {
        setHoveredWord(null);
      }
    };
  }, [processedWords, selectedWord, isDarkMode, minCount, sizeRange, words, onWordClick, language]);

  // Export word cloud SVG to PNG image
  const handleExportPNG = () => {
    const container = document.getElementById('word-cloud-container');
    if (!container) return;

    // ReactWordcloud renders its SVG inside a container with class .z-10
    const wordcloudDiv = container.querySelector('.z-10');
    if (!wordcloudDiv) return;
    const svgElement = wordcloudDiv.querySelector('svg');
    if (!svgElement) {
      alert(t('خطا: المان گرافیکی ابرکلمات یافت نشد.', 'Error: Word cloud graphic element not found.'));
      return;
    }

    // Capture dimensions
    const width = svgElement.clientWidth || 800;
    const height = svgElement.clientHeight || 400;

    // Clone the wordcloud SVG
    const svgClone = svgElement.cloneNode(true) as SVGElement;
    svgClone.setAttribute('width', width.toString());
    svgClone.setAttribute('height', height.toString());
    svgClone.setAttribute('style', 'background-color: transparent;');

    // Create wrapper SVG to bundle background and wordcloud
    const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    wrapper.setAttribute('width', width.toString());
    wrapper.setAttribute('height', height.toString());
    wrapper.setAttribute('viewBox', `0 0 ${width} ${height}`);

    // Add background rect with solid theme color
    const bgColor = isDarkMode ? '#0f172a' : '#ffffff';
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', '100%');
    rect.setAttribute('height', '100%');
    rect.setAttribute('fill', bgColor);
    wrapper.appendChild(rect);

    // Grab background aesthetic rings & axes, clone them into the export
    const bgSvgElement = container.querySelector('svg:not(.z-10 svg)');
    if (bgSvgElement) {
      const bgClone = bgSvgElement.cloneNode(true) as SVGElement;
      bgClone.setAttribute('width', width.toString());
      bgClone.setAttribute('height', height.toString());
      const group = bgClone.querySelector('g');
      if (group) {
        group.setAttribute('opacity', isDarkMode ? '0.08' : '0.04');
      }
      wrapper.appendChild(bgClone);
    }

    // Append the cloned wordcloud words SVG
    wrapper.appendChild(svgClone);

    const svgString = new XMLSerializer().serializeToString(wrapper);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const blobURL = window.URL.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      // Set 2x resolution scale for crystal clear rendering
      const scale = 2;
      canvas.width = width * scale;
      canvas.height = height * scale;
      const context = canvas.getContext('2d');
      if (context) {
        context.scale(scale, scale);
        context.drawImage(image, 0, 0, width, height);
        try {
          const pngURL = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = pngURL;
          downloadLink.download = `wordcloud-${Date.now()}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        } catch (err) {
          console.error("PNG export conversion failed:", err);
        }
      }
      window.URL.revokeObjectURL(blobURL);
    };
    image.onerror = (err) => {
      console.error("Image loading failed for PNG export:", err);
      window.URL.revokeObjectURL(blobURL);
    };
    image.src = blobURL;
  };

  const activeWord = useMemo(() => {
    return hoveredWord || selectedWord;
  }, [hoveredWord, selectedWord]);

  return (
    <div
      className={`w-full overflow-hidden flex flex-col transition-all duration-300 shadow-sm ${
        isFullscreen
          ? 'fixed inset-0 z-50 p-6 h-screen w-screen rounded-none border-none'
          : 'border rounded-xl'
      } ${
        isDarkMode 
          ? 'bg-slate-900 border-slate-800' 
          : 'bg-white border-slate-200'
      }`}
    >
      {/* Top Header / Control & Inspector bar */}
      <div 
        className={`px-4 py-3 border-b flex flex-col md:flex-row-reverse md:items-center md:justify-between gap-3 transition-all ${
          isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50/80 border-slate-100'
        }`}
      >
        {/* Real-time word inspector & actions */}
        <div className="flex-grow flex items-center justify-between md:justify-start gap-3 flex-wrap" style={{ direction: language === 'fa' ? 'rtl' : 'ltr' }}>
          {activeWord ? (
            <div className="flex items-center gap-3 flex-wrap animate-fade-in">
              {/* Direct Quick Actions */}
              <div className="flex items-center gap-3 flex-wrap">
                {whitelistGroups.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold shrink-0">
                      {t('دسته‌بندی کلمه', 'Categorize word')} <span className="text-indigo-600 dark:text-indigo-400 font-black">«{activeWord.text}»</span> {t('در:', 'in:')}
                    </span>
                    <select
                      value={targetGroupId}
                      onChange={(e) => setTargetGroupId(e.target.value)}
                      className={`text-xs px-2.5 py-1 rounded-md border bg-transparent font-medium cursor-pointer max-w-[150px] truncate outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 ${
                        isDarkMode 
                          ? 'border-slate-700 text-slate-200 bg-slate-900 hover:border-slate-600 focus:border-indigo-500' 
                          : 'border-slate-200 text-slate-700 bg-white hover:border-slate-300 focus:border-indigo-500'
                      }`}
                    >
                      {whitelistGroups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onAddToWhitelist(activeWord.text, targetGroupId)}
                    className="py-1 px-3 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs hover:shadow-md cursor-pointer active:scale-95"
                    title={t('افزودن مستقیم کلمه به لیست سفید', 'Add word directly to whitelist')}
                  >
                    <Plus className="w-3.5 h-3.5 shrink-0" />
                    <span>{t('افزودن به سفید', 'Add to Whitelist')}</span>
                  </button>
                  <button
                    onClick={() => onAddToStopWords(activeWord.text)}
                    className="py-1 px-3 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs hover:shadow-md cursor-pointer active:scale-95"
                    title={t('حذف کلمه از ابرکلمات', 'Remove word from word cloud')}
                  >
                    <EyeOff className="w-3.5 h-3.5 shrink-0" />
                    <span>{t('افزودن به استاپ', 'Add to Stopwords')}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Controls Container */}
        <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
          {/* Fullscreen toggle button */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer shadow-xs active:scale-95 ${
              isDarkMode 
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:border-slate-600' 
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
            }`}
            title={isFullscreen ? t('خروج از تمام‌صفحه', 'Exit Fullscreen') : t('نمایش تمام‌صفحه', 'Fullscreen')}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>{t('خروج از تمام‌صفحه', 'Exit Fullscreen')}</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>{t('تمام‌صفحه', 'Fullscreen')}</span>
              </>
            )}
          </button>

          {/* High quality PNG export trigger */}
          <button
            onClick={handleExportPNG}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer shadow-xs active:scale-95 ${
              isDarkMode 
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:border-slate-600' 
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
            }`}
            title={t('دانلود به عنوان تصویر PNG', 'Download as PNG image')}
          >
            <Download className="w-3.5 h-3.5 text-[#0057D9] shrink-0" />
            <span>{t('خروجی تصویر PNG', 'Export PNG Image')}</span>
          </button>
        </div>
      </div>

      {/* Main Word Cloud Viewport Area */}
      <div
        id="word-cloud-container"
        className={`relative w-full overflow-hidden flex items-center justify-center transition-all ${
          isFullscreen ? 'h-[calc(100vh-160px)] md:h-[calc(100vh-120px)]' : 'h-[360px]'
        }`}
      >
        {/* Background Graphic Grid Rings and Axes */}
        <div className="absolute inset-0 pointer-events-none select-none">
          <svg
            width="100%"
            height="100%"
            className="w-full h-full"
          >
            <g opacity={isDarkMode ? '0.08' : '0.04'}>
              <circle cx="50%" cy="50%" r="80" fill="none" stroke={isDarkMode ? '#38BDF8' : '#0057D9'} strokeWidth="1" />
              <circle cx="50%" cy="50%" r="160" fill="none" stroke={isDarkMode ? '#38BDF8' : '#0057D9'} strokeWidth="1" />
              <circle cx="50%" cy="50%" r="240" fill="none" stroke={isDarkMode ? '#38BDF8' : '#0057D9'} strokeWidth="1" />
              <line x1="0" y1="50%" x2="100%" y2="50%" stroke={isDarkMode ? '#38BDF8' : '#0057D9'} strokeWidth="1" />
              <line x1="50%" y1="0" x2="50%" y2="100%" stroke={isDarkMode ? '#38BDF8' : '#0057D9'} strokeWidth="1" />
            </g>
          </svg>
        </div>

        {/* Hovered/Selected Word Detail Indicator (Top Right) */}
        {activeWord && (
          <div 
            className={`absolute top-4 right-4 z-30 flex items-center gap-2 px-3 py-1.5 rounded-lg border shadow-sm backdrop-blur-md transition-all duration-300 transform translate-y-0 scale-100 ${
              isDarkMode 
                ? 'bg-slate-900/90 border-slate-800 text-slate-200' 
                : 'bg-white/95 border-slate-200 text-slate-800'
            }`}
            style={{ direction: language === 'fa' ? 'rtl' : 'ltr' }}
          >
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">{t('کلمه:', 'Word:')}</span>
            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 dark:bg-indigo-500/20 px-2 py-0.5 rounded">
              {activeWord.text}
            </span>
            <div className="w-[1px] h-3 bg-slate-200 dark:bg-slate-800" />
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">{t('تعداد تکرار:', 'Frequency:')}</span>
            <span className="text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/20 px-1.5 py-0.5 rounded font-mono">
              {activeWord.value}
            </span>
          </div>
        )}

        {processedWords.length === 0 ? (
          <div className={`text-center p-6 font-sans z-10 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            <p className="text-sm">{t('داده‌ای برای نمایش در ابرکلمات وجود ندارد.', 'No data to display in the word cloud.')}</p>
            <p className="text-xs mt-1">{t('کلمات کلیدی لیست سفید را تعریف کرده یا فایل CSV حاوی گفتگوها را آپلود کنید.', 'Define whitelist keywords or upload a CSV file containing conversations.')}</p>
          </div>
        ) : (
          <div className="w-full h-full relative z-10 p-4" key={isFullscreen ? 'fullscreen' : 'normal'}>
            <ReactWordcloud
              words={processedWords}
              options={options}
              callbacks={callbacks}
              minSize={[300, 300]}
            />
          </div>
        )}

        {/* Floating Legend / Information Banner */}
        <div className={`absolute bottom-3 right-3 left-3 flex justify-between items-center text-[9px] font-mono pointer-events-none z-20 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
          <span>{t('ابرکلمات تعاملی با کتابخانه react-wordcloud (تراز ۰ درجه)', 'Interactive word cloud with react-wordcloud (0° degree rotation)')}</span>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-[#F8FAFC]' : 'bg-[#0F172A]'}`} /> {t('تکرار بالا', 'High Frequency')}
            </span>
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-[#38BDF8]' : 'bg-[#2563EB]'}`} /> {t('تکرار متوسط', 'Medium Frequency')}
            </span>
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-[#94A3B8]' : 'bg-[#94A3B8]'}`} /> {t('تکرار کم', 'Low Frequency')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(WordCloud);
