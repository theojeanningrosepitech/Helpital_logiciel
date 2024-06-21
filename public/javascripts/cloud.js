const CHUNK_SIZE = 400000; // 400 KB
let fileInput, uploadFiles, uploadSessionID, uploadMeta;
let targetFile, services, roles, sharedUsers;
const availableFloors = [-2, 6];

function initCloud() {
    const buttonAddFile = document.getElementById('add-file');
    const buttonAddFolder = document.getElementById('add-folder');
    const files = document.getElementById('files');
    const folders = document.getElementById('folders');
    const searchField = document.getElementById('search-cloud');
    const selectOrderBy = document.getElementById('cloud-order-by-select');
    const selectOrderColumn = document.getElementById('cloud-order-column-select');

    if (buttonAddFile) {
        buttonAddFile.addEventListener('click', function() {
            fileInput.click();
        });
        buttonAddFile.addEventListener('drop', function (e) {
            dropFile(e);
        });
        buttonAddFile.addEventListener('dragover', function(e) {
            e.preventDefault()
        });
    }

    searchField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter')
            searchCloud();
    });

    selectOrderBy.addEventListener('change', searchCloud);
    selectOrderColumn.addEventListener('change', searchCloud);

    if (buttonAddFolder) {
        buttonAddFolder.addEventListener('click', function() {
            prompt('Nom du nouveau dossier', '', (inputValue) => {
                const params = getQueryParameters();
                let folder = params.get('folder');
                let body = {
                    filename: inputValue,
                };

                if (folder && folder !== '')
                    body.folder = folder;

                apiPost('files/folders', body, function(response) {
                    response.json().then(function(data) {
                        window.location.reload();
                        // window.location.href = '/cloud?folder=' + data.uuid;
                    });
                }, function(e) {
                    window.alert('An error occured before uploading the file...\n\n' + e);
                });
            });
        });
    }

    fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = false;
    // fileInput.accept = "mimes_types...";
    fileInput.addEventListener('change', function (e) {
        addFiles(e.target.files);
    });

    for (let i = 0; i !== files.childElementCount; i++) {
        files.children[i].getElementsByClassName('favorite')[0].addEventListener('click', addRemoveFavorite);
        files.children[i].addEventListener('click', displayFileDetails);
    }

    for (let i = 0; i !== folders.childElementCount; i++) {
        folders.children[i].getElementsByClassName('favorite')[0].addEventListener('click', addRemoveFavorite);
        folders.children[i].addEventListener('click', function() {
            window.location.href = window.location.pathname + '?folder=' + this.getAttribute('item-id')
        });
    }
    document.getElementById('edit-shared-users-button').addEventListener('click', openEditSharedUsersPopup);
    document.getElementById('edit-patient-button').addEventListener('click', addDeletePatient);
    registerCustomMenuDisplayCallback(customMenuCloudDisplayCallback);
    registerCustomMenuClickCallback(customMenuCloudClickCallback);

    fetch('/api/services').then(function(response) {
        if (response.status >= 200 && response.status < 300)
            response.json().then(function (data) {
                const selectSharedUsers = document.getElementById('search-shared-users-service');
                const selectPatient = document.getElementById('search-patient-service');

                let option;
                services = data;

                option = document.createElement('option');
                option.value = 0;
                option.innerText = 'Tous les services';
                selectSharedUsers.appendChild(option);

                for (const service of data) {
                    option = document.createElement('option');
                    option.value = service.id;
                    option.innerText = service.title;
                    selectSharedUsers.appendChild(option);
                }
                selectPatient.innerHTML = selectSharedUsers.innerHTML;
                selectPatient.addEventListener('change', searchPatient);
                selectSharedUsers.addEventListener('change', searchSharedUsers);
            });
        else
            customAlert(MSG_ERROR, MSG_RETRY, WARNING);
    }).catch(function() {
        customAlert(MSG_ERROR, MSG_INTERNAL_ERROR, WARNING);
    });

    fetch('/api/rooms/types').then(function(response) {
        if (response.status >= 200 && response.status < 300)
            response.json().then(function (data) {
                const selectRoom = document.getElementById('search-patient-room-type');
                let option;

                option = document.createElement('option');
                option.value = 0;
                option.innerText = 'Toutes les salles';
                selectRoom.appendChild(option);

                for (const type of data) {
                    option = document.createElement('option');
                    option.value = type.id;
                    option.innerText = type.display_name;
                    selectRoom.appendChild(option);
                }
                selectRoom.addEventListener('change', searchPatient);
            });
        else
            customAlert(MSG_ERROR, MSG_RETRY, WARNING);
    }).catch(function() {
        customAlert(MSG_ERROR, MSG_INTERNAL_ERROR, WARNING);
    });

    fetch('/api/roles').then(function(response) {
        if (response.status >= 200 && response.status < 300)
            response.json().then(function (data) {
                const selectRole = document.getElementById('search-shared-users-role');

                let option;
                roles = data;

                option = document.createElement('option');
                option.value = 0;
                option.innerText = 'Tous les rôles';
                selectRole.appendChild(option);

                for (const role of data) {
                    option = document.createElement('option');
                    option.value = role.id;
                    option.innerText = role.role_name;
                    selectRole.appendChild(option);
                }
                selectRole.addEventListener('change', searchSharedUsers);
            });
        else
            customAlert(MSG_ERROR, MSG_RETRY, WARNING);
    }).catch(function() {
        customAlert(MSG_ERROR, MSG_INTERNAL_ERROR, WARNING);
    });

    const searchPatientFloor = document.getElementById('search-patient-floor');
    searchPatientFloor.addEventListener('input', searchPatient);

    let option = document.createElement('option');
    option.value = '';
    option.innerText = 'Tous les étages';
    searchPatientFloor.appendChild(option);

    for (let i = 0; i != availableFloors[1] - availableFloors[0] + 1; i++) {
        option = document.createElement('option');
        option.value = availableFloors[1] - i;
        option.innerText = getFloorName(availableFloors[1] - i, true);
        searchPatientFloor.appendChild(option);
    }
    document.getElementById('search-shared-users-name').addEventListener('input', searchSharedUsers);
    document.getElementById('search-patient-name').addEventListener('input', searchPatient);
}

