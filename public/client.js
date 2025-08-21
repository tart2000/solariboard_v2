// client-side js
// run by the browser each time your view template referencing it is loaded

var dreams = [];

// Fonction de debug
function debugLog(message) {
  var debugDiv = document.getElementById('debug-log');
  if (debugDiv) {
    var time = new Date().toLocaleTimeString();
    debugDiv.innerHTML += '<div>[' + time + '] ' + message + '</div>';
    debugDiv.scrollTop = debugDiv.scrollHeight;
  }
  console.log(message);
}

// Fonction de fallback vers l'API Express (si Supabase ne fonctionne pas)
function fallbackToExpressAPI(client) {
  debugLog('Utilisation du fallback Express API pour client: ' + client);
  
  var xhr = new XMLHttpRequest();
  xhr.open('GET', '/api/messages/' + client, false); // Synchronous pour simplicité
  
  try {
    xhr.send();
    
    if (xhr.status === 200) {
      var messages = JSON.parse(xhr.responseText);
      debugLog('Messages récupérés via fallback: ' + messages.length + ' messages');
      
      // Si on est sur la page messages (modération), afficher dans la liste
      if (isMessagesPage && dreamsList) {
        messages.forEach(function(row) {
          appendNewDream(row.content, row.id, row.created_at);
        });
      }
      // Si on est sur la page Solari, mettre à jour le message courant
      if (isSolariPage) {
        setCurrentMessage(messages);
      }
    } else {
      debugLog('Erreur fallback API: ' + xhr.status);
    }
  } catch (error) {
    debugLog('Erreur fallback API: ' + error.message);
  }
}

// define variables that reference elements on our page
var dreamsForm = document.forms[0];
var dreamInput = dreamsForm ? dreamsForm.elements["dream"] : null;
var dreamsList = document.getElementById("dreams");
var clearButton = document.querySelector("#clear-dreams");
var currentMessage = "Rendez-vous sur /message pour envoyer votre premier message"; // Message de fallback
var lastID = 0;
var index = 0;

// Détecter si on est sur la page message, messages ou sur la page Solari
var isMessagePage = window.location.pathname.indexOf('/message') !== -1 && window.location.pathname.indexOf('/messages') === -1;
var isMessagesPage = window.location.pathname.indexOf('/messages') !== -1;
var isSolariPage = !isMessagePage && !isMessagesPage;

debugLog('Client.js chargé - Page: ' + (isSolariPage ? 'Solari' : (isMessagePage ? 'Message' : 'Messages')));

// Fonction helper pour détecter le client depuis l'URL
function getClientFromURL() {
  var pathParts = window.location.pathname.split('/');
  var client = 'pocstudio'; // Client par défaut
  
  // Si on est sur /:client/messages, le client est le premier segment
  if (pathParts.length >= 2 && pathParts[2] === 'messages') {
    client = pathParts[1];
  }
  // Si on est sur /:client/message, le client est le premier segment
  else if (pathParts.length >= 2 && pathParts[2] === 'message') {
    client = pathParts[1];
  }
  // Si on est sur /:client (page Solari), le client est le premier segment
  else if (pathParts.length >= 2 && pathParts[1] !== 'messages' && pathParts[1] !== 'message') {
    client = pathParts[1];
  }
  
  return client;
}

function setCurrentMessage(m) {
  // Si aucun message ou tableau vide
  if (!m || m.length === 0) {
    currentMessage = "Rendez-vous sur /message pour envoyer votre premier message";
    debugLog('Aucun message trouvé, message par défaut affiché');
    return;
  }
  
  var newID = m[0].id;
  // Last new message if it is new
  if (newID > lastID) {
    lastID = newID;
    index = 0;
  } else {
    index++;
    if (index >= m.length) {
      index = 0;
    }
  }
  currentMessage = m[index].content; // Changed from .dream to .content
  debugLog('Message courant défini: ' + currentMessage.substring(0, 50) + '...');
}

