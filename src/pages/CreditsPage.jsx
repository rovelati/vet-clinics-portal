import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Sparkles, PawPrint } from 'lucide-react';
import { Button } from '@/components/ui/button';

const vetDirectories = [
  {
    name: 'LinkUrl',
    url: 'https://linkurl.it/',
    anchor: 'directory italiana',
    description:
      'Directory italiana gratuita suddivisa in categorie tematiche: aiuta baumicio.it ad aumentare visibilità e presenza online.',
  },
  {
    name: 'MrLink',
    url: 'https://www.mrlink.it/',
    anchor: 'directory italiana',
    description:
      'Directory italiana di qualità con schede dettagliate per ogni sito: utile per migliorare il posizionamento SEO di baumicio.it.',
  },
  {
    name: 'PagineGialle - Veterinari',
    url: 'https://www.paginegialle.it/ricerca/veterinario',
    description:
      'Directory nazionale molto consultata per intercettare ricerche locali di servizi veterinari.',
  },
  {
    name: 'Yelp Italia - Veterinari',
    url: 'https://www.yelp.it/search?find_desc=Veterinario',
    description:
      'Piattaforma con recensioni utile per reputazione e visibilita nelle ricerche geolocalizzate.',
  },
];

const visibilitySites = [
  {
    name: 'Google Business Profile',
    url: 'https://www.google.com/business/',
    description:
      'Supporta presenza su Ricerca Google e Maps, fondamentale per SEO locale e discovery.',
  },
  {
    name: 'Bing Places',
    url: 'https://www.bingplaces.com/',
    description:
      'Consente di presidiare anche le ricerche locali nell ecosistema Microsoft.',
  },
  {
    name: 'Apple Business Connect',
    url: 'https://businessconnect.apple.com/',
    description:
      'Rende la presenza aziendale piu forte su Apple Maps e sui dispositivi iOS.',
  },
];

const CreditsPage = () => {
  return (
    <>
      <Helmet>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="shortcut icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <title>Credits | baumicio.it</title>
        <meta
          name="description"
          content="Credits di baumicio.it: descrizione del progetto, directory veterinarie e siti che aiutano la visibilita online."
        />
        <link rel="canonical" href="https://baumicio.it/credits" />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <Link to="/">
              <Button variant="ghost" className="mb-6">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Torna alla Home
              </Button>
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <PawPrint className="h-9 w-9 text-green-600" />
              Credits
            </h1>
            <p className="text-lg text-gray-700 max-w-3xl">
              baumicio.it e una piattaforma dedicata a chi cerca veterinari e cliniche in Italia:
              raccoglie informazioni utili, facilita la ricerca locale e migliora la connessione tra
              utenti e professionisti del settore pet.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-green-600" />
                Directory di veterinari
              </h2>
              <p className="text-gray-700 mb-4">
                Queste directory aiutano baumicio.it a presidiare canali esterni e a intercettare
                nuovi utenti interessati ai servizi veterinari.
              </p>
              <ul className="space-y-3">
                {vetDirectories.map((item) => (
                  <li key={item.url} className="border border-gray-200 rounded-lg p-4">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-700 hover:text-green-800 font-semibold inline-flex items-center gap-1"
                    >
                      {item.name}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    {item.anchor && (
                      <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">
                        {item.anchor}
                      </span>
                    )}
                    <p className="text-gray-600 mt-1">{item.description}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Siti utili per la visibilita online</h2>
              <p className="text-gray-700 mb-4">
                Oltre alle directory, questi canali rafforzano la presenza digitale di baumicio.it,
                soprattutto lato ricerca locale e brand discovery.
              </p>
              <ul className="space-y-3">
                {visibilitySites.map((item) => (
                  <li key={item.url} className="border border-gray-200 rounded-lg p-4">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-700 hover:text-green-800 font-semibold inline-flex items-center gap-1"
                    >
                      {item.name}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <p className="text-gray-600 mt-1">{item.description}</p>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreditsPage;
