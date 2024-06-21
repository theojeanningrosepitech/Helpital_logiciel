const OK = 0;
const WARNING = 1;
const ERROR = 2;
const LOADING = 3;
const SETTING = 4;

const MSG_ERROR = 'Une erreur est survenue';
const MSG_RETRY = 'Veuillez réessayer';
const MSG_SUCCESS = 'Opération réussie';
const MSG_FAILURE = 'Échec';
const MSG_INTERNAL_ERROR = 'Le serveur a rencontré une difficulté en lien avec votre requête.';
const MSG_MALFORMED_EMAIL = 'Adresse mail incorrecte';
const MSG_MAIL_NOT_SENT = 'Le mail n\'a pas pu être envoyé.';
const MSG_MISSING_USER = 'L\'utilisateur est manquant';
const MSG_MISSING_INFORMATION = 'Informations manquantes';

let customMenuDisplayCallbacks = [];
let customMenuClickCallbacks = [];
let customMenuTarget;

window.addEventListener('load', function onLoad() {
    document.getElementById('alert-box-background').addEventListener('click', function (e) {
        if (e.target === this)
            closeAlert();
    });
    const customMenu = document.getElementById('right-click-menu');

    customMenu.addEventListener('mouseleave', () => {
        document.getElementById('right-click-menu').style.display = 'none';
    });
    customMenu.addEventListener('mousedown', customMenuClick);
});

window.oncontextmenu = function (e) {
    showCustomMenu(e);
    return false;
}

// create and display a custom alert box
function customAlert(title, desc, logLevel, customContent) {
    const alertBackground = document.getElementById('alert-box-background');
    const mainBox = alertBackground.children[0].children[0];
    const titleElem = document.createElement('h1');
    const description = document.createElement('p');

    titleElem.innerText = title;
    description.innerText = desc;

    if (alertBackground.style.display === 'block')
        closeAlert();
    mainBox.appendChild(titleElem);
    mainBox.appendChild(description);

    if (customContent)
        mainBox.innerHTML += customContent;
    alertBackground.style.display = 'block';
}

function prompt(title, fillValue, callback) {
    const alertBackground = document.getElementById('alert-box-background');
    const mainBox = alertBackground.children[0].children[0];
    const titleElem = document.createElement('h1');
    const div = document.createElement('div');
    const input = document.createElement('input');
    const button = document.createElement('button');

    titleElem.innerText = title;
    div.classList.add('prompt');
    input.placeholder = '...';
    button.innerText = 'Confirmer';

    if (fillValue)
        input.value = fillValue;

    if (alertBackground.style.display === 'block')
        closeAlert();
    mainBox.appendChild(titleElem);
    div.appendChild(input);
    div.appendChild(button);
    mainBox.appendChild(div);
    alertBackground.style.display = 'block';
    button.addEventListener('click', () => {
        callback(input.value);
    });
}

// clear and hide alert box
function closeAlert() {
    document.getElementById('alert-box-background').style.display = 'none';
    document.getElementById('alert-box').children[0].innerHTML = "";
}

function showCustomMenu(e) {
    const menu = document.getElementById('right-click-menu');

    menu.style.display = 'block';
    menu.style.left = e.clientX - 2 + 'px';
    menu.style.top = e.clientY - 2 + 'px';

    for (let i = menu.childElementCount - 1; i !== -1; i--) {
        if (menu.children[i].classList.contains('hidden'))
            menu.children[i].style.display = 'none';
    }

    for (let callback of customMenuDisplayCallbacks) {
        callback(e, menu);
    }
}

