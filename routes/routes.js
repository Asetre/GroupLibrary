const mongoose = require('mongoose')
const {users, group, bookRoute} = require('./restful-routes.js')
const routes = require('express').Router()
const path = require('path')

routes.use('/user', users)
routes.use('/group', group)
routes.use('/book', bookRoute)

module.exports = routes
