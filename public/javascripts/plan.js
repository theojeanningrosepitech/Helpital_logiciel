const canv = document.getElementsByTagName('canvas')[0];
const defaultServiceId = parseInt(canv.getAttribute('service_id'));
const defaultFloor = parseInt(canv.getAttribute('floor'));
const meterReference = 75; // canvas pixels
const zoomLimits = [0.5, 2.0];
const availableFloors = [-2, 6];
let center, relativeMeter;
let lastSearchPlan, lastSearchedFloor, searchTarget;
let mouseClickTime = new Date();
let frameReady = true;
let mapLimits = [75, 50];
let displayData = {
    position: [0, 0],
    scale: 1.0,
    rooms: [],
    targetRoom: null,
    targetBed: null,
    targetInventory: null,
    floor: defaultFloor,
    serviceID: defaultServiceId,
    serviceName: '',
    mapElements: [],
    supervisors: [],
    roomTypes: [],
    inventoryTypes: [],
    editMode: {
        enabled: false,
        roomShape: 0,
    },
};
let services = [];
let moving = {
    state: 0,
    mousePosition: {
        x: 0,
        y: 0,
    },
    initialPosition: {
        x: displayData.position[0],
        y: displayData.position[1],
    },
    initialCorners: [],
    initialScale: displayData.scale,
    initialRoomPosition: [0, 0],
    targetRoom: null,
};
const gravity = {
    NORMAL: 0,
    TOP: 0,
	LEFT: 0,
	CENTER: 1,
	RIGHT: 2,
    BOTTOM: 2,
}

let images = {
    bed: new Image,
    surgery: new Image,
    consultation: new Image,
    waiting: new Image,
};
images.waiting.src = '/images/chair.svg';
images.surgery.src = '/images/healing.svg';
images.consultation.src = '/images/communication.svg';
images.bed.src = '/images/bed.svg';

function initPlan() {
    lastSearchedFloor = displayData.floor;
    loadPlan();

    fetch('/api/services').then(function(response) {
        if (response.status >= 200 && response.status < 300)
            response.json().then(function (data) {
                const select = document.getElementById('search-service');
                const selectAddInventory = document.getElementById('search-add-inventory-service');
                const selectTransferInventory = document.getElementById('search-transfer-inventory-service');
                const selectAddPatient = document.getElementById('search-add-patient-service');
                const selectTransferPatient = document.getElementById('search-transfer-patient-service');
                const selectUnsizedRooms = document.getElementById('search-unsized-room-service');

                let option;
                services = data;

                option = document.createElement('option');
                option.value = 0;
                option.innerText = 'Aucun service';
                selectAddPatient.appendChild(option);

                for (const service of data) {
                    option = document.createElement('option');
                    option.value = service.id;
                    option.innerText = service.title;
                    select.appendChild(option);
                }
                selectAddInventory.innerHTML = select.innerHTML;
                selectTransferInventory.innerHTML = select.innerHTML;
                selectTransferPatient.innerHTML = select.innerHTML;
                selectAddPatient.innerHTML += select.innerHTML;
                selectUnsizedRooms.innerHTML = select.innerHTML;
                setSelectValue(select, displayData.serviceID);
                setSelectValue(selectAddInventory, displayData.serviceID);
                setSelectValue(selectTransferInventory, displayData.serviceID);
                setSelectValue(selectAddPatient, displayData.serviceID);
                setSelectValue(selectTransferPatient, displayData.serviceID);
                setSelectValue(selectUnsizedRooms, displayData.serviceID);

                select.addEventListener('change', function(e) {
                    loadService(e.target.options[e.target.selectedIndex].value);
                });
                selectAddInventory.addEventListener('change', searchAddInventoryObject);
                selectTransferInventory.addEventListener('change', searchTransferInventoryObject);
                selectAddPatient.addEventListener('change', searchAddPatient);
                selectTransferPatient.addEventListener('change', searchTransferPatient);
                selectUnsizedRooms.addEventListener('change', searchUnsizedRooms);

                for (const service of services)
                    if (service.id === displayData.serviceID) {
                        displayData.serviceName = service.title;
                        break;
                    }
                draw();
            });
        else
            customAlert(MSG_ERROR, MSG_RETRY, WARNING);
    }).catch(function() {
        customAlert(MSG_ERROR, MSG_INTERNAL_ERROR, WARNING);
    });

    fetch('/api/rooms/types').then(function(response) {
        if (response.status >= 200 && response.status < 300)
            response.json().then(function (data) {
                displayData.roomTypes = data;
                const select = document.getElementById('room-type');
                const selectSearch = document.getElementById('search-type');
                const selectAddInventory = document.getElementById('search-add-inventory-room-type');
                const selectTransferInventory = document.getElementById('search-transfer-inventory-room-type');
                const selectAddPatient = document.getElementById('search-add-patient-room-type');
                const selectTransferPatient = document.getElementById('search-transfer-patient-room-type');
                const selectUnsizedRooms = document.getElementById('search-unsized-room-type');

                let option = document.createElement('option');
                let option2;

                option.value = '';
                option.innerText = 'Toutes les salles';
                selectSearch.appendChild(option);

                for (const type of data) {
                    option = document.createElement('option');
                    option2 = document.createElement('option');
                    option.value = type.id;
                    option2.value = type.id;
                    option.innerText = type.display_name;
                    option2.innerText = type.display_name;
                    select.appendChild(option);
                    selectSearch.appendChild(option2);
                }
                selectAddInventory.innerHTML = selectSearch.innerHTML;
                selectTransferInventory.innerHTML = selectSearch.innerHTML;
                selectAddPatient.innerHTML = selectSearch.innerHTML;
                selectTransferPatient.innerHTML = selectSearch.innerHTML;
                selectUnsizedRooms.innerHTML = selectSearch.innerHTML;
                selectSearch.selectedIndex = 0;
                selectAddInventory.selectedIndex = 0;
                selectTransferInventory.selectedIndex = 0;
                selectAddPatient.selectedIndex = 0;
                selectTransferPatient.selectedIndex = 0;
                selectUnsizedRooms.selectedIndex = 0;
                selectSearch.addEventListener('change', searchPlan);
                selectAddInventory.addEventListener('change', searchAddInventoryObject);
                selectTransferInventory.addEventListener('change', searchTransferInventoryObject);
                selectAddPatient.addEventListener('change', searchAddPatient);
                selectTransferPatient.addEventListener('change', searchTransferPatient);
                selectUnsizedRooms.addEventListener('change', searchUnsizedRooms);
            });
        else
            customAlert(MSG_ERROR, MSG_RETRY, WARNING);
    }).catch(function() {
        customAlert(MSG_ERROR, MSG_INTERNAL_ERROR, WARNING);
    });

    fetch('/api/inventory/types').then(function(response) {
        if (response.status >= 200 && response.status < 300)
            response.json().then(function (data) {
                displayData.inventoryTypes = data;
                const select = document.getElementById('inventory-type');
                const selectTransferInventory = document.getElementById('search-add-inventory-type');

                let option = document.createElement('option');

                option.value = '';
                option.innerText = 'Toutes les objets';
                selectTransferInventory.appendChild(option);

                for (const type of data) {
                    option = document.createElement('option');
                    option.value = type.id;
                    option.innerText = type.display_name;
                    select.appendChild(option);

                    option = document.createElement('option');
                    option.value = type.id;
                    option.innerText = type.display_name;
                    selectTransferInventory.appendChild(option);
                }
                selectTransferInventory.selectedIndex = 0;
                selectTransferInventory.addEventListener('change', searchAddInventoryObject);
            });
        else
            customAlert(MSG_ERROR, MSG_RETRY, WARNING);
    }).catch(function() {
        customAlert(MSG_ERROR, MSG_INTERNAL_ERROR, WARNING);
    });

    fetch('/api/supervisors').then(function(response) {
        if (response.status >= 200 && response.status < 300)
            response.json().then(function (data) {
                displayData.supervisors = data;
                const select = document.getElementById('room-supervisor');
                let option;

                for (const user of data) {
                    option = document.createElement('option');
                    option.value = user.id;
                    option.innerText = user.firstname + ' ' + user.lastname;
                    select.appendChild(option);
                }
            });
        else
            customAlert(MSG_ERROR, MSG_RETRY, WARNING);
    }).catch(function() {
        customAlert(MSG_ERROR, MSG_INTERNAL_ERROR, WARNING);
    });

    document.getElementById('search-room').addEventListener('input', searchPlan);
    document.getElementById('search-room').addEventListener('keydown', searchPlanKeydown);
    document.getElementById('search-patient').addEventListener('input', searchPlan);
    document.getElementById('search-patient').addEventListener('keydown', searchPlanKeydown);
    document.getElementById('search-inventory').addEventListener('input', searchPlan);
    document.getElementById('search-inventory').addEventListener('keydown', searchPlanKeydown);
    document.getElementById('search-add-inventory-name').addEventListener('input', searchAddInventoryObject);
    document.getElementById('search-transfer-inventory-room').addEventListener('input', searchTransferInventoryObject);
    document.getElementById('search-add-patient-name').addEventListener('input', searchAddPatient);
    document.getElementById('search-transfer-patient-room-name').addEventListener('input', searchTransferPatient);
    document.getElementById('search-unsized-room-name').addEventListener('input', searchUnsizedRooms);

    const searchAddInventoryFloor = document.getElementById('search-add-inventory-floor');
    const searchTransferInventoryFloor = document.getElementById('search-transfer-inventory-floor');
    const searchAddPatientFloor = document.getElementById('search-add-patient-floor');
    const searchTransferPatientFloor = document.getElementById('search-transfer-patient-floor');
    searchAddInventoryFloor.addEventListener('input', searchAddInventoryObject);
    searchTransferInventoryFloor.addEventListener('input', searchTransferInventoryObject);
    searchAddPatientFloor.addEventListener('input', searchAddPatient);
    searchTransferPatientFloor.addEventListener('input', searchTransferPatient);

    displayData.mapElements.push({
        id: 'zoom_vertical_bar',
        gravity: [gravity.TOP, gravity.RIGHT],
        position_x: 72.5,
        position_y: 100,
        size_x: 15,
        size_y: 300,
        onClick: clickZoomVerticalBar,
    });

    displayData.mapElements.push({
        id: 'zoom_horizontal_bar',
        gravity: [gravity.TOP, gravity.RIGHT],
        position_x: 45,
        position_y: 0,
        size_x: 70,
        size_y: 20
    });

    displayData.mapElements.push({
        id: 'edit_map',
        gravity:  [gravity.BOTTOM, gravity.RIGHT],
        position_x: 0,
        position_y: 0,
        size_x: 200,
        size_y: 50,
        text: 'Mode pratique',
        onClick: enableEditMode
    });

    displayData.mapElements.push({
        id: 'edit_add_unsized_room',
        edit: true,
        gravity:  [gravity.BOTTOM, gravity.RIGHT],
        position_x: 200,
        position_y: 0,
        size_x: 420,
        size_y: 50,
        text: 'Assigner une position à une salle',
        onClick: displayUnassignedRoomPositionList
    });

    displayData.mapElements.push({
        id: 'edit_room_shape_rect',
        edit: true,
        gravity:  [gravity.BOTTOM, gravity.LEFT],
        position_x: 0,
        position_y: 200,
        size_x: 200,
        size_y: 200,
        onClick: function() {
            displayData.editMode.roomShape = 0;
            draw();
        },
        draw: function(canvas) {
            const position = getElementRelativePosition(this);

            canvas.beginPath();
            canvas.strokeRect(position.x + this.size_x * 0.25, position.y + this.size_y * 0.25, this.size_x * 0.5, this.size_y * 0.5);

            if (displayData.editMode.roomShape === 0)
                canvas.fillRect(position.x + this.size_x * 0.25, position.y + this.size_y * 0.25, this.size_x * 0.5, this.size_y * 0.5);
        }
    });

    displayData.mapElements.push({
        id: 'edit_room_shape_free',
        edit: true,
        gravity:  [gravity.BOTTOM, gravity.LEFT],
        position_x: 0,
        position_y: 0,
        size_x: 200,
        size_y: 200,
        onClick: function() {
            displayData.editMode.roomShape = 1;
            draw();
        },
        draw: function(canvas) {
            const position = getElementRelativePosition(this);

            canvas.beginPath();
            canvas.moveTo(position.x + this.size_x * 0.25, position.y + this.size_y * 0.25);
            canvas.lineTo(position.x + this.size_x * 0.35, position.y + this.size_y * 0.25);
            canvas.lineTo(position.x + this.size_x * 0.35, position.y + this.size_y * 0.15);
            canvas.lineTo(position.x + this.size_x * 0.5, position.y + this.size_y * 0.15);
            canvas.lineTo(position.x + this.size_x * 0.5, position.y + this.size_y * 0.25);
            canvas.lineTo(position.x + this.size_x * 0.75, position.y + this.size_y * 0.25);
            canvas.lineTo(position.x + this.size_x * 0.75, position.y + this.size_y * 0.5);
            canvas.lineTo(position.x + this.size_x * 0.6, position.y + this.size_y * 0.5);
            canvas.lineTo(position.x + this.size_x * 0.6, position.y + this.size_y * 0.75);
            canvas.lineTo(position.x + this.size_x * 0.25, position.y + this.size_y * 0.75);
            canvas.closePath();
            canvas.stroke();

            if (displayData.editMode.roomShape === 1)
                canvas.fill();
        }
    });

    // floor selector
    let option = document.createElement('option');
    option.value = '';
    option.innerText = 'Tous les étages';
    searchAddInventoryFloor.appendChild(option);
    option = document.createElement('option');
    option.value = '';
    option.innerText = 'Tous les étages';
    searchTransferInventoryFloor.appendChild(option);
    option = document.createElement('option');
    option.value = '';
    option.innerText = 'Tous les étages';
    searchAddPatientFloor.appendChild(option);
    option = document.createElement('option');
    option.value = '';
    option.innerText = 'Tous les étages';
    searchTransferPatientFloor.appendChild(option);

    for (let i = 0; i != availableFloors[1] - availableFloors[0] + 1; i++) {
        displayData.mapElements.push({
            gravity:  [gravity.TOP, gravity.LEFT],
            position_x: 0,
            position_y: 50 * i,
            size_x: 200,
            size_y: 50,
            text: getFloorName(availableFloors[1] - i, true),
            onClick: function() {
                selectFloor(availableFloors[1] - i);
            }
        });

        option = document.createElement('option');
        option.value = availableFloors[1] - i;
        option.innerText = getFloorName(availableFloors[1] - i, true);
        searchAddInventoryFloor.appendChild(option);

        option = document.createElement('option');
        option.value = availableFloors[1] - i;
        option.innerText = getFloorName(availableFloors[1] - i, true);
        searchTransferInventoryFloor.appendChild(option);

        option = document.createElement('option');
        option.value = availableFloors[1] - i;
        option.innerText = getFloorName(availableFloors[1] - i, true);
        searchAddPatientFloor.appendChild(option);

        option = document.createElement('option');
        option.value = availableFloors[1] - i;
        option.innerText = getFloorName(availableFloors[1] - i, true);
        searchTransferPatientFloor.appendChild(option);
    }
    updateZoomWidget();
}

