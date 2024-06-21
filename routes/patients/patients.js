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
 * /patients:
 *   get:
 *     tags:
 *      - patients route
 *     summary: Get the patients page
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       500:
 *         description: Internal serveur error.
 */
router.get('/', async function (req, res, next) {
    let patients;
    let patient_id;

    const user = await axios.get(`${process.env.SERVER_ADDRESS}/api/auth/user`, {withCredentials: true, headers:{Cookie: utils.GetRawCookie(req.cookies)}});
    const services = await axios.get(`${process.env.SERVER_ADDRESS}/api/services`, {withCredentials: true, headers:{Cookie: utils.GetRawCookie(req.cookies)}});
    const users = await axios.get(`${process.env.SERVER_ADDRESS}/api/users`, {withCredentials: true, headers:{Cookie: utils.GetRawCookie(req.cookies)}});
    const fav = await axios.get(`${process.env.SERVER_ADDRESS}/api/patients/favoris?id=${req.cookies.userId}`, {header:{cookies:req.cookies}});
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
    res.locals.data.my_user = user.data;
    if (fav != null) {
        res.locals.favoris = fav.data;
    }
    res.locals.patient_id = patient_id;
    res.locals.navigation = navigation.Get(req, navigation.routes.patients);

    res.render('./patients/patients')
});

router.get('/headerless', async function (req, res, next) {
    let patients = await axios.get(`${process.env.SERVER_ADDRESS}/api/patients/ss/${req.query.ssNumber}`);

    res.locals.patient = patients.data[0];

    res.render('./patients/content_test')
});


module.exports = router;
