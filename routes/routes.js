const {Groups, Users, Books} = require('../models/users')
const mongoose = require('mongoose')

mongoose.Promise = global.Promise

module.exports = function(app, passport) {

  //Root route
  app.get('/', (req, res) => {
    res.render('index', {User: false})
  });

  //login route
  app.get('/login', (req, res) => {
    res.render('login')
  })

  app.post('/login', passport.authenticate('local', {successRedirect: '/dashboard', failureRedirect: '/login', failureFlash: true}), (req, res) => {
    res.status(200)
    res.redirect('/dashboard')
  });

  //signup route
  app.get('/signup', (req, res) => {
    res.render('signup')
  })

  app.post('/signup', (req, res) => {
    let findUser = Users.findOne({username: req.body.username.toLowerCase()}) 
    let findEmail = Users.findOne({email: req.body.email.toLowerCase()})

    //first check if unique username and email
    Promise.all([findUser, findEmail])
      .then(data => {
        try {
          if(!data[0] && !data[1]) {
            //create new user
            let newUser = new Users({username: req.body.username.toLowerCase(), password: Users.hashPassword(req.body.password), email: req.body.email.toLowerCase() })
            newUser.save((err, user) => {
              if(err) return err
              //redirect on success
              req.login(user, err => {
                if(err) return err
                res.redirect('/dashboard')
              })
            })
          }else if(data[0]) {
            throw 'Username is in use'
          }else if(data[1]) {
            throw 'Email is in use'
          }
        } catch(err) {
          res.status(500)
          res.send(err)
          console.log(err)
          //do something
        }
      })
  })
  //dashboard route
  app.get('/dashboard', isLoggedIn,(req, res) => {
    //find a better way to display invite info
    Users.findOne({_id: req.user._id})
    .populate({
      path: 'groups invites'
    })
    .then(user => {
      res.status(200)
      res.render('dashboard', {User: user})
    })
  })

  //Create a new group
  app.post('/new-group', isLoggedIn, (req, res)=> {
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

      res.status(201)
      res.redirect(`/group/${group._id}`)
      })
  })

  //Leave group
  app.post('/leave-group/:groupId', isLoggedIn, (req, res) => {
    //remove user from group
    let removeFromGroup = Groups.findOne({_id: req.params.groupId})
    .then(group => {
      group.users.remove(req.user._id)
      group.save()
    })

    //remove group from user
    let removeFromUser =Users.findOne({_id: req.user._id})
    .then(user => {
      user.groups.remove(req.params.groupId)
      user.save()
    })

    Promise.all([removeFromGroup, removeFromUser])
    .then(() => {
      res.status(200)
      res.redirect('/dashboard')
    })
    .catch(err => console.log(err))

  })

  //go to group
  app.get('/group/:id', isLoggedIn, (req, res) =>{
    //check if user is inside the group
    Users.findOne({_id: req.user._id})
    .populate({
      path: 'groups',
      match: {_id: req.params.id}
    })
    .then(user =>{
      //if user is inside the group render group
      if(user.groups.length > 0) {
        res.render('group', {Group: user.groups[0], User: req.user})
      } else {
        //user was not inside group send back to dashboard
        res.status(403)
        res.redirect('/dashboard')
      }
    })
    .catch(err => {
      //do something
      console.log(err)
    })
  })

  //send group invite route
  app.post('/send-group-invite/:groupId', isLoggedIn, (req, res) => {
    //find the group and check if inviter is inside the group
    Groups.findOne({_id: req.params.groupId})
    .populate({
      path: 'users',
    })
    .then(group => {
      //if the inviter is inside the group send invite
      if(group.users.length > 0) {
        //Find the invited user and save group id to invites array
        Users.findOne({username: req.body.username})
        .then(user => {
          user.invites.push(group._id)
          user.save()

          res.status(200)
          res.end()
        })      
      }else {
          //inviter was not inside group
          res.redirect('/dashboard')
        }

    })
    .catch(err => console.log(err))
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
  })

  //decline group invite route
  app.post('/decline-group-invite/:groupId', isLoggedIn, (req, res) => {
    //Remove invite from user invites array
    req.user.invites.remove(req.params.groupId)
    req.user.save()
    res.end()
  })

  //add a book to group route
  app.post('/add-book-to-group/:bookId/:groupId', isLoggedIn, (req, res) => {
    let findGroup = Groups.findOne({_id: req.params.groupId})
    let getBook = req.user.books.id(req.params.bookId)

    Promise.all([findGroup, getBook])
      .then(data => {
        let group = data[0]
        let book = data[1]

        //check if book is already in a group
        if(!book.group) {
          //add group info to book
          book.group = {id: group._id, name: group.name}
          //save the updated book info
          req.user.save()

          //save the book to group
          group.books.push(book)
          group.save()

          res.status(200)
          //redirect to the group
          res.redirect(`/group/${req.params.groupId}`)
        }
      })
      .catch(err => console.log(err))
  })
  //remove a book from group route
  app.post('/remove-book-from-group/:bookId/:groupId', isLoggedIn, (req, res) => {
    //find the book inside the group
    Groups.findOne({_id: req.params.groupId})
    .populate({
      path: 'books',
      match: {_id: req.params.bookId}
    })
    .then( group => {
      //if book was found remove from group
      if(group.books.length > 0) {
        group.books.remove(req.params.bookId)
        group.save()

        //remove group from book
        req.user.books.id(req.params.bookId).group = null
        req.user.save()
        res.end()
      }else {
        //book was not found inside the group
        res.end()
      }
    })
  })

  //user profile route
  app.get('/user/:id', isLoggedIn, (req, res) => {
    //render user profile
  })

  //add a book to user collection route 
  app.post('/add-book-to-collection', isLoggedIn, (req, res) => {
    //add a new book to user then save
    req.user.books.push({
      owner: {_id: req.user._id, name: req.user.username},
      title: req.body.title,
      author: req.body.author,
      description: req.body.description
    })
    req.user.save()
    res.status(200)
    res.end()
  })

  //remove a book from user collection route
  app.post('/remove-book-from-collection/:bookId', isLoggedIn, (req, res) => {
    //find the book then delete from array
    req.user.books.remove(req.params.bookId)
    req.user.save()
    res.end()
  })

  //book info route
  app.get('/book/:bookId/:ownerId', isLoggedIn, (req, res) => {
    Users.findOne({_id: req.params.ownerId})
    .then(user => {
      res.render('book', {User: req.user, Book: user.books.id(req.params.bookId)})
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
                  id: req.user._id,
                  username: req.user.username,
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
  app.post('/accept-borrow-request/:bookId/:borrowerId', isLoggedIn, (req, res) => {
    //Find the borrow request
    let findBorrower = Users.findOne({_id: req.params.borrowerId})
    let findOwner = Users.findOne({_id: req.user._id})

    Promise.all([findBorrower, findOwner])
    .then(data => {
      let borrower = data[0]
      let owner = data[1]
      let book =owner.books.id(req.params.bookId)

      //update the book
      book.borrower = borrower.username
      //remove the borrow request
      owner.borrowRequests.remove(borrowerId)
      owner.save()

      //add the book to borrowed books for borrower
      borrower.borrowedBooks.push(book)
      borrower.save()

      //redirect to dashboard
      res.redirect('/dashboard')
    })
  })

  app.post('/decline-book-request/:borrowerId', isLoggedIn, (req, res) => {
    //Find and remove the reques
    req.user.borrowRequests.remove(req.params.borrowerId)
    req.user.save()

    res.redirect('/dashboard')
  })


}

//check if user is logged in
function isLoggedIn(req, res, next) {
  if(!(req.user)) return res.redirect('/login')
  next()
}
