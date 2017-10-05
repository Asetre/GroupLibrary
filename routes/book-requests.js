const {Users, Groups} = require('../models/users')
const mongoose = require('mongoose')

module.exports = function(router) {
  router.get('/book/:id/:ownerId', (req, res) => {
    Users.findOne({_id: req.params.ownerId})
    .then(user => {
      res.render('book', {User: req.user, Book: user.books.id(req.params.id)})
    })
    .catch( err => {
      console.log(err)
      res.render('error')
    })
  })

  router.post('/book/request-borrow/:id/:groupId/:ownerId', (req, res) => {
    let findBook = Users.findOne({_id: req.params.ownerId})
    .then(user => {
      return user.books.id(req.params.id)
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
      //check if group was found
      if(!group) throw new BorrowException('Group was not found')
      //check if user is inside the group
      if(group.users.length < 1) throw new BorrowException('User does not belong to the group')
      //check if the book belongs to the group
      if(!book.group._id.equals(group._id)) throw new BorrowException('Book does not belong to the group')
      //check if the book is being borrowed
      if(book.borrower) throw new BorrowException('Book is already being borrowed')
      //check for duplicate borrow request
      //send a new borrow request
      let newrequest = {
        _id: mongoose.Types.ObjectId(),
        user: {_id: req.user._id, username: req.user.username},
        book: {_id: book._id, title: book.title, author: book.author},
        group: {_id: group._id, name: group.name}
      }
      Users.findOne({_id: book.owner._id})
      .then(owner => {
        owner.borrowRequests.push(newrequest)
        owner.save()
        res.redirect(`/book/${book._id}/${book.owner._id}`)
      })
    })
    .catch(err => {
      if(err.name == 'Borrow Exception') return res.redirect('/dashboard')
      console.log(err)
      res.render('error')
    })
  })

  router.post('/book/return/:id/:ownerId/:borrowerId', (req ,res) => {
    let findOwner = Users.findOne({_id: req.params.ownerId})
    let findBorrower = Users.findOne({_id: req.params.borrowerId})

    Promise.all([findOwner, findBorrower])
    .then(data => {
      let owner = data[0]
      let borrower = data[1]
      let book = owner.books.id(req.params.id)
      //Check that the book is being borrowed
      if(!book.borrower) throw new ReturnException('Book is not being borrowed')
      //Check borrower
      if(!req.user._id.equals(req.params.borrowerId)) throw new ReturnException('Not the borrower')
      let returnRequest = {
        _id: mongoose.Types.ObjectId(),
        book: {_id: book._id, title: book.title, author: book.author, owner:{_id: owner._id, username: owner.username}},
        borrower: {_id: borrower._id, username: borrower.username}
      }
      owner.bookReturns.push(returnRequest)
      owner.save()
      .catch(err => console.log(err))
      res.redirect('/dashboard')
    })
    .catch(err => {
      if(err.name == 'Return Exception') return res.redirect(`/book/${req.params.id}/${re.params.ownerId}`)
      console.log(err)
      res.render('error')
    })
  })
}

//Custom errors
function BorrowException(msg) {
  this.msg = msg
  this.name = 'Borrow Exception'
}

function ReturnException(msg) {
  this.msg = msg
  this.name = 'Return Exception'
}