function loadService(serviceID) {
    displayData.serviceID = serviceID;

    for (const service of services)
        if (service.id == displayData.serviceID) {
            displayData.serviceName = service.title;
            break;
        }
    loadPlan();
}

function loadPlan(searchData) {
    let uri = '/api/rooms?unsized=false&service_id=' + displayData.serviceID;

    for (const key in searchData)
        uri += '&' + key + '=' + searchData[key];

    fetch(uri).then(function(response) {
        if (response.status >= 200 && response.status < 300)
            response.json().then(function (data) {
                displayData.rooms = data;
                draw();
            });
        else
            customAlert(MSG_ERROR, MSG_RETRY, WARNING);
    }).catch(function() {
        customAlert(MSG_ERROR, MSG_INTERNAL_ERROR, WARNING);
    });
}

function draw(mouseX = 0, mouseY = 0) {
    const canvas = canv.getContext('2d');

    // set precision x2 (if not draw will be blur)
    canv.width = canv.clientWidth * 2;
    canv.height = canv.clientHeight * 2;
    canvas.clearRect(0, 0, canv.width, canv.height);
    center = [canv.width / 2 + displayData.position[0], canv.height / 2 + displayData.position[1]];
    relativeMeter = meterReference * displayData.scale;

    drawPlan(canvas, mouseX, mouseY);
}

