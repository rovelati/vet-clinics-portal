function cleanText(value: unknown) {
  return typeof value === 'string' ? value.replace(/"/g, '').trim() : '';
}

export function slugifyLocation(value: unknown) {
  return cleanText(value)
    .replace(/\bcampo\s+nell['’]?\s*elba\b/i, 'campo dell elba')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function titleCaseCitySlug(slug: string) {
  const smallWords = new Set(['a', 'al', 'alla', 'alle', 'allo', 'da', 'dal', 'dalla', 'de', 'del', 'della', 'delle', 'di', 'in', 'la', 'le']);
  return slug
    .split('-')
    .filter(Boolean)
    .map((word, index) => {
      if (index > 0 && smallWords.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

export function cityNameFromSlug(slug: unknown) {
  const value = cleanText(slug).toLowerCase();
  if (value === 'campo-dell-elba') return "Campo nell'Elba";
  return titleCaseCitySlug(value);
}

export function provinceSlug(value: unknown) {
  return cleanText(value).toLowerCase();
}

export function provinceLabel(value: unknown) {
  return cleanText(value).toUpperCase();
}

export function canonicalVeterinariCityPath(city: unknown, province: unknown) {
  const provincePart = provinceSlug(province);
  const cityPart = slugifyLocation(city);
  return provincePart && cityPart ? `/veterinari/${provincePart}/${cityPart}` : '/cerca-veterinari';
}

export function canonicalVeterinariProvincePath(province: unknown) {
  const provincePart = provinceSlug(province);
  return provincePart ? `/veterinari/provincia/${provincePart}` : '/cerca-veterinari';
}

export function canonicalVeterinariRegionPath(region: unknown) {
  const regionPart = slugifyLocation(region);
  return regionPart ? `/veterinari/regione/${regionPart}` : '/cerca-veterinari';
}

export function canonicalH24CityPath(city: unknown, province: unknown) {
  const provincePart = provinceSlug(province);
  const cityPart = slugifyLocation(city);
  return provincePart && cityPart ? `/veterinari-h24/${provincePart}/${cityPart}` : '/veterinari-h24';
}
