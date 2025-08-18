import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, User, PawPrint, DollarSign, Upload, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const formSchema = z.object({
  fullName: z.string().min(2, { message: "Il nome è obbligatorio." }),
  email: z.string().email({ message: "Inserisci un'email valida." }),
  phone: z.string().optional(),
  species: z.string({ required_error: "Seleziona una specie." }),
  breed: z.string().optional(),
  birthDate: z.date().optional(),
  weight: z.number().positive({ message: "Il peso deve essere positivo." }).optional(),
  service: z.string({ required_error: "Seleziona una prestazione." }),
  urgency: z.enum(['Routine', 'Entro 72h', 'Emergenza < 24h'], { required_error: "Seleziona l'urgenza." }),
  budget: z.array(z.number()).optional(),
  description: z.string().max(500, { message: "Massimo 500 caratteri." }).optional(),
  documents: z.any().optional(),
  contactPreference: z.array(z.string()).refine(value => value.some(item => item), {
    message: "Devi selezionare almeno un metodo di contatto.",
  }),
  privacy: z.boolean().refine(val => val === true, { message: "Devi accettare l'informativa sulla privacy." }),
  marketing: z.boolean().optional(),
});

const QuoteRequestForm = ({ initialService }) => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [budget, setBudget] = useState([100]);

  const { register, handleSubmit, control, formState: { errors }, setValue, watch } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      service: initialService,
      budget: [100],
      contactPreference: [],
      privacy: false,
      marketing: false,
    },
  });

  const onSubmit = async (data) => {
    console.log("Dati inviati:", data);
    // Qui andrebbe la chiamata API a /api/quotes
    // E.g., await fetch('/api/quotes', { method: 'POST', body: JSON.stringify(data) });
    toast({
      title: "Richiesta inviata con successo!",
      description: "Riceverai presto i preventivi.",
    });
    setIsSubmitted(true);
  };

  const birthDate = watch('birthDate');

  if (isSubmitted) {
    return (
      <div className="text-center p-8">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
          <h3 className="mt-4 text-2xl font-bold text-gray-800">Richiesta Inviata!</h3>
          <p className="mt-2 text-gray-600">
            Riceverai fino a 3 preventivi personalizzati nelle prossime 24-48 ore.
          </p>
          <Button onClick={() => setIsSubmitted(false)} className="mt-6 bg-[#0FA958] hover:bg-[#0c8a47]">
            Invia un'altra richiesta
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 p-2 sm:p-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2"><User className="text-[#0FA958]" /> Dati del Proprietario</h3>
              <div>
                <Label htmlFor="fullName">Nome e Cognome</Label>
                <Input id="fullName" {...register("fullName")} />
                {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...register("email")} />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <Label htmlFor="phone">Telefono (facoltativo)</Label>
                  <Input id="phone" type="tel" {...register("phone")} />
                </div>
              </div>

              <h3 className="text-xl font-bold flex items-center gap-2 pt-4"><PawPrint className="text-[#0FA958]" /> Informazioni sull'Animale</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Specie</Label>
                  <Select onValueChange={(value) => setValue('species', value)}>
                    <SelectTrigger><SelectValue placeholder="Seleziona specie" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cane">Cane</SelectItem>
                      <SelectItem value="Gatto">Gatto</SelectItem>
                      <SelectItem value="Altro">Altro</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.species && <p className="text-red-500 text-sm mt-1">{errors.species.message}</p>}
                </div>
                <div>
                  <Label htmlFor="breed">Razza</Label>
                  <Input id="breed" {...register("breed")} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Data di nascita (facoltativa)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !birthDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {birthDate ? format(birthDate, "PPP") : <span>Scegli una data</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={birthDate} onSelect={(date) => setValue('birthDate', date)} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="weight">Peso (kg, facoltativo)</Label>
                  <Input id="weight" type="number" {...register("weight", { valueAsNumber: true })} />
                  {errors.weight && <p className="text-red-500 text-sm mt-1">{errors.weight.message}</p>}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2"><DollarSign className="text-[#0FA958]" /> Dettagli della Prestazione</h3>
              <div>
                <Label>Prestazione</Label>
                <Select defaultValue={initialService} onValueChange={(value) => setValue('service', value)}>
                  <SelectTrigger><SelectValue placeholder="Seleziona prestazione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tac-encefalica">TAC encefalica</SelectItem>
                    <SelectItem value="radiografia-torace">Radiografia torace</SelectItem>
                    <SelectItem value="visita-cardiologica">Visita cardiologica</SelectItem>
                    <SelectItem value="Altra">Altra prestazione</SelectItem>
                  </SelectContent>
                </Select>
                {errors.service && <p className="text-red-500 text-sm mt-1">{errors.service.message}</p>}
              </div>
              <div>
                <Label>Urgenza</Label>
                <RadioGroup onValueChange={(value) => setValue('urgency', value)} className="flex gap-4 pt-2">
                  <div className="flex items-center space-x-2"><RadioGroupItem value="Routine" id="r1" /><Label htmlFor="r1">Routine</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="Entro 72h" id="r2" /><Label htmlFor="r2">Entro 72h</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="Emergenza < 24h" id="r3" /><Label htmlFor="r3">Emergenza &lt; 24h</Label></div>
                </RadioGroup>
                {errors.urgency && <p className="text-red-500 text-sm mt-1">{errors.urgency.message}</p>}
              </div>
              <div>
                <Label>Budget indicativo: {budget[0]}€</Label>
                <Slider defaultValue={[100]} max={1000} step={10} onValueChange={(value) => { setBudget(value); setValue('budget', value); }} />
              </div>
              <div>
                <Label htmlFor="description">Descrizione libera / sintomi (max 500 caratteri)</Label>
                <Textarea id="description" {...register("description")} />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
              </div>
              <div>
                <Label htmlFor="documents" className="flex items-center gap-2"><Upload className="h-4 w-4" /> Allega documenti (PDF, JPG, PNG - max 5MB)</Label>
                <Input id="documents" type="file" accept=".pdf,.jpg,.jpeg,.png" {...register("documents")} />
              </div>
              <div>
                <Label>Preferenze di contatto</Label>
                <div className="flex flex-wrap gap-4 pt-2">
                  {['Email', 'Telefono', 'WhatsApp'].map(pref => (
                    <div key={pref} className="flex items-center space-x-2">
                      <Checkbox id={`pref-${pref}`} onCheckedChange={(checked) => {
                        const currentPrefs = watch('contactPreference') || [];
                        const newPrefs = checked ? [...currentPrefs, pref] : currentPrefs.filter(p => p !== pref);
                        setValue('contactPreference', newPrefs);
                      }} />
                      <Label htmlFor={`pref-${pref}`}>{pref}</Label>
                    </div>
                  ))}
                </div>
                {errors.contactPreference && <p className="text-red-500 text-sm mt-1">{errors.contactPreference.message}</p>}
              </div>
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <Checkbox id="privacy" {...register("privacy")} />
                  <Label htmlFor="privacy" className="text-sm">Accetto l'informativa sulla privacy (obbligatorio)</Label>
                </div>
                {errors.privacy && <p className="text-red-500 text-sm mt-1">{errors.privacy.message}</p>}
                <div className="flex items-start space-x-2">
                  <Checkbox id="marketing" {...register("marketing")} />
                  <Label htmlFor="marketing" className="text-sm">Vorrei ricevere offerte e aggiornamenti (facoltativo)</Label>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between items-center pt-4">
        {step > 1 && <Button type="button" variant="secondary" onClick={() => setStep(step - 1)}>Indietro</Button>}
        <div className="flex-grow"></div>
        {step < 2 && <Button type="button" className="bg-[#0FA958] hover:bg-[#0c8a47]" onClick={() => setStep(step + 1)}>Avanti</Button>}
        {step === 2 && <Button type="submit" className="bg-[#0FA958] hover:bg-[#0c8a47]"><Send className="mr-2 h-4 w-4" /> Invia Richiesta</Button>}
      </div>
    </form>
  );
};

export default QuoteRequestForm;