/**
 * @module messaging_notifs
 */

check_vue_on_msg();

/**
 * check view msg
 */
function check_vue_on_msg() {
    let all_msg = document.getElementsByClassName("notif_msg");
    let my_id = document.getElementById("myId").innerText;
    let msg;

    for (let i = all_msg.length; i > 0; i--) {
        const id = all_msg[i - 1].id;
        apiGet(`/api/messages/state?id_msg=${id}`, function (response) {
            response.json().then(function (data) {
                if (data.state == null) {
                    let state = [data.state, my_id];
                    msg = all_msg[i - 1].innerText;
                    const see = msg.split('\n');
                    if (see[see.length - 1] != "Vue" && see[see.length - 1] != "Vue par tous le groupe") {
                        const new_msg = {
                            id: parseInt(id),
                            state: state.toString(),
                        };
                        apiUpdate('messages', new_msg);
                        const notif_conv = {
                            id: data.conversation_id,
                            notif: parseInt(my_id),
                        }
                        apiUpdate('conversations/notif_state', notif_conv);
                    }
                } else {
                    let state = [];
                    let y = 0;

                    state = data.state.split(',');
                    for (let i = 0; i < state.length; i++) {
                        if (state[i] == my_id.toString())
                            y = 1;
                    }
                    if (y == 0) {
                        state.push(my_id);
                        msg = all_msg[i - 1].innerText;
                        const see = msg.split('\n');
                        if (see[see.length - 1] != "Vue" && see[see.length - 1] != "Vue par tous le groupe") {
                            const new_msg = {
                                id: parseInt(id),
                                state: state.toString(),
                            };
                            apiUpdate('messages', new_msg);
                            const notif_conv = {
                                id: data.conversation_id,
                                notif: parseInt(my_id),
                            }
                            apiUpdate('conversations/notif_state', notif_conv);
                        }
                    }
                }
            });
        });
    }
}