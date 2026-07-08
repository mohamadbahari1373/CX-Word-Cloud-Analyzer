/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ChatRow {
  id: string;
  originalIndex: number;
  // All headers parsed from the CSV row
  data: Record<string, string>;
  // The auto-detected or user-selected column for text analysis
  text: string;
}

export interface WhitelistWord {
  id: string;
  word: string;
  createdAt: number;
}

export interface WhitelistGroup {
  id: string;
  name: string;
  words: WhitelistWord[];
  isActive: boolean;
  createdAt: number;
}

export interface WordMetadata {
  text: string;
  value: number; // frequency count
  percentage: number;
  chatIndices: string[]; // IDs of ChatRow containing this word
  groupName?: string; // Optional group name it belongs to
}

export interface AnalysisResult {
  totalChats: number;
  matchedChatsCount: number;
  wordFrequencies: Record<string, number>;
  wordDetails: Record<string, WordMetadata>;
}
