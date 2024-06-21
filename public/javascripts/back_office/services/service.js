/**
 * @module service
 */

/**
 * Show pop up create group
 */
function showPopUpCreate() {
    let elem = document.getElementById("pop_up_create");

    elem.classList.remove("display_none");
    elem.classList.add("display_flex");
}

/**
 * Hide pop up detail user
 */
function backServiceDetail() {
    let elem = document.getElementById("pop_up_detail");

    elem.classList.add("display_none");
    elem.classList.remove("display_flex");
}

/**
 * Hide pop up create group
 */
function backService() {
    let elem = document.getElementById("pop_up_create");

    elem.classList.add("display_none");
    elem.classList.remove("display_flex");
}

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
    apiUpdate("users/updateHere", check);
    history.go();
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
    apiUpdate("users/update-group", check);
    history.go();
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
 * Hide pop up add user in group
 */
function backServiceAdd() {
    let elem = document.getElementById("pop_up_add");

    elem.removeAttribute("class");
    elem.classList.add("display_none");
}

/**
 * Show pop up add user in group
 */
function showPopUpAdd(id, name) {
    let elem = document.getElementById("pop_up_add");

    elem.classList.remove("display_none");
    elem.classList.add("display_flex");
    elem.classList.add(id);
    elem.classList.add(name.replace(/ /g, '_'));
}

/**
 * Show detail of user
 * @param {integer} user - Id user
 * @param {id} service - Id service
 * @param {string} role - name of role
 * @param {string} avatar - Link of img for avatar
 * @param {object} logs - All logs
 * @param {object} all_users - All users
 * @param {object} availabilities - All inavailability
 * @param {object} contract - All contracts
 */
function checkDetailUser(user, service, role, logs, all_users, availabilities, contract) {
    let z = 0;
    let background;
    let count = 0;

    replaceText();
    elementGroupsHtml(user, service, role);
    for (let i = 0; contract[i]; i++) {
        if (user.id == contract[i].user_id && contract[i].close_at != null)
            count += 1;
    }
    createElementWithIcone("Les contrats terminés : "  + count, "change_icon_contract", "detail_img_user_pop");
    createElementWithId("div", "pop_up_contract_end", "detail_img_user_pop");
    for (let i = 0; contract[i]; i++) {
        if (contract[i].user_id == user.id && contract[i].close_at != null)
            createDivPHtmlContract("Nom et Prénom : " + user.firstname + ' ' + user.lastname, contract[i], "pop_up_contract_end");
    }
    for (let i = 0; contract[i]; i++) {
        if (contract[i].user_id == user.id && contract[i].close_at == null) {
            count = 1;
            break;
        } else
            count = 0;
    }
    createElementWithIcone("Le contrat en cours : " + count, "change_icon_contract2", "detail_img_user_pop");
    createElementWithId("div", "pop_up_contract_in_progress", "detail_img_user_pop");
    for (let i = 0; contract[i]; i++) {
        if (contract[i].user_id == user.id && contract[i].close_at == null)
            createDivPHtmlContract("Nom et Prénom : " + user.firstname + ' ' + user.lastname, contract[i], "pop_up_contract_in_progress");
    }
    count = 0;
    for (let i = 0; availabilities[i]; i++) {
        if (availabilities[i].user_id == user.id && availabilities[i].close_at != null)
            count += 1;
    }
    createElementWithIcone("Les indisponibilités de travail : "  + count, "change_icon", "detail_availability_user_pop");
    createElementWithId("div", "pop_up_inavailability_end", "detail_availability_user_pop");
    for (let i = 0; availabilities[i]; i++) {
        if (availabilities[i].user_id == user.id && availabilities[i].close_at != null)
            createDivPHtmlAvailability("Nom et Prénom : " + user.firstname + ' ' + user.lastname, availabilities[i], "pop_up_inavailability_end");
    }
    for (let i = 0; availabilities[i]; i++) {
        if (availabilities[i].user_id == user.id && availabilities[i].close_at == null) {
            count = 1;
            break;
        } else
            count = 0;
    }
    createElementWithIcone("L'indisponibilité en cours : " + count, "change_icon2", "detail_availability_user_pop");
    createElementWithId("div", "pop_up_inavailability_in_progress", "detail_availability_user_pop");
    for (let i = 0; availabilities[i]; i++) {
        if (availabilities[i].user_id == user.id && availabilities[i].close_at == null)
            createDivPHtmlAvailability("Nom et Prénom : " + user.firstname + ' ' + user.lastname, availabilities[i], "pop_up_inavailability_in_progress");
    }
    for (let i = 0; logs[i]; i++) {
        if (logs[i].for_him == user.id) {
            if (z == 0) {
                background = "background0";
                z = 1;
            } else {
                background = "background1";
                z = 0;
            }
            if (logs[i].done_by == null)
                createDivPHtml(null, user.firstname + ' ' + user.lastname + ' ' + logs[i].content + ' ' + logs[i].send_at.substr(0, 19).replace('T', " à "), background, "detail_log_user_pop");
            else {
                for (let y = 0; all_users[y]; y++) {
                    if (logs[i].done_by == all_users[y].id) {
                        createDivPHtml("Fait par " + all_users[y].firstname + ' ' + all_users[y].lastname + " : ", user.firstname + ' ' + user.lastname + ' ' + logs[i].content + ' ' + logs[i].send_at.substr(0, 19).replace('T', " à "), background, "detail_log_user_pop");
                        break;
                    }
                }
            }
        }
    }
    let elem = document.getElementById("pop_up_detail");

    elem.classList.remove("display_none");
    elem.classList.add("display_flex");
}

