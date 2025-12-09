// API REST directe pour Supabase - Pas de client JavaScript
// Utilise uniquement des appels HTTP vers notre serveur

// Variable pour tracker si l'API est prête
var apiReady = false;

// Fonction pour initialiser l'API REST
function initSupabase() {
  return new Promise(function(resolve, reject) {
    console.log('Initialisation API REST...');
    
    // Test simple pour vérifier que l'API fonctionne
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/messages/pocstudio', false);
    xhr.send();
    
    if (xhr.status === 200) {
      apiReady = true;
      console.log('API REST initialisée avec succès');
      resolve();
    } else {
      console.log('ERREUR: API REST non disponible - Status: ' + xhr.status);
      reject(new Error('API REST non disponible'));
    }
  });
}

// Fonction pour récupérer les messages d'un board
function getMessagesByBoard(board) {
  return new Promise(function(resolve) {
    try {
      console.log('Récupération messages via API REST pour board: ' + board);
      
      var xhr = new XMLHttpRequest();
      xhr.open('GET', '/api/messages/' + board, false);
      xhr.send();
      
      if (xhr.status === 200) {
        var messages = JSON.parse(xhr.responseText);
        console.log('Messages récupérés via API REST: ' + messages.length + ' messages');
        resolve(messages);
      } else {
        console.log('ERREUR API REST: ' + xhr.status);
        resolve([]);
      }
    } catch (error) {
      console.log('ERREUR getMessagesByBoard: ' + error.message);
      resolve([]);
    }
  });
}

// Fonction pour ajouter un message
function addMessage(content, board) {
  return new Promise(function(resolve) {
    try {
      console.log('Ajout message via API REST pour board: ' + board);
      
      var xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/messages/add', false);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify({
        content: content,
        board: board
      }));
      
      if (xhr.status === 200) {
        var result = JSON.parse(xhr.responseText);
        if (result.success) {
          console.log('Message ajouté avec succès via API REST');
          resolve(true);
        } else {
          console.log('ERREUR ajout message via API REST');
          resolve(false);
        }
      } else {
        console.log('ERREUR API REST ajout: ' + xhr.status);
        resolve(false);
      }
    } catch (error) {
      console.log('ERREUR addMessage: ' + error.message);
      resolve(false);
    }
  });
}

// Fonction pour supprimer un message
function deleteMessage(id) {
  return new Promise(function(resolve) {
    try {
      console.log('Suppression message via API REST: ' + id);
      
      var xhr = new XMLHttpRequest();
      xhr.open('DELETE', '/api/messages/' + id, false);
      xhr.send();
      
      if (xhr.status === 200) {
        var result = JSON.parse(xhr.responseText);
        if (result.success) {
          console.log('Message supprimé avec succès via API REST');
          resolve(true);
        } else {
          console.log('ERREUR suppression message via API REST');
          resolve(false);
        }
      } else {
        console.log('ERREUR API REST suppression: ' + xhr.status);
        resolve(false);
      }
    } catch (error) {
      console.log('ERREUR deleteMessage: ' + error.message);
      resolve(false);
    }
  });
}

// Fonction pour supprimer tous les messages d'un board
function deleteAllMessages(board) {
  return new Promise(function(resolve) {
    try {
      console.log('Suppression tous les messages via API REST pour board: ' + board);
      
      var xhr = new XMLHttpRequest();
      xhr.open('DELETE', '/api/messages/clear/' + board, false);
      xhr.send();
      
      if (xhr.status === 200) {
        var result = JSON.parse(xhr.responseText);
        if (result.success) {
          console.log('Tous les messages supprimés avec succès via API REST');
          resolve(true);
        } else {
          console.log('ERREUR suppression tous les messages via API REST');
          resolve(false);
        }
      } else {
        console.log('ERREUR API REST suppression tous: ' + xhr.status);
        resolve(false);
      }
    } catch (error) {
      console.log('ERREUR deleteAllMessages: ' + error.message);
      resolve(false);
    }
  });
}

// Fonction pour mettre à jour un message
function updateMessage(id, content) {
  return new Promise(function(resolve) {
    try {
      console.log('Mise à jour message via API REST: ' + id);
      
      var xhr = new XMLHttpRequest();
      xhr.open('PUT', '/api/messages/' + id, false);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify({
        content: content
      }));
      
      if (xhr.status === 200) {
        var result = JSON.parse(xhr.responseText);
        if (result.success) {
          console.log('Message mis à jour avec succès via API REST');
          resolve(true);
        } else {
          console.log('ERREUR mise à jour message via API REST');
          resolve(false);
        }
      } else {
        console.log('ERREUR API REST mise à jour: ' + xhr.status);
        resolve(false);
      }
    } catch (error) {
      console.log('ERREUR updateMessage: ' + error.message);
      resolve(false);
    }
  });
}

// Fonction pour attendre que l'API soit prête
function waitForSupabase() {
  return new Promise(function(resolve) {
    if (apiReady) {
      resolve();
    } else {
      var checkInterval = setInterval(function() {
        if (apiReady) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    }
  });
}

// Exporter les fonctions
window.SupabaseClient = {
  init: initSupabase,
  getMessagesByBoard: getMessagesByBoard,
  getMessagesByClient: getMessagesByBoard, // Alias pour compatibilité
  addMessage: addMessage,
  deleteMessage: deleteMessage,
  deleteAllMessages: deleteAllMessages,
  updateMessage: updateMessage,
  waitForSupabase: waitForSupabase
}; 