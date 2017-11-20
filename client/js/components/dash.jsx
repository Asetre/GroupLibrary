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
            <form action="#" id="dash-add-collection" style={{display: 'none'}}>
                <input type="text" name="title" placeholder="Title" required/>
                <input type="text" name="author" placeholder="Author" required/>
                <input type="text" name="description" placeholder="Description (optional)"/>
                <input type="submit" value="Add book" />
                <input type="button" value="Cancel" />
            </form>
            <div className="dash" >
                <div className="dash-container">
                    <div className="dash-section">
                        <h2>Groups</h2>
                        <div className="item-overflow">
                            <ul>
                                {props.user.groups.length === 0 ?
                                    <li>You don't have any groups. Create or join a one to get started.</li>
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
                                    <li>You don't have any books inside your collection</li>
                                    : null
                                }
                                {props.user.books.map(book => {
                                    return(
                                        <li key={book._id}>
                                            <div>
                                                <Link to="#">{book.title}</Link>
                                                <h6>by: {book.author}</h6>
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
                            <button>Add a book</button>
                            <button>Remove a book</button>
                        </div>
                    </div>
                    <div className="dash-section">
                        <h2>Borrowed Books</h2>
                        <div className="item-overflow">
                            <ul>
                                {props.user.borrowedBooks.length === 0 ?
                                    <li>You don't have any books borrowed</li>
                                    : null
                                }
                                {props.user.borrowedBooks.map(book => {
                                    return(
                                        <li key={book._id}>
                                            <Link to="#">{book.title}</Link>
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
                                                <button>Accept</button>
                                                <button>Decline</button>
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
                                                <button>Accept</button>
                                                <button>Decline</button>
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
                                                <button>Approve</button>
                                                <button>Reject</button>
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
