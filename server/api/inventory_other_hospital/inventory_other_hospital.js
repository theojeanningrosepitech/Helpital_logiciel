var express = require('express');
var router = express.Router();
const db = require('../../database');
const utils = require('../../utils');
const axios = require("axios");

router.get('/', async function (req, res, next) {
    const response = await db.Select(`select * from inventory_other_hospital`);

    if (response.err)
        res.status(500).send(response.err);
    res.send(response);
});

router.delete('/', async function(req, res) {
    return utils.DeleteRow(req, res, 'inventory_other_hospital');
});

module.exports = router;
