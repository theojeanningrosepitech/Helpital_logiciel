/**
 * @module conversation
 */

const conversationID = parseInt(document.getElementById('conversation-content').getAttribute('conversation-id'));
let fileInfo;

/**
 * Change color button urgency
 */
function updateBtn() {
    let btn = document.getElementById("emergency_btn");

    if (btn.value == 0) {
        btn.classList.add("btn_red");
        btn.classList.remove("btn_green");
        btn.value = 1;
    } else {
        btn.classList.add("btn_green");
        btn.classList.remove("btn_red");
        btn.value = 0;
    }
}

/**
 * Hide pop up
 */
function hidePopUp() {
    let blockImg = document.getElementById("img_dialog");
    const img = document.getElementById("temporary_img");
    blockImg.removeChild(img)

    document.getElementById('dialog_display').style.display = 'none';
}

/**
 * Download img
 * @param {string} url - URL img
 * @param {string} fileName - Name img
 */
async function downloadF(url, fileName) {
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

/**
 * Display img
 * @param {string} _img - URL img
 */
function display(_img) {
    let blockImg = document.getElementById("img_dialog");
    if (_img.includes('.pdf')) {
        const value = document.createElement("embed");
        value.src = _img;
        value.alt = _img;
        value.id = 'temporary_img';
        value.className = 'dialog_img_width';
        blockImg.appendChild(value);
    } else{
        const img = document.createElement("img");
        img.src = _img;
        img.alt = _img;
        img.id = 'temporary_img';
        img.className = 'dialog_img_width';
        blockImg.appendChild(img);
    }
    document.getElementById('dialog_display').style.display = 'block';
}

/**
 * Open file
 */
function openFile() {
    let input = document.getElementById("file_name");
    setFile(input, function(data) {
       fileInfo = data;
    });
}

/**
 * Send message
 * @param {integer} myId - Id my user
 * @param {integer} usersId - Id user
 * @param {integer} convId - Id conversation
 * @param {integer} groupMsg - Id group msg
 * @param {object} insult - Table insult
 * @param {object} allUsers - details all users
 */
async function sendMessage(myId, usersId, convId, groupMsg, insult, allUsers) {
    let content = document.getElementById("content");
    let picture = document.getElementById("file_name");
    let picture_name = document.getElementById("file");
    let emergency_btn = document.getElementById("emergency_btn");
    const div = document.createElement('div');
    let content_filter = content.value;
    let id_notif = [];
    let new_content = content.value;
    let new_content_filter;

    if (insult[0]) {
        for (let i = 0; insult[i]; i++) {
            content_filter = content_filter.replaceAll(insult[i].name, insult[i].name_filter);
        }
    }
    new_content_filter = content_filter;
    for (let i = 0; allUsers[i]; i++) {
        if (content.value.search("@" + allUsers[i].firstname + allUsers[i].lastname + "#" + allUsers[i].id) != -1) {
            id_notif.push(allUsers[i].id);
            new_content = content.value.replaceAll(`@${allUsers[i].firstname}${allUsers[i].lastname}#${allUsers[i].id}`, `@${allUsers[i].firstname}${allUsers[i].lastname}`);
            new_content_filter = content_filter.replaceAll(`@${allUsers[i].firstname}${allUsers[i].lastname}#${allUsers[i].id}`, `@${allUsers[i].firstname}${allUsers[i].lastname}`);
        }
    }
    if (id_notif[0]) {
        let put_data = {
            id: convId,
            notif: id_notif.toString(),
        }
        apiUpdate('conversations/notif', put_data);
    }
    let data = {
        content: new_content,
        content_filter: new_content_filter,
        file_name: "",
        file: "",
        emergency_btn: emergency_btn.value,
        group_msg: groupMsg,
    }

    if (new_content.length == 0 && picture.value.length == 0) {
        customAlert("Envoyer un message", 'Veuillez ajouter une image ou un text', SETTING, div.innerHTML);
        return;
    }
    if (fileInfo != null) {
        let result = await registerFile(fileInfo, `conversations/${convId}`);
        data.file = result.url;
        data.file_name = result.name;
    }
    let resetFile = document.getElementById("file_name").value = null;
    await apiPost(`messages/message?my_id=${myId}&users_id=${usersId}&conv_id=${convId}`, data, function(response) {
        response.json().then(function (dataMsg) {
/*            const link = document.createElement('a')

            window.location.href = '/conversation?id_conv=' + data.id;
            link.href = `/conversation?id_conv=${convId}`;
            //window.reload();
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

*/
            fileInfo = null;
            content.value = '';
            const list = document.getElementById("conversation-content");
            fetch('/conversation/fragment?id=' + dataMsg.id).then(function (response) {
                if (response.status >= 200 && response.status < 300)
                    response.text().then(function (data) {
                        const template = document.createElement('template');
                        template.innerHTML = data;
                        list.appendChild(template.content.childNodes[0]);
                        list.scrollTo(0, list.scrollHeight);
                        if (document.getElementById('scroll_bar_bottom')) {
                            let elem = document.getElementById('scroll_bar_bottom');
                            elem.scrollTop = elem.scrollHeight;
                        }
                    })
            });
        });
    });
}

/**
 * Add patient in input
 * @param {array} patient - details patieant
 */
function add_in_input(patient) {
    let text = "#" + patient.firstname + patient.lastname + "#" + patient.id + " ";
    let input = document.getElementById('content');

    input.value += text;
}

/**
 * Add patient in input
 * @param {array} user - details user
 */
function add_in_input_user(user) {
    let text = "@" + user.firstname + user.lastname + "#" + user.id + " ";
    let input = document.getElementById('content');
    let block = document.getElementById("users_display");

    input.value = input.value.substr(0, input.value.lastIndexOf(" @") + 1) + text;
    block.classList.add("display_none");
}

/**
 * Display list patients
 */
function displayList() {
    let block = document.getElementById("patients_display");


    if (block.classList.contains("display_none"))
        block.classList.remove("display_none");
    else
        block.classList.add("display_none");
}

/**
 * Display list users
 */
function searchUserConv() {
    let user = document.getElementsByClassName("get_user_conv");
    let inputMsg = document.getElementById("content").value;
    let z = 0;
    let block = document.getElementById("users_display");

    if (!inputMsg[0] || inputMsg.indexOf("@") == -1)
        block.classList.add("display_none");
    for (let i = 0; user[i] && inputMsg[0] && inputMsg.indexOf("@") != -1; i++) {
        if (!user[i].innerHTML.toLowerCase().includes(inputMsg.substr(inputMsg.lastIndexOf(" @") + 1).toLowerCase()))
            user[i].classList.add("display_none");
        else {
            user[i].classList.remove("display_none");
            block.classList.remove("display_none");
        }
    }
    for (let i = 0; user[i]; i++) {
        if (!user[i].classList.contains("display_none"))
            z += 1;
    }
    if (z == 0)
        block.classList.add("display_none");

}

/**
 * Calcul zie img
 * @param {string} img - URL img
 */
function calcImgSize(img) {
    let y = 1;
    if (img.endsWith('==')) {
        y = 2
    }
    const x_size = (img.length * (3 / 4)) - y;
    return Math.round(x_size / 1024);
}

websocket.addEventListener('message', 'new', (message) => {
    const list = document.getElementById("conversation-content");

    if (message.data.conversation_id == conversationID) {
        fetch('/conversation/fragment?id=' + message.identifiers.id).then(function (response) {
            if (response.status >= 200 && response.status < 300)
                response.text().then(function (data) {
                    const template = document.createElement('template');
                    template.innerHTML = data;
                    list.appendChild(template.content.childNodes[0]);
                    list.scrollTo(0, list.scrollHeight);
                })
        });
    }
});

document.getElementById('content').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.target.nextElementSibling.click();
        e.preventDefault();
    }
});

