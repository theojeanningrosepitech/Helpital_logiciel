/**
 * @module patients
 */

/**
 * Edit a patient
 * @param {object} element - patient object
 */
 function editPatient(patientId) {
    let patient = {
        id: patientId,
        // doctor_id: "21",
        // service_id: "1",
        // visit_number: "26353",
        // is_hospitalized: true,
        blood_type: document.getElementById('input-bloodtype').value,
        // gender: document.getElementById('input-gender').value,
        age: document.getElementById('input-age').value,
        imc: document.getElementById('input-IMC').value,
        height: document.getElementById('input-height').value,
        weight: document.getElementById('input-weight').value,
        birthdate: document.getElementById('input-birthDate').value,
        room_id: document.getElementById('input-roomId').value,
        allergies: document.getElementById('input-allergies').value
    };
    
    // console.log(patient);

    apiUpdate('patients', patient, function(response) {
        window.location.reload();
    });
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

    apiPost('patients', newPatient, function(response) {
        response.json().then(function(data) {
            window.location.reload();
        });
    });
}

/**
 * Display the notes and prescriptions of the patient
 * @param {string} ssNumber - Social security number of the patient
 * @param {array} notes - Notes array
 * @param {array} prescriptions - Prescriptions array
 */
async function displayNotesAndPrescriptions(ssNumber, notes, prescriptions)  {
    let notesSummary = document.querySelector(".notes > div > .summary-content");
    notesSummary.innerHTML = "";
    let prescriptionsSummary = document.querySelector(".prescriptions > div > .summary-content");
    prescriptionsSummary.innerHTML = "";
    let inputNote = document.querySelector("#n_attached_to");
    let inputNoteAdd = document.querySelector("#n_attached_to_add");
    let inputPrescri = document.querySelector("#p_attached_to");

    inputNote.value = ssNumber;
    inputNoteAdd.value = ssNumber;
    inputPrescri.value = ssNumber;

    for (const note in notes) {
        if (notes[note].ss_number == ssNumber) {
            await apiGet('/api/users?id=' + notes[note].creator_id, function(response) {
                response.json().then(function (data) {
                    let span = document.createElement("span");
                    span.id = "date";
                    let li = document.createElement("li");
                    li.id = "item";
                    let creatorFirstname = data[0].firstname;
                    let creatorLastname = data[0].lastname;
                    if (notes[note].priority === 2) {
                        li.style.backgroundColor = "#44cf60";
                        li.style.color = "#FFFFFF";


                    } else if (notes[note].priority === 3) {
                        li.style.backgroundColor = "#ffb637";
                        li.style.color = "#FFFFFF";


                    } else if (notes[note].priority === 4) {
                        li.style.backgroundColor = "#ec3a3a";
                        li.style.color = "#FFFFFF";

                    }

                    span.innerText = creatorFirstname + " " + creatorLastname;
                    li.innerText = notes[note].content;
                    li.addEventListener('click', function () {
                        let noteId = document.querySelector(".note-informations > div > div > .note-id");
                        noteId.innerText = "#" + notes[note].id;

                        let noteContent = document.querySelector(".note-informations > div > div > div > div > #n_content");
                        noteContent.innerText = notes[note].content;

                        showPopUpNoteInformations();
                    });
                    notesSummary.appendChild(span);
                    notesSummary.appendChild(li);
                });
            });
        }
    }
    for (const prescription in prescriptions) {
        if (prescriptions[prescription].p_attached_to == ssNumber) {
            let span = document.createElement("span");
            span.id = "date";
            let li = document.createElement("li");
            li.id = "item";

            let creatorFullName = prescriptions[prescription].p_creator.split(".");
            let creatorFirstname = creatorFullName[0].charAt(0).toUpperCase() + creatorFullName[0].slice(1);
            let creatorLastname = creatorFullName[1].charAt(0).toUpperCase() + creatorFullName[1].slice(1);

            span.innerText = creatorFirstname + " " + creatorLastname;
            li.innerText = prescriptions[prescription].p_content;

            prescriptionsSummary.appendChild(span);
            prescriptionsSummary.appendChild(li);
        }
    }
}

/**
 * Open a File from your computer
 * @param {object} element - Note object
 */
var fileInfo;

