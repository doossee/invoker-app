interface Props {
  type: 'method' | 'status';
  value: string | number;
}

const methodColors: Record<string, string> = {
  GET: 'bg-green-500/15 text-green-400',
  POST: 'bg-blue-500/15 text-blue-400',
  PUT: 'bg-amber-500/15 text-amber-400',
  PATCH: 'bg-purple-500/15 text-purple-400',
  DELETE: 'bg-red-500/15 text-red-400',
};

function statusColor(code: number): string {
  if (code === 0) return 'bg-red-500/15 text-red-400';
  if (code < 300) return 'bg-green-500/15 text-green-400';
  if (code < 400) return 'bg-amber-500/15 text-amber-400';
  return 'bg-red-500/15 text-red-400';
}

export function Badge({ type, value }: Props) {
  if (type === 'method') {
    const method = String(value).toUpperCase();
    const color = methodColors[method] ?? 'bg-gray-500/15 text-gray-400';
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-mono font-medium ${color}`}>
        {method}
      </span>
    );
  }

  const code = typeof value === 'number' ? value : parseInt(String(value), 10) || 0;
  const color = statusColor(code);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-mono font-medium ${color}`}>
      {code === 0 ? 'ERR' : code}
    </span>
  );
}
