import { useMemo } from 'react';
import { useEnv } from '@/hooks/useEnv';
import type { IvkRequest } from 'ivkjs';

interface Props {
  request: IvkRequest;
}

const VAR_REGEX = /\{\{(\w+)\}\}/g;

function extractVarNames(request: IvkRequest): string[] {
  const names = new Set<string>();
  const sources = [
    request.url,
    request.body,
    request.directives.auth ?? '',
    ...Object.values(request.headers),
    ...Object.values(request.directives).filter((v): v is string => typeof v === 'string'),
  ];

  for (const source of sources) {
    VAR_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = VAR_REGEX.exec(source)) !== null) {
      names.add(match[1]);
    }
  }

  return Array.from(names).sort();
}

export function VarsTab({ request }: Props) {
  const { get, setVariable } = useEnv();

  const varNames = useMemo(() => extractVarNames(request), [request]);

  if (varNames.length === 0) {
    return (
      <div className="p-3 text-xs text-text-muted italic">
        No variables referenced in this request.
      </div>
    );
  }

  return (
    <div className="p-3 space-y-1">
      {varNames.map((name) => {
        const value = get(name);
        const isSet = value !== undefined;

        return (
          <div key={name} className="flex items-center gap-2">
            <code
              className={`text-xs font-mono w-32 truncate ${isSet ? 'text-var-set' : 'text-var-unset'}`}
            >
              {`{{${name}}}`}
            </code>
            <input
              type="text"
              value={value ?? ''}
              onChange={(e) => setVariable(name, e.target.value)}
              placeholder="not set"
              className="flex-1 bg-surface-2 text-text-primary text-xs font-mono px-2 py-1.5 rounded border border-transparent focus:border-accent/50 focus:outline-none"
            />
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                isSet
                  ? 'bg-green-500/15 text-green-400'
                  : 'bg-red-500/15 text-red-400'
              }`}
            >
              {isSet ? 'SET' : 'NOT SET'}
            </span>
          </div>
        );
      })}
    </div>
  );
}
