import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const handleLogin = (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Campi obbligatori",
        description: "Per favore inserisci email e password",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "🚧 Questa funzione non è ancora implementata—ma non preoccuparti! Puoi richiederla nel tuo prossimo prompt! 🚀"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center py-12 px-4">
      <Helmet>
        <title>Login - Accedi al tuo Account - Veterinari Italia</title>
        <meta name="description" content="Accedi al tuo account Veterinari Italia per gestire il tuo profilo, prenotare visite e accedere ai servizi esclusivi." />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-8">
            <div className="bg-gradient-to-r from-green-500 to-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Accedi al tuo Account
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Benvenuto di nuovo! Inserisci le tue credenziali
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    type="email"
                    placeholder="la-tua-email@esempio.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="La tua password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                  <span className="ml-2 text-sm text-gray-600">Ricordami</span>
                </label>
                <Button variant="link" className="text-green-600 hover:text-green-700 p-0">
                  Password dimenticata?
                </Button>
              </div>

              <Button 
                type="submit"
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold"
              >
                Accedi
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Non hai ancora un account?{' '}
                <Link to="/register" className="text-green-600 hover:text-green-700 font-semibold">
                  Registrati qui
                </Link>
              </p>
            </div>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Oppure</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full h-12"
                  onClick={() => toast({
                    title: "🚧 Questa funzione non è ancora implementata—ma non preoccuparti! Puoi richiederla nel tuo prossimo prompt! 🚀"
                  })}
                >
                  <img  className="w-5 h-5 mr-2" alt="Google logo" src="https://images.unsplash.com/photo-1678483789111-3a04c4628bd6" />
                  Continua con Google
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full h-12"
                  onClick={() => toast({
                    title: "🚧 Questa funzione non è ancora implementata—ma non preoccuparti! Puoi richiederla nel tuo prossimo prompt! 🚀"
                  })}
                >
                  <img  className="w-5 h-5 mr-2" alt="Facebook logo" src="https://images.unsplash.com/photo-1684577088653-f14e310d841b" />
                  Continua con Facebook
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default LoginPage;