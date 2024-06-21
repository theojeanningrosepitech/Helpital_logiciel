const assert = require('assert');
const chai = require('chai');
const chaiHttp = require('chai-http');
const utils = require('../../../utils');
const should = chai.should();
let test;

chai.use(chaiHttp);

describe('api/messages/messages', () => {

    before(async function () {
        test = await utils.Init();
    });

    it('Get all messages', function (done) {
        chai.request(test.server)
            .get('/api/messages')
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('array');
                //res.body.length.should.be.equal(2);
                done();
            });
    });
    it('Get all messages for 1 conversation', function (done) {
        chai.request(test.server)
            .get('/api/messages?id_conv=1')
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('array');
                res.body.length.should.be.equal(0);
                done();
            });
    });
    // it('Get gestion error', function (done) {
    //     chai.request(test.server)
    //         .get('/api/messages?id_conv=667')
    //         .end((err, res) => {
    //             err.should.status(500);
    //             done();
    //         });
    // });
    after(async function() {
        await utils.Clear();
    });
});

after(async function() {
    await utils.Disconnect();
});