function customMenuClick(e) {
    e.stopPropagation();
    const menu = document.getElementById('right-click-menu');

    for (let i = menu.childElementCount - 1; i !== -1; i--) {
        bounds = menu.children[i].getBoundingClientRect();

        if (e.clientX > bounds.left && e.clientX < bounds.right && e.clientY > bounds.top && e.clientY < bounds.bottom) {
            switch (menu.children[i].getAttribute('type')) {
                case 'copy':
                    window.electronAPI.clipboardCopy(window.getSelection().toString());
                    menu.style.display = 'none';
                    break;
                case 'paste':
                    document.execCommand('paste');
                    menu.style.display = 'none';
                    break;
                case 'cut':
                    const selectedText = window.getSelection().toString();
                    const selection = window.getSelection();
                    window.electronAPI.clipboardCopy(selectedText);

                    // cut/delete selected text from input
                    if (selection) {
                        const focusNode = selection.focusNode;

                        if (focusNode && focusNode.getElementsByTagName) {
                            const inputs = focusNode.getElementsByTagName('input');
                            let index;

                            for (let input of inputs) {
                                index = input.value.indexOf(selectedText);

                                if (index !== -1) {
                                    input.value = input.value.substring(0, index) + input.value.substring(index + selectedText.length);
                                    break;
                                }
                            }
                        }
                    }
                    menu.style.display = 'none';
                    break;
            }
            for (let callback of customMenuClickCallbacks) {
                callback(e, menu.children[i].getAttribute('type'));
            }
            menu.style.display = 'none';
            break;
        }
    }
}

function registerCustomMenuDisplayCallback(callback) {
    customMenuDisplayCallbacks.push(callback);
}

function registerCustomMenuClickCallback(callback) {
    customMenuClickCallbacks.push(callback);
}

function apiGet(uri, successCallback, failureCallback) {

    fetch(uri, {
        method: 'GET',
    }).then(function (response) {
        if (response.status >= 200 && response.status < 300) {
            if (successCallback)
                successCallback(response);
        } else {
            customAlert(MSG_ERROR, MSG_RETRY, WARNING);

            if (failureCallback)
            failureCallback();
        }
    }).catch(function () {
        customAlert(MSG_ERROR, MSG_INTERNAL_ERROR, WARNING);
        if (failureCallback)
        failureCallback();
    });
}

function apiPost(ressource, data, successCallback, failureCallback) {
    const urlData = new URLSearchParams();

    for (const key in data) {
        urlData.append(key, data[key]);
    }

    fetch('/api/' + ressource, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        // ContentType: 'application/json',
        // Accept: 'application/json',
        credentials: 'same-origin',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: urlData
    }).then(function (response) {
        if (response.status >= 200 && response.status < 300) {
            if (successCallback)
                successCallback(response);
            } else {
                customAlert(MSG_ERROR, MSG_RETRY, WARNING);

                if (failureCallback)
                failureCallback();
            }
        }).catch(function () {
            customAlert(MSG_ERROR, MSG_INTERNAL_ERROR, WARNING);
        if (failureCallback)
        failureCallback();
    });
}

function apiUpdate(ressource, data, successCallback, failureCallback) {
    const urlData = new URLSearchParams();
    let id;

    for (const key in data) {
        if (key === 'id')
        id = data[key];
        else
        urlData.append(key, data[key]);
    }
    let query = '/api/' + ressource;

    if (id) {
        query += '?id=' + id;
    }

    fetch(query, {
        method: 'PUT',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: urlData
    }).then(function (response) {
        if (response.status >= 200 && response.status < 300) {
            if (successCallback)
                successCallback();
        } else {
            customAlert(MSG_ERROR, MSG_RETRY, WARNING);
            if (failureCallback)
                failureCallback();
        }
    }).catch(function () {
        customAlert(MSG_ERROR, MSG_INTERNAL_ERROR, WARNING);
        if (failureCallback)
            failureCallback();
    });
}

function setFile(input, successCallback) {
    const file = input.files[0];
    var fileInfo;
    var reader = new FileReader();
    reader.readAsBinaryString(file);
    reader.onload = function (progressEvent) {
        var value = reader.result;
        fileInfo = {
            file: file.path.toString(),
            filename: file.name.toString(),
            type: file.type.toString(),
            size: file.size,
            value: value
        };
        successCallback(fileInfo);
    };
}

async function registerFile(data, dir) {
    var result = await fetch(`/api/upload?dir=${dir}`, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {'Content-Type':  "application/json"},
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: JSON.stringify(data)
    });
    return JSON.parse(await result.text());
}

