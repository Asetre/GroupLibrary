const {Groups, Users, Books} = require('../models/users')
const mongoose = require('mongoose')
const nodemailer = require('nodemailer')

let transporter = nodemailer.createTransport({
  service: 'gmail',
  secure: false,
  port: 25,
  auth: {
    user: 'grouplibrarybot@gmail.com',
    pass: 'grouptest'
  },
  tls: {
    rejectUnauthorized: false
  }
})

mongoose.Promise = Promise

module.exports = function(app, passport) {

  //Root route
  app.get('/', (req, res) => {
    res.render('index', {User: false})
  });

  //login route
  app.get('/login', (req, res) => {
    res.render('login', {errors: null})
  })

  app.post('/login', (req, res, next) => {
    //Use local authentication
    //If user is not found render the login view with errors
    //If login was successful redirect to the dashboard
    passport.authenticate('local', function(err, user, info) {
        if(err) return next(err)
        if(!user) return res.render('login', {errors: 'Invalid username or password'})
        req.login(user, err => {
          if(err) return next(err)
          res.redirect('/dashboard')
        })
     })(req, res, next)
  }, (req, res) => {
    //Code here should not execute, but just incase
    if(!req.user) return res.redirect('/login', {errors: 'Failed to login please try again'})
    res.redirect('/dashboard')
  })

  app.post('/reset-password', (req, res) => {
    Users.findOne({email: req.body.email.toLowerCase()})
    .then(user => {
      //if user was not found redirect to login
      if(!user) return res.redirect('/login')
        //generate a password between first and second arguments
        let newPassword = getRandomInt(1000, 9999)

      //Email template setup
        let HelperOptions = {
          from: '"Group Library" <grouplibrarybot@gmail.com>',
          to: user.email,
          subject: 'Password Reset - DO NOT REPLY',
          html: `Hi ${user.username}, <br><br><br> Your password from Group Library has been reset.<br><br> Username: ${user.username}</br><br> Password: ${newPassword}`
        }

      //Send the email
        transporter.sendMail(HelperOptions, (err, info) => {
          if(err) return err
          //If the email is sent change the password
          //then redirect the user to login
            user.password = Users.hashPassword(newPassword)
            user.save()

            res.redirect('/login')
        })
        .catch(err => {
          //Database query error
          //Send error to client with message
          res.send(500, {message: 'An error has occured please try again'})
        })
    })
  })

  //signup route
  app.get('/signup', (req, res) => {
    res.render('signup', {errors: null})
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
            let newUser = new Users({username: req.body.username, password: Users.hashPassword(req.body.password), email: req.body.email.toLowerCase() })
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
          //If signup error return to signup page
          if(typeof err === 'string') {
            return res.render('signup', {errors: err})
          }
          //If server error send info
          res.status(500).send('Internal server error')
        }
      })
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
    .catch(err => {
      res.status(500).send('Internal server error')
    })
  })

  //Leave group
  app.post('/leave-group/:groupId', isLoggedIn, (req, res) => {
    //remove user from group
    let removeFromGroup = Groups.update({_id: req.params.groupId}, {$pull: {users: req.user._id}})

    //remove group from user
    let removeFromUser = Users.update({_id: req.user._id}, {$pull: {groups: req.params.groupId}})

    Promise.all([removeFromGroup, removeFromUser])
    .then(() => {
      res.redirect('/dashboard')
    })
    .catch(err => {
      console.log(err)
      res.status(500).send('Internal server error')
    })

  })

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
        res.redirect('/dashboard')
      }
    })
    .catch(err => {
      res.send(500, 'Internal server error, please try again')
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
      console.log('zero')

      //update the book
      book.borrower = borrower.username
      //remove the borrow request
      owner.borrowRequests.remove(req.params.borrowerId)
      owner.save()
      console.log('first')

      //add the book to borrowed books for borrower
      borrower.borrowedBooks.push(book)
      borrower.save()
      console.log('second')

      //redirect to dashboard
      res.redirect('/dashboard')
    }).catch(err => console.log(err))
  })

  app.post('/decline-book-request/:borrowerId', isLoggedIn, (req, res) => {
    //Find and remove the reques
    req.user.borrowRequests.remove(req.params.borrowerId)
    req.user.save()

    res.redirect('/dashboard')
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
