const express = require('express');
const router = express.Router();
const axios = require('axios');
const middlewares = require('../middlewares');
const navigation = require('../navigation');
const utils = require('../utils');
const path = require('path');
const fs = require('fs');

// router.use goal is for manage user access to route
router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 5, res, next);
});

/**
 * @swagger
 * /xrays:
 *   get:
 *     tags:
 *      - xrays route
 *     summary: Get the xrays page
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       500:
 *         description: Internal serveur error.
 */
router.get('/', async function (req, res, next) {
    let getXRays = function() {
        const directoryPath = path.join(__dirname, '../../public/xrays');

        fs.readdir(directoryPath, function (err, files) {
            if (err)
                return console.log('Unable to scan directory: ' + err);
            files.forEach(function (file) {
                fs.stat('public/xrays/' + file, async function(err, stats){
                    if (err)
                        console.log(err)
                    else {
                        var xray = {
                            href: file,
                            date: stats.birthtime,
                            lastEdit: stats.mtime
                        }
                        const xraysArray = await axios.get(`${process.env.SERVER_ADDRESS}/api/xrays`, {header:{cookies:req.cookies}});
                        
                        var bool = 0;
                        for (let i of xraysArray.data) {
                            if (xray.href == i.href)
                                bool = 1;
                        }

                        if (bool == 0) {
                            await axios.post(`${process.env.SERVER_ADDRESS}/api/xrays`, xray);
                            console.log("xray posted.");
                        } else
                            console.log("xray already exist.");
                    }
                });
            });
        });
    }

    getXRays();

    const user = await axios.get(`${process.env.SERVER_ADDRESS}/api/auth/user`, {withCredentials: true, headers:{Cookie: utils.GetRawCookie(req.cookies)}});
    const xrays = await axios.get(`${process.env.SERVER_ADDRESS}/api/xrays`, {header:{cookies:req.cookies}});

    // console.log(xrays);
    
    if (user.status < 200 || user.status >= 300) {
        res.status(user.status).send(user.data);
        return;
    }

    res.locals.navigation = navigation.Get(req, navigation.routes.xray);
    res.locals.data = {
        userSelf: user.data,
        xrays: xrays.data
    };

    res.render('./xrays/xrays')
});

module.exports = router;
