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

// API REST directe pour Supabase - Récupérer les messages
app.get("/api/messages/:client", (request, response) => {
  const client = request.params.client;
  
  console.log('API REST: Récupération messages pour client:', client);
  
  // Vérifier que les variables d'environnement sont définies
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Variables d\'environnement Supabase manquantes');
    return response.status(500).json({ error: 'Configuration Supabase manquante' });
  }
  
  // Construire l'URL de l'API Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Faire l'appel à l'API REST de Supabase
  const https = require('https');
  const url = `${supabaseUrl}/rest/v1/messages?client=eq.${client}&order=created_at.desc`;
  
  const options = {
    hostname: new URL(supabaseUrl).hostname,
    port: 443,
    path: new URL(supabaseUrl).pathname + `/rest/v1/messages?client=eq.${client}&order=created_at.desc`,
    method: 'GET',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    }
  };
  
  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const messages = JSON.parse(data);
        console.log('Messages récupérés:', messages.length);
        response.json(messages);
      } catch (error) {
        console.error('Erreur parsing JSON:', error);
        response.status(500).json({ error: 'Erreur parsing des données' });
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('Erreur requête Supabase:', error);
    response.status(500).json({ error: 'Erreur communication avec Supabase' });
  });
  
  req.end();
});

// API REST directe pour Supabase - Ajouter un message
app.post("/api/messages/add", (request, response) => {
  const { content, client } = request.body;
  
  console.log('API REST: Ajout message pour client:', client);
  
  if (!content || !client) {
    return response.status(400).json({ error: 'Contenu et client requis' });
  }
  
  // Vérifier que les variables d'environnement sont définies
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Variables d\'environnement Supabase manquantes');
    return response.status(500).json({ error: 'Configuration Supabase manquante' });
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Préparer les données pour Supabase
  const postData = JSON.stringify({
    content: content,
    client: client
  });
  
  const https = require('https');
  const url = new URL(supabaseUrl);
  
  const options = {
    hostname: url.hostname,
    port: 443,
    path: url.pathname + '/rest/v1/messages',
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log('Message ajouté avec succès');
        response.json({ success: true });
      } else {
        console.error('Erreur ajout message:', data);
        response.status(500).json({ error: 'Erreur ajout message' });
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('Erreur requête Supabase:', error);
    response.status(500).json({ error: 'Erreur communication avec Supabase' });
  });
  
  req.write(postData);
  req.end();
});

// API REST directe pour Supabase - Supprimer un message
app.delete("/api/messages/:id", (request, response) => {
  const messageId = request.params.id;
  
  console.log('API REST: Suppression message:', messageId);
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Variables d\'environnement Supabase manquantes');
    return response.status(500).json({ error: 'Configuration Supabase manquante' });
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  const https = require('https');
  const url = new URL(supabaseUrl);
  
  const options = {
    hostname: url.hostname,
    port: 443,
    path: url.pathname + `/rest/v1/messages?id=eq.${messageId}`,
    method: 'DELETE',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    }
  };
  
  const req = https.request(options, (res) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('Message supprimé avec succès');
      response.json({ success: true });
    } else {
      console.error('Erreur suppression message');
      response.status(500).json({ error: 'Erreur suppression message' });
    }
  });
  
  req.on('error', (error) => {
    console.error('Erreur requête Supabase:', error);
    response.status(500).json({ error: 'Erreur communication avec Supabase' });
  });
  
  req.end();
});

// API REST directe pour Supabase - Supprimer tous les messages d'un client
app.delete("/api/messages/clear/:client", (request, response) => {
  const client = request.params.client;
  
  console.log('API REST: Suppression tous les messages pour client:', client);
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Variables d\'environnement Supabase manquantes');
    return response.status(500).json({ error: 'Configuration Supabase manquante' });
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  const https = require('https');
  const url = new URL(supabaseUrl);
  
  const options = {
    hostname: url.hostname,
    port: 443,
    path: url.pathname + `/rest/v1/messages?client=eq.${client}`,
    method: 'DELETE',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    }
  };
  
  const req = https.request(options, (res) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('Tous les messages supprimés avec succès');
      response.json({ success: true });
    } else {
      console.error('Erreur suppression tous les messages');
      response.status(500).json({ error: 'Erreur suppression tous les messages' });
    }
  });
  
  req.on('error', (error) => {
    console.error('Erreur requête Supabase:', error);
    response.status(500).json({ error: 'Erreur communication avec Supabase' });
  });
  
  req.end();
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