function openFilePatient() {
    let input = document.getElementById("file_name");

    setFile(input, function(data) {
        fileInfo = data;
    });
}

/**
 * Add a file to the database
 * @param {object} element - Note object
 */
async function addFile() {
    let patient_id = document.getElementById("id-buffer").innerText;

    var data = {
        patient_id: patient_id,
        filename: null,
        content: null,
        size: null,
        type: null,
    }
    if (fileInfo != null) {
        let result = await registerFile(fileInfo, `patients/${patient_id}`);
        data.content = result.url;
        data.filename = result.name;
        data.size = fileInfo.size;
        data.type = fileInfo.type.split('/')[1];
    }
    apiPost('patient_files', data, function(response) {
        response.json().then(function(data) {
            window.location.reload();
        });
    });
}

/**
 * Edit a note
 * @param {object} element - Note object
 */
 function editNote() {
    let noteId = document.querySelector(".note-informations > div > div > .note-id").innerText.slice(1);

    let patient_id = document.getElementById("id-buffer").innerText;
    let priotity = document.getElementById("n_priority").value;
    let priotity_list = document.getElementById("n_priority").list.options;
    let res_priority;
    for (let i = 0; i < priotity_list.length ; i++) {
        if (priotity === priotity_list[i].innerText) {
            res_priority = i + 1;
            break;
        }
    }

    let newNote = {
        id: noteId,
        creator_id: document.getElementById('n_creator').value,
        ss_number: document.getElementById('n_attached_to').value,
        content: document.getElementById('n_content').outerText,
        priority: res_priority,
        patient_id: patient_id
    };

    apiUpdate('note', newNote, function() {
            window.location.reload();
    });
}

/**
 * Add a note to the database
 * @param {object} element - Note object
 */
 function addNote() {
    let patient_id = document.getElementById("id-buffer").innerText;
    let priotity = document.getElementById("n_priority_add").value;
    let priotity_list = document.getElementById("n_priority_add").list.options;

    let res_priority;
    for (let i = 0; i < priotity_list.length ; i++) {
        if (priotity === priotity_list[i].innerText) {
            res_priority = i + 1;
            break;
        }
    }
    let noteContent = document.querySelector(".add-note-form > div > div > div > div > #n_content > div").innerHTML;
    let notes = {
        creator_id: document.getElementById('n_creator_add').value,
        ss_number: document.getElementById('n_attached_to_add').value,
        content: noteContent,
        priority: res_priority,
        patient_id: patient_id
    };
    apiPost('note', notes, function(response) {
        response.json().then(function(data) {
            window.location.reload();
        });
    });
}

/**
 * Set Patient To Favoris
 * @param {object} element - Set Favoris Patient
 */
function setFavoris(patient, userId) {

    let star = document.getElementById('star').value;
    let data = {
        patient_id: patient.id
    };
    apiPost(`patients/favoris?user_id=${userId}&patient_id=${patient.id}`,data, function(response) {
        response.json().then(function(data) {
            window.location.reload();
        });
    });
}

async function removeFromAllFavoris(id, patient_id) {

    await apiDelete(`patients/favoris`, id);
    window.location.reload();
    /* websocket.addEventListener('patients/favoris', 'delete', (message) => {
         console.log("message");
         console.log(message);
     });*/

}

function displayNewListMyPatients(){
    let patiensList = document.getElementById("input-list-my-patients").value.split(',');
    let block = document.getElementsByClassName("MyPatients");
    let id_all = document.getElementsByClassName("getIdMyPatients");

    for (let i = 0; block[i]; i++) {
        if (id_all[i].innerHTML === patiensList[1])
            block[i].style.display = "table-row";
        else if (id_all[i].innerHTML !== patiensList[1])
            block[i].style.display = "none";
    }
}

function displayNewListFavoris(){
    let patiensList = document.getElementById("input-list-favoris-patient").value.split(',');
    let block = document.getElementsByClassName("bluefav");
    let id_all = document.getElementsByClassName("getIdFav");

    for (let i = 0; block[i]; i++) {
        if (id_all[i].innerHTML === patiensList[1])
            block[i].style.display = "table-row";
        else if (id_all[i].innerHTML !== patiensList[1])
            block[i].style.display = "none";
    }
}

