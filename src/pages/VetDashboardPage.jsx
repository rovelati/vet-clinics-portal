
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Globe, Clock, Save, PlusCircle, Trash2, Upload, Star, CheckCircle, XCircle, ChevronsUpDown, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { supabase } from '@/lib/customSupabaseClient';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const ServiceSelector = ({ selectedServiceIds, onServiceChange }) => {
  const [open, setOpen] = useState(false);
  const [taxonomy, setTaxonomy] = useState([]);

  useEffect(() => {
    supabase.from('services_taxonomy').select('id, name, category').then(({ data, error }) => {
      if (error) console.error('Error fetching services taxonomy:', error);
      else setTaxonomy(data || []);
    });
  }, []);

  const selectedServices = taxonomy.filter(s => selectedServiceIds.includes(s.id));

  const handleSelect = (currentValue) => {
    const service = taxonomy.find(s => s.name.toLowerCase() === currentValue);
    if (!service) return;

    const newSelectedIds = selectedServiceIds.includes(service.id)
      ? selectedServiceIds.filter(id => id !== service.id)
      : [...selectedServiceIds, service.id];
    onServiceChange(newSelectedIds);
    setOpen(false);
  };
  
  const handleRemove = (serviceId) => {
    const newSelectedIds = selectedServiceIds.filter(id => id !== serviceId);
    onServiceChange(newSelectedIds);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 min-h-[2rem]">
        {selectedServices.map((service) => (
          <div key={service.id} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
            {service.name}
            <button onClick={() => handleRemove(service.id)} className="text-blue-600 hover:text-blue-800">
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
            Aggiungi o rimuovi servizi...
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder="Cerca servizio..." />
            <CommandList>
              <CommandEmpty>Nessun servizio trovato.</CommandEmpty>
              <CommandGroup>
                {taxonomy.map((service) => (
                  <CommandItem
                    key={service.id}
                    value={service.name}
                    onSelect={handleSelect}
                  >
                    <CheckCircle className={cn("mr-2 h-4 w-4", selectedServiceIds.includes(service.id) ? "opacity-100" : "opacity-0")} />
                    {service.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

const VetDashboardPage = () => {
  const { user } = useAuth();
  const [clinicData, setClinicData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    const fetchClinic = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (error) {
        toast({ title: 'Errore', description: 'Impossibile caricare i dati della clinica.', variant: 'destructive' });
      } else if (data) {
        setClinicData({ ...data, service_ids: data.service_ids || [] });
      } else {
        setClinicData({
            name: '',
            specialization: '',
            address: '',
            phone: '',
            email: '',
            website: '',
            description: '',
            service_ids: [],
            lat: null,
            lng: null,
            hours: { Lunedì: '', Martedì: '', Mercoledì: '', Giovedì: '', Venerdì: '', Sabato: '', Domenica: '' },
            gallery: []
        });
      }
      setIsLoading(false);
    };
    fetchClinic();
  }, [user, toast]);

  const handleInputChange = (field, value) => {
    setClinicData(prev => ({ ...prev, [field]: value }));
  };

  const handleGeocode = async () => {
    if (!clinicData.address) {
      toast({ title: 'Attenzione', description: 'Inserisci un indirizzo prima di geocodificare.', variant: 'destructive' });
      return;
    }
    setIsGeocoding(true);
    try {
      const { data, error } = await supabase.functions.invoke('geocode', {
        body: JSON.stringify({ address: clinicData.address }),
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      setClinicData(prev => ({ ...prev, lat: data.lat, lng: data.lng }));
      toast({ title: 'Successo!', description: `Coordinate trovate: ${data.lat}, ${data.lng}` });

    } catch (error) {
      toast({ title: 'Errore di Geocodifica', description: error.message, variant: 'destructive' });
    } finally {
      setIsGeocoding(false);
    }
  };

  const handlePublish = () => {
    toast({
      title: '🚧 Funzionalità in arrivo!',
      description: "La pubblicazione della scheda sarà presto disponibile. Continua a compilare il tuo profilo!",
    });
  };

  const handleImageUpload = () => {
    toast({
      title: "🚧 Funzione non implementata",
      description: "L'upload delle immagini non è ancora disponibile.",
    });
  };

  if (isLoading) return <div className="flex justify-center items-center h-screen">Caricando dati clinica...</div>;
  if (!clinicData) return <div className="text-center py-10">Nessuna clinica associata a questo profilo. Creane una!</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Helmet>
        <title>Dashboard Veterinario - Gestisci la tua Scheda</title>
        <meta name="description" content="Gestisci il profilo della tua clinica: aggiorna informazioni, servizi, orari e foto." />
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Dashboard Clinica</h1>
              <p className="text-lg text-gray-600 mt-2">Modifica e pubblica le informazioni del tuo studio.</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="lg" className="mt-4 sm:mt-0 bg-green-600 hover:bg-green-700">
                  <Save className="mr-2 h-5 w-5" /> Pubblica per la Revisione
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Scegli il tuo piano</AlertDialogTitle>
                  <AlertDialogDescription>
                    Conferma la pubblicazione della tua scheda. Sarà soggetta a revisione.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex justify-center gap-4 my-4">
                  <Card className="flex-1 cursor-pointer hover:border-green-500" onClick={() => handlePublish('Premium')}>
                    <CardHeader>
                      <CardTitle className="flex items-center"><Star className="h-5 w-5 mr-2 text-yellow-400 fill-current" /> Piano Premium</CardTitle>
                      <CardDescription>Massima visibilità e funzionalità avanzate.</CardDescription>
                    </CardHeader>
                  </Card>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader><CardTitle>Informazioni Principali</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <InputWithLabel label="Nome Clinica" value={clinicData.name} onChange={(e) => handleInputChange('name', e.target.value)} />
                <InputWithLabel label="Specializzazione" value={clinicData.specialization} onChange={(e) => handleInputChange('specialization', e.target.value)} />
                <Textarea label="Descrizione" value={clinicData.description} onChange={(e) => handleInputChange('description', e.target.value)} rows={5} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Contatti e Indirizzo</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                    <InputWithLabel icon={<MapPin />} label="Indirizzo Completo" value={clinicData.address} onChange={(e) => handleInputChange('address', e.target.value)} />
                    <Button onClick={handleGeocode} disabled={isGeocoding}>
                      {isGeocoding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Geocodifica Indirizzo
                    </Button>
                    {clinicData.lat && clinicData.lng && <p className="text-sm text-green-700">Coordinate: {clinicData.lat}, {clinicData.lng}</p>}
                </div>
                <InputWithLabel icon={<Phone />} label="Telefono" value={clinicData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} />
                <InputWithLabel icon={<Mail />} label="Email" value={clinicData.email} onChange={(e) => handleInputChange('email', e.target.value)} />
                <InputWithLabel icon={<Globe />} label="Sito Web" value={clinicData.website} onChange={(e) => handleInputChange('website', e.target.value)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Servizi Offerti</CardTitle></CardHeader>
              <CardContent>
                <ServiceSelector 
                  selectedServiceIds={clinicData.service_ids}
                  onServiceChange={(ids) => handleInputChange('service_ids', ids)}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader><CardTitle>Orari di Apertura</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(clinicData.hours).map(([day, time]) => (
                  <div key={day} className="flex justify-between items-center">
                    <span className="font-medium capitalize text-gray-700">{day}</span>
                    <Input value={time} onChange={(e) => handleInputChange('hours', { ...clinicData.hours, [day]: e.target.value })} className="w-48" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Galleria Fotografica</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">Aggiungi immagini della tua clinica.</p>
                <Button variant="outline" onClick={handleImageUpload}><Upload className="mr-2 h-4 w-4" /> Carica Immagini</Button>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const InputWithLabel = ({ label, value, onChange, icon, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <div className="relative">
      {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">{React.cloneElement(icon, { className: "h-5 w-5 text-gray-400" })}</div>}
      <Input value={value || ''} onChange={onChange} className={cn(icon ? "pl-10" : "", props.className)} {...props} />
    </div>
  </div>
);

const TextareaWithLabel = ({ label, value, onChange, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <Textarea value={value || ''} onChange={onChange} {...props} />
    </div>
);


export default VetDashboardPage;

