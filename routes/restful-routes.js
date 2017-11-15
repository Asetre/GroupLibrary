const mongoose = require('mongoose')
const {Groups, Users} = require('../models/users.js')
const users = require('express').Router()
const group = require('express').Router()

mongoose.Promise = global.Promise

function checkCredentials(req, res, next) {
    //Check to see if user information meets requirements
    req.body.email = req.body.email.split(' ').join('').toLowerCase()
    req.body.username = req.body.username.split(' ').join('')
    req.body.password = req.body.password.split(' ').join('')

    if(req.body.password.length < 6) {
        return res.send(JSON.stringify({error: 'Password must be atleast 6 characters long'}))
    }else if(req.body.username.length < 4) {
        return res.send(JSON.stringify({error: 'Username must be atleast 4 characters long'}))
    }
    next()
}

//---------   Matches /user   ---------
users.get('/:id', (req, res) => {
})
users.post('/login', (req, res) => {
    req.body.username = req.body.username.split(' ').join('')
    req.body.password = req.body.password.split(' ').join('')

    Users.findOne({username: req.body.username})
    .populate('groups invites')
    .then(user => {
        //Check if user exists
        if(!user) return res.send(JSON.stringify({error: 'User does not exist'}))
        //Check if correct password
        if(user.validPassword(req.body.password)) {
            //Find each borrowed book
            const arr = []
            user.borrowedBooks.forEach((id) => {
                //Find each book by id and push the information into the array
                arr.push(Users.findOne({'books._id': id})
                .then((owner) => owner.books.id(id)))
            })
            return Promise.all(arr)
            .then((data) => {
                //mutate user group for client
                let userGroups = []
                user.groups.forEach(group => {
                    let clientGroup = {
                        _id: group._id,
                        name: group.name,
                        books: group.books.length,
                        users: group.users.length
                    }
                    userGroups.push(clientGroup)
                })
                //mutate user invites for client
                let userInvites = []
                user.invites.forEach(invite => {
                    let clientInvite = {
                        _id: invite._id,
                        name: invite.name
                    }
                    userInvites.push(clientInvite)
                })

                //mutate user for client
                const populatedUser = {
                    _id: user._id,
                    username: user.username,
                    groups: userGroups,
                    books: user.books,
                    invites: userInvites,
                    borrowedBooks: data,
                    bookReturns: user.bookReturns,
                    borrowRequests: user.borrowRequests
                }
                return res.send(JSON.stringify({user: populatedUser}))
            })
        }else {
            return res.send(JSON.stringify({error: 'Incorrect password'}))
        }
        //Should not get here
        throw new Error('something went wrong')
    })
    .catch(err => {
        console.log(err)
        //Handle error
    })
})
users.post('/signup', checkCredentials, (req, res) => {
    //New user object
    const newUser = new Users({
        username: req.body.username,
        email: req.body.email,
        password: Users.hashPassword(req.body.password)
    })
    //Attempt to save user
    newUser.save()
    .then((user) => {
        res.send(JSON.stringify({user: user}))
    })
    .catch(err => {
        //User failed to pass validation
        if(err.name === 'ValidationError') {
            if(err.errors.username) {
                res.send(JSON.stringify({error: 'Username is already in use'}))
            }else if(err.errors.email) {
                res.send(JSON.stringify({error: 'Email is already in use'}))
            }
        }else {
            console.log(err)
            //Handle error
        }
    })
})
//---------   Matches /group   ---------
//return group info
group.get('/:id', (req, res) => {
    Groups.findOne({_id: req.params.id}, (err, group) => {
        if(err) return res.status(400).send('Something went wrong')
        if(!group) return res.status(400).send(JSON.stringify({error: 'Groups was not found'}))
        return res.send(JSON.stringify({group: group}))
    })
})

module.exports = {users, group}
