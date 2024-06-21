const assert = require('assert');
const chai = require('chai');
const chaiHttp = require('chai-http');
const utils = require('../../../utils');
const should = chai.should();
let test;

chai.use(chaiHttp);

describe('api/inventory/inventory', () => {

    before(async function() {
        test = await utils.Init();
    });

    it('Get inventory', function(done) {
        chai.request(test.server)
        .get('/api/inventory')
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('array');
            res.body.length.should.be.equal(10);
            const data = res.body;

            for (let element of data) {
                for (let room of test.data.inventory) {
                    if (room.id === element.id) {
                        room.title.should.be.equal(element.title);
                        room.type.should.be.equal(element.type.id);
                        room.room_id.should.be.equal(element.room_id);
                        room.quantity.should.be.equal(element.quantity);
                    }
                }
            }

            data[0].title.should.be.equal('Respirateur');
            data[0].type.id.should.be.equal(1);
            data[0].room_id.should.be.equal(3);
            data[0].quantity.should.be.equal(5);
            should.exist(data[0].room);
            data[0].room.id.should.be.equal(3);

            data[2].title.should.be.equal('Respirateur');
            data[2].type.id.should.be.equal(1);
            data[2].room_id.should.be.equal(3);
            data[2].quantity.should.be.equal(4);
            should.exist(data[0].room);
            data[2].room.id.should.be.equal(3);

            done();
        });
    });

    it('Get inventory from room_id', function(done) {
        chai.request(test.server)
        .get('/api/inventory?room_id=3')
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('array');
            res.body.length.should.be.equal(4);
            done();
        });
    });

    it('Get inventory from name', function(done) {
        chai.request(test.server)
        .get('/api/inventory?search=Respirateu')
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('array');
            res.body.length.should.be.equal(6);
            done();
        });
    });

    it('Update a inventory', function(done) {
        const newData = {
            title: 'inventory renamed',
            type: 1
        };

        // update the event
        chai.request(test.server)
        .put('/api/inventory?id=' + test.data.inventory[3].id)
        .set('content-type', 'application/json')
        .send(newData)
        .end((err, res) => {
            res.should.have.status(200);

            // check info
            chai.request(test.server)
            .get('/api/inventory?id=' + test.data.inventory[3].id)
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

    it('Delete inventory', function(done) {
        chai.request(test.server)
        .delete('/api/inventory?id=' + test.data.inventory[3].id)
        .end((err, res) => {
            res.should.have.status(200);

            // check deletion
            chai.request(test.server)
            .get('/api/inventory?id=' + test.data.inventory[3].id)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('array');
                res.body.length.should.be.equal(0);
                done();
            });
        });
    });

    it('Add a inventory', function(done) {
        let object = Object.assign({}, test.data.inventory[3]);
        delete object.id;

        // add the event
        chai.request(test.server)
        .post('/api/inventory')
        .set('content-type', 'application/json')
        .send(object)
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('object');
            should.exist(res.body.id);
            res.body.id.should.be.a('number');

            test.data.inventory[3].id = res.body.id;

            // check info
            chai.request(test.server)
            .get('/api/inventory?id=' + test.data.inventory[3].id)
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