function displayNewList(){
    let patiensList = document.getElementById("input-list-all-patient").value.split(',');
    let block = document.getElementsByClassName("blueAll");
    let id_all = document.getElementsByClassName("getIdAll");

    for (let i = 0; block[i]; i++) {
        if (id_all[i].innerHTML === patiensList[1])
            block[i].style.display = "table-row";
        else if (id_all[i].innerHTML !== patiensList[1])
            block[i].style.display = "none";
    }
}

async function removeFavoris(id, patient_id) {
    let block = document.getElementsByClassName("bluefav");
    let id_fav = document.getElementsByClassName("getIdFav");

    for (let i = 0; block[i]; i++) {
        if (id_fav[i].innerHTML == patient_id) {
            block[i].style.display = "none";
        }
    }

    await apiDelete(`patients/favoris`, id);
    
    //window.location.reload();
    /* websocket.addEventListener('patients/favoris', 'delete', (message) => {
         console.log("message");
         console.log(message);
     });*/
}

/**
 * Add a prescription to the database
 * @param {object} element - Prescription object
 */
 function addPrescription() {
    let ordonnance = {
        p_creator: document.getElementById('p_creator').value,
        p_attached_to: document.getElementById('p_attached_to').value,
        p_content: document.getElementById('p_content').outerText
    };

    apiPost('prescription', ordonnance, function(response) {
        response.json().then(function(data) {
            window.location.reload();
        });
    });
}

// patientFiles()
//
// Display patient files
function patientFiles() {
    const filesLi = document.getElementById("files-li");
    const archivesLi = document.getElementById("archives-li");

    filesLi.classList.add("active");
    archivesLi.classList.remove("active");

    document.getElementById("overlay").style.display = "block";
    document.getElementById("underlay").style.display = "none";
}

function patientFilesALL(patients) {
    const pdfLi = document.getElementById("pdf-li");
    const allLi = document.getElementById("all-li");
    const jpegLi = document.getElementById("png-li");
    const pngLi = document.getElementById("jpeg-li");
    const filesContainer = document.getElementById("overlay");
    const patient_id = document.getElementById("id-buffer").innerText;
    var patient;

    pdfLi.classList.remove("active");
    allLi.classList.add("active");
    jpegLi.classList.remove("active");
    pngLi.classList.remove("active");

    for (var i = 0; i < patients.length; i++ ) {
        // console.log(patients[i].id);
        // console.log(patient_id);
        if (patients[i].id.toString()  === patient_id) {
            // console.log(patients[i].firstname);
            patient = patients[i];
            break;
        }
    }
    filesContainer.innerHTML = '';

    for (const file of patient.files) {
            span = document.createElement('span');
            li = document.createElement('li');
            span.innerText = file.type;

            li.addEventListener('click', function() {
                let blockImg = document.getElementById("img_dialog");
                if (file.type.includes('pdf')) {
                    const value = document.createElement("embed");
                    value.src = file.content;
                    value.alt = file.content;
                    value.id = 'temporary_img';
                    value.className = 'dialog_img_width';
                    blockImg.appendChild(value);
                } else{
                    const img = document.createElement("img");
                    img.src = file.content;
                    img.alt = file.content;
                    img.id = 'temporary_img';
                    img.className = 'dialog_img_width';
                    blockImg.appendChild(img);
                }
                document.getElementById('dialog_display').style.display = 'block';

            });
            li.innerText = file.filename;

            filesContainer.appendChild(span);
            filesContainer.appendChild(li);

    }
    document.getElementById("overlay").style.display = "block";
}

function patientFilesJPEG(patients) {
    const allLi = document.getElementById("all-li");
    const pdfLi = document.getElementById("pdf-li");
    const pngLi = document.getElementById("png-li");
    const jpegLi = document.getElementById("jpeg-li");

    allLi.classList.remove("active");
    pdfLi.classList.remove("active");
    jpegLi.classList.add("active");
    pngLi.classList.remove("active");

    setListFile('jpeg', patients);
    document.getElementById("overlay").style.display = "block";
}

function patientFilesPNG(patients) {
    const allLi = document.getElementById("all-li");
    const pdfLi = document.getElementById("pdf-li");
    const pngLi = document.getElementById("png-li");
    const jpegLi = document.getElementById("jpeg-li");

    allLi.classList.remove("active");
    pdfLi.classList.remove("active");
    jpegLi.classList.remove("active");
    pngLi.classList.add("active");
    setListFile('png', patients);
    document.getElementById("overlay").style.display = "block";
}

