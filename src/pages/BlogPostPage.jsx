import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Calendar, Clock, User, Tag, Share2, Stethoscope } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';

const blogPosts = {
  "come-riconoscere-i-sintomi-di-malattia-nel-tuo-cane": {
    id: 1,
    slug: "come-riconoscere-i-sintomi-di-malattia-nel-tuo-cane",
    title: "Come Riconoscere i Sintomi di Malattia nel Tuo Cane",
    excerpt: "Impara a identificare i segnali che indicano quando il tuo cane potrebbe non stare bene e quando è necessario consultare un veterinario...",
    content: `
      <p>I cani non possono dirci a parole quando si sentono male, quindi è fondamentale per ogni proprietario imparare a riconoscere i segnali sottili e palesi che indicano un problema di salute. Un'osservazione attenta e quotidiana è il primo passo per garantire una vita lunga e sana al nostro amico a quattro zampe.</p>
      <h2 class="text-2xl font-bold my-4">Cambiamenti nel Comportamento</h2>
      <p>Uno dei primi indicatori di malessere è un cambiamento nel comportamento abituale. Un cane normalmente attivo che diventa letargico, apatico o che si nasconde potrebbe non sentirsi bene. Al contrario, un cane solitamente calmo che diventa irrequieto, ansioso o aggressivo potrebbe provare dolore o disagio.</p>
      <ul class="list-disc list-inside my-4 space-y-2">
        <li><strong>Letargia:</strong> Meno energia del solito, dorme più a lungo, non ha voglia di giocare.</li>
        <li><strong>Irritabilità:</strong> Ringhia o cerca di mordere quando viene toccato in una certa zona.</li>
        <li><strong>Isolamento:</strong> Cerca luoghi appartati per stare da solo.</li>
      </ul>
      <h2 class="text-2xl font-bold my-4">Abitudini Alimentari e Idratazione</h2>
      <p>La perdita di appetito è un segnale di allarme comune. Se il tuo cane rifiuta il cibo per più di 24 ore, è il caso di contattare il veterinario. Anche un aumento improvviso della sete (polidipsia) o della fame (polifagia) può indicare condizioni mediche come diabete o problemi renali.</p>
      <h2 class="text-2xl font-bold my-4">Problemi Gastrointestinali</h2>
      <p>Vomito e diarrea sono sintomi evidenti. Un episodio isolato potrebbe non essere grave, ma se persistono, sono accompagnati da sangue o letargia, la visita veterinaria è urgente. Presta attenzione anche a costipazione o difficoltà a defecare.</p>
      <p class="mt-4">Ricorda, sei tu il primo difensore della salute del tuo cane. In caso di dubbio, non esitare mai a contattare il tuo veterinario di fiducia. Una telefonata può fare la differenza.</p>
    `,
    author: "Dr. Marco Rossi",
    authorBio: "Veterinario specializzato in medicina interna con oltre 15 anni di esperienza. Appassionato di benessere animale e divulgazione scientifica.",
    authorAvatar: "https://i.pravatar.cc/150?u=dr-marco-rossi",
    date: "15 Gen 2024",
    readTime: "8 min",
    category: "Salute",
    tags: ["salute", "sintomi", "diagnosi"],
    image: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e"
  },
};

const parseItalianDate = (dateString) => {
  const months = {
    'Gen': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'Mag': '05', 'Giu': '06',
    'Lug': '07', 'Ago': '08', 'Set': '09', 'Ott': '10', 'Nov': '11', 'Dic': '12'
  };
  const parts = dateString.split(' ');
  if (parts.length !== 3) return null;
  const day = parts[0];
  const month = months[parts[1]];
  const year = parts[2];
  if (!day || !month || !year) return null;
  return new Date(`${year}-${month}-${day}`);
};

const BlogPostPage = () => {
  const { slug } = useParams();
  const { toast } = useToast();
  const post = blogPosts[slug];

  if (!post) {
    return <div className="text-center py-20">Articolo non trovato.</div>;
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copiato!",
      description: "Puoi condividere questo articolo con chi vuoi.",
    });
  };

  const publishedDate = parseItalianDate(post.date);

  return (
    <div className="bg-gray-50 py-8 md:py-12">
      <Helmet>
        <title>{post.title} - Blog Vet Italia</title>
        <meta name="description" content={post.excerpt} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:image" content={post.image} />
        <meta property="og:type" content="article" />
        <meta property="article:author" content={post.author} />
        {publishedDate && <meta property="article:published_time" content={publishedDate.toISOString()} />}
        {post.tags.map(tag => <meta key={tag} property="article:tag" content={tag} />)}
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="text-center mb-8">
            <div className="text-indigo-600 font-semibold uppercase tracking-wider">{post.category}</div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 my-4 leading-tight">{post.title}</h1>
            <div className="flex justify-center items-center text-sm text-gray-500 space-x-4">
              <div className="flex items-center"><User className="h-4 w-4 mr-1" /> {post.author}</div>
              <div className="flex items-center"><Calendar className="h-4 w-4 mr-1" /> {post.date}</div>
              <div className="flex items-center"><Clock className="h-4 w-4 mr-1" /> {post.readTime} di lettura</div>
            </div>
          </header>

          <div className="my-8 rounded-lg overflow-hidden shadow-2xl">
            <img  className="w-full h-auto md:h-[450px] object-cover" alt={post.title} src="https://images.unsplash.com/photo-1601941707251-5a887e9db2e1" />
          </div>

          <div className="prose prose-lg max-w-none mx-auto" dangerouslySetInnerHTML={{ __html: post.content }}></div>

          <div className="my-8 flex flex-wrap gap-2">
            {post.tags.map(tag => (
              <span key={tag} className="bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1 rounded-full flex items-center">
                <Tag className="h-4 w-4 mr-1" /> #{tag}
              </span>
            ))}
          </div>

          <hr className="my-8" />

          <section className="flex flex-col sm:flex-row items-center bg-white p-6 rounded-lg shadow-md">
            <Avatar className="h-20 w-20 mb-4 sm:mb-0 sm:mr-6">
              <AvatarImage src={post.authorAvatar} alt={post.author} />
              <AvatarFallback>{post.author.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left">
              <p className="text-gray-500 text-sm">Scritto da</p>
              <h3 className="text-xl font-bold text-gray-900">{post.author}</h3>
              <p className="text-gray-600 mt-1">{post.authorBio}</p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-auto">
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" /> Condividi
              </Button>
            </div>
          </section>

          <section className="mt-12">
            <Card className="bg-gradient-to-r from-green-500 to-blue-600 text-white shadow-xl">
              <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                  <h2 className="text-3xl font-bold">Hai bisogno di un parere esperto?</h2>
                  <p className="mt-2 text-green-100">Trova i migliori specialisti nella tua zona per una visita di controllo.</p>
                </div>
                <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100 flex-shrink-0">
                  <Link to="/quanto-costa">
                    <Stethoscope className="mr-2 h-5 w-5" /> Cerca uno Specialista
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </section>

        </article>
      </motion.div>
    </div>
  );
};

export default BlogPostPage;