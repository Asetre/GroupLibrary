const {Users, Groups} = require('../models/users')
const mongoose = require('mongoose')

module.exports = function(router) {
  router.post('/group-invite/accept/:id', (req, res) => {
    Groups.findOne({_id: req.params.id})
    .then(group => {
      //Check if the user is already in the group
      let isUserAlreadyInGroup = group.users.find(id => id.equals(req.user._id))
      let userContainsGroup = req.user.groups.find(id => id.equals(group._id))
      if(!group) throw 'Group does not exist'
      if(userContainsGroup && !isUserAlreadyInGroup) throw new databaseException('User contains group, but group does not contain the user')
      if(isUserAlreadyInGroup && !userContainsGroup) throw new databaseException('Group contains the user, but the user does not contain the group')
      if(isUserAlreadyInGroup && userContainsGroup) throw 'User is already inside the group'
      group.users.push(req.user._id)
      group.save()
      //remove invite
      req.user.invites.remove(req.params.id)
      req.user.groups.push(group._id)
      return req.user.save()
    })
    .then(() => res.redirect(`/group/${req.params.id}`))
    .catch(err => {
      if(err == 'User is already inside the group') {
        req.user.invites.remove(req.params.id)
        req.user.save()
        return res.redirect('/dashboard')
      }else if(err.msg == 'Group contains the user, but the user does not contain the group') {
        //Group has user use doesn't have the group
        //save the group to the user
        req.user.groups.push(req.params.id)
        req.user.save()
        res.redirect(`/group/${req.params.id}`)
      }else if(err.msg == 'User contains group, but group does not contain the user') {
        //The user contains the group, but the group does not have the user
        //save the user to the group then redirect to the group
        Groups.update({_id: req.params.id}, {$push: {users: req.user._id}})
        .then(data => {
          req.user.invites.remove(req.params.id)
          req.user.save()
          res.redirect(`/group/${req.params.id}`)
        })
      }else if(err == 'Group does not exist'){
        req.user.invites.remove(req.params.id)
        req.user.save()
        res.redirect('/dashboard')
      }else {
        console.log(err)
        res.render('error')
      }
    })
  })

  router.post('/group-invite/decline/:id', (req, res) => {
    //Remove the invite
    req.user.invites.remove(req.params.id)
    req.user.save()
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
      if(!book) throw 'Book does not exist'
      if(!borrower) throw 'Borrower does not exist'
      if(book.borrower) throw 'Book is already being borrowed'
      //Update book
      book.borrower = borrower.username
      data[1].save()
      //Add book to borrower
      borrower.borrowedBooks.push(book._id)
      return borrower.save()
    })
    .then(() => {
      res.redirect('/dashboard')
    })
    .catch(err => {
      if(err == 'Book does not exist' || err == 'Borrower does not exist' || err == 'Book is already being borrowed') {
        console.log(err)
        res.redirect('/dashboard')
      }else {
        console.log(err)
        res.render('error')
      }
    })
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

      if(!book) throw 'Book does not exist'

      //Remove book borrower
      book.borrower = null
      //Remove book from borrower
      if(borrower) {
        borrower.borrowedBooks.remove(book._id)
        borrower.save()
      }
      return owner.save()
    })
    .then(() => res.redirect('/dashboard'))
    .catch(err => {
      if(err == 'Book does not exist') {
        res.redirect('/dashboard')
      }else {

        console.log(err)
        res.render('error')
      }
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

function databaseException(msg) {
  this.name = 'Database inconsistency'
  this.msg = msg
}
