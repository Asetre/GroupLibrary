const {Groups, Users, Books} = require('../models/users')
const mongoose = require('mongoose')
const nodemailer = require('nodemailer')


mongoose.Promise = Promise

module.exports = function(app, passport) {

  app.get('/lostAccount', (req, res) => {
    res.render('lost', {User: null, errors: null})
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
