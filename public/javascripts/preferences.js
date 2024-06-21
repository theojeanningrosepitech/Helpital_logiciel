
function savePreferences() {
    const theme = document.getElementById('prefered_theme');
    const service = document.getElementById('service');
    const favorites = document.getElementById('favorites');
    const filter_check = document.getElementById("filter").checked;
    let filter = 0;

    if (filter_check == true)
        filter = 1;
    let updateData = {
        favorite_pages: [],
        accessibility: document.getElementById('accessibility').checked,
        prefered_theme: theme.options[theme.selectedIndex].value,
        service: service.options[service.selectedIndex].value,
        prefered_floor: parseInt(document.getElementById('prefered_floor').value),
        filter: filter,
    };

    for (let i = 0; i != favorites.childElementCount; i++) {
        if (favorites.children[i].children[0].checked) {
            updateData.favorite_pages.push(favorites.children[i].children[0].getAttribute("link"));
        }
    }

    apiUpdate('preferences', updateData, function(response) {
        window.location.href = '/planning';
    });
}

function initPreferences() {
    websocket.addEventListener('user', 'update', (message) => {
        const userID = document.getElementById('inner-body').getAttribute('user-id');

        if (message.identifiers.id == userID) {
            if (message.data.favorite_pages !== undefined) {
                const favorites = document.getElementById('favorites').getElementsByTagName('input');
                const favLinks = message.data.favorite_pages.split(',');
                let found = false;
                console.log(favLinks);
                console.log(favorites);

                for (let i = favorites.length - 1; i !== -1; i--) {
                    for (let j = favLinks.length - 1; j !== -1; j--) {
                        if (favorites[i].getAttribute('link') === favLinks[j]) {
                            found = true;
                            break;
                        }
                    }
                    favorites[i].checked = found;
                    found = false;
                }
//                window.location.reload();
//                return;
            }

            if (message.data.accessibility !== undefined) {
                document.getElementById('accessibility').checked = (message.data.accessibility == "true");
            }
            if (message.data.service !== undefined) {
                const select = document.getElementById('service');

                for (let i = 0; i !== select.options.length; i++) {
                    if (select.options[i].value == message.data.service) {
                        select.selectedIndex = i;
                        break;
                    }
                }
            }
            if (message.data.prefered_floor !== undefined) {
                document.getElementById('prefered_floor').value = message.data.prefered_floor;
            }
        }
    });
}
