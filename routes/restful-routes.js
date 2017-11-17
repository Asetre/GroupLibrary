const mongoose = require('mongoose')
const {Groups, Users} = require('../models/users.js')
const users = require('express').Router()
const group = require('express').Router()
const passport = require('passport')

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
users.post('/login', (req, res, next) => {
    //remove whitespace
    req.body.username = req.body.username.split(' ').join('')
    req.body.password = req.body.password.split(' ').join('')

    passport.authenticate('local', function(err, user, info) {
        //Handle error better
        if(err) return console.log(err)
        if(!user) return res.send(JSON.stringify({error: 'Invalid username or password'}))
        req.login(user, (err) => {
            if(err) return console.log(err)

            //populate user
            Users.findOne({username: req.body.username})
            .populate('groups invites')
            .then(user => {
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
    })(req, res, next)

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

group.post('/:id/:bookId', (req, res) => {
    const findGroup = Groups.findOne({_id: req.params.id})
    const getBook = req.user.books.id(req.params.bookId)

    Promise.all([
        findGroup,
        getBook
    ])
    .then(data => {
        return Users.findOne({_id: book.owner._id})
        .then(user => {
            const group = data[0]
            const book = data[1]
            const match_book = group.books.find((id) => id.equals(book._id))

            //check if book exists
            if(!book) throw new GroupException('The book does not exist')
            //check if book is already in a group
            if(book.group && !match_book) throw new GroupException('Book is already inside a group')
            if(match_book) throw new GroupException('The book is already inside the group')
            //add group info to book
            book.group = {_id: group._id, name: group.name}
            //save the updated book info
            req.user.save()
            //save the book to group
            group.books.push(book._id)
            return group.save()
        })
        .catch((err) => {
            //Database inconsistency group contains book, but book does not have the group
            if(err.msg == 'The book is already inside the group') {
                const findUser = Users.findOne({_id: req.user._id})
                const findGroup = Groups.findOne({_id: req.params.id})
                Promise.all([
                    findUser,
                    findGroup
                ])
                .then((data) => {
                    const user = data[0]
                    const book = user.books.id(req.params.bookId)
                    const group = data[1]

                    //Save the group to the book
                    book.group = {_id: group._id, name: group.name}
                    user.save()
                    res.redirect(`/group/${group._id}`)
                })
            }else if(err.msg == 'Book is already inside a group') {
                //check if book contains the group, group does not
                const findUser = Users.findOne({_id: req.user._id})
                const findGroup = Groups.findOne({_id: req.params.id})
                Promise.all([
                    findUser,
                    findGroup
                ])
                .then((data) => {
                    const user = data[0]
                    const book = user.books.id(req.params.bookId)
                    const group = data[1]
                    const check = group.books.find((id) => id.equals(req.params.bookId))
                    //Database inconsistency book contains group but group does not have the book
                    if(book.group._id.equals(group._id) && !check) {
                        //Save the book to the group
                        group.books.push(book._id)
                        group.save()
                    }
                    res.redirect(`/group/${group._id}`)
                })
            }else if(err.msg == 'The book does not exist') {
                res.redirect('/dashboard')
            }else {
                console.log(err)
                res.render('error')
            }
        })
    })
    .then(() => {
        //redirect to the group
        res.redirect(`/group/${req.params.id}`)
    })
})

module.exports = {users, group}
