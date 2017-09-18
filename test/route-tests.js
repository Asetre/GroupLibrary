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

function loginUser(arg) {
  //arg is an object that contains username, password, and email as the keys
  let user = {username: arg.username, password: arg.password}
  return agent
    .post('/login')
    .set('content-type', 'application/x-www-form-urlencoded')
    .send(user)
}

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
    .set('content-type', 'application/x-www-form-urlencoded')
    .send(firstTestUser)
    .then( res => {
      expect(res.status).to.equal(200)
    })
  })

  it('should be able to create a group', function() {
    return loginUser(firstTestUser)
    .then(res => {
      return agent.post('/new-group')
      .set('content-type', 'application/x-www-form-urlencoded')
      .send(testGroup)
      .then(res => {
        return Groups.findOne({name: testGroup.name})
        .then( group => {
          expect(group).to.exist
          expect(group.name).to.equal(testGroup.name)
        })
      })
    })
  })

  it('should be able to leave a group', function() {
    return loginUser(firstTestUser)
      .then(res => {
        return agent.post('/new-group')
          .set('content-type', 'application/x-www-form-urlencoded')
          .send(testGroup)
          .then(res => {
            return Groups.findOne({name: testGroup.name})
              .then( groupBefore => {
                return agent.post(`/leave-group/${groupBefore._id}`)
                  .then(res => {
                    return Groups.findOne({_id: groupBefore._id})
                    .then(group => {
                      expect(group).to.not.exist
                    })
                  })
              })
          })
      })

    it('should be able to go to the group', function() {
      return loginUser(firstTestUser)
        .then(res => {
          return agent.post('/new-group')
            .set('content-type', 'application/x-www-form-urlencoded')
            .send(testGroup)
            .then(res => {
              return Groups.findOne({name: testGroup.name})
                .then( group => {
                  return agent.get(`/group/${group._id}`)
                  .then(res => {
                    expect(res.status).to.equal(200)
                  })
                })
            })
        })
    })
  })

  it('should be able to send a group invite', function() {
    return loginUser(firstTestUser)
    .then(res => {
      return agent.post('/new-group')
      .set('content-type', 'application/x-www-form-urlencoded')
      .send(testGroup)
      .then(res => {
        return Groups.findOne({name: testGroup.name})
        .then( group => {
          return group
        })
      })
      .then(group => {
        return agent.post(`/send-group-invite/${group._id}`)
          .set('content-type', 'application/x-www-form-urlencoded')
          .send({username: secondTestUser.username})
          .then(res => {
            return Users.findOne({username: secondTestUser.username})
            .then(user => {
              expect(user).to.exist
              expect(user.invites).to.not.be.empty
              expect(user.invites[0].equals(group._id)).to.be.true
            })
          })
      })
    })
  })

  it('should be able to accept a group invite', function() {
    return loginUser(firstTestUser)
    .then(res => {
      return agent.post('/new-group')
      .set('content-type', 'application/x-www-form-urlencoded')
      .send(testGroup)
      .then(res => {
        return Groups.findOne({name: testGroup.name})
        .then( group => {
          return group
        })
      })
      .then(group => {
        return agent.post(`/send-group-invite/${group._id}`)
          .set('content-type', 'application/x-www-form-urlencoded')
          .send({username: secondTestUser.username})
          .then(res => {
            return loginUser(secondTestUser)
              .then(res => {
                return agent.post(`/accept-group-invite/${group._id}`)
                  .then(res => {
                    return Users.findOne({username: secondTestUser.username})
                      .then(user => {
                        expect(user).to.exist
                        expect(user.invites).to.be.empty
                        expect(user.groups).to.not.be.empty
                        expect(user.groups[0].equals(group._id)).to.be.true
                      })
                  })
              })
          })
      })
    })
  })

  it('should be able to decline a group invite', function() {
    return loginUser(firstTestUser)
    .then(res => {
      return agent.post('/new-group')
      .set('content-type', 'application/x-www-form-urlencoded')
      .send(testGroup)
      .then(res => {
        return Groups.findOne({name: testGroup.name})
        .then( group => {
          return group
        })
      })
      .then(group => {
        return agent.post(`/send-group-invite/${group._id}`)
          .set('content-type', 'application/x-www-form-urlencoded')
          .send({username: secondTestUser.username})
          .then(res => {
            return loginUser(secondTestUser)
              .then(res => {
                return agent.post(`/decline-group-invite/${group._id}`)
                  .then(res => {
                    return Users.findOne({username: secondTestUser.username})
                      .then(user => {
                        expect(user).to.exist
                        expect(user.invites).to.be.empty
                        expect(user.groups).to.be.empty
                      })
                  })
              })
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
    return loginUser(firstTestUser)
      .then(res => {
        return agent.post('/add-book-to-collection')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send(newBook)
        .then(res => {
          return Users.findOne({username: firstTestUser.username})
          .then(user => {
            let book = user.books[0]
            expect(user.books).to.not.be.empty
            expect(book.title).to.equal(newBook.title)
            expect(book.author).to.equal(newBook.author)
            expect(book.description).to.equal(newBook.description)
          })
        })
      })
  })

  it('should be able to remove a book from their collection', function() {
    let newBook = {
      title: 'test book',
      author: 'test author',
      description: 'some information'
    }
    return loginUser(firstTestUser)
      .then(res => {
        return agent.post('/add-book-to-collection')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send(newBook)
        .then(res => {
          return Users.findOne({username: firstTestUser.username})
          .then(user => {
            let book = user.books[0]
            return agent.post(`/remove-book-from-collection/${book._id}`)
            .then(res => {
              return Users.findOne({username: firstTestUser.username})
              .then(user => {
                expect(user).to.exist
                expect(user.books).to.be.empty
              })
            })
          })
        })
      })
  })

  it('should be able to add a book to the group', function() {
    let newBook = {
      title: 'test book',
      author: 'test author',
      description: 'some information'
    }
    return loginUser(firstTestUser)
      .then(res => {
        return agent.post('/add-book-to-collection')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send(newBook)
        .then(res => {
          return agent.post('/new-group')
          .set('content-type', 'application/x-www-form-urlencoded')
          .send(testGroup)
          .then(res => {
            return Groups.findOne({name: testGroup.name})
            .then(group => {
              return Users.findOne({username: firstTestUser.username})
              .then(user => {
                let book = user.books[0]
                return agent.post(`/add-book-to-group/${book._id}/${group._id}`)
                  .then(res => {
                    return Groups.findOne({name: testGroup.name})
                    .then(updateGroup => {
                      return Users.findOne({username: firstTestUser.username})
                      .then(updatedUser => {
                        let updatedBook = updatedUser.books.id(book._id)
                        let groupBook = updateGroup.books[0]
                        expect(updateGroup.books).to.not.be.empty
                        expect(groupBook._id.equals(updatedBook._id)).to.be.true
                        expect(groupBook.title).to.equal(updatedBook.title)
                        expect(groupBook.author).to.equal(updatedBook.author)
                        expect(groupBook.description).to.equal(updatedBook.description)
                      })
                    })
                  })
              })
            })
          })
        })
      })
  })

  it('should be able to remove book from group', function() {
    let newBook = {
      title: 'test book',
      author: 'test author',
      description: 'some information'
    }
    return loginUser(firstTestUser)
      .then(res => {
        return agent.post('/add-book-to-collection')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send(newBook)
        .then(res => {
          return agent.post('/new-group')
          .set('content-type', 'application/x-www-form-urlencoded')
          .send(testGroup)
          .then(res => {
            return Groups.findOne({name: testGroup.name})
            .then(group => {
              return Users.findOne({username: firstTestUser.username})
              .then(user => {
                let book = user.books[0]
                return agent.post(`/add-book-to-group/${book._id}/${group._id}`)
                  .then(res => {
                    return agent.post(`/remove-book-from-group/${book._id}/${group._id}`)
                    .then(res => {
                      return Groups.findOne({name: testGroup.name})
                      .then(updatedGroup => {
                        expect(updatedGroup.books).to.be.empty
                      })
                    })
                  })
              })
            })
          })
        })
      })
  })

  it('should be able to send a borrow request', function() {
    let book
    let newBook = {
      title: 'test book',
      author: 'test author',
      description: 'some information'
    }
    return loginUser(firstTestUser)
      .then(res => {
        return agent.post('/add-book-to-collection')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send(newBook)
        .then(res => {
          return agent.post('/new-group')
          .set('content-type', 'application/x-www-form-urlencoded')
          .send(testGroup)
          .then(res => {
            return Groups.findOne({name: testGroup.name})
            .then(group => {
              return Users.findOne({username: firstTestUser.username})
              .then(user => {
                book = user.books[0]
                return agent.post(`/add-book-to-group/${book._id}/${group._id}`)
                  .then(res => {
                    return Users.findOne({username: secondTestUser.username})
                    .then(secondUser => {
                      group.users.push(secondUser)
                      group.save()
                    })
                  })
              })
            })
          })
        })
      })
    .then(() => {
      return loginUser(secondTestUser)
      .then(res => {
        return Groups.findOne({name: testGroup.name})
        .then(group => {
          return agent.post(`/request-to-borrow-book/${book._id}/${group._id}/${book.owner._id}`)
          .then(res => {
            return Users.findOne({username: firstTestUser.username})
            .then(user => {
              let newReq = user.borrowRequests[0]
              expect(user.borrowRequests).to.not.be.empty
              expect(newReq.group.id.equals(group._id)).to.be.true
              expect(newReq.book.title).to.equal(book.title)
              expect(newReq.book.author).to.equal(book.author)
              expect(newReq.book.id.equals(book._id)).to.be.true
            })
          })
        })
      })
    })
  })

  it('should be able to accept a borrow request', function() {
    let book
    let newBook = {
      title: 'test book',
      author: 'test author',
      description: 'some information'
    }
    return loginUser(firstTestUser)
      .then(res => {
        return agent.post('/add-book-to-collection')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send(newBook)
        .then(res => {
          return agent.post('/new-group')
          .set('content-type', 'application/x-www-form-urlencoded')
          .send(testGroup)
          .then(res => {
            return Groups.findOne({name: testGroup.name})
            .then(group => {
              return Users.findOne({username: firstTestUser.username})
              .then(user => {
                book = user.books[0]
                return agent.post(`/add-book-to-group/${book._id}/${group._id}`)
                  .then(res => {
                    return Users.findOne({username: secondTestUser.username})
                    .then(secondUser => {
                      group.users.push(secondUser)
                      group.save()
                    })
                  })
              })
            })
          })
        })
      })
    .then(() => {
      return loginUser(secondTestUser)
      .then(res => {
        return Groups.findOne({name: testGroup.name})
        .then(group => {
          return agent.post(`/request-to-borrow-book/${book._id}/${group._id}/${book.owner._id}`)
          .then(res => {
          })
        })
      })
    })
    .then(() => {
      return loginUser(firstTestUser)
      .then(res => {
        return Users.findOne({username: firstTestUser.username}) 
        .then(user => {
          return agent.post(`/accept-borrow-request/${user.books[0]._id}/${user.borrowRequests[0].id}`)
          then(res => console.log(res))
        })
      })
    })
  })

});
