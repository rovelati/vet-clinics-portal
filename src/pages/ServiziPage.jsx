import React from 'react';
import { motion } from 'framer-motion';
import { Stethoscope, Scissors, Heart, Eye, Bone, Pill, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';

const ServiziPage = () => {
  const { toast } = useToast();

  const services = [
    {
      id: 1,
      name: "Visite Generali",
      icon: Stethoscope,
      description: "Controlli di routine e diagnosi per mantenere la salute del tuo animale",
      features: ["Check-up completo", "Vaccinazioni", "Controllo peso", "Consigli nutrizionali"]
    },
    {
      id: 2,
      name: "Chirurgia Veterinaria",
      icon: Scissors,
      description: "Interventi chirurgici specializzati con tecnologie all'avanguardia",
      features: ["Chirurgia generale", "Sterilizzazioni", "Microchip", "Chirurgia d'urgenza"]
    },
    {
      id: 3,
      name: "Cardiologia",
      icon: Heart,
      description: "Diagnosi e cura delle patologie cardiache negli animali domestici",
      features: ["Ecocardiografia", "ECG", "Holter", "Terapie cardiache"]
    },
    {
      id: 4,
      name: "Oftalmologia",
      icon: Eye,
      description: "Cura specialistica degli occhi e della vista dei tuoi animali",
      features: ["Visite oculistiche", "Chirurgia oculare", "Trattamento cataratta", "Terapie laser"]
    },
    {
      id: 5,
      name: "Ortopedia",
      icon: Bone,
      description: "Trattamento di fratture, displasie e problemi articolari",
      features: ["Radiografie", "Protesi", "Fisioterapia", "Riabilitazione"]
    },
    {
      id: 6,
      name: "Farmacia Veterinaria",
      icon: Pill,
      description: "Medicinali specializzati e prodotti per la cura degli animali",
      features: ["Farmaci prescritti", "Integratori", "Antiparassitari", "Prodotti igiene"]
    }
  ];

  const handleServiceClick = (serviceName) => {
    toast({
      title: "🚧 Questa funzione non è ancora implementata—ma non preoccuparti! Puoi richiederla nel tuo prossimo prompt! 🚀"
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Servizi Veterinari - Cure Specialistiche per Animali - Veterinari Italia</title>
        <meta name="description" content="Scopri tutti i servizi veterinari disponibili: visite, chirurgia, cardiologia, oftalmologia e molto altro. Trova il servizio giusto per il tuo animale." />
      </Helmet>

      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Servizi Veterinari Specializzati
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Cure complete e specialistiche per la salute e il benessere dei tuoi animali domestici
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="vet-card-hover cursor-pointer border-0 shadow-lg h-full">
                  <CardContent className="p-0">
                    <div className="relative">
                      <img  className="w-full h-48 object-cover rounded-t-lg" alt={service.name} src="https://images.unsplash.com/photo-1516726283839-a493d9f167aa" />
                      <div className="absolute top-4 left-4 bg-white/90 p-3 rounded-full">
                        <service.icon className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-3">{service.name}</h3>
                      <p className="text-gray-600 mb-4">{service.description}</p>
                      
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-2">Servizi Inclusi:</h4>
                        <ul className="space-y-1">
                          {service.features.map((feature, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-center">
                              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleServiceClick(service.name)}
                      >
                        Trova Specialisti
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
              Non Trovi il Servizio che Cerchi o Vuoi un Prezzo Migliore?
            </h2>
            <p className="text-xl mb-8 text-green-100">
              Inviaci una richiesta di preventivo. È facile, veloce e senza impegno!
            </p>
            <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              <Link to="/richiedi-preventivo">
                <FileText className="mr-2 h-5 w-5" />
                Richiedi un Preventivo
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default ServiziPage;