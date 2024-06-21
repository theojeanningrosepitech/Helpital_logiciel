//- let fileInfo;
/**
 * Send a mail to one/several receivers by using the Gmail API with the values of inputs on the form
 */
 function sendMail() {
    let receiver = "contact-project+helpital-helpital-24617396-issue-@incoming.gitlab.com";
    let subject = document.getElementById('mail-subject').value;
    let content = document.getElementById('mail-content').value;

    fetch(`/api/mailPage/send_email?message=${content}&dest=${receiver}&subject=${subject}`).then(function(response) {
        if (response.status >= 200 && response.status < 300)
            console.log("Report bug: OK");
        else {
            console.log("Report bug: KO");
        }
    }).catch(function(e) {
        customAlert(MSG_ERROR, MSG_INTERNAL_ERROR, WARNING);
    });
}

function showImport() {
    if (document.getElementById('file_name').style.display == 'block') {
        document.getElementById('file_name').style.display = 'none';
    } else {
        document.getElementById('file_name').style.display = 'block';
    } 
}

function showColor() {
    if (document.getElementById('colorpalette').style.display == 'block') {
        document.getElementById('colorpalette').style.display = 'none';
    } else {
        document.getElementById('colorpalette').style.display = 'block';
    }
}

function colorBanner(color) {
    const banner = document.getElementById('profil-viewer');

    banner.style.background = color;
    update_banner()
}

function rgb2hex(color) {
    color = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    function hex(x) {
        return ("0" + parseInt(x).toString(16)).slice(-2);
    }
    return "#" + hex(color[1]) + hex(color[2]) + hex(color[3]);
}

const userId = document.getElementById('profil').getAttribute('userId');

async function update_banner() {

    console.log(rgb2hex(document.getElementById('profil-viewer').style.background));

    const new_banner = {
        id: userId,
        banner: rgb2hex(document.getElementById('profil-viewer').style.background)
    };
    await apiUpdate("user/banner", new_banner);
}

const image_input = document.querySelector('#file_name');

image_input.addEventListener("change", async function() {
    const reader = new FileReader();
    reader.addEventListener("load", async () => {
        const uploaded_image = await reader.result;
        const newAvatar = {
            id: userId,
            avatar: new String(uploaded_image)
        }
        await apiUpdate("user/avatar", newAvatar);
        document.querySelector("#displayImage").style.backgroundImage = `url(${uploaded_image})`;
    });
    reader.readAsDataURL(this.files[0]);
});

// async function openFile() {
//     let input = document.getElementById("file_name");
//     setFile(input, function(data) {
//        fileInfo = data;
//     });
//     const userId = document.getElementById('profil').getAttribute('userId');

//     if (fileInfo != null) {
//         console.log(fileInfo)
//         let result = await registerFile(fileInfo, `profile/${userId}`);
//         data.file = result.url;
//         data.file_name = result.name;
//         console.log(data.file)
//         const newAvatar = {
//                     id: userId,
//                     avatar: data.file
//             }
//         await apiUpdate("user/avatar", newAvatar);
//         document.querySelector("#displayImage").style.backgroundImage = `url(${data.file})`;
//     }
// }


// async function update_pfp() {
//     let pfp = document.getElementById("file_name");

//     apiUpdate('avatars', pfp, function(response) {
//         response.json().then(function(pfp) {
//             window.location.reload();
//         });
//     });
// }

/*function update_banner(id) {
    const new_banner = {
        id: parseInt(id),
        banner: document.getElementById('profil-viewer').style.background,
    };
    apiUpdate("users/update-banner", new_banner);
}*/


// /**
//  * show password on application
//  */
// function showPassword_neverco() {
//     let x = document.getElementById("myInput_neverco");
//     if (x.type === "password") {
//         x.type = "text";
//     } else {
//         x.type = "password";
//     }
// }

// /**
//  * show password on application
//  */
// function showPassword_everco() {
//     let x = document.getElementById("myInput_everco");
//     if (x.type === "password") {
//         x.type = "text";
//     } else {
//         x.type = "password";
//     }
// }

// /**
//  * open popUp with many avatar to choose
//  */
// function show_choose_avatar() {
//     let avatar = document.getElementById("all_avatars");

//     avatar.classList.remove("display_none");
// }

// /**
//  * close avatar popUp
//  */
// function back_profil() {
//     let avatar = document.getElementById("all_avatars");

//     avatar.classList.add("display_none");
// }

// /**
//  * Update current avatar in database
//  */
// function update_avatar(nbr, id) {
//     const new_avatar = {
//         id: parseInt(id),
//         avatar: parseInt(nbr + 1),
//     };
//     apiUpdate("users/update-avatar", new_avatar);
//     history.go(0);
// }

