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
function seedDatabase() {
  //create 3 test users
  for(let i=1; i<4; i++) {
    Users.create({
      username: `test${i}`,
      password: Users.hashPassword('test'),
      email: `test${i}@mail.com`
    })
    .catch(err => console.log(err))
  }
  //create 1 test group
  Groups.create({
    name: 'testGroup'
  })
}

function deleteDatabase(cb) {
  //accepts done as cb
  Users.remove({}, function() {
    Groups.remove({}, cb)
  })
}


let firstTestUser = {username: 'test1', password: 'test', email: 'test1@mail.com'}
let secondTestUser = {username: 'test2', password: 'test', email: 'test2@mail.com'}
let testGroup = {name: 'testGroup'}

describe('User route test', function(done) {
  this.timeout(6000)
  //run server before test
  before(function() {
    s = runServer(port=PORT, databaseUrl=TEST_DATABASE_URL)
  })
  beforeEach(function() {
    //seed db with data
    seedDatabase()
  })
  //close server after test 
  after(() => {
    closeServer()
  })

  afterEach( function(done){
    deleteDatabase(done)
  })

  it('should be able to signup', function() {
    //New user information
    let newUser = {
      username: 'testuser',
      password: 'test',
      email: 'testemail@testmail.com'
    }

    //make post request to server
    return chai.request(app)
      .post('/signup')
      .set('content-type', 'application/x-www-form-urlencoded')
      //send new user
      .send(newUser)
      .then( function(res) {
        //find new user
         return Users.findOne({username: newUser.username})
        .then( user => {
          expect(user).to.exist
          expect(user).to.be.a('object')
          expect(user.password).to.be.a('string')
          expect(user.username).to.equal(newUser.username)
          expect(user.email).to.equal(newUser.email)
          expect(res.status).to.equal(200)
        })
    })
  })

  it('should be able to login', function() {
    return chai.request(app)
    .post('/login')
    .send(firstTestUser)
    .then( res => console.log('test'))
  })

});
