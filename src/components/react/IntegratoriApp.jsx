import React, { useState } from 'react';
import { Bone, Heart, Info, Shield, Sparkles } from 'lucide-react';
import { integratoriCards, integratoriCategories } from '@/lib/integratori';

const categoryIcons = {
  tutti: Heart,
  articolazioni: Bone,
  digestione: Heart,
  immunita: Shield,
  pelo: Sparkles,
};

export default function IntegratoriApp() {
  const [selectedCategory, setSelectedCategory] = useState('tutti');
  const filtered = selectedCategory === 'tutti'
    ? integratoriCards
    : integratoriCards.filter((item) => item.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">Guida agli Integratori per Animali</h1>
          <p className="mx-auto max-w-2xl text-xl text-purple-100">
            Informazioni utili sui principali integratori per il benessere di cani e gatti.
            Consulta sempre il tuo veterinario prima di somministrare qualsiasi integratore.
          </p>
        </div>
      </section>

      <section className="sticky top-16 z-30 border-b bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-3">
            {integratoriCategories.map((category) => {
              const Icon = categoryIcons[category.id] ?? Heart;
              const selected = selectedCategory === category.id;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(category.id)}
                  className={`inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-semibold transition-colors ${
                    selected
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'border border-gray-300 bg-white text-gray-700 hover:bg-purple-50'
                  }`}
                  aria-pressed={selected}
                >
                  <Icon className="mr-2 h-4 w-4" aria-hidden="true" />
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => (
              <article key={item.id} className="flex h-full flex-col rounded-lg bg-white p-6 shadow-lg transition hover:-translate-y-1 hover:shadow-xl">
                <div className="mb-4 text-4xl" aria-hidden="true">{item.icon}</div>
                <h2 className="mb-3 text-xl font-bold text-gray-900">{item.name}</h2>
                <p className="mb-4 flex-1 text-gray-600">{item.description}</p>

                <div className="mb-4 flex flex-wrap gap-2">
                  {item.benefits.map((benefit) => (
                    <span key={benefit} className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800">
                      {benefit}
                    </span>
                  ))}
                </div>

                <a
                  href={`/integratori/${item.slug}`}
                  className="mt-auto inline-flex h-10 w-full items-center justify-center rounded-md bg-purple-600 px-4 text-sm font-semibold text-white hover:bg-purple-700"
                >
                  <Info className="mr-2 h-4 w-4" aria-hidden="true" />
                  Leggi la guida completa
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t bg-amber-50 py-12">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <p className="text-sm text-amber-800">
            <strong>Nota:</strong> Le informazioni presenti in questa pagina hanno scopo puramente informativo e non sostituiscono il parere del veterinario.
            Consulta sempre un professionista prima di somministrare integratori al tuo animale.
          </p>
        </div>
      </section>
    </div>
  );
}
