/**
 * @module mailPage
 */

/**
 * Send a mail to one/several receivers by using the Gmail API with the values of inputs on the form
 */
function sendMail() {
    var send_dest = document.getElementById('dest').value;
    var send_message = document.getElementById('mess').value;
    var send_subject = document.getElementById('subject').value;

    fetch(`/api/mailPage/send_email?message=${send_message}&dest=${send_dest}&subject=${send_subject}`).then(function(response) {
        if (response.status >= 200 && response.status < 300)
            customAlert("Mail envoyé", "", OK);
        else {
            customAlert(MSG_ERROR, MSG_RETRY, WARNING);
        }
    }).catch(function(e) {
        customAlert(MSG_ERROR, MSG_INTERNAL_ERROR, WARNING);
    });
}