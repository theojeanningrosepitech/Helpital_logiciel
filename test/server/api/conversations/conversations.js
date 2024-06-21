const assert = require('assert');
const chai = require('chai');
const chaiHttp = require('chai-http');
const utils = require('../../../utils');
const should = chai.should();
let test;

chai.use(chaiHttp);
/*
describe('api/conversations/conversations', () => {

    before(async function () {
        test = await utils.Init();
    });

    it('Get all conversations', function (done) {
        chai.request(test.server)
            .get('/api/conversations')
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('array');
                //res.body.length.should.be.equal(2);
                done();
            });
    });

    it('Get all conversations user 1', function (done) {
        chai.request(test.server)
            .get('/api/conversations?id=1')
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('array');
                //res.body.length.should.be.equal(2);
                done();
            });
    });
    it('Get conversation user 1 and user 4', function (done) {
        chai.request(test.server)
            .get('/api/conversations?id=1&id_two=4')
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('array');
                //res.body.length.should.be.equal(2);
                done();
            });
    });
    // it('Add a conversation', function(done) {
    //     const new_conv = {
    //         user_one_id: parseInt('1'),
    //         user_two_id: parseInt('5'),
    //     };
    //     chai.request(test.server)
    //         .post('/api/conversations/conversation')
    //         .set('content-type', 'application/json')
    //         .send(new_conv)
    //         .end((err, res) => {
    //             res.should.have.status(200);
    //             chai.request(test.server)
    //                 .get('/api/conversations?id=1&id_two=5')
    //                 .end((err, res) => {
    //                     res.should.have.status(200);
    //                     res.body.should.be.a('array');
    //                     done();
    //                 });
    //         });
    // });
    // it('Add messages', function(done) {
    //     const new_conv = {
    //         user_one_id: parseInt('1'),
    //         user_two_id: parseInt('5'),
    //     };
    //     chai.request(test.server)
    //         .post('/api/conversations/conversation')
    //         .set('content-type', 'application/json')
    //         .send(new_conv)
    //         .end((err, res) => {
    //             res.should.have.status(200);
    //             chai.request(test.server)
    //                 .get('/api/conversations?id=1&id_two=5')
    //                 .end((err, res) => {
    //                     res.should.have.status(200);
    //                     res.body.should.be.a('array');
    //                     done();
    //                 });
    //         });
    // });
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
});*/
