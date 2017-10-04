const mongoose = require('mongoose')
const Schema = mongoose.Schema
const bcrypt = require('bcrypt-nodejs')
const uniqueValidator = require('mongoose-unique-validator')

mongoose.Promise = global.Promise

//Book Schema
var bookSchema = new Schema({
  group: {type: Object}, //groupSchema
  owner: {type: Object, required: true}, //userSchema
  title: {type: String, required: true},
  author: {type: String, required: true},
  description: {type: String, required: false},
  borrower: {type: String} //string is the username of the borrower  example: 'testUser'
})

//User Schema
var userSchema = new Schema({
  username: {type: String, unique: true, required: true},
  email: {type: String, lowercase: true, required: true, unique: true},
  password: {type: String, required: true, unique: true},
  groups: [{type: mongoose.Schema.ObjectId, ref: 'Groups'}],
  borrowedBooks: [bookSchema],
  invites: [{type: mongoose.Schema.ObjectId, ref: 'Groups'}],
  bookReturns: [{
    _id: {type: Schema.Types.ObjectId},
    book: {type: Object, required: true},
    borrower: {type: Object, required: true}
  }],
  books: [bookSchema],
  borrowRequests: [{
    _id: {type: Schema.Types.ObjectId},
    user: {type: Object, required: true},
    book: {type: Object, required: true},
    group: {type: Object, required: true}
  }] // example: {user: {id, username}, book: {title, author}, group: {id, name} }
},
{collection: 'users'}
)

userSchema.plugin(uniqueValidator)

//Group Schema
var groupSchema = new Schema({
  name: {type: String, required: true},
  users: [{type: mongoose.Schema.ObjectId, ref: 'Users'}],
  books: [{type: mongoose.Schema.ObjectId}]
},
  {collection: 'groups'}

)

//Delete group if there are no users inside
groupSchema.post('update', function(doc) {
  if(!this.isNew) {
    this.findOne({})
    .then(group => {
      if(group.users.length === 0) group.remove()
    })
  }
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
