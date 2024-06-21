const express = require('express');
const router = express.Router();
const axios = require('axios');
const middlewares = require('../middlewares');

router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 5, res, next);
});

router.get('/', async function (req, res, next) {

    let treatment_room = (await axios.get(`http://localhost:3000/api/treatment_room`)).data;
    let treatment_patients = []
    for (var i = 0; i < treatment_room.length; i++) {
        if (treatment_room[i].patient_id != null) {
            resp = await axios.get(`${process.env.SERVER_ADDRESS}/api/patients?id=${treatment_room[i].patient_id}`, { header: { cookies: req.cookies } })
            treatment_patients.push(resp.data.all_patients[0])
        } else {
            treatment_patients.push({})
        }

    }
    let patients = (await axios.get(`http://localhost:3000/api/patients`)).data
    res.locals.data = {
        treatment_room: treatment_room,
        patients: patients,
        treatment_patients: treatment_patients
    }
    res.render('./emergency/treatment_room')
});

module.exports = router;