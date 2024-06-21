/**
 * @module messaging
 */

window.addEventListener('load', function() {
    fetch('/messaging/fragment').then(function(response) {
        if (response.status >= 200 && response.status < 300) {
            response.text().then(function(data) {
                document.getElementById('messaging').innerHTML = data;
            });
        } else
            customAlert(MSG_ERROR, MSG_INTERNAL_ERROR, WARNING);
    });

    if (document.getElementById('scroll_bar_bottom')) {
        let elem = document.getElementById('scroll_bar_bottom');
        elem.scrollTop = elem.scrollHeight;
    }
});

/**
 * Search name
 */
function searchNameUser() {
    let inputMsg = document.getElementById("search_messaging").value;
    let block = document.getElementsByClassName("block_name_user");
    let name = document.getElementsByClassName("get_name");

    for (let i = 0; name[i]; i++) {
        if (!name[i].innerHTML.toLowerCase().includes(inputMsg.toLowerCase()))
            block[i].classList.add("display_none");
        else
            block[i].classList.remove("display_none");
    }
}

/**
 * Show onglet messaging
 */
function displayOngletMsg() {
    const elem = document.getElementById('messaging');

    if (elem.style.display == 'flex') {
        elem.style.display = 'none';
        if (document.getElementById('width_content_msg')) {
            const content = document.getElementById('width_content_msg');
            content.style.width = '100%';
        }
    } else {
        elem.style.display = 'flex';
        if (document.getElementById('width_content_msg')) {
            const content = document.getElementById('width_content_msg');
            content.style.width = '80%';
        }
    }
}

/**
 * New conversation
 * @param {integer} my_id - Id my user
 */
function newConversation(my_id) {
    const selected = document.querySelectorAll("#users_group option:checked");
    let values = Array.from(selected).map(el => el.value);
    let name = document.getElementById("name_group").value;
    let count = 0;
    const div = document.createElement('div');

    if (values.length == 1)
        count = 0
    else if (values.length < 1) {
        customAlert("Création d'une conversation", 'Veuillez ajouter une personne au minimum', SETTING, div.innerHTML);
        return;
    } else
        count = 1
    if (name.length < 1)
        name = "Pas de nom de groupe";
    values.push(my_id.toString());
    const newConv = {
        user_id: values.toString(),
        title: name,
        group_conv: count,
    };
    apiPost('conversations/conversation', newConv, function(response) {
         response.json().then(function(data) {
             window.location.href = '/conversation?id_conv=' + data.id;
         });
    });
}

/**
 * New conversation click on user
 * @param {integer} my_id - Id my user
 * @param {integer} user_id - Id user
 */
function newConversationClickOnUser(my_id, user_id) {
    let values = [user_id, my_id];

    const newConv = {
        user_id: values.toString(),
        title: "Pas de nom",
        group_conv: 0,
    };
    apiPost('conversations/conversation', newConv, function(response) {
        response.json().then(function(data) {
            window.location.href = '/conversation?id_conv=' + data.id;
        });
    });
}

websocket.addEventListener('message', 'new', (message) => {
    if (window.location.pathname !== '/conversation' && window.location.search !== '?id_conv=' + message.data.conversation_id) {
        new MessageBox({
            closeTime: 5000,
            hideCloseButton: true,
            handler: () => {
                window.location.replace('/conversation?id_conv=' + message.data.conversation_id)
            }
        }).show("Nouveau message de " + message.creator.name + ". Cliquez pour y accéder.")
    }
});

/**
 * Show pop up create conv
 */
function showPopUpCreateConv() {
    let elem = document.getElementById("pop_up_create_conv");

    elem.classList.remove("display_none");
    elem.classList.add("display_flex");
}

/**
 * hide pop up create conv
 */
function backPopUpCreateConv() {
    let elem = document.getElementById("pop_up_create_conv");

    elem.classList.add("display_none");
    elem.classList.remove("display_flex");
}