/**
 * Delete group
 * @param {integer} id_group - Id group
 * @param {integer} service - Id service
 * @param {integer} chief - Id chief of group
 * @param {integer} users_id - Id user
 * @param {string} name - Name user
 * @param {integer} my_user - Id my user
 */
function deleteGroup(id_group, service, chief, users_id, name, my_user) {
    let values = users_id.split(',');
    const content = "a supprimé le groupe " + name + " le ";

    const log = {
        service: service,
        done_by: null,
        for_him: my_user,
        content: content,
    }
    apiPost("log/service", log);
    for (let i = 0; values[i]; i++) {
        const check = {
            id: parseInt(values[i]),
            group: 0,
        };
        apiUpdate("users/update-group", check);
    }
    const check = {
        id: chief,
        group: 0,
    };
    apiUpdate("users/update-group", check);
    apiDelete("services/groups", id_group, function () {
        history.go();
    });
}

/**
 * Create group
 * @param {integer} id_service - Id service
 * @param {integer} my_user - Id my user
 */
function createGroup(id_service, my_user) {
    const selected = document.querySelectorAll("#users_group option:checked");
    let values = Array.from(selected).map(el => el.value);
    let name = document.getElementById("name_equipe").value;
    const chief = document.getElementById("chief_group").value;
    const service = id_service;
    let content;

    for (let i = 0; values[i]; i++) {
        if (chief == values[i])
            values.splice(i, 1);
    }
    if (name.length < 1)
        name = "Pas de nom";
    content = "a creé le groupe " + name + " le ";
    const log = {
        service: service,
        done_by: null,
        for_him: my_user,
        content: content,
    }
    apiPost("log/service", log);
    const group = {
        service: service,
        chief: chief,
        users_id: values.toString(),
        name: name,
    }
    apiPost("services/groups", group);
    for (let i = 0; values[i]; i++) {
        const check = {
            id: values[i],
            group: 1,
        };
        apiUpdate("users/update-group", check);
    }
    const check = {
        id: chief,
        group: 1,
    };
    apiUpdate("users/update-group", check, function () {
        history.go();
    });
}