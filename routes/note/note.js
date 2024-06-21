const express = require('express');
const router = express.Router();
const axios = require('axios');
const middlewares = require('../middlewares');
const navigation = require('../navigation');
const utils = require('../utils');

// router.use goal is for manage user access to route
router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 4, res, next);
});

/**
 * @swagger
 * /note:
 *   get:
 *     tags:
 *      - note route
 *     summary: Get the note page
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       500:
 *         description: Internal serveur error.
 */
router.get('/', async function (req, res, next) {
    let note = await axios.get(`${process.env.SERVER_ADDRESS}/api/note?user_id=${req.cookies.userId}`, {header:{cookies:req.cookies}});
    const user = await axios.get(`${process.env.SERVER_ADDRESS}/api/auth/user`, {withCredentials: true, headers:{Cookie: utils.GetRawCookie(req.cookies)}});

    if (user.err || note.err) {
        console.error(user.err)
        console.error(note.err)
        res.sendStatus(500)
        return
    }

    res.locals.data = note.data;
    res.locals.data.my_user = user.data;
    res.locals.navigation = navigation.Get(req, navigation.routes.note);

    res.render('./note/note')
});

module.exports = router;