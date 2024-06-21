/**
 * @module messaging
 */

let conversationID = null;
let fileInfo;

if (document.getElementById('id_conv')) {
    conversationID = parseInt(document.getElementById('id_conv').value);
}

/**
 * Send message
 * @param {integer} myId - Id my user
 * @param {integer} convId - Id conversation
 * @param {integer} groupMsg - Id group msg
 * @param {object} insult - Table insult
 */
async function sendMessageFree(myId, convId, groupMsg, insult) {
    let content = document.getElementById("content");
    let picture = document.getElementById("file_name");
    let picture_name = document.getElementById("file");
    let emergency_btn = document.getElementById("emergency_btn");
    const div = document.createElement('div');
    let content_filter = content.value;
    let id_notif = [];
    let new_content = content.value;
    let new_content_filter;

    if (insult) {
        for (let i = 0; insult[i]; i++) {
            content_filter = content_filter.replaceAll(insult[i].name, insult[i].name_filter);
        }
    }
    new_content_filter = content_filter;
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
    await apiPost(`messages/message?my_id=${myId}&users_id=0&conv_id=${convId}`, data, function(response) {
        response.json().then(function (dataMsg) {
            /*            const link = document.createElement('a')

                        window.location.href = '/conversation?id_conv=' + data.id;
                        link.href = `/conversation?id_conv=${convId}`;
                        //window.reload();
                        document.body.appendChild(link)
                        link.click()
                        document.body.removeChild(link)

            */
            content.value = '';
            const list = document.getElementById("conversation-content");

            fetch(`/messaging/dynam?id=${dataMsg.id}`).then(function (response) {
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

websocket.addEventListener('message', 'new', (message) => {
    const list = document.getElementById("conversation-content");

    if (message.data.conversation_id == conversationID) {
        fetch('/message/dynam?id=' + message.identifiers.id).then(function (response) {
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

if (conversationID != null) {
    document.getElementById('content').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.target.nextElementSibling.click();
            e.preventDefault();
        }
    });
}

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

function change_conv(id) {
    let clear = document.getElementById("clear");

    clear.replaceChildren();
    fetch(`/messaging/widget?id_conv=${id}`).then(function (response) {
        if (response.status >= 200 && response.status < 300)
            response.text().then(function (data) {
                const template = document.createElement('template');
                template.innerHTML = data;
                clear.appendChild(template.content.childNodes[0]);
                clear.scrollTo(0, clear.scrollHeight);
            })
    });
}

function createConvForAll(conversation) {
    let name = document.getElementById("name_conv").value;
    const div = document.createElement('div');

    if (name.length < 1) {
        customAlert("Création d'une conversation", 'Veuillez ajouter un titre', SETTING, div.innerHTML);
        return;
    }
    for (let i = 0; conversation[i]; i++) {
        if (conversation[i].group_conv == 2 && conversation[i].title == name) {
            customAlert("Création d'une conversation", 'Le titre de la conversation existe déjà', SETTING, div.innerHTML);
            return;
        }
    }
    const newConv = {
        user_id: "0",
        title: name,
        group_conv: 2,
    };
    apiPost('conversations/conversation', newConv, function() {
        window.location.reload();
    });
}

/**
 * Delete conv for all
 */
function delete_conv_for_all(conv_id) {
    apiDelete('conversations', conv_id, function () {
        window.location.reload();
    });
}

/**
 * Show pop up create conv
 */
function showPopUpNewConv() {
    let elem = document.getElementById("pop_up_all_conv");

    elem.classList.remove("display_none");
    elem.classList.add("display_block");
}

/**
 * hide pop up create conv
 */
function backPopUpNewConv() {
    let elem = document.getElementById("pop_up_all_conv");

    elem.classList.add("display_none");
    elem.classList.remove("display_block");
}