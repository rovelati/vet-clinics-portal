import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, CheckCircle, ShoppingCart } from 'lucide-react';

const mockProductData = {
  'omega-3-per-cani': {
    name: "Omega-3 per Cani: La Guida Completa",
    intro: "Scopri perché l'integratore di Omega-3 è essenziale per la salute del pelo e della pelle del tuo cane. La nostra recensione completa del prodotto più venduto su Amazon.",
    mainImage: "https://images.unsplash.com/photo-1583511655826-05700d52f4d9",
    description: [
      "Gli acidi grassi Omega-3 sono fondamentali per la salute generale del cane, ma sono particolarmente noti per i loro benefici sulla pelle e sul pelo. Un apporto corretto può trasformare un pelo opaco e fragile in un manto lucido e forte, riducendo al contempo problemi cutanei come secchezza e prurito.",
      "Questo specifico integratore, con migliaia di recensioni positive su Amazon, utilizza olio di pesce di alta qualità, purificato per eliminare metalli pesanti e tossine. È una scelta sicura ed efficace per supportare il benessere del tuo amico a quattro zampe."
    ],
    amazonLink: "https://www.amazon.it/dp/B07YQ8J7J9?tag=tuotag-21",
    price: "€29.90",
    rating: 4.8,
    features: [
      "Olio di pesce selvaggio di alta qualità",
      "Ricco di EPA e DHA",
      "Supporta la salute cardiovascolare",
      "Formula liquida facile da somministrare"
    ],
    productImage: "https://images.unsplash.com/photo-1635865165118-917ed9e20936"
  },
  'glucosamina-plus': {
    name: "Glucosamina Plus: Supporto Articolare per Cani Attivi",
    intro: "La mobilità è fondamentale per la felicità del tuo cane. Scopri come la Glucosamina Plus può aiutare a mantenere le articolazioni sane e ridurre i dolori legati all'età o all'attività fisica.",
    mainImage: "https://images.unsplash.com/photo-1561037404-61cd46aa615b",
    description: [
      "Con l'avanzare dell'età o in caso di intensa attività fisica, le articolazioni del cane possono subire usura. La Glucosamina Plus è formulata con una potente combinazione di glucosamina, condroitina e MSM per nutrire la cartilagine, migliorare la lubrificazione articolare e combattere l'infiammazione.",
      "Questo prodotto è ideale sia per cani anziani che mostrano i primi segni di rigidità, sia per cani sportivi che necessitano di un supporto extra per prevenire infortuni. Le compresse masticabili al sapore di manzo lo rendono facile e piacevole da somministrare."
    ],
    amazonLink: "https://www.amazon.it/dp/B081G8YQ8J?tag=tuotag-21",
    price: "€34.50",
    rating: 4.9,
    features: [
      "Formula ad alta potenza",
      "Con Condroitina e MSM",
      "Compresse masticabili gustose",
      "Prodotto nel Regno Unito secondo standard GMP"
    ],
    productImage: "https://images.unsplash.com/photo-1635865165118-917ed9e20936"
  }
};

const IntegratoreDetailPage = () => {
  const { slug } = useParams();
  const [productData, setProductData] = useState(null);

  useEffect(() => {
    const data = mockProductData[slug] || Object.values(mockProductData)[0];
    setProductData(data);
  }, [slug]);

  if (!productData) {
    return <div className="text-center py-20">Caricamento prodotto...</div>;
  }

  return (
    <div className="bg-white">
      <Helmet>
        <title>{productData.name}</title>
        <meta name="description" content={productData.intro} />
        <meta property="og:title" content={productData.name} />
        <meta property="og:description" content={productData.intro} />
        <meta property="og:image" content={productData.mainImage} />
        <link rel="canonical" href={window.location.href} />
      </Helmet>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <header className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{productData.name}</h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">{productData.intro}</p>
          </header>

          <img  className="w-full h-auto max-h-96 object-cover rounded-lg shadow-lg" alt={productData.name} src={productData.mainImage} />

          <div className="prose prose-lg max-w-none">
            {productData.description.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          <div className="text-center">
            <a href={productData.amazonLink} target="_blank" rel="noopener noreferrer nofollow">
              <Button size="lg" className="bg-green-600 hover:bg-green-700">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Vedi l'offerta su Amazon
              </Button>
            </a>
          </div>

          <Card className="bg-gray-50 border-blue-200 border">
            <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
              <img  className="w-32 h-32 object-contain rounded-md" alt={`Prodotto: ${productData.name}`} src={productData.productImage} />
              <div className="flex-grow">
                <h3 className="text-xl font-bold text-gray-900">Il nostro consiglio</h3>
                <div className="flex items-center my-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-5 w-5 ${i < Math.round(productData.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                  ))}
                  <span className="ml-2 text-sm font-medium text-gray-600">{productData.rating} su 5</span>
                </div>
                <p className="text-2xl font-bold text-gray-800 mb-4">{productData.price}</p>
                <a href={productData.amazonLink} target="_blank" rel="noopener noreferrer nofollow">
                  <Button className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-600 text-black">
                    Acquista su Amazon
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Caratteristiche principali</h2>
            <ul className="space-y-2">
              {productData.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-center pt-8">
            <p className="text-gray-600 mb-4">Non aspettare, migliora subito la salute del tuo animale!</p>
            <a href={productData.amazonLink} target="_blank" rel="noopener noreferrer nofollow">
              <Button size="lg" className="bg-green-600 hover:bg-green-700">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Vai all'offerta e acquista ora
              </Button>
            </a>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default IntegratoreDetailPage;