const express = require('express')
const app = express()
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const path = require('path')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const session = require('express-session')
const cookieParser = require('cookie-parser')
const {Users, userSchema, groupSchema} = require('./models/users.js')
const cron = require('cron-scheduler')

//load config information
const {PORT, DatabaseURL} = require('./config/config')

//Mongoose create connections
const connectDb = mongoose.connect(DatabaseURL, {useMongoClient: true})

function resetDemoAccount() {
}

//Use global promise instead of mongoose promise
mongoose.Promise = global.Promise

//passport config with local Strategy
passport.use(new LocalStrategy(
    (username, password, done) => {
        Users.findOne({ username: username}, function (err, user) {
            if (err) return done(err)
            if (!user) return done(null, false)
            if (!user.validPassword(password)) return done(null, false)
            return done(null, user)
        })
    }
))

passport.serializeUser(function(user, done) {
    done(null, user.id)
})

passport.deserializeUser(function(id, done) {
    Users.findById(id, function(err, user) {
        done(err, user)
    })
})

//Make views folder accessible
app.use(express.static(path.join(__dirname, 'public')));
//Middleware
app.use(bodyParser.json())
app.use(cookieParser())
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}))
app.use(passport.initialize())
app.use(passport.session())

//routes
const routes = require('./routes/routes.js')
app.use('/', routes)
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'))
})

//router.all('*', isLoggedIn)
////Signedout user routes
//require('./routes/signedout-routes')(router, passport)
////Group routes
//require('./routes/group-routes')(router)
////User collection routes
//require('./routes/user-collection-routes')(router)
////User and dashboard routes
//require('./routes/user-dash')(router)
////Book and book request routes
//require('./routes/book-requests')(router)
////User accept and reject routes
//require('./routes/user-accept-reject')(router)
//
////check if user is logged in
//function isLoggedIn(req, res, next) {
//    //only check if in a protected route
//    const path = req.path
//    if(path == '/' || path == '/login' || path == '/signup' || path == '/forgot' || path == '/resetpass' || path == '/sendusername' || path == '/demo') {
//        return next()
//    }
//    if(!req.user) return res.redirect('/login')
//    next()
//}

//Save running app into variable
var server
//run server

function runServer(port=PORT, databaseUrl=DatabaseURL) {
    Promise.all([connectDb])
    .then(() => {
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