function getFloorName(floor, short) {

    if (floor === 0)
        return short ? 'Rdc' : 'Rez de chaussée';
    else if (floor < 0)
        return floor;
    else if (floor === 1)
        return floor + 'er étage';
    else
        return floor + 'ème étage';
}

function searchCloud() {
    const params = getQueryParameters();

    const searchField = document.getElementById('search-cloud');
    const selectOrderBy = document.getElementById('cloud-order-by-select');
    const selectOrderColumn = document.getElementById('cloud-order-column-select');

    params.set('orderBy', selectOrderBy.options[selectOrderBy.selectedIndex].value);
    params.set('orderColumn', selectOrderColumn.options[selectOrderColumn.selectedIndex].value);
    params.set('search', encodeURIComponent(searchField.value));
    window.location.search = params.toString();
}

function searchSharedUsers() {
    const service = document.getElementById('search-shared-users-service');
    const role = document.getElementById('search-shared-users-role');
    const userName = document.getElementById('search-shared-users-name');
    const roomType = document.getElementById('search-patient-room-type');
    let query = 'search=' + userName.value;

    if (service.options[service.selectedIndex].value !== '0')
        query += '&service=' + parseInt(service.options[service.selectedIndex].value);
    if (role.options[role.selectedIndex].value !== '0')
        query += '&role=' + parseInt(role.options[role.selectedIndex].value);

    fetch('/api/users?' + query).then(function(response) {
        if (response.status >= 200 && response.status < 300)
            response.json().then(function (data) {
                const list = document.getElementById('shared-users-list');

                list.innerHTML = '';
                let skip = false;

                for (const user of data) {
                    for (const userShared of sharedUsers) {
                        if (user.id === userShared.id || user.id == targetFile.creatorID) {
                            skip = true;
                            break;
                        }
                    }

                    if (skip)
                        skip = false;
                    else
                        list.appendChild(buildAddUserListRow(user));
                }
            });
        else
            customAlert(MSG_ERROR, MSG_RETRY, WARNING);
    }).catch(function() {
        customAlert(MSG_ERROR, MSG_INTERNAL_ERROR, WARNING);
    });
}

