/**
 * Open popUp to choose one template
 */
function select_template() {
    document.getElementById('template-popup').style.display = 'block';
}

/**
 * hide popUp when function is call
 */
function hidePopUpForm() {
    document.getElementById('template-popup').style.display = 'none';
}

/**
 * Add a Prescription to the database
 * @param {object} element - Prescription object
 */
function addPrescri() {
    let ordonnance = {
        p_creator: document.getElementById('p_creator').value,
        p_attached_to: document.getElementById('p_attached_to').value,
        p_content: document.getElementById('content').outerText
    };
    
    console.log(ordonnance);

    apiPost('prescription', ordonnance, function(response) {
        response.json().then(function(data) {
            window.location.reload();
        });
    });
}

/**
 * Select first template and add value in content zone
 */
function select_tempone() {
    const medecin = document.getElementById('namecrea').value;
    const patient = document.getElementById('p_attached_to').value;
    const output = document.getElementById('p_content');
    const ordo = "&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp ORDONNANCE <br><br><br> DATE: <br><br> ";
    const ordo2 = "NUMERO DE SECURITER SOCIAL: ";
    const ordo3 = "<br><br>PRESCRIPTION MEDICALE:<br>-<br>-<br>-<br><br><br> SIGNATURE: ";
    const tag = "<br><br><br> 3 mois de validiter &nbsp&nbsp&nbsp&nbsp&nbsp&nbsp Helpital";


    if (output.innerHTML === "<div> <br></div>" || "") {
        output.innerHTML += ordo;
        output.innerHTML += ordo2;
        output.innerHTML += patient;
        output.innerHTML += ordo3;
        output.innerHTML += medecin;
        output.innerHTML += tag;
    }
    

    document.getElementById('template-popup').style.display = 'none';
}

/**
 * Select second template and add value in content zone
 */
function select_temptwo() {
    const medecin = document.getElementById('namecrea').value;
    const patient = document.getElementById('p_attached_to').value;
    const output = document.getElementById("p_content");
    const bizone = "&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp ORDONNANCE BIZONE <br><br><br> DATE: <br><br>";
    const bizone2 = " NUMERO DE SECURITER SOCIAL: "
    const bizone3 = "<br><br>prescription relative au traitement de longue durée reconnue<br> AFFECTION EXONERANTE:<br>-<br>-<br>-<br><br> prescritpion sans rapport avec l affection longue durée<br> MALADIES INTERCURRENTES:<br>-<br>-<br>-<br><br><br> SIGNATURE: "
    const tag = "<br><br><br> 3 mois de validiter &nbsp&nbsp&nbsp&nbsp&nbsp&nbsp Helpital";

    if (output.innerHTML === "<div> <br></div>" || "") {
        output.innerHTML += bizone;
        output.innerHTML += bizone2;
        output.innerHTML += patient;
        output.innerHTML += bizone3;
        output.innerHTML += medecin;
        output.innerHTML += tag;
    }

    document.getElementById('template-popup').style.display = 'none';
}

/**
 * get list of users to autocomplete the input
 */
function searchListCreator() {
    // Declare variables
    var input, filter, ul, li, a, i, txtValue;
    input = document.getElementById('p_creator');
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
    input = document.getElementById('p_attached_to');
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
    var input = document.getElementById("p_creator");
    input.value = login;
}

/**
 * autocomplete input with value of ss_number
 */
function displaySsNumber(ss_number) {
    var input = document.getElementById("p_attached_to");
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

function customPost() {
    let p_content = document.getElementById("p_content").textContent
    let p_attached_to = document.getElementById("p_attached_to").textContent
    let p_creator = document.getElementById("p_creator").textContent
    let toPost = {
        p_content: p_content,
        p_attached_to: p_attached_to,
        p_creator: p_creator
    }
    apiPost('prescription', toPost, () => {
        history.back()
    })
}

function popPrescription(ssNumber) {
    const alertBackground = document.getElementById('alert-box-background');
    let alertBox = alertBackground.children[0];
    // const mainBox = alertBackground.children[0].children[0];
    // const titleElem = document.createElement('h1');
    alertBox.style.minHeight = "50vh";

    let url = "/prescription/headerless?patient=" + ssNumber;
    // loadContent(url, 'alert-box-background')
    // titleElem.innerText = "Signaler un objet défectueux";
    // mainBox.appendChild(titleElem);

    fetch(url).then(response => {
        if (response.status >= 200 && response.status < 300) {
            response.text().then(function(data) {
                alertBox.innerHTML = data;
            });
        } else
            customAlert(MSG_ERROR, MSG_INTERNAL_ERROR, WARNING);
    });
    if (alertBackground.style.display === 'block')
        closeAlert();
    alertBackground.style.display = 'block';

}

function sendData() {
    let data = {
        p_attached_to: document.getElementById('p_attached_to'),
        p_creator: document.getElementById('p_creator'),
        p_content: document.getElementById('p_content')
    }
    apiPost('/api/prescription', data, () => {
        closeAlert();
    })
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