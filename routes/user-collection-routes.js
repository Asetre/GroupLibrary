const {Users, Groups} = require('../models/users')
const mongoose = require('mongoose')

module.exports = function(router) {
  router.post('/collection/add', (req, res) => {
    //check that the title and author are not empty
    if(req.body.title.length < 1 || req.body.author.length < 1) return res.redirect('/dashboard')
    //add a new book to user then save
    req.user.books.push({
      owner: {_id: req.user._id, username: req.user.username},
      title: req.body.title,
      author: req.body.author,
      description: req.body.description,
      group: null
    })
    req.user.save()
    .catch(err => {
      console.log(err)
      res.render('error')
    })
    res.redirect('/dashboard')
  })

  router.post('/collection/remove/:id', (req, res) => {
    //find the book then delete from array
    //Check and remove if the book is inside any groups
    let book = req.user.books.id(req.params.id)
    if(book.group) {
      Groups.update({_id: book.group._id}, {$pull: {books: book._id}})
      .catch(err => {
        console.log(err)
        res.render('error')
      })
    }
    req.user.books.remove(req.params.id)
    req.user.save()
    .catch(err => {
      console.log(err)
      res.render('error')
    })
    res.redirect('/dashboard')
  })
}
