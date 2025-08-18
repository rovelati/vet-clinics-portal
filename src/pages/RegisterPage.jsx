import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet';

const RegisterPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    password: '',
    confirmPassword: '',
    userType: 'proprietario'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const userType = params.get('type');
    if (userType === 'veterinario') {
      setFormData(prev => ({ ...prev, userType: 'veterinario' }));
    }
  }, [location]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = (e) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      toast({
        title: "Campi obbligatori",
        description: "Per favore compila tutti i campi obbligatori",
        variant: "destructive"
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password non corrispondenti",
        description: "Le password inserite non corrispondono",
        variant: "destructive"
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Password troppo corta",
        description: "La password deve essere di almeno 6 caratteri",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Registrazione completata!",
      description: "Verifica la tua email per continuare.",
    });

    if (formData.userType === 'veterinario') {
      setTimeout(() => navigate('/dashboard/veterinario'), 1500);
    } else {
      setTimeout(() => navigate('/'), 1500);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center py-12 px-4">
      <Helmet>
        <title>Registrazione - Crea il tuo Account - Veterinari Italia</title>
        <meta name="description" content="Registrati su Veterinari Italia per accedere a tutti i servizi: prenota visite, gestisci il tuo profilo e molto altro." />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl"
      >
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-8">
            <div className="bg-gradient-to-r from-green-500 to-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Crea il tuo Account
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Unisciti alla community di Veterinari Italia
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleRegister} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tipo di Account
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                    formData.userType === 'proprietario' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="userType"
                      value="proprietario"
                      checked={formData.userType === 'proprietario'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <User className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <div className="font-semibold">Proprietario</div>
                      <div className="text-sm text-gray-600">Ho un animale domestico</div>
                    </div>
                  </label>
                  
                  <label className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                    formData.userType === 'veterinario' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="userType"
                      value="veterinario"
                      checked={formData.userType === 'veterinario'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <img  className="h-8 w-8 mx-auto mb-2" alt="Icona veterinario" src="https://images.unsplash.com/photo-1657885428182-32c8f28fb3e3" />
                      <div className="font-semibold">Veterinario</div>
                      <div className="text-sm text-gray-600">Sono un professionista</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      type="text"
                      name="firstName"
                      placeholder="Il tuo nome"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="pl-10 h-12"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cognome *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      type="text"
                      name="lastName"
                      placeholder="Il tuo cognome"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="pl-10 h-12"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    type="email"
                    name="email"
                    placeholder="la-tua-email@esempio.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefono
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      type="tel"
                      name="phone"
                      placeholder="+39 123 456 7890"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="pl-10 h-12"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Città
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      type="text"
                      name="city"
                      placeholder="La tua città"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="pl-10 h-12"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Crea una password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="pl-10 pr-10 h-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conferma Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Conferma la password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="pl-10 pr-10 h-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  required
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500" 
                />
                <span className="ml-2 text-sm text-gray-600">
                  Accetto i{' '}
                  <Button variant="link" className="text-green-600 hover:text-green-700 p-0 h-auto">
                    Termini di Servizio
                  </Button>
                  {' '}e la{' '}
                  <Button variant="link" className="text-green-600 hover:text-green-700 p-0 h-auto">
                    Privacy Policy
                  </Button>
                </span>
              </div>

              <Button 
                type="submit"
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold"
              >
                Crea Account
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Hai già un account?{' '}
                <Link to="/login" className="text-green-600 hover:text-green-700 font-semibold">
                  Accedi qui
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default RegisterPage;