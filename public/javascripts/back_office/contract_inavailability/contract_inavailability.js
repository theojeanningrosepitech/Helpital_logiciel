/**
 * @module contract_inavailability
 */

/**
 * Show pop up create inavailability
 */
function showPopUpAvailability() {
    let elem = document.getElementById("pop_up_availability");

    elem.classList.remove("display_none");
    elem.classList.add("display_flex");
}

/**
 * Hide pop up create inavailability
 */
function backServiceAvailability() {
    let elem = document.getElementById("pop_up_availability");

    elem.classList.add("display_none");
    elem.classList.remove("display_flex");
}

/**
 * Create a new inavailability
 * @param {object} all_users - All users with all details
 * @param {integer} done_by - Id my user
 * @param {object} availabilities - All inavailability
 */
function newAvailability(all_users, done_by, availabilities) {
    const user = document.getElementById("availability_user").value;
    const problem = document.getElementById("inavailability").value;
    let note = document.getElementById("availability_note").value;
    let content = "problème";
    let textProblem = "problème";
    let id_service = 1;

    for (let i = 0; all_users[i]; i++) {
        if (all_users[i].id == user)
            id_service = all_users[i].service;
    }
    if (problem == 1)
        textProblem = "part en vacances";
    if (problem == 2)
        textProblem = "a eu un accident de travail";
    if (problem == 3)
        textProblem = "est en arrêt maladie";
    if (done_by == user)
        done_by = null;
    content = textProblem + "\nNote : " + note.replace("'", "`") + "\nLe";
    const log = {
        service: id_service,
        done_by: done_by,
        for_him: user,
        content: content,
    }
    apiPost("log/service", log);
    const availability = {
        user_id: user,
        title: problem,
        note: note.replace("'", "`"),
    }
    apiPost("availability", availability);
    const check = {
        id: user,
        availability: problem,
    };
    apiUpdate("users/update-availability", check);
    const here = {
        id: user,
        here: 0,
    };
    apiUpdate("users/updateHere", here);
    for (let i = 0; availabilities[i]; i++) {
        if (user == availabilities[i].user_id && availabilities[i].close_at == null) {
            const close_availability = {
                id: availabilities[i].id,
            };
            apiUpdate("availability/closeAt", close_availability);
        }
    }
    history.go();
}

/**
 * End inavailability
 * @param {integer} user - Id user
 * @param {integer} problem - Id type of inavailability
 * @param {integer} id_service - Id service
 * @param {integer} done_by - Id my user
 * @param {object} availabilities - All inavailability
 */
function comeBackToWork(user, problem, id_service, done_by, availabilities) {
    let content;
    let textProblem;

    if (problem == 1)
        textProblem = "est revenu(e) de vacances";
    if (problem == 2)
        textProblem = "est de retour après son accident";
    if (problem == 3)
        textProblem = "est guéri(e)";
    content = textProblem + " le";
    if (done_by == user)
        done_by = null;
    const log = {
        service: id_service,
        done_by: done_by,
        for_him: user,
        content: content,
    }
    apiPost("log/service", log);
    const check = {
        id: user,
        availability: 0,
    };
    apiUpdate("users/update-availability", check);
    for (let i = 0; availabilities[i]; i++) {
        if (user == availabilities[i].user_id && availabilities[i].close_at == null) {
            const close_availability = {
                id: availabilities[i].id,
            };
            apiUpdate("availability/closeAt", close_availability);
        }
    }
    history.go();
}

/**
 * Search all users
 */
function searchAllUserCI() {
    let block = document.getElementsByClassName("block_name_user_ci");

    for (let i = 0; block[i]; i++)
        block[i].classList.remove("display_none");
}

/**
 * Search name user
 */
function searchNameUserAvailability() {
    let inputMsg = document.getElementById("search_name_user").value;
    let name = document.getElementsByClassName("get_name_lastname");
    let name2 = document.getElementsByClassName("get_name_firstname");
    let block = document.getElementsByClassName("block_name_user_ci");
    let role = document.getElementsByClassName("get_role");
    let nameFull;
    let nameFull2;

    for (let i = 0; i < name.length; i++) {
        nameFull = name[i].innerHTML + " " + name2[i]. innerHTML;
        nameFull2 = name2[i].innerHTML + " " + name[i]. innerHTML;
        if (!name[i].innerHTML.toLowerCase().includes(inputMsg.toLowerCase()) && !name2[i].innerHTML.toLowerCase().includes(inputMsg.toLowerCase())
            && !nameFull.toLowerCase().includes(inputMsg.toLowerCase()) && !nameFull2.toLowerCase().includes(inputMsg.toLowerCase())
            && !role[i].innerHTML.toLowerCase().includes(inputMsg.toLowerCase()))
            block[i].classList.add("display_none");
        else
            block[i].classList.remove("display_none");
    }
}

/**
 * Search inavailability holiday
 */