// return the displayed area drawn in canvas (optimize drawing)
function getDisplayedArea() {
    const zoomCoeff = 1 / displayData.scale;
    const xMax = (Math.round(canv.width / 2 * zoomCoeff / meterReference) + 1) * relativeMeter;
    const yMax = (Math.round(canv.height / 2 * zoomCoeff / meterReference) + 1) * relativeMeter;

    return {
        top: center[1] - yMax - (Math.round(displayData.position[1] * zoomCoeff / meterReference)) * relativeMeter,
        left: center[0] - xMax - (Math.round(displayData.position[0] * zoomCoeff / meterReference)) * relativeMeter,
        right: center[0] + xMax - displayData.position[0],
        bottom: center[1] + yMax - displayData.position[1],
    };
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

function drawRoom(canvas, mouseX, mouseY, room) {
    const roomCoords = getRoomCoordinates(room);
    let hoverElem = false;
    let roomText;

    // hover room
    if (!displayData.editMode.addRoom && !moving.targetRoom && checkPointCollision(roomCoords, [mouseX, mouseY])) {
        canvas.shadowColor = '#777';
        canvas.shadowBlur = 20;
        hoverElem = true;
    }
    canvas.strokeStyle = 'white';

    if (displayData.editMode.enabled && canvas.shadowBlur !== 0)
        canvas.fillStyle = '#ec3a3a';
    else
        canvas.fillStyle = getRoomTypeColor(room.type.id, room.hidden);

    canvas.beginPath();

    for (let i = 0; i !== roomCoords.length; i++) {
        if (i === 0)
            canvas.moveTo(roomCoords[i].x, roomCoords[i].y);
        else
            canvas.lineTo(roomCoords[i].x, roomCoords[i].y);
    }
    canvas.closePath();
    canvas.fill();
    canvas.stroke();

    if (displayData.editMode.enabled && canvas.shadowBlur !== 0)
        roomText = 'Modifier';
    else
        roomText = room.title;
    canvas.fillStyle = 'white';
    canvas.shadowBlur = 0;
    const center = getRoomCenter(room);
    canvas.fillText(roomText, center[0], center[1] + relativeMeter * 0.6);
    const roomImage = getRoomImage(room.type.id);

    if (roomImage) {
        canvas.drawImage(roomImage, center[0] - relativeMeter / 2, center[1] - relativeMeter * 0.6, relativeMeter, relativeMeter);
    }

    return hoverElem;
}

function drawPlan(canvas, mouseX, mouseY) {
    const displayArea = getDisplayedArea();
    let hoverElem = false;
    let hoverCorner = null;

    // draw axis
    canvas.lineWidth = 2;
    canvas.strokeStyle = '#afafaf';
    canvas.beginPath();
    canvas.moveTo(center[0], displayArea.top);
    canvas.lineTo(center[0], displayArea.bottom);
    canvas.moveTo(displayArea.left, center[1]);
    canvas.lineTo(displayArea.right, center[1]);
    canvas.stroke();
    canvas.beginPath();
    canvas.lineWidth = 0.5;

    // draw vertical lines
    for (let i = displayArea.left; i < displayArea.right; i += relativeMeter) {
        canvas.moveTo(i, displayArea.top);
        canvas.lineTo(i, displayArea.bottom);
    }
    // draw horizontal lines
    for (let i = displayArea.top; i < displayArea.bottom; i += relativeMeter) {
        canvas.moveTo(displayArea.left, i);
        canvas.lineTo(displayArea.right, i);
    }
    canvas.stroke();

    if (displayData.editMode.enabled) {
        // draw anhors
        for (let i = displayArea.left; i < displayArea.right; i += relativeMeter)
            for (let j = displayArea.top; j < displayArea.bottom; j += relativeMeter) {
                canvas.beginPath();
                // check if mouse hovers the anchor
                if (!moving.targetRoom && mouseX > i - relativeMeter * 0.5
                && mouseX < i + relativeMeter * 0.5
                && mouseY > j - relativeMeter * 0.5
                && mouseY < j + relativeMeter * 0.5) {
                    canvas.fillStyle = '#000';
                    hoverElem = true;
                    canvas.arc(i, j, 0.1 * relativeMeter, 0, 2 * Math.PI, false);
                } else {
                    canvas.fillStyle = '#afafaf';
                    canvas.arc(i, j, 0.05 * relativeMeter, 0, 2 * Math.PI, false);
                }
                canvas.fill();
            }
    }

    // draw rooms
    canvas.lineWidth = 2;
    canvas.strokeStyle = 'black';
    canvas.textAlign = 'center';
    canvas.textBaseline = 'middle';
    canvas.font = 'bold ' + 25 * displayData.scale + 'px sans-serif';

    // draw all rooms
    for (const room of displayData.rooms) {
        if (room.floor === displayData.floor) {
            if (!displayData.editMode.enabled || moving.targetRoom !== room) {
                const hover = drawRoom(canvas, mouseX, mouseY, room);

                if ( !hoverElem && hover)
                    hoverElem = true;
            }
        }
    }

    // draw first layer, upfront room
    for (const room of displayData.rooms) {
        if (displayData.editMode.enabled && moving.targetRoom === room) {
            if (room.floor === displayData.floor) {
                const hover = drawRoom(canvas, mouseX, mouseY, room);

                if ( !hoverElem && hover)
                    hoverElem = true;
            }
        }
    }

    if (displayData.editMode.enabled) {
        // draw new room (being created)
        if (displayData.editMode.addRoom && displayData.editMode.addRoom.corners) {
            let point;

            for (let i = displayArea.left; i < displayArea.right; i += relativeMeter)
                for (let j = displayArea.top; j < displayArea.bottom; j += relativeMeter) {
                    // check if mouse hovers the anchor
                    if (mouseX > i - relativeMeter * 0.5
                    && mouseX < i + relativeMeter * 0.5
                    && mouseY > j - relativeMeter * 0.5
                    && mouseY < j + relativeMeter * 0.5) {
                        canvas.fillStyle = getRoomTypeColor(0);
                        canvas.strokeStyle = 'black';

                        if (displayData.editMode.roomShape === 0) {
                            const newAnchor = getPointCoordinatesFromPixels(i, j);
                            const coordinates = getRectCoordinates(displayData.editMode.addRoom.corners[0].x, displayData.editMode.addRoom.corners[0].y, newAnchor.x - displayData.editMode.addRoom.corners[0].x, newAnchor.y - displayData.editMode.addRoom.corners[0].y);

                            canvas.beginPath();
                            canvas.fillRect(coordinates[0], coordinates[1], coordinates[2], coordinates[3]);
                            canvas.strokeRect(coordinates[0], coordinates[1], coordinates[2], coordinates[3]);
                            canvas.stroke();

                            // draw corners anchors
                            canvas.fillStyle = '#000';
                            canvas.beginPath();
                            canvas.arc(coordinates[0], coordinates[1], 0.1 * relativeMeter, 0, 2 * Math.PI, false);
                            canvas.fill();
                            canvas.beginPath();
                            canvas.arc(i, j, 0.1 * relativeMeter, 0, 2 * Math.PI, false);
                            canvas.fill();
                            canvas.beginPath();
                            canvas.arc(i, coordinates[1], 0.1 * relativeMeter, 0, 2 * Math.PI, false);
                            canvas.fill();
                            canvas.beginPath();
                            canvas.arc(coordinates[0], j, 0.1 * relativeMeter, 0, 2 * Math.PI, false);
                            canvas.fill();
                        } else {
                            // draw new room
                            canvas.beginPath();

                            for (let i = 0; i !== displayData.editMode.addRoom.corners.length; i++) {
                                point = getPointCoordinates(displayData.editMode.addRoom.corners[i].x, displayData.editMode.addRoom.corners[i].y);

                                if (i === 0)
                                    canvas.moveTo(point.x, point.y);
                                else
                                    canvas.lineTo(point.x, point.y);
                            }
                            canvas.lineTo(i, j);
                            canvas.fill();
                            canvas.stroke();

                            // draw new room corners
                            canvas.fillStyle = '#000';

                            for (let i = 0; i !== displayData.editMode.addRoom.corners.length; i++) {
                                point = getPointCoordinates(displayData.editMode.addRoom.corners[i].x, displayData.editMode.addRoom.corners[i].y);
                                canvas.beginPath();
                                canvas.arc(point.x, point.y, 0.1 * relativeMeter, 0, 2 * Math.PI, false);
                                canvas.fill();
                            }
                        }
                    }
                }
        }

        // draw corners anchors
        const cornerRadius = 0.15 * relativeMeter;
        canvas.fillStyle = '#FFF';

        for (const room of displayData.rooms) {
            if (room.floor === displayData.floor && (!moving.targetRoom || moving.targetRoom === room)) {
                const roomCoords = getRoomCoordinates(room);

                for (let i = 0; i !== roomCoords.length; i++) {
                    if (mouseX > roomCoords[i].x - cornerRadius && mouseX < roomCoords[i].x + cornerRadius && mouseY > roomCoords[i].y - cornerRadius && mouseY < roomCoords[i].y + cornerRadius) {
                        if (!moving.state)
                            canvas.fillStyle = '#000';
                        hoverCorner = { corner: i + 1, room: room };
                    } else
                        canvas.fillStyle = '#FFF';
                    canvas.beginPath();
                    canvas.arc(roomCoords[i].x, roomCoords[i].y, 0.15 * relativeMeter, 0, 2 * Math.PI, false);
                    canvas.fill();
                    canvas.stroke();
                }
            }
        }
    }

    // draw HUD service name
    canvas.lineWidth = 0.5;
    canvas.strokeStyle = 'white';
    canvas.fillStyle = 'black';
    canvas.textAlign = 'center';
    canvas.textBaseline = 'top';
    canvas.font = 'bold 42px sans-serif';
    let text = 'Service ' + displayData.serviceName;
    canvas.fillText(text, canv.width / 2, 30);
    canvas.strokeText(text, canv.width / 2, 30);

    // draw HUD floor
    canvas.lineWidth = 0.5;
    canvas.strokeStyle = 'white';
    canvas.fillStyle = 'black';
    canvas.textAlign = 'center';
    canvas.textBaseline = 'bottom';
    canvas.font = 'bold 42px sans-serif';
    text = getFloorName(displayData.floor);
    canvas.fillText(text, canv.width / 2, canv.height - 30);
    canvas.strokeText(text, canv.width / 2, canv.height - 30);

    // draw HUD zoom
    canvas.lineWidth = 1.2;
    canvas.strokeStyle = 'black';
    canvas.fillStyle = 'white';
    canvas.textAlign = 'right';
    canvas.textBaseline = 'top';
    canvas.font = 'bold 42px sans-serif';
    text = 'x' + displayData.scale.toFixed(2);
    canvas.fillText(text, canv.width - 30, 30);
    canvas.strokeText(text, canv.width - 30, 30);
    let relativePosition = [0, 0];

    // draw map HUD elements
    canvas.strokeStyle = 'white';
    for (const element of displayData.mapElements) {
        if (!element.edit || displayData.editMode.enabled) {
            relativePosition = getElementRelativePosition(element);

            // hover element
            if (element.onClick && mouseX > relativePosition.x && mouseX < relativePosition.x + element.size_x && mouseY > relativePosition.y && mouseY < relativePosition.y + element.size_y) {
                canvas.shadowColor = '#777';
                canvas.shadowBlur = 20;
                hoverElem = true;
            }
            canvas.fillStyle = '#afafaf';
            canvas.fillRect(relativePosition.x, relativePosition.y, element.size_x, element.size_y);
            canvas.strokeRect(relativePosition.x, relativePosition.y, element.size_x, element.size_y);
            canvas.fillStyle = 'white';
            canvas.shadowBlur = 0;
            // draw text if exists in object
            if (element.text) {
                canvas.textAlign = 'center';
                canvas.textBaseline = 'middle';
                canvas.font = 'bold ' + 24 + 'px sans-serif';
                canvas.fillText(element.text, relativePosition.x + element.size_x / 2, relativePosition.y + element.size_y / 2);
            }

            // custom drawing
            if (element.draw)
                element.draw(canvas);
        }
    }

    if (hoverCorner) {
        if (getRoomShape(hoverCorner.room) === 0) // rect
            canv.style.cursor = (hoverCorner.corner === 1) ? 'nw-resize' : (hoverCorner.corner === 2) ? 'ne-resize' : (hoverCorner.corner === 3) ? 'se-resize' : 'sw-resize';
        else
            canv.style.cursor = 'move';
    } else if (hoverElem)
        canv.style.cursor = 'pointer';
    else
        canv.style.cursor = 'default';
}

function getRectCoordinates(x, y, size_x, size_y) {
    return [
        center[0] + x * relativeMeter,
        center[1] + y * relativeMeter,
        size_x * relativeMeter,
        size_y * relativeMeter,
    ];
}

function getPointCoordinates(x, y) {
    return {
        x: center[0] + x * relativeMeter,
        y: center[1] + y * relativeMeter,
    };
}

function getRoomBounds(room) {
    return getBounds(getRoomCoordinates(room));
}

function getBounds(coordinates) {
    let values = {
        min: {
            x: 0,
            y: 0,
        },
        max: {
            x: 0,
            y: 0,
        }
    };

    if (coordinates.length === 0)
        return values;
    values.min.x = coordinates[0].x;
    values.min.y = coordinates[0].y;
    values.max.x = values.min.x;
    values.max.y = values.min.y;

    for (let i = 1; i !== coordinates.length; i++) {
        if (coordinates[i].x < values.min.x)
            values.min.x = coordinates[i].x;
        else if (coordinates[i].x > values.max.x)
            values.max.x = coordinates[i].x;

        if (coordinates[i].y < values.min.y)
            values.min.y = coordinates[i].y;
        else if (coordinates[i].y >values. max.y)
            values.max.y = coordinates[i].y;
    }
    return values;
}

function getMinimumRoomBounds(room) {
    let coords = Array(room.corners.length);

    for (let i = 0; i !== room.corners.length; i++)
        coords[i] = { x: room.position_x + room.corners[i].x, y: room.position_y + room.corners[i].y };

    return getMinimumBounds(coords);
}
// get bounds for text position
function getMinimumBounds(coordinates) {
    let largerBounds = getBounds(coordinates);

    if (coordinates.length === 0)
        return largerBounds;
    let bestRect = {
        pos: {x: 0, y: 0},
        size: {x: 0, y: 0},
    };

    // brute force every possible inner rect
    for (let x = largerBounds.min.x; x < largerBounds.max.x; x++) {
        for (let y = largerBounds.min.y; y < largerBounds.max.y; y++) {
            if ( !checkPointCollision(coordinates, [x, y]))
                continue;
            for (let sizeX = 1; x + sizeX <= largerBounds.max.x; sizeX++) {
                for (let sizeY = 1; y + sizeY <= largerBounds.max.y; sizeY++) {
                    // check if rect corners are inside the targeted room
                    if (checkPointCollision(coordinates, [x + sizeX, y]) && checkPointCollision(coordinates, [x + sizeX, y + sizeY]) && checkPointCollision(coordinates, [x, y + sizeY]) && sizeX > bestRect.size.x) {
                        bestRect.pos.x = x;
                        bestRect.pos.y = y;
                        bestRect.size.x = sizeX;
                        bestRect.size.y = sizeY;
                    }
                }
            }
        }
    }

    if (bestRect.size.x < 1)
        return largerBounds;

    return {
        min: {
            x: center[0] + bestRect.pos.x * relativeMeter,
            y: center[1] + bestRect.pos.y * relativeMeter,
        },
        max: {
            x: center[0] + (bestRect.pos.x + bestRect.size.x) * relativeMeter,
            y: center[1] + (bestRect.pos.y + bestRect.size.y) * relativeMeter,
        }
    };
}

function getRoomCoordinates(room) {
    let relativeCoord = Array(room.corners.length);

    for (let i = 0; i !== room.corners.length; i++) {
        relativeCoord[i] = {
            x: center[0] + (room.position_x + room.corners[i].x) * relativeMeter,
            y: center[1] + (room.position_y + room.corners[i].y) * relativeMeter,
        };
    }
    return relativeCoord;
}

function getRoomCenter(room) {
    if (room.corners.length === 0)
        return [0, 0];
    const bounds = getMinimumRoomBounds(room);

    return [(bounds.min.x + bounds.max.x) / 2, (bounds.min.y + bounds.max.y) / 2];
}

function getShape(coords) {
    return getRoomShape({ corners: coords });
}

function getRoomShape(room) {

    if (room.corners.length !== 4)
        return 1; // free shape
    const bounds = getBounds(room.corners);
    /*
    check if it is a rectangle without checking corners order
    for (let i = 1; i !== room.corners.length; i++) {
        if ((room.corners[i].x !== bounds.min.x && room.corners[i].x !== bounds.max.x)
        || (room.corners[i].y !== bounds.min.y && room.corners[i].y !== bounds.max.y))
            return 1; // free shape
    }*/

    if (room.corners[0].x === bounds.min.x && room.corners[0].y === bounds.min.y
    && room.corners[1].x === bounds.max.x && room.corners[1].y === bounds.min.y
    && room.corners[2].x === bounds.max.x && room.corners[2].y === bounds.max.y
    && room.corners[3].x === bounds.min.x && room.corners[3].y === bounds.max.y) {
        return 0; // ordered rect
    }

    return 1; // free shape
}

// https://stackoverflow.com/questions/217578/how-can-i-determine-whether-a-2d-point-is-within-a-polygon
/*function checkPointCollision(roomCoords, point) {
    const bounds = getBounds(roomCoords);

    if (point[0] > bounds.min.x && point[0] < bounds.max.x && point[1] > bounds.min.y && point[1] < bounds.max.y)
        return true;
    else
        return false;
}*/

function checkPointCollision(roomCoords, point) {
    const bounds = getBounds(roomCoords);

    if (point[0] < bounds.min.x || point[0] > bounds.max.x || point[1] < bounds.min.y || point[1] > bounds.max.y)
        return false;
    let intersect = false;
    const shape = getShape(roomCoords);

    for (let i = 0, j = roomCoords.length - 1; i < roomCoords.length; j = i++) {
        if (shape === 0) { // rect
            if (((roomCoords[i].y >= point[1]) != (roomCoords[j].y > point[1])) && (point[0] <= (roomCoords[j].x - roomCoords[i].x) * (point[1] - roomCoords[i].y) / (roomCoords[j].y - roomCoords[i].y) + roomCoords[i].x))
                intersect = !intersect;
        } else if (((roomCoords[i].y >= point[1]) != (roomCoords[j].y >= point[1])) && (point[0] < (roomCoords[j].x - roomCoords[i].x) * (point[1] - roomCoords[i].y) / (roomCoords[j].y - roomCoords[i].y) + roomCoords[i].x))
            intersect = !intersect;
    }
    return intersect;
}
/*
    for (let i = 0; i !== roomCoords.length; i++) {
        intersects += areIntersecting([
            [{x: point[0], y: point[1]}, {x: point.x, y: -100000}],
            [roomCoords[i], roomCoords[(i + 1) % roomCoords.length]],
        ]);
    }
console.error(intersects);
    return (intersects % 2) === 0;*/
/*
function areIntersecting(vectors) {
    let d1, d2;
    let a1, a2, b1, b2, c1, c2;

    // Convert vector 1 to a line (line 1) of infinite length.
    // We want the line in linear equation standard form: A*x + B*y + C = 0
    // See: http://en.wikipedia.org/wiki/Linear_equation
    a1 = vectors[0][1].y - vectors[0][0].y;
    b1 = vectors[0][0].x - vectors[0][1].x;
    c1 = (vectors[0][1].x * vectors[0][0].y) - (vectors[0][0].x * vectors[0][1].y);

    // Every point (x,y), that solves the equation above, is on the line,
    // every point that does not solve it, is not. The equation will have a
    // positive result if it is on one side of the line and a negative one
    // if is on the other side of it. We insert (x1,y1) and (x2,y2) of vector
    // 2 into the equation above.
    d1 = (a1 * vectors[1][0].x) + (b1 * vectors[1][0].y) + c1;
    d2 = (a1 * vectors[1][1].x) + (b1 * vectors[1][1].y) + c1;

    // If d1 and d2 both have the same sign, they are both on the same side
    // of our line 1 and in that case no intersection is possible. Careful,
    // 0 is a special case, that's why we don't test ">=" and "<=",
    // but "<" and ">".
    if (d1 > 0 && d2 > 0)
        return 0;
    if (d1 < 0 && d2 < 0)
        return 0;

    // The fact that vector 2 intersected the infinite line 1 above doesn't
    // mean it also intersects the vector 1. Vector 1 is only a subset of that
    // infinite line 1, so it may have intersected that line before the vector
    // started or after it ended. To know for sure, we have to repeat the
    // the same test the other way round. We start by calculating the
    // infinite line 2 in linear equation standard form.
    a2 = vectors[1][1].y - vectors[1][0].y;
    b2 = vectors[1][0].x - vectors[1][1].x;
    c2 = (vectors[1][1].x * vectors[1][0].y) - (vectors[1][0].x * vectors[1][1].y);

    // Calculate d1 and d2 again, this time using points of vector 1.
    d1 = (a2 * vectors[0][0].x) + (b2 * vectors[0][0].y) + c2;
    d2 = (a2 * vectors[0][1].x) + (b2 * vectors[0][1].y) + c2;

    // Again, if both have the same sign (and neither one is 0),
    // no intersection is possible.
    if (d1 > 0 && d2 > 0)
        return 0;
    if (d1 < 0 && d2 < 0)
        return 0;

    // If we get here, only two possibilities are left. Either the two
    // vectors intersect in exactly one point or they are collinear, which
    // means they intersect in any number of points from zero to infinite.
/*    if ((a1 * b2) - (a2 * b1) == 0.0f)
        return true;

    // If they are not collinear, they must intersect in exactly one point.
    return 1;
}*/

function getRoomTypeColor(type, hidden) {

    if (hidden)
        return '#ebc8c8';

    switch (type) {
        case 0: // edit mode - new room
            return '#0000007D';
        case 1: // neutral
            return '#afafaf';
        case 2: // room
            return '#ffb637';
        case 3: // surgery
            return '#4a9eff';
        case 4: // consultation
            return '#44cf60';
        case 5: // waiting room
            return '#de5daa ';
        default:
            return '#afafaf';
    }
}

function getRoomImage(type) {
    switch (type) {
        case 2: // room
            return images.bed;
        case 3: // surgery
            return images.surgery;
        case 4: // consultation
            return images.consultation;
        case 5: // waiting room
            return images.waiting;
    }
    return null;
}

// return position of a given element related to its gravity and canvas size
function getElementRelativePosition(element) {
    let position = {
        x: 0,
        y: 0,
    };

    switch (element.gravity[1]) {
        case gravity.RIGHT:
            position.x = canv.width - element.position_x - element.size_x;
            break;
        case gravity.CENTER:
            position.x = canv.width / 2 - element.size_x / 2 - element.position_x;
            break;
        default:
            position.x = element.position_x;
    }

    switch (element.gravity[0]) {
        case gravity.BOTTOM:
            position.y =canv.height - element.position_y - element.size_y;
            break;
        case gravity.CENTER:
            position.y = canv.height / 2 - element.size_y / 2 - element.position_y;
            break;
        default:
            position.y = element.position_y;
    }
    return position;
}

function beginPlanMove(e) {
    mouseClickTime = new Date();

    if (displayData.editMode.enabled) {
        const mouseX = e.layerX * 2;
        const mouseY = e.layerY * 2;
        let roomCoords, coords;
        const cornerRadius = 0.15 * relativeMeter;

        // check if room corner should be moved, resize
        for (let i = displayData.rooms.length - 1; i !== -1; i--) {
            if (displayData.rooms[i].floor === displayData.floor) {
                roomCoords = {x: displayData.rooms[i].position_x * relativeMeter, y: displayData.rooms[i].position_y * relativeMeter};

                for (let j = 0; j !== displayData.rooms[i].corners.length; j++) {
                    coords = getPointCoordinates(displayData.rooms[i].corners[j].x, displayData.rooms[i].corners[j].y);

                    if (mouseX > roomCoords.x + coords.x - cornerRadius && mouseX < roomCoords.x + coords.x + cornerRadius && mouseY > roomCoords.y + coords.y - cornerRadius && mouseY < roomCoords.y + coords.y + cornerRadius) {
                        moving.corner = j + 1;
                        moving.targetRoom = displayData.rooms[i];
                        moving.initialCorners = moving.targetRoom.corners.map(corner => {return {...corner}});
                        moving.state = 3;
                        break;
                    }
                }
            }
        }

        // check if room should be moved
        if ( !moving.state) {
            for (let i = displayData.rooms.length - 1; i !== -1; i--) {
                if (displayData.rooms[i].floor === displayData.floor) {
                    roomCoords = getRoomCoordinates(displayData.rooms[i]);

                    if (checkPointCollision(roomCoords, [mouseX, mouseY])) {
                        moving.targetRoom = displayData.rooms[i];
                        moving.initialPosition.x = moving.targetRoom.position_x;
                        moving.initialPosition.y = moving.targetRoom.position_y;
                        moving.state = 2;
                        break;
                    }
                }
            }
        }
    }

    if ( !moving.targetRoom) {
        moving.initialPosition.x = displayData.position[0];
        moving.initialPosition.y = displayData.position[1];
        moving.state = 1;
    }
    moving.mousePosition.x = e.x;
    moving.mousePosition.y = e.y;
}

function endPlanMove() {

    if (new Date() - mouseClickTime < 200) {
        // short click
        resetMovingData();
    } else if (moving.targetRoom) {
        if (checkRoomOverlap(moving.targetRoom)) {
            let updateData = {
                id: moving.targetRoom.id,
                position_x: moving.targetRoom.position_x,
                position_y: moving.targetRoom.position_y,
            }

            if (moving.state === 3) {
                updateData.corners = convertCorners(moving.targetRoom.corners);
            }

            apiUpdate('rooms', updateData, function() {
                resetMovingData();
                draw();
            }, function() {

                if (moving.state === 3) {
                    moving.targetRoom.corners = moving.initialCorners;
                } else {
                    moving.targetRoom.position_x = moving.initialPosition.x;
                    moving.targetRoom.position_y = moving.initialPosition.y;
                }
                resetMovingData();
                draw();
            });
            resetMovingData();

        } else {
            if (moving.state === 3) {
                moving.targetRoom.corners = moving.initialCorners;
            } else {
                moving.targetRoom.position_x = moving.initialPosition.x;
                moving.targetRoom.position_y = moving.initialPosition.y;
            }
            customAlert(MSG_ERROR, "Vous ne pouvez pas superposer les salles", WARNING);
            resetMovingData();
            draw();
        }
    } else
        resetMovingData();
}

function resetMovingData() {
    moving.state = 0;
    moving.corner = 0;
    moving.targetRoom = null;
}

function planMouseMove(e) {

    if (frameReady) {
        frameReady = false;

        switch (moving.state) {
            case 1:
                // moving the plan
                displayData.position[0] = moving.initialPosition.x + (e.x - moving.mousePosition.x) * 2;
                displayData.position[1] = moving.initialPosition.y + (e.y - moving.mousePosition.y) * 2;

                const mapBorders = [-mapLimits[0] * relativeMeter, -mapLimits[1] * relativeMeter, mapLimits[0] * relativeMeter, mapLimits[1] * relativeMeter]; // left, top, right, bottom

                if (displayData.position[0] < mapBorders[0])
                    displayData.position[0] = mapBorders[0];
                else if (displayData.position[0] > mapBorders[2])
                    displayData.position[0] = mapBorders[2];

                if (displayData.position[1] < mapBorders[1])
                    displayData.position[1] = mapBorders[1];
                else if (displayData.position[1] > mapBorders[3])
                    displayData.position[1] = mapBorders[3];
                break;
            case 2:
                // moving a room
                moving.targetRoom.position_x = moving.initialPosition.x + Math.round((e.x - moving.mousePosition.x) * 2 / relativeMeter);
                moving.targetRoom.position_y = moving.initialPosition.y + Math.round((e.y - moving.mousePosition.y) * 2 / relativeMeter);
                break;
            case 3:
                // moving a corner
                if (getRoomShape(moving.targetRoom) === 0) { // rect
                    switch (moving.corner) {
                        case 1:
                            moving.targetRoom.corners[0].x = moving.initialCorners[0].x + Math.round((e.x - moving.mousePosition.x) * 2 / relativeMeter);
                            moving.targetRoom.corners[0].y = moving.initialCorners[0].y + Math.round((e.y - moving.mousePosition.y) * 2 / relativeMeter);
                            moving.targetRoom.corners[1].y = moving.initialCorners[1].y + Math.round((e.y - moving.mousePosition.y) * 2 / relativeMeter);
                            moving.targetRoom.corners[3].x = moving.initialCorners[3].x + Math.round((e.x - moving.mousePosition.x) * 2 / relativeMeter);
                            break;
                        case 2:
                            moving.targetRoom.corners[1].x = moving.initialCorners[1].x + Math.round((e.x - moving.mousePosition.x) * 2 / relativeMeter);
                            moving.targetRoom.corners[1].y = moving.initialCorners[1].y + Math.round((e.y - moving.mousePosition.y) * 2 / relativeMeter);
                            moving.targetRoom.corners[0].y = moving.initialCorners[0].y + Math.round((e.y - moving.mousePosition.y) * 2 / relativeMeter);
                            moving.targetRoom.corners[2].x = moving.initialCorners[2].x + Math.round((e.x - moving.mousePosition.x) * 2 / relativeMeter);
                            break;
                        case 3:
                            moving.targetRoom.corners[2].x = moving.initialCorners[2].x + Math.round((e.x - moving.mousePosition.x) * 2 / relativeMeter);
                            moving.targetRoom.corners[2].y = moving.initialCorners[2].y + Math.round((e.y - moving.mousePosition.y) * 2 / relativeMeter);
                            moving.targetRoom.corners[3].y = moving.initialCorners[3].y + Math.round((e.y - moving.mousePosition.y) * 2 / relativeMeter);
                            moving.targetRoom.corners[1].x = moving.initialCorners[1].x + Math.round((e.x - moving.mousePosition.x) * 2 / relativeMeter);
                            break;
                        case 4:
                            moving.targetRoom.corners[3].x = moving.initialCorners[3].x + Math.round((e.x - moving.mousePosition.x) * 2 / relativeMeter);
                            moving.targetRoom.corners[3].y = moving.initialCorners[3].y + Math.round((e.y - moving.mousePosition.y) * 2 / relativeMeter);
                            moving.targetRoom.corners[2].y = moving.initialCorners[2].y + Math.round((e.y - moving.mousePosition.y) * 2 / relativeMeter);
                            moving.targetRoom.corners[0].x = moving.initialCorners[0].x + Math.round((e.x - moving.mousePosition.x) * 2 / relativeMeter);
                            break;
                    }

                    if (moving.targetRoom.corners[1].x - moving.targetRoom.corners[0].x < 1) {
                        if (moving.corner === 2 || moving.corner === 3) {
                            moving.targetRoom.corners[1].x = moving.targetRoom.corners[0].x + 1;
                            moving.targetRoom.corners[2].x = moving.targetRoom.corners[0].x + 1;
                        } else {
                            moving.targetRoom.corners[0].x = moving.targetRoom.corners[1].x - 1;
                            moving.targetRoom.corners[3].x = moving.targetRoom.corners[1].x - 1;
                        }
                    }

                    if (moving.targetRoom.corners[3].y - moving.targetRoom.corners[0].y < 1) {
                        if (moving.corner === 1 || moving.corner === 2) {
                            moving.targetRoom.corners[0].y = moving.targetRoom.corners[3].y - 1;
                            moving.targetRoom.corners[1].y = moving.targetRoom.corners[3].y - 1;
                        } else {
                            moving.targetRoom.corners[2].y = moving.targetRoom.corners[0].y + 1;
                            moving.targetRoom.corners[3].y = moving.targetRoom.corners[0].y + 1;
                        }
                    }
                } else { // free shape
                    moving.targetRoom.corners[moving.corner - 1].x = moving.initialCorners[moving.corner - 1].x + Math.round((e.x - moving.mousePosition.x) * 2 / relativeMeter);
                    moving.targetRoom.corners[moving.corner - 1].y = moving.initialCorners[moving.corner - 1].y + Math.round((e.y - moving.mousePosition.y) * 2 / relativeMeter);
                }
                break;
        }
        draw(e.layerX * 2, e.layerY * 2);

        // wait for the next frame
        window.requestAnimationFrame(function() {
            frameReady = true;
        });
    }
};

function planMouseZoom(e) {

    const delta = (e.delta || e.wheelDelta) / 1000;
    const lastScale = displayData.scale;
//const delta = (e.delta || e.wheelDelta) > 0 ? 1 : -1;
    displayData.scale += delta;

    if (displayData.scale < zoomLimits[0])
        displayData.scale = zoomLimits[0];
    else if (displayData.scale > zoomLimits[1])
        displayData.scale = zoomLimits[1];

    const zoomCoeff = displayData.scale / lastScale;

    // move displayData.position while zooming
    const mouseX = e.layerX * 2;
    const mouseY = e.layerY * 2;

    // zoom on mouse position
    displayData.position[0] = displayData.position[0] * zoomCoeff - (canv.width / 2 * (zoomCoeff - 1) * (mouseX / canv.width * 2 - 1));
    displayData.position[1] = displayData.position[1] * zoomCoeff - (canv.height / 2 * (zoomCoeff - 1) * (mouseY / canv.height * 2 - 1));

    // zoom center screen
    // displayData.position[0] *= zoomCoeff;
    // displayData.position[1] *= zoomCoeff;

    updateZoomWidget();
    draw();
    e.preventDefault();
}

function updateZoomWidget() {
    const verticalBar = getMapElementById('zoom_vertical_bar');
    const horizontalBar = getMapElementById('zoom_horizontal_bar');

    horizontalBar.position_y = verticalBar.position_y + verticalBar.size_y - verticalBar.size_y * ((displayData.scale - zoomLimits[0]) / (zoomLimits[1] - zoomLimits[0]));
}

function planClicked(e) {

    // movement detected, cancel click
    if (moving.state && e.x !== moving.mousePosition.x || e.y !== moving.mousePosition.y)
        return;

    const mouseX = e.layerX * 2;
    const mouseY = e.layerY * 2;
    let relativePosition, roomCoords;

    // map HUD
    for (const element of displayData.mapElements) {
        if (!element.edit || displayData.editMode.enabled) {
            relativePosition = getElementRelativePosition(element);

            if (element.onClick && mouseX > relativePosition.x && mouseX < relativePosition.x + element.size_x && mouseY > relativePosition.y && mouseY < relativePosition.y + element.size_y) {
                element.onClick(element, mouseX, mouseY);
                return;
            }
        }
    }

    // map rooms
    for (const room of displayData.rooms) {
        if (room.floor === displayData.floor && !displayData.editMode.addRoom) {
            roomCoords = getRoomCoordinates(room);

            if (checkPointCollision(roomCoords, [mouseX, mouseY])) {
                if (displayData.editMode.enabled)
                    editRoom(room);
                else
                    targetRoom(room);
                return;
            }
        }
    }

    if (displayData.editMode.enabled) {
        const displayArea = getDisplayedArea();

        if (displayData.editMode.addRoom && displayData.editMode.addRoom.corners) {
            for (let i = displayArea.left; i < displayArea.right; i += relativeMeter)
                for (let j = displayArea.top; j < displayArea.bottom; j += relativeMeter) {
                    // check if mouse hovers the anchor
                    if (mouseX > i - relativeMeter * 0.5
                    && mouseX < i + relativeMeter * 0.5
                    && mouseY > j - relativeMeter * 0.5
                    && mouseY < j + relativeMeter * 0.5) {
                        const newAnchor = getPointCoordinatesFromPixels(i, j);

                        if (displayData.editMode.roomShape === 0) {
                            let bounds = {
                                min: {
                                    x: displayData.editMode.addRoom.corners[0].x,
                                    y: displayData.editMode.addRoom.corners[0].y,
                                },
                                max: {
                                    x: displayData.editMode.addRoom.corners[0].x,
                                    y: displayData.editMode.addRoom.corners[0].y,
                                },
                            }

                            if (newAnchor.x <= bounds.min.x)
                                bounds.min.x = newAnchor.x;
                            else
                                bounds.max.x = newAnchor.x;

                            if (newAnchor.y <= bounds.min.y)
                                bounds.min.y = newAnchor.y;
                            else
                                bounds.max.y = newAnchor.y;

                            displayData.editMode.addRoom.corners = [
                                {x: bounds.min.x, y: bounds.min.y},
                                {x: bounds.max.x, y: bounds.min.y},
                                {x: bounds.max.x, y: bounds.max.y},
                                {x: bounds.min.x, y: bounds.max.y},
                            ];

                            if (displayData.editMode.addRoom.unsizedRoomID) // set room size
                                addUnsizedRoom();
                            else // new room
                                addRoom();
                            delete displayData.editMode.addRoom;
                            draw();
                        } else {
                            let closePath = false;

                            for (const corner of displayData.editMode.addRoom.corners) {
                                if (corner.x === newAnchor.x && corner.y === newAnchor.y) {
                                    closePath = true;
                                    break;
                                }
                            }

                            if ( !closePath) {
                                displayData.editMode.addRoom.corners.push(newAnchor);
                                return;
                            }

                            if (displayData.editMode.addRoom.unsizedRoomID) // set room size
                                addUnsizedRoom();
                            else // new room
                                addRoom();
                            delete displayData.editMode.addRoom;
                            draw();
                        }
                    }
                }
        } else {
            for (let i = displayArea.left; i < displayArea.right; i += relativeMeter)
                for (let j = displayArea.top; j < displayArea.bottom; j += relativeMeter) {
                    if (mouseX > i - relativeMeter * 0.5
                    && mouseX < i + relativeMeter * 0.5
                    && mouseY > j - relativeMeter * 0.5
                    && mouseY < j + relativeMeter * 0.5) {
                        if ( !displayData.editMode.addRoom)
                            displayData.editMode.addRoom = {};
                        displayData.editMode.addRoom.corners = [getPointCoordinatesFromPixels(i, j)];
                        return;
                    }
                }
        }
    }
}

function getPointCoordinatesFromPixels(x, y) {
    return {
         x: Math.round((x - center[0]) / relativeMeter),
         y: Math.round((y - center[1]) / relativeMeter),
    };
}

function targetRoom(room) {
    const background = document.getElementById('plan-popup-background');
    const popup = document.getElementById('plan-room');

    displayData.targetRoom = room;
    background.style.display = 'block';
    popup.style.display = 'flex';

    document.getElementById('plan-room-link').href = '/rooms?id=' + room.id;
    popup.getElementsByTagName('h1')[0].textContent = room.title;

    refreshRoomBeds();
    refreshRoomInventory();
}


function refreshRoomBeds() {
    const popup = document.getElementById('plan-room');
    const beds = popup.getElementsByClassName('beds')[0];

    beds.innerHTML = '';

    for (let i = 0; i < displayData.targetRoom.capacity || i < displayData.targetRoom.patients.length; i++) {
        const bed = document.createElement('div');
        const pillow = document.createElement('div');
        const link = document.createElement('a');

        pillow.classList.add('pillow');

        // bed is not empty
        if (i < displayData.targetRoom.patients.length) {
            bed.setAttribute('patient-id', displayData.targetRoom.patients[i].id);
            link.href = '/patients?patientId=' + displayData.targetRoom.patients[i].id;
            link.innerHTML = displayData.targetRoom.patients[i].lastname + '<br>' + displayData.targetRoom.patients[i].firstname;

            const removeBtn = document.createElement('img');
            removeBtn.src = '/images/remove_circle_black_24dp.svg';
            removeBtn.addEventListener('click', removePatientFromRoom);
            link.appendChild(removeBtn);
        } else {
            bed.classList.add('empty');
            link.innerHTML = 'Place disponible';
            link.addEventListener('click', addPatient);
        }
        bed.appendChild(pillow);
        bed.appendChild(link);

        if (i < displayData.targetRoom.patients.length) {
            const transfer = document.createElement('button');
            transfer.innerText = 'Transférer';
            transfer.classList.add('add');
            transfer.classList.add('transfer');
            transfer.addEventListener('click', transferPatient);
            bed.appendChild(transfer);
        }
        beds.appendChild(bed);
    }

    // update patient count
    const capacity = document.getElementById('plan-room-capacity');
    capacity.innerText = displayData.targetRoom.patients.length + '/' + displayData.targetRoom.capacity;

    if (displayData.targetRoom.patients.length > displayData.targetRoom.capacity)
        capacity.classList.add('full');
    else
        capacity.classList.remove('full');
}

function refreshRoomInventory() {
    const popup = document.getElementById('plan-room');
    const inventory = popup.getElementsByClassName('inventory')[0].children[2];

    inventory.innerHTML = '';

    for (const object of displayData.targetRoom.inventory) {
        const div = document.createElement('div');
        const btnSwap = document.createElement('img');
        const btnDelete = document.createElement('img');
        const a = document.createElement('a');

        div.setAttribute('inventory-id', object.id);
        a.href = '/inventory?id=' + object.id;
        a.innerText = object.title;
        btnSwap.src = '/images/swap_horiz_white.svg';
        btnDelete.src = '/images/delete_white.svg';
        btnSwap.addEventListener('click', transferInventoryObject);
        btnDelete.addEventListener('click', deleteInventoryObject);
        div.appendChild(a);
        div.appendChild(btnDelete);
        div.appendChild(btnSwap);
        inventory.appendChild(div);
    }
}

function closePopup() {
    document.getElementById('plan-popup-background').style.display = 'none';
    document.getElementById('plan-room').style.display = 'none';
    document.getElementById('plan-add-room').style.display = 'none';
    document.getElementById('plan-unsized-rooms').style.display = 'none';
    closeInventoryPopup();
    closePatientPopup();
    draw();

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
    patientBirthdate.value = '';
}

function closeInventoryPopup() {
    document.getElementById('plan-create-inventory').style.display = 'none';
    document.getElementById('plan-add-inventory').style.display = 'none';
    document.getElementById('plan-transfer-inventory').style.display = 'none';
    const inventoryType = document.getElementById('inventory-type');
    const inventoryName = document.getElementById('inventory-name');

    inventoryName.value = '';
    inventoryType.selectedIndex = 0;
}

function closePatientPopup() {
    document.getElementById('plan-create-patient').style.display = 'none';
    document.getElementById('plan-add-patient').style.display = 'none';
    document.getElementById('plan-transfer-patient').style.display = 'none';
}

function planMouseOut() {

    if (moving.state)
        endPlanMove();
}

function getMapElementById(id) {
    for (const element of displayData.mapElements) {
        if (element.id === id) {
            return element;
        }
    }
    return null;
}

function clickZoomVerticalBar(elem, mouseX, mouseY) {
    const verticalBar = elem;
    const horizontalBar = getMapElementById('zoom_horizontal_bar');
    const lastScale = displayData.scale;

    displayData.scale += ((mouseY < horizontalBar.position_y) ? 1 : -1) * 0.25;

    if (displayData.scale < zoomLimits[0])
        displayData.scale = zoomLimits[0];
    else if (displayData.scale > zoomLimits[1])
        displayData.scale = zoomLimits[1];

    const zoomCoeff = displayData.scale / lastScale;

    // move displayData.position while zooming
    displayData.position[0] *= zoomCoeff;
    displayData.position[1] *= zoomCoeff;

    updateZoomWidget();
    draw();
}

function planKeyDown(e) {

    if (displayData.editMode.enabled) {
        // cancel room creation
        if (e.keyCode === 27) { // escape
            e.preventDefault();

            if (displayData.editMode.addRoom)
                delete displayData.editMode.addRoom;
            else if (moving.state)
                switch (moving.state) {
                    case 2:
                        moving.targetRoom.position_x = moving.initialPosition.x;
                        moving.targetRoom.position_y = moving.initialPosition.y;
                        resetMovingData();
                        break;
                    case 3:
                        moving.targetRoom.corners = moving.initialCorners;
                        resetMovingData();
                        break;
                }
            else
                enableEditMode()
            draw();
        }
    }
}

initPlan();
window.addEventListener('resize', draw);
canv.addEventListener('mousedown', beginPlanMove);
canv.addEventListener('mouseup', endPlanMove);
canv.addEventListener('mousemove', planMouseMove);
canv.addEventListener('wheel', planMouseZoom);
canv.addEventListener('mouseout', planMouseOut);
canv.addEventListener('click', planClicked);
document.addEventListener('keydown', planKeyDown);

function enableEditMode() {
    const editButton = getMapElementById('edit_map');

    displayData.editMode.enabled = !displayData.editMode.enabled;

    if ( !displayData.editMode.enabled) {
        delete displayData.editMode.addRoom;
        resetMovingData();
    }
    editButton.text = displayData.editMode.enabled ? 'Mode édition' : 'Mode pratique';
    draw();
}

function drawCircle(ctx, x, y, radius, fill, stroke, strokeWidth) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI, false);

    if (fill) {
        ctx.fillStyle = fill
        ctx.fill()
    }
    if (stroke) {
        ctx.lineWidth = strokeWidth
        ctx.strokeStyle = stroke
        ctx.stroke()
    }
}

