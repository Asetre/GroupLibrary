const {Users, Groups} = require('../models/users')
const mongoose = require('mongoose')

module.exports = function(router) {
  router.get('/group/:id', (req, res) => {
    //check if user is inside the group
    Groups.findOne({_id: req.params.id})
    .populate({
      path: 'users',
      match: {_id: req.user._id}
    })
    .then(group =>{
      Groups.findOne({_id: req.params.id})
      .populate('users')
      .then(groupAfter => {
        //if user is inside the group render group
        if(group.users.length > 0) {
          //Get the books that belong to this group
          let books = []
          let obj = {}
          groupAfter.books.forEach(id => {
            obj[id] = true;
          })
          groupAfter.users.forEach(user => {
            user.books.forEach(book => {
              if(obj[book._id]) books.push(book)
            })
          })
          res.render('group', {Group: groupAfter, User: req.user, Books: books})
        } else {
          //user was not inside group send back to dashboard
          res.redirect('/dashboard')
        }
      })
    })
    .catch(err => {
      console.log(err)
      res.render('error')
    })
  })

  router.post('/group/new', (req, res) => {
    //Check that the group name is atleast 1 character long
    if(req.body.name.length < 1) return res.redirect('/dashboard')
    //Create new group
    Groups.create({
      name: req.body.name
    })
    .then(group => {
      //save user to group
      group.users.push(req.user)
      group.save()
      //save group to user
      req.user.groups.push(group)
      req.user.save()
      res.redirect(`/group/${group._id}`)
    })
    .catch(err => {
      console.log(err)
      res.render('error')
    })
  })

  router.post('/group/leave/:id', (req, res) => {
    //remove user from group
    let removeFromGroup = Groups.update({_id: req.params.id}, {$pull: {users: req.user._id}})
    //remove group from user
    let removeFromUser = Users.update({_id: req.user._id}, {$pull: {groups: req.params.id}})

    Promise.all([removeFromGroup, removeFromUser])
    .then(() => {
      res.redirect('/dashboard')
    })
    .catch(err => {
      console.log(err)
      res.render('error')
    })
  })

  router.post('/group/send-invite/:id', (req, res) => {
    //find the group and check if inviter is inside the group
    Groups.findOne({_id: req.params.id})
    .populate({
      path: 'users',
    })
    .then(group => {
      //If group does not exist
      if(!group)return res.redirect('/dashboard')
      //if the inviter is inside the group send invite
      if(group.users.length > 0) {
        //Find the invited user and save group id to invites array
        return Users.findOne({username: req.body.username})
        .then(user => {
          user.invites.push(group._id)
          user.save()

          res.redirect('/dashboard')
        })
      }else {
        //inviter was not inside group
        res.redirect('/dashboard')
      }
    })
    .catch(err => {
      console.log(err)
      res.render('error')
    })
  })

  router.post('/group/book/add/:id/:bookId', (req, res) => {
    let findGroup = Groups.findOne({_id: req.params.id})
    let getBook = req.user.books.id(req.params.bookId)

    Promise.all([findGroup, getBook])
    .then(data => {
      let group = data[0]
      let book = data[1]

      //check if book is already in a group
      if(!book.group) {
        //add group info to book
        book.group = {_id: group._id, name: group.name}
        //save the updated book info
        req.user.save()
        //save the book to group
        group.books.push(book._id)
        group.save()
        //redirect to the group
        res.redirect(`/group/${req.params.groupId}`)
      }
    })
    .catch(err => {
      console.log(err)
      res.render('error')
    })
  })

  router.post('/group/book/remove/:id/:bookId', (req, res) => {
    Groups.findOne({_id: req.params.groupId})
    .then( group => {
      //if book was found remove from group
      group.books.remove(req.params.bookId)
      group.save()
      //remove group from book
      req.user.books.id(req.params.bookId).group = null
      req.user.save()
      res.redirect('/dashboard')
    })
  })
}
