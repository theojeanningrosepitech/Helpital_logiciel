var express = require('express');
var router = express.Router();
const utils = require("../../utils");
const uuid = require('uuid');
const fs = require('fs');
const UPLOAD_PATH = 'server/files';
/*
router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 5, res, next);
});*/

router.post('/', async function(req, res, next) {
    const dir = req.query.dir;
    const data = {
        file: req.body.file,
        filename: req.body.filename,
        type: req.body.type,
        size: req.body.size,
        value: req.body.value
    };


    if (data.filename != "" && data.file != "") {
        const result = utils.decodeImage(data.value, data.filename, dir);
        res.send({
            name: data.filename,
            url: result,
        });
    }
});

module.exports = router;
