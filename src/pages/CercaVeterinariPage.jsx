
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation as useReactRouterLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MapPin, Star, Clock, Phone, Navigation, Check, Filter, TrendingUp, Award, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { supabase } from '@/lib/customSupabaseClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const cityCoordinates = {
  milano: [45.4642, 9.1900],
  roma: [41.9028, 12.4964],
  napoli: [40.8518, 14.2681],
};

const SkeletonCard = () => (
    <Card className="animate-pulse">
        <CardContent className="p-4 flex gap-4">
            <div className="w-24 h-24 bg-gray-200 rounded-lg"></div>
            <div className="flex-grow space-y-2">
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="flex gap-2 pt-2">
                    <div className="h-8 bg-gray-200 rounded w-24"></div>
                </div>
            </div>
        </CardContent>
    </Card>
);

const CercaVeterinariPage = () => {
  const { city } = useParams();
  const navigate = useNavigate();
  const locationRouter = useReactRouterLocation();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState(city || '');
  const [mapCenter, setMapCenter] = useState([41.9027835, 12.4963655]);
  const [clinics, setClinics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('relevance');

  useEffect(() => {
    const fetchClinics = async () => {
      setIsLoading(true);
      
      let query = supabase
        .from('clinics')
        .select(`
            id, name, address, phone, owner_id, slug,
            rating_avg_cached, rating_count_cached, rating_expires_at, rating_source,
            subscriptions!left(is_active)
        `)
        .eq('status', 'pubblicata');

      if (city) {
        query = query.ilike('address', `%${city}%`);
      }
      if(searchQuery){
        query = query.or(`name.ilike.%${searchQuery}%,specialization.ilike.%${searchQuery}%`);
      }

      if (sortBy === 'best') {
        query = query.order('rating_score_cached', { ascending: false, nulls: 'last' })
                     .order('rating_count_cached', { ascending: false, nulls: 'last' })
                     .order('name', { ascending: true });
      } else {
        query = query.order('name', { ascending: true });
      }
      
      const { data, error } = await query;
      
      if (error) {
        toast({ title: "Errore", description: "Impossibile caricare le cliniche.", variant: "destructive" });
        console.error(error);
      } else {
        const enhancedData = data.map(clinic => ({
            ...clinic,
            is_featured: clinic.subscriptions?.is_active || false,
            position: city && cityCoordinates[city] ? cityCoordinates[city] : [41.9028, 12.4964], // Posizione fittizia
            isOpen: true, // Dato fittizio
            isH24: clinic.name.toLowerCase().includes('h24'), // Dato fittizio
        }));
        
        if (sortBy === 'best') {
          enhancedData.sort((a, b) => {
            if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
            return 0;
          });
        }
        
        setClinics(enhancedData);
      }
      setIsLoading(false);
    };

    if (city && cityCoordinates[city]) {
      setMapCenter(cityCoordinates[city]);
    }

    fetchClinics();
  }, [city, sortBy, toast, searchQuery]);


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

  const cityCapitalized = city ? city.charAt(0).toUpperCase() + city.slice(1) : "Tutta Italia";

  const renderRating = (clinic) => {
    if (clinic.rating_expires_at && new Date(clinic.rating_expires_at) < new Date()) {
      return <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Aggiornamento in corso...</div>;
    }
    if (clinic.rating_avg_cached === null || clinic.rating_count_cached === null) {
      return <span className="text-gray-500">n.d.</span>;
    }
    return (
      <div className="flex items-center text-sm">
        <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
        <span className="font-semibold">{clinic.rating_avg_cached.toFixed(1)}</span>
        <span className="text-gray-500 ml-1">({clinic.rating_count_cached} recensioni)</span>
        <span className="text-xs text-gray-400 ml-2 border px-1 rounded">Fonte: {clinic.rating_source}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>{`Veterinari a ${cityCapitalized} - Trova i migliori per te`}</title>
        <meta name="description" content={`Cerca e trova i migliori veterinari, anche H24, a ${cityCapitalized}. Elenco aggiornato con mappa e filtri.`} />
      </Helmet>

       <section className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Veterinari a {cityCapitalized}
            </h1>
            <p className="text-xl text-green-100 max-w-3xl mx-auto mb-8">
              Trova il professionista perfetto per il tuo animale.
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
                      className="pl-10 h-12 bg-white/90 text-black"
                    />
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      placeholder="Città o CAP..."
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="pl-10 h-12 bg-white/90 text-black"
                    />
                  </div>
                  <Button onClick={handleSearch} className="h-12 bg-green-600 hover:bg-green-700 text-white font-semibold">
                    <Search className="mr-2 h-5 w-5" />
                    Cerca
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
             <div className="flex justify-between items-center mb-4">
                <p className="text-gray-600">
                    {isLoading ? 'Caricamento...' : `${clinics.length} risultati trovati`}
                </p>
                <div className="flex items-center gap-2">
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Ordina per" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="relevance">
                                <span className="flex items-center"><TrendingUp className="mr-2 h-4 w-4"/> Rilevanza</span>
                            </SelectItem>
                            <SelectItem value="best">
                                <span className="flex items-center"><Award className="mr-2 h-4 w-4"/> Migliori</span>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="space-y-4">
              {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
              ) : (
                clinics.map((vet, index) => (
                  <motion.div
                    key={vet.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                  >
                    <Card className={`vet-card-hover shadow-lg border-0 ${vet.is_featured ? 'border-2 border-yellow-400 bg-yellow-50' : ''}`}>
                      <CardContent className="p-4 flex gap-4">
                        <img  className="w-24 h-24 object-cover rounded-lg" alt={vet.name} src="https://images.unsplash.com/photo-1682001370529-878ec33a474f" />
                        <div className="flex-grow">
                            <div className="flex justify-between items-start">
                                <Link to={`/veterinari/${vet.slug}`} className="text-lg font-bold text-gray-900 hover:text-green-600">{vet.name}</Link>
                                <div className="flex items-center gap-2">
                                  {vet.is_featured && <div className="text-xs bg-yellow-400 text-yellow-900 font-bold px-2 py-1 rounded-full flex items-center"><Star className="h-3 w-3 mr-1"/>IN EVIDENZA</div>}
                                  {vet.isOpen && (
                                    <div className={`text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center ${vet.isH24 ? 'bg-red-500' : 'bg-green-500'}`}>
                                      <Clock className="h-3 w-3 mr-1" /> {vet.isH24 ? 'Aperto H24' : 'Aperto Ora'}
                                    </div>
                                  )}
                                </div>
                            </div>
                          <p className="text-sm text-gray-600 mb-1">{vet.address}</p>
                          <div className="mb-2">
                            {renderRating(vet)}
                          </div>
                          <Button size="sm" onClick={() => window.location.href=`tel:${vet.phone}`}>
                            <Phone className="mr-2 h-4 w-4" /> Chiama Ora
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </div>
          <div className="lg:w-1/2 h-96 lg:h-auto lg:sticky top-24">
            <MapContainer center={mapCenter} zoom={city ? 12 : 6} scrollWheelZoom={false} className="h-full w-full rounded-lg shadow-lg" key={city}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {clinics.map(vet => vet.position && (
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

export default CercaVeterinariPage;