function checkRoomOverlap(targetRoom) {
    const targetBounds = getRoomBounds(targetRoom);
    const shape = getRoomShape(targetRoom);
    let bounds, collisionX, collisionY;

    if (targetRoom.corners.length !== 4)
        return true; // disable custom shape collision

    for (const room of displayData.rooms) {
        if (targetRoom !== room && room.floor === displayData.floor && room.corners.length === 4) {
            bounds = (shape === 0 ? getRoomBounds(room) : getMinimumRoomBounds(room));

            // is there a gap on x nor y axis
            if ((targetBounds.min.x >= bounds.max.x)
            || (targetBounds.max.x <= bounds.min.x)
            || (targetBounds.min.y >= bounds.max.y)
            || (targetBounds.max.y <= bounds.min.y)) {
                continue;
            }
            collisionX = false;
            collisionY = false;

            // is there a collision
            // X axis
            if ((targetBounds.min.x > bounds.min.x && targetBounds.min.x < bounds.max.x)
            || (targetBounds.max.x > bounds.min.x && targetBounds.max.x < bounds.max.x)
            || (targetBounds.min.x <= bounds.min.x && targetBounds.max.x >= bounds.max.x)) {
                collisionX = true;
            }

            if ( !collisionX)
                continue;

            // Y axis
            if ((targetBounds.min.y > bounds.min.y && targetBounds.min.y < bounds.max.y)
            || (targetBounds.max.y > bounds.min.y && targetBounds.max.y < bounds.max.y)
            || (targetBounds.min.y <= bounds.min.y && targetBounds.max.y >= bounds.max.y)) {
                collisionY = true;
            }

            if (collisionY)
                return false;
        }
    }
    return true;
}

