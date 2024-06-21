const assert = require('assert');
const chai = require('chai');
const chaiHttp = require('chai-http');
const utils = require('../../../utils');
const should = chai.should();
let test;

chai.use(chaiHttp);

describe('api/rooms/types', () => {

    before(async function() {
        test = await utils.Init();
    });

    it('Get rooms types', function(done) {
        chai.request(test.server)
        .get('/api/rooms/types')
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('array');
            res.body.length.should.be.equal(9);
            const data = res.body;

            for (let element of data) {
                for (let type of test.data.roomsTypes) {
                    if (type.id === element.id) {
                        type.display_name.should.be.equal(element.display_name);
                    }
                }
            }
            done();
        });
    });

    it('Get rooms types from name', function(done) {
        chai.request(test.server)
        .get('/api/rooms/types?search=hambr')
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('array');
            res.body.length.should.be.equal(2);
            res.body[0].display_name.should.be.equal('Chambre');
            done();
        });
    });

    it('Update a room type', function(done) {
        const newData = {
            display_name: 'Room type renamed',
        };

        // update the event
        chai.request(test.server)
        .put('/api/rooms/types?id=' + test.data.roomsTypes[2].id)
        .set('content-type', 'application/json')
        .send(newData)
        .end((err, res) => {
            res.should.have.status(200);

            // check info
            chai.request(test.server)
            .get('/api/rooms/types?id=' + test.data.roomsTypes[2].id)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('array');
                res.body.length.should.be.equal(1);

                const data = res.body[0];
                newData.display_name.should.be.equal(data.display_name);
                done();
            });
        });
    });

    it('Delete room type', function(done) {
        chai.request(test.server)
        .delete('/api/rooms/types?id=' + test.data.roomsTypes[2].id)
        .end((err, res) => {
            res.should.have.status(200);

            // check deletion
            chai.request(test.server)
            .get('/api/rooms/types?id=' + test.data.roomsTypes[2].id)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('array');
                res.body.length.should.be.equal(0);
                done();
            });
        });
    });

    it('Add a room type', function(done) {
        let object = Object.assign({}, test.data.roomsTypes[2]);
        delete object.id;

        // add the event
        chai.request(test.server)
        .post('/api/rooms/types')
        .set('content-type', 'application/json')
        .send(object)
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('object');
            should.exist(res.body.id);
            res.body.id.should.be.a('number');

            test.data.roomsTypes[2].id = res.body.id;

            // check info
            chai.request(test.server)
            .get('/api/rooms/types?id=' + test.data.roomsTypes[2].id)
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
