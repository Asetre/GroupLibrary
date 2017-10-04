const express = require('express')
const app = express()
const mongoose = require('mongoose')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const session = require('express-session')
const flash = require('connect-flash')
const router = express.Router()

const {Users} = require('./models/users')

mongoose.Promise = global.Promise
//Use global promise instead of mongoose promise

//load config information
const {PORT, DatabaseURL} = require('./config/config')

//set view engine to ejs
app.set('view engine', 'ejs')
//Make views folder accessible
app.set('views', __dirname+'/public/views')
app.use(express.static('public'))
//passport setup
passport.use(new LocalStrategy(
    function(username, password, done) {
        Users.findOne({ username: username}, function (err, user) {
            if (err) return done(err)
            if (!user) return done(null, false)
            if (!user.validPassword(password)) return done(null, false)
            return done(null, user)
        })
    }
))
//Middleware
app.use(cookieParser())
app.use(flash())
app.use(bodyParser.urlencoded({extended:false}))
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(router)

passport.serializeUser(function(user, done) {
    done(null, user.id)
})

passport.deserializeUser(function(id, done) {
    Users.findById(id, function(err, user) {
        done(err, user)
    })
})


//Routes
router.all('*', isLoggedIn)
require('./routes/routes')(app, passport)
//Signedout user routes
require('./routes/signedout-routes')(router, passport)
//Group routes
require('./routes/group-routes')(router, passport)

//check if user is logged in
function isLoggedIn(req, res, next) {
  let path = req.path
  if(path == '/' || path == '/login' || path == '/signup') return next()
  if(!(req.user)) return res.redirect('/login')
  next()
}

//Save running app into variable
var server
//run server
function runServer(port=PORT, databaseUrl=DatabaseURL) {
    mongoose.connect(databaseUrl)
    mongoose.connection
        .on('connected', function () {
            server = app.listen(port, function() {
                //console.log(`App is listening on port ${port}`)
            })
        })
        .on('error', function() {
            mongoose.disconnect()
        })
}
//close Server
function closeServer() {
    return mongoose.disconnect(function() {
        server.close()
    })
}

if(require.main === module) runServer()
//run the server

module.exports = {app, runServer, closeServer}
//export for testing purposes