// --------------------------------------------------------
//  function getMessageList
//
//  Get list of all messages from database.
// --------------------------------------------------------
var getMessageList = function() {
  // Détecter le client depuis l'URL
  var client = getClientFromURL();
  
  debugLog('Chargement des messages en cours pour client: ' + client);
  console.log('Chargement des messages en cours');
  console.log('Page message:', isMessagePage);
  console.log('Page Solari:', isSolariPage);
  console.log('Page messages:', isMessagesPage);
  console.log('Client détecté:', client);
  
  // Vider la liste si on est sur la page messages (modération)
  if (isMessagesPage && dreamsList) {
    dreamsList.innerHTML = "";
  }
  
  // Utiliser Supabase si disponible, sinon fallback vers l'API
  if (window.SupabaseClient && window.SupabaseClient.getMessagesByClient) {
    debugLog('Utilisation de Supabase pour récupérer les messages');
    console.log('Utilisation de Supabase pour récupérer les messages');
    // Utiliser Supabase
    window.SupabaseClient.getMessagesByClient(client)
      .then(function(response) {
        debugLog('Messages récupérés: ' + (response ? response.length : 0) + ' messages');
        console.log('Messages récupérés:', response);
        
        // Si on est sur la page messages (modération), afficher dans la liste
        if (isMessagesPage && dreamsList) {
          response.forEach(function(row) {
            appendNewDream(row.content, row.id, row.created_at);
          });
        }
        // Si on est sur la page Solari, mettre à jour le message courant
        if (isSolariPage) {
          setCurrentMessage(response);
        }
      })
      .catch(function(error) {
        debugLog('Erreur Supabase: ' + error.message);
        console.error('Erreur Supabase:', error);
        // Fallback vers l'API Express
        fallbackToExpressAPI(client);
      });
  } else {
    debugLog('Supabase non disponible, utilisation du fallback');
    console.error('Supabase non disponible');
    fallbackToExpressAPI(client);
  }
  
  return true;
};



// a helper function that creates a list item for a given dream
var appendNewDream = function(dream, id, created_at) { // Changed parameter name
  var template = document.querySelector("#messagerow");
  var divList = document.querySelector("#dreams"); // Insert point of the template
  var messageRow = document.importNode(template.content, true);
  var pTxt = messageRow.querySelector("p"); // Insterting message text
  var delBut = messageRow.querySelector("button"); // Insterting message id
  var datElt = messageRow.querySelector("small.timestamp");
  pTxt.textContent = dream;
  delBut.id = id;

  // Formatage relatif simple
  var date = new Date(created_at);
  var now = new Date();
  var diffMs = now - date;
  var diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  var diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  var diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  var timeText;
  if (diffDays > 0) {
    timeText = "Il y a " + diffDays + " jour" + (diffDays > 1 ? "s" : "");
  } else if (diffHours > 0) {
    timeText = "Il y a " + diffHours + " heure" + (diffHours > 1 ? "s" : "");
  } else if (diffMinutes > 0) {
    timeText = "Il y a " + diffMinutes + " minute" + (diffMinutes > 1 ? "s" : "");
  } else {
    timeText = "À l'instant";
  }
  
  datElt.title = created_at;
  datElt.innerHTML = timeText;
  divList.appendChild(messageRow);

  // Adding a listener
  delBut.addEventListener("click", delFunction, false);
};

