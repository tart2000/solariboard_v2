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

// Fonction de fallback vers l'API Express (si Hygraph ne fonctionne pas)
function fallbackToExpressAPI(board) {
  debugLog('Utilisation du fallback Express API pour board: ' + board);
  
  var xhr = new XMLHttpRequest();
  xhr.open('GET', '/api/messages/' + board, false); // Synchronous pour simplicité
  
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
var lastCreatedAt = null; // Utiliser createdAt au lieu de lastID pour gérer les IDs strings Hygraph
var index = 0;

// Détecter si on est sur la page message, messages ou sur la page Solari
var isMessagePage = window.location.pathname.indexOf('/message') !== -1 && window.location.pathname.indexOf('/messages') === -1;
var isMessagesPage = window.location.pathname.indexOf('/messages') !== -1;
var isSolariPage = !isMessagePage && !isMessagesPage;

debugLog('Client.js chargé - Page: ' + (isSolariPage ? 'Solari' : (isMessagePage ? 'Message' : 'Messages')));

// Fonction helper pour détecter le board depuis l'URL
function getBoardFromURL() {
  var pathParts = window.location.pathname.split('/');
  var board = 'pocstudio'; // Board par défaut
  
  // Si on est sur /:board/messages, le board est le premier segment
  if (pathParts.length >= 2 && pathParts[2] === 'messages') {
    board = pathParts[1];
  }
  // Si on est sur /:board/message, le board est le premier segment
  else if (pathParts.length >= 2 && pathParts[2] === 'message') {
    board = pathParts[1];
  }
  // Si on est sur /:board (page Solari), le board est le premier segment
  else if (pathParts.length >= 2 && pathParts[1] !== 'messages' && pathParts[1] !== 'message') {
    board = pathParts[1];
  }
  
  return board;
}

// Alias pour compatibilité
function getClientFromURL() {
  return getBoardFromURL();
}

function setCurrentMessage(m) {
  // Si aucun message ou tableau vide
  if (!m || m.length === 0) {
    currentMessage = "Rendez-vous sur /message pour envoyer votre premier message";
    debugLog('Aucun message trouvé, message par défaut affiché');
    return;
  }
  
  // Utiliser createdAt pour détecter les nouveaux messages (IDs Hygraph sont des strings)
  var newestCreatedAt = m[0].created_at;
  var newestDate = new Date(newestCreatedAt);
  
  // Si c'est un nouveau message (createdAt plus récent)
  if (!lastCreatedAt || newestDate > new Date(lastCreatedAt)) {
    lastCreatedAt = newestCreatedAt;
    index = 0;
  } else {
    index++;
    if (index >= m.length) {
      index = 0;
    }
  }
  currentMessage = m[index].content;
  debugLog('Message courant défini: ' + currentMessage.substring(0, 50) + '...');
}

// --------------------------------------------------------
//  function getMessageList
//
//  Get list of all messages from database.
// --------------------------------------------------------
var getMessageList = function() {
  // Détecter le board depuis l'URL
  var board = getBoardFromURL();
  
  // Vérifier si on est déjà en train de charger (éviter les appels multiples)
  if (getMessageList._loading) {
    console.log('Chargement déjà en cours, ignoré');
    return true;
  }
  
  getMessageList._loading = true;
  
  debugLog('Chargement des messages en cours pour board: ' + board);
  console.log('Chargement des messages en cours');
  console.log('Page message:', isMessagePage);
  console.log('Page Solari:', isSolariPage);
  console.log('Page messages:', isMessagesPage);
  console.log('Board détecté:', board);
  
  // Vider la liste si on est sur la page messages (modération)
  if (isMessagesPage && dreamsList) {
    dreamsList.innerHTML = "";
  }
  
  // Utiliser Hygraph si disponible, sinon fallback vers l'API
  if (window.SupabaseClient && window.SupabaseClient.getMessagesByBoard) {
    debugLog('Utilisation de Hygraph pour récupérer les messages');
    // Utiliser Hygraph
    window.SupabaseClient.getMessagesByBoard(board)
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
        
        // Réinitialiser le flag de chargement
        getMessageList._loading = false;
      })
      .catch(function(error) {
        debugLog('Erreur Hygraph: ' + error.message);
        console.error('Erreur Hygraph:', error);
        // Fallback vers l'API Express
        fallbackToExpressAPI(board);
        getMessageList._loading = false;
      });
  } else {
    debugLog('Hygraph non disponible, utilisation du fallback');
    console.error('Hygraph non disponible');
    fallbackToExpressAPI(board);
    getMessageList._loading = false;
  }
  
  return true;
};



