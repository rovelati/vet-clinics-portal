import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Star, Clock, Phone, Navigation, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';

const VeterinariH24Page = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [mapCenter, setMapCenter] = useState([41.9027835, 12.4963655]); // Default to Rome

  const emergencyVets = [
    {
      id: 1,
      name: "Clinica Veterinaria San Marco",
      location: "Milano, MI",
      address: "Via San Marco 45",
      rating: 4.9,
      reviews: 156,
      waitTime: "15 min",
      position: [45.4742, 9.1885],
      slug: "milano/clinica-veterinaria-san-marco",
      image: "Clinica veterinaria moderna aperta 24 ore"
    },
    {
      id: 2,
      name: "Ospedale Veterinario Roma Nord",
      location: "Roma, RM",
      address: "Via Flaminia 234",
      rating: 4.8,
      reviews: 203,
      waitTime: "20 min",
      position: [41.9300, 12.4742],
      slug: "roma/ospedale-veterinario-roma-nord",
      image: "Ospedale veterinario con ambulanza"
    },
    {
      id: 3,
      name: "Centro Veterinario H24 Napoli",
      location: "Napoli, NA",
      address: "Corso Umberto 89",
      rating: 4.7,
      reviews: 134,
      waitTime: "10 min",
      position: [40.8488, 14.2592],
      slug: "napoli/centro-veterinario-h24-napoli",
      image: "Centro veterinario con insegna luminosa notturna"
    }
  ];

  const handleSearch = () => {
    toast({
      title: "🚧 Funzione di ricerca non implementata",
      description: "Questa è una demo. La ricerca non è attiva.",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Veterinari H24 – Trova subito un veterinario aperto 24h/24</title>
        <meta name="description" content="Cerca un veterinario H24 per specializzazione o nome. Trova cliniche aperte 24 ore su 24 con mappa interattiva e filtri." />
      </Helmet>

      <section className="bg-gradient-to-r from-red-600 to-orange-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Veterinari H24 – Trova subito un veterinario aperto 24h/24
            </h1>
            <p className="text-xl text-red-100 max-w-3xl mx-auto mb-8">
              Usa la ricerca per trovare la clinica di emergenza più vicina e adatta alle tue esigenze.
            </p>
            <Card className="max-w-3xl mx-auto p-4 glass-effect border-white/20">
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      placeholder="Specializzazione o nome..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-12 bg-white/90"
                    />
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      placeholder="Città o CAP..."
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="pl-10 h-12 bg-white/90"
                    />
                  </div>
                  <Button onClick={handleSearch} className="h-12 bg-green-600 hover:bg-green-700 text-white font-semibold">
                    <Search className="mr-2 h-5 w-5" />
                    Cerca Ora
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/2">
            <div className="flex flex-wrap gap-2 mb-4">
              <Button variant="outline" size="sm"><Check className="mr-2 h-4 w-4" />Aperti ora</Button>
              <Button variant="outline" size="sm"><Star className="mr-2 h-4 w-4" />Valutazione 4+</Button>
              <Button variant="outline" size="sm"><Navigation className="mr-2 h-4 w-4" />Ordina per distanza</Button>
            </div>
            <div className="space-y-4">
              {emergencyVets.map((vet, index) => (
                <motion.div
                  key={vet.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="vet-card-hover shadow-lg border-0">
                    <CardContent className="p-4 flex gap-4">
                      <img  className="w-24 h-24 object-cover rounded-lg" alt={vet.name} src="https://images.unsplash.com/photo-1652979777392-0f360d8bd1cc" />
                      <div className="flex-grow">
                        <div className="flex justify-between items-start">
                          <Link to={`/veterinari/${vet.slug}`} className="text-lg font-bold text-gray-900 hover:text-green-600">{vet.name}</Link>
                          <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                            <Clock className="h-3 w-3 mr-1" /> Aperto Ora
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{vet.address}</p>
                        <div className="flex items-center text-sm mb-2">
                          <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                          <span className="font-semibold">{vet.rating}</span>
                          <span className="text-gray-500 ml-1">({vet.reviews} recensioni)</span>
                          <span className="mx-2">•</span>
                          <span className="text-green-600 font-semibold">Attesa: {vet.waitTime}</span>
                        </div>
                        <Button size="sm" onClick={() => toast({ title: `Chiamando ${vet.name}...` })}>
                          <Phone className="mr-2 h-4 w-4" /> Chiama Ora
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="lg:w-1/2 h-96 lg:h-auto lg:sticky top-24">
            <MapContainer center={mapCenter} zoom={6} scrollWheelZoom={false} className="h-full w-full rounded-lg shadow-lg">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {emergencyVets.map(vet => (
                <Marker key={vet.id} position={vet.position}>
                  <Popup>
                    <div className="font-bold">{vet.name}</div>
                    <div>{vet.address}</div>
                    <Link to={`/veterinari/${vet.slug}`} className="text-blue-600 hover:underline">Vedi dettagli</Link>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VeterinariH24Page;