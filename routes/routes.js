const mongoose = require('mongoose')
const {users, group} = require('./restful-routes.js')
const routes = require('express').Router()
const path = require('path')

routes.use('/user', users)
routes.use('/group', group)

routes.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'))
})

module.exports = routes
