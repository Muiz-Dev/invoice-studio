type ConfirmModalProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 px-4 py-8">
      <div className="w-full max-w-md rounded-[1.5rem] border border-stone-900/10 bg-white p-6 shadow-[0_30px_80px_rgba(15,10,5,0.2)]">
        <h3 className="text-lg font-semibold text-stone-900">{title}</h3>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-stone-600">
            {description}
          </p>
        ) : null}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-stone-900/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-600 transition hover:border-stone-900/30"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-stone-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-50 transition hover:bg-stone-800"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
