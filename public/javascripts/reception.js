/**
 * Show the form pop up 
 */
function showPopUpForm() {
    document.getElementById('pop-up-form-container').style.display = 'block';
}

/**
 * Hide the form pop up
 */
function hidePopUpForm() {
    document.getElementById('pop-up-form-container').style.display = 'none';
}

/**
 * Add new patient to database
 * @param {object} element - patient object
 */
function addPatient() {

    let newPatient = {
        firstname: document.getElementById('firstname').value,
        lastname: document.getElementById('lastname').value,
        birthdate: document.getElementById('birthdate').value,
        ss_number: document.getElementById('ss_number').value,
        height: document.getElementById('height').value,
        weight: document.getElementById('weight').value,
        age: document.getElementById('age').value,
        blood_type: document.getElementById('blood_type').value,
        gender: document.getElementById('gender').value,
        allergies: document.getElementById('allergies').value,
        service_id: document.getElementById('service_id').value,
        doctor_id: document.getElementById('doctor').value
    };

    if (newPatient.firstname === "") {
        customAlert(MSG_ERROR, 'Remplir le champ prénom.', WARNING);
        return;
    } else if (newPatient.lastname === "") {
        customAlert(MSG_ERROR, 'Remplir le champ nom.', WARNING);
        return;
    } else if ( !ss_numberValid(newPatient.ss_number)) {
        customAlert(MSG_ERROR, 'Numéro de sécurité sociale incorrect.', WARNING);
        return;
    } else if (newPatient.height === "") {
        customAlert(MSG_ERROR, 'Remplir le champ taille.', WARNING);
        return;
    } else if (newPatient.weight === "") {
        customAlert(MSG_ERROR, 'Remplir le champ poids.', WARNING);
        return;
    } else if (newPatient.age === "") {
        customAlert(MSG_ERROR, 'Remplir le champ age.', WARNING);
        return;
    } else if (newPatient.blood_type === "") {
        customAlert(MSG_ERROR, 'Remplir le champ groupe sanguin.', WARNING);
        return;
    } else if (newPatient.gender === "") {
        customAlert(MSG_ERROR, 'Remplir le champ genre.', WARNING);
        return;
    } else if (newPatient.service_id === "") {
        customAlert(MSG_ERROR, 'Remplir le champ service.', WARNING);
        return;
    } else if (newPatient.doctor === "") {
        customAlert(MSG_ERROR, 'Remplir le champ docteur.', WARNING);
        return;
    }

    apiPost('patients', newPatient, function(response) {
        response.json().then(function(data) {
            window.location.reload();
        });
    });
}

/**
 * check if ss_number is correct with regex
 */
function ss_numberValid(ss_number) {
    const ss_numberregex = (/^[1-478][0-9]{2}(0[1-9]|1[0-2]|62|63)(2[ABab]|[0-9]{2})(00[1-9]|0[1-9][0-9]|[1-8][0-9]{2}|9[0-8][0-9]|990)(00[1-9]|0[1-9][0-9]|[1-9][0-9]{2})$/);

    if ((ss_number.match(ss_numberregex))) {
        return (true);
    } else {
        return (false);
    }
}


websocket.addEventListener('patient', 'new', (message) => {

    fetch('/reception/fragment?id=' + message.identifiers.id).then(function(response) {
        if (response.status >= 200 && response.status < 300)
            response.text().then(function (data) {
                const template = document.createElement('template');
                template.innerHTML = data;

                if (list.childElementCount === 0)
                    list.appendChild(template.content.childNodes[0]);
                else
                    list.insertBefore(template.content.childNodes[0], list.children[0]);
        });
    });
});

websocket.addEventListener('patient', 'update', (message) => {

    for (let i = list.childElementCount - 1; i !== -1; i--) {
        if (message.identifiers.id == list.children[i].getAttribute('patient-id')) {
            fetch('/reception/fragment?id=' + message.identifiers.id).then(function(response) {
                if (response.status >= 200 && response.status < 300)
                    response.text().then(function (data) {
                        const template = document.createElement('template');
                        template.innerHTML = data;
                        list.children[i].innerHTML = template.content.childNodes[0].innerHTML;
                    });
            });
            break;
        }
    }
});

websocket.addEventListener('patient', 'delete', (message) => {

    for (let i = list.childElementCount - 1; i !== -1; i--) {
        if (message.identifiers.id == list.children[i].getAttribute('patient-id')) {
            list.children[i].remove();
            break;
        }
    }
});