function apiDelete(ressource, id, successCallback, failureCallback) {
    fetch('/api/' + ressource + '?id=' + id, {
        method: 'DELETE',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        redirect: 'follow',
        referrerPolicy: 'no-referrer'
    }).then(function (response) {
        if (response.status >= 200 && response.status < 300) {
            if (successCallback)
            successCallback();
            else
            window.location.reload();
        } else {
            customAlert(MSG_ERROR, MSG_RETRY, WARNING);
            if (failureCallback)
            failureCallback(response);
        }
    }).catch(function () {
        customAlert(MSG_ERROR, MSG_INTERNAL_ERROR, WARNING);
        if (failureCallback)
        failureCallback();
    });
}

function apiDeleteCustomQuery(ressource, successCallback, failureCallback) {
    fetch('/api/' + ressource, {
        method: 'DELETE',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        redirect: 'follow',
        referrerPolicy: 'no-referrer'
    }).then(function (response) {
        if (response.status >= 200 && response.status < 300) {
            if (successCallback)
            successCallback();
            else
            window.location.reload();
        } else {
            customAlert(MSG_ERROR, MSG_RETRY, WARNING);
            if (failureCallback)
            failureCallback(response);
        }
    }).catch(function () {
        customAlert(MSG_ERROR, MSG_INTERNAL_ERROR, WARNING);
        if (failureCallback)
        failureCallback();
    });
}

let servicesReport, roomsReport;

async function report() {
    const alertBackground = document.getElementById('alert-box-background');
    let alertBox = alertBackground.children[0];
    const mainBox = alertBackground.children[0].children[0];
    const titleElem = document.createElement('h1');
    let div = document.createElement('div');

    alertBox.style.minHeight = "50vh";

    titleElem.innerText = "Signaler un objet défectueux";
    mainBox.appendChild(titleElem);

    servicesReport = await (await fetch('/api/services', {
        method: 'get'
    })).json();

    roomsReport = await (await fetch('/api/rooms', {
        method: 'get'
    })).json();


    let selectList = document.createElement("select");
    selectList.id = "services";
    div.style.margin = "25px";
    div.innerText = "Sélectionnez un service: ";
    div.appendChild(selectList);
    mainBox.appendChild(div);

    let div2 = document.createElement('div');
    let selectList2 = document.createElement("select");
    selectList2.id = "rooms";
    div2.style.margin = "25px";
    div2.innerText = "Sélectionnez une chambre: ";
    div2.appendChild(selectList2);

    let div3 = document.createElement('div');
    div3.style.margin = "25px";
    div3.innerText = "Veuillez indiquer l'objet à signaler: ";
    let input3 = document.createElement('input');
    input3.id = "item";
    div3.appendChild(input3);

    let div4 = document.createElement('div');
    div4.style.margin = "25px";
    div4.innerText = "Veuillez décrire le problème rencontré: ";
    let input4 = document.createElement('textarea');
    input4.style.width = "95%";
    input4.id = "report";
    input4.style.marginTop = "25px";
    input4.style.minHeight = "170px";
    div4.appendChild(input4);


    mainBox.appendChild(div);
    mainBox.appendChild(div2);
    mainBox.appendChild(div3);
    mainBox.appendChild(div4);

    let notEmptyServices = [];

    for (let item of servicesReport) {
        if (roomsReport.find(function (element) {
            return element.service_id === item.id;
        })) {
            notEmptyServices.push(item);
        }
    }

    for (let item of notEmptyServices) {
        let option = document.createElement("option");
        option.value = item.title;
        option.text = item.title;
        option.setAttribute('item-id', item.id);

        selectList.appendChild(option);
    }

    for (let item of roomsReport) {
        let option = document.createElement("option");
        option.value = item.title;
        option.text = item.title;
        option.setAttribute('item-id', item.id);

        if (notEmptyServices[selectList.selectedIndex].id === item.service.id)
        selectList2.appendChild(option);
    }

    selectList.addEventListener('change', (event) => {
        selectList2.innerHTML = "";
        for (let item of roomsReport) {
            let option = document.createElement("option");
            option.value = item.title;
            option.text = item.title;
            option.setAttribute('item-id', item.id);

            if (notEmptyServices[selectList.selectedIndex].id === item.service.id)
            selectList2.appendChild(option);
        }
    })

    let bDiv = document.createElement('div');
    let button = document.createElement('button');

    button.innerText = "Signaler";
    bDiv.style.textAlign = "center";
    bDiv.appendChild(button);
    mainBox.appendChild(bDiv);

    button.onclick = async function () {
        let service = document.getElementById('services').value;
        let room = document.getElementById('rooms').value;
        let item = document.getElementById('item').value;
        let report = document.getElementById('report').value;


        if (item !== "" || report !== "") {
            if (item !== "")
                input3.style.borderStyle = "none";
            if (report !== "")
            input4.style.borderStyle = "none";
        }
        if (item === "" || report === "") {
            if (item === "") {
                input3.style.borderColor = "#b52323";
                input3.style.borderStyle = "solid";
                input3.style.borderWidth = "1px";
            }
            if (report === "") {
                input4.style.borderColor = "#b52323";
                input4.style.borderStyle = "solid";
                input4.style.borderWidth = "1px";
            }
            return;
        }

        let serviceId;
        let roomId;
        for (let el of servicesReport) {
            if (el.title === service)
            serviceId = el.id;
        }
        for (let el of roomsReport) {
            if (el.title === room)
                roomId = el.id;
        }

        let toPost = {
            service: serviceId,
            room: roomId,
            item: item
        }
        await apiPost("backoffice/repair", toPost, async function (id) {
            const data = await id.json();
            await apiPost("backoffice/repair/reports", {id: data.id, message: report}, function () {
                closeAlert();
            });
        });
    }

    if (alertBackground.style.display === 'block')
        closeAlert();
    alertBackground.style.display = 'block';
}

