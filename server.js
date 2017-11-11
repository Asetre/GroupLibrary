const express = require('express')
const app = express()
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const path = require('path')
const router = express.Router()

const {Users} = require('./models/users')

mongoose.Promise = global.Promise
//Use global promise instead of mongoose promise

//load config information
const {PORT, DatabaseURL} = require('./config/config')

//Make views folder accessible
app.use(express.static(path.join(__dirname, 'public')));
//Middleware
app.use(bodyParser.urlencoded({extended: false}))

//restful routes
const {users} = require('./routes/restful-routes.js')


router.use('/users', users)

//React app
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'))
})
//Routes

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
