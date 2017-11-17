const mongoose = require('mongoose')
const {Groups, Users} = require('../models/users.js')
const users = require('express').Router()
const group = require('express').Router()
const passport = require('passport')

mongoose.Promise = global.Promise

//Custom errors
function GroupException(msg) {
    this.name = 'Group Exception'
    this.msg = msg
}

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
function isLoggedIn(req, res, next) {
    if(!req.user) return res.send('protected endpoint')
    next()
}

//---------   Matches /user   ---------
users.get('/:id', (req, res) => {
    //populate the user
    Users.findOne({_id: req.params.id})
    .populate('groups invites')
    .then(user => {
        if(!user) return res.send(JSON.stringify({error: 'User does not exist'}))
        //If client only wants users books
        //Matches /user/:id?book=all
        if(req.query.book === 'all') return res.send(JSON.stringify({books: user.books}))
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
            //If client only wants the groups
            //matches /user/id?group=all
            if(req.query.group === 'all') return res.send(JSON.stringify({groups: userGroups}))

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
            //send client modified user object
            return res.send(JSON.stringify({user: populatedUser}))
        })
    })
})
users.post('/group-invite/accept', (req, res) => {
    Groups.findOne({_id: req.body.id})
    .then((group) => {
        //Check if the user is already in the group
        const isUserAlreadyInGroup = group.users.find((id) => id.equals(req.user._id))
        const userContainsGroup = req.user.groups.find((id) => id.equals(group._id))
        if(!group) throw 'Group does not exist'
        if(userContainsGroup && !isUserAlreadyInGroup) throw new databaseException('User contains group, but group does not contain the user')
        if(isUserAlreadyInGroup && !userContainsGroup) throw new databaseException('Group contains the user, but the user does not contain the group')
        if(isUserAlreadyInGroup && userContainsGroup) throw 'User is already inside the group'
        group.users.push(req.user._id)
        group.save()
        //remove invite
        req.user.invites.remove(req.body.id)
        req.user.groups.push(group._id)
        return req.user.save()
    })
    .then(() => res.send(JSON.stringify({error: null, uri: `/group/${req.body.id}`})))
    .catch((err) => {
        if(err == 'User is already inside the group') {
            req.user.invites.remove(req.body.id)
            req.user.save()
            return res.send('/dashboard')
        }else if(err.msg == 'Group contains the user, but the user does not contain the group') {
            //Group has user use doesn't have the group
            //save the group to the user
            req.user.groups.push(req.body.id)
            req.user.save()
            res.send(`/group/${req.body.id}`)
        }else if(err.msg == 'User contains group, but group does not contain the user') {
            //The user contains the group, but the group does not have the user
            //save the user to the group then redirect to the group
            Groups.update({_id: req.body.id}, {$push: {users: req.user._id}})
            .then(() => {
                req.user.invites.remove(req.body.id)
                req.user.save()
                res.send(`/group/${req.body.id}`)
            })
        }else if(err == 'Group does not exist') {
            req.user.invites.remove(req.body.id)
            req.user.save()
            res.send('/dashboard')
        }else {
            console.log(err)
            res.render('error')
        }
    })
})
users.post('/signout', (req, res) => {
    req.logout()
    res.send(JSON.stringify({error: null, loggedOut: true}))
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
users.post('/collection/add', (req, res) => {
    req.body.title = req.body.title.split(' ').join('')
    req.body.author = req.body.author.split(' ').join('')
    //check that the title and author are not empty
    if(req.body.title.length < 1 || req.body.author.length < 1) return res.send(JSON.stringify({error: 'Invalid book title or author'}))
    //add a new book to user then save
    req.user.books.push({
        owner: {_id: req.user._id, username: req.user.username},
        title: req.body.title,
        author: req.body.author,
        description: req.body.description,
        group: null
    })
    req.user.save()
    return res.send(JSON.stringify({error: null}))
})
//---------   Matches /group   ---------
//return group info
group.use(isLoggedIn)

group.post('/new', (req, res) => {
    let gId
    //remove whitespace
    req.body.name = req.body.name.split(' ').join('')
    //Check that the group name is atleast 3 character long
    if(req.body.name.length < 3) return res.send(JSON.stringify({error: 'Name must be atleast 3 characters'}))
    //Create new group
    return Groups.create({
        name: req.body.name,
        users: [req.user._id]
    })
    .then((group) => {
        //save group to user
        gId = group._id
        req.user.groups.push(group)
        return req.user.save()
    })
    .then(() => {
        return res.send(JSON.stringify({error: null, uri: `/group/${gId}`}))
    })
    .catch((err) => {
        console.log(err)
        //Handle error
        res.send('something went wrong')
    })
})

group.get('/:id', (req, res) => {
    Groups.findOne({_id: req.params.id})
    .populate('users')
    .then((group) => {
        //check if user is inside the group
        const match_user = group.users.find(usr => usr._id.equals(req.user._id))
        //check if user has group
        const match_group = req.user.groups.find(id => id.equals(group._id))

        if(!match_group && match_user) throw new GroupException('Database inconsistency, group has user, user does not have group')
        if(!match_user) throw new GroupException('The user does not belong to the group')
        //User books is a subdoc cannot populate instead go through each user and match the books to the group
        const books = []
        //If the id is inside the group push to books array
        //For performance convert array of ids to object then match user.book.group_id to the object
        const book_matches = {}
        group.books.forEach((id) => book_matches[id] = true)
        group.users.forEach((usr) => usr.books.forEach((book) => {
            if(book_matches[book._id]) books.push(book)
        }))

        const modifiedGroup = {
            _id: group._id,
            name: group.name,
            users: [],
            books: books
        }
        group.users.forEach((user) => {
            const userObj = {_id: user._id, username: user.username}
            modifiedGroup.users.push(userObj)
        })

        res.send(JSON.stringify({group: modifiedGroup}))
    })
    .catch((err) => {
        if(err.msg == 'The user does not belong to the group') {
            //Check for database inconsistency
            const match = req.user.groups.find(id => id.equals(req.params.id))
            if(match) {
                //User contains group, but group does not contain user
                //Remove the group from the user
                req.user.groups.remove(req.params.id)
                req.user.save()
                res.redirect('/dashboard')
            }else {
                //User does not belong to the group redirect to dashboard
                res.send('redirect to dashboard')
            }
        }else if(err.msg == 'Database inconsistency, user has group, group does not have user') {
            //User does not conatin the group, but group contains the user
            req.user.groups.push(req.params.id)
            req.user.save()
            //Redirect to this route with updated user
            res.send('find a way to redirect from server')
        }else {
            console.log(err)
            res.send('something went wrong')
        }
    })
})


group.post('/:id/send-invite', (req, res) => {

    req.body.username = req.body.username.split(' ').join('')

    Groups.findOne({_id: req.params.id})
    .then((group) => {
        //check if group exists
        if(!group) throw new GroupException('The group does not exist')
        //Check if the inviter is inside the group
        const match_inviter = group.users.find((id) => id.equals(req.user._id))
        if(!match_inviter) throw new GroupException('The inviter does not belong to the group')
        return Users.findOne({username: req.body.username})
        .then((user) => {
            //Check if invited user exists
            if(!user) throw new GroupException('The invited user does not exist')
            //Check if the invited user is already inside the group
            const match_invited_user = group.users.find((id) => id.equals(user._id))
            if(match_invited_user) throw new GroupException('Invited user is already inside the group')
            user.invites.push(group._id)
            return user.save()
        })
    })
    .then(() => {
        res.send(JSON.stringify({error: null}))
    })
    .catch((err) => {
        if(err.msg == 'The group does not exist' || err.msg == 'The inviter does not belong to the group' || err.msg == 'Invited user is already inside the group' || err.msg == 'The invited user does not exist') {
            res.send(JSON.stringify({error: err.msg}))
        }else {
            console.log(err)
            res.send('something went wrong')
        }
    })
    group.post('/:id/:bookId', (req, res) => {
        const findGroup = Groups.findOne({_id: req.params.id}).populate('users', 'books')
        const getBook = req.user.books.id(req.params.bookId)

        Promise.all([
            findGroup,
            getBook
        ])
        .then(data => {
            const group = data[0]
            const book = data[1]
            const match_book = group.books.find((id) => id.equals(book._id))

            //Find the book
            return Users.findOne({_id: book.owner._id})
            .then(user => {

                //check if book exists
                if(!book) throw new GroupException('The book does not exist')
                //check if book is already in a group
                if(book.group && !match_book) throw new GroupException('Book is already inside a group')
                if(match_book) throw new GroupException('The book is already inside the group')
                //add group info to book
                book.group = {_id: group._id, name: group.name}
                //save the updated book info
                req.user.save()
                //push the book to group
                group.books.push(book._id)

                //Re populate books array
                const books = []
                //If the id is inside the group push to books array
                //For performance convert array of ids to object then match user.book.group_id to the object
                const book_matches = {}
                group.books.forEach((id) => book_matches[id] = true)
                group.users.forEach(usr => usr.books.forEach((bk) => {
                    if(book_matches[bk._id]) books.push(bk)
                }))
                //save the group
                group.save()
                //send the updated books array
                res.send(JSON.stringify({groupBooks: books, userBooks: req.user.books}))
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
                        res.sned('some error happened need to redirect you')
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
                    res.send('book doesnt exist need to redirect')
                }else {
                    console.log(err)
                    res.send('error')
                }
            })
        })
        .catch(err => console.log(err))
    })
})

module.exports = {users, group}
