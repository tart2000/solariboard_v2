// client-side js
// run by the browser each time your view template referencing it is loaded

const dreams = [];

// define variables that reference elements on our page
const dreamsForm = document.forms[0];
const dreamInput = dreamsForm.elements["dream"];
const dreamsList = document.getElementById("dreams");
const clearButton = document.querySelector("#clear-dreams");
var currentMessage = "Rendez-vous sur /message pour envoyer votre premier message"; // Message de fallback
var lastID = 0;
var index = 0;

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
  // Suppress all the list
  if (dreamsList) dreamsList.innerHTML = "";
  
  // Détecter le client depuis l'URL
  const pathParts = window.location.pathname.split('/');
  const client = pathParts[1]; // Le premier segment après le slash
  
  // Utiliser Supabase si disponible, sinon fallback vers l'API
  if (window.SupabaseClient && window.SupabaseClient.getMessagesByClient) {
    // Utiliser Supabase
    window.SupabaseClient.getMessagesByClient(client || 'sparklab')
      .then(response => {
        if (dreamsList) {
          response.forEach(row => {
            appendNewDream(row.content, row.id, row.created_at);
          });
        } else {
          setCurrentMessage(response);
        }
      })
      .catch(error => {
        console.error('Erreur Supabase:', error);
        // Fallback vers l'API Express
        fallbackToExpressAPI(client);
      });
  } else {
    // Fallback vers l'API Express
    fallbackToExpressAPI(client);
  }
  
  return true;
};

// Fonction de fallback vers l'API Express
function fallbackToExpressAPI(client) {
  const apiUrl = client && client !== 'message' ? `/${client}/getDreams` : "/getDreams";
  
  fetch(apiUrl, {})
    .then(res => res.json())
    .then(response => {
      if (dreamsList) {
        response.forEach(row => {
          appendNewDream(row.content, row.id, row.created_at);
        });
      } else {
        setCurrentMessage(response);
      }
    })
    .catch(error => {
      console.error('Erreur API Express:', error);
    });
}

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
dreamsForm.onsubmit = event => {
  // stop our form submission from refreshing the page
  event.preventDefault();

  const dreamContent = dreamInput.value;

  // Détecter le client depuis l'URL
  const pathParts = window.location.pathname.split('/');
  const client = pathParts[1] || 'sparklab'; // Le premier segment après le slash
  
  // Utiliser Supabase si disponible, sinon fallback vers l'API
  if (window.SupabaseClient && window.SupabaseClient.addMessage) {
    // Utiliser Supabase
    window.SupabaseClient.addMessage(dreamContent, client)
      .then(success => {
        if (success) {
          console.log('Message ajouté via Supabase');
          dreams.push(dreamContent);
          getMessageList();
          dreamInput.value = "";
          dreamInput.focus();
        } else {
          console.error('Erreur ajout message Supabase');
          // Fallback vers l'API Express
          fallbackAddMessage(dreamContent, client);
        }
      })
      .catch(error => {
        console.error('Erreur Supabase:', error);
        // Fallback vers l'API Express
        fallbackAddMessage(dreamContent, client);
      });
  } else {
    // Fallback vers l'API Express
    fallbackAddMessage(dreamContent, client);
  }
};

// Fonction de fallback pour ajouter un message via l'API Express
function fallbackAddMessage(dreamContent, client) {
  const data = { dream: dreamContent };
  const apiUrl = client && client !== 'message' ? `/${client}/addDream` : "/addDream";

  fetch(apiUrl, {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" }
  })
    .then(res => res.json())
    .then(response => {
      dreams.push(dreamContent);
      getMessageList();
      dreamInput.value = "";
      dreamInput.focus();
    })
    .catch(error => {
      console.error('Erreur API Express:', error);
    });
}

clearButton.addEventListener("click", event => {
  fetch("/clearDreams", {})
    .then(res => res.json())
    .then(response => {
      console.log("cleared dreams");
    });
  dreamsList.innerHTML = "";
});

var delFunction = function() {
  var divASupp = this.parentElement;
  dreamsList.removeChild(divASupp);
  const data = { id: this.id };
  fetch("/delMessage", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" }
  })
    .then(res => res.json())
    .then(response => {
      console.log(JSON.stringify(response));
    });
};

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

getMessageList();
