function showPopUpPatient(e) {
    document.getElementById('pop-up-form-container-meeting').style.display = 'block';
    var oldNode = document.getElementById('pop-up-form-container-meeting').childNodes[0]
    var newNode = oldNode.cloneNode(true)
    newNode.id = e.getAttribute("waiting_id")
    oldNode.parentNode.replaceChild(newNode, oldNode);
    fetch('/api/patients?room_id=' + newNode.id).then(function (response) {
        if (response.status >= 200 && response.status < 300)
            response.json().then(function (data) {
                data.patients.forEach((patient) => {
                    const list = document.getElementsByTagName("select")[0];
                    const option = new Option(`${patient.firstname} ${patient.lastname}`, patient.id);
                    list.add(option);
                    let input = document.getElementById("add_patient");
                    input.value = '';
                    input.focus();
                })
            });
        else
            customAlert(MSG_ERROR, MSG_RETRY, WARNING);
    }).catch(function () {
        customAlert(MSG_ERROR, MSG_INTERNAL_ERROR, WARNING);
    });
}

function hidePopUpPatient() {
    document.getElementById('pop-up-form-container-meeting').style.display = 'none';
    list = document.getElementsByTagName("select")[0]
    var i = list.options.length;
    for (; i >= 0; i--) {
        list.remove(i)
    }
}

function showPopUpInfo(e) {
    const id = e.getAttribute("waiting_id");

    const container = document.getElementById('pop-up-form-container-meeting-recap');
    fetch('/api/rooms?id=' + id).then(function (response) {
        if (response.status >= 200 && response.status < 300)
            response.json().then(function (data) {

                container.style.display = 'block';
                const recap = container.children[0].children[1].children[0].children[0];
                recap.innerHTML = "";
                let elem = document.createElement("div");

                elem.innerText = "Nom de la salle";
                elem.classList.add("label");
                recap.appendChild(elem);

                let elemChild = document.createElement("div");
                elemChild.innerText = data[0].title;
                elemChild.classList.add("label");
                elem = document.createElement("div");
                elem.classList.add("table-row-em");
                elem.appendChild(elemChild);
                recap.appendChild(elem);

                elem = document.createElement("div");

                elem.innerText = "Étage";
                elem.classList.add("label");
                recap.appendChild(elem);

                elemChild = document.createElement("div");
                elemChild.innerText = data[0].floor;
                elemChild.classList.add("label");
                elem = document.createElement("div");
                elem.classList.add("table-row-em");
                elem.appendChild(elemChild);
                recap.appendChild(elem);

                elem = document.createElement("div");

                elem.innerText = "Capacité maximale";
                elem.classList.add("label");
                recap.appendChild(elem);

                elemChild = document.createElement("div");
                elemChild.innerText = data[0].capacity;
                elemChild.classList.add("label");
                elem = document.createElement("div");
                elem.classList.add("table-row-em");
                elem.appendChild(elemChild);
                recap.appendChild(elem);

            });
        else
            customAlert(MSG_ERROR, MSG_RETRY, WARNING);
    }).catch(function () {
        customAlert(MSG_ERROR, MSG_INTERNAL_ERROR, WARNING);
    });
    fetch('/api/patients?room_id=' + id).then(function (response) {
        if (response.status >= 200 && response.status < 300)
            response.json().then(function (data) {
                select = document.getElementById("listPatientInfos")
                data.patients.forEach((patient) => {
                    select.add(new Option(`${patient.firstname} ${patient.lastname}`, patient.id))
                })
            });
        else
            customAlert(MSG_ERROR, MSG_RETRY, WARNING);
    }).catch(function () {
        customAlert(MSG_ERROR, MSG_INTERNAL_ERROR, WARNING);
    });
}

function hidePopUpInfo() {
    document.getElementById('pop-up-form-container-meeting-recap').style.display = 'none';
    list = document.getElementById("listPatientInfos")
    var i = list.options.length;
    for (; i >= 0; i--) {
        list.remove(i)
    }
    console.log(list)
}

