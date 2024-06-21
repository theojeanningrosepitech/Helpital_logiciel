/**
 * @module insult
 */

/**
 * Add insult in list
 */
function addInsult() {
    let content = document.getElementById("content").value;
    let content_filter = content.replace(/[a-z]/g, '*');
    const div = document.createElement('div');
    let name = document.getElementsByClassName("get_word");

    if (content.length < 2) {
        customAlert("Ajouter un mot", 'Veuillez ajouter un mot et non un caractère', SETTING, div.innerHTML);
        return;
    } else if (name) {
        for (let i = 0; i < name.length; i++) {
            if (name[i].innerHTML.toLowerCase() == content.toLowerCase()) {
                customAlert("Ajouter un mot", 'Le mot existe déjà', SETTING, div.innerHTML);
                return;
            }
        }
    }
    const data = {
        name: content,
        name_filter: content_filter,
    }
    apiPost(`insult`, data, function(response) {
            response.json().then(function(data) {
                window.location.reload();
        });
    });
}

/**
 * Delete insult
 * @param {integer} id - Id word
 */
function deleteInsult(id) {
    apiDelete('insult', id);
    history.go();
}

/**
 * Search words
 */
function searchWord() {
    let inputMsg = document.getElementById("search_word").value;
    let name = document.getElementsByClassName("get_word");
    let block = document.getElementsByClassName("block_name_user_i");

    for (let i = 0; i < name.length; i++) {
        if (!name[i].innerHTML.toLowerCase().includes(inputMsg.toLowerCase()))
            block[i].classList.add("display_none");
        else
            block[i].classList.remove("display_none");
    }
}