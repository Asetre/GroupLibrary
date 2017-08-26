const express = require('express')
const app = express()
const mongoose = require('mongoose')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const session = require('express-session')

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
            if (!user) return done(null, false, { message: 'Incorrect username.'})
            if (!user.validPassword(password)) return done(null, false, { message: 'Incorrect password.'})
            return done(null, user)
        })
    }
))

//Middleware
app.use(cookieParser())
app.use(bodyParser.urlencoded(bodyParser.urlencoded({extended:true})))
app.use(session({ 
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}))
app.use(passport.initialize())
app.use(passport.session())

passport.serializeUser(function(user, done) {
    done(null, user.id)
})

passport.deserializeUser(function(id, done) {
    Users.findById(id, function(err, user) {
        done(err, user)
    })
})


//Routes
require('./routes/routes')(app, passport)
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
