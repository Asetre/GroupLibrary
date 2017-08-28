const mongoose = require('mongoose')
const Schema = mongoose.Schema
const bcrypt = require('bcrypt-nodejs')

mongoose.Promise = global.Promise


//Book Schema
var bookSchema = new Schema({
  group: {type: Object}, //groupSchema
  owner: {type: Object, required: true}, //userSchema
  title: {type: String, required: true},
  author: {type: String, required: true},
  description: {type: String, required: false},
  borrower: {type: Object} 
})

//User Schema
var userSchema = new Schema({
  username: {type: String, lowercase: true, required: true, unique: true},
  email: {type: String, lowercase: true, required: true, unique: true},
  password: {type: String, required: true, unique: true},
  groups: [{type: mongoose.Schema.ObjectId, ref: 'Groups'}],
  borrowedBooks: [bookSchema],
  invites: [{type: mongoose.Schema.ObjectId, ref: 'Groups'}],
  books: [bookSchema],
  borrowRequests: [] // example: {user: userSchema book: bookSchema}
},
{collection: 'users'}
)

//Group Schema
var groupSchema = new Schema({
  name: {type: String, required: true},
  users: [{type: mongoose.Schema.ObjectId, ref: 'Users'}],
  books: [bookSchema]
},
  {collection: 'groups'}

)

//Delete group if empty
groupSchema.pre('save', function(next) {
  console.log(this.isNew)
  if(!this.isNew) {
    if(this.users.length === 0) {
      this.remove()
    }
  }
  next()
})
//Custom methods

//hash password
userSchema.statics.hashPassword = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(6))
}

//validate password
userSchema.methods.validPassword = function (password) {
  return bcrypt.compareSync(password, this.password)
}

const Users = mongoose.model('Users', userSchema)
const Books = mongoose.model('Books', bookSchema)
const Groups = mongoose.model('Groups', groupSchema);

module.exports = {Groups, Users, Books}
