function load(buttonText) {
    let elem = document.getElementById('inner-body');
    let oldElem = document.getElementsByClassName('navbar-button-active');

    if (oldElem[0] !== undefined)
        oldElem[0].className = 'navbar-button';
    buttonText.className = 'navbar-button-active';
}

function order(buttonText) {
    console.log(buttonText.innerText);
}

async function f(element) {
    // console.log(element.style.height)
    // element.style.height = "15%";
    let response = await fetch('/api/backoffice/repair/reports/' + element.firstChild.innerText, {
        method: 'get'
    });
    let data = await response.json();
    let collection = [];
    for (let item of data) {
        let el = document.createElement("div");
        let date = document.createElement("div");
        let msg = document.createElement("div");

        date.className = "pop-up-date";
        msg.className = "pop-up-message";

        msg.innerText = item.message;
        date.innerText = item.created_at.slice(0, 10).split("-").reverse().join("-");

        el.appendChild(date);
        el.appendChild(msg);
        el.className = "table-row"
        collection.push(el);
    }

    // el.appendChild()
    customAlertRepair("Liste des signalements pour réparation", collection);
}

function customAlertRepair(title, customContent) {
    const alertBackground = document.getElementById('alert-box-background');
    const mainBox = alertBackground.children[0].children[0];
    const titleElem = document.createElement('h1');

    titleElem.innerText = title;
    titleElem.style.marginBottom = "15px";

    if (alertBackground.style.display === 'block')
        closeAlert();
    mainBox.appendChild(titleElem);
    for (let el of customContent)
        mainBox.appendChild(el);
    alertBackground.style.display = 'block';
}

function deleteUser(element) {
    let row = element.parentElement.parentElement;
    console.log(element.parentElement.parentElement);
}

// Verifie si tous les input sont bien remplis et effectue un Post dans la table user
function addUser() {

    const userService = document.getElementById('services');
    const userRole = document.getElementById('role');

    const data = {
        firstname: document.getElementById('firstname').value,
        lastname: document.getElementById('lastname').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        services: parseInt(userService.options[userService.selectedIndex].value),
        roles: parseInt(userRole.options[userRole.selectedIndex].value)
    };

    if (data.firstname === "") {
        customAlert(MSG_ERROR, 'Remplir le champ prénom.', WARNING);
        return;
    } else if (data.lastname === "") {
        customAlert(MSG_ERROR, 'Remplir le champ nom.', WARNING);
        return;
    } else if ( !phoneValid(data.phone)) {
        customAlert(MSG_ERROR, 'Numéro de téléphone incorrect.', WARNING);
        return;
    }

    apiPost("users", data, function(){
        window.location.reload()
    });
}

function printRole(obj) {
    if (obj == 1)
        print('Admin');
    if (obj == 2)
        print('Chef de service');
    if (obj == 3)
        print('Medecin');
    if (obj == 4)
        print('Infirmier');
    if (obj == 5)
        print('Réception hopital');
    if (obj == 6)
        print('Interim')
}

// showPopUpForm()
//
// Show the form pop up
function showPopUpForm() {
    document.getElementById('pop-up-form-container').style.display = 'block';
}

// hidePopUpForm()
//
// Hide the form pop up
function hidePopUpForm() {
    document.getElementById('pop-up-form-container').style.display = 'none';
}

// Vérifie si le numéros de téléphone entrer est correcte avec une regex
function phoneValid(phone) {
    const phoneregex = ( /^((\+|00)33\s?|0)[67](\s?\d{2}){4}$/);
    console.log(phone.value);

    if ((phone.match(phoneregex))) {
        return (true);
    } else {
        return (false);
    }
}

function editable(element, roles) {
    let elem = element.parentElement;
    let user_id = element.parentElement.parentElement.firstElementChild.innerText;
    let select = document.createElement('select');

    select.id = "roles";
    for (let el of roles) {
        let option = document.createElement("option");
        option.value = el.role_name;
        option.text = el.role_name;
        select.appendChild(option);
    }
    select.value = element.parentElement.innerText;
    elem.innerHTML = "";
    let icon = document.createElement('span');
    let img = document.createElement('img');
    img.src = "/images/img_525475.png";
    img.style.width = "100%";
    icon.className = "modify-role";

    let getId = function (roleName) {
        for (let item of roles) {
            if (item.role_name === roleName)
                return item.id;
        }
    }
    icon.addEventListener('click', async function () {
        let resp = await fetch('/api/user/role', {
            method: "put",
            body: {
                role_id: getId(select.value),
                user_id: user_id
            }
        })

        console.log(resp);

    });

    icon.appendChild(img);
    elem.appendChild(select);
    elem.appendChild(icon);
}

