// Charger les variables d'environnement
require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const { GraphQLClient, gql } = require('graphql-request');

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

// Configuration GraphQL Hygraph
const hygraphEndpoint = process.env.HYGRAPH_ENDPOINT;
const hygraphToken = process.env.HYGRAPH_TOKEN;
// Content API Token pour les lectures (si différent du Permanent Auth Token)
const hygraphContentToken = process.env.HYGRAPH_CONTENT_TOKEN || hygraphToken;

if (!hygraphEndpoint || !hygraphToken) {
  console.warn('ATTENTION: Variables d\'environnement Hygraph manquantes');
}

// Client pour les lectures (Content API)
const graphQLReadClient = new GraphQLClient(hygraphEndpoint, {
  headers: {
    authorization: `Bearer ${hygraphContentToken}`,
  },
});

// Client pour les mutations (Permanent Auth Token)
const graphQLWriteClient = new GraphQLClient(hygraphEndpoint, {
  headers: {
    authorization: `Bearer ${hygraphToken}`,
  },
});

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

// API GraphQL Hygraph - Récupérer les messages par board
app.get("/api/messages/:board", async (request, response) => {
  const boardName = request.params.board;
  
  console.log('API GraphQL: Récupération messages pour board:', boardName);
  
  // Vérifier que les variables d'environnement sont définies
  if (!hygraphEndpoint || !hygraphToken) {
    console.error('Variables d\'environnement Hygraph manquantes');
    return response.status(500).json({ error: 'Configuration Hygraph manquante' });
  }
  
  try {
    // D'abord, récupérer le board par son name pour obtenir son ID
    const boardQuery = gql`
      query GetBoardByName($boardName: String!) {
        boards(where: { name: $boardName }, first: 1) {
          id
          name
        }
      }
    `;
    
    const boardData = await graphQLReadClient.request(boardQuery, { boardName });
    const boards = boardData.boards || [];
    
    if (boards.length === 0) {
      console.log('Board non trouvé:', boardName);
      return response.redirect('/pocstudio');
    }
    
    const boardId = boards[0].id;
    
    // Ensuite, récupérer les messages filtrés par l'ID du board
    const messagesQuery = gql`
      query GetMessagesByBoardId($boardId: ID!) {
        messages(
          where: { 
            board: { 
              id: $boardId 
            } 
          }
          orderBy: createdAt_DESC
        ) {
          id
          content
          createdAt
        }
      }
    `;
    
    const messagesData = await graphQLReadClient.request(messagesQuery, { boardId });
    const messages = messagesData.messages || [];
    console.log('Messages récupérés:', messages.length);
    
    // Convertir createdAt en created_at pour compatibilité frontend
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      created_at: msg.createdAt
    }));
    
    response.json(formattedMessages);
  } catch (error) {
    console.error('Erreur requête Hygraph:', error);
    if (error.response) {
      console.error('Détails erreur:', JSON.stringify(error.response.errors, null, 2));
    }
    
    // Si le board n'existe pas, rediriger vers la HP
    if (error.response && error.response.errors) {
      const graphqlError = error.response.errors[0];
      console.error('Erreur GraphQL:', graphqlError.message);
      if (graphqlError.message && graphqlError.message.includes('not found')) {
        return response.redirect('/pocstudio');
      }
    }
    response.status(500).json({ 
      error: 'Erreur communication avec Hygraph',
      details: error.response?.errors?.[0]?.message || error.message 
    });
  }
});

