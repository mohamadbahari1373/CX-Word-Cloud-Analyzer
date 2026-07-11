/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, memo } from 'react';
import ReactWordcloud from 'react-wordcloud';
import { WordMetadata } from '../types';
import { Download } from 'lucide-react';

interface WordCloudProps {
  words: WordMetadata[];
  onWordClick: (word: WordMetadata) => void;
  selectedWord: WordMetadata | null;
  isDarkMode?: boolean;
}

function WordCloud({ words, onWordClick, selectedWord, isDarkMode = false }: WordCloudProps) {
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
  }), []);

  // Customized callbacks for color, tooltip, and interactive clicks
  const callbacks = useMemo(() => ({
    getWordColor: (word: any) => {
      const isSelected = selectedWord?.text === word.text;
      const ratio = (word.value - minCount) / sizeRange;

      if (isSelected) {
        return isDarkMode ? '#38BDF8' : '#0057D9'; // Bright highlighting for selected
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
    getWordTooltip: (word: any) => `کلمه: ${word.text} | تعداد تکرار: ${word.value}`,
    onWordClick: (word: any) => {
      // Find the original WordMetadata reference and trigger callback
      const matched = words.find(w => w.text === word.text);
      if (matched) {
        onWordClick(matched);
      }
    }
  }), [processedWords, selectedWord, isDarkMode, minCount, sizeRange, words, onWordClick]);

  // Export word cloud SVG to PNG image
  const handleExportPNG = () => {
    const container = document.getElementById('word-cloud-container');
    if (!container) return;

    // ReactWordcloud renders its SVG inside a container with class .z-10
    const wordcloudDiv = container.querySelector('.z-10');
    if (!wordcloudDiv) return;
    const svgElement = wordcloudDiv.querySelector('svg');
    if (!svgElement) {
      alert('خطا: المان گرافیکی ابرکلمات یافت نشد.');
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

  return (
    <div
      id="word-cloud-container"
      className={`relative w-full h-[400px] border rounded-xl overflow-hidden flex items-center justify-center transition-all duration-300 shadow-sm ${
        isDarkMode 
          ? 'bg-slate-900/40 border-slate-800' 
          : 'bg-white border-slate-200'
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

      {processedWords.length === 0 ? (
        <div className={`text-center p-6 font-sans z-10 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
          <p className="text-sm">داده‌ای برای نمایش در ابرکلمات وجود ندارد.</p>
          <p className="text-xs mt-1">کلمات کلیدی لیست سفید را تعریف کرده یا فایل CSV حاوی گفتگوها را آپلود کنید.</p>
        </div>
      ) : (
        <>
          {/* High quality PNG export trigger */}
          <button
            onClick={handleExportPNG}
            className={`absolute top-3 left-3 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer shadow-xs ${
              isDarkMode 
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
            title="دانلود به عنوان تصویر PNG"
          >
            <Download className="w-3.5 h-3.5 text-[#0057D9]" />
            <span>خروجی تصویر PNG</span>
          </button>

          <div className="w-full h-full relative z-10 p-4">
            <ReactWordcloud
              words={processedWords}
              options={options}
              callbacks={callbacks}
              minSize={[300, 300]}
            />
          </div>
        </>
      )}

      {/* Floating Legend / Information Banner */}
      <div className={`absolute bottom-3 right-3 left-3 flex justify-between items-center text-[10px] font-mono pointer-events-none z-20 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
        <span>ابرکلمات تعاملی با کتابخانه react-wordcloud (تراز ۰ درجه)</span>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-[#F8FAFC]' : 'bg-[#0F172A]'}`} /> تکرار بالا
          </span>
          <span className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-[#38BDF8]' : 'bg-[#2563EB]'}`} /> تکرار متوسط
          </span>
          <span className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-[#94A3B8]' : 'bg-[#94A3B8]'}`} /> تکرار کم
          </span>
        </div>
      </div>
    </div>
  );
}

export default memo(WordCloud);
