import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { MapPin, Star, Clock, Phone, ChevronRight, Search, ArrowDownUp, Map, X, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import QuoteRequestForm from '@/components/QuoteRequestForm';

const mockClinics = [
  { id: 1, name: 'Clinica Veterinaria San Marco', address: 'Via San Marco 45, Milano', rating: 4.9, waitTime: '15 min', isOpen: true, isH24: true, price: 250, position: [45.4742, 9.1885], slug: 'milano/clinica-veterinaria-san-marco' },
  { id: 2, name: 'Ospedale Veterinario Roma Nord', address: 'Via Flaminia 234, Roma', rating: 4.8, waitTime: '30 min', isOpen: true, isH24: true, price: 280, position: [41.9300, 12.4742], slug: 'roma/ospedale-veterinario-roma-nord' },
  { id: 3, name: 'Ambulatorio Vet Life', address: 'Via Po 12, Torino', rating: 4.6, waitTime: '10 min', isOpen: true, isH24: false, price: null, position: [45.0629, 7.6743], slug: 'torino/ambulatorio-vet-life' },
  { id: 4, name: 'Centro Veterinario Partenopeo', address: 'Corso Umberto 89, Napoli', rating: 4.7, waitTime: '25 min', isOpen: true, isH24: true, price: 220, position: [40.8488, 14.2592], slug: 'napoli/centro-veterinario-partenopeo' },
];

const SkeletonCard = () => (
  <Card className="animate-pulse">
    <CardContent className="p-4 flex gap-4">
      <div className="w-16 h-16 bg-gray-200 rounded-md"></div>
      <div className="flex-grow space-y-2">
        <div className="h-5 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        <div className="flex gap-2 pt-2">
          <div className="h-8 bg-gray-200 rounded w-24"></div>
          <div className="h-8 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const ClinicheListingPage = () => {
  const { prestazione } = useParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [clinics, setClinics] = useState([]);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setClinics(mockClinics);
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [prestazione]);

  const prestazioneFormatted = prestazione
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const handleCall = (name) => {
    toast({
      title: `Chiamata in corso...`,
      description: `Stai per chiamare ${name}.`,
    });
  };

  const MapView = ({ clinicsData }) => (
    <MapContainer center={[41.9027835, 12.4963655]} zoom={6} scrollWheelZoom={false} className="h-full w-full">
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {clinicsData.map(clinic => (
        <Marker key={clinic.id} position={clinic.position}>
          <Popup>
            <div className="font-bold">{clinic.name}</div>
            <div>{clinic.address}</div>
            <Link to={`/veterinari/${clinic.slug}`} className="text-blue-600 hover:underline">Vedi dettagli</Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Helmet>
        <title>Cliniche per {prestazioneFormatted} - Vet Italia</title>
        <meta name="description" content={`Trova le migliori cliniche veterinarie che effettuano ${prestazioneFormatted}. Confronta prezzi, valutazioni e disponibilità.`} />
      </Helmet>

      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center text-sm text-gray-500">
            <Link to="/quanto-costa" className="hover:text-green-600">Quanto Costa?</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span className="font-semibold text-gray-700">{prestazioneFormatted}</span>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span className="font-semibold text-green-600">Cliniche</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Cliniche che effettuano {prestazioneFormatted}</h1>
        </div>
      </header>

      <div className="sticky top-16 bg-white/80 backdrop-blur-lg z-40 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input placeholder="Località, CAP o indirizzo" className="pl-10" />
            </div>
            <div className="flex items-center space-x-2">
              <ArrowDownUp className="h-5 w-5 text-gray-500" />
              <select className="border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500 text-sm">
                <option>Ordina per Distanza</option>
                <option>Ordina per Prezzo</option>
                <option>Ordina per Valutazione</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="aperti-ora" />
              <Label htmlFor="aperti-ora">Aperti ora</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="mostra-prezzo" />
              <Label htmlFor="mostra-prezzo">Mostra solo chi ha indicato il prezzo</Label>
            </div>
            <div className="lg:hidden ml-auto">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Map className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[80vh] p-0">
                  <SheetHeader className="p-4 border-b">
                    <SheetTitle>Mappa Cliniche</SheetTitle>
                  </SheetHeader>
                  <div className="h-full">
                    <MapView clinicsData={clinics} />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 xl:col-span-8">
            <div className="space-y-4">
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Tag className="h-6 w-6 text-orange-600" />
                    <p className="font-semibold text-orange-800">Prezzi troppo alti? Fai la tua offerta!</p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="secondary" className="bg-white text-orange-700 border border-orange-300 hover:bg-orange-100">Richiedi un preventivo</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[625px]">
                      <DialogHeader>
                        <DialogTitle>Richiedi un Preventivo Personalizzato</DialogTitle>
                      </DialogHeader>
                      <QuoteRequestForm initialService={prestazione} />
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              {isLoading ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : (
                clinics.map((clinic, index) => (
                  <motion.div
                    key={clinic.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card className="shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                      <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
                        <img  className="w-full sm:w-20 h-32 sm:h-20 object-cover rounded-md" alt={`Esterno della clinica ${clinic.name}`} src="https://images.unsplash.com/photo-1682001370529-878ec33a474f" />
                        <div className="flex-grow">
                          <h4 className="text-lg font-bold text-gray-800">{clinic.name}</h4>
                          <p className="text-sm text-gray-600">{clinic.address}</p>
                          <div className="flex items-center text-sm mt-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                            <span className="font-semibold">{clinic.rating}</span>
                            {clinic.waitTime && <span className="text-gray-500 ml-3">Attesa: ~{clinic.waitTime}</span>}
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {clinic.isOpen && <div className="text-xs font-semibold bg-green-100 text-green-800 px-2 py-1 rounded-full">Aperto ora</div>}
                            {clinic.isH24 && <div className="text-xs font-semibold bg-red-100 text-red-800 px-2 py-1 rounded-full">H24</div>}
                            {clinic.price ? (
                              <div className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Prezzo indicato ▸ €{clinic.price}</div>
                            ) : (
                              <div className="text-xs font-semibold bg-gray-100 text-gray-800 px-2 py-1 rounded-full">Prezzo non fornito</div>
                            )}
                          </div>
                        </div>
                        <div className="flex sm:flex-col justify-start sm:justify-center items-center gap-2 mt-4 sm:mt-0 sm:ml-auto">
                          <Button onClick={() => handleCall(clinic.name)} className="w-full sm:w-auto bg-[#0FA958] hover:bg-[#0c8a47]">
                            <Phone className="mr-2 h-4 w-4" /> Chiama
                          </Button>
                          <Button asChild variant="outline" className="w-full sm:w-auto">
                            <Link to={`/veterinari/${clinic.slug}`}>Dettagli</Link>
                          </Button>
                          {!clinic.price && (
                             <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="secondary" className="w-full sm:w-auto bg-gray-200 text-gray-700 hover:bg-gray-300">Chiedi prezzo</Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[625px]">
                                  <DialogHeader>
                                    <DialogTitle>Richiedi un Preventivo a {clinic.name}</DialogTitle>
                                  </DialogHeader>
                                  <QuoteRequestForm initialService={prestazione} />
                                </DialogContent>
                              </Dialog>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </div>
          <aside className="hidden lg:block lg:col-span-4 xl:col-span-4 h-[80vh] sticky top-32">
            <div className="h-full w-full rounded-lg overflow-hidden shadow-lg">
              <MapView clinicsData={clinics} />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default ClinicheListingPage;