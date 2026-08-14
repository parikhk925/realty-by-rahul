export default function StudioLoading() {
  return (
    <div
      className="mx-auto max-w-[1240px] animate-pulse px-4 py-6 sm:px-7 sm:py-8 lg:px-9"
      aria-label="Loading workspace"
      role="status"
    >
      <div className="h-5 w-28 rounded-full bg-primary/10" />
      <div className="mt-4 h-9 w-64 max-w-[70vw] rounded-xl bg-slate-200/75" />
      <div className="mt-3 h-4 w-80 max-w-[82vw] rounded-lg bg-slate-200/55" />

      <div className="mt-7 grid gap-4 md:grid-cols-3">
        <div className="h-28 rounded-[26px] border border-white/80 bg-white/70 shadow-[0_18px_50px_rgba(49,80,141,.06)]" />
        <div className="h-28 rounded-[26px] border border-white/80 bg-white/70 shadow-[0_18px_50px_rgba(49,80,141,.06)]" />
        <div className="h-28 rounded-[26px] border border-white/80 bg-white/70 shadow-[0_18px_50px_rgba(49,80,141,.06)]" />
      </div>

      <div className="mt-5 h-[340px] rounded-[30px] border border-white/80 bg-white/72 shadow-[0_24px_70px_rgba(46,80,147,.08)]" />
      <span className="sr-only">Loading workspace</span>
    </div>
  );
}