/**
 * Replace text
 */
function replaceText() {
    let get = document.getElementById("detail_user_pop");
    let get2 = document.getElementById("detail_img_user_pop");
    let get3 = document.getElementById("detail_availability_user_pop");
    let get4 = document.getElementById("detail_log_user_pop");

    get.replaceChildren();
    get2.replaceChildren();
    get3.replaceChildren();
    get4.replaceChildren();
}

/**
 * Element group html
 * @param {object} user - Details of user
 * @param {string} service - Name service
 * @param {string} role - Name role
 * @param {string} avatar - URL img
 */
function elementGroupsHtml(user, service, role, avatar) {
    createElementHtml(user.firstname + ' ' + user.lastname, "p", "detail_user_pop");
    createElementHtml(user.email, "p", "detail_user_pop");
    createElementHtml(user.phone, "p", "detail_user_pop");
    createElementHtml(role, "p", "detail_user_pop");
    createElementHtml(service, "p", "detail_user_pop");
    createImgHtml(avatar, "img", "detail_img_user_pop");
}

/**
 * Create div p html
 * @param {string} text1 - Content 1
 * @param {string} text2 - Content 2
 * @param {string} background - Class css for color bakground
 * @param {string} id - Name id balise
 */
function createDivPHtml(text1, text2, background, id) {
    let get = document.getElementById(id);
    let createDiv = document.createElement('div');
    let createP1;
    let createP2 = document.createElement('p');

    createDiv.classList.add(background);
    get.appendChild(createDiv);
    if (text1 != null) {
        createP1 = document.createElement('p');
        createP1.textContent = text1;
        createDiv.appendChild(createP1);
    }
    createP2.textContent = text2;
    createDiv.append(createP2);
}

/**
 * Create Element html
 * @param {string} text - Content
 * @param {string} element - Balise html
 * @param {string} id - Name id balise
 */
function createElementHtml(text, element, id) {
    let get = document.getElementById(id);
    let create = document.createElement(element);
    let text_html = document.createTextNode(text);

    create.appendChild(text_html);
    get.appendChild(create);
}

/**
 * Create img html
 * @param {string} text - Url
 * @param {string} element - Balise html
 * @param {string} id - Name id balise
 */
function createImgHtml(text, element, id) {
    let get = document.getElementById(id);
    let create = document.createElement(element);

    create.style.height = "145px";
    create.style.width = "145px";
    create.src = text;
    get.appendChild(create);
}

/**
 * Create Element with icone
 * @param {string} text - Content
 * @param {string} id_icone - Name icone class
 * @param {string} id - Name id balise
 */
function createElementWithIcone(text, id_icone, id) {
    let get = document.getElementById(id);
    let createH3 = document.createElement('h3');
    let createI = document.createElement('i');

    createH3.textContent = text;
    get.appendChild(createH3);
    if (id_icone == "change_icon")
        createI.onclick = function () {displayCloseInavailabilityEnd()};
    if (id_icone == "change_icon2")
        createI.onclick = function () {displayCloseInavailabilityInProgress()};
    if (id_icone == "change_icon_contract")
        createI.onclick = function () {displayCloseContractEnd()};
    if (id_icone == "change_icon_contract2")
        createI.onclick = function () {displayCloseContractInProgress()};
    createI.setAttribute('class', 'fa fa-plus');
    createI.setAttribute('id',id_icone);
    createH3.append(createI);
}

/**
 * Create Element html with id
 * @param {string} element - Balise html
 * @param {string} add_id - Name id balise
 * @param {string} id - Name id balise
 */
function createElementWithId(element, add_id, id) {
    let get = document.getElementById(id);
    let createElem = document.createElement(element);

    createElem.setAttribute('class', 'display_none');
    createElem.setAttribute('id', add_id);
    get.appendChild(createElem);
}

/**
 *
 * @param {integer} user - Id user
 * @param {integer} availability - Id inavailability
 * @param {string} id - Name id balise
 */
