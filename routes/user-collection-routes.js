const {Users, Groups} = require('../models/users')
const mongoose = require('mongoose')

module.exports = function(router) {
  router.post('/collection/add', (req, res) => {
    //check that the title and author are not empty
    if(req.body.title.length < 1 || req.body.author.length < 1) return res.redirect('/dashboard')
    //add a new book to user then save
    req.user.books.push({
      owner: {_id: req.user._id, name: req.user.username},
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
    //Add error handling
    //find the book then delete from array
    req.user.books.remove(req.params.id)
    req.user.save()
    res.redirect('/dashboard')
  })
}
