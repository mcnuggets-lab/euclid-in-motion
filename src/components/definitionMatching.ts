import type { Definition } from "@/data/catalog";


export type DefinitionMatch = Definition & {
  end: number;
  start: number;
};

type TermMatch = {
  end: number;
  start: number;
};

function compareMatches(first: TermMatch, second: TermMatch) {
  return (
    first.start - second.start ||
    second.end - second.start - (first.end - first.start)
  );
}

function isWordCharacter(character: string | undefined) {
  return character !== undefined && /[\p{L}\p{N}]/u.test(character);
}

function findFirstWholeTerm(text: string, term: string): TermMatch | null {
  const lowercaseTerm = term.toLocaleLowerCase();
  if (!lowercaseTerm) {
    return null;
  }

  let searchStart = 0;

  while (searchStart < text.length) {
    const start = text.indexOf(lowercaseTerm, searchStart);
    if (start === -1) {
      return null;
    }

    const end = start + lowercaseTerm.length;
    if (!isWordCharacter(text[start - 1]) && !isWordCharacter(text[end])) {
      return { end, start };
    }

    searchStart = start + 1;
  }

  return null;
}

export function findDefinitionMatches(
  definitions: Definition[],
  text: string,
): DefinitionMatch[] {
  const lowercaseText = text.toLocaleLowerCase();
  const matches = definitions
    .map<DefinitionMatch | null>((definition) => {
      const matchingTerm = [definition.term, ...(definition.aliases ?? [])]
        .map((term) => findFirstWholeTerm(lowercaseText, term))
        .filter((match): match is TermMatch => match !== null)
        .sort(compareMatches)[0];

      return matchingTerm
        ? { ...definition, end: matchingTerm.end, start: matchingTerm.start }
        : null;
    })
    .filter((match): match is DefinitionMatch => match !== null)
    .sort(compareMatches);

  let cursor = 0;
  return matches.filter((match) => {
    if (match.start < cursor) {
      return false;
    }

    cursor = match.end;
    return true;
  });
}
