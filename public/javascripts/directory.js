/**
 * New conversation click on user
 * @param {integer} my_id - Id my user
 * @param {integer} user_id - Id user
 */
 function newConversationClickOnUser(my_id, user_id) {
    let values = [user_id, my_id];

    const newConv = {
        user_id: values.toString(),
        title: "Pas de nom",
        group_conv: 0,
    };
    apiPost('conversations/conversation', newConv, function(response) {
        response.json().then(function(data) {
            window.location.href = '/conversation?id_conv=' + data.id;
        });
    });
}

// showContactViewer(contact)
// Params:
//      Object contact
// Show the contact viewer 
function showContactViewer(contact, id) {
    const contactViewer = document.getElementById("contact-viewer");
    const informations = document.querySelector(".informations");
    const buttonSendMessage = document.querySelector(".options > button");
    const href = "/conversation?user_two=" + contact.contact_user_id;

    console.log("/conversation?user_two=" + contact.contact_user_id);
    buttonSendMessage.setAttribute("onclick", "newConversationClickOnUser(" + id + "," + contact.contact_user_id + ")");

    if (informations.firstChild)
        var children = informations.firstChild;

    if (contactViewer.style.display == "none" || getComputedStyle(contactViewer, null).display == "none" || !informations.firstChild)
        contactViewer.style.display = "flex";
    else if (informations.firstChild && children.innerText == contact.name)
        contactViewer.style.display = "none";
    else
        contactViewer.style.display = "flex";

    var h1 = document.createElement("h1");
    var span = document.createElement("span");

    informations.innerHTML = "";
    h1.innerText = contact.name;
    span.innerText = contact.service;

    informations.appendChild(h1);
    informations.appendChild(span);
}

// addContact()
// Params:
//      Object users
// Add a contact to the directory
function addContact(users) {
    var allUsers = users;
    const contactToAdd = document.getElementById("user_id").value;

    for (user in allUsers) {
        if (contactToAdd == allUsers[user].firstname + " " + allUsers[user].lastname) {
            const data = {
                user_id: allUsers[user].id,
            };
            apiPost('contacts', data, function() {
                window.location.reload();
            });
        }
    }
}

