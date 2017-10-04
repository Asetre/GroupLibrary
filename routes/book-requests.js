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

  router.post('/book/request-borrow/:id/:ownerId/:groupId', (req, res) => {
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
        book: {id: book._id, title: book.title, author: book.author},
        group: {id: group._id, name: group.name}
      }
      Users.findOne({_id: book.owner._id})
      .then(owner => {
        owner.borrowRequests.push(newrequest)
        owner.save()
        res.redirect(`/group/${group._id}`)
      })
    })
    .catch(err => {
      if(err.name == 'Borrow Exception') return res.redirect('/dashboard')
      console.log(err)
      res.render('error')
    })
  })
}

//Custom error
function BorrowException(msg) {
  this.msg = msg
  this.name = 'Borrow Exception'
}
