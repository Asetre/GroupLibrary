const {Users, Groups} = require('../models/users')
const mongoose = require('mongoose')

module.exports = function(router) {
  router.get('/dashboard', (req, res) => {
    Users.findOne({_id: req.user._id})
    .populate({
      path: 'groups invites'
    })
    .then(user => {
      //If user was not found redirect to login
      //else render the dashboard
      if(!user) return res.redirect('/login')
      res.render('dashboard', {User: user})
    })
    .catch(err => {
      console.log(err)
      res.render('error')
    })
  })

  router.get('/user/:id', (req, res) => {
    //render user profile
    Users.findOne({_id: req.params.id})
    .then(user => {
      if(!user) return res.redirect('/dashboard')
      let same = false;
      if(user._id.equals(req.user._id)) same = true;
      res.render('user', {User: req.user, query: user, isSame: same})
    })
    .catch(err => {
      console.log(err)
      res.render('error')
    })
  })
}
