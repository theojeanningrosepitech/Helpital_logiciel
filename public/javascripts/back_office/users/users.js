/**
 * Init list of user for back_office
 */
function initUsersList() {
    initDisplayNFC();
    const list = document.getElementById('list');
    let selects;


    for (let i = 0; i !== list.childElementCount; i++) {
        selects = list.children[i].getElementsByTagName('select');

        for (let j = 0; j !== selects.length; j++) {
            selects[j].addEventListener('change', saveUserSelectOptions);
        }
    }

    websocket.addEventListener('user', 'new', (message) => {

        fetch('/back_office/users/fragment?id=' + message.identifiers.id).then(function(response) {
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

    websocket.addEventListener('user', 'update', (message) => {

        for (let i = list.childElementCount - 1; i !== -1; i--) {
            if (message.identifiers.id == list.children[i].getAttribute('item-id')) {
                fetch('/back_office/users/fragment?id=' + message.identifiers.id).then(function(response) {
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

function saveUserSelectOptions(e) {
    const data = e.target.options[e.target.selectedIndex].value;
    const target = e.target.getAttribute('name');

    apiUpdate("users/update-" + target, {
        id: e.target.parentNode.getAttribute('item-id'),
        [target]: data,
    });
}

async function initDisplayNFC() {
    const availability = await electronAPI.availabilityNFC();

    if ( !availability) {
        const header = document.getElementById('inner-body').getElementsByClassName('table-header')[0];
        const list = document.getElementById('list');

        for (let j = 0; j !== header.childElementCount; j++) {
            if (header.children[j].classList.contains('nfc')) {
                header.children[j].style.display = 'none';
                break;
            }
        }

        for (let i = 0; i !== list.childElementCount; i++) {
            for (let j = 0; j !== list.children[i].childElementCount; j++) {
                if (list.children[i].children[j].classList.contains('nfc')) {
                    list.children[i].children[j].style.display = 'none';
                    break;
                }
            }
        }
    }
}

function NFCWriteTag(userID) {
    apiPost('users/nfc', {
        id: userID
    }, async (response) => {
        if (response.status >= 200 && response.status < 300) {
            response.json().then(async function (data) {
                displayScanNFCCardPopup();
                const result = await electronAPI.writeNFC(data.nfc_code);

                if (result == true)
                    window.location.reload();
                else
                    customAlert(MSG_ERROR, MSG_RETRY, ERROR);
            });
        }
    });
}

function NFCDeleteTag(userID) {
    apiDelete('users/nfc', userID, () => {
        window.location.reload();
    });
}

function displayScanNFCCardPopup() {
    const customContent = '<img src="/images/sensors.svg" style="height: 30vh;width: auto;margin-left: auto;margin-right: auto;display: block;"/>';

    customAlert('Veuillez placer une carte sur le lecteur NFC', '', LOADING, customContent);
}
