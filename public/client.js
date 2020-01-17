// client-side js
// run by the browser each time your view template referencing it is loaded

const dreams = [];

// define variables that reference elements on our page
const dreamsForm = document.forms[0];
const dreamInput = dreamsForm.elements["dream"];
const dreamsList = document.getElementById("dreams");
const clearButton = document.querySelector("#clear-dreams");
var currentMessage = "Visit /message to publish"; // here you can modify the 'empty message'
var lastID = 0;
var index = 0;

function setCurrentMessage(m) {
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
  currentMessage = m[index].dream;
}

//function getMessageList() {
var getMessageList = function() {
  // Suppress all the list
  if (dreamsList) dreamsList.innerHTML = "";
  // request the dreams from our app's sqlite database
  fetch("/getDreams", {})
    .then(res => res.json())
    .then(response => {
      // If we are on  the backoffice dreamsList exists, if not, not !
      if (dreamsList) {
        response.forEach(row => {
          appendNewDream(row.dream, row.id, row.pubdate);
        });
      } else {
        // We are on front display dreamsList does not exists but currentMessage is the string we need to addresss
        setCurrentMessage(response);
      }
    });
};

// a helper function that creates a list item for a given dream
const appendNewDream = (dream, id, pubdate) => {
  var template = document.querySelector("#messagerow");
  var divList = document.querySelector("#dreams"); // Insert point of the template
  var messageRow = document.importNode(template.content, true);
  var pTxt = messageRow.querySelector("p"); // Insterting message text
  var delBut = messageRow.querySelector("button"); // Insterting message id
  var datElt = messageRow.querySelector("small");
  pTxt.textContent = dream;
  delBut.id = id;

  pubdate = pubdate.split(".")[0];
  var d = pubdate.split(" ")[0];
  const regex = /-/gi;
  var h = pubdate.split(" ")[1].replace(regex, ":");
  datElt.title = d + "T" + h + "Z";
  datElt.innerHTML = d + " " + h;
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
    .then(response => {});
  // get dream value and add it to the list
  dreams.push(dreamInput.value);
  //appendNewDream(dreamInput.value);
  getMessageList();

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
