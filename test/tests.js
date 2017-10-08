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
  return new Promise(function(resolve, reject){
    mongoose.connection.db.dropDatabase(function(err, result) {
      if(err) reject(err)
      console.log('Database emptied')
      resolve()
    })
  })
}

function seedUsers() {
  let arr = []
  let i = 0
  while(arr.length <= 30) {
    arr.push(
      Users.create({
        username: `test${i}`,
        password: Users.hashPassword('testtest'),
        email: `test${i}@testmail.com`
      })
    )
    i++
  }
  return new Promise(function(resolve, reject){
    Promise.all(arr)
    .then(data => resolve())
    .catch(err => reject(err))
  })
}

describe('User route test', function() {
  this.timeout(15000)
  //run server before test
  before(function(done) {
    runServer(port=PORT, databaseUrl=TEST_DATABASE_URL)
    setTimeout(function() {
      seedUsers()
      .then(function(){
        setTimeout(done,500)
      })
    }, 500)
  })
  //close server after test
  after(function(done) {
    deleteDatabase()
    .then(closeServer())
    .then(done())
  })

  it('should be able to login', function() {
    return loginUser('test0')
    .then(res => {
      expect(res.status).to.equal(200)
    })
  })

  it('should be able to logout', function() {
    return loginUser('test0')
    .then(res => {
      return agent.get('/signout')
    })
    .then(res => {
      expect(res.status).to.equal(200)
    })
  })

  it('should be able to create a group', function() {
    let new_group = {name: 'test group test'}
    return setupEnvironmentOne('test1', 'g0')
    .then(() => {
      return loginUser('test1')
    })
    .then(res => {
      return agent.post('/group/new')
      .set('content-type', 'application/x-www-form-urlencoded')
      .send(new_group)
    })
    .then(res => {
      return Groups.findOne({name: new_group.name})
      .then(group => {
        return Users.findOne({username: 'test1'})
        .then(user => {
          let match_group = user.groups.filter(id => id.equals(group._id))[0]
          expect(res.status).to.equal(200)
          expect(group).to.exist
          expect(match_group).to.exist
          expect(group.name).to.equal(new_group.name)
          expect(group.users).to.not.be.empty
          expect(group.users[0].equals(user._id)).to.be.true
        })
      })
    })
  })

  it('should be able to leave a group', function() {
    return setupEnvironmentOne('test2', 'g1')
    .then(res => {
      return Groups.findOne({name: 'g1'})
      .then(group => {
        return loginUser('test2')
        .then(res => agent.post(`/group/leave/${group._id}`))
      })
    })
    .then(res => {
      let findGroup = Groups.findOne({name: 'g1'})
      let findUser = Users.findOne({username: 'test2'})
      return Promise.all([findGroup, findUser])
      .then(data => {
        let group = data[0]
        let user = data[1]

        let match_group = user.groups.filter(id => id.equals(group._id))[0]

        expect(match_group).to.not.exist
        expect(group).to.not.exist
      })
    })
  })

  it('should be able to add a book to user collection', function() {
    return setupEnvironmentOne('test3', 'g2')
    .then(() => {
      return loginUser('test3')
      .then(res => {
        return Users.findOne({username: 'test3'})
        .then(user => {
          let new_book = {
            title: 'test book',
            author: 'test author',
            owner: {_id: user._id, username: user.username},
            group: null
          }
          return agent.post('/collection/add')
          .set('content-type', 'application/x-www-form-urlencoded')
          .send(new_book)
        })
      })
      .then(res => {
        return Users.findOne({username: 'test3'})
        .then(user => {
          let match_book = user.books.filter(book => book.title == 'test book')[0]
          expect(res.status).to.equal(200)
          expect(match_book).to.exist
          expect(match_book.title).to.equal('test book')
          expect(match_book.author).to.equal('test author')
        })
      })
    })
  })

  it('should be able to remove a book from user collection', function() {
    return setupEnvironmentOne('test4', 'g3')
    .then(() => {
      return loginUser('test4')
      .then(res => {
        return Users.findOne({username: 'test4'})
        .then(user => {
          let book = user.books[0]
          return agent.post(`/collection/remove/${book._id}`)
        })
      })
    })
    .then(res => {
      return Users.findOne({username: 'test4'})
      .then(user => {
        expect(res.status).to.equal(200)
        expect(user.books).to.be.empty
      })
    })
  })

  it('should be able to add a book to a group', function() {
    return setupEnvironmentOne('test5', 'g4')
    .then(() => {
      return loginUser('test5')
      .then(res => {
        return Users.findOne({username: 'test5'})
        .then(user => {
          let new_book = {
            title: 'another test book',
            author: 'test author test',
            owner: {_id: user._id, username: user.username},
            group: null
          }
          user.books.push(new_book)
          return user.save()
        })
      })
    })
    .then(() => {
      let findUser = Users.findOne({username: 'test5'})
      let findGroup = Groups.findOne({name: 'g4'})

      return Promise.all([findUser, findGroup])
      .then(data => {
        let book = data[0].books.filter(bk => bk.title == 'another test book')[0]
        let group = data[1]

        return agent.post(`/group/book/add/${group._id}/${book._id}`)
      })
    })
    .then(res => {
      let findUser = Users.findOne({username: 'test5'})
      let findGroup = Groups.findOne({name: 'g4'})

      return Promise.all([findUser, findGroup])
      .then(data => {
        let book = data[0].books.filter(bk => bk.title == 'another test book')[0]
        let group = data[1]

        expect(res.status).to.equal(200)
        expect(book.group).to.exist
        expect(book.group._id.equals(group._id)).to.be.true
        expect(group.books.find(id => id.equals(book._id))).to.exist
      })
    })
  })

  it('should be able to remove a book from a group', function() {
    return setupEnvironmentOne('test6', 'g5')
    .then(() => {
      return loginUser('test6')
      .then(res => {
        let findUser = Users.findOne({username: 'test6'})
        let findGroup = Groups.findOne({name: 'g5'})

        return Promise.all([findUser, findGroup])
        .then(data => data)
      })
    })
    .then(data => {
      let user = data[0]
      let group = data[1]
      let book = user.books[0]
      return agent.post(`/group/book/remove/${group._id}/${book._id}`)
    })
    .then(res => {
      let findUser = Users.findOne({username: 'test6'})
      let findGroup = Groups.findOne({name: 'g5'})
      return Promise.all([findUser,findGroup])
      .then(data => {
        let user = data[0]
        let group = data[1]
        let book = user.books[0]

        expect(book.group).to.not.exist
        expect(group.books).to.be.empty
      })
    })
  })

  it('should be able to invite a user to the group', function() {
    return setupEnvironmentOne('test7', 'g6')
    .then(() => {
      return loginUser('test7')
      .then(res => {
        return Groups.findOne({name: 'g6'})
        .then(group => {
          let invited_user = {username: 'test8'}
          return agent.post(`/group/send-invite/${group._id}`)
          .set('content-type', 'application/x-www-form-urlencoded')
          .send(invited_user)
        })
      })
    })
    .then(res => {
      let findUser = Users.findOne({username: 'test8'})
      let findGroup = Groups.findOne({name: 'g6'})

      return Promise.all([findUser,findGroup])
      .then(data => {
        let invited_user = data[0]
        let group = data[1]
        let match_invite = invited_user.invites.find(id => id.equals(group._id))

        expect(res.status).to.equal(200)
        expect(invited_user.invites).to.not.be.empty
        expect(match_invite.equals(group._id)).to.be.true
        expect(invited_user.groups).to.be.empty
      })
    })
  })

  it('should be able to accept a group invite', function() {
    return setupEnvironmentOne('test9', 'g7')
    .then(() => {
      return loginUser('test9')
      .then(res => {
        return Groups.findOne({name: 'g7'})
        .then(group => {
          let invited_user = {username: 'test10'}
          return agent.post(`/group/send-invite/${group._id}`)
          .set('content-type', 'application/x-www-form-urlencoded')
          .send(invited_user)
        })
      })
    })
    .then(res => {
      return Groups.findOne({name: 'g7'})
      .then(group => {
        return loginUser('test10')
        .then(res => {
          return agent.post(`/group-invite/accept/${group._id}`)
        })
      })
    })
    .then(res => {
      let findUser = Users.findOne({username: 'test10'})
      let findGroup = Groups.findOne({name: 'g7'})

      return Promise.all([findUser, findGroup])
      .then(data => {
        let user =  data[0]
        let group = data[1]
        let match_group = user.groups.find(id => id.equals(group._id))
        let match_user = group.users.find(id => id.equals(user._id))

        expect(res.status).to.equal(200)
        expect(user.invites).to.be.empty
        expect(user.groups).to.not.be.empty
        expect(match_group.equals(group._id)).to.be.true
        expect(match_user.equals(user._id)).to.be.true
        expect(group.users.length).to.be.above(1)
      })
    })
  })

  it('should be able to decline a group invite', function() {

    return setupEnvironmentOne('test11', 'g8')
    .then(() => {
      return loginUser('test9')
      .then(res => {
        return Groups.findOne({name: 'g8'})
        .then(group => {
          let invited_user = {username: 'test12'}
          return agent.post(`/group/send-invite/${group._id}`)
          .set('content-type', 'application/x-www-form-urlencoded')
          .send(invited_user)
        })
      })
    })
    .then(res => {
      return Groups.findOne({name: 'g8'})
      .then(group => {
        return loginUser('test12')
        .then(res => {
          return agent.post(`/group-invite/decline/${group._id}`)
        })
      })
    })
    .then(res => {
      let findUser = Users.findOne({username: 'test12'})
      let findGroup = Groups.findOne({name: 'g8'})

      return Promise.all([findUser, findGroup])
      .then(data => {
        let user =  data[0]
        let group = data[1]
        let match_user = group.users.find(id => id.equals(user._id))

        expect(res.status).to.equal(200)
        expect(user.invites).to.be.empty
        expect(user.groups).to.be.empty
        expect(group.users.length).to.equal(1)
        expect(match_user).to.not.exist
      })
    })
  })

  it('should be able to request to borrow a book', function() {
    return setupEnvironmentTwo('test13', 'test14', 'g9')
    .then(() => {
      return loginUser('test14')
      .then(res => {
        let findOwner = Users.findOne({username: 'test13'})
        let findGroup = Groups.findOne({name: 'g9'})

        return Promise.all([findOwner, findGroup])
        .then(data => {
          let owner = data[0]
          let group = data[1]
          let book = owner.books[0]

          return agent.post(`/book/request-borrow/${book._id}/${group._id}/${owner._id}`)
        })
      })
    })
    .then(res => {
      let findOwner = Users.findOne({username: 'test13'})
      let findBorrower = Users.findOne({username: 'test14'})

      return Promise.all([findOwner, findBorrower])
      .then(data => {
        let owner = data[0]
        let borrower = data[1]
        let book = owner.books[0]
        let request = owner.borrowRequests[0]

        expect(res.status).to.equal(200)
        expect(owner.borrowRequests).to.not.be.empty
        expect(book.borrower).to.not.exist
        expect(borrower.borrowedBooks).to.be.empty
        expect(request.user._id.equals(borrower._id)).to.be.true
        expect(book.group).to.exist
      })
    })
  })

  it('should be able to accept a borrow request', function() {
    return setupEnvironmentTwo('test15', 'test16', 'g10')
    .then(() => {
      return loginUser('test16')
      .then(res => {
        let findOwner = Users.findOne({username: 'test15'})
        let findGroup = Groups.findOne({name: 'g10'})

        return Promise.all([findOwner, findGroup])
        .then(data => {
          let owner = data[0]
          let group = data[1]
          let book = owner.books[0]

          return agent.post(`/book/request-borrow/${book._id}/${group._id}/${owner._id}`)
        })
      })
    })
    .then(res => {
      return Users.findOne({username: 'test15'})
      .then(user => {
        let request = user.borrowRequests[0]
        return loginUser('test15')
        .then(res => {
          return agent.post(`/borrow-request/accept/${request.book._id}/${request._id}/${request.user._id}`)
        })
      })
    })
    .then(res => {
      let findOwner = Users.findOne({username: 'test15'})
      let findBorrower = Users.findOne({username: 'test16'})

      return Promise.all([findOwner, findBorrower])
      .then(data => {
        let owner = data[0]
        let borrower = data[1]
        let book = owner.books[0]
        let match_book = borrower.borrowedBooks.find(id => id.equals(book._id))
        expect(res.status).to.equal(200)
        expect(owner.borrowRequests).to.be.empty
        expect(book.borrower).to.exist
        expect(book.borrower).to.equal('test16')
        expect(borrower.borrowedBooks).to.not.be.empty
        expect(match_book.equals(book._id)).to.be.true
      })
    })
  })

  it('should be able to decline a borrow request', function() {

    return setupEnvironmentTwo('test17', 'test18', 'g11')
    .then(() => {
      return loginUser('test18')
      .then(res => {
        let findOwner = Users.findOne({username: 'test17'})
        let findGroup = Groups.findOne({name: 'g11'})

        return Promise.all([findOwner, findGroup])
        .then(data => {
          let owner = data[0]
          let group = data[1]
          let book = owner.books[0]

          return agent.post(`/book/request-borrow/${book._id}/${group._id}/${owner._id}`)
        })
      })
    })
    .then(res => {
      return Users.findOne({username: 'test17'})
      .then(user => {
        let request = user.borrowRequests[0]
        return loginUser('test17')
        .then(res => {
          return agent.post(`/borrow-request/decline/${request._id}`)
        })
      })
    })
    .then(res => {
      let findOwner = Users.findOne({username: 'test17'})
      let findBorrower = Users.findOne({username: 'test18'})

      return Promise.all([findOwner, findBorrower])
      .then(data => {
        let owner = data[0]
        let borrower = data[1]
        let book = owner.books[0]
        let match_book = borrower.borrowedBooks.find(id => id.equals(book._id))
        expect(res.status).to.equal(200)
        expect(owner.borrowRequests).to.be.empty
        expect(book.borrower).to.not.exist
        expect(borrower.borrowedBooks).to.be.empty
        expect(match_book).to.not.exist
      })
    })
  })

  it('should be able to send a return request', function() {
    return setupEnvironmentThree('test19', 'test20', 'g12')
    .then(() => {
      let findOne = Users.findOne({username:'test19'})
      let findTwo = Users.findOne({username:'test20'})

      return Promise.all([findOne, findTwo])
      .then(data => {
          let owner = data[0]
          let borrower = data[1]
          let book = owner.books[0]

          return agent.post(`/book/return/${book._id}/${owner._id}/${borrower._id}`)
      })
    })
    .then(res => {
      let findOne = Users.findOne({username:'test19'})
      let findTwo = Users.findOne({username:'test20'})

      return Promise.all([findOne, findTwo])
      .then(data => {
          let owner = data[0]
          let borrower = data[1]
          let book = owner.books[0]
          let match_book = borrower.borrowedBooks.find(id => id.equals(book._id))

          expect(res.status).to.equal(200)
          expect(book.borrower).to.exist
          expect(borrower.borrowedBooks).to.not.be.empty
          expect(match_book.equals(book._id)).to.be.true
          expect(book.borrower).to.equal(borrower.username)
      })
    })
  })

})

