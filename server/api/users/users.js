var express = require('express');
var router = express.Router();
const db = require('../../database');
const websocket = require('../../websocket');
const utils = require('../../utils');
const mails = require('../../mails');
const crypto = require("crypto");
const axios = require("axios");

const middlewares = require('../../middlewares');

// router.use goal is for manage user access to route
/*router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 5, res, next);
});*/

router.get('/', async function (req, res, next) {
    let where = [];

    if (req.query.id)
        where.push(`id = ${req.query.id}`);
    else {
        if (req.query.service)
            where.push(`service = ${req.query.service}`);
        if (req.query.role)
                where.push(`user_role = ${req.query.role}`);
        if (req.query.search) {
            const userID = await utils.GetUserIdFromSession(req);

            if (userID === -1) {
                res.status(401).send('Session not valid');
                return;
            }

            if (req.query.contacts)
                where.push(`(firstname LIKE E'%${db.EscapeQuote(req.query.search)}%' OR lastname LIKE E'%${db.EscapeQuote(req.query.search)}%' OR login LIKE '%${req.query.search}%' OR email LIKE '%${req.query.search}%') AND id NOT IN (SELECT contact_user_id FROM contacts WHERE user_id = ${userID}) AND id != ${userID}`);
            else
                where.push(`(firstname LIKE E'%${db.EscapeQuote(req.query.search)}%' OR lastname LIKE E'%${db.EscapeQuote(req.query.search)}%' OR login LIKE '%${req.query.search}%' OR email LIKE '%${req.query.search}%') AND id != ${userID}`);
        }
    }
    let query = 'SELECT * FROM users';

    if (where.length !== 0) {
        query += ' WHERE ' + where.join(' AND ');
    }
    const response = await db.Select(query + ' ORDER BY login');

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }
    res.send(response.data);
});
/*
router.get('/', async function (req, res, next) {

    let response;

    if (req.query.id)
        response = await db.Select(`SELECT * FROM users WHERE id = ${req.query.id}`);
    else if (req.query.service)
        response = await  db.Select(`SELECT * FROM users WHERE service = ${req.query.service}`);
    else if (req.query.role)
        response = await  db.Select(`SELECT * FROM users WHERE user_role = ${req.query.role}`);
    else if (req.query.search)
        response = await  db.Select(`SELECT * FROM users WHERE firstname LIKE E'%${db.EscapeQuote(req.query.search)}%' OR lastname LIKE E'%${db.EscapeQuote(req.query.search)}%' OR login LIKE '%${req.query.search}%' OR email LIKE '%${req.query.search}%'`);
    else
        response = await db.Select(`SELECT * FROM users`);
    if (response.err) {
        res.status(500).send(response.err);
        return;
    }
    res.send(response.data);
});*/

router.post('/', async function(req, res, next) {

    var ft = req.body.firstname;
    var lt = req.body.lastname;

    const insertData = {
        login: ft.toLowerCase() + '.' + lt.toLowerCase(),
        password: crypto.randomBytes(32).toString('hex'),
        user_role: req.body.roles,
        service: req.body.services,
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        email: req.body.email,
        phone: req.body.phone
    };
    const result = await db.InsertData('users', insertData);

    res.send("add new user");
    websocket.sendMessage(req, 'new', 'user', { id: result.data }, insertData, null);
});

router.post('/nfc', async function(req, res, next) {
    const updateData = { nfc_code: crypto.randomBytes(8).toString('hex') };
    const result = await db.UpdateData('users', req.body.id, updateData);

    if (result.err) {
        res.status(500).json({ error: result.err });
        return;
    }
    res.status(200).json({ response: 'NFC code created', nfc_code: updateData.nfc_code });
    websocket.sendMessage(req, 'update', 'user', { id: result.id }, updateData, null);
});

router.put('/update-avatar', async function(req, res) {
    const id = req.query.id;
    const avatar = parseInt(req.body.avatar);
    const updateData = { avatar: avatar };
    const result = await db.UpdateData('users', id, updateData);

    if (result.err) {
        res.status(500).json({ error: result.err });
        return;
    }
    res.status(200).json({ response: 'Event updated' });
    websocket.sendMessage(req, 'update', 'user', { id: id }, updateData, null);
})

router.put('/update-banner', async function(req, res) {
    const id = req.query.id;
    const banner = parseInt(req.body.banner);
    const updateData = { banner: banner };
    const result = await db.UpdateData('users', id, updateData);

    if (result.err) {
        res.status(500).json({ error: result.err });
        return;
    }
    res.status(200).json({ response: 'Event updated' });
    websocket.sendMessage(req, 'update', 'user', { id: id }, updateData, null);
})

