import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, Search, ChevronDown, ChevronRight, 
  MessageCircle, Mail, Phone, Book, Users, Settings,
  Star, Shield, CreditCard, MapPin, Clock, Heart
} from 'lucide-react';

interface HelpCenterProps {
  onClose: () => void;
  showNotification: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

const HelpCenter: React.FC<HelpCenterProps> = ({ onClose, showNotification }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const categories = [
    {
      id: 'getting-started',
      title: 'Iniziare',
      icon: Book,
      color: 'from-blue-500 to-blue-600',
      description: 'Come utilizzare la piattaforma'
    },
    {
      id: 'account',
      title: 'Account',
      icon: Users,
      color: 'from-green-500 to-green-600',
      description: 'Gestione profilo e impostazioni'
    },
    {
      id: 'businesses',
      title: 'Attività',
      icon: MapPin,
      color: 'from-purple-500 to-purple-600',
      description: 'Ricerca e gestione attività'
    },
    {
      id: 'reviews',
      title: 'Recensioni',
      icon: Star,
      color: 'from-yellow-500 to-yellow-600',
      description: 'Come lasciare e gestire recensioni'
    },
    {
      id: 'favorites',
      title: 'Preferiti',
      icon: Heart,
      color: 'from-red-500 to-red-600',
      description: 'Salvare e organizzare preferiti'
    },
    {
      id: 'privacy',
      title: 'Privacy',
      icon: Shield,
      color: 'from-gray-500 to-gray-600',
      description: 'Sicurezza e privacy'
    }
  ];

  const faqs = {
    'getting-started': [
      {
        id: '1',
        question: 'Come posso cercare attività nella mia zona?',
        answer: 'Utilizza la barra di ricerca nella homepage inserendo il nome dell\'attività, categoria o servizio che stai cercando. Puoi anche utilizzare i filtri per categoria e località per risultati più precisi.'
      },
      {
        id: '2',
        question: 'Come funziona la geolocalizzazione?',
        answer: 'La piattaforma utilizza la tua posizione per mostrarti attività nelle vicinanze. Assicurati di aver dato il permesso di accesso alla posizione nel tuo browser.'
      },
      {
        id: '3',
        question: 'Posso utilizzare la piattaforma senza registrarmi?',
        answer: 'Sì, puoi navigare e cercare attività senza registrarti. Tuttavia, per lasciare recensioni, salvare preferiti e contattare le attività dovrai creare un account.'
      }
    ],
    'account': [
      {
        id: '4',
        question: 'Come creo un account?',
        answer: 'Clicca su "Registrati" nell\'header della pagina, inserisci i tuoi dati (nome, email, password) e conferma la registrazione tramite l\'email che riceverai.'
      },
      {
        id: '5',
        question: 'Ho dimenticato la password, cosa faccio?',
        answer: 'Nella pagina di login, clicca su "Password dimenticata?" e inserisci la tua email. Riceverai un link per reimpostare la password.'
      },
      {
        id: '6',
        question: 'Come posso modificare le informazioni del mio profilo?',
        answer: 'Accedi al tuo account, clicca sul menu utente in alto a destra e seleziona "Profilo e Impostazioni". Qui potrai modificare nome, telefono, bio e altre informazioni.'
      }
    ],
    'businesses': [
      {
        id: '7',
        question: 'Come posso contattare un\'attività?',
        answer: 'Nella pagina di dettaglio dell\'attività troverai i pulsanti per chiamare, inviare email o richiedere informazioni. Alcune attività offrono anche la prenotazione online.'
      },
      {
        id: '8',
        question: 'Come posso segnalare informazioni errate su un\'attività?',
        answer: 'Nella pagina dell\'attività, utilizza il pulsante "Segnala" per comunicarci eventuali informazioni errate. Il nostro team verificherà e aggiornerà i dati.'
      },
      {
        id: '9',
        question: 'Posso suggerire una nuova attività?',
        answer: 'Sì! Utilizza il modulo "Suggerisci attività" che trovi nel footer del sito. Verificheremo le informazioni e aggiungeremo l\'attività al database.'
      }
    ],
    'reviews': [
      {
        id: '10',
        question: 'Come posso lasciare una recensione?',
        answer: 'Devi essere registrato e aver effettuato l\'accesso. Vai nella pagina dell\'attività, scorri fino alla sezione recensioni e clicca su "Scrivi una recensione".'
      },
      {
        id: '11',
        question: 'Posso modificare o eliminare una recensione?',
        answer: 'Sì, puoi modificare o eliminare le tue recensioni accedendo al tuo profilo nella sezione "Le mie recensioni".'
      },
      {
        id: '12',
        question: 'Perché la mia recensione non è ancora visibile?',
        answer: 'Le recensioni vengono moderate dal nostro team per garantire qualità e autenticità. Il processo richiede solitamente 24-48 ore.'
      }
    ],
    'favorites': [
      {
        id: '13',
        question: 'Come aggiungo un\'attività ai preferiti?',
        answer: 'Clicca sull\'icona del cuore nella scheda dell\'attività o nella sua pagina di dettaglio. L\'attività verrà salvata nella tua lista preferiti.'
      },
      {
        id: '14',
        question: 'Dove posso vedere i miei preferiti?',
        answer: 'Accedi al menu utente e seleziona "I Miei Preferiti" per vedere tutte le attività che hai salvato.'
      },
      {
        id: '15',
        question: 'Posso organizzare i preferiti in categorie?',
        answer: 'Attualmente i preferiti sono organizzati per data di aggiunta, ma stiamo lavorando per introdurre categorie personalizzate.'
      }
    ],
    'privacy': [
      {
        id: '16',
        question: 'Come vengono utilizzati i miei dati personali?',
        answer: 'I tuoi dati vengono utilizzati solo per fornire i servizi della piattaforma. Non condividiamo informazioni personali con terze parti senza il tuo consenso.'
      },
      {
        id: '17',
        question: 'Posso eliminare il mio account?',
        answer: 'Sì, puoi richiedere l\'eliminazione del tuo account contattando il supporto. Tutti i tuoi dati verranno rimossi permanentemente.'
      },
      {
        id: '18',
        question: 'Come posso controllare le notifiche?',
        answer: 'Nelle impostazioni del profilo puoi gestire le preferenze per email e notifiche push, scegliendo quali comunicazioni ricevere.'
      }
    ]
  };

  const filteredFaqs = Object.entries(faqs).reduce((acc, [category, questions]) => {
    if (activeCategory && category !== activeCategory) return acc;
    
    const filtered = questions.filter(faq =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    
    return acc;
  }, {} as typeof faqs);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Centro Assistenza</h2>
                <p className="text-blue-100">Trova risposte alle tue domande</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              ✕
            </motion.button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
            <input
              type="text"
              placeholder="Cerca nelle FAQ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex h-[calc(90vh-200px)]">
          {/* Sidebar */}
          <div className="w-80 border-r border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Categorie
            </h3>
            <div className="space-y-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveCategory(null)}
                className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all text-left ${
                  activeCategory === null
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Book className="h-4 w-4 text-white" />
                </div>
                <span className="font-medium">Tutte le categorie</span>
              </motion.button>

              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <motion.button
                    key={category.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all text-left ${
                      activeCategory === category.id
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className={`w-8 h-8 bg-gradient-to-r ${category.color} rounded-lg flex items-center justify-center`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{category.title}</p>
                      <p className="text-xs opacity-70">{category.description}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Contact Support */}
            <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                Hai bisogno di aiuto?
              </h4>
              <div className="space-y-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => showNotification('📧 Apertura client email...', 'info')}
                  className="w-full flex items-center space-x-2 p-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  <span>Invia Email</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => showNotification('💬 Chat di supporto in arrivo!', 'info')}
                  className="w-full flex items-center space-x-2 p-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Chat Live</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => showNotification('📞 Numero: +39 123 456 7890', 'info')}
                  className="w-full flex items-center space-x-2 p-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  <span>Chiama</span>
                </motion.button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {Object.keys(filteredFaqs).length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Nessun risultato trovato
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Prova a modificare i termini di ricerca o seleziona una categoria diversa
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(filteredFaqs).map(([categoryId, questions]) => {
                  const category = categories.find(c => c.id === categoryId);
                  return (
                    <div key={categoryId}>
                      {!activeCategory && (
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                          {category && <category.icon className="h-5 w-5" />}
                          <span>{category?.title}</span>
                        </h3>
                      )}
                      
                      <div className="space-y-3">
                        {questions.map((faq) => (
                          <motion.div
                            key={faq.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gray-50 dark:bg-gray-700 rounded-xl overflow-hidden"
                          >
                            <motion.button
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                            >
                              <span className="font-medium text-gray-900 dark:text-white">
                                {faq.question}
                              </span>
                              <motion.div
                                animate={{ rotate: expandedFaq === faq.id ? 90 : 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <ChevronRight className="h-5 w-5 text-gray-500" />
                              </motion.div>
                            </motion.button>
                            
                            <AnimatePresence>
                              {expandedFaq === faq.id && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="overflow-hidden"
                                >
                                  <div className="p-4 pt-0 text-gray-600 dark:text-gray-300 leading-relaxed">
                                    {faq.answer}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default HelpCenter;