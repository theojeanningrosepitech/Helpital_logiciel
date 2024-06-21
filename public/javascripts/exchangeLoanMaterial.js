/**
 * @module exchange_loan_materials
 */

/**
 * Send a mail to one/several receivers by using the Gmail API
 * @param {string} title - Title of the mail
 * @param {string} emailDest - recipient of the mail
 */
function sendMail(title, emailDest) {
    fetch(`/api/exchangeLoanMaterial/send_email?title=${title}&dest=${emailDest}`).then(function(response) {
        if (response.status >= 200 && response.status < 300)
            customAlert("Mail envoyé", "", OK);
        else {
            customAlert(MSG_ERROR, MSG_RETRY, WARNING);
        }
    }).catch(function(e) {
        customAlert(MSG_ERROR, MSG_INTERNAL_ERROR, WARNING);
    });
}