function patientFilesPDF(patients) {
    const allLi = document.getElementById("all-li");
    const pdfLi = document.getElementById("pdf-li");
    const jpegLi = document.getElementById("png-li");
    const pngLi = document.getElementById("jpeg-li");

    allLi.classList.remove("active");
    pdfLi.classList.add("active");
    jpegLi.classList.remove("active");
    pngLi.classList.remove("active");

    setListFile('pdf', patients);
    document.getElementById("overlay").style.display = "block";
}

function setListFile(_type, patients) {
    const filesContainer = document.getElementById("overlay");
    const patient_id = document.getElementById("id-buffer").innerText;
    var patient;

    for (var i = 0; i < patients.length; i++ ) {
        if (patients[i].id.toString()  === patient_id) {
            patient = patients[i];
            break;
        }
    }
    filesContainer.innerHTML = '';

    for (const file of patient.files) {
        if (file.type.toLowerCase() === _type) {

            span = document.createElement('span');
            li = document.createElement('li');
            span.innerText = file.type;

            li.addEventListener('click', function() {
                let blockImg = document.getElementById("img_dialog");
                if (file.type.includes('pdf')) {
                    const value = document.createElement("embed");
                    value.src = file.content;
                    value.alt = file.content;
                    value.id = 'temporary_img';
                    value.className = 'dialog_img_width';
                    blockImg.appendChild(value);
                } else{
                    const img = document.createElement("img");
                    img.src = file.content;
                    img.alt = file.content;
                    img.id = 'temporary_img';
                    img.className = 'dialog_img_width';
                    blockImg.appendChild(img);
                }
                document.getElementById('dialog_display').style.display = 'block';

            });
            li.innerText = file.filename;

            filesContainer.appendChild(span);
            filesContainer.appendChild(li);
        }
    }
}
function hidePopUp() {
    let blockImg = document.getElementById("img_dialog");
    const img = document.getElementById("temporary_img");
    blockImg.removeChild(img)

    document.getElementById('dialog_display').style.display = 'none';
}


// patientArchives()
//
// Display patient archives
function patientArchives() {
    const filesLi = document.getElementById("files-li");
    const archivesLi = document.getElementById("archives-li");

    filesLi.classList.remove("active");
    archivesLi.classList.add("active");

    document.getElementById("overlay").style.display = "none";
    document.getElementById("underlay").style.display = "block";
}

function displayAllPatientContent() {
    window.location.reload();
}

function displayMyPatients() {
    document.getElementById("input-list-all-patient").style.display = "none";
    document.getElementById("input-list-my-patients").style.display = "block";
    document.getElementById("input-list-favoris-patient").style.display = "none";
    document.getElementById("list-all-patient").style.display = "none";
    document.getElementById("list-my-patients").style.display = "contents";
    document.getElementById("list-favoris-patient").style.display = "none";
}

function displayFavPatient() {
    document.getElementById("input-list-all-patient").style.display = "none";
    document.getElementById("input-list-my-patients").style.display = "none";
    document.getElementById("input-list-favoris-patient").style.display = "block";
    document.getElementById("list-all-patient").style.display = "none";
    document.getElementById("list-my-patients").style.display = "none";
    document.getElementById("list-favoris-patient").style.display = "contents";
}

// showPatientViewer(patient)
// Params:
//      Object patient
// Show the patient viewer

