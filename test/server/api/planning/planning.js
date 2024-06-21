const assert = require('assert');
const chai = require('chai');
const chaiHttp = require('chai-http');
const utils = require('../../../utils');
const should = chai.should();
let test;

chai.use(chaiHttp);

describe('api/planning/planning', () => {

    before(async function() {
        test = await utils.Init();
    });

    it('Get the planning of the week 01/05/2042', function(done) {
        chai.request(test.server)
        .get('/api/planning?from=2042-05-01')
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('array');
            res.body.length.should.be.equal(3);
            const data = res.body;

            for (let dataEvent of data) {
                for (let event of test.data.planning) {
                    if (event.id === dataEvent.id) {
                        event.title.should.be.equal(dataEvent.title);
                        event.description.should.be.equal(dataEvent.description);
                        (new Date(event.begin_at)).toTimeString().should.be.equal((new Date(dataEvent.begin_at)).toTimeString());
                    }
                }
            }
            done();
        });
    });

    it('Get the planning from id', function(done) {
        chai.request(test.server)
        .get('/api/planning?id=' + test.data.planning[0].id)
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('array');
            res.body.length.should.be.equal(1);

            const data = res.body[0];
            test.data.planning[0].title.should.be.equal(data.title);
            test.data.planning[0].description.should.be.equal(data.description);
            (new Date(test.data.planning[0].begin_at)).toTimeString().should.be.equal((new Date(data.begin_at)).toTimeString());
            done();
        });
    });

    it('Get the planning from 01/05/2021 to 2042-05-03', function(done) {
        chai.request(test.server)
        .get('/api/planning?from=2042-05-01&to=2042-05-03')
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('array');
            res.body.length.should.be.equal(3);
            done();
        });
    });

    it('GET the planning from 2042-05-02 08:00:00 to 2042-05-02 10:00:00', function(done) {
        const duration = 3600 * 2;
        chai.request(test.server)
        .get('/api/planning?from=2042-05-02 08:00:00&duration=' + duration)
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('array');
            res.body.length.should.be.equal(1);
            res.body[0].id.should.be.equal(test.data.planning[0].id);
            done();
        });
    });

    it('Update an event', function(done) {
        const newData = {
            title: 'Test title',
            description: 'Test desc',
        };

        // update the event
        chai.request(test.server)
        .put('/api/planning?id=' + test.data.planning[0].id)
        .set('content-type', 'application/json')
        .send(newData)
        .end((err, res) => {
            res.should.have.status(200);

            // check info
            chai.request(test.server)
            .get('/api/planning?id=' + test.data.planning[0].id)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('array');
                res.body.length.should.be.equal(1);

                const data = res.body[0];
                newData.title.should.be.equal(data.title);
                newData.description.should.be.equal(data.description);
                (new Date(test.data.planning[0].begin_at)).toTimeString().should.be.equal((new Date(data.begin_at)).toTimeString());
                done();
            });
        });
    });

    it('Delete an event', function(done) {
        // delete the event
        chai.request(test.server)
        .delete('/api/planning?id=' + test.data.planning[0].id)
        .end((err, res) => {
            res.should.have.status(200);

            // try to get the event using id
            chai.request(test.server)
            .get('/api/planning?id=' + test.data.planning[0].id)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('array');
                res.body.length.should.be.equal(0); // event gone
                done();
            });
        });
    });

    it('Add an event', function(done) {
        let event = Object.assign({}, test.data.planning[0]);
        delete event.id;

        // add the event
        chai.request(test.server)
        .post('/api/planning')
        .set('content-type', 'application/json')
        .send(event)
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('object');
            should.exist(res.body.id);
            res.body.id.should.be.a('number');
            test.data.planning[0].id = res.body.id;
            // check info
            chai.request(test.server)
            .get('/api/planning?id=' + res.body.id)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('array');
                res.body.length.should.be.equal(1);

                const data = res.body[0];
                event.title.should.be.equal(data.title);
                event.description.should.be.equal(data.description);
                (new Date(event.date)).toTimeString().should.be.equal((new Date(data.date)).toTimeString());
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
