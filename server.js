const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));

// Chemin vers le fichier de messages
const messagesFile = path.join(__dirname, "data", "messages.json");

// Fonction pour lire les messages
function readMessages() {
  try {
    if (fs.existsSync(messagesFile)) {
      const data = fs.readFileSync(messagesFile, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Erreur lecture messages:', error);
    return [];
  }
}

// Fonction pour écrire les messages
function writeMessages(messages) {
  try {
    // Créer le dossier data s'il n'existe pas
    const dataDir = path.dirname(messagesFile);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2));
  } catch (error) {
    console.error('Erreur écriture messages:', error);
  }
}

// Routes
app.get("/", (request, response) => {
  response.sendFile(`${__dirname}/views/index.html`);
});

app.get("/message", (request, response) => {
  response.sendFile(`${__dirname}/views/message.html`);
});

// Récupérer tous les messages
app.get("/getDreams", (request, response) => {
  try {
    const messages = readMessages();
    response.json(messages);
  } catch (error) {
    console.error('Erreur getDreams:', error);
    response.status(500).json({ error: 'Erreur serveur' });
  }
});

// Ajouter un message
app.post("/addDream", (request, response) => {
  try {
    const cleansedDream = cleanseString(request.body.dream);
    const messages = readMessages();
    
    const newMessage = {
      id: Date.now(), // Utiliser timestamp comme ID unique
      content: cleansedDream,
      created_at: new Date().toISOString()
    };
    
    messages.unshift(newMessage); // Ajouter au début
    writeMessages(messages);
    
    console.log(`Message ajouté: ${cleansedDream}`);
    response.json({ message: "success" });
  } catch (error) {
    console.error('Erreur addDream:', error);
    response.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un message
app.post("/delMessage", (request, response) => {
  try {
    const messages = readMessages();
    const filteredMessages = messages.filter(msg => msg.id != request.body.id);
    writeMessages(filteredMessages);
    
    console.log(`Message supprimé: ${request.body.id}`);
    response.json({ message: "success" });
  } catch (error) {
    console.error('Erreur delMessage:', error);
    response.status(500).json({ error: 'Erreur serveur' });
  }
});

// Vider tous les messages
app.get("/clearDreams", (request, response) => {
  try {
    writeMessages([]);
    console.log('Tous les messages supprimés');
    response.json({ message: "success" });
  } catch (error) {
    console.error('Erreur clearDreams:', error);
    response.status(500).json({ error: 'Erreur serveur' });
  }
});

// Fonction de nettoyage des chaînes
const cleanseString = function(string) {
  return string.replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  console.log(`Messages chargés depuis: ${messagesFile}`);
});
