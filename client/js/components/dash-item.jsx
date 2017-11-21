import React from 'react'
import {Link, Redirect} from 'react-router-dom'
import axios from 'axios'

let props

export default function DashItem(p) {
    props = p
    //Groups view
    if(props.dashItem === 'Groups') {
        return (
            <div className="dash-groups">
                <button onClick={handleCreateGroupButton} >Create Group</button>
                {props.dashCreateGroup ?
                    <div className="create-group-form-container">
                        <form action="#" onSubmit={handleCreateGroup}>
                            <input type="text" name="name" placeholder="Group name" required/>
                            <div>
                                <input type="submit" value="Create"/>
                                <input type="button" onClick={handleCancelCreateGroup} value="Cancel"/>
                            </div>
                        </form>
                    </div>
                    : null
                }
                <div className="dash-groups-headers">
                    <div className="d-g-left">
                        <h6>Name</h6>
                    </div>
                    <div className="d-g-right">
                        <h6>Books</h6>
                        <h6>Members</h6>
                    </div>
                </div>
                <div className="groups-list">
                    <ul>
                        {props.user.groups.map(group => {
                            let linkToGroup = `/group/${group._id}`
                            return (
                                <li key={group._id}>
                                    <div className="d-g-left">
                                        <Link to={linkToGroup}>{group.name}</Link>
                                    </div>
                                    <div className="d-g-right">
                                        <h3>{group.books}</h3>
                                        <h3>{group.users}</h3>
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                </div>

            </div>
        )
    }else if(props.dashItem === 'borrowedBooks') {
        return (
            <div className="dash-borrowed-books">
                <div>
                    <h6>title</h6>
                    <h6>author</h6>
                </div>
                <div>
                    <ul>
                        {props.user.borrowedBooks.map(book => {
                            return(
                                <li key={book._id}>
                                    <Link to={`/book/${book._id}/${book.owner._id}`}>{book.title}</Link>
                                    <h6>{book.author}</h6>
                                </li>
                            )
                        })}
                    </ul>
                </div>
            </div>
        )
    }else if(props.dashItem === 'collection') {
        return(
            <div className="dash-collection">
                <button onClick={handleAddToCollectionButton}>Add a book</button>
                {props.dashAddToCollection ?
                    <div className="add-to-collection-form-container">
                        <form action="#" onSubmit={handleAddToCollection}>
                            <input type="text" name="title" placeholder="title" required/>
                            <input type="text" name="author" placeholder="author" required/>
                            <input type="text" name="description" placeholder="description"/>
                            <div>
                                <input type="submit" value="Add"/>
                                <input type="button" onClick={handleCancelAddToCollection} value="Cancel"/>
                            </div>
                        </form>
                    </div>
                    :null
                }
                <div className="m-collections-headers">
                    <h6>Title</h6>
                    <h6>author</h6>
                </div>
                <div>
                    <ul>
                        {props.user.books.map(book => {
                            return(
                                <li key={book._id}>
                                    <div>
                                        <Link to={`/book/${book._id}/${book.owner._id}`}>{book.title}</Link>
                                        <h6>{book.author}</h6>
                                    </div>
                                    <div>
                                        {!book.borrower && !book.group ?
                                            <button onClick={() => handleRemoveFromCollection(book._id)}>Remove from collection</button>
                                            : null
                                        }
                                        {book.borrower ?
                                            <h6>Borrowed by: {book.borrower}</h6>
                                            :null
                                        }
                                        {book.group && !book.borrower ?
                                            <button className="m-dash-remove-from-group-btn" onClick={() => handleRemoveFromGroup(book.group._id, book._id)}>Remove From group</button>
                                            : null
                                        }
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                </div>
            </div>
        )
    }else if(props.dashItem === 'notifications') {
        return(
            <div className="dash-notifications">
                <div>
                    <h3>Notifications</h3>
                </div>
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
        )
    }else if(props.dashItem === 'booksLent') {
        return(
            <div className="dash-books-lent">
                <div>
                    <h3>Your books being borrowed</h3>
                </div>
                <ul>
                    {props.user.books.map(book => {
                        if(book.borrower) {
                            return (
                                <li key={book._id}>
                                    <div>
                                        <h4>{book.title}</h4>
                                        <h6>by: {book.author}</h6>
                                    </div>
                                    <h5>Borrowed by: {book.borrower}</h5>
                                </li>
                            )
                        }
                    })}
                </ul>
            </div>
        )
    }
    return (
        <h2>{props.dashItem}</h2>
    )
}

function handleAddToCollectionButton(e) {
    e.preventDefault()
    props.updateState({dashAddToCollection: true})
}

function handleCancelAddToCollection(e) {
    e.preventDefault()
    props.updateState({dashAddToCollection: false})
}

function handleCreateGroupButton(e) {
    e.preventDefault()
    props.updateState({dashCreateGroup: true})
}

function handleCancelCreateGroup(e) {
    e.preventDefault()
    props.updateState({dashCreateGroup: false})
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
    })
    .catch(err => {
        console.log(err)
        //Handle error
    })

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