// a helper function that creates a list item for a given dream
var appendNewDream = function(dream, id, created_at) { // Changed parameter name
  var template = document.querySelector("#messagerow");
  var divList = document.querySelector("#dreams"); // Insert point of the template
  var messageRow = document.importNode(template.content, true);
  var pTxt = messageRow.querySelector(".message-content") || messageRow.querySelector("p"); // Message text (nouveau ou ancien format)
  var textarea = messageRow.querySelector(".message-edit"); // Textarea pour édition
  var editBtn = messageRow.querySelector(".edit-btn"); // Bouton éditer
  var saveBtn = messageRow.querySelector(".save-btn"); // Bouton sauvegarder
  var cancelBtn = messageRow.querySelector(".cancel-btn"); // Bouton annuler
  var delBut = messageRow.querySelector(".delete-btn") || messageRow.querySelector("button"); // Bouton supprimer (nouveau ou ancien format)
  var datElt = messageRow.querySelector("small.timestamp");
  
  // Contenu initial
  if (pTxt) {
    pTxt.textContent = dream;
  }
  if (textarea) {
    textarea.value = dream;
  }
  if (delBut) {
    delBut.id = id;
  }

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
  
  if (datElt) {
    datElt.title = created_at;
    datElt.innerHTML = timeText;
  }
  
  // Listener pour éditer (seulement si tous les éléments nécessaires sont présents)
  if (editBtn && pTxt && textarea && saveBtn && cancelBtn) {
    editBtn.addEventListener("click", function() {
      // Passer en mode édition
      pTxt.classList.add("d-none");
      editBtn.classList.add("d-none");
      textarea.classList.remove("d-none");
      saveBtn.classList.remove("d-none");
      cancelBtn.classList.remove("d-none");
      textarea.focus();
    });
    
    // Listener pour annuler
    cancelBtn.addEventListener("click", function() {
      // Revenir au mode affichage
      textarea.value = dream; // Restaurer la valeur originale
      pTxt.classList.remove("d-none");
      editBtn.classList.remove("d-none");
      textarea.classList.add("d-none");
      saveBtn.classList.add("d-none");
      cancelBtn.classList.add("d-none");
    });
    
    // Listener pour sauvegarder
    saveBtn.addEventListener("click", function() {
      var newContent = textarea.value.trim();
      
      if (!newContent) {
        alert("Le message ne peut pas être vide");
        return;
      }
      
      if (newContent === dream) {
        // Pas de changement, juste annuler
        cancelBtn.click();
        return;
      }
      
      // Appeler l'API pour mettre à jour
      if (window.SupabaseClient && window.SupabaseClient.updateMessage) {
        window.SupabaseClient.updateMessage(id, newContent)
          .then(function(success) {
            if (success) {
              // Mettre à jour le contenu affiché
              pTxt.textContent = newContent;
              dream = newContent; // Mettre à jour la variable locale
              
              // Revenir au mode affichage
              pTxt.classList.remove("d-none");
              editBtn.classList.remove("d-none");
              textarea.classList.add("d-none");
              saveBtn.classList.add("d-none");
              cancelBtn.classList.add("d-none");
              
              console.log('Message mis à jour avec succès');
            } else {
              alert('Erreur lors de la mise à jour du message');
            }
          })
          .catch(function(error) {
            console.error('Erreur lors de la mise à jour:', error);
            alert('Erreur lors de la mise à jour du message');
          });
      }
    });
  }
  
  divList.appendChild(messageRow);

  // Adding a listener pour supprimer
  if (delBut) {
    delBut.addEventListener("click", delFunction, false);
  }
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

  // Détecter le board depuis l'URL
  var board = getBoardFromURL();
  
  console.log('Ajout de message en cours');
  
  // Utiliser Hygraph si disponible
  if (window.SupabaseClient && window.SupabaseClient.addMessage) {
    console.log('Utilisation de Hygraph pour ajouter le message');
    // Utiliser Hygraph
    window.SupabaseClient.addMessage(messageContent, board)
      .then(function(success) {
        if (success) {
          console.log('Message ajouté avec succès via Hygraph');
          // Vider le champ de saisie
          dreamInput.value = "";
          dreamInput.focus();
          
          // Afficher le popup de confirmation
          showSuccessPopup();
        } else {
          console.error('Erreur lors de l\'ajout du message via Hygraph');
        }
      })
      .catch(function(error) {
        console.error('Erreur Hygraph lors de l\'ajout:', error);
      });
  } else {
    console.error('Hygraph non disponible');
  }
  };
}



if (clearButton) {
  clearButton.addEventListener("click", function(event) {
  event.preventDefault();
  
  // Détecter le board depuis l'URL
  var board = getBoardFromURL();
  
  console.log('Suppression de tous les messages en cours');
  
  // Utiliser Hygraph si disponible
  if (window.SupabaseClient && window.SupabaseClient.deleteAllMessages) {
    console.log('Utilisation de Hygraph pour supprimer tous les messages');
    
    window.SupabaseClient.deleteAllMessages(board)
      .then(function(success) {
        if (success) {
          console.log('Tous les messages supprimés avec succès via Hygraph');
          // Vider la liste dans le DOM
          if (dreamsList) {
            dreamsList.innerHTML = "";
          }
        } else {
          console.error('Erreur lors de la suppression de tous les messages via Hygraph');
        }
      })
      .catch(function(error) {
        console.error('Erreur Hygraph lors de la suppression de tous les messages:', error);
      });
  } else {
    console.error('Hygraph non disponible pour la suppression de tous les messages');
  }
});
}

var delFunction = function() {
  var messageId = this.id;
  var divASupp = this.parentElement;
  
  console.log('Suppression du message en cours');
  
  // Utiliser Hygraph si disponible
  if (window.SupabaseClient && window.SupabaseClient.deleteMessage) {
    console.log('Utilisation de Hygraph pour supprimer le message');
    
    window.SupabaseClient.deleteMessage(messageId)
      .then(function(success) {
        if (success) {
          console.log('Message supprimé avec succès via Hygraph');
          // Supprimer l'élément du DOM
          if (dreamsList && divASupp) {
            dreamsList.removeChild(divASupp);
          }
        } else {
          console.error('Erreur lors de la suppression du message via Hygraph');
        }
      })
      .catch(function(error) {
        console.error('Erreur Hygraph lors de la suppression:', error);
      });
  } else {
    console.error('Hygraph non disponible pour la suppression');
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

// Ne pas charger les messages automatiquement ici
// Ils sont chargés via loadBoard() dans index.html après 2 secondes

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