function convertCorners(corners) {
    let cornersArr = [];

    for (const corner of corners) {
        cornersArr.push(corner.x + ',' + corner.y);
    }
    return cornersArr.join(';');
}

function addRoom() {
    // check room isn't drawn over another one
    if ( !checkRoomOverlap(displayData.editMode.addRoom)) {
        customAlert(MSG_ERROR, "Vous ne pouvez pas superposer les salles", WARNING);
        return;
    }

    displayData.editMode.newRoom = {
        position_x: 0,
        position_y: 0,
        corners: convertCorners(displayData.editMode.addRoom.corners),
        service_id: displayData.serviceID,
        floor: displayData.floor
    };
    const background = document.getElementById('plan-popup-background');
    const popup = document.getElementById('plan-add-room');
    const buttonsDiv = popup.getElementsByClassName('buttons')[0];
    const roomName = document.getElementById('room-name');
    const roomCapacity = document.getElementById('room-capacity');
    const roomTypes = document.getElementById('room-type');
    const roomSupervisors = document.getElementById('room-supervisor');
    const buttonSave = document.createElement('button');

    popup.getElementsByTagName('h1')[0].textContent = 'Ajouter une salle';
    buttonsDiv.innerHTML = '';
    buttonSave.innerText = 'Créer';
    buttonSave.classList.add('add');
    buttonSave.addEventListener('click', createRoom);
    buttonsDiv.appendChild(buttonSave);

    background.style.display = 'block';
    popup.style.display = 'block';
    roomName.value = '';
    roomCapacity.value = 1;
    setSelectValue(roomTypes, 2);
    setSelectValue(roomSupervisors, -1);
}

function createRoom() {
    const roomTypes = document.getElementById('room-type');
    const roomSupervisors = document.getElementById('room-supervisor');
    const roomName = document.getElementById('room-name');
    const roomCapacity = document.getElementById('room-capacity');
    let newRoom = displayData.editMode.newRoom;

    newRoom.title = roomName.value;
    newRoom.type = parseInt(roomTypes.options[roomTypes.selectedIndex].value);
    newRoom.capacity = parseInt(roomCapacity.value);
    newRoom.supervisor = parseInt(roomSupervisors.options[roomSupervisors.selectedIndex].value);

    if (!newRoom.supervisor)
        delete newRoom.supervisor;
    closePopup();

    if (newRoom.title === '') {
        customAlert(MSG_ERROR, 'Vous devez renseigner un nom de salle', WARNING);
        return;
    }

    apiPost('rooms', newRoom, function(response) {
        response.json().then(function(data) {
            // newRoom.id = data.id;
            fetch('/api/rooms?unsized=false&service_id=' + displayData.serviceID).then(function(response) {
                if (response.status >= 200 && response.status < 300)
                    response.json().then(function (data) {
                        displayData.rooms = data;
                        delete displayData.editMode.newRoom;
                        draw();
                    });
                else {
                    delete displayData.editMode.newRoom;
                    customAlert(MSG_ERROR, MSG_RETRY, WARNING);
                }
            });
        });
    }, function() {
        delete displayData.editMode.newRoom;
    });
}

function editRoom(room) {
    displayData.targetRoom = room;

    const background = document.getElementById('plan-popup-background');
    const popup = document.getElementById('plan-add-room');
    const buttonsDiv = popup.getElementsByClassName('buttons')[0];
    const roomName = document.getElementById('room-name');
    const roomCapacity = document.getElementById('room-capacity');
    const roomTypes = document.getElementById('room-type');
    const roomSupervisors = document.getElementById('room-supervisor');
    const buttonSave = document.createElement('button');
    const buttonResetPos = document.createElement('button');
    const buttonDelete = document.createElement('button');

    popup.getElementsByTagName('h1')[0].textContent = 'Modifier ' + room.title;
    buttonsDiv.innerHTML = '';
    buttonSave.innerText = 'Sauvegarder';
    buttonSave.classList.add('add');
    buttonSave.addEventListener('click', saveRoom);
    buttonsDiv.appendChild(buttonSave);

    buttonResetPos.innerText = 'Réinitialiser la position';
    buttonResetPos.classList.add('add');
    buttonResetPos.addEventListener('click', resetRoomPosition);
    buttonsDiv.appendChild(buttonResetPos);

    buttonDelete.innerText = 'Supprimer';
    buttonDelete.classList.add('reset');
    buttonDelete.addEventListener('click', function() {
        deleteRoom(room.id);
        closePopup();
    });
    buttonsDiv.appendChild(buttonDelete);

    background.style.display = 'block';
    popup.style.display = 'block';
    roomName.value = room.title;
    roomCapacity.value = room.capacity;
    setSelectValue(roomTypes, room.type.id);
    setSelectValue(roomSupervisors, room.supervisor);
}

function saveRoom() {
    const roomTypes = document.getElementById('room-type');
    const roomSupervisors = document.getElementById('room-supervisor');
    const roomName = document.getElementById('room-name');
    const roomCapacity = document.getElementById('room-capacity');

    let updateData = {
        id: displayData.targetRoom.id,
        title: roomName.value,
        type: parseInt(roomTypes.options[roomTypes.selectedIndex].value),
        capacity: parseInt(roomCapacity.value),
        supervisor: parseInt(roomSupervisors.options[roomSupervisors.selectedIndex].value),
    }

    if (!updateData.supervisor)
        delete updateData.supervisor;
    closePopup();

    if (updateData.title === '') {
        customAlert(MSG_ERROR, 'Vous devez renseigner un nom de salle', WARNING);
        displayData.targetRoom = null;
        return;
    }

    apiUpdate('rooms', updateData, function() {
        displayData.targetRoom.title = updateData.title;
        displayData.targetRoom.type = {
            id: updateData.type,
            display_name: getRoomTypeName(updateData.type)
        };
        displayData.targetRoom.capacity = updateData.capacity;

        if (updateData.supervisor)
            displayData.targetRoom.supervisor = updateData.supervisor;
        displayData.targetRoom = null;
        draw();
    }, function() {
        displayData.targetRoom = null;
    });
}

