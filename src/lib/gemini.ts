/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ============================================================================
// راهنمای استفاده از هوش مصنوعی گوگل (Gemini API) در برنامه ابرکلمات چت‌ها
// ============================================================================
// این فایل به درخواست شما برای نمونه‌کد و مستندسازی نحوه استفاده از کتابخانه @google/genai ایجاد شده است.
// توجه: برای حفظ امنیت کلید API و جلوگیری از افشای آن در مرورگر کاربران، کدهای این بخش کامنت شده‌اند.
// در یک سناریوی واقعی، پیشنهاد می‌شود فراخوانی‌های Gemini را در سمت سرور (Node.js/Express) پیاده‌سازی کنید 
// و کلاینت (ری‌اکت) را با یک API داخلی به سرور متصل نمایید.
// ============================================================================

/*
import { GoogleGenAI, Type } from "@google/genai";
import { ChatRow } from "../types";

// مقداردهی اولیه به کلاینت رسمی هوش مصنوعی گوگل با استفاده از کلید API
// نکته امنیتی: هیچ‌گاه کلید API را به صورت هاردکد در سورس کدهای کلاینت قرار ندهید!
const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || "YOUR_API_KEY",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build', // هدر مورد نیاز تل‌متری AI Studio
    }
  }
});

// ۱. انالیز پیشرفته موضوعات و حس و حال (Sentiment) گفتگوها با استفاده از Gemini 3.5 Flash
export async function analyzeChatsWithAI(chats: ChatRow[]): Promise<string> {
  if (chats.length === 0) return "هیچ گفتگویی برای تحلیل وجود ندارد.";

  // استخراج متن چت‌ها برای ارسال به مدل هوش مصنوعی
  const chatTexts = chats.slice(0, 30).map((chat, idx) => `[گفتگو ${idx + 1}]: ${chat.text}`).join("\n");

  const prompt = `
    شما یک آنالیزور داده‌های پشتیبانی مشتریان و پیام‌ها هستید.
    پیام‌های زیر را تحلیل کنید و یک گزارش شیک و خلاصه به زبان فارسی ارائه دهید که شامل موارد زیر باشد:
    ۱. موضوعات اصلی گفتگوها چیست؟
    ۲. دغدغه‌ها یا مشکلات عمده کاربران چیست؟
    ۳. حس و حال عمومی پیام‌ها (مثبت، منفی یا خنثی) را ارزیابی کنید.
    ۴. چه کلماتی پیشنهاد می‌کنید به عنوان کلمات استاپ (حروف ربط اضافی) فیلتر شوند تا ابر کلمات زیباتری داشته باشیم؟

    پیام‌ها:
    ${chatTexts}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    return response.text || "پاسخی از مدل دریافت نشد.";
  } catch (error) {
    console.error("خطا در ارتباط با Gemini API:", error);
    return "متاسفانه خطایی در تحلیل چت‌ها با هوش مصنوعی رخ داد.";
  }
}

// ۲. تولید هوشمند کلمات استاپ (Stop Words) جدید برای فیلتر کردن کلمات بیهوده بر اساس داده‌ها
export async function generateSuggestedStopWords(chats: ChatRow[]): Promise<string[]> {
  if (chats.length === 0) return [];

  const chatTexts = chats.slice(0, 50).map(c => c.text).join(" ");

  const prompt = `
    با توجه به نمونه متن چت‌های زیر، کلماتی که هیچ ارزش معنایی خاصی ندارند (مانند حروف اضافه، ربط، تعارفات تکراری، واژگان بسیار رایج) را شناسایی کنید.
    لیستی از حداقل ۱۵ کلمه استاپ (Stop Word) پر تکرار موجود در متن زیر را به صورت یک آرایه JSON خروجی دهید.

    متن گفتگوها:
    ${chatTexts.slice(0, 3000)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
          description: "لیست کلمات استاپ پیشنهادی استخراج شده از گفتگوها"
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text.trim()) as string[];
    }
    return [];
  } catch (error) {
    console.error("خطا در تولید هوشمند کلمات استاپ:", error);
    return [];
  }
}
*/
