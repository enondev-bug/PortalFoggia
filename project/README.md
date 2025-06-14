# Business Hub - Piattaforma Vetrina Attività Commerciali

Una piattaforma moderna e completa per la scoperta e gestione di attività commerciali locali, costruita con React, TypeScript, Tailwind CSS e Supabase.

## 🚀 Funzionalità Principali

### 🏪 Per gli Utenti
- **Ricerca Avanzata**: Trova attività per nome, categoria, località
- **Mappe Interattive**: Integrazione Google Maps con indicazioni stradali
- **Recensioni e Valutazioni**: Sistema completo di feedback
- **Preferiti**: Salva le tue attività preferite
- **Profilo Utente**: Gestione account personalizzato

### 🏢 Per le Attività
- **Profilo Completo**: Informazioni dettagliate, orari, contatti
- **Galleria Fotografica**: Mostra i tuoi spazi e prodotti
- **Offerte Speciali**: Promuovi sconti e promozioni
- **Gestione Recensioni**: Interagisci con i clienti

### 👨‍💼 Dashboard Admin
- **Gestione Attività**: Approvazione e moderazione
- **Gestione Utenti**: Controllo accessi e ruoli
- **Analytics**: Statistiche dettagliate e report
- **Moderazione Recensioni**: Controllo qualità contenuti
- **Impostazioni Sistema**: Configurazione piattaforma

## 🗺️ Integrazione Google Maps

### Configurazione
1. Ottieni una API Key da [Google Cloud Console](https://console.cloud.google.com/)
2. Abilita le seguenti API:
   - Maps JavaScript API
   - Places API
   - Geocoding API
3. Aggiungi la chiave al file `.env`:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

### Funzionalità Mappe
- **Mappe Interattive**: Visualizzazione completa con controlli
- **Marker Personalizzati**: Icone specifiche per categoria
- **Info Window**: Dettagli attività con azioni rapide
- **Indicazioni Stradali**: Link diretto a Google Maps
- **Modalità Fullscreen**: Visualizzazione espansa
- **Geocoding Automatico**: Conversione indirizzi in coordinate

## 🛠️ Tecnologie Utilizzate

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Animazioni**: Framer Motion
- **Backend**: Supabase (Database, Auth, Storage)
- **Mappe**: Google Maps JavaScript API
- **Build Tool**: Vite
- **Icone**: Lucide React

## 📦 Installazione

1. **Clona il repository**
   ```bash
   git clone <repository-url>
   cd business-hub
   ```

2. **Installa le dipendenze**
   ```bash
   npm install
   ```

3. **Configura le variabili d'ambiente**
   ```bash
   cp .env.example .env
   ```
   Compila il file `.env` con le tue chiavi API.

4. **Avvia il server di sviluppo**
   ```bash
   npm run dev
   ```

## 🗄️ Database Schema

Il progetto utilizza Supabase con le seguenti tabelle principali:

- **profiles**: Profili utenti estesi
- **businesses**: Attività commerciali
- **categories**: Categorie attività
- **reviews**: Recensioni e valutazioni
- **favorites**: Preferiti utenti
- **business_hours**: Orari di apertura
- **business_images**: Galleria fotografica
- **contact_requests**: Richieste di contatto
- **offers**: Offerte speciali

## 🔐 Autenticazione e Sicurezza

- **Row Level Security (RLS)**: Protezione dati a livello di riga
- **Ruoli Utente**: user, business_owner, admin, super_admin
- **Politiche di Accesso**: Controllo granulare delle autorizzazioni
- **Upload Sicuro**: Gestione file con validazione

## 🎨 Design System

- **Palette Colori**: Sistema completo con varianti dark/light
- **Tipografia**: Gerarchia chiara con 3 pesi massimi
- **Spaziatura**: Sistema 8px per consistenza
- **Componenti**: Libreria riutilizzabile e modulare
- **Responsive**: Design ottimizzato per tutti i dispositivi

## 📱 Responsive Design

- **Mobile First**: Progettazione prioritaria per dispositivi mobili
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Touch Friendly**: Interfaccia ottimizzata per touch
- **Performance**: Caricamento veloce su tutte le connessioni

## 🚀 Deployment

Il progetto è configurato per il deployment su:

- **Netlify**: Deploy automatico con CI/CD
- **Vercel**: Alternativa con ottimizzazioni React
- **Supabase Hosting**: Hosting nativo Supabase

## 📊 Analytics e Monitoring

- **Dashboard Analytics**: Metriche dettagliate in tempo reale
- **Export Report**: Esportazione dati in CSV
- **Monitoraggio Sistema**: Stato servizi e performance
- **Statistiche Utenti**: Comportamento e engagement

## 🔧 Sviluppo

### Struttura File
```
src/
├── components/          # Componenti React
│   ├── admin/          # Dashboard amministrativa
│   ├── auth/           # Autenticazione
│   └── ...
├── contexts/           # Context providers
├── data/              # Dati mock e configurazioni
├── lib/               # Utilities e configurazioni
├── types/             # Definizioni TypeScript
└── ...
```

### Comandi Utili
```bash
npm run dev          # Server di sviluppo
npm run build        # Build produzione
npm run preview      # Preview build
npm run lint         # Linting codice
```

## 🤝 Contribuire

1. Fork del progetto
2. Crea un branch per la feature (`git checkout -b feature/AmazingFeature`)
3. Commit delle modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📄 Licenza

Questo progetto è distribuito sotto licenza MIT. Vedi `LICENSE` per maggiori informazioni.

## 🆘 Supporto

Per supporto e domande:
- Apri un issue su GitHub
- Contatta il team di sviluppo
- Consulta la documentazione

---

**Business Hub** - Connetti, Scopri, Cresci 🚀