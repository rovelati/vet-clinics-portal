import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Info, Star, Heart, Bone, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Helmet } from 'react-helmet';

const IntegratoriPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('tutti');

  const categories = [
    { id: 'tutti', name: 'Tutti i Prodotti', icon: Heart },
    { id: 'articolazioni', name: 'Articolazioni', icon: Bone },
    { id: 'digestione', name: 'Digestione', icon: Heart },
    { id: 'immunita', name: 'Immunità', icon: Shield },
    { id: 'pelo', name: 'Pelo e Pelle', icon: Star }
  ];

  const products = [
    {
      id: 1,
      slug: "omega-3-per-cani",
      name: "Omega-3 per Cani",
      category: "pelo",
      price: "€29.90",
      rating: 4.8,
      benefits: ["Pelo lucido", "Pelle sana", "Anti-infiammatorio"],
      amazonLink: "https://www.amazon.it/dp/B07YQ8J7J9?tag=tuotag-21",
      image: "Integratore omega-3 per cani in capsule"
    },
    {
      id: 2,
      slug: "glucosamina-plus",
      name: "Glucosamina Plus",
      category: "articolazioni",
      price: "€34.50",
      rating: 4.9,
      benefits: ["Mobilità articolare", "Riduce dolore", "Rinforza cartilagini"],
      amazonLink: "https://www.amazon.it/dp/B081G8YQ8J?tag=tuotag-21",
      image: "Integratore per articolazioni cani"
    },
    {
      id: 3,
      slug: "probiotici-digestivi",
      name: "Probiotici Digestivi",
      category: "digestione",
      price: "€24.90",
      rating: 4.7,
      benefits: ["Digestione migliore", "Flora intestinale", "Meno disturbi"],
      amazonLink: "https://www.amazon.it/dp/B07ZJ7G8YQ?tag=tuotag-21",
      image: "Probiotici per cani e gatti"
    },
    {
      id: 4,
      slug: "immunita-forte",
      name: "Immunità Forte",
      category: "immunita",
      price: "€39.90",
      rating: 4.6,
      benefits: ["Sistema immunitario", "Antiossidanti", "Energia"],
      amazonLink: "https://www.amazon.it/dp/B09B3YQ8J7?tag=tuotag-21",
      image: "Integratore immunità per animali"
    },
    {
      id: 5,
      slug: "multivitaminico-completo",
      name: "Multivitaminico Completo",
      category: "tutti",
      price: "€19.90",
      rating: 4.5,
      benefits: ["Salute generale", "Energia", "Benessere"],
      amazonLink: "https://www.amazon.it/dp/B07XG8YQ8J?tag=tuotag-21",
      image: "Multivitaminico per cani e gatti"
    },
    {
      id: 6,
      slug: "calming-support",
      name: "Calming Support",
      category: "tutti",
      price: "€27.50",
      rating: 4.4,
      benefits: ["Riduce ansia", "Calma naturale", "Migliora sonno"],
      amazonLink: "https://www.amazon.it/dp/B08R8YQ8J7?tag=tuotag-21",
      image: "Integratore calmante per animali ansiosi"
    }
  ];

  const filteredProducts = selectedCategory === 'tutti' 
    ? products 
    : products.filter(product => product.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Integratori per Animali - Prodotti Veterinari Online</title>
        <meta name="description" content="Acquista i migliori integratori per cani e gatti su Amazon. Prodotti per articolazioni, digestione, pelo e pelle con il nostro codice affiliato." />
        <meta property="og:title" content="Integratori per Animali - Prodotti Veterinari Online" />
        <meta property="og:description" content="Scopri la nostra selezione di integratori per animali domestici, disponibili su Amazon." />
        <meta property="og:image" content="https://images.unsplash.com/photo-1635865165118-917ed9e20936" />
      </Helmet>

      <section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Integratori per Animali
            </h1>
            <p className="text-xl text-purple-100 max-w-2xl mx-auto">
              Prodotti di qualità per il benessere dei tuoi amici a quattro zampe, selezionati per te.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-8 bg-white border-b sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex flex-wrap gap-4 justify-center">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`${
                    selectedCategory === category.id 
                      ? "bg-purple-600 hover:bg-purple-700" 
                      : "hover:bg-purple-50"
                  }`}
                >
                  <category.icon className="mr-2 h-4 w-4" />
                  {category.name}
                </Button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="vet-card-hover border-0 shadow-lg h-full flex flex-col">
                  <CardContent className="p-0 flex-grow flex flex-col">
                    <div className="relative">
                      <img  className="w-full h-56 object-cover rounded-t-lg" alt={product.name} src="https://images.unsplash.com/photo-1635865165118-917ed9e20936" />
                    </div>
                    
                    <div className="p-6 flex-grow flex flex-col">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h3>
                      
                      <div className="flex items-center mb-4">
                        <Star className="h-5 w-5 text-yellow-400 fill-current" />
                        <span className="ml-1 font-semibold">{product.rating} su 5</span>
                      </div>
                      
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          {product.benefits.map((benefit, idx) => (
                            <span key={idx} className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-medium">
                              {benefit}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="mt-auto pt-4">
                        <div className="flex items-center justify-between">
                          <div className="text-2xl font-bold text-gray-900">{product.price}</div>
                          <Link to={`/integratori/${product.slug}`}>
                            <Button className="bg-purple-600 hover:bg-purple-700">
                              <Info className="mr-2 h-4 w-4" />
                              Scopri di più
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default IntegratoriPage;