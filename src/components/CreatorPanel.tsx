import React, { useState } from 'react';
import { VideoConfig, SecuritySettings } from '../types';
import { extractYouTubeId, encodeVideoConfig, parseTimeToSeconds } from '../utils/youtube';
import { 
  Link2, 
  Copy, 
  Check, 
  Code2, 
  Settings2, 
  Sparkles, 
  Clock, 
  ShieldAlert, 
  ExternalLink,
  HelpCircle,
  Eye,
  SlidersHorizontal
} from 'lucide-react';

interface CreatorPanelProps {
  currentConfig: VideoConfig;
  onUpdateConfig: (config: VideoConfig) => void;
  security: SecuritySettings;
  onUpdateSecurity: (settings: SecuritySettings) => void;
  onOpenGuide: () => void;
  onToggleViewerMode: () => void;
}

const PRESET_VIDEOS = [
  {
    name: 'المثال الحالي من كودك',
    id: 'pmq4iY8_cSE',
    title: 'مقطع فيديو تجريبي (الافتراضي)',
    watermark: 'أكاديمية المعرفة'
  },
  {
    name: 'محاضرة برمجية تعليمية',
    id: 'kJQP7kiw5Fk',
    title: 'مدخل إلى علوم الحاسوب وتطوير الويب',
    watermark: 'دورة البرمجة الاحترافية'
  },
  {
    name: 'وثائقي استكشافي بجودة عالية',
    id: 'LXb3EKWsInQ',
    title: 'رحلة استكشاف الطبيعة والكون',
    watermark: 'قناة الوثائقيات الخاصة'
  }
];

