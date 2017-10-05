const {Users, Groups} = require('../models/users')
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

module.exports = function(router, passport) {
  //Landing Page
  router.get('/', (req, res) => {
    res.render('index', {User: false})
  })

  //Login Page
  router.route('/login')
  .get((req, res) => {
    res.render('login', {User: null, errors: null})
  })
  .post(checkLogin, (req, res) => {
    //Check login authenticates with passport and redirects
    //Code here should not execute, but just incase redirect to login
    res.redirect('/login')
  })

  router.get('/signout', (req, res) => {
    req.logout()
    res.redirect('/')
  })

  router.route('/signup')
  .get((req, res) => {
    res.render('signup', {User: null, errors: null})
  })
  .post(checkCredentials, (req, res) => {
    //New user object
    let newUser = new Users({
      username: req.body.username,
      email: req.body.email.toLowerCase(),
      password: Users.hashPassword(req.body.password)
    })

    //Attempt to save user
    newUser.save()
    .then(user =>{
      //Login and redirect after successful signup
      req.login(user, err => {
        if(err) return err
        res.redirect('/dashboard')
      })
    })
    .catch(err => {
      //User failed to pass validation
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
        res.render('error')
      }
    })
  })

  router.route('/resetpass')
  .get((req, res) => {
    //Need to do stuff
    res.send('Page under construction')
  })
  .post((req, res) => {
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

  function checkLogin(req, res, next) {
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
  }

  function checkCredentials(req, res, next) {
    //Check to see if user information meets requirements
    if(req.body.password.length < 6) {
      return res.render('signup', {User: null, errors: 'Password must be atleast 6 characters long'})
    }else if(req.body.username.length < 4) {
      return res.render('signup', {User: null, errors: 'Username must be atleast 4 characters long'})
    }
    next()
  }

  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
  }
}
