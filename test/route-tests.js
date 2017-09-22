const chai = require('chai')
const chaiHttp = require('chai-http')
const mongoose = require('mongoose')
const fs = require('fs')

const {runServer, closeServer, app} = require('../server')
const {PORT} = require('../config/config')
const {Users, Groups} = require('../models/users')

const {expect} = chai

const TEST_DATABASE_URL = 'mongodb://test:test@ds147799.mlab.com:47799/tests';

mongoose.Promise = global.Promise

chai.use(chaiHttp)

const agent = chai.request.agent(app)

//Delete database after every test
var deleteDatabase = function() {
  return new Promise(function(resolve, reject){
    mongoose.connection.db.dropDatabase(function(err, result) {
      if(err) reject(err)
      console.log('Database emptied')
      resolve(result)
    })
  })
}

function loginUser(arg) {
  //arg is a string which is the username ex: 'test1'
  let user = {username: arg, password: 'test'}
  return agent
    .post('/login')
    .set('content-type', 'application/x-www-form-urlencoded')
    .send(user)
}

var seedUsers = function() {
  return new Promise(function(resolve, reject) {
    for(let i=0; i<20; i++){
      Users.create({
        username: `test${i}`,
        password: Users.hashPassword('test'),
        email: `test${i}@testmail.com`
      })
      .catch(err => reject(err))
    }
    console.log('users seeded')
    resolve()
  })
}

