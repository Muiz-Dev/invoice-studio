type ToastTone = "info" | "success" | "warning";

export type ToastState = {
  open: boolean;
  message: string;
  tone: ToastTone;
};

const toneStyles: Record<ToastTone, string> = {
  info: "bg-stone-900 text-stone-50",
  success: "bg-emerald-600 text-white",
  warning: "bg-amber-500 text-stone-950",
};

type ToastProps = {
  toast: ToastState;
  onClose: () => void;
};

export default function Toast({ toast, onClose }: ToastProps) {
  if (!toast.open) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <div
        className={`flex items-center gap-3 rounded-full px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] shadow-[0_18px_50px_rgba(15,10,5,0.25)] ${toneStyles[toast.tone]}`}
      >
        <span>{toast.message}</span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/20 px-3 py-1 text-[0.55rem] transition hover:bg-white/10"
        >
          Close
        </button>
      </div>
    </div>
  );
}
