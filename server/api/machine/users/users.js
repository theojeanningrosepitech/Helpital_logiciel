var express = require('express');
var router = express.Router();
const db = require('../../../database');
const axios = require('axios');
const utils = require('../../../utils');
const middlewares = require('../../../middlewares');

/*router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 5, res, next);
});*/

// /api/machine/users
router.get('/', async function (req, res, next) {
    const id = req.query.id;
    const response = await db.Select(`SELECT user_id from machines_users where machine_id = '${id}' order by last_connection desc`);

    console.log(response)
    if (response.err) {
        console.log(response.err);
        res.status(500).send(response.err);
        return;
    }

    // if (!response.data)
    //     response.data = []
    res.send(response.data);
})

// /api/machine/users/machine
router.get('/machine', async function (req, res, next) {
    const user_id = req.query.user_id;
    const response = await db.Select(`SELECT machine_id from machines_users where user_id = '${user_id}' order by last_connection desc`);

    if (response.err) {
        console.log(response.err);
        res.status(500).send(response.err);
        return;
    }

    if (!response.data)
        response.data = []
    res.send([response.data].flat());
})

router.post('/', async function (req, res, next) {
    const machineId = req.body.machineId;
    const userId = req.body.userId;
    const insertData = {
        machine_id: machineId,
        user_id: userId,
        last_connection: utils.FormatSqlDate(new Date())
    };
    const response = await db.InsertData('machines_users', insertData);

    if (response.err) {
        res.status(500).send(response.err);
        console.error(response.err);
        return;
    }
    res.send({ id: response.data });
})

router.put('/id', async function (req, res, next) {
    const userId = req.body.userId;
    let response = await db.Select(`SELECT id from machines_users WHERE user_id = ${userId}`);

    if (response.err) {
        console.error(response.err);
        res.status(500).send(response.err);
        return;
    }

    if (response.data.length === 0) {
        res.send('data not found');
        return;
    }
    response = await db.UpdateData('machines_users', response.data[0].id, { last_connection: utils.FormatSqlDate(new Date()) });

    if (response.err)
        res.status(500).send(response.err);
    res.send(response.data);
})


router.delete('/:machineId/:userId', async function (req, res, next) {
    const userId = req.params.userId;
    const machineId = req.params.machineId;
    let response = await db.Select(`SELECT id from machines_users WHERE user_id = ${userId} and machine_id = ${machineId}`);

    if (response.err) {
        console.error(response.err);
        res.status(500).send(response.err);
        return;
    }

    if (response.data.length === 0) {
        res.send('data not found');
        return;
    }
    response = await db.DeleteData('machines_users', response.data[0].id);

    if (response.err)
        res.status(500).send(response.err);
    res.send(response.data);
})

module.exports = router;
