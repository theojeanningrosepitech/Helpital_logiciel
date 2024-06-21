const assert = require('assert');
const chai = require('chai');
const chaiHttp = require('chai-http');
const utils = require('../../../utils');
const should = chai.should();
let test;

chai.use(chaiHttp);

describe('api/services/services', () => {

    before(async function() {
        test = await utils.Init();
    });

    it('Get services', function(done) {
        chai.request(test.server)
        .get('/api/services')
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('array');
            res.body.length.should.be.equal(20);
            const data = res.body;

            for (let element of data) {
                for (let service of test.data.services) {
                    if (service.id === element.id) {
                        service.title.should.be.equal(element.title);
                    }
                }
            }
            done();
        });
    });

    it('Get services from title', function(done) {
        chai.request(test.server)
        .get('/api/services?search=Cardio')
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('array');
            res.body.length.should.be.equal(2);
            const data = res.body;
            data[1].id.should.be.equal(test.data.services[1].id);
            data[1].title.should.be.equal(test.data.services[1].title);
            done();
        });
    });

    it('Get services from id', function(done) {
        chai.request(test.server)
        .get('/api/services?id=' + test.data.services[2].id)
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('array');
            res.body.length.should.be.equal(1);
            const data = res.body;
            data[0].id.should.be.equal(test.data.services[2].id);
            data[0].title.should.be.equal(test.data.services[2].title);
            done();
        });
    });

    it('Update a service', function(done) {
        const newData = {
            title: 'Cancerologie renamed'
        };

        // update the event
        chai.request(test.server)
        .put('/api/services?id=' + test.data.services[6].id)
        .set('content-type', 'application/json')
        .send(newData)
        .end((err, res) => {
            res.should.have.status(200);

            // check info
            chai.request(test.server)
            .get('/api/services?id=' + test.data.services[6].id)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('array');
                res.body.length.should.be.equal(1);

                const data = res.body[0];
                newData.title.should.be.equal(data.title);
                done();
            });
        });
    });

    it('Delete service', function(done) {
        chai.request(test.server)
        .delete('/api/services?id=' + test.data.services[6].id)
        .end((err, res) => {
            res.should.have.status(200);

            // check deletion
            chai.request(test.server)
            .get('/api/services?id=' + test.data.services[6].id)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('array');
                res.body.length.should.be.equal(0);
                done();
            });
        });
    });

    it('Add a service', function(done) {
        let object = Object.assign({}, test.data.services[6]);
        delete object.id;

        // add the event
        chai.request(test.server)
        .post('/api/services')
        .set('content-type', 'application/json')
        .send(object)
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('object');
            should.exist(res.body.id);
            res.body.id.should.be.a('number');

            test.data.services[6].id = res.body.id;

            // check info
            chai.request(test.server)
            .get('/api/services?id=' + test.data.services[6].id)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('array');
                res.body.length.should.be.equal(1);
                done();
            });
        });
    });
    after(async function() {
        await utils.Clear();
    });
});

after(async function() {
    await utils.Disconnect();
});
