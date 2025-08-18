import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, MapPin, Phone, Mail, Clock, Star, Save, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet';

const VetProfilePage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: 'Dr. Marco Rossi',
    specialization: 'Chirurgia Veterinaria',
    clinic: 'Clinica Veterinaria San Marco',
    address: 'Via Roma 123, Milano, MI',
    phone: '+39 02 1234567',
    email: 'marco.rossi@clinicasanmarco.it',
    description: 'Veterinario specializzato in chirurgia con oltre 15 anni di esperienza. Mi occupo principalmente di interventi ortopedici e chirurgia generale.',
    services: ['Chirurgia Generale', 'Ortopedia', 'Emergenze', 'Visite Generali'],
    hours: {
      monday: '09:00 - 18:00',
      tuesday: '09:00 - 18:00',
      wednesday: '09:00 - 18:00',
      thursday: '09:00 - 18:00',
      friday: '09:00 - 18:00',
      saturday: '09:00 - 13:00',
      sunday: 'Chiuso'
    },
    rating: 4.9,
    reviews: 127
  });

  const { toast } = useToast();

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    setIsEditing(false);
    toast({
      title: "Profilo aggiornato",
      description: "Le modifiche sono state salvate con successo!"
    });
  };

  const handleImageUpload = () => {
    toast({
      title: "🚧 Questa funzione non è ancora implementata—ma non preoccuparti! Puoi richiederla nel tuo prossimo prompt! 🚀"
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Helmet>
        <title>Profilo Veterinario - Gestisci la tua Scheda - Veterinari Italia</title>
        <meta name="description" content="Gestisci il tuo profilo veterinario: aggiorna informazioni, servizi, orari e foto per essere trovato dai proprietari di animali." />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Il Mio Profilo</h1>
              <p className="text-gray-600 mt-2">Gestisci le informazioni del tuo studio veterinario</p>
            </div>
            <Button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className={isEditing ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}
            >
              {isEditing ? <Save className="mr-2 h-4 w-4" /> : <Edit className="mr-2 h-4 w-4" />}
              {isEditing ? 'Salva Modifiche' : 'Modifica Profilo'}
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-1"
          >
            <Card className="shadow-lg border-0">
              <CardContent className="p-6 text-center">
                <div className="relative mb-6">
                  <img  className="w-32 h-32 rounded-full mx-auto object-cover" alt={`Foto del ${profileData.name}`} src="https://images.unsplash.com/photo-1617565980755-d57f254b0ba7" />
                  {isEditing && (
                    <button
                      onClick={handleImageUpload}
                      className="absolute bottom-0 right-1/2 transform translate-x-1/2 translate-y-1/2 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{profileData.name}</h2>
                <p className="text-blue-600 font-medium mb-4">{profileData.specialization}</p>
                
                <div className="flex items-center justify-center mb-4">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <span className="ml-1 font-semibold">{profileData.rating}</span>
                  <span className="ml-1 text-gray-500">({profileData.reviews} recensioni)</span>
                </div>
                
                <div className="space-y-3 text-left">
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="text-sm">{profileData.address}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    <span className="text-sm">{profileData.phone}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    <span className="text-sm">{profileData.email}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2 space-y-6"
          >
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>Informazioni Generali</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome Completo
                    </label>
                    {isEditing ? (
                      <Input
                        value={profileData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                      />
                    ) : (
                      <p className="text-gray-900">{profileData.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Specializzazione
                    </label>
                    {isEditing ? (
                      <Input
                        value={profileData.specialization}
                        onChange={(e) => handleInputChange('specialization', e.target.value)}
                      />
                    ) : (
                      <p className="text-gray-900">{profileData.specialization}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Clinica
                  </label>
                  {isEditing ? (
                    <Input
                      value={profileData.clinic}
                      onChange={(e) => handleInputChange('clinic', e.target.value)}
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.clinic}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Indirizzo
                  </label>
                  {isEditing ? (
                    <Input
                      value={profileData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.address}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefono
                    </label>
                    {isEditing ? (
                      <Input
                        value={profileData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                      />
                    ) : (
                      <p className="text-gray-900">{profileData.phone}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    {isEditing ? (
                      <Input
                        value={profileData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                      />
                    ) : (
                      <p className="text-gray-900">{profileData.email}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrizione
                  </label>
                  {isEditing ? (
                    <Textarea
                      value={profileData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={4}
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.description}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>Servizi Offerti</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-2">
                    {profileData.services.map((service, index) => (
                      <Input
                        key={index}
                        value={service}
                        onChange={(e) => {
                          const newServices = [...profileData.services];
                          newServices[index] = e.target.value;
                          handleInputChange('services', newServices);
                        }}
                      />
                    ))}
                    <Button
                      variant="outline"
                      onClick={() => {
                        const newServices = [...profileData.services, ''];
                        handleInputChange('services', newServices);
                      }}
                    >
                      Aggiungi Servizio
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {profileData.services.map((service, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  Orari di Apertura
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(profileData.hours).map(([day, hours]) => (
                    <div key={day} className="flex justify-between items-center">
                      <span className="font-medium capitalize text-gray-700">
                        {day === 'monday' && 'Lunedì'}
                        {day === 'tuesday' && 'Martedì'}
                        {day === 'wednesday' && 'Mercoledì'}
                        {day === 'thursday' && 'Giovedì'}
                        {day === 'friday' && 'Venerdì'}
                        {day === 'saturday' && 'Sabato'}
                        {day === 'sunday' && 'Domenica'}
                      </span>
                      {isEditing ? (
                        <Input
                          value={hours}
                          onChange={(e) => {
                            const newHours = { ...profileData.hours };
                            newHours[day] = e.target.value;
                            handleInputChange('hours', newHours);
                          }}
                          className="w-32"
                        />
                      ) : (
                        <span className={hours === 'Chiuso' ? 'text-red-600' : 'text-gray-900'}>
                          {hours}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default VetProfilePage;