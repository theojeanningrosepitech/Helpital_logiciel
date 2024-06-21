/**
 * @module equipe
 */

/**
 * Check my user
 * @param {integer} user_id - Id user
 * @param {integer} nbr - Id here or not
 * @param {integer} service_id - Id service
 * @param {integer} done_by - Id my user
 * @param {integer} availability - Id availability
 */
function checkMyUser(user_id, nbr, service_id, done_by, availability) {
    let here;
    let content;

    if (availability != 0)
        return;
    if (done_by == "null" || done_by == user_id)
        done_by = null;
    if (nbr == 0) {
        here = 1;
        content = "a commencé son service le";
    } else {
        here = 0;
        content = "a fini son service le";
    }
    const log = {
        service: service_id,
        done_by: done_by,
        for_him: user_id,
        content: content,
    }
    apiPost("log/service", log);
    const check = {
        id: parseInt(user_id),
        here: here,
    };
    apiUpdate("users/updateHere", check, function () {
        window.location.reload();
    });
}

/**
 * Delete User
 * @param {integer} id_service - Id service
 * @param {integer} my_user - Id my user
 * @param {string} name - Group name
 * @param {integer} user - Id user
 * @param {integer} id - Id group
 * @param {string} name_user - name user
 */
function deleteUser(id_service, my_user, name, user, id, name_user) {
    const content = "a supprimé " + name_user + " dans le groupe " + name + " le ";
    const log = {
        service: id_service,
        done_by: null,
        for_him: my_user,
        content: content,
    }
    apiPost("log/service", log);
    const group = {
        id: id,
        user_id: user,
    }
    apiUpdate("services/groups/delete-personal", group);
    const check = {
        id: user,
        group: 0,
    };
    apiUpdate("users/update-group", check, function () {
        window.location.reload();
    });
}

/**
 * Add user in group
 * @param {integer} id_service - Id service
 * @param {integer} my_user - Id my user
 */
function addPersonal(id_service, my_user) {
    const selected = document.querySelectorAll("#users_add_group option:checked");
    const values = Array.from(selected).map(el => el.value);
    let get_class = document.getElementById("pop_up_add").classList;
    const content = "a ajouté du personnel dans le groupe " + get_class[2].replace(/_/g, ' ') + " le ";

    const log = {
        service: id_service,
        done_by: null,
        for_him: my_user,
        content: content,
    }
    apiPost("log/service", log);
    const group = {
        id: parseInt(get_class[1]),
        users_id: values.toString(),
    }
    apiUpdate("services/groups/add-personal", group);
    for (let i = 0; values[i]; i++) {
        const check = {
            id: values[i],
            group: 1,
        };
        apiUpdate("users/update-group", check);
    }
    history.go();
}

/**
 * Update name group
 * @param {integer} id - Id user
 * @param {integer} id - Id service
 * @param {integer} my_user - Id my user
 */
function updateNameGroup(id, name, id_service, my_user) {
    let new_name = document.getElementById(`namegroupvalue${id}`).value;
    const content = "a modifié le nom du groupe " + name + " en " + new_name + " le ";
    const log = {
        service: id_service,
        done_by: null,
        for_him: my_user,
        content: content,
    }
    apiPost("log/service", log);
    const group = {
        id: id,
        name: new_name,
    }
    apiUpdate("services/groups/update-name", group, function () {
        history.go();
    });
}

/**
 * Hide pop up service add
 */
function backServiceAdd() {
    let elem = document.getElementById("pop_up_add");

    elem.removeAttribute("class");
    elem.classList.add("display_none");
}

/**
 * Show pop up add
 * @param {integer} id - Id group
 * @param {integer} name - Name group
 */
function showPopUpAdd(id, name) {
    let elem = document.getElementById("pop_up_add");

    elem.classList.remove("display_none");
    elem.classList.add("display_flex");
    elem.classList.add(id);
    elem.classList.add(name.replace(/ /g, '_'));
}

websocket.addEventListener('user', 'update', (message) => {
    const list = document.getElementById('list');
    const chiefList = document.getElementById('service_chief');

    for (let i = list.childElementCount - 1; i !== -1; i--) {
        if (list.children[i].getAttribute('user-id') == message.identifiers.id) {
            if (message.data.here) {
                //const checkUserButton = document.getElementById('check-user-button');
                const dot = list.children[i].getElementsByClassName('fa-circle')[0];
                const button = list.children[i].getElementsByTagName('button')[0];

                if (message.data.here == '0') {
                    dot.classList.remove(button ? 'green_color' : 'green_color_dark');
                    dot.classList.add(button ? 'red_color' : 'red_color_dark');
                } else {
                    dot.classList.remove(button ? 'red_color' : 'red_color_dark');
                    dot.classList.add(button ? 'green_color' : 'green_color_dark');
                }

                if (button) {
                    let onclick = button.getAttribute('onclick').split(',');

                    onclick[1] = message.data.here;
                    button.setAttribute('onclick', onclick.join(','));
                }
                return;
            }
        }
    }

    for (let i = chiefList.childElementCount - 1; i !== -1; i--) {
        if (chiefList.children[i].getAttribute('user-id') == message.identifiers.id) {
            if (message.data.here) {
                const dot = chiefList.children[i].getElementsByClassName('fa-circle')[0];
                const button = chiefList.children[i].getElementsByTagName('button')[0];

                if (message.data.here == '0') {
                    dot.classList.remove(button ? 'green_color' : 'green_color_dark');
                    dot.classList.add(button ? 'red_color' : 'red_color_dark');
                } else {
                    dot.classList.remove(button ? 'red_color' : 'red_color_dark');
                    dot.classList.add(button ? 'green_color' : 'green_color_dark');
                }

                if (button) {
                    let onclick = button.getAttribute('onclick').split(',');

                    onclick[1] = message.data.here;
                    button.setAttribute('onclick', onclick.join(','));
                }
                return;
            }
        }
    }
});

websocket.addEventListener('user', 'delete', (message) => {
    const list = document.getElementById('list');
    const chiefList = document.getElementById('service_chief');

    for (let i = list.childElementCount - 1; i !== -1; i--) {
        if (list.children[i].getAttribute('user-id') == message.identifiers.id) {
            list.children[i].remove();
            return;
        }
    }

    for (let i = chiefList.childElementCount - 1; i !== -1; i--) {
        if (chiefList.children[i].getAttribute('user-id') == message.identifiers.id) {
            window.location.reload();
            return;
        }
    }
});