websocket.addEventListener('service', 'new', (message) => {
    const list = document.getElementById('services');

    if (list) {
        const option = document.createElement('option');

        option.value = message.data.title;
        option.innerText = message.data.title;

        list.appendChild(option);

        servicesReport.push(message.data);
    }
});

websocket.addEventListener('service', 'update', (message) => {
    const list = document.getElementById('services');

    if (list && message.data.title) {
        for (let i = list.length - 1; i !== -1; i--) {
            if (list[i].getAttribute('item-id') == message.identifiers.id) {
                list[i].value = message.data.title;
                list[i].innerText = message.data.title;
                break;
            }
        }

        for (let i = servicesReport.length - 1; i !== -1; i--) {
            if (servicesReport[i].id == message.identifiers.id) {
                servicesReport[i].title = message.data.title;
                break;
            }
        }
    }
});

websocket.addEventListener('service', 'delete', (message) => {
    const list = document.getElementById('services');

    if (list) {
        for (let i = list.length - 1; i !== -1; i--) {
            if (list[i].getAttribute('item-id') == message.identifiers.id) {
                list[i].remove();
                break;
            }
        }

        for (let i = servicesReport.length - 1; i !== -1; i--) {
            if (servicesReport[i].id == message.identifiers.id) {
                servicesReport.splice(i, 1);
                break;
            }
        }
    }
});

websocket.addEventListener('room', 'new', (message) => {
    const list = document.getElementById('services');
    const rooms = document.getElementById('rooms');

    if (list) {
        if (list.options[list.selectedIndex].getAttribute('item-id') == message.data.service_id) {
            const option = document.createElement('option');

            option.value = message.data.title;
            option.innerText = message.data.title;

            rooms.appendChild(option);
        }
        message.data.service = { id: parseInt(message.data.service_id) };
        roomsReport.push(message.data);
        console.log(message.data);
    }
});

websocket.addEventListener('room', 'update', (message) => {
    const list = document.getElementById('rooms');

    if (list && message.data.title) {
        for (let i = list.length - 1; i !== -1; i--) {
            if (list[i].getAttribute('item-id') == message.identifiers.id) {
                list[i].value = message.data.title;
                list[i].innerText = message.data.title;
                break;
            }
        }

        for (let i = roomsReport.length - 1; i !== -1; i--) {
            if (roomsReport[i].id == message.identifiers.id) {
                roomsReport[i].title = message.data.title;
                break;
            }
        }
    }
});