function loginUser(arg) {
  //arg takes a string as a username ex: 'test1'
  let user = {username: arg, password: 'testtest'}
  return agent
  .post('/login')
  .set('content-type', 'application/x-www-form-urlencoded')
  .send(user)
}

function setupEnvironmentOne(arg1, arg2) {
  //arg1 takes a string as a username ex: 'test1'
  //arg2 takes a string as a group name ex: 'test group'
  return Users.findOne({username: arg1})
  .then(user => {
    let book = {
      title: 'test book',
      author: 'test author',
      owner: {_id: user._id, username: user.username},
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum tellus.',
      group: null
    }
    user.books.push(book)
    return user
  })
  .then(user => {
    return Groups.create({name: arg2})
    .then(group => {
      let book = user.books[0]
      group.users.push(user._id)
      group.books.push(book._id)
      group.save()

      user.groups.push(group._id)
      book.group = {_id: group._id, name: group.name}
      return user.save()
    })
  })
}

//Creates db state where there are 2 users that belong to the same group, user1 has a book inside the group, user2 has no books inside the group
function setupEnvironmentTwo(arg1, arg2, arg3) {
  //arg1 takes a string as a username for the primary user (the user accept/decline borrow/return requests)
  //arg2 takes a string as a username for the secondary user (the user making borrow/return requests)
  //arg3 takes a string as a group name
  return Users.findOne({username: arg1})
  .then(user => {
    let book = {
      title: 'test book',
      author: 'test author',
      owner: {_id: user._id, username: user.username},
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum tellus.',
      group: null
    }
    user.books.push(book)
    return user
  })
  .then(userPrimary => {
    let createGroup = Groups.create({name: arg3})
    let findSecondUser = Users.findOne({username: arg2})

    return Promise.all([createGroup, findSecondUser])
    .then(data => {
      let group = data[0]
      let book = userPrimary.books[0]
      let userSecondary = data[1]

      group.users.push(userPrimary._id)
      group.users.push(userSecondary._id)
      group.books.push(book._id)

      book.group = {_id: group._id, name: group.name}
      userPrimary.groups.push(group._id)
      userSecondary.groups.push(group._id)

      group.save()
      userPrimary.save()
      return userSecondary.save()
    })
  })
}

