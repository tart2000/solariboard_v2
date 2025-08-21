// Charger les variables d'environnement
require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));

// Servir les fichiers statiques avec les bons types MIME
app.use('/lib', express.static(path.join(__dirname, 'public/lib')));
app.use('/app', express.static(path.join(__dirname, 'public/app')));
app.use('/img', express.static(path.join(__dirname, 'public/img')));
app.use('/sound', express.static(path.join(__dirname, 'public/sound')));
app.use('/plugin', express.static(path.join(__dirname, 'public/plugin')));

// Route spécifique pour client.js
app.get('/client.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, 'public/client.js'));
});

// Route spécifique pour timetogo.js
app.get('/timetogo.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, 'public/timetogo.js'));
});

// Route spécifique pour message.css
app.get('/message.css', (req, res) => {
  res.setHeader('Content-Type', 'text/css');
  res.sendFile(path.join(__dirname, 'public/message.css'));
});

// Endpoint pour récupérer la configuration Supabase
app.get("/api/config", (request, response) => {
  const config = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  };
  
  console.log('Config Supabase:', {
    supabaseUrl: config.supabaseUrl ? 'Défini' : 'Manquant',
    supabaseAnonKey: config.supabaseAnonKey ? 'Défini' : 'Manquant'
  });
  
  response.json(config);
});

// Endpoint de fallback pour récupérer les messages (si Supabase ne fonctionne pas)
app.get("/api/messages/:client", (request, response) => {
  const client = request.params.client;
  
  console.log('Fallback API: Récupération messages pour client:', client);
  
  // Pour l'instant, retourner un tableau vide
  // Vous pouvez implémenter une vraie logique de base de données ici si nécessaire
  response.json([]);
});

// Chemin vers les fichiers de données
const clientsFile = path.join(__dirname, "data", "clients.json");

// Fonction pour lire les clients autorisés
function readClients() {
  try {
    if (fs.existsSync(clientsFile)) {
      const data = fs.readFileSync(clientsFile, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Erreur lecture clients:', error);
    return [];
  }
}



// Routes
app.get("/", (request, response) => {
  // Rediriger directement vers pocstudio
  response.redirect('/pocstudio');
});

// Routes pour les clients spécifiques
app.get("/:client", (request, response) => {
  const client = request.params.client;
  
  // Vérifier si le client est autorisé
  const clients = readClients();
  const clientExists = clients.some(c => c.id === client);
  
  if (!clientExists) {
    // Rediriger vers pocstudio si le client n'est pas autorisé
    return response.redirect('/pocstudio');
  }
  
  response.sendFile(`${__dirname}/views/index.html`);
});

app.get("/:client/message", (request, response) => {
  const client = request.params.client;
  
  // Vérifier si le client est autorisé
  const clients = readClients();
  const clientExists = clients.some(c => c.id === client);
  
  if (!clientExists) {
    // Rediriger vers pocstudio si le client n'est pas autorisé
    return response.redirect('/pocstudio');
  }
  
  response.sendFile(`${__dirname}/views/message.html`);
});

app.get("/:client/messages", (request, response) => {
  const client = request.params.client;
  
  // Vérifier si le client est autorisé
  const clients = readClients();
  const clientExists = clients.some(c => c.id === client);
  
  if (!clientExists) {
    // Rediriger vers pocstudio si le client n'est pas autorisé
    return response.redirect('/pocstudio');
  }
  
  response.sendFile(`${__dirname}/views/messages.html`);
});







// Fonction de nettoyage des chaînes
const cleanseString = function(string) {
  return string.replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  console.log(`Clients chargés depuis: ${clientsFile}`);
});
