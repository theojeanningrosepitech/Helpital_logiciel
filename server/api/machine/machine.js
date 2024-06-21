var express = require('express');
var router = express.Router();
const db = require('../../database');
const axios = require('axios');
const middlewares = require('../../middlewares');

const usersRouter = require('./users/users');

/*router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 5, res, next);
});*/

router.use('/users', usersRouter);

router.get('/', async function (req, res, next) {
    const id = req.query.id;
    const response = await db.Select(`select ethernet, eth0, wifi from machines where id = ${id}`);

    if (response.err)
        res.status(500).send(response.err);
    else if (response.data.length === 0)
        res.status(400).send('Machine not found.');
    else
        res.send(response.data[0]);
})

router.get('/id', async function (req, res, next) {
    const id = req.query.id;
    const type = req.query.type;

    // console.log(`SELECT id from machines where ${type} like '${id}'`)
    const response = await db.Select(`SELECT id from machines where ${type} like '${id}'`);

    if (response.err)
        res.status(500).send(response.err);
    else if (response.data.length === 0)
        res.status(400).send('Machine not found.');
    else
        res.send(response.data[0]);
})

router.post('/id', async function (req, res, next) {
    const id = req.body.id;
    const type = req.body.type;
    let response;

    if (type === "ethernet")
        response = await db.InsertData('machines', { ethernet: id });
    if (type === "wifi")
        response = await db.InsertData('machines', { wifi: id });
    if (type === "eth0")
        response = await db.InsertData('machines', { eth0: id });

    if (response.err) {
        res.status(500).send(response.err);
        console.error(response.err);
        return;
    }
    res.send({ id: response.data });
})

module.exports = router;