function searchPatient() {
    const floor = document.getElementById('search-patient-floor');
    const service = document.getElementById('search-patient-service');
    const patientName = document.getElementById('search-patient-name');
    const roomType = document.getElementById('search-patient-room-type');
    let query = 'search=' + patientName.value;

    if (service.options[service.selectedIndex].value !== '0')
        query += '&service_id=' + parseInt(service.options[service.selectedIndex].value);
    if (roomType.options[roomType.selectedIndex].value != '0')
        query += '&room_type=' + parseInt(roomType.options[roomType.selectedIndex].value);
    if (floor.options[floor.selectedIndex].value != '')
        query += '&floor=' + parseInt(floor.options[floor.selectedIndex].value);

    fetch('/api/patients?' + query).then(function(response) {
        if (response.status >= 200 && response.status < 300)
            response.json().then(function (data) {
                const list = document.getElementById('patients-list');

                list.innerHTML = '';

                for (const patient of data.patients)
                    list.appendChild(buildAddPatientListRow(patient));
            });
        else
            customAlert(MSG_ERROR, MSG_RETRY, WARNING);
    }).catch(function() {
        customAlert(MSG_ERROR, MSG_INTERNAL_ERROR, WARNING);
    });
}

function buildAddPatientListRow(patient) {
    const div = document.createElement('div');
    const service = document.createElement('p');
    const name = document.createElement('p');
    const ss_number = document.createElement('p');
    const roomTitle = document.createElement('p');
    name.innerText = patient.firstname + ' ' + patient.lastname;
    ss_number.innerText = patient.ss_number;

    if (patient.room) {
        service.innerText = getServiceName(patient.room.service_id);
        roomTitle.innerText = patient.room.title;
    }
    div.setAttribute('patient-id', patient.id);
    div.addEventListener('click', cloudAddPatient);

    div.appendChild(service);
    div.appendChild(name);
    div.appendChild(roomTitle);
    div.appendChild(ss_number);

    return div;
}

function buildAddUserListRow(user) {
    const div = document.createElement('div');
    const service = document.createElement('p');
    const name = document.createElement('p');
    const login = document.createElement('p');
    const role = document.createElement('p');
    name.innerText = user.firstname + ' ' + user.lastname;
    login.innerText = user.login;
    role.innerText = getRoleName(user.user_role);
    service.innerText = getServiceName(user.service);

    div.setAttribute('user-id', user.id);
    div.addEventListener('click', cloudAddSharedUser);

    div.appendChild(service);
    div.appendChild(name);
    div.appendChild(login);
    div.appendChild(role);

    return div;
}

function displayFileDetails(e) {
    const files = document.getElementById('files');
    const folders = document.getElementById('folders');
    let type = 0;

    for (let i = 0; i !== folders.childElementCount; i++) {
        if (folders.children[i] === this) {
            type = 1;
            break;
        }
    }

    if ( !type) {
        for (let i = 0; i !== files.childElementCount; i++) {
            if (files.children[i] === this) {
                type = 2;
                break;
            }
        }
    }

    if ( !type) {
        console.error('File not found');
        return;
    }

    displayDetails({
        type: type === 1 ? 'folder' : 'file',
        uuid: this.getAttribute('item-id'),
        creatorID: this.getAttribute('creator')
    });
}

function displayDetails(info) {
    if ( !info)
        info = targetFile;
    targetFile = info;

    fetch('/api/files' + (info.type === 'folder' ? '/folders' : '') + '/information?detailed=true&uuid=' + info.uuid).then(function (response) {
        if (response.status >= 200 && response.status < 300) {
            response.json().then((data) => {
                const container = document.getElementById('cloud-info');
                const details = container.getElementsByClassName('info')[0].children;
                const editPatientButton = document.getElementById('edit-patient-button');
                document.getElementById('cloud-popup-background').style.display = 'block';
                document.getElementById('files-info').style.display = (info.type === 'file') ? 'block' : 'none';

                container.style.display = 'block';
                details[0].children[1].innerText = data.filename;
                details[1].children[1].innerText = (data.creator) ? data.creator.firstname + ' ' + data.creator.lastname : '-';
                sharedUsers = data.shared_users_details;

                if (data.shared_users_details && data.shared_users_details.length !== 0) {
                    let users = [];

                    for (const user of data.shared_users_details)
                        users.push(user.firstname + ' ' + user.lastname);
                    details[2].children[1].innerText = users.join(', ');
                } else {
                    details[2].children[1].innerText = '-';
                }
                details[3].children[1].innerText = new Date(data.creation).toLocaleString();
                details[4].children[0].children[1].innerText = (data.last_update) ? new Date(data.last_update).toLocaleString() : '-';
                details[4].children[1].children[1].innerText = (data.size) ? data.size + ' octets' : '-';
                details[4].children[2].children[1].innerText = (data.mime_type) ? data.mime_type : '-';
                details[4].children[3].children[1].innerText = (data.patient) ? data.patient.firstname + ' ' + data.patient.lastname : '-';

                if (data.patient) {
                    editPatientButton.src = '/images/close.svg';
                    editPatientButton.classList.add('remove');
                } else {
                    editPatientButton.src = '/images/add.svg';
                    editPatientButton.classList.remove('remove');
                }
            });
        } else {
            customAlert(MSG_ERROR, MSG_RETRY, WARNING);
        }
    }).catch(function (e) {
        console.error(e);
        customAlert(MSG_ERROR, MSG_INTERNAL_ERROR, WARNING);
    });
}

