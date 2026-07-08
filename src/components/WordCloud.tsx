/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { WordMetadata } from '../types';

interface WordCloudProps {
  words: WordMetadata[];
  onWordClick: (word: WordMetadata) => void;
  selectedWord: WordMetadata | null;
  isDarkMode?: boolean;
}

interface PositionedWord extends WordMetadata {
  x: number;
  y: number;
  fontSize: number;
  color: string;
}

export default function WordCloud({ words, onWordClick, selectedWord, isDarkMode = false }: WordCloudProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });

  // Monitor container size to ensure responsiveness
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width: Math.max(width, 300),
          height: Math.max(height, 350)
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Compute positions of words in the cloud using an Archimedean spiral
  const positionedWords = useMemo(() => {
    if (words.length === 0) return [];

    const { width, height } = dimensions;
    const centerX = width / 2;
    const centerY = height / 2;

    // Sort words by value descending to place most frequent words in the center
    const sortedWords = [...words].sort((a, b) => b.value - a.value);

    const maxCount = sortedWords[0]?.value || 1;
    const minCount = sortedWords[sortedWords.length - 1]?.value || 1;

    const result: PositionedWord[] = [];

    // Simple collision detection helper
    const checkCollision = (
      x: number,
      y: number,
      textLength: number,
      fontSize: number,
      placed: { x: number; y: number; width: number; height: number }[]
    ) => {
      const w = textLength * fontSize * 0.65; // Estimated width
      const h = fontSize * 1.1; // Estimated height
      
      const rect1 = {
        left: x - w / 2,
        right: x + w / 2,
        top: y - h / 2,
        bottom: y + h / 2
      };

      for (const p of placed) {
        const rect2 = {
          left: p.x - p.width / 2,
          right: p.x + p.width / 2,
          top: p.y - p.height / 2,
          bottom: p.y + p.height / 2
        };

        // Check if rectangles overlap with a small padding
        const padding = 4;
        if (
          rect1.left - padding < rect2.right &&
          rect1.right + padding > rect2.left &&
          rect1.top - padding < rect2.bottom &&
          rect1.bottom + padding > rect2.top
        ) {
          return true;
        }
      }
      return false;
    };

    const placedRects: { x: number; y: number; width: number; height: number }[] = [];

    sortedWords.forEach((word) => {
      // Calculate font size relative to frequency
      // Max font size 44px, min font size 13px
      const sizeRange = maxCount - minCount || 1;
      const fontSize = 13 + Math.round(((word.value - minCount) / sizeRange) * 31);

      // Color selection based on weight (Deep Navy, Trust Blue, and Slate grays)
      // Trust Blue: #0057D9
      // Deep Navy: #0F172A
      // Slate grays: #475569, #64748B, #94A3B8
      let color = isDarkMode ? '#94A3B8' : '#64748B';
      const ratio = (word.value - minCount) / sizeRange;
      if (isDarkMode) {
        if (ratio > 0.75) {
          color = '#F8FAFC'; // Slate 50
        } else if (ratio > 0.4) {
          color = '#38BDF8'; // Sky 400
        } else if (ratio > 0.15) {
          color = '#94A3B8'; // Slate 400
        } else {
          color = '#64748B'; // Slate 500
        }
      } else {
        if (ratio > 0.75) {
          color = '#0F172A'; // Deep Navy
        } else if (ratio > 0.4) {
          color = '#0057D9'; // Trust Blue
        } else if (ratio > 0.15) {
          color = '#475569'; // Dark Slate
        } else {
          color = '#64748B'; // Medium Slate
        }
      }

      // Try placing the word starting from center and spiraling outwards
      let x = centerX;
      let y = centerY;
      let angle = 0;
      let radius = 0;
      const step = 4; // spiral resolution
      const maxIterations = 500;
      let placed = false;

      const wEstimate = word.text.length * fontSize * 0.65;
      const hEstimate = fontSize * 1.1;

      for (let i = 0; i < maxIterations; i++) {
        // Archimedean spiral: r = a + b * theta
        radius = 0.45 * angle;
        x = centerX + radius * Math.cos(angle);
        y = centerY + radius * Math.sin(angle) * 0.65; // Aspect ratio adjustment

        // Keep inside bounds with margin
        if (
          x - wEstimate / 2 > 15 &&
          x + wEstimate / 2 < width - 15 &&
          y - hEstimate / 2 > 15 &&
          y + hEstimate / 2 < height - 15
        ) {
          if (!checkCollision(x, y, word.text.length, fontSize, placedRects)) {
            result.push({
              ...word,
              x,
              y,
              fontSize,
              color
            });
            placedRects.push({
              x,
              y,
              width: wEstimate,
              height: hEstimate
            });
            placed = true;
            break;
          }
        }
        angle += step / (1 + radius * 0.1); // Dynamic step angle to spiral cleanly
      }

      // Fallback: If it couldn't place without overlap, just put it on the edges or ignore
      if (!placed) {
        // Place on a wider circle as fallback
        const fallbackAngle = Math.random() * Math.PI * 2;
        const fallbackRadius = Math.min(width, height) * 0.45;
        const fx = centerX + fallbackRadius * Math.cos(fallbackAngle);
        const fy = centerY + fallbackRadius * Math.sin(fallbackAngle) * 0.8;
        result.push({
          ...word,
          x: fx,
          y: fy,
          fontSize: Math.max(12, fontSize - 4),
          color: isDarkMode ? '#475569' : '#CBD5E1' // Gray slate
        });
      }
    });

    return result;
  }, [words, dimensions]);

  return (
    <div
      id="word-cloud-container"
      ref={containerRef}
      className={`relative w-full h-[400px] border rounded-xl overflow-hidden flex items-center justify-center transition-all duration-300 shadow-sm ${
        isDarkMode 
          ? 'bg-slate-900/40 border-slate-800' 
          : 'bg-white border-slate-200'
      }`}
    >
      {words.length === 0 ? (
        <div className={`text-center p-6 font-sans ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
          <p className="text-sm">داده‌ای برای نمایش در ابرکلمات وجود ندارد.</p>
          <p className="text-xs mt-1">کلمات کلیدی لیست سفید را تعریف کرده یا فایل CSV حاوی گفتگوها را آپلود کنید.</p>
        </div>
      ) : (
        <svg
          width={dimensions.width}
          height={dimensions.height}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          className="select-none"
        >
          {/* Defined Styles specifically for Persian Fonts */}
          <defs>
            <style>
              {`
                @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;700;800&display=swap');
                .persian-word {
                  font-family: 'Vazirmatn', 'Inter', sans-serif;
                  transition: all 0.2s ease-in-out;
                  cursor: pointer;
                  text-anchor: middle;
                  dominant-baseline: middle;
                }
                .persian-word:hover {
                  filter: drop-shadow(0 4px 8px ${isDarkMode ? 'rgba(56, 189, 248, 0.4)' : 'rgba(0, 87, 217, 0.25)'});
                  font-weight: 800;
                  transform: scale(1.08);
                }
              `}
            </style>
          </defs>
          
          {/* Render background grid pattern for subtle styling */}
          <g opacity={isDarkMode ? '0.08' : '0.04'}>
            <circle cx={dimensions.width / 2} cy={dimensions.height / 2} r="100" fill="none" stroke={isDarkMode ? '#38BDF8' : '#0057D9'} strokeWidth="1" />
            <circle cx={dimensions.width / 2} cy={dimensions.height / 2} r="200" fill="none" stroke={isDarkMode ? '#38BDF8' : '#0057D9'} strokeWidth="1" />
            <line x1="0" y1={dimensions.height / 2} x2={dimensions.width} y2={dimensions.height / 2} stroke={isDarkMode ? '#38BDF8' : '#0057D9'} strokeWidth="1" />
            <line x1={dimensions.width / 2} y1="0" x2={dimensions.width / 2} y2={dimensions.height} stroke={isDarkMode ? '#38BDF8' : '#0057D9'} strokeWidth="1" />
          </g>

          {positionedWords.map((word, idx) => {
            const isSelected = selectedWord?.text === word.text;
            const fallbackSelectedColor = isDarkMode ? '#38BDF8' : '#0057D9';
            return (
              <text
                key={`${word.text}-${idx}`}
                id={`word-item-${word.text}`}
                x={word.x}
                y={word.y}
                className="persian-word"
                style={{
                  fontSize: `${word.fontSize}px`,
                  fill: isSelected ? fallbackSelectedColor : word.color,
                  fontWeight: isSelected ? '800' : '500',
                  transformOrigin: `${word.x}px ${word.y}px`
                }}
                onClick={() => onWordClick(word)}
                title={`کلمه: ${word.text} | تعداد تکرار: ${word.value}`}
              >
                {word.text}
              </text>
            );
          })}
        </svg>
      )}

      {/* Floating Legend / Information Banner */}
      <div className={`absolute bottom-3 right-3 left-3 flex justify-between items-center text-[10px] font-mono pointer-events-none ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
        <span>نمایش افقی (چرخش ۰ درجه) برای خوانایی فارسی</span>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-[#F8FAFC]' : 'bg-[#0F172A]'}`} /> تکرار بالا
          </span>
          <span className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-[#38BDF8]' : 'bg-[#0057D9]'}`} /> تکرار متوسط
          </span>
          <span className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-[#94A3B8]' : 'bg-[#64748B]'}`} /> تکرار کم
          </span>
        </div>
      </div>
    </div>
  );
}
