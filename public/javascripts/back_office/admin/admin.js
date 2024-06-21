
function revokeGmailOAuth2() {
    fetch('/api/oauth2', {
        method: 'DELETE',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
            'X-Service': 'google'
        },
        redirect: 'follow',
        referrerPolicy: 'no-referrer'
    }).then(function(response) {
        if (response.status >= 200 && response.status < 300) {
    //        window.location.reload();
        } else
            customAlert(MSG_ERROR, MSG_RETRY, WARNING);
    }).catch(function() {
        customAlert(MSG_ERROR, MSG_INTERNAL_ERROR, WARNING);
    });
}

function connectGmailOAuth2() {
    const button = document.getElementById('btn-oauth2-gmail');
    const gmailClientID = button.getAttribute('client-id');
    const baseUrl = button.getAttribute('base-url');

    window.open('https://accounts.google.com/o/oauth2/auth?scope=email https://www.googleapis.com/auth/gmail.send&access_type=offline&redirect_uri=' + baseUrl + '/oauth2/google&response_type=code&client_id=' + gmailClientID);
}

websocket.addEventListener('oauth2', 'update', (message) => {
    const div = document.getElementById('oauth2');

    div.children[0].innerText = 'Déconnecter ' + message.data.email;
    div.children[0].style.display = 'block';
    div.children[1].style.display = 'none';
});

websocket.addEventListener('oauth2', 'delete', (message) => {
    const div = document.getElementById('oauth2');

    div.children[0].style.display = 'none';
    div.children[1].style.display = 'block';
});