// API GraphQL Hygraph - Ajouter un message
app.post("/api/messages/add", async (request, response) => {
  const { content, board } = request.body;
  
  console.log('API GraphQL: Ajout message pour board:', board);
  
  if (!content || !board) {
    return response.status(400).json({ error: 'Contenu et board requis' });
  }
  
  // Vérifier que les variables d'environnement sont définies
  if (!hygraphEndpoint || !hygraphToken) {
    console.error('Variables d\'environnement Hygraph manquantes');
    return response.status(500).json({ error: 'Configuration Hygraph manquante' });
  }
  
  try {
    // D'abord, récupérer le board par son name pour obtenir son ID
    const boardQuery = gql`
      query GetBoardByName($boardName: String!) {
        boards(where: { name: $boardName }, first: 1) {
          id
          name
        }
      }
    `;
    
    const boardData = await graphQLReadClient.request(boardQuery, { boardName: board });
    const boards = boardData.boards || [];
    
    if (boards.length === 0) {
      console.log('Board non trouvé:', board);
      return response.redirect('/pocstudio');
    }
    
    const boardId = boards[0].id;
    
    // Ensuite, créer le message en connectant au board par son ID et le publier directement
    const mutation = gql`
      mutation CreateAndPublishMessage($content: String!, $boardId: ID!) {
        createMessage(data: {
          content: $content
          board: { connect: { id: $boardId } }
        }) {
          id
          content
          createdAt
        }
        publishMessage(where: { id: $id }) {
          id
        }
      }
    `;
    
    // Créer le message
    const createMutation = gql`
      mutation CreateMessage($content: String!, $boardId: ID!) {
        createMessage(data: {
          content: $content
          board: { connect: { id: $boardId } }
        }) {
          id
          content
          createdAt
        }
      }
    `;
    
    const createResult = await graphQLWriteClient.request(createMutation, { content, boardId });
    const messageId = createResult.createMessage.id;
    
    // Publier le message
    const publishMutation = gql`
      mutation PublishMessage($id: ID!) {
        publishMessage(where: { id: $id }) {
          id
        }
      }
    `;
    
    await graphQLWriteClient.request(publishMutation, { id: messageId });
    console.log('Message ajouté avec succès');
    response.json({ success: true });
  } catch (error) {
    console.error('Erreur ajout message:', error);
    if (error.response) {
      console.error('Détails erreur:', JSON.stringify(error.response.errors, null, 2));
    }
    // Si le board n'existe pas, rediriger vers la HP
    if (error.response && error.response.errors) {
      const graphqlError = error.response.errors[0];
      if (graphqlError.message && (graphqlError.message.includes('not found') || graphqlError.message.includes('connect'))) {
        return response.redirect('/pocstudio');
      }
    }
    response.status(500).json({ error: 'Erreur ajout message' });
  }
});

// API GraphQL Hygraph - Supprimer un message
app.delete("/api/messages/:id", async (request, response) => {
  const messageId = request.params.id;
  
  console.log('API GraphQL: Suppression message:', messageId);
  
  if (!hygraphEndpoint || !hygraphToken) {
    console.error('Variables d\'environnement Hygraph manquantes');
    return response.status(500).json({ error: 'Configuration Hygraph manquante' });
  }
  
  const mutation = gql`
    mutation DeleteMessage($id: ID!) {
      deleteMessage(where: { id: $id }) {
        id
      }
    }
  `;
  
  try {
    await graphQLWriteClient.request(mutation, { id: messageId });
    console.log('Message supprimé avec succès');
    response.json({ success: true });
  } catch (error) {
    console.error('Erreur suppression message:', error);
    response.status(500).json({ error: 'Erreur suppression message' });
  }
});

