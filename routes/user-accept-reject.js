const {Users, Groups} = require('../models/users')
const mongoose = require('mongoose')

module.exports = function(router) {
  router.post('/group-invite/accept/:id', (req, res) => {
    Groups.findOne({_id: req.params.id})
    .populate({
      path: 'users',
      match: req.user._id
    })
    .then(group => {
      //Check if the user is already in the group
      if(group.users.length > 0) {
        req.user.invites.remove(req.params.id)
        req.user.save()
        return res.redirect('/dashboard')
      }
      //If not already in the group save user to group
      group.users.push(req.user._id)
      group.save()
      //remove invite
      req.user.invites.remove(req.params.id)
      req.user.save()
    })
    .then(() => res.redirect(`/group/${req.params.id}`))
    .catch(err => {
      console.log(err)
      res.render('error')
    })
  })

  router.post('/group-invite/decline/:id', (req, res) => {
    //Remove the invite
    req.user.invites.remove(req.params.id)
    req.save()
    res.redirect('/dashboard')
  })

  router.post('/borrow-request/accept/:bookId/:requestId/:borrowerId', (req, res) => {
    let findBorrower = Users.findOne({_id: req.params.borrowerId})
    //Remove the request
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

  router.post('/borrow-request/decline/:requestId', (req, res) => {
    //Find and remove the reques
    Users.findOneAndUpdate({_id: req.user._id}, {$pull: {borrowRequests: {_id: req.params.requestId}}},{safe: true, multi:true}).exec()
    .then(user => {
      res.redirect('/dashboard')
    })
    .catch(err => {
      console.log(err)
      req.render('error')
    })
  })

  router.post('/return-request/approve/:bookId/:borrowerId/:returnId', (req, res) => {
    let findOwner = Users.findOne({_id: req.user._id})
    let findBorrower = Users.findOne({_id: req.params.borrowerId})
    let removeReturn = Users.findOneAndUpdate({_id: req.user._id}, {$pull: {bookReturns: {_id: req.params.returnId}}},{safe:true,multi:true})

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
    .catch(err => {
      console.log(err)
      res.render('error')
    })
  })

  router.post('/return-request/reject/:returnId', (req, res) => {
    Users.findOneAndUpdate({_id: req.user._id}, {$pull: {bookReturns: {_id: req.params.returnId}}}, {safe:true,multi:true})
    .then(() => {
      res.redirect('/dashboard')
    })
    .catch(err => {
      console.log(err)
      res.render('error')
    })
  })
}
