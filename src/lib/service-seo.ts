const ANIMAL_CONTEXT_PATTERN = /\b(animali?|can(?:e|i)|cagn(?:a|e)|gatt(?:o|a|i|e)|cucciol(?:o|a|i|e)|felin(?:o|a|i|e)|canin(?:o|a|i|e)|conigli(?:o|a|i|e)?|cricet(?:o|i)|cavall(?:o|a|i|e)|equin(?:o|a|i|e)|uccelli?|volatili|rettili?|esotic(?:o|a|i|e))\b/i;
const ITALIAN_PREPOSITION_PATTERN = /\b(A|Al|Alla|Alle|Allo|Con|Da|Dal|Dalla|Dalle|Dallo|Dei|Del|Della|Delle|Dello|Di|In|Per|Su|Tra|Fra)\b/g;

const PLAIN_LANGUAGE_RULES: Array<[RegExp, string]> = [
  [/\bovarioisterectomia\b.*\bgatt(?:a|e)\b/i, 'sterilizzazione chirurgica della gatta con rimozione di ovaie e utero'],
  [/\bovarioisterectomia\b.*\b(?:cagna|cane)\b/i, 'sterilizzazione chirurgica del cane femmina con rimozione di ovaie e utero'],
  [/\bovarioisterectomia\b/i, 'sterilizzazione chirurgica con rimozione di ovaie e utero'],
  [/\bovariectomia\b/i, 'sterilizzazione chirurgica con rimozione delle ovaie'],
  [/\borchiectomia\b/i, 'castrazione chirurgica del maschio'],
  [/\blaparotomia esplorativa\b/i, 'intervento chirurgico per esaminare gli organi addominali'],
  [/\bcistocentesi\b/i, 'prelievo sterile di urina direttamente dalla vescica'],
  [/\btoracocentesi\b/i, 'prelievo di aria o liquido dal torace'],
  [/\baddominocentesi\b/i, "prelievo di liquido dall'addome"],
  [/\bartrocentesi\b/i, "prelievo di liquido da un'articolazione"],
  [/\benterectomia\b/i, 'rimozione chirurgica di un tratto di intestino'],
  [/\benterotomia\b/i, "apertura chirurgica dell'intestino"],
  [/\bgastrotomia\b/i, 'apertura chirurgica dello stomaco'],
  [/\bsplenectomia\b/i, 'rimozione chirurgica della milza'],
  [/\bnefrectomia\b/i, 'rimozione chirurgica di un rene'],
  [/\bcolecistectomia\b/i, 'rimozione chirurgica della cistifellea'],
  [/\benucleazione\b/i, "rimozione chirurgica dell'occhio"],
];

function normalizeItalianPrepositions(name: string) {
  return name.replace(ITALIAN_PREPOSITION_PATTERN, (word, _match, offset) => offset === 0 ? word : word.toLowerCase());
}

export function serviceNameForAnimalSeo(value: unknown) {
  const name = normalizeItalianPrepositions(typeof value === 'string' ? value.trim() : '');
  if (!name || ANIMAL_CONTEXT_PATTERN.test(name)) return name;
  return `${name} per animali domestici`;
}

export function serviceHasAnimalContext(value: unknown) {
  return ANIMAL_CONTEXT_PATTERN.test(typeof value === 'string' ? value.trim() : '');
}

export function servicePlainLanguageExplanation(value: unknown) {
  const name = typeof value === 'string' ? value.trim() : '';
  return PLAIN_LANGUAGE_RULES.find(([pattern]) => pattern.test(name))?.[1] || '';
}

export function serviceNameForAnimalTitle(value: unknown) {
  const name = normalizeItalianPrepositions(typeof value === 'string' ? value.trim() : '');
  if (!name || ANIMAL_CONTEXT_PATTERN.test(name)) return name;
  return `${name} per animali`;
}