function resetRoomPosition() {
    const updateData = {
        id: displayData.targetRoom.id,
        position_x: 0,
        position_y: 0,
        corners: '',
    }
    closePopup();

    apiUpdate('rooms', updateData, function() {
        // remove room from displayData.rooms
        for (let i = 0; i !== displayData.rooms.length; i++) {
            if (displayData.rooms[i] === displayData.targetRoom) {
                displayData.rooms.splice(i, 1);
                break;
            }
        }

        displayData.targetRoom = null;
        draw();
    }, function() {
        displayData.targetRoom = null;
    });
}

function setSelectValue(select, value) {
    if (value == -1) {// set default option
        for (let i = select.options.length - 1; i !== -1; i--)
            if (select.options[i].value == '') {
                select.selectedIndex = i;
                return;
            }
    } else {
        for (let i = select.options.length - 1; i !== -1; i--)
            if (select.options[i].value == value) {
                select.selectedIndex = i;
                return;
            }
    }
}

function deleteRoom(roomId) {

    apiDelete('rooms', roomId, function() {
        let index = displayData.rooms.length - 1;

        while (index !== -1) {
            if (displayData.rooms[index].id === roomId)
                break;
            index--;
        }

        if (index === -1) {
            console.error("Room not found");
            return;
        }
        displayData.rooms.splice(index, 1);
        displayData.targetRoom = null;
        draw();
    });
}

function selectFloor(floor) {
    displayData.floor = floor;
    delete displayData.editMode.addRoom;
    draw();
}

function showFilterTab() {
    const filters = document.getElementById('plan-filters');

    if (filters.style.left == '0px') // hide
        filters.style.left = '-20em';
    else // show
        filters.style.left = '0';
}

function searchPlanKeydown(e) {
    if (e.keyCode === 13) { // enter
        e.preventDefault();
        searchPlan(true);
    }
}

function appendFloorToArray(array, value) {

    for (let floor of array)
        if (floor === value)
            return;

    array.push(value);
    array.sort(searchArrayFunction);
}

function searchArrayFunction(compareA, compareB) {
    if (compareA === lastSearchedFloor)
        return -1; // put current room in first
    else
        return compareA < compareB; // ascending order
}

function searchPlan(forceSearch) {
    const typeSelect = document.getElementById('search-type');
    const resultCount = document.getElementById('search-result-count');
    const type = typeSelect.options[typeSelect.selectedIndex].value;
    const title = document.getElementById('search-room').value.toLocaleLowerCase();
    const patient = document.getElementById('search-patient').value.toLocaleLowerCase();
    const inventory = document.getElementById('search-inventory').value.toLocaleLowerCase();
    const searchHash = 'ty' + type + 'ti' + title + 'pa' + patient + 'in' + inventory;
    let resultFloors = [];

    // init: show all rooms
    for (const room of displayData.rooms)
        room.hidden = false;

    // hide unwanted rooms based on search
    for (const room of displayData.rooms) {
        if (type !== '' && room.type.id != type)
            room.hidden = true;

        if (title !== '' && room.title.toLocaleLowerCase().indexOf(title) === -1)
            room.hidden = true;

        if (patient !== '') {
            const searchParts = patient.split(' ');
            let found = false;

            for (const _patient of room.patients)
                for (const searchPart of searchParts) {
                    if (searchPart !== ' ')
                        if (_patient.firstname.toLocaleLowerCase().indexOf(searchPart) !== -1 || _patient.lastname.toLocaleLowerCase().indexOf(searchPart) !== -1) {
                            found = true;
                            break;
                        }
                }

            if (!found)
                room.hidden = true;
        }

        if (inventory !== '') {
            const searchParts = inventory.split(' ');
            let found = false;

            for (const _inventory of room.inventory)
                for (const searchPart of searchParts) {
                    if (searchPart !== ' ')
                        if (_inventory.title.toLocaleLowerCase().indexOf(searchPart) !== -1 || _inventory.title.toLocaleLowerCase().indexOf(searchPart) !== -1) {
                            found = true;
                            break;
                        }
                }

            if (!found)
                room.hidden = true;
        }
    }

    if (title !== '' || patient !== '' || inventory !== '') // empty search
        for (const room of displayData.rooms) {
            if ( !room.hidden)
                appendFloorToArray(resultFloors, room.floor);
        }

    // change displayed floor
    if (forceSearch === true) {
        if (searchHash === lastSearchPlan && searchTarget < resultFloors.length - 1)
            searchTarget++;
        else
            searchTarget = 0;

        if (searchTarget < resultFloors.length)
            displayData.floor = resultFloors[searchTarget];
    } else {
        lastSearchedFloor = displayData.floor;
        resultFloors.sort(searchArrayFunction);

        if (resultFloors.length !== 0) {
            found = false; // found a room on the display floor

            for (const room of displayData.rooms)
                if (room.floor === displayData.floor && !room.hidden) {
                    found = true;
                    break;
                }
            searchTarget = found ? 0 : -1;
        }
    }

    if (resultFloors.length > 1) {
        resultCount.style.display = 'block';
        resultCount.innerText = 'Résultat ' + (1 + searchTarget) + '/' + resultFloors.length;
    } else {
        resultCount.style.display = 'none';
    }
    lastSearchPlan = searchHash;
    draw();
}

function addInventoryObject() {
    const background = document.getElementById('plan-popup-background');
    const popup = document.getElementById('plan-add-inventory');

    document.getElementById('search-add-inventory-name').value = '';
    setSelectValue(document.getElementById('search-add-inventory-service'), displayData.serviceID);
    document.getElementById('search-add-inventory-room-type').selectedIndex = 0;
    document.getElementById('search-add-inventory-floor').selectedIndex = 0;

    background.style.display = 'block';
    popup.style.display = 'block';
    searchAddInventoryObject();
}

function createInventoryObject() {
    const background = document.getElementById('plan-popup-background');
    const popup = document.getElementById('plan-create-inventory');

    background.style.display = 'block';
    popup.style.display = 'block';
    document.getElementById('plan-add-inventory').style.display = 'none';
}

function createInventory() {
    const inventoryType = document.getElementById('inventory-type');
    const inventoryName = document.getElementById('inventory-name');
    let newInventory = {
        title: inventoryName.value,
        type: parseInt(inventoryType.options[inventoryType.selectedIndex].value),
        room_id: displayData.targetRoom.id,
        quantity: 1
    };
    closeInventoryPopup();

    if (newInventory.title === '') {
        customAlert(MSG_ERROR, 'Vous devez renseigner un nom d\'objet', WARNING);
        return;
    }

    apiPost('inventory', newInventory, function(response) {
        response.json().then(function(data) {
            newInventory.id = data.id;
            displayData.targetRoom.inventory.push(newInventory);
            inventoryName.value = '';
            inventoryType.selectedIndex = 0;
            refreshRoomInventory();
        });
    });
}

function deleteInventoryObject() {
    const inventoryID = parseInt(this.parentNode.getAttribute('inventory-id'));

    apiDelete('inventory', inventoryID, function() {
        let index = displayData.targetRoom.inventory.length - 1;

        while (index !== -1) {
            if (displayData.targetRoom.inventory[index].id === inventoryID)
                break;
            index--;
        }

        if (index === -1) {
            console.error("Object not found");
            return;
        }
        displayData.targetRoom.inventory.splice(index, 1);
        refreshRoomInventory();
    });
}

function transferInventoryObject() {
    const background = document.getElementById('plan-popup-background');
    const popup = document.getElementById('plan-transfer-inventory');

    popup.setAttribute('inventory-id', this.parentNode.getAttribute('inventory-id'));
    document.getElementById('search-transfer-inventory-room').value = '';
    setSelectValue(document.getElementById('search-transfer-inventory-service'), displayData.serviceID);
    document.getElementById('search-transfer-inventory-room-type').selectedIndex = 0;
    document.getElementById('search-transfer-inventory-floor').selectedIndex = 0;

    background.style.display = 'block';
    popup.style.display = 'block';
    searchTransferInventoryObject();
}

function searchTransferInventoryObject() {
    const service = document.getElementById('search-transfer-inventory-service');
    const type = document.getElementById('search-transfer-inventory-room-type');
    const roomName = document.getElementById('search-transfer-inventory-room');
    const floor = document.getElementById('search-transfer-inventory-floor');
    let query = 'title=' + roomName.value + '&service_id=' + parseInt(service.options[service.selectedIndex].value);

    if (type.options[type.selectedIndex].value != '')
        query += '&type=' + parseInt(type.options[type.selectedIndex].value);
    if (floor.options[floor.selectedIndex].value != '')
        query += '&floor=' + parseInt(floor.options[floor.selectedIndex].value);

    fetch('/api/rooms?' + query).then(function(response) {
        if (response.status >= 200 && response.status < 300)
            response.json().then(function (data) {
                const list = document.getElementById('transfer-room-list');
                let div, service, title, floor, type;

                list.innerHTML = '';

                for (const room of data) {
                    if (room.id == displayData.targetRoom.id)
                        continue;
                    div = document.createElement('div');
                    service = document.createElement('p');
                    title = document.createElement('p');
                    floor = document.createElement('p');
                    type = document.createElement('p');
                    service.innerText = getServiceName(room.service_id);
                    title.innerText = room.title;
                    floor.innerText = getFloorName(room.floor);
                    type.innerText = room.type.display_name;
                    div.setAttribute('room-id', room.id);
                    div.addEventListener('click', transferInventoryObjectToRoom);

                    div.appendChild(service);
                    div.appendChild(title);
                    div.appendChild(floor);
                    div.appendChild(type);
                    list.appendChild(div);
                }
            });
        else
            customAlert(MSG_ERROR, MSG_RETRY, WARNING);
    }).catch(function() {
        customAlert(MSG_ERROR, MSG_INTERNAL_ERROR, WARNING);
    });
}

function searchAddInventoryObject() {
    const serviceSelect = document.getElementById('search-add-inventory-service');
    const inventoryType = document.getElementById('search-add-inventory-type');
    const roomType = document.getElementById('search-add-inventory-room-type');
    const objectName = document.getElementById('search-add-inventory-name');
    const floor = document.getElementById('search-add-inventory-floor');
    let query = 'search=' + objectName.value + '&service_id=' + parseInt(serviceSelect.options[serviceSelect.selectedIndex].value);

    if (inventoryType.options[inventoryType.selectedIndex].value != '')
        query += '&type=' + parseInt(inventoryType.options[inventoryType.selectedIndex].value);
    if (roomType.options[roomType.selectedIndex].value != '')
        query += '&room_type=' + parseInt(roomType.options[roomType.selectedIndex].value);
    if (floor.options[floor.selectedIndex].value != '')
        query += '&floor=' + parseInt(floor.options[floor.selectedIndex].value);

    fetch('/api/inventory?' + query).then(function(response) {
        if (response.status >= 200 && response.status < 300)
            response.json().then(function (data) {
                const list = document.getElementById('add-inventory-list');
                let div, type, name, floor, roomTitle;

                list.innerHTML = '';

                for (const object of data) {
                    // skip current objects
                    if (object.room_id == displayData.targetRoom.id)
                        continue;
                    list.appendChild(buildAddInventoryListRow(object));
                }
            });
        else
            customAlert(MSG_ERROR, MSG_RETRY, WARNING);
    }).catch(function() {
        customAlert(MSG_ERROR, MSG_INTERNAL_ERROR, WARNING);
    });
}

function buildAddInventoryListRow(object) {
    const div = document.createElement('div');
    const type = document.createElement('p');
    const name = document.createElement('p');
    const floor = document.createElement('p');
    const roomTitle = document.createElement('p');

    name.innerText = object.title;
    type.innerText = object.type.display_name;

    if (object.room) {
        roomTitle.innerText = object.room.title;
        floor.innerText = getFloorName(object.room.floor);
    }
    div.setAttribute('inventory-id', object.id);
    div.addEventListener('click', addInventoryObjectToRoom);

    div.appendChild(type);
    div.appendChild(name);
    div.appendChild(floor);
    div.appendChild(roomTitle);

    return div;
}

