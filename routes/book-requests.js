const {Users, Groups} = require('../models/users')
const mongoose = require('mongoose')

module.exports = function(router) {
    router.get('/book/:id/:ownerId', (req, res) => {
        Users.findOne({_id: req.params.ownerId})
            .then((user) => {
                const book = user.books.id(req.params.id)
                //If book doesnt exist redirect to dashboard
                if(!book) return res.redirect('/dashboard')

                return res.render('book', {User: req.user, Book: book})
            })
            .catch((err) => {
                console.log(err)
                res.render('error')
            })
    })

    router.post('/book/request-borrow/:id/:groupId/:ownerId', (req, res) => {
        const findBook = Users.findOne({_id: req.params.ownerId})
            .then((user) => user.books.id(req.params.id))
        const findGroup = Groups.findOne({_id: req.params.groupId})
            .populate({
                path: 'users',
                match: {_id: req.user._id}
            })

        Promise.all([
            findBook,
            findGroup
        ])
            .then((data) => {
                const book = data[0]
                const group = data[1]
                //check if book exists
                if(!book) throw new BorrowException('The book no longer exists')
                //check if group was found
                if(!group) throw new BorrowException('Group was not found')
                //check if user is inside the group
                if(group.users.length < 1) throw new BorrowException('User does not belong to the group')
                //check if the book belongs to the group
                if(!book.group._id.equals(group._id)) throw new BorrowException('Book does not belong to the group')
                //check if the book is being borrowed
                if(book.borrower) throw new BorrowException('Book is already being borrowed')
                //send a new borrow request
                const newrequest = {
                    _id: mongoose.Types.ObjectId(),
                    user: {_id: req.user._id, username: req.user.username},
                    book: {_id: book._id, title: book.title, author: book.author},
                    group: {_id: group._id, name: group.name}
                }
                Users.findOne({_id: book.owner._id})
                    .then((owner) => {
                        owner.borrowRequests.push(newrequest)
                        owner.save()
                        res.redirect(`/group/${book.group._id}`)
                    })
            })
            .catch((err) => {
                if(err.name === 'Borrow Exception') return res.redirect('/dashboard')
                console.log(err)
                return res.render('error')
            })
    })

    router.post('/book/return/:id/:ownerId/:borrowerId', (req, res) => {
        const findOwner = Users.findOne({_id: req.params.ownerId})
        const findBorrower = Users.findOne({_id: req.params.borrowerId})

        Promise.all([
            findOwner,
            findBorrower
        ])
            .then((data) => {
                const owner = data[0]
                const borrower = data[1]
                const book = owner.books.id(req.params.id)
                //Check that the book is being borrowed
                if(!book.borrower) throw new ReturnException('Book is not being borrowed')
                //Check borrower
                if(!req.user._id.equals(req.params.borrowerId)) throw new ReturnException('Not the borrower')
                const returnRequest = {
                    _id: mongoose.Types.ObjectId(),
                    book: {_id: book._id, title: book.title, author: book.author, owner: {_id: owner._id, username: owner.username}},
                    borrower: {_id: borrower._id, username: borrower.username}
                }
                owner.bookReturns.push(returnRequest)
                owner.save()

                return res.redirect('/dashboard')
            })
            .catch((err) => {
                if(err.name == 'Return Exception') return res.redirect(`/book/${req.params.id}/${req.params.ownerId}`)
                console.log(err)
                res.render('error')
            })
    })
}

//Custom errors
function BorrowException(msg) {
    this.msg = msg
    this.name = 'Borrow Exception'
}

function ReturnException(msg) {
    this.msg = msg
    this.name = 'Return Exception'
}
