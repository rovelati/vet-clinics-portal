import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import QuoteRequestForm from '@/components/QuoteRequestForm';
import { FileText } from 'lucide-react';

const RichiediPreventivoPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Helmet>
        <title>Richiedi un Preventivo - Vet Italia</title>
        <meta name="description" content="Invia una richiesta di preventivo personalizzata per servizi veterinari. Ricevi fino a 3 offerte dalle migliori cliniche." />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow-2xl">
            <CardHeader className="text-center bg-gray-50 p-8">
              <div className="mx-auto bg-green-100 p-4 rounded-full w-fit">
                <FileText className="h-10 w-10 text-green-600" />
              </div>
              <CardTitle className="mt-4 text-3xl font-bold text-gray-800">Richiedi un Preventivo Personalizzato</CardTitle>
              <CardDescription className="text-lg text-gray-600 mt-2">
                Compila il modulo sottostante per ricevere fino a 3 offerte su misura dalle cliniche della tua zona.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-8">
              <QuoteRequestForm />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default RichiediPreventivoPage;