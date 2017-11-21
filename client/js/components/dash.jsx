import React from 'react'
import {Link, Redirect} from 'react-router-dom'
import DashItem from './dash-item.jsx'
import axios from 'axios'

let props

export default function Dashboard(p) {
    props = p
    if(!props.loggedIn) return <Redirect to="/" />

    return(
        <section className="dashboard">
            <form action="#" id="dash-create-group" style={{display: 'none'}} onSubmit={handleCreateGroup}>
                <input type="text" name="name" placeholder="Group Name" required/>
                <input type="submit" value="Create group"/>
                <input type="button" onClick={handleCancelCreateGroup} value="Cancel"/>
            </form>
            <form action="#" id="dash-add-collection" style={{display: 'none'}} onSubmit={handleAddToCollection}>
                <input type="text" name="title" placeholder="Title" required/>
                <input type="text" name="author" placeholder="Author" required/>
                <input type="text" name="description" placeholder="Description (optional)"/>
                <input type="submit" value="Add book" />
                <input type="button" onClick={handleCancelAddToCollectionButton} value="Cancel" />
            </form>
            <div id="dash-remove-book">
                <div>
                    <ul>
                        {props.user.books.map(book => {
                            if(!book.borrower) {
                                return (
                                    <li key={book._id}>
                                        <div>
                                            <h3>{book.title}</h3>
                                            <h6>{book.author}</h6>
                                        </div>
                                        <button onClick={() => handleRemoveFromCollection(book._id)}>Remove</button>
                                    </li>
                                )
                            }
                        })}
                    </ul>
                </div>
                <button onClick={handleCancelRemoveFromCollection}>Cancel</button>
            </div>
            <div className="dash" >
                <div className="dash-container">
                    <div className="dash-section">
                        <h2>Groups</h2>
                        <div className="item-overflow">
                            <ul>
                                {props.user.groups.length === 0 ?
                                    <li>
                                        <p>
                                            You don't have any groups. Create or join a one to get started.
                                        </p>
                                    </li>
                                    : null
                                }
                                {props.user.groups.map(group => {
                                    return(
                                        <li key={group._id}>
                                            <Link to={`/group/${group._id}`}>{group.name}</Link>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                        <button onClick={handleCreateGroupButton}>Create a group</button>
                    </div>
                    <div className="dash-section">
                        <h2>Your Collection</h2>
                        <div className="item-overflow">
                            <ul>
                                {props.user.books.length === 0 ?
                                    <li>
                                        <p>
                                            You don't have any books inside your collection
                                        </p>
                                    </li>
                                    : null
                                }
                                {props.user.books.map(book => {
                                    return(
                                        <li key={book._id}>
                                            <div>
                                                <Link to={`/book/${book._id}/${book.owner._id}`}>{book.title}</Link>
                                                <h6>by: {book.author}</h6>
                                                {book.group ?
                                                    <div>
                                                        <h4>Group: {book.group.name}</h4>
                                                        {!book.borrower ?
                                                            <button onClick={() => handleRemoveFromGroup(book.group._id, book._id)}>Remove from group</button>
                                                            : null
                                                        }
                                                    </div>
                                                    : null
                                                }
                                                {book.borrower ?
                                                    <h4 style={{margin:'10px 0'}}>Borrowed by: {book.borrower}</h4>
                                                    : null
                                                }
                                            </div>
                                            <div>
                                                {/* add buttons here */}
                                            </div>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                        <div>
                            <button onClick={handleAddToCollectionButton}>Add a book</button>
                            <button onClick={handleRemoveFromCollectionButton}>Remove a book</button>
                        </div>
                    </div>
                    <div className="dash-section">
                        <h2>Borrowed Books</h2>
                        <div className="item-overflow">
                            <ul>
                                {props.user.borrowedBooks.length === 0 ?
                                    <li>
                                        <p>
                                            You don't have any books borrowed
                                        </p>
                                    </li>
                                    : null
                                }
                                {props.user.borrowedBooks.map(book => {
                                    return(
                                        <li key={book._id}>
                                            <Link to={`/book/${book._id}/${book.owner._id}`}>{book.title}</Link>
                                            <h6>by: {book.author}</h6>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    </div>
                    <div className="dash-section">
                        <h2>Notifications</h2>
                        <div className="item-overflow">
                            <ul>
                                {props.user.invites.map(invite => {
                                    return(
                                        <li key={invite._id}>
                                            <div>
                                                <h6>Group Invite</h6>
                                                <h4>{invite.name}</h4>
                                            </div>
                                            <div>
                                                <button onClick={() => handleGroupInviteAccept(invite._id)}>Accept</button>
                                                <button onClick={() => handleGroupInviteDecline(invite._id)}>Decline</button>
                                            </div>
                                        </li>
                                    )
                                })}
                                {props.user.borrowRequests.map(borrow => {
                                    return(
                                        <li key={borrow._id}>
                                            <div>
                                                <h6>Borrow Request from: {borrow.user.username}</h6>
                                                <h4>{borrow.book.title} by: {borrow.book.author}</h4>
                                            </div>
                                            <div>
                                                <button onClick={() => handleAcceptBorrowRequest(borrow.book._id, borrow._id, borrow.user._id)}>Accept</button>
                                                <button onClick={() => handleDeclineBorrowRequest(borrow._id)}>Decline</button>
                                            </div>
                                        </li>
                                    )
                                })}
                                {props.user.bookReturns.map(bookReturn => {
                                    return(
                                        <li key={bookReturn._id}>
                                            <div>
                                                <h6>Return Request from: {bookReturn.borrower.username}</h6>
                                                <h4>{bookReturn.book.title} by: {bookReturn.book.author}</h4>
                                            </div>
                                            <div>
                                                <button onClick={() => handleAcceptReturnRequest(bookReturn.book._id, bookReturn._id, bookReturn.borrower._id)}>Approve</button>
                                                <button onClick={() => handleRejectReturnRequest(bookReturn._id)}>Reject</button>
                                            </div>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <div className="dash-m">
                <div className="dash-head">
                    <h3>Dashboard</h3>
                </div>
                <div className="dash-nav-container">
                    <select value={props.dashItem} onChange={handleSelect}>
                        <option value="Groups">Groups</option>
                        <option value="borrowedBooks">Borrowed Books</option>
                        <option value="collection">Collection</option>
                        <option value="notifications">Notifications</option>
                        <option value="booksLent">Books Lent</option>
                    </select>
                </div>
                <DashItem {...props} />
            </div>
        </section>
    )
}

function handleRemoveFromCollectionButton() {
    let formElement = document.getElementById('dash-remove-book')
    let dashElement = document.getElementsByClassName('dash')[0]
    dashElement.style.filter = 'blur(10px)'
    formElement.style.display = 'block'
}

function handleCancelRemoveFromCollection() {
    let formElement = document.getElementById('dash-remove-book')
    let dashElement = document.getElementsByClassName('dash')[0]
    dashElement.style.filter = 'none'
    formElement.style.display = 'none'
}

function handleRemoveFromCollection(bookId) {
    axios.post(`/user/${props.user._id}?book=${bookId}&remove=true`)
    .then(res => {
        if(res.data.error) return console.log(res.data.error)
        return axios.get(`/user/${props.user._id}?book=all`)
    })
    .then(res => {
        let user = Object.assign({}, props.user)
        user.books = res.data.books
        props.updateState({user: user})
    })
}
function handleSelect(e) {
    props.updateState({dashItem: e.target.value})
}

function handleCreateGroup(e) {
    e.preventDefault()
    let name = e.target.name.value
    let uri
    axios.post('/group/new', {name: name})
    .then(res => {
        if(res.data.error) return console.log(res.data.error)
        uri = res.data.uri
        return axios.get(`/user/${props.user._id}?group=all`)
    })
    .then(res => {
        let user = props.user
        user.groups = res.data.groups
        props.updateState({user: user})
        if(uri) return props.history.push(uri)
    })
    .catch(err => {
        console.log(err)
        //Handle error
    })
}

function handleCreateGroupButton(e) {
    e.preventDefault()
    let formElement = document.getElementById('dash-create-group')
    let dashElement = document.getElementsByClassName('dash')[0]
    dashElement.style.filter = 'blur(10px)'
    formElement.style.display = 'flex'
}

function handleCancelCreateGroup(e) {
    e.preventDefault()
    let formElement = document.getElementById('dash-create-group')
    let dashElement = document.getElementsByClassName('dash')[0]
    dashElement.style.filter = 'none'
    formElement.style.display = 'none'
}

function handleAddToCollection(e) {
    e.preventDefault()
    axios.post('/user/collection/add', {
        title: e.target.title.value,
        author: e.target.author.value,
        description: e.target.description.value
    })
    .then(res => {
        //Handle error
        if(res.data.error) return console.log(res.data.error)
        return axios.get(`/user/${props.user._id}?book=all`)
    })
    .then(res => {
        if(res.data.error) return console.log(res.data.error)
        let user = props.user
        user.books = res.data.books
        props.updateState({user: user, dashAddToCollection: false})
        let formElement = document.getElementById('dash-add-collection')
        let dashElement = document.getElementsByClassName('dash')[0]
        dashElement.style.filter = 'none'
        formElement.style.display = 'none'
    })
    .catch(err => {
        console.log(err)
        //Handle error
    })
}
function handleAddToCollectionButton(e) {
    e.preventDefault()
    let formElement = document.getElementById('dash-add-collection')
    let dashElement = document.getElementsByClassName('dash')[0]
    dashElement.style.filter = 'blur(10px)'
    formElement.style.display = 'flex'
}

function handleCancelAddToCollectionButton(e) {
    e.preventDefault()
    let formElement = document.getElementById('dash-add-collection')
    let dashElement = document.getElementsByClassName('dash')[0]
    dashElement.style.filter = 'none'
    formElement.style.display = 'none'
}

function handleGroupInviteAccept(inviteId) {
    axios.post(`/user/group-invite/accept`, {id: inviteId})
    .then(res => {
        if(res.data.error) return console.log(res.data.error)
        props.history.push(res.data.uri)
        return axios.get(`/user/${props.user._id}`)
    })
    .then(res => {
        props.updateState({user: res.data.user})
    })
    .catch(err => {
        console.log(err)
        //Handle error
    })
}
function handleGroupInviteDecline(inviteId) {
    axios.post(`/user/group-invite/decline`, {id: inviteId})
    .then(res => {
        if(res.data.error) return console.log(res.data.error)
        return axios.get(`/user/${props.user._id}`)
    })
    .then(res => {
        props.updateState({user: res.data.user})
    })
    .catch(err => {
        console.log(err)
        //Handle error
    })
}
function handleRemoveFromCollection(bookId) {
    axios.post(`/user/${props.user._id}?book=${bookId}&remove=true`)
    .then(res => {
        if(res.data.error) return console.log(res.data.error)
        return axios.get(`/user/${props.user._id}?book=all`)
    })
    .then(res => {
        let user = Object.assign({}, props.user)
        user.books = res.data.books
        props.updateState({user: user})
    })
}
function handleRemoveFromGroup(groupId, bookId) {
    axios.post(`/group/${groupId}/${bookId}?remove=true`)
    .then(res => {
        if(res.data.error) return console.log(res.data.error)
        return axios.get(`/user/${props.user._id}?book=${bookId}`)
    })
    .then(res => {
        let user = Object.assign({}, props.user)
        let index = user.books.findIndex(book => book._id == res.data.book._id)
        user.books[index] = res.data.book
        props.updateState({user: user})
    })
}
function handleAcceptBorrowRequest(bookId, requestId, borrowerId) {
    axios.post(`/user/${props.user._id}?book=${bookId}&borrower=${borrowerId}&request=${requestId}&action=accept`)
    .then(res => {
        if(res.data.error) return console.log(res.data.error)
        return axios.get(`/user/${props.user._id}`)
    })
    .then(res => {
        if(res.data.erro) return console.log(res.data.error)
        props.updateState({user: res.data.user})
    })
    .catch(err => {
        console.log(err)
        //Handle error
    })
}

function handleDeclineBorrowRequest(requestId) {
    axios.post(`/user/${props.user._id}?request=${requestId}&action=decline`)
    .then(res => {
        if(res.data.error) return console.log(res.data.error)
        return axios.get(`/user/${props.user._id}?borrowRequests=all`)
    })
    .then(res => {
        let user = Object.assign({}, props.user)
        user.borrowRequests = res.data.borrowRequests
        props.updateState({user: user})
    })
    .catch(err => {
        console.log(err)
    })
}

function handleAcceptReturnRequest(bookId, returnId, borrowerId) {
    axios.post(`/user/${props.user._id}?book=${bookId}&return=${returnId}&borrower=${borrowerId}&action=accept`)
    .then(res => {
        if(res.data.error) return console.log(res.data.error)
        return axios.get(`/user/${props.user._id}`)
    })
    .then(res => {
        if(res.data.error) return console.log(res.data.error)
        props.updateState({user: res.data.user})
    })
    .catch(err => {
        console.log(err)
    })
}
function handleRemoveFromGroup(groupId, bookId) {
    axios.post(`/group/${groupId}/${bookId}?remove=true`)
    .then(res => {
        if(res.data.error) return console.log(res.data.error)
        return axios.get(`/user/${props.user._id}?book=${bookId}`)
    })
    .then(res => {
        let user = Object.assign({}, props.user)
        let index = user.books.findIndex(book => book._id == res.data.book._id)
        user.books[index] = res.data.book
        props.updateState({user: user})
    })
}
function handleRejectReturnRequest(returnId) {
    axios.post(`/user/${props.user._id}?return=${returnId}&action=decline`)
    .then(res => {
        if(res.data.error) return console.log(res.data.error)
        return axios.get(`/user/${props.user._id}?bookReturns=all`)
    })
    .then(res => {
        if(res.data.error) return console.log(res.data.error)
        let user = Object.assign({}, props.user)
        user.bookReturns = res.data.bookReturns
        props.updateState({user: user})
    })
    .catch(err => {
        console.log(err)
    })
}
function handleRemoveFromGroup(groupId, bookId) {
    axios.post(`/group/${groupId}/${bookId}?remove=true`)
    .then(res => {
        if(res.data.error) return console.log(res.data.error)
        return axios.get(`/user/${props.user._id}?book=${bookId}`)
    })
    .then(res => {
        let user = Object.assign({}, props.user)
        let index = user.books.findIndex(book => book._id == res.data.book._id)
        user.books[index] = res.data.book
        props.updateState({user: user})
    })
}
