const express = require('express');
const router = express.Router();
const axios = require('axios');
const navigation = require('../navigation');
const utils = require('../utils');

/**
 * @swagger
 * /preferences:
 *   get:
 *     tags:
 *       - preferences route
 *     summary: Get the preferences page
 *     responses:
 *       200:
 *         description: Request successfully executed.
 */
router.get('/', async function (req, res, next) {
    const preferences = await axios.get(`${process.env.SERVER_ADDRESS}/api/preferences`, {withCredentials: true, headers:{Cookie: utils.GetRawCookie(req.cookies)}});
    const serviceList = await axios.get(`${process.env.SERVER_ADDRESS}/api/services/list`);
    const nav = navigation.Get(req, navigation.routes.preferences);
    const myUser = await axios.get(`${process.env.SERVER_ADDRESS}/api/users?id=${req.cookies.userId}`, {header:{cookies:req.cookies}});
    const contacts = await axios.get(`${process.env.SERVER_ADDRESS}/api/contacts`, {withCredentials: true, headers:{Cookie: utils.GetRawCookie(req.cookies)}});

    // set pages favorite status (true/false)
    for (let key in nav[0].list) {
        for (let j = 0; j != preferences.data.favorite_pages.length; j++) {
            if (nav[0].list[key].link == preferences.data.favorite_pages[j]) {
                nav[0].list[key].favorite = true;
                break;
            }
        }
    }

    res.locals.navigation = nav;
    res.locals.data = preferences.data;
    res.locals.data.themes = [
        {id: 'classic', name: 'Classique'},
        {id: 'dark', name: 'Sombre'},
    ];
    res.locals.data.services = serviceList.data;
    res.locals.data.myUser = myUser.data[0];
    res.locals.data.contacts = contacts.data;

    res.render('./preferences/preferences')
});

module.exports = router;