export const CreatorPanel: React.FC<CreatorPanelProps> = ({
  currentConfig,
  onUpdateConfig,
  security,
  onUpdateSecurity,
  onOpenGuide,
  onToggleViewerMode,
}) => {
  const [urlInput, setUrlInput] = useState(currentConfig.id);
  const [titleInput, setTitleInput] = useState(currentConfig.title || '');
  const [watermarkInput, setWatermarkInput] = useState(currentConfig.watermarkText || '');
  const [startTimeInput, setStartTimeInput] = useState(
    currentConfig.startSeconds ? String(currentConfig.startSeconds) : ''
  );
  const [endTimeInput, setEndTimeInput] = useState(
    currentConfig.endSeconds ? String(currentConfig.endSeconds) : ''
  );
  const [preventSeek, setPreventSeek] = useState(Boolean(currentConfig.preventSeek));
  const [loop, setLoop] = useState(Boolean(currentConfig.loop));

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle loading new video
  const handleApply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    const extractedId = extractYouTubeId(urlInput);
    if (!extractedId) {
      setErrorMessage('يرجى إدخال رابط يوتيوب صحيح أو معرّف الفيديو المكون من 11 حرفاً.');
      return;
    }

    const startSec = parseTimeToSeconds(startTimeInput);
    const endSec = parseTimeToSeconds(endTimeInput);

    const newConfig: VideoConfig = {
      id: extractedId,
      title: titleInput.trim() || undefined,
      watermarkText: watermarkInput.trim() || undefined,
      startSeconds: startSec > 0 ? startSec : undefined,
      endSeconds: endSec > 0 ? endSec : undefined,
      preventSeek,
      loop,
    };

    onUpdateConfig(newConfig);
  };

  const handleSelectPreset = (preset: typeof PRESET_VIDEOS[0]) => {
    setUrlInput(preset.id);
    setTitleInput(preset.title);
    setWatermarkInput(preset.watermark);
    setErrorMessage('');

    onUpdateConfig({
      ...currentConfig,
      id: preset.id,
      title: preset.title,
      watermarkText: preset.watermark,
    });
  };

  // Generate obfuscated shareable link
  const getProtectedShareUrl = () => {
    const token = encodeVideoConfig(currentConfig);
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}#v=${token}`;
  };

  // Generate embed code
  const getEmbedCode = () => {
    const shareUrl = getProtectedShareUrl();
    return `<iframe src="${shareUrl}" width="100%" height="480" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen style="border-radius:12px;border:none;"></iframe>`;
  };

  const copyToClipboard = (text: string, type: 'link' | 'embed') => {
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'link') {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2200);
      } else {
        setCopiedEmbed(true);
        setTimeout(() => setCopiedEmbed(false), 2200);
      }
    });
  };

  return (
    <div className="bg-[var(--beige-1)] border border-[var(--beige-3)] rounded-2xl p-4 sm:p-6 shadow-sm text-[var(--ink)] space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--beige-2)]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[var(--beige-2)] text-[var(--accent)]">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold">لوحة إعداد الفيديو وتوليد الروابط المحمية</h2>
            <p className="text-xs text-[var(--ink-soft)]">
              أدخل رابط أي فيديو وقم بإخفاء هويته ومعرّفه وتوليد رابط أو كود تضمين آمن
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--beige-2)]/70 hover:bg-[var(--beige-2)] text-xs font-medium text-[var(--ink)] transition"
          >
            <HelpCircle className="w-4 h-4 text-[var(--accent)]" />
            <span>كيف تعمل الحماية؟</span>
          </button>

          <button
            type="button"
            onClick={onToggleViewerMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow-sm transition"
            title="إخفاء لوحة التحكم وتجربة المشغل كزائر"
          >
            <Eye className="w-4 h-4" />
            <span>وضع المشاهد النظيف</span>
          </button>
        </div>
      </div>

      {/* Video Source Form */}
      <form onSubmit={handleApply} className="space-y-4">
        <div>
          <label className="block text-xs font-bold mb-1.5 text-[var(--ink)]">
            رابط فيديو يوتيوب أو معرّف الفيديو (Video URL / ID)
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="مثال: https://www.youtube.com/watch?v=pmq4iY8_cSE أو pmq4iY8_cSE"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--beige-0)] border border-[var(--beige-3)] focus:border-[var(--accent)] focus:outline-none text-xs sm:text-sm dir-ltr text-right transition"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 shrink-0"
            >
              <span>تطبيق على المشغل</span>
            </button>
          </div>
          {errorMessage && (
            <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              {errorMessage}
            </p>
          )}
        </div>

        {/* Quick presets */}
        <div>
          <span className="block text-[11px] text-[var(--ink-soft)] font-medium mb-1.5">
            نماذج سريعة للتجربة الفورية:
          </span>
          <div className="flex flex-wrap gap-2">
            {PRESET_VIDEOS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPreset(p)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition flex items-center gap-1 ${
                  currentConfig.id === p.id
                    ? 'bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--accent)] font-bold'
                    : 'bg-[var(--beige-0)] border-[var(--beige-2)] text-[var(--ink-soft)] hover:text-[var(--ink)] hover:border-[var(--beige-3)]'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Customization Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Custom Title */}
          <div>
            <label className="block text-xs font-semibold mb-1 text-[var(--ink-soft)]">
              عنوان بديل للفيديو (يخفي عنوان يوتيوب)
            </label>
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              placeholder="مثال: المحاضرة الأولى - مقدمة"
              className="w-full px-3 py-2 rounded-xl bg-[var(--beige-0)] border border-[var(--beige-3)] text-xs focus:border-[var(--accent)] focus:outline-none"
            />
          </div>

          {/* Watermark / Brand */}
          <div>
            <label className="block text-xs font-semibold mb-1 text-[var(--ink-soft)]">
              العلامة المائية / اسم المنصة
            </label>
            <input
              type="text"
              value={watermarkInput}
              onChange={(e) => setWatermarkInput(e.target.value)}
              placeholder="مثال: منصة أكاديميتي"
              className="w-full px-3 py-2 rounded-xl bg-[var(--beige-0)] border border-[var(--beige-3)] text-xs focus:border-[var(--accent)] focus:outline-none"
            />
          </div>

          {/* Start Time */}
          <div>
            <label className="block text-xs font-semibold mb-1 text-[var(--ink-soft)]">
              البدء من ثانية (أو mm:ss)
            </label>
            <div className="relative">
              <input
                type="text"
                value={startTimeInput}
                onChange={(e) => setStartTimeInput(e.target.value)}
                placeholder="0 أو 01:30"
                className="w-full px-3 py-2 rounded-xl bg-[var(--beige-0)] border border-[var(--beige-3)] text-xs focus:border-[var(--accent)] focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* End Time */}
          <div>
            <label className="block text-xs font-semibold mb-1 text-[var(--ink-soft)]">
              التوقف عند ثانية (اختياري)
            </label>
            <input
              type="text"
              value={endTimeInput}
              onChange={(e) => setEndTimeInput(e.target.value)}
              placeholder="فارغ للنهاية"
              className="w-full px-3 py-2 rounded-xl bg-[var(--beige-0)] border border-[var(--beige-3)] text-xs focus:border-[var(--accent)] focus:outline-none font-mono"
            />
          </div>
        </div>

        {/* Security & Restrictions toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2">
          {/* Crop YouTube borders (channel avatar, title, captions, watch on yt) */}
          <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[var(--beige-0)] border border-[var(--beige-2)] cursor-pointer hover:border-[var(--beige-3)] transition">
            <input
              type="checkbox"
              checked={security.cropYouTubeBorders !== false}
              onChange={(e) => onUpdateSecurity({ ...security, cropYouTubeBorders: e.target.checked })}
              className="w-4 h-4 accent-[var(--accent)] rounded"
            />
            <div className="text-xs">
              <span className="font-bold block">إخفاء صورة القناة وعناصر يوتيوب</span>
              <span className="text-[10px] text-[var(--ink-soft)]">قص حواف يوتيوب لمنع ظهور صورة القناة والعنوان</span>
            </div>
          </label>

          {/* Disable captions / CC */}
          <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[var(--beige-0)] border border-[var(--beige-2)] cursor-pointer hover:border-[var(--beige-3)] transition">
            <input
              type="checkbox"
              checked={security.disableCaptions !== false}
              onChange={(e) => onUpdateSecurity({ ...security, disableCaptions: e.target.checked })}
              className="w-4 h-4 accent-[var(--accent)] rounded"
            />
            <div className="text-xs">
              <span className="font-bold block">تعطيل الكابشن والترجمة (CC)</span>
              <span className="text-[10px] text-[var(--ink-soft)]">إلغاء تحميل نصوص وترجمات يوتيوب التلقائية</span>
            </div>
          </label>

          {/* Prevent Seek */}
          <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[var(--beige-0)] border border-[var(--beige-2)] cursor-pointer hover:border-[var(--beige-3)] transition">
            <input
              type="checkbox"
              checked={preventSeek}
              onChange={(e) => {
                setPreventSeek(e.target.checked);
                onUpdateConfig({ ...currentConfig, preventSeek: e.target.checked });
              }}
              className="w-4 h-4 accent-[var(--accent)] rounded"
            />
            <div className="text-xs">
              <span className="font-bold block">منع التقديم والتأخير</span>
              <span className="text-[10px] text-[var(--ink-soft)]">مفيد للاختبارات والدورات الإجبارية</span>
            </div>
          </label>

          {/* Floating dynamic watermark */}
          <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[var(--beige-0)] border border-[var(--beige-2)] cursor-pointer hover:border-[var(--beige-3)] transition">
            <input
              type="checkbox"
              checked={security.floatingWatermark}
              onChange={(e) => onUpdateSecurity({ ...security, floatingWatermark: e.target.checked })}
              className="w-4 h-4 accent-[var(--accent)] rounded"
            />
            <div className="text-xs">
              <span className="font-bold block">علامة مانعة لتصوير الشاشة</span>
              <span className="text-[10px] text-[var(--ink-soft)]">تظهر ختماً رقمياً متحركاً فوق الفيديو</span>
            </div>
          </label>

          {/* Loop playback */}
          <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[var(--beige-0)] border border-[var(--beige-2)] cursor-pointer hover:border-[var(--beige-3)] transition">
            <input
              type="checkbox"
              checked={loop}
              onChange={(e) => {
                setLoop(e.target.checked);
                onUpdateConfig({ ...currentConfig, loop: e.target.checked });
              }}
              className="w-4 h-4 accent-[var(--accent)] rounded"
            />
            <div className="text-xs">
              <span className="font-bold block">إعادة التشغيل تلقائياً (Loop)</span>
              <span className="text-[10px] text-[var(--ink-soft)]">إعادة الفيديو من البداية عند انتهائه</span>
            </div>
          </label>
        </div>
      </form>

      {/* Share & Embed Export Section */}
      <div className="pt-4 border-t border-[var(--beige-2)] space-y-3">
        <h3 className="text-xs font-bold text-[var(--ink-soft)] flex items-center gap-1.5">
          <Link2 className="w-4 h-4 text-[var(--accent)]" />
          <span>مشاركة وتضمين الفيديو المحمي:</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Obfuscated Share Link */}
          <div className="p-3 rounded-xl bg-[var(--beige-0)] border border-[var(--beige-2)] flex flex-col justify-between gap-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[var(--ink)]">رابط المشاهدة المباشر (المشفر)</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded font-mono">
                  معرّف يوتيوب مخفي
                </span>
              </div>
              <p className="text-[11px] text-[var(--ink-soft)] truncate font-mono dir-ltr text-right select-all">
                {getProtectedShareUrl()}
              </p>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(getProtectedShareUrl(), 'link')}
              className="w-full py-1.5 px-3 rounded-lg bg-[var(--beige-2)] hover:bg-[var(--beige-3)] text-xs font-bold text-[var(--ink)] flex items-center justify-center gap-1.5 transition"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'تم نسخ الرابط المشفر!' : 'نسخ الرابط لمشاركته مع الطلاب'}</span>
            </button>
          </div>

          {/* Embed iframe */}
          <div className="p-3 rounded-xl bg-[var(--beige-0)] border border-[var(--beige-2)] flex flex-col justify-between gap-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[var(--ink)]">كود التضمين في موقعك أو LMS</span>
                <span className="text-[10px] bg-blue-500/10 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded">
                  Iframe جاهز
                </span>
              </div>
              <p className="text-[11px] text-[var(--ink-soft)] truncate font-mono dir-ltr text-right select-all">
                {getEmbedCode()}
              </p>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(getEmbedCode(), 'embed')}
              className="w-full py-1.5 px-3 rounded-lg bg-[var(--beige-2)] hover:bg-[var(--beige-3)] text-xs font-bold text-[var(--ink)] flex items-center justify-center gap-1.5 transition"
            >
              {copiedEmbed ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Code2 className="w-3.5 h-3.5" />}
              <span>{copiedEmbed ? 'تم نسخ كود التضمين!' : 'نسخ كود الـ Iframe للتضمين'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
