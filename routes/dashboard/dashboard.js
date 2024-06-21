const express = require('express');
const router = express.Router();
const axios = require('axios');
const navigation = require('../navigation');
const middlewares = require('../middlewares');
const {JSONStream} = require("mocha/lib/reporters");
const pug = require("pug");
const utils = require("../utils");

router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 5, res, next);
});

router.get('/', async function (req, res, next) {
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0');
    today = dd + '/' + mm;

    let dashboard_layout = await axios.get(`${process.env.SERVER_ADDRESS}/api/users/dashboard/${req.cookies.userId}`)
    // res.cookie("dashboard_layout", JSON.stringify(dashboard_layout.data.dashboard_layout))
    res.locals.today = today

    function toHHMMSS(value) {
        var sec_num = value
        var hours = Math.floor(sec_num / 3600);
        var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
        var seconds = sec_num - (hours * 3600) - (minutes * 60);

        if (hours < 10) {
            hours = "0" + hours;
        }
        if (minutes < 10) {
            minutes = "0" + minutes;
        }
        if (seconds < 10) {
            seconds = "0" + seconds;
        }
        return hours + ':' + minutes + ':' + seconds;
    }

    let r = await axios.get(`${process.env.SERVER_ADDRESS}/api/planning/${req.cookies.userId}`)
    let planning_data = []
    for (let element of r.data) {
        let today2 = new Date();
        if (today2.toDateString() === (new Date(element.begin_at)).toDateString() && today2.toDateString() === (new Date(element.end_at)).toDateString()) {
            element.duration_string = toHHMMSS(element.duration)
            planning_data.push(element);
        }
    }
    res.locals.planning_data = planning_data

    let planning_widget = pug.compileFile(__dirname + "/../../views/dashboard/widgets/planning.pug")
    let planning_html = planning_widget({today: today, planning_data: planning_data})

    let pointage_widget = pug.compileFile(__dirname + "/../../views/dashboard/widgets/pointage.pug")
    let pointage_html = pointage_widget()

    let contacts = await axios.get(`${process.env.SERVER_ADDRESS}/api/contacts?user_id=${req.cookies.userId}`, {
        withCredentials: true,
        headers: {Cookie: utils.GetRawCookie(req.cookies)}
    })
    let contacts_widget = pug.compileFile(__dirname + "/../../views/dashboard/widgets/contacts.pug")
    let contacts_html = contacts_widget({contacts: contacts.data})

    res.locals.planning = planning_html
    res.locals.pointage = pointage_html
    res.locals.contacts = contacts_html
    let all_widgets = [{
        "minW": 2,
        "minH": 3,
        "noResize": true,
        "noMove": true,
        "locked": true,
        "id": "planning",
        "content": encodeURIComponent(planning_html)
    }, {
        "minW": 2,
        "minH": 3,
        "noResize": true,
        "noMove": true,
        "locked": true,
        "id": "pointage",
        "content": encodeURIComponent(pointage_html)
    }, {
        "minW": 2,
        "minH": 3,
        "noResize": true,
        "noMove": true,
        "locked": true,
        "id": "contacts",
        "content": encodeURIComponent(contacts_html)
    }]

    res.locals.all_widgets = JSON.stringify(all_widgets)
    if (dashboard_layout.data.dashboard_layout) {
        console.log(JSON.parse(dashboard_layout.data.dashboard_layout).children)
        for (let child of (JSON.parse(dashboard_layout.data.dashboard_layout)).children) {
            if (child.id === "planning") {
                child.content = planning_html
            } else if (child.id === "pointage") {
                child.content = pointage_html
            } else if (child.id === "contacts") {
                child.content = contacts_html
            }
        }
    }
    res.locals.dashboard_layout = JSON.stringify(dashboard_layout.data.dashboard_layout)

    // res.cookie("dashboard_layout", JSON.stringify(dashboard_layout.data.dashboard_layout))

    res.render("dashboard/dashboard")
});

module.exports = router;
