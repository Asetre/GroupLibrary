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
app.use(bodyParser.urlencoded({extended: false}))
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
//Signedout user routes
require('./routes/signedout-routes')(router, passport)
//Group routes
require('./routes/group-routes')(router)
//User collection routes
require('./routes/user-collection-routes')(router)
//User and dashboard routes
require('./routes/user-dash')(router)
//Book and book request routes
require('./routes/book-requests')(router)
//User accept and reject routes
require('./routes/user-accept-reject')(router)

//check if user is logged in
function isLoggedIn(req, res, next) {
    //only check if in a protected route
    const path = req.path
    if(path == '/' || path == '/login' || path == '/signup' || path == '/forgot' || path == '/resetpass' || path == '/sendusername') return next()
    if(!req.user) return res.redirect('/login')
    next()
}

//Save running app into variable
var server
//run server
function runServer(port=PORT, databaseUrl=DatabaseURL) {
    const connectDb = mongoose.connect(databaseUrl, {useMongoClient: true})
    connectDb.then(() => {
        server = app.listen(port, function() {
            console.log(`App is listening on port ${port}`)
        })
    })
        .catch((err) => {
            console.log(err)
            mongoose.disconnect()
        })
}
//close Server
function closeServer() {
    return mongoose.disconnect(function() {
    //Closing server
        server.close()
    })
}

if(require.main === module) runServer()
//run the server

module.exports = {app, runServer, closeServer}
//export for testing purposes
