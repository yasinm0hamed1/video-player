import React, { useState, useEffect } from 'react';
import { SecurePlayer } from './components/SecurePlayer';
import { CreatorPanel } from './components/CreatorPanel';
import { SecurityGuideModal } from './components/SecurityGuideModal';
import { VideoConfig, SecuritySettings } from './types';
import { decodeVideoConfig } from './utils/youtube';
import { 
  ShieldCheck, 
  Moon, 
  Sun, 
  SlidersHorizontal, 
  Eye, 
  HelpCircle, 
  CheckCircle2, 
  Layers, 
  Lock, 
  Sparkles,
  Share2
} from 'lucide-react';

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('player_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('player_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Video Configuration
  const [videoConfig, setVideoConfig] = useState<VideoConfig>(() => {
    // Check if URL hash has an encoded token
    const hash = window.location.hash;
    if (hash.includes('v=')) {
      const token = hash.split('v=')[1]?.split('&')[0];
      if (token) {
        const decoded = decodeVideoConfig(token);
        if (decoded && decoded.id) {
          return decoded;
        }
      }
    }

    // Check localStorage
    const savedConfig = localStorage.getItem('secure_player_config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        if (parsed.id) return parsed;
      } catch (e) {}
    }

    // Default configuration (using the exact ID from user's snippet)
    return {
      id: 'pmq4iY8_cSE',
      title: 'عرض الفيديو المحمي',
      watermarkText: 'المشاهدة الآمنة',
      preventSeek: false,
      loop: false,
    };
  });

  // Security Options
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    blockRightClick: true,
    floatingWatermark: false,
    obscureUrl: true,
    blockKeyboardInspect: true,
    cropYouTubeBorders: true,
    disableCaptions: true,
  });

  // Check if opened directly via token in URL -> enable viewer mode by default
  const [isViewerMode, setIsViewerMode] = useState<boolean>(() => {
    return window.location.hash.includes('v=');
  });

  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Sync config with localStorage and URL hash
  const handleUpdateConfig = (newConfig: VideoConfig) => {
    setVideoConfig(newConfig);
    try {
      localStorage.setItem('secure_player_config', JSON.stringify(newConfig));
    } catch (e) {}
  };

  return (
    <div className="min-h-screen bg-[var(--beige-0)] text-[var(--ink)] flex flex-col justify-between transition-colors duration-200" dir="rtl">
      {/* Top Navbar */}
      <header className="border-b border-[var(--beige-3)]/60 bg-[var(--beige-1)]/70 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent)] text-white flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold tracking-tight flex items-center gap-2">
                <span>المشغل المحمي</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/20">
                  حماية ضد الاستخراج
                </span>
              </h1>
              <p className="text-[11px] text-[var(--ink-soft)] hidden sm:block">
                تشغيل أي فيديو يوتيوب دون إتاحة الوصول للرابط أو الواجهة الأصلية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[var(--beige-2)]/70 hover:bg-[var(--beige-2)] transition text-[var(--ink)]"
            >
              <HelpCircle className="w-4 h-4 text-[var(--accent)]" />
              <span>كيف تعمل الحماية؟</span>
            </button>

            <button
              type="button"
              onClick={() => setIsViewerMode(!isViewerMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
                isViewerMode
                  ? 'bg-[var(--accent)] text-white shadow-sm'
                  : 'bg-[var(--beige-2)] text-[var(--ink)] hover:bg-[var(--beige-3)]'
              }`}
              title={isViewerMode ? 'العودة للوحة الإعدادات' : 'معاينة وضع المشاهد النظيف'}
            >
              {isViewerMode ? <SlidersHorizontal className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span className="hidden sm:inline">
                {isViewerMode ? 'لوحة التحكم' : 'وضع المشاهد'}
              </span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-[var(--beige-2)] hover:bg-[var(--beige-3)] text-[var(--ink)] transition"
              title={theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}
              aria-label="تبديل المظهر"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 flex flex-col gap-6">
        {/* Title & Metadata if set */}
        {videoConfig.title && (
          <div className="flex items-center justify-between pb-1 border-b border-[var(--beige-2)]/50">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[var(--ink)]">
                {videoConfig.title}
              </h2>
              {videoConfig.watermarkText && (
                <p className="text-xs text-[var(--ink-soft)] mt-0.5">
                  بواسطة: {videoConfig.watermarkText}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>الرابط الأصلي محجوب</span>
            </div>
          </div>
        )}

        {/* The Secure Video Player Card */}
        <section aria-label="مشغل الفيديو المخصص">
          <SecurePlayer
            config={videoConfig}
            security={securitySettings}
          />
        </section>

        {/* Protection Highlights (shown in normal mode) */}
        {!isViewerMode && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-[var(--beige-1)] border border-[var(--beige-3)] flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[var(--accent)]/15 text-[var(--accent)] mt-0.5 shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold mb-0.5">تحكم مدمج داخل الإطار واختفاء تلقائي</h4>
                <p className="text-[11px] text-[var(--ink-soft)] leading-normal">
                  عناصر التحكم عائمة داخل الفيديو وتختفي بسلاسة عند المشاهدة دون تشويش.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--beige-1)] border border-[var(--beige-3)] flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[var(--accent)]/15 text-[var(--accent)] mt-0.5 shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold mb-0.5">حجب صورة القناة والكابشن (CC)</h4>
                <p className="text-[11px] text-[var(--ink-soft)] leading-normal">
                  قص الحواف وتعطيل الترجمة يمنعان ظهور هوية القناة أو روابط يوتيوب الأصلية.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--beige-1)] border border-[var(--beige-3)] flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[var(--accent)]/15 text-[var(--accent)] mt-0.5 shrink-0">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold mb-0.5">درع شفاف وتشفير معرّف الرابط</h4>
                <p className="text-[11px] text-[var(--ink-soft)] leading-normal">
                  حظر النقر باليمين وتشفير الرمز في الرابط المباشر لمنع استخراج الفيديو.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Creator / Configuration Panel */}
        {!isViewerMode && (
          <section aria-label="لوحة تخصيص ومشاركة الفيديو">
            <CreatorPanel
              currentConfig={videoConfig}
              onUpdateConfig={handleUpdateConfig}
              security={securitySettings}
              onUpdateSecurity={setSecuritySettings}
              onOpenGuide={() => setIsGuideOpen(true)}
              onToggleViewerMode={() => setIsViewerMode(true)}
            />
          </section>
        )}

        {/* In viewer mode, a subtle toggle back is available */}
        {isViewerMode && (
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => setIsViewerMode(false)}
              className="text-xs text-[var(--ink-soft)] hover:text-[var(--ink)] flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[var(--beige-1)] transition"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>فتح لوحة التحكم لتغيير الفيديو أو تعديل الإعدادات</span>
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--beige-3)]/60 bg-[var(--beige-1)]/40 py-4 px-4 text-center text-xs text-[var(--ink-soft)]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>مشغل الفيديو المحمي • تصميم مخصص بحماية طبقة الدرع الشفافة</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsGuideOpen(true)}
              className="hover:text-[var(--accent)] transition underline underline-offset-2"
            >
              دليل الأمان
            </button>
            <span>•</span>
            <span>يدعم التضمين في Moodle و WordPress والمواقع المخصصة</span>
          </div>
        </div>
      </footer>

      {/* Security Guide Modal */}
      <SecurityGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