router.put('/update-email', async function(req, res) {
    const id = req.query.id;
    const email = req.body.email;
    const updateData = { email: email };
    const result = await db.UpdateData('users', id, updateData);

    if (result.err) {
        res.status(500).json({ error: result.err });
        return;
    }
    res.status(200).json({ response: 'Event updated' });
    websocket.sendMessage(req, 'update', 'user', { id: id }, updateData, null);
})

router.put('/update-service', async function(req, res) {
    const id = req.query.id;
    const updateData = { service: req.body.service };
    const result = await db.UpdateData('users', id, updateData);

    if (result.err) {
        res.status(500).json({ error: result.err });
        return;
    }
    res.status(200).json({ response: 'Event updated' });
    websocket.sendMessage(req, 'update', 'user', { id: id }, updateData, null);
})

router.put('/update-role', async function(req, res) {
    const id = req.query.id;
    const updateData = { user_role: req.body.role };
    const result = await db.UpdateData('users', id, updateData);

    if (result.err) {
        res.status(500).json({ error: result.err });
        return;
    }
    res.status(200).json({ response: 'Event updated' });
    websocket.sendMessage(req, 'update', 'user', { id: id }, updateData, null);
})

router.put('/update-phone', async function(req, res) {
    const id = req.query.id;
    const phone = req.body.phone;
    const updateData = { phone: phone };
    const result = await db.UpdateData('users', id, updateData);

    if (result.err) {
        res.status(500).json({ error: result.err });
        return;
    }
    res.status(200).json({ response: 'Event updated' });
    websocket.sendMessage(req, 'update', 'user', { id: id }, updateData, null);
})

router.put('/updateHere', async function(req, res) {
    const id = req.query.id;
    const here = req.body.here;
    const updateData = { here: here };
    const result = await db.UpdateData('users', id, { here: here });

    if (result.err) {
        res.status(500).json({ error: result.err });
        return;
    }
    res.status(200).json({ response: 'Event updated' });
    websocket.sendMessage(req, 'update', 'user', { id: id }, updateData, null);
})

router.put('/update-group', async function(req, res) {
    const id = req.query.id;
    const group = req.body.group;
    const updateData = { group_service: group };
    const result = await db.UpdateData('users', id, updateData);

    if (result.err) {
        res.status(500).json({ error: result.err });
        return;
    }
    res.status(200).json({ response: 'Event updated' });
    websocket.sendMessage(req, 'update', 'user', { id: id }, updateData, null);
})

router.put('/update-availability', async function(req, res) {
    const id = req.query.id;
    const availability = req.body.availability;
    const updateData = { availability: availability };
    const result = await db.UpdateData('users', id, updateData);

    if (result.err) {
        res.status(500).json({ error: result.err });
        return;
    }
    res.status(200).json({ response: 'Event updated' });
    websocket.sendMessage(req, 'update', 'user', { id: id }, updateData, null);
})

router.put('/update-contract', async function(req, res) {
    const id = req.query.id;
    const contract = req.body.contract;
    const updateData = { contract: contract };
    const result = await db.UpdateData('users', id, updateData);

    if (result.err) {
        res.status(500).json({ error: result.err });
        return;
    }
    res.status(200).json({ response: 'Event updated' });
    websocket.sendMessage(req, 'update', 'user', { id: id }, updateData, null);
})

router.put('/update-interim-user', async function(req, res) {
    const id = req.query.id;
    const phone = req.body.phone;
    const email = req.body.email;
    const role = req.body.role;
    const service = req.body.service;
    const updateData = { phone: phone, email: email, user_role: role, service: service };
    const result = await db.UpdateData('users', id, updateData);

    if (result.err) {
        res.status(500).json({ error: result.err });
        return;
    }
    res.status(200).json({ response: 'Event updated' });
    websocket.sendMessage(req, 'update', 'user', { id: id }, updateData, null);
})

router.put('/', async function(req, res) {
    const result = await utils.PutController(req, res, 'users');

    if (result)
        websocket.sendMessage(req, 'update', 'user', { id: result.id }, result.data, null);
});

router.delete('/nfc', async function(req, res) {
    const updateData = { nfc_code: null };
    const result = await db.UpdateData('users', req.query.id, updateData);

    if (result.err) {
        res.status(500).json({ error: result.err });
        return;
    }
    res.status(200).json({ response: 'Event updated' });
    websocket.sendMessage(req, 'update', 'user', { id: result.id }, updateData, null);
});

