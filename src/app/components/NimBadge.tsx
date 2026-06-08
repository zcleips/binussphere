// ─── NimBadge ─────────────────────────────────────────────────────────────────
// Shows "B28" style badge derived from the user's NIM.
// Usage: <NimBadge nim={post.author.nim} />
// Returns null if NIM is missing or invalid.

export default function NimBadge({ nim }: { nim: string | null | undefined }) {
  if (!nim || !/^\d{10}$/.test(nim)) return null;
  const label = `B${nim[0]}${nim[1]}`;
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400 tracking-wide">
      {label}
    </span>
  );
}