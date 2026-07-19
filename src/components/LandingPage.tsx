import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Upload, 
  Database, 
  Sliders, 
  EyeOff, 
  Download, 
  TrendingUp, 
  CheckCircle, 
  Layers, 
  Shield, 
  Workflow, 
  MessageSquare, 
  Clock, 
  BarChart3, 
  Play,
  Check
} from 'lucide-react';
import { motion } from 'motion/react';

interface LandingPageProps {
  onLaunchApp: (mode?: 'login' | 'register') => void;
  isDarkMode: boolean;
  language: 'fa' | 'en';
}

export default function LandingPage({ onLaunchApp, isDarkMode, language }: LandingPageProps) {
  const t = (fa: string, en: string) => language === 'fa' ? fa : en;

  // Mock mini interactive states for the landing page hero widget
  const [activeHeroKeyword, setActiveHeroKeyword] = useState<string | null>(null);

  const heroKeywords = [
    { text: t('پشتیبانی', 'Support'), size: 'text-2xl md:text-3xl', color: 'text-indigo-500', count: 1240 },
    { text: t('واریز', 'Deposit'), size: 'text-lg md:text-xl', color: 'text-emerald-500', count: 850 },
    { text: t('احراز هویت', 'KYC'), size: 'text-xl md:text-2xl', color: 'text-amber-500', count: 980 },
    { text: t('کیف پول', 'Wallet'), size: 'text-base md:text-lg', color: 'text-rose-500', count: 620 },
    { text: t('کارمزد', 'Fee'), size: 'text-sm md:text-base', color: 'text-sky-500', count: 410 },
    { text: t('امنیت', 'Security'), size: 'text-lg md:text-xl', color: 'text-purple-500', count: 730 },
    { text: t('شتاب', 'Shetab'), size: 'text-xs md:text-sm', color: 'text-slate-400', count: 180 },
    { text: t('تراکنش', 'Transaction'), size: 'text-2xl md:text-3xl', color: 'text-indigo-600 dark:text-indigo-400', count: 1450 },
    { text: t('سریع', 'Fast'), size: 'text-sm md:text-base', color: 'text-teal-500', count: 340 },
  ];

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 overflow-x-hidden ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`} id="vibe-abraz-landing">
      {/* BACKGROUND DECORATIONS */}
      <div className="absolute top-0 left-0 right-0 h-[600px] pointer-events-none overflow-hidden z-0">
        <div className={`absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full blur-[120px] opacity-25 ${isDarkMode ? 'bg-indigo-600' : 'bg-indigo-200'}`} />
        <div className={`absolute top-[-10%] right-[-15%] w-[45%] h-[55%] rounded-full blur-[120px] opacity-20 ${isDarkMode ? 'bg-violet-600' : 'bg-violet-200'}`} />
      </div>

      {/* HERO SECTION */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-20 pb-16 w-full flex-grow flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero text information */}
          <div className="lg:col-span-7 flex flex-col text-center lg:text-right" style={{ direction: language === 'fa' ? 'rtl' : 'ltr' }}>
            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-6"
            >
              {language === 'fa' ? (
                <>
                  تحلیل و مهندسی <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">ابرکلمات</span> تجربه مشتریان
                </>
              ) : (
                <>
                  Customer Experience <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">Word Cloud</span> Engine
                </>
              )}
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className={`text-sm sm:text-base md:text-lg leading-relaxed mb-8 max-w-2xl ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}
            >
              {t(
                'تنها با یک کلیک، نویز گفتگوهای پشتیبانی، تیکت‌ها و بازخوردها را فیلتر کنید. با پردازش آماری کلمات کلیدی در قالب یک ابرکلمات پویا، ترندهای پرتکرار، مشکلات کاربران و اولویت‌های تجربه مشتری (CX) را فوراً شناسایی و صادر کنید.',
                'Filter out noise from support logs, tickets, and feedback in one click. Identify and export trending issues, customer pain points, and CX priorities instantly using a beautiful, interactive keyword word cloud.'
              )}
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
            >
              <button
                onClick={() => onLaunchApp('login')}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/35 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 group"
              >
                <Play className="w-4 h-4 fill-current shrink-0" />
                <span>{t('ورود به سیستم تحلیلگر', 'Launch Analyzer Workspace')}</span>
                {language === 'fa' ? (
                  <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 shrink-0" />
                ) : (
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 shrink-0" />
                )}
              </button>

              <button
                onClick={() => onLaunchApp('register')}
                className={`w-full sm:w-auto px-6 py-4 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all hover:bg-indigo-500/10 cursor-pointer ${
                  isDarkMode 
                    ? 'border-indigo-500/30 text-indigo-400 hover:border-indigo-500/50' 
                    : 'border-indigo-200 text-indigo-650 hover:border-indigo-300'
                }`}
              >
                <span>{t('ثبت نام', 'Sign Up')}</span>
              </button>

              <a
                href="#features-bento"
                className={`w-full sm:w-auto px-6 py-4 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all hover:bg-slate-500/5 cursor-pointer ${
                  isDarkMode 
                    ? 'border-slate-800 text-slate-300 hover:border-slate-700' 
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <span>{t('بررسی قابلیت‌های کلیدی', 'Explore Capabilities')}</span>
              </a>
            </motion.div>
          </div>

          {/* Hero interactive simulation widget */}
          <div className="lg:col-span-5 relative flex justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className={`w-full max-w-[420px] rounded-2xl border p-6 shadow-2xl relative overflow-hidden transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-slate-900/70 border-slate-800/80 shadow-indigo-500/5' 
                  : 'bg-white border-slate-200/80 shadow-slate-300/50'
              }`}
            >
              {/* Wordcloud Simulation Box */}
              <div className="h-[220px] w-full flex flex-wrap items-center justify-center gap-x-4 gap-y-2 relative rounded-xl p-3 border dark:border-slate-800/50 border-slate-100 bg-slate-500/5 select-none">
                {heroKeywords.map((word, index) => {
                  const isActive = activeHeroKeyword === word.text;
                  return (
                    <span
                      key={index}
                      onMouseEnter={() => setActiveHeroKeyword(word.text)}
                      onMouseLeave={() => setActiveHeroKeyword(null)}
                      className={`cursor-pointer transition-all duration-300 font-bold hover:scale-110 shrink-0 inline-block rounded-md px-1.5 py-0.5 ${word.size} ${word.color} ${
                        isActive ? 'bg-indigo-500/10 scale-105 shadow-xs' : ''
                      }`}
                    >
                      {word.text}
                    </span>
                  );
                })}
              </div>

              {/* Active word inspector drawer */}
              <div className="mt-4 pt-3 border-t dark:border-slate-800 border-slate-100 min-h-[50px] flex items-center justify-between text-xs transition-all duration-300">
                {activeHeroKeyword ? (
                  <>
                    <div className="flex items-center gap-1 font-mono w-full justify-center">
                      <span className="text-[10px] text-slate-400 font-bold">{t('تکرار کل:', 'Occurrences:')}</span>
                      <span className="bg-amber-500/15 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-black">
                        {heroKeywords.find(k => k.text === activeHeroKeyword)?.count}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className={`text-center w-full text-[10px] italic font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    {t('جهت شبیه‌سازی، نشانگر را روی کلمات نگه دارید', 'Hover over keywords to simulate actions')}
                  </div>
                )}
              </div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* STATS STRIP */}
      <section className={`border-y py-8 transition-colors duration-300 relative z-10 ${
        isDarkMode ? 'bg-slate-900/30 border-slate-900' : 'bg-white border-slate-100'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl md:text-3xl font-black text-indigo-600 dark:text-indigo-400 mb-1 font-mono">۹۹.۸٪</div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('دقت استخراج واژگان کلیدی', 'Keyword Extraction Precision')}</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-black text-indigo-600 dark:text-indigo-400 mb-1 font-mono">&lt; ۱.۲s</div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('سرعت پردازش و رندر سنگین', 'Processing Speed')}</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-black text-indigo-600 dark:text-indigo-400 mb-1 font-mono">۱۰+</div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('دسته‌بندی‌های موازی فعال', 'Parallel Whitelists')}</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-black text-indigo-600 dark:text-indigo-400 mb-1 font-mono">۱۰۰٪</div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('امنیت داده و پردازش کلاینت', 'Data Safety & Client Privacy')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES BENTO GRID */}
      <section id="features-bento" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 scroll-mt-10">
        <div className="text-center mb-16" style={{ direction: language === 'fa' ? 'rtl' : 'ltr' }}>
          <h2 className="text-2xl md:text-4xl font-black mb-4">
            {t('مهندسی ابزار با ویژگی‌های کاملاً حرفه‌ای', 'Professional-Grade Feature Architecture')}
          </h2>
          <p className={`text-xs md:text-sm max-w-2xl mx-auto font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {t(
              'تمام آنچه برای مهندسی و تحلیل گفتگوها و بازخوردهای تجربه مشتری نیاز دارید، در قالب یک سیستم یکپارچه قرار گرفته است.',
              'Everything you need to engineer and analyze customer feedback logs is integrated into a unified computational ecosystem.'
            )}
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Bento Card 1: Categorized Whitelist */}
          <div className={`md:col-span-8 rounded-2xl border p-6 flex flex-col justify-between hover:shadow-lg transition-all duration-300 relative overflow-hidden ${
            isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div style={{ direction: language === 'fa' ? 'rtl' : 'ltr' }}>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold mb-2">{t('لیست‌های سفید دسته‌بندی شده و هوشمند', 'Intelligent Categorized Whitelists')}</h3>
              <p className={`text-xs md:text-sm mb-6 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {t(
                  'کلمات کلیدی را در گروه‌های جداگانه مانند صرافی‌ها، کوین‌ها، پشتیبانی و غیره دسته‌بندی کنید. هر گروه مجهز به رنگ منحصربه‌فرد، تگ نشانگر اختصاصی و قابلیت غیرفعال‌سازی موقت است تا متناسب با تمرکز تحلیلی شما عمل کند.',
                  'Group critical keywords into custom categories such as Exchanges, Cryptocurrencies, and Support. Each group features a unique custom color preset, active status switch, and quick word addition.'
                )}
              </p>
            </div>


          </div>

          {/* Bento Card 2: Interactive Word Cloud */}
          <div className={`md:col-span-4 rounded-2xl border p-6 flex flex-col justify-between hover:shadow-lg transition-all duration-300 ${
            isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <div style={{ direction: language === 'fa' ? 'rtl' : 'ltr' }}>
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-4">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold mb-2">{t('ابرکلمات تعاملی تعاملی', 'Interactive Word Cloud')}</h3>
              <p className={`text-xs md:text-sm mb-4 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {t(
                  'ابرکلمات با چینش افقی (تراز صفر درجه برای خوانایی فوق‌العاده) که بر اساس فرکانس کلمات واکنش نشان می‌دهد. شما می‌توانید کلمات را مستقیماً از روی ابرکلمات به لیست سفید یا کلمات استاپ هدایت کنید.',
                  'Interactive high-performance word cloud layout aligned at 0° rotation for maximum Persian and English readability. Click directly on words to filter or whitelist them.'
                )}
              </p>
            </div>
          </div>

          {/* Bento Card 3: Stop Words Control */}
          <div className={`md:col-span-4 rounded-2xl border p-6 flex flex-col justify-between hover:shadow-lg transition-all duration-300 ${
            isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <div style={{ direction: language === 'fa' ? 'rtl' : 'ltr' }}>
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
                <EyeOff className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold mb-2">{t('حذف هوشمند کلمات استاپ', 'Stop Words Engineering')}</h3>
              <p className={`text-xs md:text-sm mb-4 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {t(
                  'فیلتر واژگان عمومی و حروف اضافه زبان فارسی و انگلیسی برای جلوگیری از نویزهای رایج در تحلیل متنی. کلمات را به سادگی به لیست استاپ اضافه کنید یا در آن جستجو نمایید.',
                  'Filter out conjunctions, pronouns, and generic conversational filler in both Persian and English. Keep the visual output clean and meaningful.'
                )}
              </p>
            </div>
          </div>

          {/* Bento Card 4: Shamsi Analytics */}
          <div className={`md:col-span-8 rounded-2xl border p-6 flex flex-col justify-between hover:shadow-lg transition-all duration-300 relative overflow-hidden ${
            isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div style={{ direction: language === 'fa' ? 'rtl' : 'ltr' }}>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold mb-2">{t('تحلیل زمانی و نمودار روند شمسی', 'Shamsi Temporal Analytics & Trending')}</h3>
              <p className={`text-xs md:text-sm mb-6 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {t(
                  'تبدیل هوشمند تاریخ گفتگوها به تقویم هجری شمسی، فیلترینگ بازه‌های زمانی با انتخابگر اختصاصی، و رسم نمودارهای ردیابی فرکانس روزانه کلمات کلیدی انتخاب شده به منظور ردیابی امواج اعتراضات یا رضایت کاربران در کانال‌های ارتباطی.',
                  'Convert conversation times to Shamsi (Jalali) dates instantly. Filter by date-ranges and display temporal trends in interactive area charts to track and pinpoint specific feedback waves.'
                )}
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className={`py-20 transition-colors duration-300 ${
        isDarkMode ? 'bg-slate-900/10' : 'bg-slate-100/50'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16" style={{ direction: language === 'fa' ? 'rtl' : 'ltr' }}>
            <h2 className="text-2xl md:text-4xl font-black mb-4">
              {t('سه گام ساده برای مهندسی داده‌ها', 'Three Simple Steps to Data Engineering')}
            </h2>
            <p className={`text-xs md:text-sm max-w-2xl mx-auto font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {t(
                'تنها در چند دقیقه فایل گفتگوهای خود را تحلیل کرده و روندهای مهم تجربه کاربری را استخراج نمایید.',
                'Analyze your conversation records in minutes and extract deep user feedback insights.'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center p-6" style={{ direction: language === 'fa' ? 'rtl' : 'ltr' }}>
              <div className="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center font-mono text-xl font-black shadow-lg shadow-indigo-600/20 mb-6 relative">
                1
              </div>
              <h3 className="text-base font-bold mb-3">{t('بارگذاری فایل یا داده‌های نمونه', 'Upload Files or Load Sample Data')}</h3>
              <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {t(
                  'فایل CSV گفتگوهای خود را درون‌ریزی کنید یا برای شروع سریع، داده‌های نمونه شبیه‌سازی شده ما را به صورت آفلاین فعال کنید.',
                  'Import your support chat CSV file or load our high-fidelity, built-in customer experience sample database in one click.'
                )}
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center p-6" style={{ direction: language === 'fa' ? 'rtl' : 'ltr' }}>
              <div className="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center font-mono text-xl font-black shadow-lg shadow-indigo-600/20 mb-6">
                2
              </div>
              <h3 className="text-base font-bold mb-3">{t('مدیریت و فیلتر واژگان', 'Refine and Cleanse Keywords')}</h3>
              <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {t(
                  'لیست کلمات استاپ و کلمات سفید دسته‌بندی شده خود را شخصی‌سازی کنید. با این کار کلمات تکراری و بی‌ربط حذف شده و کلمات مهم برجسته می‌شوند.',
                  'Customize stop words and categorizations to strip away useless conversational fillers, allowing genuine trend vectors to stand out.'
                )}
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center p-6" style={{ direction: language === 'fa' ? 'rtl' : 'ltr' }}>
              <div className="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center font-mono text-xl font-black shadow-lg shadow-indigo-600/20 mb-6">
                3
              </div>
              <h3 className="text-base font-bold mb-3">{t('تحلیل روندها و گزارش نهایی', 'Analyze and Export Insights')}</h3>
              <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {t(
                  'ابرکلمات نهایی را با بالاترین وضوح مشاهده کنید، روندهای تاریخی را بر اساس تاریخ هجری شمسی بسنجید و گزارش‌های تصویری را استخراج نمایید.',
                  'Generate the pristine word cloud, monitor temporal trend curves over Shamsi dates, and export premium graphic images for stakeholders.'
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL BOTTOM CALL-TO-ACTION */}
      <section className="py-20 relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          whileHover={{ y: -3 }}
          transition={{ duration: 0.3 }}
          className="rounded-3xl border p-8 md:p-12 text-center relative overflow-hidden bg-gradient-to-br from-indigo-900/10 via-indigo-950/5 to-transparent border-indigo-500/15 dark:border-slate-800/80 shadow-2xl"
          style={{ direction: language === 'fa' ? 'rtl' : 'ltr' }}
        >
          <div className="absolute top-[-50px] left-[-50px] w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-50px] right-[-50px] w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <h2 className="text-2xl md:text-3xl font-black mb-4">
            {t('همین حالا بهبود تجربه کاربران خود را آغاز کنید', 'Empower Customer Sentiment Analysis Today')}
          </h2>
          <p className={`text-xs md:text-sm max-w-xl mx-auto mb-8 font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-400'}`}>
            {t(
              'تمام کدهای تحلیلی ما به صورت کاملاً آفلاین و سریع در مرورگر شما پردازش شده و پایگاه داده با همگام‌سازی ابری امن محافظت می‌شود.',
              'All calculation processes are executed secure and fast inside your client environment with durable background database synchronization.'
            )}
          </p>

          <button
            onClick={onLaunchApp}
            className="px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm inline-flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse shrink-0" />
            <span>{t('شروع آنی و رایگان بدون محدودیت', 'Launch Analyzer Panel Instantly')}</span>
          </button>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className={`border-t py-8 mt-auto transition-colors duration-300 relative z-10 ${
        isDarkMode ? 'bg-slate-950 border-slate-900 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-400'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs font-semibold">
          <p className="mb-2">vibe Abraz © 2026</p>
          <p className="opacity-80">
            {t(
              'طراحی شده به عنوان راهکار پیشرفته مهندسی تجربه مشتری در کانال‌های ارتباطی',
              'Advanced Analytics Suite for Enterprise Customer Experience Engineering'
            )}
          </p>
        </div>
      </footer>
    </div>
  );
}