router.delete('/', async function(req, res) {
    const result = await utils.DeleteController(req, res, 'users');

    if (result)
        websocket.sendMessage(req, 'delete', 'user', { id: result.id }, null, null);
});

router.get('/role', async function (req, res, next) {
    const role = await db.Select(`SELECT user_role FROM users WHERE id = ${req.query.user_id} LIMIT 1`);

    if (role.err) {
        res.status(500).send(role.err);
        return;
    }

    if (role.data.length !== 1)
        res.send(1000); // forbidden
    else
        res.send(role.data[0]);
});

router.get('/reset-password', async function (req, res, next) {

    if ( !req.query.user_id || req.query.user_id === '') {
        res.sendStatus(400);
        return;
    }
    const targetUserID = parseInt(req.query.user_id);
    const selfUserID = await utils.GetUserIdFromSession(req);

    // check roles
    if (selfUserID != targetUserID) {
        let response = await db.Select(`SELECT user_role FROM users WHERE id = ${targetUserID}`);

        if (response.err) {
            res.status(500).send(response.err);
            return;
        }
        const targetUserRole = response.data[0].user_role;

        response = await db.Select(`SELECT user_role FROM users WHERE id = ${selfUserID}`);

        if (response.err) {
            res.status(500).send(response.err);
            return;
        }
        const selfUserRole = response.data[0].user_role;

        // check if role is higher or if he is an admin
        if (targetUserRole < selfUserRole && selfUserRole !== 1) {
            res.status(401).send('Insufficient privileges');
            return;
        }
    }
    let response = await db.Select(`SELECT email FROM users WHERE id = ${targetUserID}`);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }

    const targetUserEmail = response.data[0].email;
    const timeLimit = 10 * 60 * 1000; // 10 minutes
    const expiresAt = new Date((new Date()).getTime() + timeLimit);
    const insertData = {
        user_id: targetUserID,
        token: crypto.randomBytes(20).toString('hex'),
        created_at: utils.FormatSqlDate(new Date()),
        expires_at: utils.FormatSqlDate(expiresAt)
    };
    response = await db.InsertData('temporary_token', insertData);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }
    const link = process.env.SERVER_ADDRESS + '/auth/reset-password?token=' + insertData.token;
    const message = `Bonjour,\r\n\r\nVous pouvez utiliser le lien suivant pour réinitialiser votre mot de passe: ${link}\r\n\r\nAttention, ce lien arrivera à expiration le ${expiresAt.toLocaleDateString()} à ${expiresAt.toLocaleTimeString()}.`;

    mails.Send([targetUserEmail], 'Lien réinitialisation mot de passe', message);
    res.send('Reset link sent via mail');
});

router.put('/reset-password', async function (req, res, next) {
    const response = await db.Select(`SELECT id, user_id FROM temporary_token WHERE token = '${req.body.token}' AND expires_at > '${utils.FormatSqlDate(new Date())}'`);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }

    if ( !response.data || response.data.length === 0) {
        res.status(400).send(response.err); // invalid token
        return;
    }
    const userID = response.data[0].user_id;
    const tempTokenID = response.data[0].id;
    const hashedPassword = crypto.createHash('sha256').update(req.body.password + process.env.SECURE_KEY).digest('hex');
    const result = await db.UpdateData('users', userID, { password: hashedPassword });

    if (result.err) {
        res.status(500).json({ error: result.err });
        return;
    }
    res.status(200).json({ response: 'Password updated' });
    const wait = await db.DeleteData('temporary_token', tempTokenID);
});

router.get('/check-temporary-token', async function (req, res, next) {

    if ( !req.query.token || req.query.token === '') {
        res.sendStatus(400);
        return;
    }

    const response = await db.Select(`SELECT id FROM temporary_token WHERE token = '${req.query.token}' AND expires_at > '${utils.FormatSqlDate(new Date())}'`);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }

    if ( !response.data || response.data.length === 0) {
        res.status(400).send(response.err); // invalid token
        return;
    }
    res.send('Token is valid');
});

router.get('/dashboard/:id', async function (req, res, next) {
    const response = await db.Select(`select dashboard_layout from users where id = ${req.params.id}`)

    res.send(response.data[0])
});

router.put('/dashboard', async function (req, res, next) {
    const data = req.body;
    const id = req.query.id;

    const result = await db.UpdateData('users', id, { dashboard_layout: JSON.stringify(data) });
    res.send(result)
});
module.exports = router;