function createDivPHtmlAvailability(user, availability, id) {
    let get = document.getElementById(id);
    let createDiv = document.createElement('div');
    let createP1 = document.createElement('p');
    let createP2 = document.createElement('p');
    let createP3 = document.createElement('p');
    let createP4 = document.createElement('p');
    let createP5 = document.createElement('p');
    let inavailability = "Problème";

    get.appendChild(createDiv);
    if (availability.title == 1)
        inavailability = "Indisponibilité : Vacances";
    else if (availability.title == 2)
        inavailability = "Indisponibilité : Accident de travail";
    else if (availability.title == 3)
        inavailability = "Indisponibilité : Arrêt Maladie";
    createP1.textContent = user;
    createP2.textContent = inavailability
    createP3.textContent = "Notes : " + availability.note;
    createP4.textContent = "Début : " + availability.send_at.substr(0, 19).replace('T', " à ");
    createDiv.append(createP1);
    createDiv.append(createP2);
    createDiv.append(createP3);
    createDiv.append(createP4);
    if (availability.close_at != null) {
        createP5.textContent = "Fin : " + availability.close_at.substr(0, 19).replace('T', " à ");
        createDiv.append(createP5);
    }
}

/**
 * Display close inavailability end
 */
function displayCloseInavailabilityEnd() {
    let elem = document.getElementById("pop_up_inavailability_end");
    let icone = document.getElementById("change_icon");

    if (elem.classList.contains("display_none") == true) {
        elem.classList.remove("display_none");
        elem.classList.add("display_flex");
        icone.classList.remove("fa-plus");
        icone.classList.add("fa-minus");
    } else {
        elem.classList.remove("display_flex");
        elem.classList.add("display_none");
        icone.classList.remove("fa-minus");
        icone.classList.add("fa-plus");
    }
}

/**
 * Display close inavailability in progress
 */
function displayCloseInavailabilityInProgress() {
    let elem = document.getElementById("pop_up_inavailability_in_progress");
    let icone = document.getElementById("change_icon2");

    if (elem.classList.contains("display_none") == true) {
        elem.classList.remove("display_none");
        elem.classList.add("display_flex");
        icone.classList.remove("fa-plus");
        icone.classList.add("fa-minus");
    } else {
        elem.classList.remove("display_flex");
        elem.classList.add("display_none");
        icone.classList.remove("fa-minus");
        icone.classList.add("fa-plus");
    }
}

/**
 * Create div html for contract
 * @param {integer} user - Id user
 * @param {integer} contract - Id contract
 * @param {string} id - Name id balise
 */
function createDivPHtmlContract(user, contract, id) {
    let get = document.getElementById(id);
    let createDiv = document.createElement('div');
    let createP1 = document.createElement('p');
    let createP2 = document.createElement('p');
    let createP3 = document.createElement('p');
    let createP4 = document.createElement('p');
    const contrat = "Type de contrat : " + contract.title;

    get.appendChild(createDiv);
    createP1.textContent = user;
    createP2.textContent = contrat
    createP3.textContent = "Début : " + contract.start_at.substr(0, 19).replace('T', " à ");
    createDiv.append(createP1);
    createDiv.append(createP2);
    createDiv.append(createP3);
    if (contract.close_at != null) {
        createP4.textContent = "Fin : " + contract.close_at.substr(0, 19).replace('T', " à ");
        createDiv.append(createP4);
    }
}

/**
 * Display close contract end
 */
function displayCloseContractEnd() {
    let elem = document.getElementById("pop_up_contract_end");
    let icone = document.getElementById("change_icon_contract");

    if (elem.classList.contains("display_none") == true) {
        elem.classList.remove("display_none");
        elem.classList.add("display_flex");
        icone.classList.remove("fa-plus");
        icone.classList.add("fa-minus");
    } else {
        elem.classList.remove("display_flex");
        elem.classList.add("display_none");
        icone.classList.remove("fa-minus");
        icone.classList.add("fa-plus");
    }
}

/**
 * Display close contract in progress
 */
function displayCloseContractInProgress() {
    let elem = document.getElementById("pop_up_contract_in_progress");
    let icone = document.getElementById("change_icon_contract2");

    if (elem.classList.contains("display_none") == true) {
        elem.classList.remove("display_none");
        elem.classList.add("display_flex");
        icone.classList.remove("fa-plus");
        icone.classList.add("fa-minus");
    } else {
        elem.classList.remove("display_flex");
        elem.classList.add("display_none");
        icone.classList.remove("fa-minus");
        icone.classList.add("fa-plus");
    }
}
