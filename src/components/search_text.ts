export interface SearchTextPart {
  text: string;
  highlighted: boolean;
}

export function splitSearchText(
  text: string,
  query: string,
  caseSensitive: boolean
): SearchTextPart[] {
  if (!query) return [{ text, highlighted: false }];

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const splitPattern = new RegExp(
    `(${escapedQuery})`,
    caseSensitive ? 'g' : 'gi'
  );
  const exactPattern = new RegExp(
    `^${escapedQuery}$`,
    caseSensitive ? '' : 'i'
  );

  return text.split(splitPattern).map((part) => ({
    text: part,
    highlighted: exactPattern.test(part),
  }));
}
