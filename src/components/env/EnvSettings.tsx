import { useEffect, useRef, useState } from 'react';
import { X, Plus, Trash2, ChevronDown, ChevronRight, Copy, RotateCcw, Palette, Check } from 'lucide-react';
import { useEnvStore } from '@/stores/env-store';
import { KeyValueTable } from '@/components/shared/KeyValueTable';
import { isPublished } from '@/lib/platform';
import { useTheme } from '@/themes/theme-provider';
import type { IvkEnvironment } from 'ivkjs';

interface Props {
  onClose: () => void;
}

export function EnvSettings({ onClose }: Props) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState<Record<number, string>>({});
  const [newEnvName, setNewEnvName] = useState('');
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [copyDone, setCopyDone] = useState(false);

  const settings = useEnvStore((s) => s.settings);
  const setActiveEnv = useEnvStore((s) => s.setActiveEnv);
  const addEnvironment = useEnvStore((s) => s.addEnvironment);
  const deleteEnvironment = useEnvStore((s) => s.deleteEnvironment);
  const persist = useEnvStore((s) => s.persist);
  const resetToDefaults = useEnvStore((s) => s.resetToDefaults);
  const authorDefaults = useEnvStore((s) => s.authorDefaults);
  const hasDefaults = isPublished() && Object.keys(authorDefaults).length > 0;

  const { theme: activeTheme, setTheme: setActiveTheme, themes: availableThemes } = useTheme();

  const envs: IvkEnvironment[] = settings.environments;

  // Close on backdrop click
  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === backdropRef.current) onClose();
  }

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  function toggleExpand(index: number) {
    setExpandedIndex((prev) => (prev === index ? null : index));
    // Init the name edit field on expand
    if (!(index in editingName)) {
      setEditingName((prev) => ({ ...prev, [index]: envs[index].name }));
    }
  }

  function handleNameChange(index: number, value: string) {
    setEditingName((prev) => ({ ...prev, [index]: value }));
  }

  function commitNameChange(index: number) {
    const newName = (editingName[index] ?? envs[index].name).trim();
    if (!newName || newName === envs[index].name) return;
    useEnvStore.setState((state) => {
      const environments = state.settings.environments.map((env, i) =>
        i === index ? { ...env, name: newName } : env
      );
      return { settings: { ...state.settings, environments } };
    });
    persist();
  }

  function handleVariablesChange(index: number, variables: Record<string, string>) {
    useEnvStore.setState((state) => {
      const environments = state.settings.environments.map((env, i) =>
        i === index ? { ...env, variables } : env
      );
      return { settings: { ...state.settings, environments } };
    });
    persist();
  }

  function handleAddEnv() {
    const name = newEnvName.trim();
    if (!name) return;
    addEnvironment(name);
    setNewEnvName('');
    // Expand the newly added env
    setExpandedIndex(envs.length);
    setEditingName((prev) => ({ ...prev, [envs.length]: name }));
  }

  function handleDelete(index: number) {
    deleteEnvironment(index);
    if (expandedIndex === index) setExpandedIndex(null);
    else if (expandedIndex !== null && expandedIndex > index) {
      setExpandedIndex(expandedIndex - 1);
    }
  }

  function handleExport() {
    const text = JSON.stringify(settings.environments, null, 2);
    navigator.clipboard.writeText(text).then(() => {
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2000);
    });
  }

  function handleImport() {
    try {
      const parsed = JSON.parse(importText);
      if (!Array.isArray(parsed)) throw new Error('Expected an array of environments');
      useEnvStore.setState((state) => ({
        settings: {
          ...state.settings,
          environments: parsed as IvkEnvironment[],
          activeEnvironmentIndex: 0,
        },
      }));
      persist();
      setImportText('');
      setImportError('');
      setActiveEnv(0);
    } catch (e) {
      setImportError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  }

  const varCount = (env: IvkEnvironment) => Object.keys(env.variables || {}).length;

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-20"
    >
      <div className="bg-surface border border-border rounded-lg shadow-2xl w-[600px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <h2 className="text-sm font-semibold text-text-primary">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Theme picker */}
        <div className="px-4 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-1.5 mb-2">
            <Palette size={14} className="text-text-muted" />
            <span className="text-xs font-semibold text-text-primary">Theme</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {availableThemes.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTheme(t.id)}
                className={`flex items-center gap-2 px-2.5 py-2 rounded text-xs transition-colors text-left ${
                  activeTheme.id === t.id
                    ? 'bg-accent/10 text-accent ring-1 ring-accent/30'
                    : 'bg-surface-2 text-text-dim hover:text-text-primary hover:bg-surface-2/80'
                }`}
              >
                {/* Color preview dots */}
                <div className="flex gap-0.5 flex-shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: t.colors.bg }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: t.colors.accent }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: t.colors.success }} />
                </div>
                <span className="flex-1 truncate">{t.name}</span>
                {activeTheme.id === t.id && <Check size={12} className="flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Environments section header */}
        <div className="px-4 pt-3 pb-1 flex-shrink-0">
          <span className="text-xs font-semibold text-text-primary">Environments</span>
        </div>

        {/* Env list */}
        <div className="flex-1 overflow-y-auto">
          {envs.map((env, index) => (
            <div key={index} className="border-b border-border last:border-0">
              {/* Env row */}
              <div
                className="flex items-center gap-2 px-4 py-3 hover:bg-surface-2 cursor-pointer transition-colors"
                onClick={() => toggleExpand(index)}
              >
                {expandedIndex === index ? (
                  <ChevronDown size={14} className="text-text-muted flex-shrink-0" />
                ) : (
                  <ChevronRight size={14} className="text-text-muted flex-shrink-0" />
                )}
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: env.color ?? '#22c55e' }}
                />
                <span className="flex-1 text-sm text-text-primary">{env.name}</span>
                <span className="text-xs text-text-muted mr-2">
                  {varCount(env)} variable{varCount(env) !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(index);
                  }}
                  className="p-1 rounded hover:bg-surface text-text-muted hover:text-red-400 transition-colors"
                  title="Delete environment"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Expanded content */}
              {expandedIndex === index && (
                <div className="px-4 pb-4 space-y-3 bg-bg/30">
                  {/* Name edit */}
                  <div className="flex items-center gap-2 pt-1">
                    <label className="text-xs text-text-dim w-12 flex-shrink-0">Name</label>
                    <input
                      type="text"
                      value={editingName[index] ?? env.name}
                      onChange={(e) => handleNameChange(index, e.target.value)}
                      onBlur={() => commitNameChange(index)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        }
                      }}
                      className="flex-1 bg-surface-2 text-text-primary text-xs px-2 py-1.5 rounded border border-transparent focus:border-accent/50 focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        setActiveEnv(index);
                      }}
                      className={`text-xs px-2 py-1 rounded transition-colors ${
                        settings.activeEnvironmentIndex === index
                          ? 'bg-accent/20 text-accent'
                          : 'bg-surface-2 text-text-dim hover:text-text-primary'
                      }`}
                    >
                      {settings.activeEnvironmentIndex === index ? 'Active' : 'Set active'}
                    </button>
                  </div>

                  {/* Variables */}
                  <div>
                    <p className="text-xs text-text-dim mb-2">Variables</p>
                    <KeyValueTable
                      entries={env.variables || {}}
                      onChange={(vars) => handleVariablesChange(index, vars)}
                      keyPlaceholder="Variable name"
                      valuePlaceholder="Value"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add environment */}
          <div className="px-4 py-3 border-t border-border">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="New environment name"
                value={newEnvName}
                onChange={(e) => setNewEnvName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddEnv();
                }}
                className="flex-1 bg-surface-2 text-text-primary text-xs px-2 py-1.5 rounded border border-transparent focus:border-accent/50 focus:outline-none"
              />
              <button
                onClick={handleAddEnv}
                disabled={!newEnvName.trim()}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded bg-accent/10 text-accent hover:bg-accent/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus size={12} />
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Reset to author defaults (published mode only) */}
        {hasDefaults && (
          <div className="px-4 py-3 border-t border-border flex-shrink-0">
            <div className="flex items-center gap-2">
              <p className="text-xs text-text-dim flex-1">Override author defaults</p>
              <button
                onClick={resetToDefaults}
                className="flex items-center gap-1.5 text-xs px-2 py-1 rounded bg-surface-2 text-text-dim hover:text-text-primary transition-colors"
              >
                <RotateCcw size={12} />
                Reset to defaults
              </button>
            </div>
          </div>
        )}

        {/* Import/Export footer */}
        <div className="px-4 py-3 border-t border-border flex-shrink-0 space-y-2">
          <div className="flex items-center gap-2">
            <p className="text-xs text-text-dim flex-1">Import / Export</p>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 text-xs px-2 py-1 rounded bg-surface-2 text-text-dim hover:text-text-primary transition-colors"
            >
              <Copy size={12} />
              {copyDone ? 'Copied!' : 'Export to clipboard'}
            </button>
          </div>
          <div className="flex items-start gap-2">
            <textarea
              placeholder="Paste JSON array of environments here..."
              value={importText}
              onChange={(e) => {
                setImportText(e.target.value);
                setImportError('');
              }}
              rows={3}
              className="flex-1 bg-surface-2 text-text-primary text-xs font-mono px-2 py-1.5 rounded border border-transparent focus:border-accent/50 focus:outline-none resize-none"
            />
            <button
              onClick={handleImport}
              disabled={!importText.trim()}
              className="text-xs px-3 py-1.5 rounded bg-accent/10 text-accent hover:bg-accent/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-0.5"
            >
              Import
            </button>
          </div>
          {importError && (
            <p className="text-xs text-red-400">{importError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
