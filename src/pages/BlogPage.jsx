import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, Search, Tag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet';

const blogPosts = [
  {
    id: 1,
    slug: "come-riconoscere-i-sintomi-di-malattia-nel-tuo-cane",
    title: "Come Riconoscere i Sintomi di Malattia nel Tuo Cane",
    excerpt: "Impara a identificare i segnali che indicano quando il tuo cane potrebbe non stare bene e quando è necessario consultare un veterinario...",
    author: "Dr. Marco Rossi",
    date: "15 Gen 2024",
    readTime: "8 min",
    category: "salute",
    tags: ["salute", "sintomi", "diagnosi"]
  },
  {
    id: 2,
    slug: "alimentazione-corretta-per-gatti-anziani",
    title: "Alimentazione Corretta per Gatti Anziani",
    excerpt: "Scopri come adattare la dieta del tuo gatto alle esigenze nutrizionali della terza età per mantenerlo in salute...",
    author: "Dr.ssa Anna Bianchi",
    date: "12 Gen 2024",
    readTime: "6 min",
    category: "alimentazione",
    tags: ["alimentazione", "gatti", "anziani"]
  },
  {
    id: 3,
    slug: "vaccinazioni-essenziali-per-cuccioli",
    title: "Vaccinazioni Essenziali per Cuccioli",
    excerpt: "Guida completa alle vaccinazioni obbligatorie e raccomandate per proteggere la salute del tuo cucciolo...",
    author: "Dr. Giuseppe Verde",
    date: "10 Gen 2024",
    readTime: "7 min",
    category: "salute",
    tags: ["vaccinazioni", "cuccioli", "prevenzione"]
  },
  {
    id: 4,
    slug: "come-gestire-l-ansia-da-separazione-nei-cani",
    title: "Come Gestire l'Ansia da Separazione nei Cani",
    excerpt: "Consigli pratici per aiutare il tuo cane a superare l'ansia quando rimane solo a casa...",
    author: "Dr.ssa Laura Neri",
    date: "8 Gen 2024",
    readTime: "9 min",
    category: "comportamento",
    tags: ["comportamento", "ansia", "addestramento"]
  },
  {
    id: 5,
    slug: "igiene-dentale-negli-animali-domestici",
    title: "Igiene Dentale negli Animali Domestici",
    excerpt: "L'importanza della pulizia dei denti per prevenire malattie gengivali e mantenere la salute orale...",
    author: "Dr. Roberto Blu",
    date: "5 Gen 2024",
    readTime: "5 min",
    category: "cura",
    tags: ["igiene", "denti", "prevenzione"]
  },
  {
    id: 6,
    slug: "primo-soccorso-per-animali-cosa-fare-in-emergenza",
    title: "Primo Soccorso per Animali: Cosa Fare in Emergenza",
    excerpt: "Tecniche di primo soccorso che ogni proprietario di animali dovrebbe conoscere per situazioni di emergenza...",
    author: "Dr.ssa Sofia Gialli",
    date: "3 Gen 2024",
    readTime: "10 min",
    category: "emergenze",
    tags: ["primo soccorso", "emergenze", "sicurezza"]
  }
];

const BlogPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('tutti');
  const { toast } = useToast();

  const categories = [
    { id: 'tutti', name: 'Tutti gli Articoli' },
    { id: 'salute', name: 'Salute' },
    { id: 'alimentazione', name: 'Alimentazione' },
    { id: 'comportamento', name: 'Comportamento' },
    { id: 'cura', name: 'Cura e Igiene' },
    { id: 'emergenze', name: 'Emergenze' }
  ];

  const filteredPosts = selectedCategory === 'tutti' 
    ? blogPosts 
    : blogPosts.filter(post => post.category === selectedCategory);

  const handleSearch = () => {
    toast({
      title: "🚧 Questa funzione non è ancora implementata—ma non preoccuparti! Puoi richiederla nel tuo prossimo prompt! 🚀"
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Blog Veterinario - Consigli e Guide per Animali - Veterinari Italia</title>
        <meta name="description" content="Leggi i nostri articoli su salute, alimentazione e cura degli animali domestici. Consigli di esperti veterinari per il benessere dei tuoi amici a quattro zampe." />
      </Helmet>

      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Blog Veterinario
            </h1>
            <p className="text-xl text-indigo-100 max-w-2xl mx-auto">
              Consigli di esperti, guide pratiche e tutto quello che devi sapere per la cura dei tuoi animali
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-2xl mx-auto"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Cerca articoli..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-20 h-12 bg-white/90 border-white/30"
              />
              <Button 
                onClick={handleSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700"
              >
                Cerca
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-8 bg-white border-b">
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
                      ? "bg-indigo-600 hover:bg-indigo-700" 
                      : "hover:bg-indigo-50"
                  }`}
                >
                  <Tag className="mr-2 h-4 w-4" />
                  {category.name}
                </Button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedCategory === 'tutti' ? 'Tutti gli Articoli' : categories.find(c => c.id === selectedCategory)?.name}
              </h2>
              <div className="text-gray-600">
                {filteredPosts.length} articoli trovati
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="vet-card-hover border-0 shadow-lg h-full flex flex-col">
                  <CardContent className="p-0 flex-grow flex flex-col">
                    <div className="relative">
                      <img  className="w-full h-48 object-cover rounded-t-lg" alt={post.title} src="https://images.unsplash.com/photo-1504983875-d3b163aba9e6" />
                      <div className="absolute top-3 right-3 bg-indigo-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                        {categories.find(c => c.id === post.category)?.name}
                      </div>
                    </div>
                    
                    <div className="p-6 flex-grow flex flex-col">
                      <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                        {post.title}
                      </h3>
                      
                      <p className="text-gray-600 mb-4 line-clamp-3 flex-grow">
                        {post.excerpt}
                      </p>
                      
                      <div className="flex items-center text-sm text-gray-500 mb-4">
                        <User className="h-4 w-4 mr-1" />
                        <span className="mr-4">{post.author}</span>
                        <Calendar className="h-4 w-4 mr-1" />
                        <span className="mr-4">{post.date}</span>
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{post.readTime}</span>
                      </div>
                      
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {post.tags.slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <Button asChild className="w-full mt-auto bg-indigo-600 hover:bg-indigo-700">
                        <Link to={`/blog/${post.slug}`}>Leggi di più</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Rimani Aggiornato
            </h2>
            <p className="text-xl mb-8 text-indigo-100">
              Iscriviti alla nostra newsletter per ricevere i migliori consigli veterinari
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <Input
                placeholder="La tua email..."
                className="bg-white/90 border-white/30 text-gray-900"
              />
              <Button 
                className="bg-white text-indigo-600 hover:bg-gray-100"
                onClick={() => toast({
                  title: "🚧 Questa funzione non è ancora implementata—ma non preoccuparti! Puoi richiederla nel tuo prossimo prompt! 🚀"
                })}
              >
                Iscriviti
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default BlogPage;