import React from 'react';
import { 
  ShieldCheck, 
  X, 
  MousePointer, 
  Lock, 
  EyeOff, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

interface SecurityGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityGuideModal: React.FC<SecurityGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="bg-[var(--beige-1)] border border-[var(--beige-3)] rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-5 sm:p-6 text-[var(--ink)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--beige-2)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--accent)]/15 text-[var(--accent)]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">كيف يمنع هذا المشغل الوصول للفيديو الأصلي؟</h3>
              <p className="text-xs text-[var(--ink-soft)]">شرح آليات الحماية وطبقة الدرع المدمجة</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--beige-2)] text-[var(--ink-soft)] hover:text-[var(--ink)] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4 text-sm leading-relaxed">
          <div className="p-3.5 rounded-xl bg-[var(--beige-0)] border border-[var(--beige-2)] flex gap-3">
            <Sliders className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold mb-1">1. عناصر التحكم مدمجة كلياً داخل إطار الفيديو</h4>
              <p className="text-xs text-[var(--ink-soft)]">
                جميع أزرار التشغيل، الصوت، شريط التقدم، السرعة، وملء الشاشة تطفو داخل مساحة الفيديو وتختفي بسلاسة تلقائياً عند المشاهدة دون وجود أي أشرطة خارجية تشوه التصميم.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--beige-0)] border border-[var(--beige-2)] flex gap-3">
            <EyeOff className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold mb-1">2. إخفاء صورة القناة وعنوان يوتيوب والكابشن (CC)</h4>
              <p className="text-xs text-[var(--ink-soft)]">
                يتم اقتصاص الحواف الخارجية بمقدار مدروس (<code className="font-mono bg-[var(--beige-2)] px-1 py-0.5 rounded text-[11px]">Border Cropping</code>) بحيث يتم إبعاد صورة صاحب القناة وعنوان يوتيوب وشعاره خارج الإطار المرئي، بالإضافة إلى تفريغ وتجميد وحدة الترجمة والكابشن التلقائية (<code className="font-mono bg-[var(--beige-2)] px-1 py-0.5 rounded text-[11px]">captions & CC unload</code>).
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--beige-0)] border border-[var(--beige-2)] flex gap-3">
            <MousePointer className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold mb-1">3. طبقة الدرع الشفافة العازلة (Interactive Shield)</h4>
              <p className="text-xs text-[var(--ink-soft)]">
                توضع طبقة غير مرئية تفصل المشاهد تماماً عن كود يوتيوب، فتلتقط النقرات للتشغيل أو الإيقاف دون أن يتمكن المشاهد من النقر على أي روابط ليوتيوب.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--beige-0)] border border-[var(--beige-2)] flex gap-3">
            <Lock className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold mb-1">4. حظر النقر باليمين وتشفير معرّف الفيديو</h4>
              <p className="text-xs text-[var(--ink-soft)]">
                تعطيل قائمة الفأرة بالزر الأيمن لمنع "نسخ رابط الفيديو"، وتشفير رابط المشاهدة المباشر بحيث لا يظهر رمز الفيديو الأصلي في شريط المتصفح.
              </p>
            </div>
          </div>

          {/* Golden Recommendations */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2 font-bold mb-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>نصائح أساسية من يوتيوب لضمان أقصى حماية:</span>
            </div>
            <ul className="text-xs space-y-1.5 list-disc list-inside text-amber-800 dark:text-amber-300">
              <li>
                اجعل حالة الفيديو في استوديو يوتيوب <strong>"غير مدرج" (Unlisted)</strong> لكي لا يظهر في نتائج البحث أو القناة.
              </li>
              <li>
                لا تجعله "خاصاً" (Private) لأن يوتيوب يمنع تضمين الفيديوهات الخاصة.
              </li>
              <li>
                تأكد من تفعيل خيار <strong>"السماح بالتضمين" (Allow Embedding)</strong> في إعدادات الفيديو بيوتيوب، وإلا سيعتذر المشغل عن تشغيله.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[var(--beige-2)] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium text-sm transition"
          >
            فهمت ذلك، شكراً
          </button>
        </div>
      </div>
    </div>
  );
};
