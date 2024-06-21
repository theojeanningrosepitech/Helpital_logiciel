const searchInput = document.getElementById('search-input');
const list = document.getElementById('list');

searchInput.addEventListener('input', search);

function search() {

    fetch(searchInput.getAttribute('search-uri') + '?search=' + searchInput.value).then(function(response) {
        if (response.status >= 200 && response.status < 300) {
            response.json().then(function (data) {
                list.innerHTML = "";
                let line, title, id;

                for (const item of data)
                    list.appendChild(createListRow(item));
            });
        }
    });
}

function createListRow(item) {
    const line = document.createElement('div');
    const title = document.createElement('p');
    const id = document.createElement('p');

    title.innerText = item.id;
    id.innerText = item.title ? item.title : (item.display_name ? item.display_name : item.name);
    line.setAttribute('item-id', item.id)
    line.setAttribute('link', searchInput.getAttribute('object-uri') + item.id);
    line.appendChild(id);


    if (window.location.pathname === '/inventory') {
        const quantity = document.createElement('p');
        const type = document.createElement('p');

        quantity.innerText = item.quantity;
        type.innerText = item.type ? item.type.display_name : '-';

        line.appendChild(quantity);
        line.appendChild(type);
    }
    line.appendChild(title);
    line.addEventListener('click', openCategory);

    return line;
}

search();

function openCategory() {
    window.location.href = this.getAttribute('link');
}

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
