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
    res.render('login', {User: null, errors: null})
  })

  app.post('/login', (req, res, next) => {
    //Use local authentication
    //If user is not found render the login view with errors
    //If login was successful redirect to the dashboard
    passport.authenticate('local', function(err, user, info) {
      if(err) return next(err)
      if(!user) return res.render('login', {User: null, errors: 'Invalid username or password'})
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

  app.get('/lostAccount', (req, res) => {
    res.render('lost', {User: null, errors: null})
  })

  //signup route
  app.get('/signup', (req, res) => {
    res.render('signup', {User: null, errors: null})
  })

  app.post('/signup', checkNewUser, (req, res) => {
    let newUser = new Users({
      username: req.body.username,
      email: req.body.email.toLowerCase(),
      password: Users.hashPassword(req.body.password)
    })

    newUser.save()
      .then(user =>{
        //Login and redirect after successful signup
        req.login(user, err => {
          if(err) return err
          res.redirect('/dashboard')
        })
      })
      .catch(err => {
        if(err.name === 'ValidationError') {
          //Username is already in use
          if(err.errors.username) {
            res.render('signup', {User: null, errors: 'Username is already in use'})
          }else if(err.errors.email) {
            //email is already in use
            res.render('signup', {User: null, errors: 'Email is already in use'})
          }
        }else {
          console.log(err)
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
              res.render('group', {Group: groupAfter, User: req.user})
            } else {
              //user was not inside group send back to dashboard
              res.redirect('/dashboard')
            }
          })
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
        console.log(err)
        res.status(500).send('Internal server error')
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
          res.redirect('/dashboard')
        }else {
          //book was not found inside the group
          res.redirect('/dashboard')
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
        _id: mongoose.Schema.Types.ObjectId(),
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
    })
    .catch(err => console.log(err))
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
  if(req.body.password.length < 6) {
    return res.render('signup', {User: null, errors: 'Password must be atleast 6 characters long'})
  }else if(req.body.username.length < 4) {
    return res.render('signup', {User: null, errors: 'Username must be atleast 4 characters long'})
  }
  next()
}