function searchHoliday() {
    let block = document.getElementsByClassName("block_name_user_ci");
    let availabilityName = document.getElementsByClassName("get_availability_name");
    let availability = document.getElementsByClassName("get_availability");

    for (let i = 0; availability[i]; i++) {
        if (availability[i].innerHTML != 0 && availabilityName[i].innerHTML == 1)
            block[i].classList.remove("display_none");
        else
            block[i].classList.add("display_none");
    }
}

/**
 * Search inavailability crash
 */
function searchCrash() {
    let block = document.getElementsByClassName("block_name_user_ci");
    let availabilityName = document.getElementsByClassName("get_availability_name");
    let availability = document.getElementsByClassName("get_availability");

    for (let i = 0; availability[i]; i++) {
        if (availability[i].innerHTML != 0 && availabilityName[i].innerHTML == 2)
            block[i].classList.remove("display_none");
        else
            block[i].classList.add("display_none");
    }
}

/**
 * Search inavailability seek
 */
function searchSeek() {
    let block = document.getElementsByClassName("block_name_user_ci");
    let availabilityName = document.getElementsByClassName("get_availability_name");
    let availability = document.getElementsByClassName("get_availability");

    for (let i = 0; availability[i]; i++) {
        if (availability[i].innerHTML != 0 && availabilityName[i].innerHTML == 3)
            block[i].classList.remove("display_none");
        else
            block[i].classList.add("display_none");
    }
}

/**
 * Search no contract
 */
function searchContract() {
    let block = document.getElementsByClassName("block_name_user_ci");
    let contract = document.getElementsByClassName("get_contract");

    for (let i = 0; contract[i]; i++) {
        if (contract[i].innerHTML == 0)
            block[i].classList.remove("display_none");
        else
            block[i].classList.add("display_none");
    }
}

/**
 * Search contract CDI
 */
function searchCdi() {
    let block = document.getElementsByClassName("block_name_user_ci");
    let contractName = document.getElementsByClassName("get_contract_name");
    let contract = document.getElementsByClassName("get_contract");

    for (let i = 0; contract[i]; i++) {
        if (contract[i].innerHTML != 0 && contractName[i].innerHTML == "CDI")
            block[i].classList.remove("display_none");
        else
            block[i].classList.add("display_none");
    }
}

/**
 * Search contract CDD
 */
function searchCdd() {
    let block = document.getElementsByClassName("block_name_user_ci");
    let contractName = document.getElementsByClassName("get_contract_name");
    let contract = document.getElementsByClassName("get_contract");

    for (let i = 0; contract[i]; i++) {
        if (contract[i].innerHTML != 0 && contractName[i].innerHTML == "CDD")
            block[i].classList.remove("display_none");
        else
            block[i].classList.add("display_none");
    }
}

/**
 * Search contract Period of test
 */
function searchPeriod() {
    let block = document.getElementsByClassName("block_name_user_ci");
    let contractName = document.getElementsByClassName("get_contract_name");
    let contract = document.getElementsByClassName("get_contract");

    for (let i = 0; contract[i]; i++) {
        if (contract[i].innerHTML != 0 && contractName[i].innerHTML == "Periode de test")
            block[i].classList.remove("display_none");
        else
            block[i].classList.add("display_none");
    }
}

/**
 * Show detail of user
 * @param {integer} user - Id user
 * @param {object} service - All services
 * @param {string} role - name of role
 * @param {string} avatar - Link of img for avatar
 * @param {object} logs - All logs
 * @param {object} all_users - All users
 * @param {object} availabilities - All inavailability
 * @param {object} contract - All contracts
 */
function checkDetailCI(user, service, role, logs, all_users, availabilities, contract) {
    let z = 0;
    let background;
    let count = 0;
    //avatar=("../public/images/infirmiere3.png")

    replaceText();
    elementGroupsHtml(user, service[user.service - 1].title, role);
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
 * Hide pop up detail user
 */
function backCIDetail() {
    let elem = document.getElementById("pop_up_detail");

    elem.classList.add("display_none");
    elem.classList.remove("display_flex");
}

/**
 * Hide pop up add contract
 */
function backContractCI() {
    let elem = document.getElementById("pop_up_add_contract");

    elem.classList.add("display_none");
    elem.classList.remove("display_flex");
}

/**
 * End contract
 * @param {integer} user - Id user
 * @param {integer} id_contract - Id contract
 */
function finishContract(user, id_contract) {
    const check = {
        id: user,
        contract: 0,
    };
    apiUpdate("users/update-contract", check);
    const end = {
        id: id_contract,
    }
    apiUpdate("contract/closeAt", end);
    history.go();
}

/**
 * Create contract
 */
function addContract() {
    const id = document.getElementById("user_contract").value;
    const contract = document.getElementById("type_contract").value;

    const check = {
        id: id,
        contract: 1,
    };
    apiUpdate("users/update-contract", check);
    const start = {
        user_id: id,
        title: contract,
    }
    apiPost("contract", start);
    history.go();
}

/**
 * Show pop up add contract
 */
function showPopUpContract() {
    let elem = document.getElementById("pop_up_add_contract");

    elem.classList.remove("display_none");
    elem.classList.add("display_block");
}