function searchAddPatient() {
    const service = document.getElementById('search-add-patient-service');
    const roomType = document.getElementById('search-add-patient-room-type');
    const patientName = document.getElementById('search-add-patient-name');
    const floor = document.getElementById('search-add-patient-floor');
    let query = 'search=' + patientName.value;

    if (service.options[service.selectedIndex].value !== '0')
        query += '&service_id=' + parseInt(service.options[service.selectedIndex].value);
    else
        query += '&room_id=0';
    if (roomType.options[roomType.selectedIndex].value != '')
        query += '&room_type=' + parseInt(roomType.options[roomType.selectedIndex].value);
    if (floor.options[floor.selectedIndex].value != '')
        query += '&floor=' + parseInt(floor.options[floor.selectedIndex].value);

    fetch('/api/patients?' + query).then(function(response) {
        if (response.status >= 200 && response.status < 300)
            response.json().then(function (data) {
                const list = document.getElementById('add-patient-list');

                list.innerHTML = '';

                for (const patient of data.patients)
                    if (patient.room_id != displayData.targetRoom.id)
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
    div.addEventListener('click', addPatientToRoom);

    div.appendChild(service);
    div.appendChild(name);
    div.appendChild(roomTitle);
    div.appendChild(ss_number);

    return div;
}

function searchTransferPatient() {
    const service = document.getElementById('search-transfer-patient-service');
    const roomType = document.getElementById('search-transfer-patient-room-type');
    const roomName = document.getElementById('search-transfer-patient-room-name');
    const floor = document.getElementById('search-transfer-patient-floor');
    let query = 'title=' + roomName.value + '&service_id=' + parseInt(service.options[service.selectedIndex].value);

    if (roomType.options[roomType.selectedIndex].value != '')
        query += '&type=' + parseInt(roomType.options[roomType.selectedIndex].value);
    if (floor.options[floor.selectedIndex].value != '')
        query += '&floor=' + parseInt(floor.options[floor.selectedIndex].value);

    fetch('/api/rooms?' + query).then(function(response) {
        if (response.status >= 200 && response.status < 300)
            response.json().then(function (data) {
                const list = document.getElementById('transfer-patient-list');

                list.innerHTML = '';

                for (const room of data) {
                    // skip current room
                    if (room.id === displayData.targetRoom.id)
                        continue;
                    list.appendChild(buildTransferPatientListRow(room));
                }
            });
        else
            customAlert(MSG_ERROR, MSG_RETRY, WARNING);
    }).catch(function() {
        customAlert(MSG_ERROR, MSG_INTERNAL_ERROR, WARNING);
    });
}

function buildTransferPatientListRow(room) {
    const div = document.createElement('div');
    const service = document.createElement('p');
    const title = document.createElement('p');
    const floor = document.createElement('p');
    const type = document.createElement('p');
    const capacity = document.createElement('p');

    service.innerText = getServiceName(room.service_id);
    title.innerText = room.title;
    floor.innerText = getFloorName(room.floor);
    type.innerText = room.type.display_name;
    capacity.innerText = room.patients.length + '/' + room.capacity;

    if (room.patients.length >= room.capacity)
        capacity.classList.add('full');
    div.setAttribute('room-id', room.id);
    div.addEventListener('click', transferPatientToRoom);

    div.appendChild(service);
    div.appendChild(title);
    div.appendChild(floor);
    div.appendChild(type);
    div.appendChild(capacity);

    return div;
}

function addInventoryObjectToRoom() {
    const updateData = {
        id: parseInt(this.getAttribute('inventory-id')),
        room_id: displayData.targetRoom.id
    };
    closeInventoryPopup();

    apiUpdate('inventory', updateData, function(response) {
        let objectCopy;

        // remove object from room
        for (let i = displayData.rooms.length - 1; !objectCopy && i !== -1; i--)
            for (let j = displayData.rooms[i].inventory.length - 1; !objectCopy && j !== -1; j--)
                if (displayData.rooms[i].inventory[j].id === updateData.id) {
                    objectCopy = { ...displayData.rooms[i].inventory[j] };
                    displayData.rooms[i].inventory.splice(j, 1);
                    break;
                }

        if (objectCopy) {
            displayData.targetRoom.inventory.push(objectCopy);
            refreshRoomInventory();
        } else {
            fetch('/api/inventory?id=' + updateData.id).then(function(response) {
                if (response.status >= 200 && response.status < 300)
                    response.json().then(function (data) {
                        displayData.targetRoom.inventory.push(data[0]);
                        refreshRoomInventory();
                    });
            });
        }
    });
}

function transferInventoryObjectToRoom() {
    const updateData = {
        id: parseInt(document.getElementById('plan-transfer-inventory').getAttribute('inventory-id')),
        room_id: parseInt(this.getAttribute('room-id'))
    };
    closeInventoryPopup();

    apiUpdate('inventory', updateData, function(response) {
        // remove object form room
        let index = displayData.targetRoom.inventory.length - 1;

        while (index !== -1) {
            if (displayData.targetRoom.inventory[index].id === updateData.id)
                break;
            index--;
        }

        if (index === -1) {
            console.error("Object not found");
            return;
        }
        const objectCopy = { ...displayData.targetRoom.inventory[index] };
        displayData.targetRoom.inventory.splice(index, 1);
        refreshRoomInventory();

        // add object to other room
        index = displayData.rooms.length - 1;

        while (index !== -1) {
            if (displayData.rooms[index].id === updateData.room_id)
                break;
            index--;
        }

        if (index === -1)
            return;
        displayData.rooms[index].inventory.push(objectCopy);
    });
}

function addPatientToRoom() {
    const updateData = {
        id: parseInt(this.getAttribute('patient-id')),
        room_id: displayData.targetRoom.id
    };
    closePatientPopup();

    apiUpdate('patients', updateData, function(response) {
        let objectCopy;

        // remove patient from room
        for (let i = displayData.rooms.length - 1; !objectCopy && i !== -1; i--)
            for (let j = displayData.rooms[i].patients.length - 1; !objectCopy && j !== -1; j--)
                if (displayData.rooms[i].patients[j].id === updateData.id) {
                    objectCopy = { ...displayData.rooms[i].patients[j] };
                    displayData.rooms[i].patients.splice(j, 1);
                    break;
                }

        if (objectCopy) {
            displayData.targetRoom.patients.push(objectCopy);
            refreshRoomBeds();
        } else {
            fetch('/api/patients?id=' + updateData.id).then(function(response) {
                if (response.status >= 200 && response.status < 300)
                    response.json().then(function (data) {
                        displayData.targetRoom.patients.push(data.patients[0]);
                        refreshRoomBeds();
                    });
            });
        }
    });
}

function transferPatientToRoom(e) {
    const updateData = {
        id: parseInt(document.getElementById('plan-transfer-patient').getAttribute('patient-id')),
        room_id: parseInt(this.getAttribute('room-id'))
    };
    closePatientPopup();

    apiUpdate('patients', updateData, function(response) {
        // remove patient form room
        let index = displayData.targetRoom.patients.length - 1;

        while (index !== -1) {
            if (displayData.targetRoom.patients[index].id === updateData.id)
                break;
            index--;
        }

        if (index === -1) {
            console.error("Object not found");
            return;
        }
        const objectCopy = { ...displayData.targetRoom.patients[index] };
        displayData.targetRoom.patients.splice(index, 1);
        refreshRoomBeds();

        // add patient to other room
        index = displayData.rooms.length - 1;

        while (index !== -1) {
            if (displayData.rooms[index].id === updateData.room_id)
                break;
            index--;
        }

        if (index === -1)
            return;
        displayData.rooms[index].patients.push(objectCopy);
    });
}

function getServiceName(id) {

    for (const service of services)
        if (service.id == id)
            return service.title;

    return '-';
}

function getRoomTypeName(id) {

    for (const room of displayData.roomTypes)
        if (room.id == id)
            return room.display_name;

    return '-';
}

function getInventoryType(id) {

    for (const inventoryType of displayData.inventoryTypes)
        if (inventoryType.id == id)
            return inventoryType.display_name;

    return '-';
}

function removePatientFromRoom(e) {
    e.preventDefault();

    const updateData = {
        id: parseInt(this.parentNode.parentNode.getAttribute('patient-id')),
        room_id: 0
    };
    apiUpdate('patients', updateData, function() {
        let roomIndex = displayData.rooms.length - 1;
        let patientIndex;
        let found = false;

        while ( !found && roomIndex !== -1) {
            patientIndex = displayData.rooms[roomIndex].patients.length - 1;

            while (patientIndex !== -1) {
                if (displayData.rooms[roomIndex].patients[patientIndex].id === updateData.id) {
                    found = true;
                    break;
                }
                patientIndex--;
            }
            roomIndex--;
        }
        roomIndex++;

        if ( !found) {
            console.error("Room not found");
            return;
        }
        displayData.rooms[roomIndex].patients.splice(patientIndex, 1);
        refreshRoomBeds();
    });
}

function createPatient() {
    const background = document.getElementById('plan-popup-background');
    const popup = document.getElementById('plan-create-patient');

    background.style.display = 'block';
    popup.style.display = 'block';
    document.getElementById('plan-add-patient').style.display = 'none';
}

function addPatient() {
    const background = document.getElementById('plan-popup-background');
    const popup = document.getElementById('plan-add-patient');

    background.style.display = 'block';
    popup.style.display = 'block';
    searchAddPatient();
}

function transferPatient(e) {
    const background = document.getElementById('plan-popup-background');
    const popup = document.getElementById('plan-transfer-patient');

    background.style.display = 'block';
    popup.style.display = 'block';
    popup.setAttribute('patient-id', e.target.parentNode.getAttribute('patient-id'));
    searchTransferPatient();
}

function createPatientInRoom() {
    const firstname = document.getElementById('patient-firstname');
    const lastname = document.getElementById('patient-lastname');
    const ssNumber = document.getElementById('patient-ss-number');
    const birthdate = document.getElementById('patient-birthdate');

    if (birthdate.value === '') {
        customAlert(MSG_ERROR, 'Vous devez renseigner une date de naissance.', WARNING);
        return;
    }

    let newPatient = {
        firstname: firstname.value,
        lastname: lastname.value,
        ss_number: ssNumber.value,
        room_id: displayData.targetRoom.id,
        birthdate: (new Date(birthdate.value)).getTime() / 1000
    };
    closePatientPopup();

    if (newPatient.firstname === '' || newPatient.lastname === '') {
        customAlert(MSG_ERROR, 'Vous devez renseigner un nom ainsi qu\'un prénom.', WARNING);
        return;
    }

    apiPost('patients', newPatient, function(response) {
        response.json().then(function(data) {
            newPatient.id = data.id;
            displayData.targetRoom.patients.push(newPatient);
            firstname.value = '';
            lastname.value = '';
            ssNumber.value = '';
            birthdate.value = '';
            refreshRoomBeds();
        });
    });
}

function displayUnassignedRoomPositionList() {
    const background = document.getElementById('plan-popup-background');
    const popup = document.getElementById('plan-unsized-rooms');

    document.getElementById('search-unsized-room-name').value = '';
    setSelectValue(document.getElementById('search-unsized-room-service'), displayData.serviceID);
    document.getElementById('search-unsized-room-type').selectedIndex = 0;

    background.style.display = 'block';
    popup.style.display = 'block';
    searchUnsizedRooms();
}

function searchUnsizedRooms() {
    const serviceSelect = document.getElementById('search-unsized-room-service');
    const roomType = document.getElementById('search-unsized-room-type');
    const roomName = document.getElementById('search-unsized-room-name');
    let query = 'unsized=true&search=' + roomName.value + '&service_id=' + parseInt(serviceSelect.options[serviceSelect.selectedIndex].value);

    if (roomType.options[roomType.selectedIndex].value != '')
        query += '&type=' + parseInt(inventoryType.options[inventoryType.selectedIndex].value);

    fetch('/api/rooms?' + query).then(function(response) {
        if (response.status >= 200 && response.status < 300)
            response.json().then(function (data) {
                const list = document.getElementById('unsized-rooms-list');
                let div, service, type, name, capacity;

                list.innerHTML = '';

                for (const room of data) {
                    // skip current objects
                    div = document.createElement('div');
                    service = document.createElement('p');
                    title = document.createElement('p');
                    capacity = document.createElement('p');
                    type = document.createElement('p');
                    service.innerText = getServiceName(room.service_id);
                    title.innerText = room.title;
                    capacity.innerText = room.patients.length + '/' + room.capacity;
                    type.innerText = room.type.display_name;
                    div.setAttribute('room-id', room.id);
                    div.addEventListener('click', setUnsizedRooms);

                    if (room.patients.length >= room.capacity)
                        capacity.classList.add('full');
                    div.appendChild(service);
                    div.appendChild(title);
                    div.appendChild(type);
                    div.appendChild(capacity);
                    list.appendChild(div);
                }
            });
        else
            customAlert(MSG_ERROR, MSG_RETRY, WARNING);
    }).catch(function() {
        customAlert(MSG_ERROR, MSG_INTERNAL_ERROR, WARNING);
    });
}


function setUnsizedRooms() {

    if ( !displayData.editMode.addRoom)
        displayData.editMode.addRoom = {};
    displayData.editMode.addRoom.unsizedRoomID = parseInt(this.getAttribute('room-id'));

    closePopup();
}

function addUnsizedRoom() {
    const updateData = {
        id: displayData.editMode.addRoom.unsizedRoomID,
        position_x: 0,
        position_y: 0,
        corners: convertCorners(displayData.editMode.addRoom.corners),
    };

    apiUpdate('rooms', updateData, function() {
        fetch('/api/rooms?id=' + updateData.id).then(function(response) {
            if (response.status >= 200 && response.status < 300)
                response.json().then(function (data) {
                    if (data.length === 0) {
                        customAlert('Cette salle n\'existe plus', MSG_RETRY, WARNING);
                        delete displayData.editMode.addRoom;
                        return;
                    }
                    displayData.rooms.push(data[0]);
                    draw();
                });
            else {
                customAlert(MSG_ERROR, MSG_RETRY, WARNING);
                delete displayData.editMode.addRoom;
            }
        }).catch(function(e) {
            customAlert(MSG_ERROR, MSG_INTERNAL_ERROR, WARNING);
        });
    }, function() {
        customAlert(MSG_ERROR, MSG_RETRY, WARNING);
        delete displayData.editMode.addRoom;
    });
}

websocket.addEventListener('room', 'new', (message) => {

    fetch('/api/rooms?id=' + message.identifiers.id).then(function(response) {
        if (response.status >= 200 && response.status < 300)
            response.json().then(function (data) {
                if (data.length === 0) {
                    console.error("empty data");
                    return;
                }
                displayData.rooms.push(data[0]);
                draw();

                const roomType = document.getElementById('search-transfer-patient-room-type');
                const roomService = document.getElementById('search-transfer-patient-service');
                const roomFloor = document.getElementById('search-transfer-patient-floor');

                if ((roomType.options[roomType.selectedIndex].value === '' || data[0].type.id == roomType.options[roomType.selectedIndex].value)
                && (data[0].service_id == roomService.options[roomService.selectedIndex].value)
                && (roomFloor.options[roomFloor.selectedIndex].value === '' || data[0].floor == roomFloor.options[roomFloor.selectedIndex].value)) {
                    document.getElementById('transfer-patient-list').appendChild(buildTransferPatientListRow(data[0]));
                }
            });
        else
            console.error(MSG_ERROR);
    }).catch(function() {
        console.error(MSG_INTERNAL_ERROR);
    });
});

websocket.addEventListener('room', 'update', (message) => {
    console.log(message);
    fetch('/api/rooms?id=' + message.identifiers.id).then(function(response) {
        if (response.status >= 200 && response.status < 300)
            response.json().then(function (data) {

                if (data.length === 0) {
                    console.error("empty data");
                    return;
                }

                for (let i = displayData.rooms.length - 1; i !== -1; i--) {
                    if (displayData.rooms[i].id == data[0].id) {
                        displayData.rooms[i] = data[0];
                        draw();
                        break;
                    }
                }

                const transferPatientList = document.getElementById('transfer-patient-list');

                for (let i = transferPatientList.childElementCount - 1; i !== -1; i--) {
                    if (transferPatientList.children[i].getAttribute('room-id') == message.identifiers.id) {
                        const node = transferPatientList.insertBefore(buildTransferPatientListRow(data[0]), transferPatientList.children[i]);
                        node.nextSibling.remove();
                        break;
                    }
                }
            });
        else
            console.error(MSG_ERROR);
    }).catch(function() {
        console.error(MSG_INTERNAL_ERROR);
    });
});

websocket.addEventListener('room', 'delete', (message) => {

    for (let i = displayData.rooms.length - 1; i !== -1; i--) {
        if (displayData.rooms[i].id == message.identifiers.id) {
            displayData.rooms.splice(i, 1);
            draw();
            break;
        }
    }
    const list = document.getElementById('transfer-patient-list');

    for (let i = list.childElementCount - 1; i !== -1; i--) {
        if (list.children[i].getAttribute('room-id') == message.identifiers.id) {
            list.children[i].remove();
            break;
        }
    }
});

websocket.addEventListener('room_type', 'new', (message) => {
    const selects = [ 'room-type', 'search-type', 'search-add-inventory-room-type', 'search-transfer-inventory-room-type', 'search-add-patient-room-type', 'search-transfer-patient-room-type', 'search-unsized-room-type' ];

    for (const selectID of selects) {
        const option = document.createElement('option');

        option.value = message.identifiers.id;
        option.innerText = message.data.display_name;
        document.getElementById(selectID).appendChild(option);
    }
});

websocket.addEventListener('room_type', 'update', (message) => {
    if (message.data.display_name) {
        const selects = [ 'room-type', 'search-type', 'search-add-inventory-room-type', 'search-transfer-inventory-room-type', 'search-add-patient-room-type', 'search-transfer-patient-room-type', 'search-unsized-room-type' ];

        for (const selectID of selects) {
            const list = document.getElementById(selectID).children;

            for (const i in list) {
                if (list[i].value == message.identifiers.id) {
                    list[i].innerText = message.data.display_name;
                    break;
                }
            }
        }
    }
});

websocket.addEventListener('room_type', 'delete', (message) => {
    const selects = [ 'room-type', 'search-type', 'search-add-inventory-room-type', 'search-transfer-inventory-room-type', 'search-add-patient-room-type', 'search-transfer-patient-room-type', 'search-unsized-room-type' ];

    for (const selectID of selects) {
        const list = document.getElementById(selectID).children;

        for (const i in list) {
            if (list[i].value == message.identifiers.id) {
                list[i].remove();
                break;
            }
        }
    }
});

websocket.addEventListener('service', 'new', (message) => {
    const selects = [ 'search-service', 'search-add-inventory-service', 'search-transfer-inventory-service', 'search-add-patient-service', 'search-transfer-patient-service', 'search-unsized-room-service' ];

    for (const selectID of selects) {
        const option = document.createElement('option');

        option.value = message.identifiers.id;
        option.innerText = message.data.title;
        document.getElementById(selectID).appendChild(option);
    }
});

websocket.addEventListener('service', 'update', (message) => {
    if (message.data.title) {
        const selects = [ 'search-service', 'search-add-inventory-service', 'search-transfer-inventory-service', 'search-add-patient-service', 'search-transfer-patient-service', 'search-unsized-room-service' ];

        for (const selectID of selects) {
            const list = document.getElementById(selectID).children;

            for (const i in list) {
                if (list[i].value == message.identifiers.id) {
                    list[i].innerText = message.data.title;
                    break;
                }
            }
        }
    }
});

websocket.addEventListener('service', 'delete', (message) => {
    const selects = [ 'search-service', 'search-add-inventory-service', 'search-transfer-inventory-service', 'search-add-patient-service', 'search-transfer-patient-service', 'search-unsized-room-service' ];

    for (const selectID of selects) {
        const list = document.getElementById(selectID).children;

        for (const i in list) {
            if (list[i].value == message.identifiers.id) {
                list[i].remove();
                break;
            }
        }
    }
});

websocket.addEventListener('inventory_type', 'new', (message) => {
    const selects = [ 'inventory-type', 'search-add-inventory-type' ];

    for (const selectID of selects) {
        const option = document.createElement('option');

        option.value = message.identifiers.id;
        option.innerText = message.data.display_name;
        document.getElementById(selectID).appendChild(option);
    }
});

websocket.addEventListener('inventory_type', 'update', (message) => {
    if (message.data.display_name) {
        const selects = [ 'inventory-type', 'search-add-inventory-type' ];

        for (const selectID of selects) {
            const list = document.getElementById(selectID).children;

            for (const i in list) {
                if (list[i].value == message.identifiers.id) {
                    list[i].innerText = message.data.display_name;
                    break;
                }
            }
        }
    }
});

websocket.addEventListener('inventory_type', 'delete', (message) => {
    const selects = [ 'inventory-type', 'search-add-inventory-type' ];

    for (const selectID of selects) {
        const list = document.getElementById(selectID).children;

        for (const i in list) {
            if (list[i].value == message.identifiers.id) {
                list[i].remove();
                break;
            }
        }
    }
});

websocket.addEventListener('inventory', 'new', (message) => {
    fetch('/api/inventory?id=' + message.identifiers.id).then(function(response) {
        if (response.status >= 200 && response.status < 300)
            response.json().then(function (data) {
                let room;

                for (let i = displayData.rooms.length - 1;i !== -1; i--)
                    if (displayData.rooms[i].id == data[0].room_id) {
                        room = displayData.rooms[i];
                        break;
                    }

                if (room) {
                    room.inventory.push(data[0]);

                    if (room == displayData.targetRoom)
                        refreshRoomInventory();
                }
                const inventoryType = document.getElementById('search-add-inventory-type');
                const roomService = document.getElementById('search-add-inventory-service');
                const roomType = document.getElementById('search-add-inventory-room-type');
                const roomFloor = document.getElementById('search-add-inventory-floor');

                if ((roomType.options[roomType.selectedIndex].value === '' || data[0].room.type == roomType.options[roomType.selectedIndex].value)
                && (data[0].room.service_id == roomService.options[roomService.selectedIndex].value)
                && (roomFloor.options[roomFloor.selectedIndex].value === '' || data[0].room.floor == roomFloor.options[roomFloor.selectedIndex].value)
                && (inventoryType.options[inventoryType.selectedIndex].value === '' || data[0].type.id == inventoryType.options[inventoryType.selectedIndex].value)) {
                    document.getElementById('add-inventory-list').appendChild(buildAddInventoryListRow(data[0]));
                }
            });
    });
});

websocket.addEventListener('inventory', 'update', (message) => {
    if (message.data.room_id) {
        let objectCopy;

        // remove object from room
        for (let i = displayData.rooms.length - 1; !objectCopy && i !== -1; i--)
            for (let j = displayData.rooms[i].inventory.length - 1; !objectCopy && j !== -1; j--)
                if (displayData.rooms[i].inventory[j].id == message.identifiers.id) {
                    objectCopy = { ...displayData.rooms[i].inventory[j] };
                    displayData.rooms[i].inventory.splice(j, 1);

                    if (displayData.rooms[i] == displayData.targetRoom)
                        refreshRoomInventory();
                    break;
                }
        let room;

        for (let i = displayData.rooms.length - 1;i !== -1; i--)
            if (displayData.rooms[i].id == message.data.room_id) {
                room = displayData.rooms[i];
                break;
            }
        if (room) {
            if (objectCopy) {
                room.inventory.push(objectCopy);

                if (room == displayData.targetRoom)
                    refreshRoomInventory();
            } else {
                fetch('/api/inventory?id=' + message.identifiers.id).then(function(response) {
                    if (response.status >= 200 && response.status < 300)
                        response.json().then(function (data) {
                            room.inventory.push(data[0]);
                            if (room == displayData.targetRoom)
                                refreshRoomInventory();
                        });
                });
            }
        }
    }
    const addInventoryList = document.getElementById('add-inventory-list');

    for (let i = addInventoryList.childElementCount - 1; i !== -1; i--) {
        if (addInventoryList.children[i].getAttribute('inventory-id') == message.identifiers.id) {
            fetch('/api/inventory?id=' + message.identifiers.id).then(function(response) {
                if (response.status >= 200 && response.status < 300)
                    response.json().then(function (data) {
                        const node = addInventoryList.insertBefore(buildAddInventoryListRow(data[0]), addInventoryList.children[i]);
                        node.nextSibling.remove();
                    });
                else
                    customAlert(MSG_ERROR, MSG_RETRY, WARNING);
            }).catch(function() {
                customAlert(MSG_ERROR, MSG_INTERNAL_ERROR, WARNING);
            });
            break;
        }
    }
});

websocket.addEventListener('inventory', 'delete', (message) => {
    let found;

    for (let i = displayData.rooms.length - 1; !found && i !== -1; i--)
        for (let j = displayData.rooms[i].inventory.length - 1; j !== -1; j--)
            if (displayData.rooms[i].inventory[j].id == message.identifiers.id) {
                displayData.rooms[i].inventory.splice(j, 1);

                if (displayData.rooms[i] == displayData.targetRoom)
                    refreshRoomInventory();
                found = true;
                break;
            }
    const list = document.getElementById('add-inventory-list');

    for (let i = list.childElementCount - 1; i !== -1; i--) {
        if (list.children[i].getAttribute('inventory-id') == message.identifiers.id) {
            list.children[i].remove();
            break;
        }
    }
});

websocket.addEventListener('patient', 'new', (message) => {
    fetch('/api/patients?id=' + message.identifiers.id).then(function(response) {
        if (response.status >= 200 && response.status < 300)
            response.json().then(function (data) {
                let room;

                for (let i = displayData.rooms.length - 1;i !== -1; i--)
                    if (displayData.rooms[i].id == data.patients[0].room_id) {
                        room = displayData.rooms[i];
                        break;
                    }

                if (room) {
                    room.patients.push(data.patients[0]);

                    if (room == displayData.targetRoom)
                        refreshRoomBeds();
                }
                const roomType = document.getElementById('search-add-patient-room-type');
                const roomService = document.getElementById('search-add-patient-service');
                const roomFloor = document.getElementById('search-add-patient-floor');

                if ((roomType.options[roomType.selectedIndex].value === '' || data.patients[0].room.type == roomType.options[roomType.selectedIndex].value)
                && (data.patients[0].room.service_id == roomService.options[roomService.selectedIndex].value)
                && (roomFloor.options[roomFloor.selectedIndex].value === '' || data.patients[0].room.floor == roomFloor.options[roomFloor.selectedIndex].value)) {
                    document.getElementById('add-patient-list').appendChild(buildAddPatientListRow(data.patients[0]));
                }
            });
    });
});

websocket.addEventListener('patient', 'update', (message) => {
    if (message.data.room_id) {
        let objectCopy;

        // remove patient from room
        for (let i = displayData.rooms.length - 1; !objectCopy && i !== -1; i--)
            for (let j = displayData.rooms[i].patients.length - 1; !objectCopy && j !== -1; j--)
                if (displayData.rooms[i].patients[j].id == message.identifiers.id) {
                    objectCopy = { ...displayData.rooms[i].patients[j] };
                    displayData.rooms[i].patients.splice(j, 1);

                    if (displayData.rooms[i] == displayData.targetRoom)
                        refreshRoomBeds();
                    break;
                }
        let room;

        for (let i = displayData.rooms.length - 1;i !== -1; i--)
            if (displayData.rooms[i].id == message.data.room_id) {
                room = displayData.rooms[i];
                break;
            }
        if (room) {
            if (objectCopy) {
                room.patients.push(objectCopy);

                if (room == displayData.targetRoom)
                    refreshRoomBeds();
            } else {
                fetch('/api/patients?id=' + message.identifiers.id).then(function(response) {
                    if (response.status >= 200 && response.status < 300)
                        response.json().then(function (data) {
                            room.patients.push(data.patients[0]);
                            if (room == displayData.targetRoom)
                                refreshRoomBeds();
                        });
                });
            }
        }
    }
    const addPatientList = document.getElementById('add-patient-list');

    for (let i = addPatientList.childElementCount - 1; i !== -1; i--) {
        if (addPatientList.children[i].getAttribute('patient-id') == message.identifiers.id) {
            fetch('/api/patients?id=' + message.identifiers.id).then(function(response) {
                if (response.status >= 200 && response.status < 300)
                    response.json().then(function (data) {
                        const node = addPatientList.insertBefore(buildAddPatientListRow(data.patients[0]), addPatientList.children[i]);
                        node.nextSibling.remove();
                    });
                else
                    customAlert(MSG_ERROR, MSG_RETRY, WARNING);
            }).catch(function() {
                customAlert(MSG_ERROR, MSG_INTERNAL_ERROR, WARNING);
            });
            break;
        }
    }
});

websocket.addEventListener('patient', 'delete', (message) => {
    for (let i = displayData.rooms.length - 1; i !== -1; i--)
        for (let j = displayData.rooms[i].patients.length - 1; j !== -1; j--)
            if (displayData.rooms[i].patients[j].id == message.identifiers.id) {
                displayData.rooms[i].patients.splice(j, 1);

                if (displayData.rooms[i] == displayData.targetRoom)
                    refreshRoomBeds();
                return;
            }

    const list = document.getElementById('add-patient-list');

    for (let i = list.childElementCount - 1; i !== -1; i--) {
        if (list.children[i].getAttribute('patient-id') == message.identifiers.id) {
            list.children[i].remove();
            break;
        }
    }
});