//Same as setupEnvironmentTwo except the book is already borrowed
function setupEnvironmentThree(arg1, arg2, arg3) {
  //arg1 takes a string as a username for the primary user (the user accept/decline borrow/return requests)
  //arg2 takes a string as a username for the secondary user (the user making borrow/return requests)
  //arg3 takes a string as a group name
  return Users.findOne({username: arg1})
  .then(user => {
    let book = {
      title: 'test book',
      author: 'test author',
      owner: {_id: user._id, username: user.username},
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum tellus.',
      group: null
    }
    user.books.push(book)
    return user
  })
  .then(userPrimary => {
    let createGroup = Groups.create({name: arg3})
    let findSecondUser = Users.findOne({username: arg2})

    return Promise.all([createGroup, findSecondUser])
    .then(data => {
      let group = data[0]
      let book = userPrimary.books[0]
      let userSecondary = data[1]

      group.users.push(userPrimary._id)
      group.users.push(userSecondary._id)
      group.books.push(book._id)

      book.group = {_id: group._id, name: group.name}
      book.borrower = userSecondary.username
      userPrimary.groups.push(group._id)
      userSecondary.groups.push(group._id)
      userSecondary.borrowedBooks.push(book._id)

      group.save()
      userPrimary.save()
      return userSecondary.save()
    })
  })
}