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
  response.sendFile(`${__dirname}/views/landing.html`);
});

// Routes pour les clients spécifiques
app.get("/:client", (request, response) => {
  const client = request.params.client;
  
  // Vérifier si le client est autorisé
  const clients = readClients();
  const clientExists = clients.some(c => c.id === client);
  
  if (!clientExists) {
    // Rediriger vers la landing page si le client n'est pas autorisé
    return response.redirect('/');
  }
  
  response.sendFile(`${__dirname}/views/index.html`);
});

app.get("/:client/message", (request, response) => {
  const client = request.params.client;
  
  // Vérifier si le client est autorisé
  const clients = readClients();
  const clientExists = clients.some(c => c.id === client);
  
  if (!clientExists) {
    // Rediriger vers la landing page si le client n'est pas autorisé
    return response.redirect('/');
  }
  
  response.sendFile(`${__dirname}/views/message.html`);
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
