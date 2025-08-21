import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { MapPin, Phone, Mail, Clock, Star, Globe, Navigation, MessageSquare, DollarSign, Edit, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/customSupabaseClient';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const isUUID = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v || '');
const normalizeWebsite = (w) => (!w ? '' : /^https?:\/\//i.test(w) ? w : `https://${w}`);
const toMoney = (n) => (Number.isFinite(Number(n)) ? `${Number(n).toFixed(2)} €` : '—');

const VetDetailPage = () => {
  const params = useParams();
  const location = useLocation();
  const [vetData, setVetData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      try {
        const slugPath = params['*'];
        const last = decodeURIComponent((slugPath || '').split('/').pop() || '');
        if (!last) {
          toast({ title: 'Errore', description: 'Identificativo clinica mancante.', variant: 'destructive' });
          return;
        }

        // 1) Clinica (per id o slug)
        const baseSelect = `
          id, owner_id, name, specialization, address, phone, email, website, description,
          hours, gallery_images, status, created_at, updated_at,
          rating_avg_cached, rating_count_cached, rating_score_cached, rating_expires_at,
          service_ids, slug, lat, lng
        `;
        const clinicRes = isUUID(last)
          ? await supabase.from('clinics').select(baseSelect).eq('id', last).maybeSingle()
          : await supabase.from('clinics').select(baseSelect).eq('slug', last).maybeSingle();

        const { data: clinicData, error: clinicError } = clinicRes;
        if (clinicError) throw clinicError;
        if (!clinicData) {
          toast({ title: 'Non trovato', description: 'Clinica non trovata.', variant: 'destructive' });
          return;
        }
        const clinicId = clinicData.id;

        // 2) Prezzi (service_id può essere NULL)
        const { data: prices, error: priceErr } = await supabase
          .from('services_prices')
          .select('id, price, animal_type, service_id, services_taxonomy(name)')
          .eq('clinic_id', clinicId)
          .order('id', { ascending: true });
        if (priceErr) throw priceErr;

        // 3) Costruiamo l’insieme di servizi da mostrare:
        //    - quelli dalla clinica (service_ids)
        //    - quelli che compaiono nel listino (services_prices.service_id non null)
        const idsFromClinic = Array.isArray(clinicData.service_ids) ? clinicData.service_ids : [];
        const idsFromPrices = Array.isArray(prices)
          ? prices.map(p => p.service_id).filter(Boolean)
          : [];
        const allServiceIds = Array.from(new Set([...(idsFromClinic || []), ...(idsFromPrices || [])]));
        let taxonomyMap = new Map();
        if (allServiceIds.length > 0) {
          const { data: services, error: taxErr } = await supabase
            .from('services_taxonomy')
            .select('id, name, category')
            .in('id', allServiceIds);
          if (taxErr) throw taxErr;
          if (Array.isArray(services)) taxonomyMap = new Map(services.map(s => [s.id, { name: s.name, category: s.category || '' }]));
        }

        // 4) Recensioni: summary + ultime 3 (se mancano, useremo fallback dai campi della clinica)
        const { data: summary, error: sumErr } = await supabase
          .from('google_reviews_summary')
          .select('*')
          .eq('clinic_id', clinicId)
          .maybeSingle();
        if (sumErr && sumErr.code !== 'PGRST116') throw sumErr;

        const { data: latest3, error: revErr } = await supabase
          .from('google_reviews_latest3')
          .select('*')
          .eq('clinic_id', clinicId)
          .order('created_at_g', { ascending: false });
        if (revErr && revErr.code !== 'PGRST116') throw revErr;

        if (cancelled) return;

        // Price list: se c’è taxonomy mostra il nome, altrimenti “Servizio”
        const priceList = Array.isArray(prices)
          ? prices.map(p => ({
              id: p.id,
              service: p.services_taxonomy?.name || 'Servizio',
              price: toMoney(p.price),
              animal_type: p.animal_type || '',
            }))
          : [];

        // Services pill: dalla taxonomyMap (unione clinic + prezzi)
        const servicesList = Array.from(taxonomyMap.values());

        // Geo
        const lat = clinicData.lat ?? null;
        const lng = clinicData.lng ?? null;
        const position = (lat !== null && lng !== null) ? [Number(lat), Number(lng)] : [45.4742, 9.1885];

        // Fallback per rating: se summary manca uso i campi in clinics
        const ratingSummary =
          summary || (clinicData.rating_avg_cached || clinicData.rating_count_cached
            ? {
                rating_avg_cached: clinicData.rating_avg_cached,
                rating_count_cached: clinicData.rating_count_cached,
                expires_at: clinicData.rating_expires_at,
              }
            : null);

        const transformedData = {
          id: clinicData.id,
          name: clinicData.name,
          specialization: clinicData.specialization || '',
          address: clinicData.address || '',
          phone: clinicData.phone || '',
          email: clinicData.email || '',
          website: clinicData.website || '',
          position,
          description: clinicData.description || '',
          gallery: Array.isArray(clinicData.gallery_images) && clinicData.gallery_images.length
            ? clinicData.gallery_images
            : ['https://images.unsplash.com/photo-1599428628295-6eee34346ffc'],
          hours: clinicData.hours || { Lunedì: 'Non specificato' },
          servicesList,
          priceList,
          isH24: (clinicData.name || '').toLowerCase().includes('h24'),
          ratingSummary,
          latestReviews: Array.isArray(latest3) ? latest3 : [],
          googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinicData.name || '')}+${encodeURIComponent(clinicData.address || '')}`,
          rating_avg_cached: clinicData.rating_avg_cached ?? null,
          rating_count_cached: clinicData.rating_count_cached ?? null,
          rating_expires_at: clinicData.rating_expires_at ?? null
        };

        setVetData(transformedData);
      } catch (err) {
        console.error('Errore caricamento dettaglio:', err);
        toast({ title: 'Errore di caricamento', description: String(err.message || err), variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [params, toast]);

  const renderStars = (rating) => {
    if (rating === null || rating === undefined) return null;
    const r = Number(rating);
    const full = Math.max(0, Math.min(5, Math.floor(r)));
    const stars = [];
    for (let i = 0; i < full; i++) stars.push(<Star key={`full-${i}`} className="h-5 w-5 text-yellow-400 fill-current" />);
    for (let i = full; i < 5; i++) stars.push(<Star key={`empty-${i}`} className="h-5 w-5 text-gray-300" />);
    return stars;
  };

  if (isLoading) return <div className="flex justify-center items-center min-h-screen">Caricamento...</div>;
  if (!vetData)  return <div className="text-center py-20">Nessun dato trovato per questa clinica.</div>;

  const isRatingExpired = vetData.ratingSummary?.expires_at && new Date(vetData.ratingSummary.expires_at) < new Date();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Helmet>
        <title>{`${vetData.name}${vetData.specialization ? ' - ' + vetData.specialization : ''}`}</title>
        <meta name="description" content={`Dettagli, servizi e contatti di ${vetData.name} – ${vetData.address}. Telefono: ${vetData.phone}.`} />
        <meta property="og:title" content={vetData.name} />
        <meta property="og:description" content={vetData.description} />
        <meta property="og:image" content={vetData.gallery[0]} />
        <link rel="canonical" href={`${window.location.origin}${location.pathname}`} />
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Card className="shadow-xl border-0 overflow-hidden">
            <div className="relative h-64 bg-gray-200">
              <img src={vetData.gallery[0]} className="w-full h-full object-cover" alt={`Galleria di ${vetData.name}`} />
              <div className="absolute inset-0 bg-black/30"></div>
              <div className="absolute bottom-6 left-6 text-white">
                <h1 className="text-4xl font-bold">{vetData.name}</h1>
                {!!vetData.specialization && <p className="text-xl">{vetData.specialization}</p>}
              </div>
              {vetData.isH24 && (
                <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center">
                  <Clock className="h-4 w-4 mr-1" /> H24
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader><CardTitle>Descrizione</CardTitle></CardHeader>
                  <CardContent><p>{vetData.description || '—'}</p></CardContent>
                </Card>

                {vetData.servicesList && vetData.servicesList.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle>Servizi Offerti</CardTitle></CardHeader>
                    <CardContent>
                      <ul className="flex flex-wrap gap-2">
                        {vetData.servicesList.map(({ name }, i) => (
                          <li key={`${name}-${i}`} className="px-2 py-1 bg-gray-100 rounded-full text-sm">{name}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {vetData.priceList && vetData.priceList.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="flex items-center"><DollarSign className="mr-2 h-6 w-6 text-green-600" /> Listino Prezzi</CardTitle></CardHeader>
                    <CardContent>
                      <ul className="divide-y divide-gray-200">
                        {vetData.priceList.map(item => (
                          <li key={item.id} className="flex justify-between items-center py-3">
                            <span className="text-gray-700">
                              {item.service}
                              {item.animal_type ? ` (${item.animal_type.charAt(0).toUpperCase() + item.animal_type.slice(1)})` : ''}
                            </span>
                            <span className="font-bold text-green-600">{item.price}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {(vetData.ratingSummary || (vetData.latestReviews && vetData.latestReviews.length > 0)) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center"><MessageSquare className="mr-2 h-6 w-6 text-blue-600" /> Recensioni da Google</span>
                        {isRatingExpired && <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Aggiornamento in corso…</div>}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {vetData.ratingSummary && (
                        <div className="flex items-center mb-4">
                          <div className="flex">{renderStars(vetData.ratingSummary.rating_avg_cached)}</div>
                          <p className="ml-2 text-gray-600 font-semibold">
                            {typeof vetData.ratingSummary.rating_avg_cached === 'number'
                              ? `${vetData.ratingSummary.rating_avg_cached.toFixed(1)} su 5`
                              : '—'}
                            {typeof vetData.ratingSummary.rating_count_cached === 'number'
                              ? ` (${vetData.ratingSummary.rating_count_cached} valutazioni)`
                              : ''}
                          </p>
                        </div>
                      )}
                      {vetData.latestReviews && vetData.latestReviews.length > 0 ? (
                        <div className="space-y-4">
                          {vetData.latestReviews.map((review) => (
                            <div key={review.review_id} className="flex items-start space-x-4">
                              <Avatar>
                                <AvatarImage src={review.reviewer_photo || ''} alt={review.reviewer_name || 'Utente Google'} />
                                <AvatarFallback>{(review.reviewer_name || 'U')[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center">
                                  <p className="font-semibold">{review.reviewer_name || 'Utente Google'}</p>
                                  <div className="flex ml-2">{renderStars(review.star_rating)}</div>
                                </div>
                                {!!review.comment && <p className="text-gray-600 text-sm mt-1">"{review.comment}"</p>}
                                {review.created_at_g && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    {format(new Date(review.created_at_g), "d MMMM yyyy", { locale: it })}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">Nessuna recensione disponibile al momento.</p>
                      )}
                      <Button asChild variant="outline" className="mt-6 w-full">
                        <a href={vetData.googleMapsUrl} target="_blank" rel="noopener noreferrer">
                          Leggi tutte le recensioni su Google <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader><CardTitle>Contatti e Orari</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 mr-3 mt-1 text-gray-600" />
                      <div>
                        <p>{vetData.address}</p>
                        <a
                          href={`https://www.openstreetmap.org/directions?from=&to=${vetData.position[0]},${vetData.position[1]}`}
                          target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm flex items-center">
                          <Navigation className="h-4 w-4 mr-1" /> Come arrivare
                        </a>
                      </div>
                    </div>
                    {vetData.phone && (
                      <div className="flex items-center">
                        <Phone className="h-5 w-5 mr-3 text-gray-600" />
                        <a href={`tel:${vetData.phone}`} className="hover:underline">{vetData.phone}</a>
                      </div>
                    )}
                    {vetData.email && (
                      <div className="flex items-center">
                        <Mail className="h-5 w-5 mr-3 text-gray-600" />
                        <a href={`mailto:${vetData.email}`} className="hover:underline">{vetData.email}</a>
                      </div>
                    )}
                    {vetData.website && (
                      <div className="flex items-center">
                        <Globe className="h-5 w-5 mr-3 text-gray-600" />
                        <a href={normalizeWebsite(vetData.website)} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {vetData.website}
                        </a>
                      </div>
                    )}
                    <div className="pt-2">
                      <h4 className="font-semibold mb-2">Orari</h4>
                      <ul className="text-sm space-y-1">
                        {Object.entries(vetData.hours || {}).map(([day, time]) => (
                          <li key={day} className="flex justify-between">
                            <span>{day}</span>
                            <span className="font-medium">{String(time)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <div className="h-64 rounded-lg overflow-hidden shadow-md">
                  <MapContainer center={vetData.position} zoom={15} scrollWheelZoom={false} className="h-full w-full">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={vetData.position}>
                      <Popup>{vetData.name}</Popup>
                    </Marker>
                  </MapContainer>
                </div>

                <div className="space-y-2">
                  <Button asChild size="lg" variant="secondary" className="w-full">
                    <Link to="/register?type=veterinario&claim=true">
                      <Edit className="mr-2 h-5 w-5" /> Reclama questa attività
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default VetDetailPage;
