var express = require('express');
var router = express.Router();
const db = require('../../database');
const utils = require('../../utils');
const axios = require("axios");
const middlewares = require('../../middlewares');

/*router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 5, res, next);
});*/

router.get('/', async function (req, res, next) {
    const testUser = '5';
    let where = [];

    // add where clauses
    if (req && req.query.id)
        where.push('id = ' + req.query.id);
    else if (req) {
        if (req.query.search)
            where.push('(login LIKE \'%' + req.query.search + '%\' OR firstname LIKE E\'%' + db.EscapeQuote(req.query.search) + '%\' OR lastname LIKE E\'%' + db.EscapeQuote(req.query.search) + '%\' OR email LIKE \'%' + req.query.search + '%\' OR phone LIKE \'%' + req.query.search + '%\')')

        const now = utils.FormatSqlDate(new Date());
        // search by availability
        switch (req.query.status) {
            case 'available':
                where.push('id NOT IN (SELECT user_id FROM planning WHERE user_id = ' + testUser + ' AND begin_at >= \'' + now + '\' AND end_at < \'' + now + '\')');
                break;
            case 'occupied':
                where.push('id IN (SELECT user_id FROM planning WHERE user_id = ' + testUser + ' AND begin_at < \'' + now + '\' AND end_at >= \'' + now + '\')');
                break;
            // case 'away': for future developments, it means user is not connected to websocket
        }

        // search for any column
        for (let key in req.query) {
            if (key !== 'search' && key !== 'status') {
                if (typeof req.query[key] === 'string')
                    where.push(key + ' LIKE \'%' + req.query[key] + '%\'');
                else
                    where.push(key + ' = ' + req.query[key]);
            }
        }
    }
    let query = 'SELECT * FROM users';

    if (where.length != 0)
        query += ' WHERE ' + where.join(' AND ');
    let response = await db.Select(query);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }
    res.send(response.data);
});

module.exports = router;
