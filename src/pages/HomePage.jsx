
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Star, Clock, Phone, Award, Users, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSearch = () => {
    if (!location.trim()) {
      toast({
        title: "Inserisci una località",
        description: "Per favore inserisci una città o un CAP per la ricerca.",
        variant: "destructive"
      });
      return;
    }
    navigate(`/cerca-veterinari/${location.toLowerCase().trim()}`);
  };

  const recommendedVets = [
    {
      id: 1,
      name: "Clinica Veterinaria San Marco",
      location: "Milano, MI",
      rating: 4.9,
      slug: "clinica-veterinaria-san-marco",
      image: "Clinica veterinaria moderna aperta 24 ore"
    },
    {
      id: 2,
      name: "Ospedale Veterinario Roma Nord",
      location: "Roma, RM",
      rating: 4.8,
      slug: "ospedale-veterinario-roma-nord",
      image: "Ospedale veterinario con ambulanza"
    },
    {
      id: 3,
      name: "Centro Veterinario H24 Napoli",
      location: "Napoli, NA",
      rating: 4.7,
      slug: "centro-veterinario-h24-napoli",
      image: "Centro veterinario con insegna luminosa notturna"
    }
  ];

  const blogPosts = [
    {
      id: 1,
      title: "Come Prendersi Cura del Pelo del Tuo Cane in Inverno",
      excerpt: "Consigli pratici per mantenere il pelo del tuo amico a quattro zampe sano durante i mesi freddi...",
      date: "15 Gen 2024",
      readTime: "5 min"
    },
    {
      id: 2,
      title: "Vaccinazioni Essenziali per Gatti: Guida Completa",
      excerpt: "Tutto quello che devi sapere sui vaccini obbligatori e raccomandati per la salute del tuo gatto...",
      date: "12 Gen 2024",
      readTime: "7 min"
    },
    {
      id: 3,
      title: "Alimentazione Corretta per Cani Anziani",
      excerpt: "Come adattare la dieta del tuo cane alle esigenze nutrizionali della terza età...",
      date: "10 Gen 2024",
      readTime: "6 min"
    }
  ];

  const stats = [
    { icon: Users, value: "2,500+", label: "Veterinari Registrati" },
    { icon: Heart, value: "50,000+", label: "Animali Curati" },
    { icon: Award, value: "4.8/5", label: "Valutazione Media" },
    { icon: Clock, value: "24/7", label: "Servizio H24" }
  ];

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Veterinari 24h e diurni in Italia - Trova il migliore</title>
        <meta name="description" content="Cerca e trova il miglior veterinario 24h a Milano, Roma e in tutta Italia per i tuoi animali domestici. Leggi recensioni e prenota subito." />
        <meta property="og:title" content="Veterinari 24h e diurni in Italia - Trova il migliore" />
        <meta property="og:description" content="La guida completa per trovare veterinari aperti 24 ore su 24 e cliniche specializzate per i tuoi animali domestici." />
        <meta property="og:image" content="https://images.unsplash.com/photo-1583337130417-3346a1be7dee" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="website" />
      </Helmet>

      <section className="relative bg-gradient-to-br from-green-600 via-blue-600 to-purple-700 text-white py-20 hero-pattern overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Trova il <span className="text-yellow-300">Veterinario Perfetto</span><br />
              per il Tuo Animale
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-green-100 max-w-3xl mx-auto">
              La piattaforma più completa d'Italia per trovare veterinari qualificati, 
              leggere recensioni e prenotare visite per i tuoi amici a quattro zampe
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-4xl mx-auto"
          >
            <Card className="p-6 glass-effect border-white/20 search-glow">
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <Input
                        placeholder="Cerca veterinario o specializzazione..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-12 text-lg border-white/30 bg-white/90"
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      placeholder="Città o CAP..."
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="pl-10 h-12 text-lg border-white/30 bg-white/90"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleSearch}
                  className="w-full mt-4 h-12 text-lg bg-green-600 hover:bg-green-700 text-white font-semibold"
                >
                  <Search className="mr-2 h-5 w-5" />
                  Cerca Veterinari
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="bg-gradient-to-r from-green-500 to-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="h-8 w-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Veterinari Consigliati H24
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Le migliori strutture aperte 24 ore su 24, selezionate per te
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recommendedVets.map((vet, index) => (
              <motion.div
                key={vet.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Link to={`/veterinari/${vet.slug}`}>
                  <Card className="vet-card-hover cursor-pointer border-0 shadow-lg overflow-hidden">
                    <CardContent className="p-0">
                      <div className="relative">
                        <img  className="w-full h-48 object-cover" alt={vet.image} src="https://images.unsplash.com/photo-1652979777392-0f360d8bd1cc" />
                        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                          <Clock className="h-3 w-3 mr-1" /> H24
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{vet.name}</h3>
                        <div className="flex items-center text-gray-600 text-sm mb-2">
                          <MapPin className="h-4 w-4 mr-1" />
                          {vet.location}
                        </div>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="ml-1 font-semibold">{vet.rating}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Ultimi Articoli del Blog
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Consigli e informazioni utili per la cura dei tuoi animali domestici
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="vet-card-hover cursor-pointer border-0 shadow-lg h-full">
                  <CardContent className="p-0">
                    <img  className="w-full h-48 object-cover" alt={post.title} src="https://images.unsplash.com/photo-1601941707251-5a887e9db2e1" />
                    <div className="p-6">
                      <div className="flex items-center text-sm text-gray-500 mb-3">
                        <span>{post.date}</span>
                        <span className="mx-2">•</span>
                        <span>{post.readTime} lettura</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                      <Button variant="outline" className="w-full">
                        Leggi di più
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Sei un Veterinario?
            </h2>
            <p className="text-xl mb-8 text-green-100">
              Unisciti alla nostra piattaforma e raggiungi migliaia di proprietari di animali
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-white text-green-600 hover:bg-gray-100">
                <Link to="/register?type=veterinario">Registra il tuo Studio</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-green-600">
                Scopri i Vantaggi
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;