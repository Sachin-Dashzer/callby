export default function Pagination({ page, pages, onPage }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        className="px-3 py-1 rounded bg-card text-gray-300 disabled:opacity-40 hover:bg-navy text-sm"
      >
        Prev
      </button>
      <span className="text-gray-400 text-sm">
        {page} / {pages}
      </span>
      <button
        disabled={page >= pages}
        onClick={() => onPage(page + 1)}
        className="px-3 py-1 rounded bg-card text-gray-300 disabled:opacity-40 hover:bg-navy text-sm"
      >
        Next
      </button>
    </div>
  );
}
