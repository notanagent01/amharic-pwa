export interface UpdateBannerProps {
  onUpdate: () => void
  onDismiss: () => void
}

export default function UpdateBanner({ onUpdate, onDismiss }: UpdateBannerProps) {
  return (
    <div className="fixed inset-x-0 top-0 z-50 border-b-2 border-emerald-400 bg-slate-900/95 px-4 py-3 text-slate-100 shadow-lg backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-3">
        <p className="flex-1 text-sm font-medium">New lessons available — refresh to update.</p>
        <button
          type="button"
          onClick={onUpdate}
          className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
        >
          Update now
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-md p-1 text-lg leading-none text-slate-200 transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
          aria-label="Dismiss update banner"
        >
          ×
        </button>
      </div>
    </div>
  )
}