// listen for the form to be submitted and add a new dream when it is
if (dreamsForm) {
  dreamsForm.onsubmit = function(event) {
  // stop our form submission from refreshing the page
  event.preventDefault();

  var messageContent = dreamInput.value;
  
  // Vérifier que le message n'est pas vide
  if (!messageContent.trim()) {
    console.log('Message vide, ignoré');
    return;
  }

  // Détecter le client depuis l'URL
  var client = getClientFromURL();
  
  console.log('Ajout de message en cours');
  
  // Utiliser Supabase si disponible
  if (window.SupabaseClient && window.SupabaseClient.addMessage) {
    console.log('Utilisation de Supabase pour ajouter le message');
    // Utiliser Supabase
    window.SupabaseClient.addMessage(messageContent, client)
      .then(function(success) {
        if (success) {
          console.log('Message ajouté avec succès via Supabase');
          // Vider le champ de saisie
          dreamInput.value = "";
          dreamInput.focus();
          
          // Afficher le popup de confirmation
          showSuccessPopup();
        } else {
          console.error('Erreur lors de l\'ajout du message via Supabase');
        }
      })
      .catch(function(error) {
        console.error('Erreur Supabase lors de l\'ajout:', error);
      });
  } else {
    console.error('Supabase non disponible');
  }
  };
}



if (clearButton) {
  clearButton.addEventListener("click", function(event) {
  event.preventDefault();
  
  // Détecter le client depuis l'URL
  var client = getClientFromURL();
  
  console.log('Suppression de tous les messages en cours');
  
  // Utiliser Supabase si disponible
  if (window.SupabaseClient && window.SupabaseClient.deleteAllMessages) {
    console.log('Utilisation de Supabase pour supprimer tous les messages');
    
    window.SupabaseClient.deleteAllMessages(client)
      .then(function(success) {
        if (success) {
          console.log('Tous les messages supprimés avec succès via Supabase');
          // Vider la liste dans le DOM
          if (dreamsList) {
            dreamsList.innerHTML = "";
          }
        } else {
          console.error('Erreur lors de la suppression de tous les messages via Supabase');
        }
      })
      .catch(function(error) {
        console.error('Erreur Supabase lors de la suppression de tous les messages:', error);
      });
  } else {
    console.error('Supabase non disponible pour la suppression de tous les messages');
  }
});
}

var delFunction = function() {
  var messageId = this.id;
  var divASupp = this.parentElement;
  
  console.log('Suppression du message en cours');
  
  // Utiliser Supabase si disponible
  if (window.SupabaseClient && window.SupabaseClient.deleteMessage) {
    console.log('Utilisation de Supabase pour supprimer le message');
    
    window.SupabaseClient.deleteMessage(messageId)
      .then(function(success) {
        if (success) {
          console.log('Message supprimé avec succès via Supabase');
          // Supprimer l'élément du DOM
          if (dreamsList && divASupp) {
            dreamsList.removeChild(divASupp);
          }
        } else {
          console.error('Erreur lors de la suppression du message via Supabase');
        }
      })
      .catch(function(error) {
        console.error('Erreur Supabase lors de la suppression:', error);
      });
  } else {
    console.error('Supabase non disponible pour la suppression');
  }
};

// Test wordwrap
function wordWrap(str, charMax) {
  var arr = [];
  var space = /\s/;

  var words = str.split(space);
  // push first word into new array
  if (words[0].length) {
    arr.push(words[0]);
  }

  for (var i = 1; i < words.length; i++) {
    if (words[i].length + arr[arr.length - 1].length < charMax) {
      arr[arr.length - 1] = arr[arr.length - 1] + " " + words[i];
    } else {
      arr.push(words[i]);
    }
  }

  return arr;
}

// Ne charger les messages automatiquement que sur la page Solari
if (isSolariPage) {
  getMessageList();
}

// Fonction pour afficher le popup de confirmation
function showSuccessPopup() {
  var popup = document.getElementById('success-popup');
  if (popup) {
    // Afficher le popup
    popup.style.display = 'block';
    
    // Masquer le popup après 2 secondes
    setTimeout(function() {
      popup.style.animation = 'popupFadeOut 0.3s ease-out';
      setTimeout(function() {
        popup.style.display = 'none';
        popup.style.animation = '';
      }, 300);
    }, 2000);
  }
}