function showPatientViewer(patient, notes, prescriptions, files, archives, patient_id, services, users) {
     if (patient_id != -1) {
        patient = JSON.parse(patient.replace(/&quot;/g,'"'));
        notes = JSON.parse(notes.replace(/&quot;/g,'"'));
        prescriptions = JSON.parse(prescriptions.replace(/&quot;/g,'"'));
        files = JSON.parse(files.replace(/&quot;/g,'"'));
        archives = JSON.parse(archives.replace(/&quot;/g,'"'));
        //users = JSON.parse(users.replace(/&quot;/g,'"'));
        //services = JSON.parse(services.replace(/&quot;/g,'"'));
    }

    if (window.location.search != "?patientId=" + patient.id)
        window.history.replaceState( {patient}, window.location.href + "?patientId=" + patient.id);

    const patientViewer = document.getElementById("capsule-viewer");
    const informations = document.querySelector(".informations");
    let children;

    if (informations.childElementCount !== 0)
        children = informations.children[0];

    if (patientViewer.style.display == "none" || getComputedStyle(patientViewer, null).display == "none" || !informations.firstChild)
        patientViewer.style.display = "flex";
    else if (informations.firstChild && children && children.innerText == patient.firstname + " " + patient.lastname)
        patientViewer.style.display = "none";
    else
        patientViewer.style.display = "flex";

    let h1 = document.createElement("h1");
    let span = document.createElement("span");
    let span2 = document.getElementById("id-buffer")
    span2.innerText = patient.id
    informations.innerHTML = "";
    h1.innerText = patient.firstname + " " + patient.lastname;
    span.innerText = "Patient";

    informations.appendChild(h1);
    informations.appendChild(span);

    const inputAllergies = document.getElementById("input-allergies");
    const inputBloodType = document.getElementById("input-bloodtype");
    const inputGender = document.getElementById("input-gender");
    const inputAge = document.getElementById("input-age");
    const inputIMC = document.getElementById("input-IMC");
    const inputHeight = document.getElementById("input-height");
    const inputWeight = document.getElementById("input-weight");
    const inputBirthDate = document.getElementById("input-birthDate");
    const inputRoomId = document.getElementById("input-roomId");
    const inputDoctor = document.getElementById("input-doctor");
    const inputServiceId = document.getElementById("input-serviceId");
    const buttonUpdate = document.getElementById("button-update-patient");

    inputAllergies.value = patient.allergies;
    inputBloodType.value = patient.blood_type;
    inputGender.value = patient.gender === 'M' ? 'Homme' : patient.gender === 'F' ? 'Femme' : patient.gender;
    inputAge.value = patient.age;
    inputIMC.value = patient.imc;
    inputHeight.value = patient.height;
    inputWeight.value = patient.weight;
    inputBirthDate.value = patient.birthdate.slice(0, 10).split("-").reverse().join("/");
    inputRoomId.value = patient.room_id;

    for (const user in users) {
        if (users[user].id == patient.doctor_id)
            inputDoctor.value = users[user].title;
    }

    for (const service in services) {
        if (services[service].id == patient.service_id)
            inputServiceId.value = services[service].title;
    }

    buttonUpdate.onclick = function() {
        editPatient(patient.id);
    }

    const capsuleVitalConstants = document.getElementById("capsule-vital-constants");

    if (patient.is_hospitalized == true)
        capsuleVitalConstants.style.display = "none";
    else
        capsuleVitalConstants.style.display = "flex";

    displayNotesAndPrescriptions(patient.ss_number, notes, prescriptions);

    // Display files
    const filesContainer = document.getElementById('overlay');
    const archivesContainer = document.getElementById('underlay');
    let li;

    filesContainer.innerHTML = '';
    archivesContainer.innerHTML = '';

    for (const file of patient.files) {
        span = document.createElement('span');
        li = document.createElement('li');
        span.innerText = file.type;

        li.addEventListener('click', function() {
            let blockImg = document.getElementById("img_dialog");
            if (file.type.includes('pdf')) {
                const value = document.createElement("embed");
                value.src = file.content;
                value.alt = file.content;
                value.id = 'temporary_img';
                value.className = 'dialog_img_width';
                blockImg.appendChild(value);
            } else{
                const img = document.createElement("img");
                img.src = file.content;
                img.alt = file.content;
                img.id = 'temporary_img';
                img.className = 'dialog_img_width';
                blockImg.appendChild(img);
            }
            document.getElementById('dialog_display').style.display = 'block';

        });
        li.innerText = file.filename;

        filesContainer.appendChild(span);
        filesContainer.appendChild(li);
    }

    for (const file of patient.cloud_files) {
        span = document.createElement('span');
        li = document.createElement('li');
        span.innerText = file.extension.toUpperCase();
        li.innerText = file.display_name;
        filesContainer.appendChild(span);
        filesContainer.appendChild(li);
    }

    for (const file of patient.archives) {
        span = document.createElement('span');
        li = document.createElement('li');
        span.innerText = file.type;
        li.innerText = file.filename;
        archivesContainer.appendChild(span);
        archivesContainer.appendChild(li);
    }
}

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
 * Hide the files pop up
 */
