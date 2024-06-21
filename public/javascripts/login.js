function update(login, machineId) {
    let container = document.getElementById('login-container');
    container.innerHTML = `<div class="login-section">
                                <div class="login-header">
                                    <img class="login-header image" src="/images/h_logo1.png">
                                </div>
                                <div class="login-content">
                                    <span class="login-content title">Connexion</span>
                                    <form name="login" method="post" action="/auth/login">
                                        <label>
                                            <input type="text" placeholder="Identifiant" name="login" value="` + login + `">
                                        </label>
                                        <label>
                                            <input id="password" type="password" placeholder="Mot de passe" name="password">
                                        </label>
                                        <label class="show-password-checkbox">
                                            <input id="showPassword" type="checkbox" onclick="changeStatus()">
                                            <span>Afficher le mot de passe</span>
                                        </label>
                                        <input type="hidden" name="machineId" value="` + machineId + `">
                                        <input type="submit" id='submit' value='Connexion'>
                                    </form>
                                </div>
                                <div class="login-footer">
                                    <a href="#">Mot de passe oublié ?</a>
                                </div>
                            </div>`
}

function changeStatus() {
    document.getElementById('password').type = document.getElementById("showPassword").checked ? 'text' : 'password';
}

function deleteUser(userId, machineId, element) {
    const container = document.getElementsByClassName("login-content");
    container[0].removeChild(element.parentElement)
    fetch(`/api/machine/users/${machineId}/${userId}`, {
        method: "delete"
    });
}

function resetPassword() {
    const data = {
        token: document.body.getAttribute('token'),
        password : document.getElementById('password').value
    };
    const confirmPassword = document.getElementById('password-confirm').value;

    if (data.password === '' || confirmPassword === '') {
        customAlert(MSG_ERROR, 'Vous devez remplir tous les champs.', WARNING);
        return;
    } else if (data.password !== confirmPassword) {
        customAlert(MSG_ERROR, 'Les mots de passes doivent être identiques.', WARNING);
        return;
    }

    fetch('/api/users/reset-password', {
        method: 'PUT',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {'Content-Type': 'application/json'},
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: JSON.stringify(data)
    }).then(function (response) {
        if (response.status >= 200 && response.status < 300) {
            customAlert(MSG_SUCCESS, 'Votre mot de passe vient d\'être réalisé. Vous pouvez désormais vous connecter sur le logiciel Helpital.', OK);
        } else {
            customAlert(MSG_ERROR, 'Ce lien de réinitialisation a probablement expiré.', WARNING);
        }
    }).catch(function () {
        customAlert(MSG_ERROR, MSG_INTERNAL_ERROR, WARNING);
    });
}

function initNfcReader() {
    electronAPI.on('nfc', (event, readerData) => {
        const data = {
            method: 'nfc',
            code: readerData
        };
        const form = document.createElement("form");
        const code = document.createElement("input");
        const method = document.createElement("input");
        const submit = document.createElement("input");

        form.setAttribute("method", "post");
        form.setAttribute("action", "/auth/2fa/login");
        code.setAttribute("type", "text");
        code.setAttribute("name", "code");
        code.setAttribute("value", data.code);

        method.setAttribute("type", "text");
        method.setAttribute("name", "method");
        method.setAttribute("value", data.method);

        submit.setAttribute("type", "submit");
        submit.setAttribute("value", "submit");

        form.appendChild(code);
        form.appendChild(method);
        form.appendChild(submit);
        form.style.display = 'none';

        document.getElementById("flex-container").appendChild(form);
        form.submit();
    });
}
