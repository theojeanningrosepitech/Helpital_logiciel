process.env.TWO_FACTOR_AUTH = 'disabled';

const assert = require('assert');
const chai = require('chai');
const chaiHttp = require('chai-http');
const utils = require('../../../utils');
const should = chai.should();
let test;

chai.use(chaiHttp);

describe('/api/auth/login POST', () => {
    let sessionID;

    before(async function() {
        test = await utils.InitWithoutDB();
    });

    it('Simple login successfully', ((done) => {
        chai.request(test.server)
        .post('/api/auth/login')
        .set('content-type', 'application/json')
        .send({
            login: "arthur.petit",
            password: "password",
            device_type: 0,
        })
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.an('object');
            res.body.type.should.equal('simple');
            const userId = res.body.userId;

            sessionID = res.body.sessionID;
            sessionID.should.not.be.undefined;
            sessionID.length.should.equal(36);
            userId.should.not.be.undefined;
            userId.should.equal(1);
            done();
        });
    }));

    it('logout successfully', ((done) => {
        chai.request(test.server)
        .get('/api/auth/logout')
        .set('Cookie', 'sessionID=' + sessionID)
        .end((err, res) => {
            res.should.have.status(200);
            done();
        });
    }));

    it('Simple login failure', ((done) => {
        chai.request(test.server)
        .post('/api/auth/login')
        .set('content-type', 'application/json')
        .send({
            login: "arthur.petit",
            password: "wrong_password",
            device_type: 0,
        })
        .end((err, res) => {
            res.should.have.status(401);
            done();
        });
    }));

    let token2FA;
    let code2FA;

    it('2FA login email', ((done) => {
        process.env.TWO_FACTOR_AUTH = 'enabled';

        chai.request(test.server)
        .post('/api/auth/login')
        .set('content-type', 'application/json')
        .send({
            login: "delphine.lefevre",
            password: "password",
            device_type: 0,
        })
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.an('object');
            res.body.type.should.equal('2FA');
            token2FA = res.body.token;

            token2FA.should.not.be.undefined;
            token2FA.length.should.equal(32);
            done();
        });
    }));

    // this test depends on the previous test
    it('2FA send code / retreive it', ((done) => {
        process.env.TWO_FACTOR_AUTH = 'enabled';

        chai.request(test.server)
        .get('/api/auth/2fa/send?method=test')
        .set('Cookie', 'token-2FA=' + token2FA)
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.an('object');
            res.body.code.should.not.be.undefined;
            res.body.code.length.should.equal(6);
            code2FA = res.body.code;
            done();
        });
    }));

    // this test depends on the previous tests
    it('2FA login last step', ((done) => {
        chai.request(test.server)
        .post('/api/auth/2fa/login')
        .set('Cookie', 'token-2FA=' + token2FA)
        .set('content-type', 'application/json')
        .send({
            code: code2FA,
            method: 'test',
        })
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.an('object');
            const userId = res.body.userId;

            sessionID = res.body.sessionID;
            sessionID.length.should.equal(36);
            userId.should.not.be.undefined;
            userId.should.equal(6);
            done();
        });
    }));

    // check if TOTP is enabled
    it('Retreive totp status from session', ((done) => {
        chai.request(test.server)
        .get('/api/auth/totp')
        .set('Cookie', 'sessionID=' + sessionID)
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.equal(false);
            done();
        });
    }));

    it('Enable TOTP', ((done) => {
        chai.request(test.server)
        .post('/api/auth/totp')
        .set('Cookie', 'sessionID=' + sessionID)
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.an('object');
            res.body.secret.should.not.be.undefined;
            done();
        });
    }));

    it('Retreive totp status from session 2', ((done) => {
        chai.request(test.server)
        .get('/api/auth/totp')
        .set('Cookie', 'sessionID=' + sessionID)
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.equal(true);
            done();
        });
    }));

    // check if TOTP is enabled
    it('Disable TOTP', ((done) => {
        chai.request(test.server)
        .delete('/api/auth/totp')
        .set('Cookie', 'sessionID=' + sessionID)
        .end((err, res) => {
            res.should.have.status(201);
            done();
        });
    }));

    it('Retreive totp status from session 3', ((done) => {
        chai.request(test.server)
        .get('/api/auth/totp')
        .set('Cookie', 'sessionID=' + sessionID)
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.equal(false);
            done();
        });
    }));

    it('logout 2FA session', ((done) => {
        chai.request(test.server)
        .get('/api/auth/logout')
        .set('Cookie', 'sessionID=' + sessionID)
        .end((err, res) => {
            res.should.have.status(200);
            done();
        });
    }));
});

after(async function() {
    await utils.Disconnect();
});
