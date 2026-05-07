// src/components/welcome/RecentColumn.test.tsx
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecentColumn } from './RecentColumn';
import { useCollectionStore } from '@/stores/collection-store';
import { useDocsStore } from '@/stores/docs-store';
import { useEditorStore } from '@/stores/editor-store';
import { useRecentStore } from '@/stores/recent-store';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-05-07T10:00:00Z'));
  useCollectionStore.setState({
    files: [
      { path: 'auth/login.ivk', name: 'login', content: 'POST https://x' },
    ],
    inlineFiles: {},
    activeFilePath: null,
    collectionPath: '/test',
  });
  useDocsStore.setState({ docs: [] });
  useEditorStore.setState({ tabs: [], activeTabPath: null });
  useRecentStore.setState({ recent: [], collectionPath: '/test' });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('RecentColumn', () => {
  it('renders empty-state hint when no recent', () => {
    render(<RecentColumn />);
    expect(screen.getByText(/start building history/i)).toBeInTheDocument();
  });

  it('renders one row per recent entry, head first', () => {
    useRecentStore.setState({
      recent: [{ path: 'auth/login.ivk', openedAt: Date.now() - 60_000 }],
      collectionPath: '/test',
    });
    render(<RecentColumn />);
    expect(screen.getByText('login')).toBeInTheDocument();
  });

  it('clicking a recent row opens it as a tab', async () => {
    // userEvent (v14) schedules internal microtasks via real timers; switch
    // off the fake timers from beforeEach for this single interaction test.
    vi.useRealTimers();
    useRecentStore.setState({
      recent: [{ path: 'auth/login.ivk', openedAt: Date.now() }],
      collectionPath: '/test',
    });
    render(<RecentColumn />);
    await userEvent.click(screen.getByText('login'));
    expect(useEditorStore.getState().tabs).toEqual([
      expect.objectContaining({ path: 'auth/login.ivk' }),
    ]);
  });

  it('relative-time formatter: <60s → "now"', () => {
    useRecentStore.setState({
      recent: [{ path: 'auth/login.ivk', openedAt: Date.now() - 30_000 }],
      collectionPath: '/test',
    });
    render(<RecentColumn />);
    expect(screen.getByText('now')).toBeInTheDocument();
  });

  it('relative-time formatter: minutes → "5m"', () => {
    useRecentStore.setState({
      recent: [{ path: 'auth/login.ivk', openedAt: Date.now() - 5 * 60_000 }],
      collectionPath: '/test',
    });
    render(<RecentColumn />);
    expect(screen.getByText('5m')).toBeInTheDocument();
  });

  it('relative-time formatter: hours → "2h"', () => {
    useRecentStore.setState({
      recent: [{ path: 'auth/login.ivk', openedAt: Date.now() - 2 * 3600_000 }],
      collectionPath: '/test',
    });
    render(<RecentColumn />);
    expect(screen.getByText('2h')).toBeInTheDocument();
  });

  it('relative-time formatter: days → "3d"', () => {
    useRecentStore.setState({
      recent: [{ path: 'auth/login.ivk', openedAt: Date.now() - 3 * 86400_000 }],
      collectionPath: '/test',
    });
    render(<RecentColumn />);
    expect(screen.getByText('3d')).toBeInTheDocument();
  });

  it('marks stale paths visually with (missing) suffix', () => {
    useRecentStore.setState({
      recent: [{ path: 'gone/never.ivk', openedAt: Date.now() }],
      collectionPath: '/test',
    });
    render(<RecentColumn />);
    expect(screen.getByText(/missing/i)).toBeInTheDocument();
  });
});
