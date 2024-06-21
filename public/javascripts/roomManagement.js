const list = document.getElementById('list');

websocket.addEventListener('room', 'new', (message) => {

    fetch('/room_management/fragment?id=' + message.identifiers.id).then(function(response) {
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

websocket.addEventListener('room', 'update', (message) => {

    for (let i = list.childElementCount - 1; i !== -1; i--) {
        if (message.identifiers.id == list.children[i].getAttribute('item-id')) {
            fetch('/room_management/fragment?id=' + message.identifiers.id).then(function(response) {
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

websocket.addEventListener('room', 'delete', (message) => {

    for (let i = list.childElementCount - 1; i !== -1; i--) {
        if (message.identifiers.id == list.children[i].getAttribute('item-id')) {
            list.children[i].remove();
            break;
        }
    }
});
