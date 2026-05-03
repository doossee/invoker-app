import { describe, it, expect, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { HighlightedText } from './VariableTokens';

/**
 * VariableTokens renders {{variable}} placeholders inline (URL bar overlay,
 * folder README inline blocks). Each variable token is a hover trigger that
 * opens a portaled popover with the resolved value + edit input.
 *
 * Two regressions are pinned here:
 *  1. Escape dismisses the popover. The unused VarTooltip.tsx had the
 *     handler; the live VariablePopover here needs its own. (Hover-only
 *     dismissal isn't enough — keyboard users couldn't close the popover.)
 *  2. When the anchor lives near the top of the viewport (URL bar is the
 *     topmost editor element), the popover must NOT render with a negative
 *     `top` — that overlaps the tab strip / breadcrumb above. It should
 *     flip to render BELOW the anchor instead.
 */
describe('VariableTokens', () => {
  function renderToken(opts: {
    anchorTop?: number;
    resolverValue?: string | undefined;
  } = {}) {
    const { anchorTop = 200, resolverValue = 'https://api.example.com' } = opts;

    // Force the inline span (token) to a known position so the popover's
    // measurement is deterministic across environments.
    const originalGet = window.HTMLElement.prototype.getBoundingClientRect;
    window.HTMLElement.prototype.getBoundingClientRect = function () {
      // Only the variable span uses this for positioning; everything else
      // can return zeroed rects.
      const text = this.textContent ?? '';
      if (text === '{{baseUrl}}') {
        return {
          x: 100,
          y: anchorTop,
          left: 100,
          right: 200,
          top: anchorTop,
          bottom: anchorTop + 16,
          width: 100,
          height: 16,
          toJSON: () => ({}),
        };
      }
      return originalGet.call(this);
    };

    const onChange = vi.fn();
    const utils = render(
      <HighlightedText
        text="{{baseUrl}}/post"
        resolver={() => resolverValue}
        onChangeVar={onChange}
      />,
    );

    return {
      ...utils,
      restore: () => {
        window.HTMLElement.prototype.getBoundingClientRect = originalGet;
      },
      onChange,
    };
  }

  it('Escape closes a hover-opened variable popover', async () => {
    const { restore } = renderToken();
    try {
      const token = screen.getByText('{{baseUrl}}');
      fireEvent.mouseEnter(token);
      // Popover renders the variable name as a <code> element with the bare
      // name (no braces) — that's our "popover is mounted" signal.
      expect(await screen.findByText('baseUrl')).toBeInTheDocument();

      act(() => {
        fireEvent.keyDown(window, { key: 'Escape' });
      });

      expect(screen.queryByText('baseUrl')).not.toBeInTheDocument();
    } finally {
      restore();
    }
  });

  it('flips the popover BELOW the anchor when there is no room above', () => {
    // Anchor at y=4 → no room above for a popover (which is ~60-80px tall).
    // Without a flip-below fallback, the popover lands at top: -68 or so,
    // overlapping the tab strip above the URL bar.
    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true });
    const { restore } = renderToken({ anchorTop: 4 });
    try {
      const token = screen.getByText('{{baseUrl}}');
      fireEvent.mouseEnter(token);

      // The popover wrapper is a sibling div in the portal (document.body).
      // Find it by walking from the inner content (the `baseUrl` <code>).
      const nameNode = screen.getByText('baseUrl');
      const popover = nameNode.closest('div[style]')!;
      expect(popover).toBeTruthy();

      const top = parseFloat((popover as HTMLElement).style.top);
      // Either positive (rendered below the anchor) or at least not above
      // the viewport. The bug ships top: rect.top - 8 (= -4), then with
      // translateY(-100%) the popover ends up well above 0.
      expect(top).toBeGreaterThanOrEqual(0);
    } finally {
      restore();
    }
  });
});
