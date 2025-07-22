// client-side js
// run by the browser each time your view template referencing it is loaded

const dreams = [];

// define variables that reference elements on our page
const dreamsForm = document.forms[0];
const dreamInput = dreamsForm ? dreamsForm.elements["dream"] : null;
const dreamsList = document.getElementById("dreams");
const clearButton = document.querySelector("#clear-dreams");
var currentMessage = "Rendez-vous sur /message pour envoyer votre premier message"; // Message de fallback
var lastID = 0;
var index = 0;

// Détecter si on est sur la page message, messages ou sur la page Solari
const isMessagePage = window.location.pathname.includes('/message') && !window.location.pathname.includes('/messages');
const isMessagesPage = window.location.pathname.includes('/messages');
const isSolariPage = !isMessagePage && !isMessagesPage;

function setCurrentMessage(m) {
  // Si aucun message ou tableau vide
  if (!m || m.length === 0) {
    currentMessage = "Rendez-vous sur /message pour envoyer votre premier message";
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
}

// --------------------------------------------------------
//  function getMessageList
//
//  Get list of all messages from database.
// --------------------------------------------------------
var getMessageList = function() {
  // Détecter le client depuis l'URL
  const pathParts = window.location.pathname.split('/');
  const client = pathParts[1] || 'pocstudio'; // Le premier segment après le slash
  
  console.log('Chargement des messages en cours');
  console.log('Page message:', isMessagePage);
  console.log('Page Solari:', isSolariPage);
  
  // Vider la liste si on est sur la page messages (modération)
  if (isMessagesPage && dreamsList) {
    dreamsList.innerHTML = "";
  }
  
  // Utiliser Supabase si disponible, sinon fallback vers l'API
  if (window.SupabaseClient && window.SupabaseClient.getMessagesByClient) {
    console.log('Utilisation de Supabase pour récupérer les messages');
    // Utiliser Supabase
    window.SupabaseClient.getMessagesByClient(client)
      .then(response => {
        console.log('Messages récupérés:', response);
        
        // Si on est sur la page messages (modération), afficher dans la liste
        if (isMessagesPage && dreamsList) {
          response.forEach(row => {
            appendNewDream(row.content, row.id, row.created_at);
          });
        }
        // Si on est sur la page Solari, mettre à jour le message courant
        if (isSolariPage) {
          setCurrentMessage(response);
        }
      })
      .catch(error => {
        console.error('Erreur Supabase:', error);
        // Fallback vers l'API Express
        fallbackToExpressAPI(client);
      });
  } else {
    console.error('Supabase non disponible');
  }
  
  return true;
};



// a helper function that creates a list item for a given dream
const appendNewDream = (dream, id, created_at) => { // Changed parameter name
  var template = document.querySelector("#messagerow");
  var divList = document.querySelector("#dreams"); // Insert point of the template
  var messageRow = document.importNode(template.content, true);
  var pTxt = messageRow.querySelector("p"); // Insterting message text
  var delBut = messageRow.querySelector("button"); // Insterting message id
  var datElt = messageRow.querySelector("small");
  pTxt.textContent = dream;
  delBut.id = id;

  // Parse ISO date string
  var date = new Date(created_at);
  var d = date.toISOString().split('T')[0];
  var h = date.toTimeString().split(' ')[0];
  datElt.title = created_at;
  datElt.innerHTML = d + " " + h;
  divList.appendChild(messageRow);

  // Adding a listener
  delBut.addEventListener("click", delFunction, false);
};

// listen for the form to be submitted and add a new dream when it is
if (dreamsForm) {
  dreamsForm.onsubmit = event => {
  // stop our form submission from refreshing the page
  event.preventDefault();

  const messageContent = dreamInput.value;
  
  // Vérifier que le message n'est pas vide
  if (!messageContent.trim()) {
    console.log('Message vide, ignoré');
    return;
  }

  // Détecter le client depuis l'URL
  const pathParts = window.location.pathname.split('/');
  const client = pathParts[1] || 'pocstudio'; // Le premier segment après le slash
  
  console.log('Ajout de message en cours');
  
  // Utiliser Supabase si disponible
  if (window.SupabaseClient && window.SupabaseClient.addMessage) {
    console.log('Utilisation de Supabase pour ajouter le message');
    // Utiliser Supabase
    window.SupabaseClient.addMessage(messageContent, client)
      .then(success => {
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
      .catch(error => {
        console.error('Erreur Supabase lors de l\'ajout:', error);
      });
  } else {
    console.error('Supabase non disponible');
  }
  };
}



if (clearButton) {
  clearButton.addEventListener("click", event => {
  event.preventDefault();
  
  // Détecter le client depuis l'URL
  const pathParts = window.location.pathname.split('/');
  const client = pathParts[1] || 'pocstudio';
  
  console.log('Suppression de tous les messages en cours');
  
  // Utiliser Supabase si disponible
  if (window.SupabaseClient && window.SupabaseClient.deleteAllMessages) {
    console.log('Utilisation de Supabase pour supprimer tous les messages');
    
    window.SupabaseClient.deleteAllMessages(client)
      .then(success => {
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
      .catch(error => {
        console.error('Erreur Supabase lors de la suppression de tous les messages:', error);
      });
  } else {
    console.error('Supabase non disponible pour la suppression de tous les messages');
  }
});

var delFunction = function() {
  const messageId = this.id;
  const divASupp = this.parentElement;
  
  console.log('Suppression du message en cours');
  
  // Utiliser Supabase si disponible
  if (window.SupabaseClient && window.SupabaseClient.deleteMessage) {
    console.log('Utilisation de Supabase pour supprimer le message');
    
    window.SupabaseClient.deleteMessage(messageId)
      .then(success => {
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
      .catch(error => {
        console.error('Erreur Supabase lors de la suppression:', error);
      });
  } else {
    console.error('Supabase non disponible pour la suppression');
  }
};
}

// Test wordwrap
function wordWrap(str, charMax) {
  let arr = [];
  let space = /\s/;

  const words = str.split(space);
  // push first word into new array
  if (words[0].length) {
    arr.push(words[0]);
  }

  for (let i = 1; i < words.length; i++) {
    if (words[i].length + arr[arr.length - 1].length < charMax) {
      arr[arr.length - 1] = `${arr[arr.length - 1]} ${words[i]}`;
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
  const popup = document.getElementById('success-popup');
  if (popup) {
    // Afficher le popup
    popup.style.display = 'block';
    
    // Masquer le popup après 2 secondes
    setTimeout(() => {
      popup.style.animation = 'popupFadeOut 0.3s ease-out';
      setTimeout(() => {
        popup.style.display = 'none';
        popup.style.animation = '';
      }, 300);
    }, 2000);
  }
}