function refreshPatientIcon(enabled) {

    if (targetFile.type !== 'file')
        return;
    const list = document.getElementById('files');

    for (const file of list.children) {
        if (file.getAttribute('item-id') == targetFile.uuid) {
            file.getElementsByClassName('patient')[0].style.display = enabled ? 'block' : 'none';
            break;
        }
    }
}

function getServiceName(id) {

    for (const service of services)
        if (service.id == id)
            return service.title;

    return '-';
}

function getRoleName(id) {

    for (const role of roles)
        if (role.id == id)
            return role.role_name;

    return '-';
}

function refreshSharedUsers() {
    fetch('/api/files' + (targetFile.type === 'folder' ? '/folders' : '') + '/information?detailed=true&uuid=' + targetFile.uuid).then(function (response) {
        if (response.status >= 200 && response.status < 300) {
            response.json().then((data) => {
                sharedUsers = data.shared_users_details;
                openEditSharedUsersPopup();
            });
        } else {
            customAlert(MSG_ERROR, MSG_RETRY, WARNING);
        }
    }).catch(function (e) {
        console.error(e);
        customAlert(MSG_ERROR, MSG_INTERNAL_ERROR, WARNING);
    });
}

function openEditSharedUsersPopup() {
    const popupUsers = document.getElementById('cloud-shared-users');
    const list = popupUsers.getElementsByClassName('shared-users')[0];
    popupUsers.style.display = 'block';

    list.innerHTML = '';
    let child, firstname, lastname, remove;

    for (const user of sharedUsers) {
        child = document.createElement('div');
        firstname = document.createElement('span');
        lastname = document.createElement('span');
        remove = document.createElement('img');

        child.setAttribute('user-id', user.id);
        firstname.innerText = user.firstname;
        lastname.innerText = user.lastname;
        remove.classList.add('edit-button');
        remove.src = '/images/close.svg';
        remove.addEventListener('click', removeSharedUser);
        child.appendChild(firstname);
        child.appendChild(lastname);
        child.appendChild(remove);
        list.appendChild(child);
    }

    if (sharedUsers.length === 0)
        list.innerText = 'Aucun utilisateur n\'a accès à cette ressource.'
}

function removeSharedUser() {
    apiDeleteCustomQuery('files/shared-users?uuid=' + targetFile.uuid + '&user_id=' + this.parentNode.getAttribute('user-id'), () => {
        refreshSharedUsers(); // refresh display
    });
}

function openSharedUsersAddPopup() {
    document.getElementById('cloud-add-shared-users').style.display = 'block';
    searchSharedUsers();
}

function addDeletePatient() {
    if (document.getElementById('edit-patient-button').classList.contains('remove')) {
        apiUpdate((targetFile.type === 'file' ? 'files' : 'files/folders') + '/patient?id=' + targetFile.uuid, {
            patient_id: 0
        }, () => {
            displayDetails(); // refresh display
            refreshPatientIcon(false);
        });
    } else
        openEditPatientPopup();
}

function openEditPatientPopup() {
    document.getElementById('cloud-add-patient').style.display = 'block';
    searchPatient();
}