// Verifie si tous les input sont bien remplis pour envoyer le form dans la db.
function addRow() {

    const data = {
        firstname: document.getElementById('firstname').value,
        lastname: document.getElementById('lastname').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value
    };

    if (data.firstname === "")
        customAlert(MSG_ERROR, 'Remplir le champ prénom.', WARNING);
    else if (data.lastname === "")
        customAlert(MSG_ERROR, 'Remplir le champ nom.', WARNING);
    else if ( !phoneValid(data.phone))
        customAlert(MSG_ERROR, 'Numéro de téléphone incorrect.', WARNING);
    else
        return
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

// Supprime une ligne du tableau.
function deleteRow(obj) {

    var index = obj.parentNode.parentNode.rowIndex;
    var table = document.getElementById("myTableData");
    table.deleteRow(index);
}

// Permet de modifier les élements présent dans le tableau.
function editElement(e) {
    const data = {
        id: this.parentNode.parentNode.getAttribute('contact-id'),
        name : this.value
    };

    apiUpdate('contacts/name', data);
}

// Affiche le numéros de telephone si il est masquer
function showPhone(id) {

    document.getElementById("phone-"+id).type = document.getElementById("phone-"+id).type == 'password' ? 'text' : 'password';

}

// Vérifie si le numéros de téléphone entrer est correcte avec une regex
function phoneValid(phone) {
    const phoneregex = ( /^((\+|00)33\s?|0)[67](\s?\d{2}){4}$/);

    if ((phone.match(phoneregex))) {
        return (true);
    } else {
        return (false);
    }
}

function initDirectoryList() {
    const inputs = document.getElementById('table').getElementsByTagName('input');

    for (let i = 0; i !== inputs.length; i++)
        inputs[i].addEventListener('change', editElement);

    document.getElementById('search').addEventListener('keyup', searchUsers);
    const userID = document.getElementById('section2').getAttribute('user-id');
    const list = document.getElementById('table').children[0].children[0];

    websocket.addEventListener('contact', 'new', (message) => {
        if (message.identifiers.userID == userID) {
            fetch('/directory/fragment?id=' + message.identifiers.id).then(function (response) {
                if (response.status >= 200 && response.status < 300)
                    response.text().then(function (data) {
                        const template = document.createElement('template');
                        template.innerHTML = data;

                        if (list.childElementCount !== 1)
                            list.insertBefore(template.content.childNodes[0], list.children[1]);
                        else
                            list.appendChild(template.content.childNodes[0]);
                    })
            });
        }
    });

    websocket.addEventListener('contact', 'update', (message) => {
        if (message.identifiers.userID == userID) {
            for (let i = 1; i !== list.childElementCount; i++) {
                if (list.children[i].getAttribute('item-id') == message.identifiers.id) {
                    if (message.data.name !== undefined)
                        list.children[i].getElementsByTagName('input')[0].value = message.data.name;
                    break;
                }
            }
        }
    });

    websocket.addEventListener('contact', 'delete', (message) => {
        if (message.identifiers.userID == userID) {
            for (let i = 1; i !== list.childElementCount; i++) {
                if (list.children[i].getAttribute('item-id') == message.identifiers.id) {
                    list.children[i].remove();
                    break;
                }
            }
        }
    });

    websocket.addEventListener('user', 'update', (message) => {
        for (let i = 1; i !== list.childElementCount; i++) {
            if (list.children[i].getAttribute('contact-id') == message.identifiers.id) {
                if (message.data.email !== undefined) {
                    for (let j = 0; j !== list.children[i].childElementCount; j++)
                        if (list.children[i].children[j].getAttribute('name') === 'email') {
                            list.children[i].children[j].innerText = message.data.email;
                            break;
                        }
                }
                if (message.data.phone !== undefined) {
                    for (let j = 0; j !== list.children[i].childElementCount; j++)
                        if (list.children[i].children[j].getAttribute('name') === 'phone') {
                            list.children[i].children[j].innerText = message.data.phone;
                            break;
                        }
                    for (let j = 0; j !== list.children[i].childElementCount; j++)
                        if (list.children[i].children[j].getAttribute('name') === 'call') {
                            list.children[i].children[j].children[0].href = 'tel:' + message.data.phone;
                            break;
                        }
                }

                if (message.data.service !== undefined) {
                    for (let j = 0; j !== list.children[i].childElementCount; j++)
                        if (list.children[i].children[j].getAttribute('name') === 'service') {
                            apiGet('/api/services?id=' + message.data.service, function(response) {
                                response.json().then(function (data) {
                                    list.children[i].children[j].innerText = data.title;
                                });
                            });
                            break;
                        }
                }
                break;
            }
        }
    });
}

function searchUsers(e) {
    apiGet('/api/users?contacts=true&search=' + this.value, function(response) {
        response.json().then(function (data) {
            const list = document.getElementById('displayResult');

            list.innerHTML = '';
            list.style.display = 'block';

            for (const user of data) {
                const li = document.createElement('li');

                li.innerText = user.firstname + ' ' + user.lastname;
                li.setAttribute('user-id', user.id);
                list.appendChild(li);
                li.addEventListener('click', addUserToContacts);
            }
        });
    });
}

function addUserToContacts(e) {
    const data = {
        user_id: this.getAttribute('user-id'),
    };

    apiPost('contacts', data, function() {
        window.location.reload();
    });
}

function newFavUser(contact_id) {
     const newFav = {
         id: contact_id,
         fav: 1,
     }
     apiUpdate('contacts/fav', newFav, function () {
         window.location.reload();
     });
}

function delFavUser(contact_id) {
    const newFav = {
        id: contact_id,
        fav: 0,
    }
    apiUpdate('contacts/fav', newFav, function () {
        window.location.reload();
    });
}

/**
 * Search name
 */
function searchNameContact() {
    let inputMsg = document.getElementById("search_contact").value;
    let block = document.getElementsByClassName("block_name_contact");
    let name = document.getElementsByClassName("get_contact");

    for (let i = 0; name[i]; i++) {
        if (!name[i].innerHTML.toLowerCase().includes(inputMsg.toLowerCase()))
            block[i].classList.add("display_none");
        else
            block[i].classList.remove("display_none");
    }
}