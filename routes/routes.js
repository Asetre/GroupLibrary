const {Groups, Users, Books} = require('../models/users')
const mongoose = require('mongoose')
const nodemailer = require('nodemailer')


mongoose.Promise = Promise

module.exports = function(app, passport) {

  app.get('/lostAccount', (req, res) => {
    res.render('lost', {User: null, errors: null})
  })
  //dashboard route
  app.get('/dashboard', isLoggedIn,(req, res) => {
    Users.findOne({_id: req.user._id})
      .populate({
        path: 'groups invites'
      })
      .then(user => {
        //If user was not found redirect to login
        //else render the dashboard
        if(!user) return res.redirect('/login')
        res.render('dashboard', {User: user})
      })
      .catch(err => {
        res.send(500, 'Internal server error, please try again')
      })
  })

  //accept group invite route
  app.post('/accept-group-invite/:groupId', isLoggedIn, (req, res) => {
    //Add User to the group
    Groups.findOne({_id: req.params.groupId})
      .then(group => {
        group.users.push(req.user)
        group.save()
        return group
      })
      .then(group => {
        //remove the invite
        req.user.invites.remove(req.params.groupId)
        //save group to user
        req.user.groups.push(group)
        req.user.save()

        //redirect to group
        res.status(200)
        res.redirect(`/group/${req.params.groupId}`)
      })
      .catch(err => {
        console.log(err)
        res.status(500).send('Internal server error')
      })
  })

  //decline group invite route
  app.post('/decline-group-invite/:groupId', isLoggedIn, (req, res) => {
    //Remove invite from user invites array
    req.user.invites.remove(req.params.groupId)
    req.user.save()
    res.end()
  })


  //add a book to user collection route
  app.post('/add-book-to-collection', isLoggedIn, (req, res) => {
    //add a new book to user then save
    req.user.books.push({
      owner: {_id: req.user._id, name: req.user.username},
      title: req.body.title,
      author: req.body.author,
      description: req.body.description,
      group: null
    })
    req.user.save()
    .catch(err => {
      console.log(err)
    })
    res.status(201).redirect('/dashboard')
  })

  //remove a book from user collection route
  app.post('/remove-book-from-collection/:bookId', isLoggedIn, (req, res) => {
    //find the book then delete from array
    req.user.books.remove(req.params.bookId)
    req.user.save()
    res.status(200).redirect('/dashboard')
  })

  //book info route
  app.get('/book/:bookId/:ownerId', isLoggedIn, (req, res) => {
    Users.findOne({_id: req.params.ownerId})
      .then(user => {
        res.render('book', {User: req.user, Book: user.books.id(req.params.bookId)})
      })
      .catch( err => {
        console.log(err)
      })
  })

  //request to borrow a book route
  app.post('/request-to-borrow-book/:bookId/:groupId/:ownerId', isLoggedIn, (req, res) => {
    let findBook = Users.findOne({_id: req.params.ownerId})
      .then(user => {
        return user.books.id(req.params.bookId)
      })
    let findGroup = Groups.findOne({_id: req.params.groupId})
      .populate({
        path: 'users',
        match: {_id: req.user._id}
      })

    Promise.all([findBook, findGroup])
      .then(data => {
        let book = data[0]
        let group = data[1]

        //check if user is inside the group
        if(group.users.length === 1) {
          //check if the book belongs to the group
          if(book.group.id.equals(group._id)) {
            //check if the book is being borrowed
            if(!book.borrower) {
              //check for duplicate borrow request
              Users.findOne({_id: book.owner._id, 'borrowRequests.id': req.user._id}, {"borrowRequests.$": 1})
                .then(request => {
                  if(!request) {
                    //send a new borrow request
                    let newrequest = {
                      _id: mongoose.Types.ObjectId(),
                      user: {_id: req.user._id, username: req.user.username},
                      book: {id: book._id, title: book.title, author: book.author},
                      group: {id: group._id, name: group.name}
                    }

                    Users.findOne({_id: book.owner._id})
                      .then(owner => {
                        owner.borrowRequests.push(newrequest)
                        owner.save()

                        res.redirect(`/group/${group._id}`)
                      })
                  }
                })
            }
          }
        }
      })
      .catch(err => console.log(err))
  })

  //accept borrow request route
  app.post('/accept-borrow-request/:bookId/:requestId/:requesterId', isLoggedIn, (req, res) => {
    let findBorrower = Users.findOne({_id: req.params.requesterId})
    let updateOwner = Users.findOneAndUpdate({_id: req.user._id}, {$pull: {borrowRequests: {_id: req.params.requestId}}},{safe: true, multi:true}).exec()
    .then(user => user)

    Promise.all([findBorrower, updateOwner])
    .then( data => {
      let borrower = data[0]
      let book = data[1].books.id(req.params.bookId)

      //Update book
      book.borrower = borrower.username
      data[1].save()
      //Add book to borrower
      borrower.borrowedBooks.push(book)
      borrower.save()

      res.redirect('/dashboard')
    })
    .catch(err => console.log(err))
  })

  app.post('/decline-book-request/:requestId', isLoggedIn, (req, res) => {
    //Find and remove the reques
    Users.findOneAndUpdate({_id: req.user._id}, {$pull: {borrowRequests: {_id: req.params.requestId}}},{safe: true, multi:true}).exec()
    .then(user => {
      res.redirect('/dashboard')
    })
    .catch(err => console.log(err))
  })

  app.post('/return/:bookId/:ownerId/:borrowerId', isLoggedIn, (req,res) => {
    let findOwner = Users.findOne({_id: req.params.ownerId})
    let findBorrower = Users.findOne({_id: req.params.borrowerId})

    Promise.all([findOwner, findBorrower])
    .then(data => {
      let owner = data[0]
      let borrower = data[1]
      let book = owner.books.id(req.params.bookId)

      let returnRequest = {
        _id: mongoose.Types.ObjectId(),
        book: {_id: book._id, title: book.title, author: book.author, owner:{_id: owner._id, username: owner.username}},
        borrower: {_id: borrower._id, username: borrower.username}
      }

      owner.bookReturns.push(returnRequest)
      owner.save()
      res.redirect('/dashboard')
    })
  })

  app.post('/appprove-return/:bookId/:borrowerId/:returnId', (req, res) => {
    let findOwner = Users.findOne({_id: req.user._id})
    let findBorrower = Users.findOne({_id: req.params.borrowerId})
    let removeReturn = Users.findOneAndUpdate({_id: req.user}, {$pull: {bookReturns: {_id: req.params.returnId}}},{safe:true,multi:true}).exec()

    Promise.all([findOwner, findBorrower, removeReturn])
    .then(data => {
      let owner = data[0]
      let borrower = data[1]
      let book = owner.books.id(req.params.bookId)

      //Remove book borrower
      book.borrower = null
      owner.save()
      //Remove book from borrower
      borrower.borrowedBooks.remove(book._id)
      borrower.save()
    })
    .then(() => res.redirect('/dashboard'))
    .catch(err => console.log(err))
  })

  app.post('/decline-return/:returnId', (req, res) => {
    Users.findOneAndUpdate({_id: req.user._id}, {$pull: {bookReturns: {_id: req.params.returnId}}}, {safe:true,multi:true})
    .then(() => {
      res.redirect('/dashboard')
    })
    .catch(err => {
      console.log(err)
      req.status(500).send('Internal server error 500')
    })
  })
}
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}
//check if user is logged in
function isLoggedIn(req, res, next) {
  if(!(req.user)) return res.redirect('/login')
  next()
}
//Check if password is too short
function checkNewUser(req, res, next) {
}