function addPatient(element) {

    const inputName = element.parentNode.getElementsByTagName("input")[0];
    if (inputName.value == '') {
        alert('Attention : Il faut remplir le champ.');
        return;
    }
    const option = new Option(inputName.value, inputName.value);
    const list = element.parentNode.getElementById("listPatient");
    list.add(option, undefined);
    if (list.length >= 10) {
        list.length = 10;
        alert('La salle est complète !');
        return;
    }
    inputName.value = '';
    inputName.focus();
}

function removePatient(element) {

    const list = element.parentNode.getElementById("listPatient");

    let selected = [];

    for (let i = 0; i < list.options.length; i++) {
        selected[i] = list.options[i].selected;
    }

    let index = list.options.length;
    while (index--) {
        if (selected[index]) {
            list.remove(index);
        }
    }
}

function isFisrtnameEmpty() {
    let str = document.forms['myForm'].firstName.value;

    if (!str.replace(/\s+/, '').length) {
        alert("Le champ Name est vide!");
        return false;
    }
}

function searchList() {
    let input, filter, ul, li, a, i, txtValue;

    input = document.getElementById('search_room');
    filter = input.value.toUpperCase();
    ul = document.getElementById("displayResult");
    li = ul.getElementsByTagName('li');

    if (input.value)
        ul.style.display = "block";
    else
        ul.style.display = "none";

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

function searchListParticipent() {
    let input, filter, ul, li, a, i, txtValue;

    input = document.getElementById('add_patient');
    filter = input.value.toUpperCase();
    ul = document.getElementById("displayPatient");
    li = ul.getElementsByTagName('li');

    if (input.value)
        ul.style.display = "block";
    else
        ul.style.display = "none";

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

function listenKeyEnter(waitingId) {
    let li = document.getElementById(waitingId);

    li.addEventListener("keyup", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            li.click();
            return true
        }
        return false
    });
}

function displayParticipantInformations(waitingStr) {
    let waiting = JSON.parse(waitingStr)
    const option = new Option(`${waiting.firstname} ${waiting.lastname}`, waiting.id);
    //const capacity = getElementById()

    const list = document.getElementById("listPatient");
    let found = false;
    for (var i = 0; i < list.length; i++) {
        if (list[i].value == waiting.id)
            found = true
    }
    if (!found && list.length < 15) {
        list.add(option);
    } else if (list.length >= 15) {
        alert('La salle est complète !');
    } else if (found) {
        alert('Ce patient est déjà dans la salle!');
    }
    let input = document.getElementById("add_patient");
    input.value = '';
    input.focus();
}


function displayInformations(waitingStr) {
    let waiting = JSON.parse(waitingStr)
    let input = document.getElementById("search_room");
    input.value = waiting.title;

    let xpath = `//div[text()='${waiting.title}']`;
    let matchingElement = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    let list = document.querySelector(".wrap-row-em");
    list.childNodes.forEach((elem) => {
        elem.style.display = "none"
    })

    matchingElement.parentNode.style.display = "flex"
}

function getInformations(waitingId) {
    const data = {
        id: waitingId,
        identity: document.getElementById("identity").value,
    };
    apiUpdate("waiting", data);
}

function checkClick() {
    /*document.onclick = function (e) {
        let divToHide = document.querySelector("#displayResult");
        let divToHidePatient = document.querySelector("#displayPatient");
        if (e.target.id !== "displayResult") {
            divToHide.style.display = 'none';
        }
        if (e.target.id !== "displayPatient") {
            divToHidePatient.style.display = 'none';
        }
    };
*/}

checkClick();

function saveInfo(element) {
    let options = document.getElementById("listPatient").options
    const elem = document.querySelector("#pop-up-form-container-meeting > .form-section")

    for (var i = 0; i < options.length; i++) {
        apiUpdate('patients', { id: options[i].value, room_id: elem.id }, (_) => { })
    }
    hidePopUpPatient();
}