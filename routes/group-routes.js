const {Users, Groups} = require('../models/users')
const mongoose = require('mongoose')

module.exports = function(router) {
  router.get('/group/:id', (req, res) => {
    Groups.findOne({_id: req.params.id})
    .populate('users')
    .then(group => {
      //check if user is inside the group
      let match_user = group.users.find(usr => usr._id.equals(req.user._id))
      //check if user has group
      let match_group = req.user.groups.find(id => id.equals(group._id))

      if(!match_group && match_user) throw new GroupException('Database inconsistency, group has user, user does not have group')
      if(!match_user) throw new GroupException('The user does not belong to the group')
      //User books is a subdoc cannot populate instead go through each user and match the books to the group
      let books = []
      //If the id is inside the group push to books array
      //For performance convert array of ids to object then match user.book.group_id to the object
      let book_matches = {}
      group.books.forEach(id => book_matches[id] = true)
      group.users.forEach(usr => usr.books.forEach(book=> {if(book_matches[book._id]) books.push(book)}))

      let modifiedGroup = {
        _id: group._id,
        name: group.name,
        users: []
      }
      group.users.forEach(user => {
        let userObj = {_id: user._id, username: user.username}
        modifiedGroup.users.push(userObj)
      })

      res.render('group', {Group: modifiedGroup, User: req.user, Books: books})
    })
    .catch(err => {
      if(err.msg == 'The user does not belong to the group') {
        //Check for database inconsistency
        let match = req.user.groups.find(id => id.equals(req.params.id))
        if(match) {
          //User contains group, but group does not contain user
          //Remove the group from the user
          req.user.groups.remove(req.params.id)
          req.user.save()
          res.redirect('/dashboard')
        }else {
          //User does not belong to the group redirect to dashboard
          res.redirect('/dashboard')
        }
      }else if(err.msg == 'Database inconsistency, user has group, group does not have user'){
          //User does not conatin the group, but group contains the user
          req.user.groups.push(req.params.id)
          req.user.save()
          //Redirect to this route with updated user
          res.redirect(`/group/${req.params.id}`)
      }else {
        console.log(err)
        res.render('error')
      }
    })
  })

  router.post('/group/new', (req, res) => {
    let gId
    //Check that the group name is atleast 1 character long
    if(req.body.name.length < 1) return res.redirect('/dashboard')
    //Create new group
    Groups.create({
      name: req.body.name,
      users: [req.user._id]
    })
    .then(group => {
      //save group to user
      gId = group._id
      req.user.groups.push(group)
      return req.user.save()
    })
    .then(() => {
      res.redirect(`/group/${gId}`)
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
      return Groups.findOne({_id: req.params.id})
      .then(group => {
        if(group) {
          //create an array of bookids that belong to the group
          let arr = req.user.books.filter(book => {
            if(book.group){
              if(book.group._id.equals(group._id)) {
                //remove the group from the book
                book.group = null
                return book._id
              }
            }
          })
          //save the updated books
          req.user.save()
          return arr
        }
      })
    })
    .then(arr => {
      //Remove all user books inside the group
      if(arr.length > 0)return Groups.update({_id: req.params.id}, {$pull: {books: {$in: arr }}})
    })
    .then(() => {
      res.redirect('/dashboard')
    })
    .catch(err => {
      console.log(err)
      res.render('error')
    })
  })

  router.post('/group/send-invite/:id', (req, res) => {
    Groups.findOne({_id: req.params.id})
    .then(group => {
      //check if group exists
      if(!group) throw new GroupException('The group does not exist')
      //Check if the inviter is inside the group
      let match_inviter = group.users.find(id => id.equals(req.user._id))
      if(!match_inviter) throw new GroupException('The inviter does not belong to the group')
      return Users.findOne({username: req.body.username})
      .then(user => {
        //Check if the invited user is already inside the group
        let match_invited_user = group.users.find(id => id.equals(user._id))
        if(match_invited_user) throw new GroupException('Invited user is already inside the group')
        user.invites.push(group._id)
        return user.save()
      })
    })
    .then(() => {
      res.redirect(`/group/${req.params.id}`)
    })
    .catch(err => {
      if(err.msg == 'The group does not exist' || err.msg == 'The inviter does not belong to the group' || err.msg == 'Invited user is already inside the group'){
        res.redirect('/dashboard')
      }else {
        console.log(err)
        res.render('error')
      }
    })
  })

  router.post('/group/book/add/:id/:bookId', (req, res) => {
    let findGroup = Groups.findOne({_id: req.params.id})
    let getBook = req.user.books.id(req.params.bookId)

    Promise.all([findGroup, getBook])
    .then(data => {
      let group = data[0]
      let book = data[1]
      let match_book = group.books.find(id => id.equals(book._id))

      //check if book exists
      if(!book) throw new GroupException('The book does not exist')
      //check if book is already in a group
      if(book.group && !match_book) throw new GroupException('Book is already inside a group')
      if(match_book) throw new GroupException('The book is already inside the group')
      //add group info to book
      book.group = {_id: group._id, name: group.name}
      //save the updated book info
      req.user.save()
      //save the book to group
      group.books.push(book._id)
      return group.save()
    })
    .then(() => {
      //redirect to the group
      res.redirect(`/group/${req.params.id}`)
    })
    .catch(err => {
      //Database inconsistency group contains book, but book does not have the group
      if(err.msg == 'The book is already inside the group') {
        let findUser = Users.findOne({_id: req.user._id})
        let findGroup = Groups.findOne({_id: req.params.id})
        Promise.all([findUser, findGroup])
        .then(data => {
          let user = data[0]
          let book = user.books.id(req.params.bookId)
          let group = data[1]

          //Save the group to the book
          book.group = {_id: group._id, name: group.name}
          user.save()
          res.redirect(`/group/${group._id}`)
        })
      }else if(err.msg == 'Book is already inside a group') {
        //check if book contains the group, group does not
        let findUser = Users.findOne({_id: req.user._id})
        let findGroup = Groups.findOne({_id: req.params.id})
        Promise.all([findUser, findGroup])
        .then(data => {
          let user = data[0]
          let book = user.books.id(req.params.bookId)
          let group = data[1]
          let check = group.books.find(id => id.equals(req.params.bookId))
          //Database inconsistency book contains group but group does not have the book
          if(book.group._id.equals(group._id) && !check){
            //Save the book to the group
            group.books.push(book._id)
            group.save()
          }
          res.redirect(`/group/${group._id}`)
        })
      }else if(err.msg == 'The book does not exist'){
        res.redirect('/dashboard')
      }else {
        console.log(err)
        res.render('error')
      }
    })
  })

  router.post('/group/book/remove/:id/:bookId', (req, res) => {
    Groups.findOne({_id: req.params.id})
    .then( group => {
      if(!group) throw new GroupException('Group does not exist')
      if(!req.user.books.id(req.params.bookId)) throw new GroupException('Book does not exist in user collection')
      //Remove the group from the book first incase of Database inconsistency
      //remove group from book
      req.user.books.id(req.params.bookId).group = null
      //remove book from group
      group.books.remove(req.params.bookId)
      //Save after both removed
      group.save()
      req.user.save()
      res.redirect('/dashboard')
    })
    .catch(err => {
      //Check for database inconsistency
      if(err.msg == 'Group does not exist') {
        let book = req.user.books.id(req.params.bookId)
        if(book.group._id.equals(req.params.id) || book.group._id == req.params.id) {
        //book belongs to a non existent group
        //Update the book
        book.group = null
        req.user.save()
        res.redirect('/dashboard')
        }
      }else if(err.msg == 'Book does not exist in user collection'){
        //Check if the group contains a non existent book
        let contains_nonexistent_book = true
        Groups.findOne({_id: req.params.id})
        .populate('users')
        .then(group => {
          group.users.forEach(user => {
            let bookExists = user.books.find(book => {
              if(book._id == req.params.bookId) return book
            })
            if(bookExists) contains_nonexistent_book = false
          })

          if(contains_nonexistent_book) {
            group.remove(req.params.bookId)
            return group.save()
          }
        })
        .then(() => res.redirect('/dashboard'))
      }else {
        console.log(err)
        res.render('error')
      }
    })
  })
}

//Custom errors
function GroupException(msg) {
  this.name = 'Group Exception'
  this.msg = msg
}
