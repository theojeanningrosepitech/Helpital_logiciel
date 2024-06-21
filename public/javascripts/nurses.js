
function search() {
    apiGet('/nurses?list=true&search=' + document.getElementById('searchInput').value, function(response) {
        response.text().then(function(data) {
            document.getElementById('list').innerHTML = data;
        });
    });
}

function initNurses() {
    const input = document.getElementById('searchInput');

    input.addEventListener('keyup', function (e) {
        /*if (e.key === 'Enter') {
            e.preventDefault();
        }*/
        search();
    });

    websocket.addEventListener('user', 'new', (message) => {

        if (message.data.user_role == '4') {
            fetch('/nurses/fragment?id=' + message.identifiers.id).then(function(response) {
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
        }
    });

    websocket.addEventListener('user', 'update', (message) => {

        for (let i = list.childElementCount - 1; i !== -1; i--) {
            if (message.identifiers.id == list.children[i].getAttribute('item-id')) {
                fetch('/nurses/fragment?id=' + message.identifiers.id).then(function(response) {
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

    websocket.addEventListener('user', 'delete', (message) => {

        for (let i = list.childElementCount - 1; i !== -1; i--) {
            if (message.identifiers.id == list.children[i].getAttribute('item-id')) {
                list.children[i].remove();
                break;
            }
        }
    });
}
