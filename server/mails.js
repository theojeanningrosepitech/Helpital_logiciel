/**
 * @module mails
 * @requires db
 * @requires utils
 * @requires axios
 */
const db = require('./database');
const utils = require('./utils');
const axios = require('axios');

/* ---- Basic verison to send mails via SMTP ----


const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
        user: process.env.GMAIL_ADDRESS,
        pass: process.env.GMAIL_PASSWORD,
    },
});*/
/*
async function Send(receivers, subject, content) {
//    transporter.verify().then(console.log).catch(console.error);

    try {
        const resp = await transporter.sendMail({
            from: `"Helpital" <{$process.env.GMAIL_ADDRESS}>`,
            to: receivers.join(', '),
            subject: subject,
            text: content,
         // html: "<b>There is a new article. It's about sending emails, check it out!</b>", // html body
        });
        return true;
    } catch (e) {
        console.log(e);
        return false;
    }
    return false;
}
*/

/**
 * Send a mail to one/several receivers by using the Gmail API
 * @param {array} receivers - Array of receivers email addresses
 * @param {string} subject - Subject of the mail
 * @param {string} content - Content of the mail (plain/text only)
 */
async function Send(receivers, subject, content) {
//    transporter.verify().then(console.log).catch(console.error);

    if (receivers.length < 1 || subject == '' || content == '') {
        console.log('missing parameters for mails.Send()');
        return false;
    }
    let response = await db.Select(`SELECT email, bearer, expiration FROM oauth2 WHERE service = 'google'`);

    if (response.err) {
        console.log(response.err);
        return false;
    }

    if (response.data.length === 0) {
        console.log('Empty oauth2 table');
        return false;
    }
    let bearer;

    if (new Date(response.data[0].expiration) < new Date()) {
        bearer = await newTokenOAuth2('google');
    } else {
        bearer = Buffer.from(response.data[0].bearer, 'base64');
    }

    if (bearer && bearer !== '') {
        const rawMail = formatMail(response.data[0].email, receivers, subject, content);

        try {
            response = await axios.post('https://gmail.googleapis.com/upload/gmail/v1/users/me/messages/send', rawMail, {
                headers: {
                    'Content-Type': 'message/rfc822',
                    'Accept': 'application/json',
                    'Authorization': 'Bearer ' + bearer
                }
            });
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    } else {
        console.log('Empty OAuth2 Bearer to send a mail through Gmail API');
        return false;
    }
}

/**
 * Request a new OAuth2 token to connect through Gmail API
 * @param {string} service - OAuth2 service to target
 */
async function newTokenOAuth2(service) {
    let response = await db.Select(`SELECT refresh_token FROM oauth2 WHERE service = '${service}'`);

    if (response.err) {
        console.log(response.err);
        return '';
    }

    if (response.data.length === 0) {
        console.log('Empty oauth2 table (refresh_token)');
        return '';
    }

    try {
        const body = `client_id=${encodeURI(process.env.GMAIL_CLIENT_ID)}&client_secret=${encodeURI(process.env.GMAIL_SECRET)}&grant_type=refresh_token&refresh_token=${encodeURI(Buffer.from(response.data[0].refresh_token, 'base64'))}`;
        response = await axios.post('https://oauth2.googleapis.com/token', body, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            }
        });

        if (response.data.access_token == '' || response.data.expires_in < 1) {
            console.log('Gmail empty access or refresh token.');
            return '';
        }
        const oauth2sessionID = 1;

        const update = await db.UpdateData('oauth2', oauth2sessionID, {
            bearer: Buffer.from(response.data.access_token).toString('base64'),
            expiration: utils.FormatSqlDate(new Date((new Date()).getTime() + response.data.expires_in * 1000))
        });

        if (update.err) {
            console.log(update.err);
            return '';
        }

        return response.data.access_token;
    } catch (e) {
        console.error(e);
        return '';
    }
}

/**
 * Create an SMTP encoded mail from a few arguments.
 * @param {string} sender - Email address of the sender
 * @param {array} receivers - Array of receivers email addresses
 * @param {string} subject - Subject of the mail
 * @param {string} content - Content of the mail (plain/text)
 */
function formatMail(sender, receivers, subject, content) {
    /**** ---- Raw mail example ----
    From: Helpital <email@domain.com>
    To: <email@domain.com>
    Subject: Formatted text mail
    MIME-Version: 1.0
    Content-Type: text/plain; charset=utf-8


    body in plain text
    *****/
    return `From: Helpital <${sender}>\r\nTo: ${receivers.join(',')}\r\nSubject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=\r\nMIME-version: 1.0\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${content}`;
}

module.exports = {
    Send: Send
}