function closePopup() {
    document.getElementById('cloud-popup-background').style.display = 'none';
    document.getElementById('cloud-info').style.display = 'none';
    closeSharedUsersPopup();
    closePatientAddPopup();
/*    document.getElementById('cloud-add-room').style.display = 'none';
    document.getElementById('cloud-unsized-rooms').style.display = 'none';

    const roomTypes = document.getElementById('room-type');
    const roomSupervisors = document.getElementById('room-supervisor');
    const roomName = document.getElementById('room-name');
    const roomCapacity = document.getElementById('room-capacity');

    const patientFirstname = document.getElementById('patient-firstname');
    const patientLastname = document.getElementById('patient-lastname');
    const patientSsNumber = document.getElementById('patient-ss-number');
    const patientBirthdate = document.getElementById('patient-birthdate');

    roomName.value = '';
    roomTypes.selectedIndex = 0;
    roomSupervisors.selectedIndex = 0;
    roomCapacity.value = '1';

    patientFirstname.value = '';
    patientLastname.value = '';
    patientSsNumber.value = '';
    patientBirthdate.value = '';*/
    targetFile = undefined;
}

function backFromSharedUsersPopup() {
    closeSharedUsersPopup();
    displayDetails();
}

function closeSharedUsersPopup() {
    document.getElementById('cloud-shared-users').style.display = 'none';
    closeSharedUsersAddPopup();
}

function closeSharedUsersAddPopup() {
    document.getElementById('cloud-add-shared-users').style.display = 'none';
    document.getElementById('search-shared-users-service').selectedIndex = 0;
    document.getElementById('search-shared-users-role').selectedIndex = 0;
    document.getElementById('search-shared-users-name').value = '';
}

function closePatientAddPopup() {
    document.getElementById('cloud-add-patient').style.display = 'none';
    document.getElementById('search-patient-service').selectedIndex = 0;
    document.getElementById('search-patient-floor').selectedIndex = 0;
    document.getElementById('search-patient-room-type').selectedIndex = 0;
    document.getElementById('search-patient-name').value = '';
}

function cloudAddSharedUser() {
    closeSharedUsersAddPopup();
    apiPost('files/shared-users?uuid=' + targetFile.uuid, {
        user_id: parseInt(this.getAttribute('user-id'))
    }, () => {
        refreshSharedUsers(); // refresh display
    });
}

function cloudAddPatient() {
    closePatientAddPopup();
    apiUpdate((targetFile.type === 'file' ? 'files' : 'files/folders') + '/patient?id=' + targetFile.uuid, {
        patient_id: parseInt(this.getAttribute('patient-id'))
    }, () => {
        displayDetails(); // refresh display
        refreshPatientIcon(true);
    });
}

function addRemoveFavorite(e) {
    e.preventDefault();
    e.stopPropagation();

    if (this.src.indexOf('/images/star.svg') !== -1) {
        apiDelete('files/favorite', this.parentNode.getAttribute('item-id'), () => {
            window.location.reload();
        });
    } else {
        apiPost('files/favorite', {
            uuid: this.parentNode.getAttribute('item-id')
        },() => {
            window.location.reload();
        });
    }
}

function customMenuCloudDisplayCallback(e, menu) {
    const files = document.getElementById('files').children;
    const folders = document.getElementById('folders').children;
    let bounds;

    for (let file of files) {
        bounds = file.getBoundingClientRect();

        if (e.clientX > bounds.left && e.clientX < bounds.right && e.clientY > bounds.top && e.clientY < bounds.bottom) {
            for (let i = menu.childElementCount - 1; i !== -1; i--) {
                if (menu.children[i].getAttribute('type') === 'details' || menu.children[i].getAttribute('type') === 'download' || menu.children[i].getAttribute('type') === 'rename' || menu.children[i].getAttribute('type') === 'delete')
                    menu.children[i].style.display = 'block';
            }
            customMenuTarget = {
                type: 'file',
                uuid: file.getAttribute('item-id'),
                filename: file.getAttribute('display_name'),
                creatorID: file.getAttribute('creator')
            };
            break;
        }
    }

    for (let folder of folders) {
        bounds = folder.getBoundingClientRect();

        if (e.clientX > bounds.left && e.clientX < bounds.right && e.clientY > bounds.top && e.clientY < bounds.bottom) {
            for (let i = menu.childElementCount - 1; i !== -1; i--) {
                if (menu.children[i].getAttribute('type') === 'details' || menu.children[i].getAttribute('type') === 'rename' || menu.children[i].name === 'delete')
                    menu.children[i].style.display = 'block';
            }
            customMenuTarget = {
                type: 'folder',
                uuid: folder.getAttribute('item-id'),
                filename: folder.getAttribute('filename'),
                creatorID: folder.getAttribute('creator'),
            };
            break;
        }
    }
}

