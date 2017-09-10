const chai = require('chai')
const chaiHttp = require('chai-http')
const mongoose = require('mongoose')

const {runServer, closeServer, app} = require('../server')
const {PORT} = require('../config/config')
const {Users, Groups} = require('../models/users')

const {expect} = chai

const TEST_DATABASE_URL = 'mongodb://test:test@ds147799.mlab.com:47799/tests';

mongoose.Promise = global.Promise

chai.use(chaiHttp)

const agent = chai.request.agent(app)

//Delete database after every test
function deleteDatabase() {
  Promise.all([
    Users.remove({}),
    Groups.remove({})
  ])
    .then((data) => {
    })
    .catch((err) => console.log(err))
}

describe('User route test', function() {
  this.timeout(6000)
  //run server before test
  before(function() {
    s = runServer(port=PORT, databaseUrl=TEST_DATABASE_URL)
  })
  //close server after test 
  after(() => {
    deleteDatabase()
    closeServer()
  })

  afterEach(() => {
    deleteDatabase()
  })

  it('should be able to signup', function() {
    let newUser = {
      username: 'test1',
      password: 'test',
      email: 'test@testmail.com'
    }

    return chai.request(app)
      .post('/signup')
      .set('content-type', 'application/x-www-form-urlencoded')
      .send(newUser)
      .then( function(res) {
         return Users.findOne({username: newUser.username})
        .then( user => {
          expect(user).to.not.exist
        })
    })


  })

});