function hidePopUpFiles() {
    document.getElementById('pop-up-files-container').style.display = 'none';
}

/**
 * Hide the notes pop up
 */
function hidePopUpNotes() {
    document.getElementById('pop-up-notes-container').style.display = 'none';
}

/**
 * Hide the prescriptions pop up
 */
function hidePopUpPrescriptions() {
    document.getElementById('pop-up-prescriptions-container').style.display = 'none';
}

/*function addFile(element) {
    let newFile = {
        patient_id: document.getElementById('patientId').value,
        title: document.getElementById('filename').value,
        type: document.getElementById('type').value,
        content: document.getElementById('content').value,
    };

    if (newFile.title === '') {
        customAlert(MSG_ERROR, 'Vous devez renseigner un titre', WARNING);
        return;
    } else if (newFile.type === '') {
        customAlert(MSG_ERROR, 'Vous devez renseigner un type', WARNING);
        return;
    } else if (newFile.content === '') {
        customAlert(MSG_ERROR, 'Vous devez renseigner un contenu', WARNING);
        return;
    }

    apiPost('patient_files', newFile, function(response) {
        response.json().then(function(data) {
            window.location.reload();
        });
    });
}*/

/**
 * Update a note
 */
function updateNote() {
    oldId = document.querySelector("#pop-up-notes-container > div > div.notes-content > span#id").innerText;
    newId = oldId.substring(1);

    content = document.querySelector("#pop-up-notes-container > div > div.notes-content > textarea").value;


    const data = {
        id: newId,
        content: content,
    };

    apiUpdate('note', data);
}

/**
 * Display the content of a note
 * @param {string} author - Name of the author
 * @param {string} id - Id of the note
 * @param {string} date - Creation date of the note
 * @param {string} content - Content of the note
 */
function displayContentNotes(author, id, date, content) {
    popUp = document.getElementById('pop-up-notes-container');
    popUp.style.display = 'block';

    document.querySelector("#pop-up-notes-container > div > div.notes-header > h2").innerText = "Note de " + author;
    document.querySelector("#pop-up-notes-container > div > div.notes-content > span#id").innerText = "#" + id;
    document.querySelector("#pop-up-notes-container > div > div.notes-content > span#date").innerText = date + " ";
    document.querySelector("#pop-up-notes-container > div > div.notes-content > textarea").innerText = content;
    document.querySelector("#pop-up-notes-container > div > div.notes-content > textarea").placeholder = content;
}

/**
 * Update a prescription
 */
function updatePrescription() {
    oldId = document.querySelector("#pop-up-prescriptions-container > div > div.prescriptions-content > span#id").innerText;
    newId = oldId.substring(1);

    content = document.querySelector("#pop-up-prescriptions-container > div > div.prescriptions-content > textarea").value;

    const data = {
        id: newId,
        p_content: content,
    };

    apiUpdate('prescription', data);
}

/**
 * Display the content of a prescription
 * @param {string} author - Name of the author
 * @param {string} id - Id of the prescription
 * @param {string} date - Creation date of the prescription
 * @param {string} content - Content of the prescription
 */
function displayContentPrescriptions(author, id, date, content) {
    popUp = document.getElementById('pop-up-prescriptions-container');

    popUp.style.display = 'block';

    document.querySelector("#pop-up-prescriptions-container > div > div.prescriptions-header > h2").innerText = "Prescription de " + author;
    document.querySelector("#pop-up-prescriptions-container > div > div.prescriptions-content > span#id").innerText = "#" + id;
    document.querySelector("#pop-up-prescriptions-container > div > div.prescriptions-content > span#date").innerText = date + " ";
    document.querySelector("#pop-up-prescriptions-container > div > div.prescriptions-content > textarea").innerText = content;
    document.querySelector("#pop-up-prescriptions-container > div > div.prescriptions-content > textarea").placeholder = content;
}

/**
 * Display the content of a file
 * @param {string} filename - Name of the file
 * @param {string} type - Type of the file
 * @param {string} content - Content of the file
 */