websocket.addEventListener('room', 'delete', (message) => {
    const list = document.getElementById('rooms');

    if (list) {
        for (let i = list.length - 1; i !== -1; i--) {
            if (list[i].getAttribute('item-id') == message.identifiers.id) {
                list[i].remove();
                break;
            }
        }

        for (let i = roomsReport.length - 1; i !== -1; i--) {
            if (roomsReport[i].id == message.identifiers.id) {
                roomsReport.splice(i, 1);
                break;
            }
        }
    }
});

function historyBack() {
    history.back();
}

function getCookie(name) {
    return document.cookie.split('; ')
        .find(row => row.startsWith(name))
        .split('=')[1];
}

async function popNotifications(element) {
    let a = document.getElementById("popup");
    if (a !== null) {
        a.remove()
        return
    }
    let el = document.createElement('div');
    el.className = "notificationBox"
    el.id = "popup";

    let dataSet = await (await fetch('/api/notifications/' + getCookie('userId'), {
        method: 'get'
    })).json();
    let users = await (await fetch('/api/user/')).json();
    for (let i of dataSet) {
        let iData = JSON.parse(i.data)
        switch (i.event_type) {
            case 'msg':
                let text = '💌 Nouveau message de ' + users[iData.sender_id - 1].firstname + ' ' + users[iData.sender_id - 1].lastname;
                el.appendChild(createListElement(text, (event) => {
                    window.location.replace(i.path)
                    fetch('/api/notifications/' + i.id, {
                        method: 'delete'
                    })
                }))
                break;
            }
    }

    element.parentNode.appendChild(el);
}

function createListElement(display, handler) {
    let listElement = document.createElement('div');
    listElement.className = "notificationElementBox"
    listElement.onclick = handler
    listElement.innerText = display
    let dv = document.createElement('div');
    dv.innerText = "Voir le message";
    dv.className = "notificationCheckContent"
    listElement.appendChild(dv)
    return listElement
}

function search() {
    let data = document.getElementById("search-data").value
    saveValue({id: "search-data", value: data});
    let r = /\d{13}/

    console.log(data.match(r));

    if (data.match(r) !== null) {
        location.href = `${location.origin}/search?ss=${data}`
    } else {
        location.href = `${location.origin}/search?fullname=${data}`
    }
    // location.href = location.origin + "/search?data=" + data
}

function saveValue(e){
    var id = e.id;  // get the sender's id to save it .
    var val = e.value; // get the value.
    localStorage.setItem(id, val);// Every time user writing something, the localStorage's value will override .
}

//get the saved value function - return the value of "v" from localStorage.
function getSavedValue  (v){
    if (!localStorage.getItem(v)) {
        return "";// You can change this to your defualt value.
    }
    return localStorage.getItem(v);
}

function loadContent(url, elementID) {
    url = url.replaceAll('&amp;', '&');
    fetch(url).then(response => {
        if (response.status >= 200 && response.status < 300) {
            response.text().then(function(data) {
                document.getElementById(elementID).innerHTML = data;
            });
        } else
        customAlert(MSG_ERROR, MSG_INTERNAL_ERROR, WARNING);
    });
}

function getQueryParameters() {
    return new URLSearchParams(window.location.search);
}

// AUTOLOGOUT function
let temps, secondes = 0;

function resetTemps() {
    clearInterval(temps);
    secondes = 0;
    temps = setInterval(startTemps, 1000);
}

window.onload = resetTemps;
window.ontouchstart = resetTemps;
window.onclick = resetTemps;
window.onkeypress = resetTemps;
window.onmousemove = resetTemps;
window.onmousedown = resetTemps;

function startTemps() {
    secondes++;
    //Temps d'innactivité avant deconexon
    if (secondes == 600) {
        window.location.replace('/auth/logout');
    }
}

function toHHMMSS (value) {
    var sec_num = value
    var hours = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours < 10) {
        hours = "0" + hours;
    }
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    if (seconds < 10) {
        seconds = "0" + seconds;
    }
    return hours + ':' + minutes + ':' + seconds;
}