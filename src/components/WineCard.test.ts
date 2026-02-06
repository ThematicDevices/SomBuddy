import { describe, it, expect } from 'vitest';
import { TastingNote } from '../types';

// Extracted function from WineCard.tsx for testing
function formatTastingNotePreview(notes: TastingNote[]): string | null {
  if (!notes || notes.length === 0) return null;

  // Get the most recent note
  const sortedNotes = [...notes].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const latestNote = sortedNotes[0];
  const noteText = latestNote.notes || '';

  // Truncate to ~100 chars
  if (noteText.length <= 120) return noteText;
  return noteText.slice(0, 117).trim() + '...';
}

describe('formatTastingNotePreview', () => {
  it('returns null for empty notes array', () => {
    expect(formatTastingNotePreview([])).toBeNull();
  });

  it('returns null for undefined notes', () => {
    expect(formatTastingNotePreview(undefined as unknown as TastingNote[])).toBeNull();
  });

  it('returns the note text for a single note', () => {
    const notes: TastingNote[] = [
      {
        id: '1',
        date: '2024-06-15T00:00:00Z',
        notes: 'Wonderful wine with complex flavors.',
      },
    ];
    expect(formatTastingNotePreview(notes)).toBe('Wonderful wine with complex flavors.');
  });

  it('returns the most recent note when multiple notes exist', () => {
    const notes: TastingNote[] = [
      {
        id: '1',
        date: '2024-01-15T00:00:00Z',
        notes: 'First tasting - quite young.',
      },
      {
        id: '2',
        date: '2024-06-20T00:00:00Z',
        notes: 'Second tasting - much better now.',
      },
      {
        id: '3',
        date: '2024-03-10T00:00:00Z',
        notes: 'Third tasting - developing nicely.',
      },
    ];
    expect(formatTastingNotePreview(notes)).toBe('Second tasting - much better now.');
  });

  it('truncates long notes to 117 characters with ellipsis', () => {
    const longNote = 'This is a very long tasting note that exceeds the 120 character limit and should be truncated to show only the first 117 characters plus an ellipsis at the end.';
    const notes: TastingNote[] = [
      {
        id: '1',
        date: '2024-06-15T00:00:00Z',
        notes: longNote,
      },
    ];
    const result = formatTastingNotePreview(notes);
    expect(result).not.toBeNull();
    expect(result!.length).toBeLessThanOrEqual(120);
    expect(result!.endsWith('...')).toBe(true);
  });

  it('does not truncate notes at exactly 120 characters', () => {
    const exactNote = 'A'.repeat(120);
    const notes: TastingNote[] = [
      {
        id: '1',
        date: '2024-06-15T00:00:00Z',
        notes: exactNote,
      },
    ];
    expect(formatTastingNotePreview(notes)).toBe(exactNote);
  });

  it('does not truncate notes under 120 characters', () => {
    const shortNote = 'A'.repeat(100);
    const notes: TastingNote[] = [
      {
        id: '1',
        date: '2024-06-15T00:00:00Z',
        notes: shortNote,
      },
    ];
    expect(formatTastingNotePreview(notes)).toBe(shortNote);
  });

  it('truncates notes at 121 characters', () => {
    const borderNote = 'A'.repeat(121);
    const notes: TastingNote[] = [
      {
        id: '1',
        date: '2024-06-15T00:00:00Z',
        notes: borderNote,
      },
    ];
    const result = formatTastingNotePreview(notes);
    expect(result!.endsWith('...')).toBe(true);
    expect(result!.length).toBe(120); // 117 + 3 for "..."
  });

  it('handles notes with empty string', () => {
    const notes: TastingNote[] = [
      {
        id: '1',
        date: '2024-06-15T00:00:00Z',
        notes: '',
      },
    ];
    expect(formatTastingNotePreview(notes)).toBe('');
  });

  it('handles notes with only whitespace', () => {
    const notes: TastingNote[] = [
      {
        id: '1',
        date: '2024-06-15T00:00:00Z',
        notes: '   ',
      },
    ];
    expect(formatTastingNotePreview(notes)).toBe('   ');
  });

  it('correctly parses various date formats', () => {
    const notes: TastingNote[] = [
      {
        id: '1',
        date: '2024-06-15',
        notes: 'Older note',
      },
      {
        id: '2',
        date: '2024-12-25T12:30:00Z',
        notes: 'Newer note',
      },
    ];
    expect(formatTastingNotePreview(notes)).toBe('Newer note');
  });

  it('handles professional tasting notes format', () => {
    const notes: TastingNote[] = [
      {
        id: '1',
        date: '2026-02-04',
        notes: '91 points. Highly perfumed nose showing black cherry, cassis, plum, desert sage, sandalwood and dusty minerality. Secondary aromas of cigar box, leather, bay leaf and black olive.',
      },
    ];
    const result = formatTastingNotePreview(notes);
    expect(result).not.toBeNull();
    expect(result!.endsWith('...')).toBe(true);
    expect(result!.startsWith('91 points')).toBe(true);
  });

  it('preserves rating in notes if present', () => {
    const notes: TastingNote[] = [
      {
        id: '1',
        date: '2024-06-15T00:00:00Z',
        notes: 'Excellent wine, would buy again.',
        rating: 5,
      },
    ];
    // The function should return just the notes text, rating is separate
    expect(formatTastingNotePreview(notes)).toBe('Excellent wine, would buy again.');
  });

  it('does not mutate the original notes array', () => {
    const notes: TastingNote[] = [
      { id: '1', date: '2024-06-15T00:00:00Z', notes: 'Note A' },
      { id: '2', date: '2024-01-15T00:00:00Z', notes: 'Note B' },
    ];
    const originalOrder = notes.map(n => n.id);
    formatTastingNotePreview(notes);
    expect(notes.map(n => n.id)).toEqual(originalOrder);
  });
});