function displayContentFiles(filename, type, content) {
    popUp = document.getElementById('pop-up-files-container');

    popUp.style.display = 'block';

    document.querySelector("#pop-up-files-container > div > div.files-header > h2").innerText = filename;
    document.querySelector("#pop-up-files-container > div > div.files-content > span").innerText = type;
    document.querySelector("#pop-up-files-container > div > div.files-content > p").innerText = content;
}

/**
 * Display a patient if the link is accessed from /patients?id={...}
 */
function initPatient() {
    window.setTimeout(function() {
        const queries = new URLSearchParams(window.location.search);

        if (queries.has('id')) {
            const id = queries.get('id');
            const userList = document.getElementById('displayResult');

            for (let elem of userList.children) {
                if (elem.id == id) {
                    elem.click();
                    break;
                }
            }
        }
    }, 50);

    websocket.addEventListener('patient', 'new', (message) => {
        if (window.patientId)
            window.location.href = '/patients?patientId=' + window.patientId;
        else
            window.location.reload();
    });

    websocket.addEventListener('patient', 'update', (message) => {
        if (message.identifiers.id == window.patientId) {
            if (message.data.firstname !== undefined)
                document.getElementById('firstName').value = message.data.firstname;
            if (message.data.lastname !== undefined)
                document.getElementById('lastName').value = message.data.lastname;
            if (message.data.room_id !== undefined)
                document.getElementById('roomId').value = message.data.room_id;
            if (message.data.ss_number !== undefined)
                document.getElementById('ssNumber').value = message.data.ss_number;
            if (message.data.birthdate !== undefined)
                document.getElementById('birthDate').value = message.data.birthdate;
        }
    });

    websocket.addEventListener('patient', 'delete', (message) => {
        if (message.identifiers.id == window.patientId)
            window.location.reload();
        else {
            const patient = document.getElementById(message.identifiers.id);

            if (patient)
                patient.delete();
        }
    });

    websocket.addEventListener('note', 'new', (message) => {
        if (window.patientId)
            window.location.href = '/patients?patientId=' + window.patientId;
        else
            window.location.reload();
    });

    websocket.addEventListener('note', 'update', (message) => {
        if (window.patientId)
            window.location.href = '/patients?patientId=' + window.patientId;
        else
            window.location.reload();
    });

    websocket.addEventListener('note', 'delete', (message) => {
        if (window.patientId)
            window.location.href = '/patients?patientId=' + window.patientId;
        else
            window.location.reload();
    });
    websocket.addEventListener('file', 'update', (message) => {
        if (window.patientId)
            window.location.href = '/patients?patientId=' + window.patientId;
        else
            window.location.reload();
    });
}

function savePatient() {
    if (message.data.firstname !== undefined)
        document.getElementById('firstName').value = message.data.firstname;
    if (message.data.lastname !== undefined)
        document.getElementById('lastName').value = message.data.lastname;
    if (message.data.room_id !== undefined)
        document.getElementById('roomId').value = message.data.room_id;
    if (message.data.ss_number !== undefined)
        document.getElementById('ssNumber').value = message.data.ss_number;
    if (message.data.birthdate !== undefined)
        document.getElementById('birthDate').value = message.data.birthdate;
}