function customMenuCloudClickCallback(e, eventType) {
    switch (eventType) {
        case 'details':
            displayDetails(customMenuTarget);
        case 'download':
            downloadFile(customMenuTarget.uuid, customMenuTarget.filename);
            break;
        case 'rename':
            prompt('Nom du ' + (customMenuTarget.type === 'file' ? 'fichier' : 'dossier'), customMenuTarget.filename, (inputValue) => {
                apiUpdate((customMenuTarget.type === 'file' ? 'files' : 'files/folders') + '/filename?id=' + customMenuTarget.uuid, {
                    filename: inputValue
                }, () => {
                    window.location.reload();
                });
            });
            break;
        case 'delete':
            apiDelete((customMenuTarget.type === 'file' ? 'files' : 'files/folders'), customMenuTarget.uuid, () => {
                window.location.reload();
            });
            break;
    }
}

function downloadFile(uuid, filename) {

//    THIS CODE ONLY WORKS IN A BROWSER, NOT IN ELECTRON APP

    const uri = '/file?uuid=' + uuid;
    const link = document.createElement('a');

    if (typeof link.download === 'string') {
        link.download = filename;
        link.href = uri;
        link.click();
    } else
        window.location.href = '/file?uuid=' + uuid;
}

function deleteFile(uuid) {
    apiDelete('files', uuid, () => {
        window.location.reload();
    });
}

function addFiles(fileArray) {

    if (fileArray.length === 0)
        return;

    if ( !uploadFiles)
        uploadFiles = [fileArray[0]];
    else if (uploadFiles.length === 0)
        uploadFiles.push(fileArray[0]);
    else
        return;
    const params = getQueryParameters();

    // init upload session
    let body = {
        filename: uploadFiles[0].name,
        // patient_id,
        // shared_users,
    };
    let folder = params.get('folder');

    if (folder && folder !== '')
        body.folder = folder;

    apiPost('files/upload/session', body, function(response) {
        response.json().then(function(data) {
            uploadSessionID = data.uuid;
            sendFile();
        });
    }, function(e) {
        window.alert('An error occured before uploading the file...\n\n' + e);
    });
}

function dropFile(e) {
    let array = [];
    e.preventDefault();

    if (e.dataTransfer.items) {
        for (let i = 0; i < e.dataTransfer.items.length; i++)
            if (e.dataTransfer.items[i].kind === 'file')
                array.push(e.dataTransfer.items[i].getAsFile());
        addFiles(array);
    } else
        addFiles(e.dataTransfer.files);
}

// read files
function sendFile() {
    const file = uploadFiles[0];

    uploadFile(file, function () {
        // file successfully uploaded
        window.location.reload();
    }, function (filename) {
        customAlert(MSG_ERROR, filename, WARNING);
    });
}

// send file to server
function uploadFile(file, callbackSuccess, callbackError) {
    uploadMeta = {
        running: true,
        counter: 0,
        numberofChunks: Math.ceil(file.size / CHUNK_SIZE),
        uuid: uploadSessionID,
        file: file,
        filename: file.name,
        callbackSuccess: callbackSuccess,
        callbackError: callbackError,
    };
    uploadNextChunk();
}

function uploadNextChunk() {

    if ( !uploadMeta.running)
        return;
    const begin = uploadMeta.counter * CHUNK_SIZE;
    const end = Math.min((uploadMeta.counter + 1) * CHUNK_SIZE, uploadMeta.file.size);
    const chunk = uploadMeta.file.slice(begin, end);

    fetch('/api/files/upload', {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/octet-stream',
            //'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Disposition': 'attachment',
            'Content-Range': 'bytes ' + begin + '-' + (end - 1) + '/' + uploadMeta.file.size,
            'X-UUID': uploadMeta.uuid
        },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: chunk
    }).then(function (response) {
        if (response.status >= 200 && response.status < 300) {
            uploadMeta.counter++;

            if (response.status === 201)
                uploadMeta.callbackSuccess();
            else if (uploadMeta.counter * CHUNK_SIZE < uploadMeta.file.size)
                uploadNextChunk();
            else {
                console.error('Chunk size error, please check Content-Range header value');
                uploadMeta.callbackError(uploadMeta.filename);
            }
        } else
            uploadMeta.callbackError(uploadMeta.filename);
    }).catch(function (e) {
        console.log(e);

        if (uploadMeta.counter === 0)
            uploadMeta.callbackError(uploadMeta.filename);
        else
            window.setTimeout(uploadNextChunk, 1000)
    });
}
