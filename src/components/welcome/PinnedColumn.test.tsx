// src/components/welcome/PinnedColumn.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PinnedColumn } from './PinnedColumn';
import { useCollectionStore } from '@/stores/collection-store';
import { useDocsStore } from '@/stores/docs-store';
import { useEditorStore } from '@/stores/editor-store';
import { usePinnedStore } from '@/stores/pinned-store';

beforeEach(() => {
  localStorage.clear();
  useCollectionStore.setState({
    files: [
      { path: 'auth/login.ivk', name: 'login', content: 'POST https://x' },
      { path: 'users/list.ivk', name: 'list', content: 'GET https://y' },
    ],
    inlineFiles: {},
    activeFilePath: null,
    collectionPath: '/test',
  });
  useDocsStore.setState({ docs: [] });
  useEditorStore.setState({ tabs: [], activeTabPath: null });
  usePinnedStore.setState({ pinnedPaths: [], collectionPath: '/test' });
});

describe('PinnedColumn', () => {
  it('renders empty-state hint when no pins', () => {
    render(<PinnedColumn />);
    expect(screen.getByText(/right-click → Pin/i)).toBeInTheDocument();
  });

  it('renders one row per pinned path', () => {
    usePinnedStore.setState({
      pinnedPaths: ['auth/login.ivk', 'users/list.ivk'],
      collectionPath: '/test',
    });
    render(<PinnedColumn />);
    expect(screen.getByText('login')).toBeInTheDocument();
    expect(screen.getByText('list')).toBeInTheDocument();
  });

  it('clicking a pinned row opens it as a tab', async () => {
    usePinnedStore.setState({
      pinnedPaths: ['auth/login.ivk'],
      collectionPath: '/test',
    });
    render(<PinnedColumn />);
    await userEvent.click(screen.getByText('login'));
    expect(useEditorStore.getState().tabs).toEqual([
      expect.objectContaining({ kind: 'ivk', path: 'auth/login.ivk', name: 'login' }),
    ]);
  });

  it('marks stale paths visually with (missing) suffix', () => {
    usePinnedStore.setState({
      pinnedPaths: ['gone/never.ivk'],
      collectionPath: '/test',
    });
    render(<PinnedColumn />);
    expect(screen.getByText(/missing/i)).toBeInTheDocument();
  });

  it('header shows the pin count', () => {
    usePinnedStore.setState({
      pinnedPaths: ['auth/login.ivk', 'users/list.ivk'],
      collectionPath: '/test',
    });
    render(<PinnedColumn />);
    expect(screen.getByText('Pinned')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
