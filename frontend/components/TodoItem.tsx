export function TodoItem({
  title,
  date,
}: {
  title: string;
  date: string;
}) {
  return (
    <label className="flex items-start gap-3 border-b border-slate-100 py-2 text-sm">
      <input type="checkbox" className="mt-1 h-4 w-4" />
      <div>
        <div className="font-medium text-slate-800">{title}</div>
        <div className="text-xs text-slate-500">{date}</div>
      </div>
    </label>
  );
}