describe('User route test', function(done) {
  this.timeout(6000)
  //run server before test
  before(function() {
    return seedUsers()
    .then(() =>{
      s = runServer(port=PORT, databaseUrl=TEST_DATABASE_URL)
    })
  })
  //close server after test 
  after(function() {
    return deleteDatabase()
    .then(function() {
      console.log('closing server')
      closeServer()
    })
    .catch(err => console.log(err))
  })

  it('should be able to signup', function() {
    //New user information
    let newUser = {
      username: 'testuser',
      password: 'testtest',
      email: 'testemail@testmail.com'
    }

    let secondUser = {
      username: 'anotherUser',
      password: 'x',
      email: 'testtesttest@mail.com'
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
    .then(() => {
      return chai.request(app)
      .post('/signup')
      .set('content-type', 'application/x-www-form-urlencoded')
      .send(secondUser)
    })
    .then(res => {
      return Users.findOne({username: secondUser.username})
      .then(user => {
        expect(user).to.not.exist
      })
    })
  })

  it('should be able to login', function() {
    return loginUser('test1')
    .then(res => expect(res.status).to.equal(200))
  })

  it('should be able to create a group', function() {
    return loginUser('test1')
    .then(res => {
      return agent.post('/new-group')
      .set('content-type', 'application/x-www-form-urlencoded')
      .send({name: 'g1'})
      .then(res => {
        return Groups.findOne({name: 'g1'})
        .then( group => {
          return Users.findOne({username: 'test1'})
          .then(user => {
            expect(group).to.exist
            expect(group.name).to.equal('g1')
            expect(user.groups).to.not.be.empty
            expect(user.groups[0].equals(group._id)).to.be.true
          })
        })
      })
    })
  })

  it('should be able to go to the group', function() {
    //this test is dependant on the test before it
    return loginUser('test1')
      .then(res => {
        return Groups.findOne({name: 'g1'})
          .then( group => {
            return agent.get(`/group/${group._id}`)
              .then(res => {
                expect(res.status).to.equal(200)
              })
          })
      })
  })

  it('should be able to leave a group', function() {
    return Users.findOne({username: 'test2'})
    .then(user => {
      return Groups.create({name: 'g2'})
      .then(group => {
        group.users.push(user)
        group.save()
        return group
      })
    })
    .then(group => {
      return loginUser('test2')
      .then(res => {
        return agent.post(`/leave-group/${group._id}`)
      })
    })
    .then(res => {
      return Users.findOne({username: 'test2'})
      .then(user => {
        return Groups.findOne({name: 'g2'})
        .then(group => {
          expect(group).to.not.exist
          expect(user.groups).to.be.empty
          expect(res.status).to.equal(200)
        })
      })
    })
  });
  
  it('should be able to send a group invite', function() {
    return Users.findOne({username: 'test3'})
      .then(user => {
        return Groups.create({name: 'g3'})
          .then(group => {
            group.users.push(user)
            group.save()
            return group
          })
      })
    .then(group => {
      return loginUser('test3')
      .then(res => {
        return agent.post(`/send-group-invite/${group._id}`)
        .set('content-type', 'application/x-www-form-urlencoded')
        .send({username: 'test4'})
      })
    })
    .then(res => {
      return Users.findOne({username: 'test4'})
      .then(user => {
        expect(user.invites).to.not.be.empty
      })
    })
  })

  it('should be able to accept a group invite', function() {
    return Users.findOne({username: 'test5'})
    .then(user => {
      return Groups.create({name: 'g4'})
      .then(group => {
        group.users.push(user)
        group.save()
        return group
      })
    })
    .then(group => {
      return Users.findOne({username: 'test6'})
      .then(user => {
        user.invites.push(group._id)
        user.save();

        return group
      })
    })
    .then(group => {
      return loginUser('test6')
      .then(res => {
        return agent.post(`/accept-group-invite/${group._id}`)
      })
    })
    .then(res => {
      return Users.findOne({username: 'test6'})
      .then(user => {
        return Groups.findOne({name: 'g4'})
          .then(group => {
            expect(user.groups).to.not.be.empty
            expect(group._id.equals(user.groups[0])).to.be.true
            expect(group.users.length).to.be.equal(2)
          })
      })
    })
  })

  it('should be able to decline a group invite', function() {
    return Users.findOne({username: 'test7'})
    .then(user => {
      return Groups.create({name: 'g5'})
      .then(group => {
        group.users.push(user)
        group.save()
        return group
      })
    })
    .then(group => {
      return Users.findOne({username: 'test8'})
      .then(user => {
        user.invites.push(group._id)
        user.save();

        return group
      })
    })
    .then(group => {
      return loginUser('test8')
      .then(res => {
        return agent.post(`/decline-group-invite/${group._id}`)
      })
    })
    then(res => {
      return Users.findOne({username: 'test8'})
      .then(user => {
        return Groups.findOne({name: 'g5'})
        .then(group => {
          expect(user.invites).to.be.empty
          expect(user.groups).to.be.empty
          expect(group.users.length).to.equal(1)
        })
      })
    })
  })

  it('should be able to add a book to their collection', function() {
    let newBook = {
      title: 'test book',
      author: 'test author',
      description: 'some information'
    }
    return loginUser('test9')
      .then(res => {
        return agent.post('/add-book-to-collection')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send(newBook)
      })
      .then(res => {
        return Users.findOne({username: 'test9'})
        .then(user => {
          let book = user.books[0]
          expect(user.books).to.not.be.empty
          expect(book.title).to.equal(newBook.title)
          expect(book.author).to.equal(newBook.author)
          expect(book.description).to.equal(newBook.description)
          expect(book.owner._id.equals(user._id)).to.be.true
        })
      })
  })

  it('should be able to remove a book from their collection', function() {
    //This test is dependent on the test before it
    return loginUser('test9')
    .then(res => {
      return Users.findOne({username: 'test9'})
      .then(user => {
        let book = user.books[0]
        return agent.post(`/remove-book-from-collection/${book._id}`)
      })
    })
    .then(res => {
      return Users.findOne({username: 'test9'})
      .then(user => {
        expect(user.books).to.be.empty
      })
    })
  })

  it('should be able to add a book to the group', function() {
    return Users.findOne({username: 'test10'})
    .then(user => {
      return Groups.create({name: 'g6'})
      .then(group => {
        let newBook = {
          owner: {_id: user._id, name: user.username},
          title: 'test book',
          author: 'test author',
          description: 'some information'
        }

        user.books.push(newBook)
        user.groups.push(group)
        user.save()

        group.users.push(user)
        group.save()

        let book = user.books[0]

        return loginUser('test10')
        .then(res => {
          return agent.post(`/add-book-to-group/${book._id}/${group._id}`)
        })
      })
    })
    .then(res => {
      return Users.findOne({username: 'test10'})
      .then(user => {
        let book = user.books[0]
        return Groups.findOne({name: 'g6'})
        .then(group => {
          expect(group.books).to.not.be.empty
          expect(book.group.id.equals(group._id))
        })
      })
    })
  })

  it('should be able to remove book from group', function() {
    //This test is dependent on the test before to pass
    return Users.findOne({username: 'test10'})
    .then(user => {
      let book = user.books[0]
      return Groups.findOne({name: 'g6'})
      .then( group => {
        return loginUser('test10')
        .then(res => {
          return agent.post(`/remove-book-from-group/${book._id}/${group._id}`)
        })
      })
    })
    .then(res => {
      return Users.findOne({username: 'test10'})
      .then(user => {
        return Groups.findOne({name: 'g6'})
        .then(group => {
          let book = user.books[0]
          expect(book.group).to.be.equal(null)
          expect(group.books).to.be.empty
        })
      })
    })
  })

  it('should be able to send a borrow request', function() {
    return Users.findOne({username: 'test11'})
    .then(user => {
      return Users.findOne({username: 'test12'})
      .then(secondUser => {
        return Groups.create({name: 'g7'})
          .then(group => {
            let newBook = {
              owner: {_id: user._id, name: user.username},
              title: 'test book',
              author: 'test author',
              description: 'some information'
            }

            user.books.push(newBook)
            user.groups.push(group)
            user.save()

            group.users.push(user)
            group.users.push(secondUser)
            group.save()

            let book = user.books[0]

            return loginUser('test11')
              .then(res => {
                return agent.post(`/add-book-to-group/${book._id}/${group._id}`)
                  .then(res => {
                    return book
                  })
              })
      })
      })
    })
    .then(book => {
      return loginUser('test12')
      .then(res => {
        return Groups.findOne({name: 'g7'})
        .then(group => {
          return agent.post(`/request-to-borrow-book/${book._id}/${group._id}/${book.owner._id}`)
            .then(res => {
              return Users.findOne({username: 'test11'})
                .then(user => {
                  expect(user.borrowRequests).to.not.be.empty
                })
            })
        })
      })
    })
  })

  it('should be able to accept a borrow request', function() {
    //this test is dependent on the test before
    return loginUser('test11')
    .then(res => {
      return Users.findOne({username: 'test11'})
      .then(user => {
        let book = user.books[0]
        let borrowReq = user.borrowRequests[0]
        return agent.post(`/accept-borrow-request/${book._id}/${borrowReq.id}`)
      })
    })
    .then(res => {
      return Users.findOne({username: 'test12'})
      .then(user => {
        expect(user.borrowedBooks).to.not.be.empty
      })
    })
  })

});