/**
 * Delete message
 * @param {integer} id - id msg
 */
async function deleteMsg(id) {
    const update_msg = {
        id: id,
        del_msg: 1,
    };
    apiUpdate('messages/delete', update_msg);
    history.go();
}

/**
 * Redirect capsule patient
 * @param {object} patient - details patient
 */
function showPatientViewerFromConv(patient, s, s1, s2, s3) {

    window.location.href = "/patients?patientId=" + patient.id;

   /* const patientViewer = document.getElementById("capsule-viewer");
    const informations = document.querySelector(".informations");

    if (informations.firstChild)
        var children = informations.firstChild;

    if (patientViewer.style.display == "none" || getComputedStyle(patientViewer, null).display == "none" || !informations.firstChild)
        patientViewer.style.display = "flex";
    else if (informations.firstChild && children.innerText == patient.firstname + " " + patient.lastname)
        patientViewer.style.display = "none";
    else
        patientViewer.style.display = "flex";

    var h1 = document.createElement("h1");
    var span = document.createElement("span");

    informations.innerHTML = "";
    h1.innerText = patient.firstname + " " + patient.lastname;
    span.innerText = "Patient";

    informations.appendChild(h1);
    informations.appendChild(span);

    const inputBirthDate = document.getElementById("input-birthDate");
    const inputRoomId = document.getElementById("input-roomId");
    const inputSsNumber = document.getElementById("input-ssNumber");
    const inputServiceId = document.getElementById("input-serviceId");

    inputBirthDate.value = patient.birthdate.slice(0, 10).split("-").reverse().join("/");
    inputRoomId.value = patient.room_id;
    inputSsNumber.value = patient.ss_number;*/
}

/**
 * Add user(s) in conversation
 * @param {integer} conv_id - Id conversation
 */
function addUsersInGroup(conv_id) {
    const selected = document.querySelectorAll("#users_group_add option:checked");
    let values = Array.from(selected).map(el => el.value);
    const div = document.createElement('div');

    if (values.length < 1) {
        customAlert("Ajouter des utilisateurs", 'Veuillez ajouter une personne au minimum', SETTING, div.innerHTML);
        return;
    }
    const addUsers = {
        id: conv_id,
        user_id: values.toString(),
    };
    apiUpdate('conversations/add_users', addUsers, function () {
        window.location.reload();
    });
}

/**
 * Delete User in group
 * @param {integer} user_id - Id user
 * @param {integer} conv_id - Id conversation
 */
function deleteUserInGroup(user_id, conv_id) {
    const deleteUsers = {
        id: conv_id,
        user_id: parseInt(user_id),
    };
    apiUpdate('conversations/delete_user', deleteUsers, function () {
        window.location.reload();
    });
}

/**
 * Show pop up add user(s) group
 */
function showPopUpAddUsersInGroup() {
    let elem = document.getElementById("pop_up_add_users_in_group");

    elem.classList.remove("display_none");
    elem.classList.add("display_flex");
}

/**
 * hide pop up add user(s) group
 */
function backPopUpAddUsersInGroup() {
    let elem = document.getElementById("pop_up_add_users_in_group");

    elem.classList.add("display_none");
    elem.classList.remove("display_flex");
}
