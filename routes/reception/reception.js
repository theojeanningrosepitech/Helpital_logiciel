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

/**
 * @swagger
 * /reception:
 *   get:
 *     tags:
 *      - reception route
 *     summary: Get the reception page
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       500:
 *         description: Internal serveur error.
 */
router.get('/', async function (req, res, next) {
    let waiting = await axios.get(`${process.env.SERVER_ADDRESS}/api/rooms?type=${5}&user_id=${req.cookies.userId}`, { header: { cookies: req.cookies } });
    let patients = await axios.get(`${process.env.SERVER_ADDRESS}/api/patients`);
    const services = await axios.get(`${process.env.SERVER_ADDRESS}/api/services`, {withCredentials: true, headers:{Cookie: utils.GetRawCookie(req.cookies)}});
    const users = await axios.get(`${process.env.SERVER_ADDRESS}/api/users`, {withCredentials: true, headers:{Cookie: utils.GetRawCookie(req.cookies)}});

    if (req.query.patientId) {
        patient_id = req.query.patientId;
    } else {
        patient_id = -1;
    }
    patients = await axios.get(`${process.env.SERVER_ADDRESS}/api/patients`, {header:{cookies:req.cookies}});
    for (let i = 0; i !== services.data.length; i++) {
        services.data[i].value = services.data[i].id;
    }
    for (let i = 0; i !== users.data.length; i++) {
        users.data[i].value = users.data[i].id;
        users.data[i].title = users.data[i].firstname + ' ' + users.data[i].lastname;
    }

    if (patients.err) {
        res.sendStatus(500).send(patients.err);
        console.error(patients.err);
        return;
    }

    for (let i = patients.data.patients.length - 1; i !== -1; i--) {
        patients.data.patients[i].birthdate = utils.FormatDateFromSQL(patients.data.patients[i].birthdate);
    }

    const bloodTypes = ['', 'O', 'O+', 'O-', 'A', 'A+', 'A-', 'B', 'B-', 'B+', 'AB', 'AB-', 'AB+'];
    const genres = ['F'];

    res.locals.data = patients.data;
    res.locals.data.bloodTypes = [];
    for (const bloodType of bloodTypes) {
        res.locals.data.bloodTypes.push({
            value: bloodType,
            title: bloodType
        });
    }
    
    res.locals.data.genres = [{
        value: 'H',
        title: 'Homme'
    }, {
        value: 'F',
        title: 'Femme'
    }, {
        value: 'O',
        title: 'Autre'
    }, {
        value: ' ',
        title: '-'
    }];
    res.locals.data.services = services.data;
    res.locals.data.users = users.data;
    //res.locals.data.my_user = user.data;
    res.locals.data.waiting = waiting.data;
    res.locals.navigation = navigation.Get(req, navigation.routes.reception);
    
    res.render('./reception/reception')
});

// router.get('/', async (req, res, next) => {
//     let waiting = await axios.get(`${process.env.SERVER_ADDRESS}/api/rooms?type=${5}&user_id=${req.cookies.userId}`, { header: { cookies: req.cookies } });
//     let patients = await axios.get(`${process.env.SERVER_ADDRESS}/api/patients`);

//     res.locals.navigation = navigation.Get(req, navigation.routes.waiting);

//     res.locals.data = patients.data;
//     res.locals.data.waiting = waiting.data;

//     res.render('./reception/reception')
// });

router.get('/fragment', async function (req, res, next) {

    if (req.query.id === undefined) {
        res.sendStatus(400);
        return;
    }
    let patients = await axios.get(`${process.env.SERVER_ADDRESS}/api/patients?id=${req.query.id}`);

    if (patients.err) {
        res.sendStatus(500).send(patients.err);
        console.error(patients.err);
        return;
    } else if (patients.data.all_patients.length === 0) {
        res.sendStatus(400);
        return;
    }

    res.locals.patient = patients.data.all_patients[0];
    res.locals.patient.birthdate = utils.FormatDateFromSQL(res.locals.patient.birthdate);

    res.render('./reception/reception_fragment')
});

module.exports = router;