
function openLink(uri) {
    window.location.href = uri;
}

function deleteInventoryObject(objectID) {

    apiDelete('inventory', objectID, function() {
        window.location.href = '/back_office/inventory';
    });
}
function sortByDate(inv) {
    inv.sort(function compare(a, b) {
        if (a.update_date < b.update_date)
            return -1;
        if (a.update_date > b.update_date)
            return 1;
        return 0;
    });

    const summary = document.getElementById("overlay");
    for (let i = 0; inv[i]; i++) {
        let span =  document.createElement("span");
        let span2 =  document.createElement("span");
        let beginAtText = document.createTextNode(inv[i].title);
        let beginAtText2 = document.createTextNode(inv[i].update_date);
        span.value = beginAtText;
        span2.value = beginAtText2;
        summary.appendChild(span);
        summary.appendChild(span2);

    }

}
function searchObjByName() {
    let inputMsg = document.getElementById("search_obj").value;
    let block = document.getElementsByClassName("full_line");
    let name = document.getElementsByClassName("get_name_obj");
    for (let i = 0; name[i]; i++) {
        if (!name[i].innerHTML.toLowerCase().includes(inputMsg.toLowerCase()))
            block[i].classList.add("display_none");
        else
            block[i].classList.remove("display_none");
    }
}
function saveInventoryObject(objectID) {
    const inventoryType = document.getElementById('inventory-type');
    const inventoryName = document.getElementById('inventory-name');
    let updateData = {
        id: objectID,
        title: inventoryName.value,
        type: parseInt(inventoryType.options[inventoryType.selectedIndex].value),
    };

    if (updateData.title === '') {
        customAlert(MSG_ERROR, 'Vous devez renseigner un nom d\'objet', WARNING);
        return;
    }

    apiUpdate('inventory', updateData, function(response) {
        window.location.href = '/inventory?id=' + objectID;
    });
}

function createInventoryObject() {
    const inventoryType = document.getElementById('inventory-type');
    const inventoryName = document.getElementById('inventory-name');
    let newInventory = {
        title: inventoryName.value,
        type: parseInt(inventoryType.options[inventoryType.selectedIndex].value),
        quantity: 1,
    };

    if (newInventory.title === '') {
        customAlert(MSG_ERROR, 'Vous devez renseigner un nom d\'objet', WARNING);
        return;
    }

    apiPost('inventory', newInventory, function(response) {
        response.json().then(function(data) {
            window.location.href = '/inventory?id=' + data.id;
        });
    });
}

function deleteInventoryCategory(objectID) {

    apiDelete('inventory/types', objectID, function() {
        window.location.href = '/back_office/inventory/types';
    },  function(response) {
        if (response && response.status === 409)
            customAlert(MSG_ERROR, 'Cette catégorie est utilisée par un objet d\'inventaire par conséquent vous ne pouvez la supprimer.', WARNING);
    });
}

function saveInventoryCategory(objectID) {
    const inventoryName = document.getElementById('category-name');
    let updateData = {
        id: objectID,
        display_name: inventoryName.value
    };

    if (updateData.title === '') {
        customAlert(MSG_ERROR, 'Vous devez renseigner un nom de catégorie', WARNING);
        return;
    }

    apiUpdate('inventory/types', updateData, function(response) {
        window.location.href = '/back_office/inventory/types/type?id=' + objectID;
    });
}

function createInventoryCategory() {
    const inventoryName = document.getElementById('category-name');
    let newInventory = {
        display_name: inventoryName.value
    };

    if (newInventory.title === '') {
        customAlert(MSG_ERROR, 'Vous devez renseigner un nom de catégorie', WARNING);
        return;
    }

    apiPost('inventory/types', newInventory, function(response) {
        response.json().then(function(data) {
            window.location.href = '/back_office/inventory/types/type?id=' + data.id;
        });
    });
}

function initNewInventory() {
    initDynamicInventory();
}

function initEditInventory() {
    initDynamicInventory();
}

function initDynamicInventory() {
    websocket.addEventListener('inventory_type', 'new', (message) => {
        const select = document.getElementById('inventory-type');
        const option = document.createElement('option');

        option.value = message.data.id;
        option.innerText = message.data.display_name;

        select.appendChild(option);
    });

    websocket.addEventListener('inventory_type', 'update', (message) => {
        const select = document.getElementById('inventory-type');

        if (message.data.display_name !== undefined) {
            for (let i = 0; i !== select.childElementCount; i++) {
                if (select.children[i].value == message.identifiers.id) {
                    select.children[i].innerText = message.data.display_name;
                    break;
                }
            }
        }
    });

    websocket.addEventListener('inventory_type', 'delete', (message) => {
        const select = document.getElementById('inventory-type');

        for (let i = 0; i !== select.childElementCount; i++) {
            if (select.children[i].value == message.identifiers.id) {
                select.children[i].remove();
                break;
            }
        }
    });
}

function generateInventory() {

// websocket part
    const websocketRessoure = searchInput.getAttribute('websocket-ressource');

    if (websocketRessoure && websocketRessoure !== '') {
        websocket.addEventListener(websocketRessoure, 'new', (message) => {

            if (window.location.pathname === '/inventory') {
                fetch('/api/inventory/types?id=' + message.data.type).then(function(response) {
                    if (response.status >= 200 && response.status < 300)
                        response.json().then(function (data) {
                            if (data.length === 1) {
                                message.data.type = {
                                    id: message.data.type,
                                    display_name: data[0].display_name
                                };
                                list.appendChild(createListRow(message.data));
                            }
                        });
                });
            } else
                list.appendChild(createListRow(message.data));
        });

        websocket.addEventListener(websocketRessoure, 'update', (message) => {

            for (let i = list.childElementCount - 1; i !== -1; i--) {
                if (message.identifiers.id == list.children[i].getAttribute('item-id')) {
                    if (message.data.title || message.data.display_name || message.data.name)
                        list.children[i].children[0].innerText = message.data.title ? message.data.title : (message.data.display_name ? message.data.display_name : message.data.name);
                    if (message.data.quantity)
                        list.children[i].children[1].innerText = message.data.quantity;
                    if (message.data.type) {
                        fetch('/api/inventory/types?id=' + message.data.type).then(function(response) {
                            if (response.status >= 200 && response.status < 300)
                                response.json().then(function (data) {
                                    if (data.length === 1)
                                        list.children[i].children[2].innerText = data[0].display_name;
                                });
                        });
                    }
                    break;
                }
            }
        });

        websocket.addEventListener(websocketRessoure, 'delete', (message) => {

            for (let i = list.childElementCount - 1; i !== -1; i--) {
                if (message.identifiers.id == list.children[i].getAttribute('item-id')) {
                    list.children[i].remove();
                    break;
                }
            }
        });
    }

}