/**
 * Update current email in database
 */
function update_email(id) {
    const new_user = {
        id: parseInt(id),
        email: document.getElementById('emailvalue').value,
    };
    apiUpdate("users/update-email", new_user);
}

/**
 * Update current phone in database
 */
function update_phone(id) {
    const new_user = {
        id: parseInt(id),
        phone: document.getElementById('phonevalue').value,
    };
    apiUpdate("users/update-phone", new_user);
}

function updateProfil(id) {
    update_email(id);
    update_phone(id);
    window.location.reload();
}

// /**
//  * activate TOTP authentification on this account
//  */
// function enableTOTP() {
//     const elem = this.parentNode;

//     apiPost('auth/totp', {}, function(response) {
//         response.json().then(function(data) {
//             const img = document.createElement('img');
//             const div = document.createElement('div');

//             img.src = data.qrcode;
//             img.style.height = '20em';
//             img.style.width = 'auto';
//             img.style.left = '50%';
//             img.style.position = 'relative';
//             img.style.transform = 'translate(-50%, 0)';

//             div.appendChild(img);
//             customAlert('QR Code TOTP', 'Veuillez scanner ce QR Code en utilisant une application TOTP', SETTING, div.innerHTML);
//             elem.previousElementSibling.remove();
//             elem.remove();
//         });
//     });
// }

// /**
//  * disable TOTP authentification on this account
//  */
// function disableTOTP() {
//     const elem = this.parentNode;

//     apiDelete('auth/totp', null, function() {
//         elem.previousElementSibling.remove();
//         elem.remove();
//     });
// }

// /**
//  * show Qrcode for totp authentification
//  */
// function show2faQrCode() {
//     const elem = this.parentNode;

//     apiGet('/api/auth/2fa/qrcode', function(response) {
//         response.text().then(function(data) {
//             const img = document.createElement('img');
//             const div = document.createElement('div');

//             img.src = data;
//             img.style.height = '20em';
//             img.style.width = 'auto';
//             img.style.left = '50%';
//             img.style.position = 'relative';
//             img.style.transform = 'translate(-50%, 0)';
//             div.appendChild(img);
//             customAlert('QR Code 2FA', 'Veuillez scanner ce QR Code en utilisant l\'application mobile Helpital', SETTING, div.innerHTML);
//         });
//     });
// }

// /**
//  * send request by mail to change password of current connecte account
//  */
// function resetPassword() {
//     apiGet('/api/users/reset-password?user_id=' + document.getElementById('password').getAttribute('user_id'), function() {
//         customAlert('Lien envoyé par mail', 'Un lien de réinitialisation de mot de passe vient d\'être envoyé par mail à l\'adresse de ce profil.', OK);
//     });
// }

// const totpButton = document.getElementById("totp");

// if (totpButton.innerText.indexOf('Activer') !== -1)
//     totpButton.addEventListener('click', enableTOTP);
// else
//     totpButton.addEventListener('click', disableTOTP);

// const qrcode = document.getElementById('qrcode');

// if (qrcode) {
//     qrcode.addEventListener('click', show2faQrCode);
// }

// document.getElementById('password').addEventListener('click', resetPassword);
// const userID = document.getElementById('profil').getAttribute('userId');

// websocket.addEventListener('user', 'update', (message) => {
//     if (message.identifiers.id == userID) {
//         if (message.data.avatar || message.data.totp_secret || message.data.qrcode2fa) {
//             window.location.reload();
//             return;
//         }

//         if (message.data.lastname)
//             document.getElementsByName('lastname')[0].innerText = message.data.lastname;
//         if (message.data.firstname)
//             document.getElementsByName('firstname')[0].innerText = message.data.firstname;
//         if (message.data.login)
//             document.getElementsByName('login')[0].innerText = message.data.login;
//         if (message.data.email)
//             document.getElementById('emailvalue').value = message.data.email;
//         if (message.data.phone)
//             document.getElementById('phonevalue').value = message.data.phone;

//         if (message.data.role) {
//             fetch('/api/roles?id=' + message.data.role).then(function(response) {
//                 if (response.status >= 200 && response.status < 300)
//                     response.json().then(function (data) {
//                         if (data.length === 1)
//                             document.getElementsByName('role')[0].innerText = data[0].role_name;
//                     });
//             });
//         }

//         if (message.data.service) {
//             fetch('/api/service?id=' + message.data.service).then(function(response) {
//                 if (response.status >= 200 && response.status < 300)
//                     response.json().then(function (data) {
//                         if (data.length === 1)
//                             document.getElementsByName('service')[0].innerText = data[0].title;
//                     });
//             });
//         }
//     }
// });
