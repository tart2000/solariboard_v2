// client-side js
// run by the browser each time your view template referencing it is loaded

const dreams = [];

// define variables that reference elements on our page
const dreamsForm = document.forms[0];
const dreamInput = dreamsForm.elements["dream"];
const dreamsList = document.getElementById("dreams");
const clearButton = document.querySelector("#clear-dreams");
var currentMessage = "Visit /message to publish";
var lastID = 0;

function setCurrentMessage(m) {
  currentMessage = m.dream;
  lastID = m.id;
}

function getMessageList() {
// request the dreams from our app's sqlite database
fetch("/getDreams", {})
  .then(res => res.json())
  .then(response => {
    // If we are on  the backoffice dreamsList exists, if not, not !
    if (dreamsList) {
      response.forEach(row => {
        appendNewDream(row.dream, row.id);
      });
    } else {
      // We are on front display dreamsList does not exists but currentMessage is the string we need to addresss
      setCurrentMessage(response[0]);
    }
  });
}

// a helper function that creates a list item for a given dream
const appendNewDream = (dream, id) => {
  var template = document.querySelector("#messagerow");
  var divList = document.querySelector("#dreams"); // Insert point of the template
  var messageRow = document.importNode(template.content, true);
  var pTxt = messageRow.querySelector("p"); // Insterting message text
  var delBut = messageRow.querySelector("button"); // Insterting message id
  pTxt.textContent = dream;
  delBut.id = id;
  divList.appendChild(messageRow);

  // Adding a listener
  delBut.addEventListener("click", delFunction, false);
};

// listen for the form to be submitted and add a new dream when it is
dreamsForm.onsubmit = event => {
  // stop our form submission from refreshing the page
  event.preventDefault();

  const data = { dream: dreamInput.value };

  fetch("/addDream", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" }
  })
    .then(res => res.json())
    .then(response => {
      getMessageList();
    });
  // get dream value and add it to the list
  dreams.push(dreamInput.value);
  appendNewDream(dreamInput.value);

  // reset form
  dreamInput.value = "";
  dreamInput.focus();
};

clearButton.addEventListener("click", event => {
  fetch("/clearDreams", {})
    .then(res => res.json())
    .then(response => {
      console.log("cleared dreams");
    });
  dreamsList.innerHTML = "";
});

var delFunction = function() {
  const data = { id: this.id };
  fetch("/delMessage", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" }
  })
    .then(res => res.json())
    .then(response => {
      getMessageList();
      console.log(JSON.stringify(response));
    });
};

getMessageList();