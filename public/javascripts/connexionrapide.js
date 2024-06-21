const fs = require('fs');

let users = [];

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return;
}

function init() {
    fs.readFile('views/database/users.json', (err, data) => {
        users = JSON.parse(data);
        addElement();
    })
}

function addElement() {
    let cookieId = getCookie('Id');
    const user = users.find(u => {
        return u.id === cookieId;
    });
    let email = document.getElementById('email'); 
    email.insertAdjacentHTML('afterend', `<h2> ${user.email} </h2>`);
}