function searchList() {
    // Declare variables
    let input, filter, ul, li, a, i, txtValue;
    input = document.getElementById('searchInput');
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

// function checkClick() {
//     document.onclick = function(e) {
//         let divToHide = document.querySelector("#displayResult");
//         let divTohaid = document.querySelector("#tutorial_display");
//         if (e.target.id !== "displayResult") {
//             divToHide.style.display = 'none';
//         }
//         if (e.target.id === "pop-up-container") {
//             divTohaid.style.display = 'none';
//         }
//     };
// }

// checkClick();

function displayInformations(patientId, firstName, lastName, birthDate, roomId, ssNumber) {

    // const queries = new URLSearchParams(window.location.search);

    // if (queries.has('id')) {
    //     const id = queries.get('id');
    //     const userList = document.getElementById('displayResult');

    //     for (let elem of userList.children) {
    //         if (elem.id == id) {
    //             elem.click();
    //             break;
    //         }
    //     }
    // } else {
    //     window.location.href = window.location.href + "?id=" + patientId;
    // }

    let input = document.getElementById("searchInput");
    input.value = firstName + " " + lastName;

    let divInformations = document.getElementById("informations");
    divInformations.style.display = "none"

    let divPatient = document.querySelectorAll("#patient");
    for (let i = 0; i < divPatient.length; i++) {
        divPatient[i].style.display = "block";
    }

    let divPatientId = document.getElementById("patientId");
    divPatientId.value = patientId;
    divPatientId.placeholder = patientId;
    window.patientId = patientId;

    let divFirstName = document.getElementById("firstName");
    divFirstName.value = firstName;
    divFirstName.placeholder = firstName;

    let divLastName = document.getElementById("lastName");
    divLastName.value = lastName;
    divFirstName.placeholder = lastName;

    let divBirthDate = document.getElementById("birthDate");
    divBirthDate.value = birthDate;
    divFirstName.placeholder = birthDate;

    let divRoomId = document.getElementById("roomId");
    divRoomId.value = roomId;
    divFirstName.placeholder = roomId;

    let divSsNumber = document.getElementById("ssNumber");
    divSsNumber.value = ssNumber;
    divFirstName.placeholder = ssNumber;

    let divSubmit = document.getElementById("submit");
    divSubmit.setAttribute("onclick", "setInformations('" + patientId + "')");
}

function listenKeyEnter(patientId) {
    let li = document.getElementById(patientId);

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
 * Update patient informations
 */
function setInformations(patientId) {
    const data = {
        id: patientId,
        firstname: document.getElementById("firstName").value,
        lastname: document.getElementById("lastName").value,
        birthdate: document.getElementById("birthDate").value,
        room_id: document.getElementById("roomId").value,
        ss_number: document.getElementById("ssNumber").value
    };

    apiUpdate("patients", data);
}

// /**
//  * Display all the notes and prescriptions of a patient
//  * @param {string} ssNumber - Social security number of the patient
//  * @param {array} notes - Array of notes
//  * @param {array} prescriptions - Array of prescriptions
//  */
// function displayNotes(ssNumber, notes, prescriptions) {
//     const notesTable = document.getElementById("notes");
//     const tbody = notesTable.children[1];

//     while (tbody.hasChildNodes()) {
//         tbody.removeChild(tbody.lastChild);
//     }

//     notes = notes.replace(/[\u0000-\u0019]+/g,"");
//     const nAttachedTo = JSON.parse(notes);

//     prescriptions = prescriptions.replace(/[\u0000-\u0019]+/g,"");
//     const pAttachedTo = JSON.parse(prescriptions);

//     for (const note in nAttachedTo) {
//         if (nAttachedTo[note].n_attached_to == ssNumber) {
//             const tr =  document.createElement("tr");
//             const tdCreator = document.createElement("td");
//             const tdDate = document.createElement("td");

//             tr.classList.add("item");
//             tr.onclick = function () {
//                 displayContentNotes(nAttachedTo[note].n_creator, nAttachedTo[note].id, nAttachedTo[note].n_attached_to, nAttachedTo[note].n_content);
//             };

//             tdCreator.setAttribute("id", "creator");
//             tdCreator.innerHTML = nAttachedTo[note].n_creator;

//             tdDate.setAttribute("id", "date");
//             tdDate.innerHTML = nAttachedTo[note].id;

//             tr.appendChild(tdCreator);
//             tr.appendChild(tdDate);
//             tbody.appendChild(tr);
//         }
//     }

//     for (const prescription in pAttachedTo) {
//         if (pAttachedTo[prescription].p_attached_to == ssNumber) {
//             const tr =  document.createElement("tr");
//             const tdCreator = document.createElement("td");
//             const tdDate = document.createElement("td");

//             tr.classList.add("item");
//             tr.onclick = function () {
//                 displayContentPrescriptions(pAttachedTo[prescription].p_creator, pAttachedTo[prescription].id, pAttachedTo[prescription].p_attached_to, pAttachedTo[prescription].p_content);
//             };

//             tdCreator.setAttribute("id", "creator");
//             tdCreator.innerHTML = pAttachedTo[prescription].p_creator;

//             tdDate.setAttribute("id", "date");
//             tdDate.innerHTML = pAttachedTo[prescription].id;

//             tr.appendChild(tdCreator);
//             tr.appendChild(tdDate);
//             tbody.appendChild(tr);
//         }
//     }
// }
