
function openLink(uri) {
    window.location.href = uri;
}

function deleteRoom(roomID) {

    apiDelete('rooms', roomID, function() {
        window.location.href = '/rooms';
    });
}

function saveRoom(roomID) {
    const roomType = document.getElementById('room-type');
    const name = document.getElementById('name');
    const capacity = document.getElementById('capacity');
    const supervisor = document.getElementById('supervisor');

    let updateData = {
        id: roomID,
        title: name.value,
        type: parseInt(roomType.options[roomType.selectedIndex].value),
        capacity: parseInt(capacity.value),
        supervisor: parseInt(supervisor.options[supervisor.selectedIndex].value),
    };

    if (!updateData.supervisor)
        delete updateData.supervisor;

    if (updateData.title === '') {
        customAlert(MSG_ERROR, 'Vous devez renseigner un nom d\'objet', WARNING);
        return;
    }

    apiUpdate('rooms', updateData, function(response) {
        window.location.href = '/rooms?id=' + roomID;
    });
}

function deleteRoomCategory(objectID) {

    apiDelete('rooms/types', objectID, function() {
        window.location.href = '/rooms/types';
    },  function(response) {
        if (response && response.status === 409)
            customAlert(MSG_ERROR, 'Cette catégorie est utilisée par une salle par conséquent vous ne pouvez la supprimer.', WARNING);
    });
}

function saveRoomCategory(objectID) {
    const categoryName = document.getElementById('category-name');
    let updateData = {
        id: objectID,
        display_name: categoryName.value
    };

    if (updateData.display_name === '') {
        customAlert(MSG_ERROR, 'Vous devez renseigner un nom de catégorie', WARNING);
        return;
    }

    apiUpdate('rooms/types', updateData, function(response) {
        window.location.href = '/rooms/types/type?id=' + objectID;
    });
}

function createRoomCategory() {
    const categoryName = document.getElementById('category-name');
    let newCategory = {
        display_name: categoryName.value
    };

    if (newCategory.display_name === '') {
        customAlert(MSG_ERROR, 'Vous devez renseigner un nom de catégorie', WARNING);
        return;
    }

    apiPost('rooms/types', newCategory, function(response) {
        response.json().then(function(data) {
            window.location.href = '/rooms/types/type?id=' + data.id;
        });
    });
}

function initRoom() {
    const id = document.getElementById('inner-body').getAttribute('item-id');
    const patients = document.getElementById('patients');
    const inventory = document.getElementById('inventory');

    // room
    websocket.addEventListener('room', 'update', (message) => {

        if (message.identifiers.id == id) {
            if (message.data.capacity || message.data.supervisor) {
                window.location.reload();
            }

            if (message.data.title)
                document.getElementsByName('title')[0].innerText = message.data.title;

            if (message.data.type) {
                fetch('/api/rooms/types?id=' + message.data.type).then(function(response) {
                    if (response.status >= 200 && response.status < 300)
                        response.json().then(function (data) {
                            if (data.length === 1)
                                document.getElementsByName('type')[0].innerText = data[0].display_name;
                        });
                });
            }

            if (message.data.service) {
                fetch('/api/service?id=' + message.data.service).then(function(response) {
                    if (response.status >= 200 && response.status < 300)
                        response.json().then(function (data) {
                            if (data.length === 1)
                                document.getElementsByName('service')[0].innerText = data[0].title;
                        });
                });
            }

            if (message.data.floor)
                document.getElementsByName('floor')[0].innerText = getFloorName(message.data.floor);
        }
    });

    websocket.addEventListener('room', 'delete', (message) => {
        if (message.identifiers.id == id)
            window.location.href = '/room_management';
    });


    // patients
    websocket.addEventListener('patient', 'new', (message) => {
        if (message.data.room_id == id)
            window.location.reload();
    });

    websocket.addEventListener('patient', 'update', (message) => {

        if ( !patients) {
            if (message.data.room_id && message.data.room_id == id)
                window.location.reload();
            return;
        }

        for (let i = patients.childElementCount - 1; i !== -1; i--) {
            if (message.identifiers.id == patients.children[i].getAttribute('item-id')) {
                if (message.data.room_id && message.data.room_id != id) {
                    patients.children[i].remove();
                } else if (message.data.firstname || message.data.lastname) {
                    let nameParts = patients.children[i].innerText.split(' ');

                    if (message.data.lastname)
                        nameParts[0] = message.data.lastname;

                    if (message.data.firstname)
                        nameParts[1] = message.data.firstname;
                    patients.children[i].innerText = nameParts.join(' ');
                }
                return;
            }
        }

        if (message.data.room_id && message.data.room_id == id)
            window.location.reload();
    });

    websocket.addEventListener('patient', 'delete', (message) => {

        if ( !patients)
            return;

        for (let i = patients.childElementCount - 1; i !== -1; i--) {
            if (message.identifiers.id == patients.children[i].getAttribute('item-id')) {
                patients.children[i].remove();
                return;
            }
        }
    });


    // inventory
    websocket.addEventListener('inventory', 'new', (message) => {
        if (message.data.room_id == id)
            window.location.reload();
    });

    websocket.addEventListener('inventory', 'update', (message) => {
        if ( !inventory) {
            if (message.data.room_id && message.data.room_id == id)
                window.location.reload();
            return;
        }

        for (let i = inventory.childElementCount - 1; i !== -1; i--) {
            if (message.identifiers.id == inventory.children[i].getAttribute('item-id')) {
                if (message.data.room_id && message.data.room_id != id) {
                    inventory.children[i].remove();
                } else if (message.data.title) {
                    inventory.children[i].innerText = message.data.title
                }
                return;
            }
        }

        if (message.data.room_id && message.data.room_id == id)
            window.location.reload();
    });

    websocket.addEventListener('inventory', 'delete', (message) => {

        if ( !inventory)
            return;

        for (let i = inventory.childElementCount - 1; i !== -1; i--) {
            if (message.identifiers.id == inventory.children[i].getAttribute('item-id')) {
                inventory.children[i].remove();
                return;
            }
        }
    });
}

function initRoomEdit() {
    const id = document.getElementById('inner-body').getAttribute('item-id');

    websocket.addEventListener('room', 'update', (message) => {
        if (message.identifiers.id == id)
            window.location.reload();
    });

    websocket.addEventListener('room', 'delete', (message) => {
        if (message.identifiers.id == id)
            window.location.href = '/room_management';
    });
}

function initRoomType() {
    const id = document.getElementById('inner-body').getAttribute('item-id');

    websocket.addEventListener('room_type', 'update', (message) => {
        if (message.identifiers.id == id)
            window.location.reload();
    });

    websocket.addEventListener('room_type', 'delete', (message) => {
        if (message.identifiers.id == id)
            window.location.href = '/rooms/types';
    });
}

function initRoomTypeEdit() {
    const id = document.getElementById('inner-body').getAttribute('item-id');

    websocket.addEventListener('room_type', 'update', (message) => {
        if (message.identifiers.id == id)
            window.location.reload();
    });

    websocket.addEventListener('room_type', 'delete', (message) => {
        if (message.identifiers.id == id)
            window.location.href = '/rooms/types';
    });
}
