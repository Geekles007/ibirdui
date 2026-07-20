import { StreamingList } from '@/components/streaming-list';
import { empty, loading, success } from '@/lib/async-state';
import { cleanup, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(cleanup);

interface Event {
  id: number;
  text: string;
}

const events: Event[] = [
  { id: 1, text: 'Ada joined' },
  { id: 2, text: 'Linus pushed' },
];

function renderList(state: Parameters<typeof StreamingList<Event>>[0]['state']) {
  return render(
    <StreamingList state={state} label="Activity" getKey={(e) => e.id}>
      {(e) => <span>{e.text}</span>}
    </StreamingList>,
  );
}

async function expectNoViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false } },
  });
  expect(results.violations).toEqual([]);
}

describe('StreamingList accessibility', () => {
  it('renders an accessible list in the success state', async () => {
    const { container } = renderList(success(events));
    expect(screen.getByRole('list', { name: 'Activity' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    await expectNoViolations(container);
  });

  it('announces the initial item count', () => {
    renderList(success(events));
    expect(screen.getByRole('status')).toHaveTextContent('2 items');
  });

  it('announces new arrivals as a delta', () => {
    const { rerender } = renderList(success(events));
    expect(screen.getByRole('status')).toHaveTextContent('2 items');

    rerender(
      <StreamingList
        state={success([...events, { id: 3, text: 'Grace shipped' }])}
        label="Activity"
        getKey={(e) => e.id}
      >
        {(e) => <span>{e.text}</span>}
      </StreamingList>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('1 new item');
  });

  it('re-announces an identical consecutive delta by changing the live-region text', () => {
    const node = (data: Event[]) => (
      <StreamingList state={success(data)} label="Activity" getKey={(e) => e.id}>
        {(e) => <span>{e.text}</span>}
      </StreamingList>
    );
    const { rerender } = render(node(events)); // 2 items
    rerender(node([...events, { id: 3, text: 'Grace shipped' }])); // +1 → "1 new item"
    const first = screen.getByRole('status').textContent;
    rerender(node([...events, { id: 3, text: 'Grace shipped' }, { id: 4, text: 'Mike merged' }])); // +1 again
    const second = screen.getByRole('status').textContent;

    expect(first).toContain('1 new item');
    expect(second).toContain('1 new item');
    // Same words, but the text must differ so a screen reader re-announces it.
    expect(second).not.toBe(first);
  });

  it('renders newest-first when asked', () => {
    render(
      <StreamingList state={success(events)} label="Activity" newestFirst getKey={(e) => e.id}>
        {(e) => <span>{e.text}</span>}
      </StreamingList>,
    );
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Linus pushed');
  });

  it('shows an empty slot with no violations', async () => {
    const { container } = renderList(empty());
    expect(screen.getByRole('status')).toHaveTextContent('No activity');
    await expectNoViolations(container);
  });

  it('marks the connecting skeleton as hidden', async () => {
    const { container } = renderList(loading());
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
    await expectNoViolations(container);
  });
});
