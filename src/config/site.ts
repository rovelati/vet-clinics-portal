export const siteConfig = {
  name: 'Veterinari.org',
  legalName: 'Veterinari.org',
  domain: 'www.veterinari.org',
  url: 'https://www.veterinari.org',
  oldUrl: 'https://baumicio.it',
  publicEmail: 'info@veterinari.org',
  supportEmail: 'supporto@veterinari.org',
  defaultDescription:
    'Trova veterinari, cliniche veterinarie, servizi e informazioni utili per la salute degli animali in Italia.',
  defaultOgImage: '/favicon.svg',
  cmp: {
    provider: 'uniconsent',
    enabled: true,
    id: '5d3ba4993e',
  },
  analytics: {
    enabled: true,
    gtmId: 'G-7KC7ZEDRX2',
  },
  ads: {
    enabled: false,
    adsenseClient: '',
  },
  indexing: {
    enabled: true,
  },
} as const;

export function absoluteUrl(path = '/') {
  return new URL(path, siteConfig.url).toString();
}
