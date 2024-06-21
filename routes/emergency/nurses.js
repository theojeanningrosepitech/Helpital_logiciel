const express = require('express');
const router = express.Router();
const axios = require('axios');
const middlewares = require('../middlewares');
const navigation = require('../navigation');
const utils = require('../utils');

// router.use goal is for manage user access to route
router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 5, res, next);
});

router.get('/', async function (req, res, next) {
    const search = req.query.search ? req.query.search : '';
    let nurses = await axios.get(`http://localhost:3000/api/users?role=4&search=${search}`, {withCredentials: true, headers:{Cookie: utils.GetRawCookie(req.cookies)}});
    const services = await axios.get(`http://localhost:3000/api/services`);

    if (nurses.err || services.err) {
        console.error(nurses.err);
        console.error(services.err);
        res.sendStatus(500);
        return;
    }

    for (let i = 0; i !== nurses.data.length; i++) {
        for (let j = 0; j !== services.data.length; j++) {
            if (nurses.data[i].service === services.data[j].id) {
                nurses.data[i].service = services.data[j].title;
                break;
            }
        }
    }
    res.locals.data = nurses.data;

    if (req.query.list == 'true') {
        res.render('./emergency/nurses_list')
    } else {
        res.locals.navigation = navigation.Get(req, navigation.routes.emergency.sub.nurses);
        res.render('./emergency/nurses')
    }
});

router.get('/fragment', async function (req, res, next) {
    let nurses = await axios.get(`http://localhost:3000/api/users?id=${req.query.id}`);

    if (nurses.err) {
        console.error(nurses.err);
        res.sendStatus(500);
        return;
    } else if (nurses.data.length === 0) {
        res.sendStatus(400);
        return;
    }
    const services = await axios.get(`http://localhost:3000/api/services?id=${nurses.data[0].service}`);

    if (services.err) {
        console.error(services.err);
        res.sendStatus(500);
        return;
    } else if (services.data.length === 0) {
        res.sendStatus(400);
        return;
    }
    nurses.data[0].service = services.data[0].title;

    res.locals.nurse = nurses.data[0];
    res.render('./emergency/nurses_fragment')
});

module.exports = router;
