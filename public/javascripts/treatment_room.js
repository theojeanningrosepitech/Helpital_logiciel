function showPopUpPatient(e) {
    document.getElementById('pop-up-form-container-patient').style.display = 'block';
    var oldNode = document.getElementById('pop-up-form-container-patient').childNodes[0]
    var newNode = oldNode.cloneNode(true)
    newNode.id = e.getAttribute("treatment_room_id")
    oldNode.parentNode.replaceChild(newNode, oldNode);
    fetch('/api/treatment_room?id=' + newNode.id).then(function (response) {
        if (response.status >= 200 && response.status < 300)
            response.json().then(function (data) {
                console.log(data)
                if (data[0].patient_id != null) {
                    patient_id = data[0].patient_id
                    fetch(`/api/patients?id=${patient_id}`).then(function (response) {
                        response.json().then(function (patient_data) {
                            patient = patient_data.all_patients[0]
                            select = document.getElementById("listPatient")
                            select.options.add(new Option(`${patient.firstname} ${patient.lastname}`, patient_id))
                        })
                    })
                }
            });
        else
            customAlert(MSG_ERROR, MSG_RETRY, WARNING);
    }).catch(function () {
        customAlert(MSG_ERROR, MSG_INTERNAL_ERROR, WARNING);
    });
}

function hidePopUpPatient() {
    list = document.getElementById("listPatient").options
    if (list.length != 0)
        list.remove(0)
    document.getElementById('pop-up-form-container-patient').style.display = 'none';
}

function searchListPatient() {
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

function displayPatientInformations(treatmentStr) {
    let treatment_room = JSON.parse(treatmentStr)
    const option = new Option(`${treatment_room.firstname} ${treatment_room.lastname}`, treatment_room.id);

    const list = document.getElementById("listPatient");
    let found = false;
    for (var i = 0; i < list.length; i++) {
        if (list[i].value == treatment_room.id)
            found = true
    }
    if (!found && list.length < 1) {
        list.add(option);
    } else if (list.length >= 1) {
        alert('Le lit est complète !');
    } else if (found) {
        alert('Ce patient occupe ce lit!');
    }
    let input = document.getElementById("add_patient");
    input.value = '';
    input.focus();
}

function checkClick() {
    document.onclick = function (e) {
        let divToHide = document.querySelector("#displayPatient");
        if (e.target.id !== "displayPatient") {
            divToHide.style.display = 'none';
        }
    };
}

checkClick();

function saveInfo(element) {
    let options = document.getElementById("listPatient").options
    const id = document.getElementsByClassName("form-section")[0].id;
    for (var i = 0; i < options.length; i++) {
        apiUpdate('treatment_room', { patient_id: options[i].value, id: id }, (_) => { })
    }
}
