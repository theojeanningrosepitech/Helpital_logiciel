const express = require('express');
const router = express.Router();
const axios = require('axios');
const middlewares = require('../middlewares');
const navigation = require('../navigation');
const utils = require('../utils');

router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 5, res, next);
});

router.get('/', async function (req, res, next) {
    const search = req.query.search ? req.query.search : '';
    let doctors = await axios.get(`http://localhost:3000/api/users?role=3&search=${search}`, {withCredentials: true, headers:{Cookie: utils.GetRawCookie(req.cookies)}});
    const services = await axios.get(`http://localhost:3000/api/services`);

    if (doctors.err || services.err) {
        console.error(doctors.err);
        console.error(services.err);
        res.sendStatus(500);
        return;
    }

    for (let i = 0; i !== doctors.data.length; i++) {
        for (let j = 0; j !== services.data.length; j++) {
            if (doctors.data[i].service === services.data[j].id) {
                doctors.data[i].service = services.data[j].title;
                break;
            }
        }
    }
    res.locals.data = doctors.data;

    if (req.query.list == 'true') {
        res.render('./emergency/doctors_list')
    } else {
        res.locals.navigation = navigation.Get(req, navigation.routes.emergency.sub.doctors);
        res.render('./emergency/doctors')
    }
});

router.get('/fragment', async function (req, res, next) {
    let doctors = await axios.get(`http://localhost:3000/api/users?id=${req.query.id}`);

    if (doctors.err) {
        console.error(doctors.err);
        res.sendStatus(500);
        return;
    } else if (doctors.data.length === 0) {
        res.sendStatus(400);
        return;
    }
    const services = await axios.get(`http://localhost:3000/api/services?id=${doctors.data[0].service}`);

    if (services.err) {
        console.error(services.err);
        res.sendStatus(500);
        return;
    } else if (services.data.length === 0) {
        res.sendStatus(400);
        return;
    }
    doctors.data[0].service = services.data[0].title;

    res.locals.doctor = doctors.data[0];
    res.render('./emergency/doctors_fragment')
});

module.exports = router;
