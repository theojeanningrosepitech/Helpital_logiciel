/**
 * Add a Note to the database
 * @param {object} element - Note object
 */
function addNote() {
    let notes = {
        n_creator: document.getElementById('n_creator').value,
        n_attached_to: document.getElementById('n_attached_to').value,
        n_content: document.getElementById('n_content').outerText
    };

    console.log(notes);

    apiPost('note', notes, function(response) {
        response.json().then(function(data) {
            window.location.reload();
        });
    });
}

/**
 * get list of users to autocomplete the input
 */
function searchListCreator() {
    // Declare variables
    var input, filter, ul, li, a, i, txtValue;
    input = document.getElementById('n_creator');
    filter = input.value.toUpperCase();
    ul = document.getElementById("displayResult");
    li = ul.getElementsByTagName('li');

    if (input.value)
        ul.style.display = "block";
    else
        ul.style.display = "none";

    // Loop through all list items, and hide those who don't match the search query
    for (i = 0; i < li.length; i++) {
        a = li[i].getElementsByTagName("a")[0];
        txtValue = a.textContent || a.innerText;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
            li[i].style.display = "block";
        } else {
            li[i].style.display = "none";
        }
    }
}

/**
 * get list of ss_number to autocomplete the input
 */
function searchListAttached() {
    // Declare variables
    var input, filter, ul, li, a, i, txtValue;
    input = document.getElementById('n_attached_to');
    filter = input.value.toUpperCase();
    ul = document.getElementById("patientDropdown");
    li = ul.getElementsByTagName('li');

    if (input.value)
        ul.style.display = "block";
    else
        ul.style.display = "none";

    // Loop through all list items, and hide those who don't match the search query
    for (i = 0; i < li.length; i++) {
        a = li[i].getElementsByTagName("a")[0];
        txtValue = a.textContent || a.innerText;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
            li[i].style.display = "block";
        } else {
            li[i].style.display = "none";
        }
    }
}

/**
 * autocomplete input with value of user
 */
function displayLog(login) {
    var input = document.getElementById("n_creator");
    input.value = login;
}

/**
 * autocomplete input with value of ss_number
 */
function displaySsNumber(ss_number) {
    var input = document.getElementById("n_attached_to");
    input.value = ss_number;
}

/**
 * function wait to click on value
 */
function listenKeyEnter(userId) {
    var li = document.getElementById(userId);

    li.addEventListener("keyup", function(event) {
        // Number 13 is the "Enter" key on the keyboard
        if (event.key === "Enter") {
            // Cancel the default action, if needed
            event.preventDefault();
            // Trigger the button element with a click
            li.click();
            return true
        }
        return false
    });
}

/**
 * call other function when click is trigger.
 */
// function checkClick() {
//     document.onclick = function(e) {
//         var patientDropdown = document.querySelector("#patientDropdown");
//         var tuto = document.querySelector("#tutorial_display");
//         if (e.target.id === "pop-up-container") {
//             console.log('in');
//             tuto.style.display = 'none';
//         }
//         if (e.target.id !== "patientDropdown") {
//             patientDropdown.style.display = 'none';
//         }
//     };
// }

// checkClick();