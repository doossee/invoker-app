import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrimaryBtn, GhostBtn } from './primitives';

describe('PrimaryBtn', () => {
  it('forwards title to the underlying button (for tooltip + a11y)', () => {
    render(<PrimaryBtn title="Open a folder of .ivk files">Open</PrimaryBtn>);
    expect(screen.getByRole('button')).toHaveAttribute('title', 'Open a folder of .ivk files');
  });

  it('honors disabled — sets the attribute and blocks clicks', async () => {
    const onClick = vi.fn();
    render(
      <PrimaryBtn onClick={onClick} disabled>
        Send
      </PrimaryBtn>,
    );
    expect(screen.getByRole('button')).toBeDisabled();
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders children', () => {
    render(<PrimaryBtn>Send</PrimaryBtn>);
    expect(screen.getByRole('button')).toHaveTextContent('Send');
  });

  it('calls onClick when clicked and not disabled', async () => {
    const onClick = vi.fn();
    render(<PrimaryBtn onClick={onClick}>Send</PrimaryBtn>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe('GhostBtn', () => {
  it('forwards title to the underlying button', () => {
    render(<GhostBtn title="Cancel and discard changes">Cancel</GhostBtn>);
    expect(screen.getByRole('button')).toHaveAttribute('title', 'Cancel and discard changes');
  });

  it('honors disabled — sets the attribute and blocks clicks', async () => {
    const onClick = vi.fn();
    render(
      <GhostBtn onClick={onClick} disabled>
        Cancel
      </GhostBtn>,
    );
    expect(screen.getByRole('button')).toBeDisabled();
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders children', () => {
    render(<GhostBtn>Cancel</GhostBtn>);
    expect(screen.getByRole('button')).toHaveTextContent('Cancel');
  });

  it('calls onClick when clicked and not disabled', async () => {
    const onClick = vi.fn();
    render(<GhostBtn onClick={onClick}>Cancel</GhostBtn>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
