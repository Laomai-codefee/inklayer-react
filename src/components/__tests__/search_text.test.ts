import { splitSearchText } from '../search_text';

describe('search text highlighting', () => {
  it('matches different letter casing by default', () => {
    expect(splitSearchText('PDF pdf Pdf', 'pdf', false)).toEqual([
      { text: '', highlighted: false },
      { text: 'PDF', highlighted: true },
      { text: ' ', highlighted: false },
      { text: 'pdf', highlighted: true },
      { text: ' ', highlighted: false },
      { text: 'Pdf', highlighted: true },
      { text: '', highlighted: false },
    ]);
  });

  it('only matches exact casing when requested', () => {
    const highlighted = splitSearchText('PDF pdf Pdf', 'pdf', true)
      .filter((part) => part.highlighted)
      .map((part) => part.text);

    expect(highlighted).toEqual(['pdf']);
  });

  it('treats regular-expression characters as plain text', () => {
    const highlighted = splitSearchText('Find (a+b) here', '(a+b)', false)
      .filter((part) => part.highlighted)
      .map((part) => part.text);

    expect(highlighted).toEqual(['(a+b)']);
  });
});
