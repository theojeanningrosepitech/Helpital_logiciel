var express = require('express');
var router = express.Router();


const mails = require("../../mails");
const {bool} = require("twilio/lib/base/serialize");

router.get('/email', async function (req, res, next) {
    const sender_email = req.query.sender;
    const name = req.query.name;
    const phone = req.query.name;
    const message = `Envoyé par ${name},\n adress email: ${sender_email}\n numéro de téléphone: ${phone}\n ${req.query.message}`;
    const response = mails.Send([process.env.GMAIL_ADDRESS], 'Prise de contact', message);
    if (response) {
        res.status(200).send({
            status: 'good'
        });
        return;
    } else {
        res.status(401).send();
        return;
    }

});

module.exports = router;
