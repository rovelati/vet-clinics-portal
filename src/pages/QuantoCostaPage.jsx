import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Search, Dog, Cat, MapPin, DollarSign, BarChart, ChevronDown, ChevronUp, Stethoscope, Bone, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

const mockPriceData = [
  { id: 1, service: 'TAC encefalica', slug: 'tac-encefalica', animal: 'Cane', priceRange: '140–280 €', median: '200 €' },
  { id: 2, service: 'Radiografia torace', slug: 'radiografia-torace', animal: 'Gatto', priceRange: '40–80 €', median: '60 €' },
  { id: 3, service: 'Visita cardiologica', slug: 'visita-cardiologica', animal: 'Cane', priceRange: '60–120 €', median: '90 €' },
  { id: 4, service: 'Sterilizzazione femmina', slug: 'sterilizzazione-femmina', animal: 'Gatto', priceRange: '150–300 €', median: '220 €' },
  { id: 5, service: 'Eco addominale', slug: 'eco-addominale', animal: 'Cane', priceRange: '80–150 €', median: '110 €' },
  { id: 6, service: 'Pulizia denti', slug: 'pulizia-denti', animal: 'Cane', priceRange: '100–250 €', median: '160 €' },
  { id: 7, service: 'Vaccinazione annuale', slug: 'vaccinazione-annuale', animal: 'Gatto', priceRange: '30–60 €', median: '45 €' },
];

const topServices = [
    { name: 'Visita Base', range: '30-70 €', icon: Stethoscope },
    { name: 'Radiografia', range: '40-100 €', icon: Bone },
    { name: 'Esame del Sangue', range: '50-120 €', icon: Heart },
];

const QuantoCostaPage = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'service', direction: 'ascending' });
  const [expandedRow, setExpandedRow] = useState(null);

  const sortedData = [...mockPriceData].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  });

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Quanto Costa? Prezzi Servizi Veterinari in Italia</title>
        <meta name="description" content="Scopri i prezzi medi dei principali servizi veterinari in Italia. Confronta i costi per TAC, radiografie, visite specialistiche e altro per cani e gatti." />
      </Helmet>

      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl md:text-5xl font-bold mb-2">Quanto Costa?</h1>
            <p className="text-xl text-indigo-100 max-w-2xl mx-auto">Prezzi e costi dei servizi veterinari in Italia</p>
          </motion.div>
        </div>
      </section>

      <section className="py-12 -mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="shadow-2xl">
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <div className="relative">
                            <label htmlFor="search-service" className="block text-sm font-medium text-gray-700 mb-1">Cerca prestazione</label>
                            <Search className="absolute left-3 top-10 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <Input id="search-service" placeholder="Es. 'tac cane', 'visita ortopedica'..." className="pl-10 h-12" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <Button className="h-12 bg-indigo-600 hover:bg-indigo-700 text-lg">Cerca Prezzi</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Prestazioni più Richieste</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topServices.map(service => (
                    <motion.div key={service.name} whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
                        <Card className="text-center p-4 flex items-center justify-center gap-4 bg-white hover:bg-indigo-50 cursor-pointer">
                            <div className="bg-indigo-100 p-3 rounded-full">
                                <service.icon className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div>
                                <p className="font-semibold">{service.name}</p>
                                <p className="text-indigo-600 font-bold">{service.range}</p>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="overflow-hidden shadow-lg">
            <CardHeader>
                <CardTitle>Listino Prezzi Indicativo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-4 font-semibold cursor-pointer" onClick={() => requestSort('service')}>
                        <div className="flex items-center gap-1">Prestazione {getSortIcon('service')}</div>
                      </th>
                      <th className="p-4 font-semibold cursor-pointer" onClick={() => requestSort('animal')}>
                        <div className="flex items-center gap-1">Tipo Animale {getSortIcon('animal')}</div>
                      </th>
                      <th className="p-4 font-semibold">Prezzi Stimati</th>
                      <th className="p-4 font-semibold">Mediana</th>
                      <th className="p-4 font-semibold">Azione</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedData.map((item, index) => (
                      <React.Fragment key={item.id}>
                        <tr className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => setExpandedRow(expandedRow === item.id ? null : item.id)}>
                          <td className="p-4 font-medium">{item.service}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {item.animal === 'Cane' ? <Dog className="h-5 w-5 text-orange-500" /> : <Cat className="h-5 w-5 text-purple-500" />}
                              {item.animal}
                            </div>
                          </td>
                          <td className="p-4 font-mono">{item.priceRange}</td>
                          <td className="p-4 font-mono font-bold text-indigo-600">{item.median}</td>
                          <td className="p-4">
                            <Button asChild size="sm">
                              <Link to={`/quanto-costa/${item.slug}/cliniche`}>Vedi Cliniche</Link>
                            </Button>
                          </td>
                        </tr>
                        {expandedRow === item.id && (
                            <tr className="bg-indigo-50">
                                <td colSpan="5" className="p-4">
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.3 }}>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <h4 className="font-bold mb-2">{item.service} per {item.animal}</h4>
                                                <p className="text-sm text-gray-600">Dati basati su un campione di cliniche in Italia. I prezzi possono variare in base alla località e alla complessità del caso.</p>
                                            </div>
                                            <div>
                                                <h4 className="font-bold mb-2">Statistiche Prezzo</h4>
                                                <p className="text-sm">Range: <span className="font-semibold">{item.priceRange}</span></p>
                                                <p className="text-sm">Mediana: <span className="font-semibold">{item.median}</span></p>
                                            </div>
                                            <div>
                                                <h4 className="font-bold mb-2">Trova una clinica</h4>
                                                <Button asChild className="w-full">
                                                  <Link to={`/quanto-costa/${item.slug}/cliniche`}>Cerca cliniche nella tua zona</Link>
                                                </Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                </td>
                            </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default QuantoCostaPage;