// API GraphQL Hygraph - Supprimer tous les messages d'un board
app.delete("/api/messages/clear/:board", async (request, response) => {
  const boardName = request.params.board;
  
  console.log('API GraphQL: Suppression tous les messages pour board:', boardName);
  
  if (!hygraphEndpoint || !hygraphToken) {
    console.error('Variables d\'environnement Hygraph manquantes');
    return response.status(500).json({ error: 'Configuration Hygraph manquante' });
  }
  
  try {
    // D'abord, récupérer le board par son name pour obtenir son ID
    const boardQuery = gql`
      query GetBoardByName($boardName: String!) {
        boards(where: { name: $boardName }, first: 1) {
          id
          name
        }
      }
    `;
    
    const boardData = await graphQLReadClient.request(boardQuery, { boardName });
    const boards = boardData.boards || [];
    
    if (boards.length === 0) {
      console.log('Board non trouvé:', boardName);
      return response.status(404).json({ error: 'Board non trouvé' });
    }
    
    const boardId = boards[0].id;
    
    const mutation = gql`
      mutation DeleteAllMessagesByBoard($boardId: ID!) {
        deleteManyMessages(where: { 
          board: { 
            id: $boardId 
          } 
        }) {
          count
        }
      }
    `;
    
    const data = await graphQLWriteClient.request(mutation, { boardId });
    console.log('Tous les messages supprimés avec succès:', data.deleteManyMessages.count);
    response.json({ success: true });
  } catch (error) {
    console.error('Erreur suppression tous les messages:', error);
    response.status(500).json({ error: 'Erreur suppression tous les messages' });
  }
});

// API GraphQL Hygraph - Mettre à jour un message
app.put("/api/messages/:id", async (request, response) => {
  const messageId = request.params.id;
  const { content } = request.body;
  
  console.log('API GraphQL: Mise à jour message:', messageId);
  
  if (!content) {
    return response.status(400).json({ error: 'Contenu requis' });
  }
  
  if (!hygraphEndpoint || !hygraphToken) {
    console.error('Variables d\'environnement Hygraph manquantes');
    return response.status(500).json({ error: 'Configuration Hygraph manquante' });
  }
  
  const mutation = gql`
    mutation UpdateMessage($id: ID!, $content: String!) {
      updateMessage(
        where: { id: $id }
        data: { content: $content }
      ) {
        id
        content
        createdAt
      }
    }
  `;
  
  try {
    await graphQLWriteClient.request(mutation, { id: messageId, content });
    console.log('Message mis à jour avec succès');
    response.json({ success: true });
  } catch (error) {
    console.error('Erreur mise à jour message:', error);
    response.status(500).json({ error: 'Erreur mise à jour message' });
  }
});

// Fonction pour vérifier si un board existe dans Hygraph
async function boardExists(boardName) {
  try {
    if (!hygraphEndpoint || !hygraphContentToken) {
      return false;
    }
    
    const boardQuery = gql`
      query GetBoardByName($boardName: String!) {
        boards(where: { name: $boardName }, first: 1) {
          id
          name
        }
      }
    `;
    
    const boardData = await graphQLReadClient.request(boardQuery, { boardName });
    return (boardData.boards || []).length > 0;
  } catch (error) {
    console.error('Erreur vérification board:', error);
    return false;
  }
}



// Routes
app.get("/", (request, response) => {
  // Rediriger directement vers pocstudio
  response.redirect('/pocstudio');
});

// Routes pour les boards spécifiques
app.get("/:board", async (request, response) => {
  const board = request.params.board;
  
  // Vérifier si le board existe dans Hygraph
  const exists = await boardExists(board);
  
  if (!exists) {
    // Rediriger vers pocstudio si le board n'existe pas
    return response.redirect('/pocstudio');
  }
  
  response.sendFile(`${__dirname}/views/index.html`);
});

app.get("/:board/message", async (request, response) => {
  const board = request.params.board;
  
  // Vérifier si le board existe dans Hygraph
  const exists = await boardExists(board);
  
  if (!exists) {
    // Rediriger vers pocstudio si le board n'existe pas
    return response.redirect('/pocstudio');
  }
  
  response.sendFile(`${__dirname}/views/message.html`);
});

app.get("/:board/messages", async (request, response) => {
  const board = request.params.board;
  
  // Vérifier si le board existe dans Hygraph
  const exists = await boardExists(board);
  
  if (!exists) {
    // Rediriger vers pocstudio si le board n'existe pas
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
  console.log(`Boards gérés via Hygraph`);
});
