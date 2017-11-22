const mongoose = require('mongoose')
const {Schema} = mongoose
const bcrypt = require('bcrypt-nodejs')
const uniqueValidator = require('mongoose-unique-validator')

mongoose.Promise = global.Promise

//Book Schema
var bookSchema = new Schema({
    group: {type: Object},
    owner: {
        _id: {type: Schema.Types.ObjectId, required: true},
        username: {type: String, required: true}
    },
    title: {type: String, required: true},
    author: {type: String, required: true},
    description: {type: String, required: false},
    //string is the username of the borrower  example: 'testUser'
    borrower: {type: String}
})

//User Schema
var userSchema = new Schema({
    username: {type: String, unique: true, required: true},
    email: {type: String, lowercase: true, required: true, unique: true},
    password: {type: String, required: true, unique: true},
    groups: [{type: Schema.ObjectId, ref: 'Groups'}],
    borrowedBooks: [{type: Schema.ObjectId}],
    invites: [{type: Schema.ObjectId, ref: 'Groups'}],
    bookReturns: [
        {
            _id: {type: Schema.Types.ObjectId},
            book: {type: Object, required: true},
            borrower: {type: Object, required: true}
        }
    ],
    books: [bookSchema],
    borrowRequests: [
        {
            _id: {type: Schema.Types.ObjectId, required: true},
            user: {
                //Id of the borrower
                _id: {type: Schema.Types.ObjectId, required: true},
                username: {type: String, required: true}
            },
            book: {
                _id: {type: Schema.Types.ObjectId},
                title: {type: String, required: true},
                author: {type: String, required: true}
            },
            group: {
                _id: {type: Schema.Types.ObjectId, required: true},
                name: {type: String, required: true}
            }
        }
    ]
},
{collection: 'users'}
)

//username and email validation
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
groupSchema.post('update', function() {
    if(!this.isNew) {
        this.findOne({})
            .then((group) => {
                if(group.users.length === 0) group.remove()
            })
    }
})

//hash password
userSchema.statics.hashPassword = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(6))
}

//validate password
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password)
}

const Users = mongoose.model('Users', userSchema)
const Groups = mongoose.model('Groups', groupSchema);

module.exports = {Groups, Users, userSchema, groupSchema}
