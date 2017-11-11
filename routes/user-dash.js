const {Users} = require('../models/users')

module.exports = function(router) {
    router.get('/dashboard', (req, res) => {
        Users.findOne({_id: req.user._id})
            .populate('groups invites', '_id name')
            .then((user) => {
                if(!user) return res.redirect('/login')
                const arr = []
                user.borrowedBooks.forEach((id) => {
                    arr.push(Users.findOne({'books._id': id})
                        .then((owner) => owner.books.id(id)))
                })

            })
            .catch((err) => {
                console.log(err)
                res.render('error')
            })
    })

    router.get('/user/:id', (req, res) => {
    //render user profile
        Users.findOne({_id: req.params.id})
            .then((user) => {
                if(!user) return res.redirect('/dashboard')
                let same = false;
                if(user._id.equals(req.user._id)) same = true;
                if(!same) {
                    const arr = []
                    user.borrowedBooks.forEach((id) => {
                        arr.push(Users.findOne({'books._id': id})
                            .then((owner) => owner.books.id(id)))
                    })
                    Promise.all(arr)
                        .then((data) => {
                            const populatedUser = {
                                _id: user._id,
                                username: user.username,
                                groups: user.groups,
                                books: user.books,
                                invites: user.invites,
                                borrowedBooks: data,
                                bookReturns: user.bookReturns,
                                borrowRequests: user.borrowRequests
                            }
                            res.render('user', {User: req.user, query: populatedUser, isSame: same, errors: null})
                        })
                }else res.render('user', {User: req.user, query: user, isSame: same, errors: null})
            })
            .catch((err) => {
                console.log(err)
                res.render('error')
            })
    })

    router.post('/user/update', (req, res) => {
        const checkPassword = new Promise((resolve, reject) => {
            if(req.body.newPass) {
                req.body.newPass.length < 6 ? reject('Password must be atleast 6 characters long') : resolve(req.body.newPass)
            }else resolve(null)
        })
        const checkEmail = Users.findOne({email: req.body.newEmail})

        Promise.all([
            checkPassword,
            checkEmail
        ])
            .then((data) => {
                if(data[1]) throw 'Email already in use'
                if(req.user.validPassword(req.body.password)) {
                    const newPass = Users.hashPassword(data[0])
                    if(newPass) req.user.password = newPass
                    if(req.body.newEmail && !data[1]) req.user.email = req.body.newEmail.replace(' ', '').toLowerCase()
                    return req.user.save()

                }throw 'Incorrect password'
            })
            .then(() => res.redirect(`/user/${req.user._id}`))
            .catch((err) => {
                if(err == 'Password must be atleast 6 characters long')res.render('user', {User: req.user, query: req.user, isSame: true, errors: err})
                else if(err == 'Email already in use')res.render('user', {User: req.user, query: req.user, isSame: true, errors: err})
                else if(err == 'Incorrect password')res.render('user', {User: req.user, query: req.user, isSame: true, errors: err})
                else {
                    console.log(err)
                    res.render('error')
                }
            })


    })
}
