import React from 'react'
import {Link, Redirect} from 'react-router-dom'

export default function DashItem(props) {
    //Groups view
    console.log(props)
    if(props.dashItem === 'Groups') {
        return (
            <div className="dash-groups">
                <button>Create Group</button>
                <div className="create-group-form-container">
                    <form action="#">
                        <input type="text" name="name" placeholder="Group name" required/>
                        <div>
                            <input type="submit" value="Create"/>
                            <input type="button" value="Cancel"/>
                        </div>
                    </form>
                </div>
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
                                    <Link to="#">{book.title}</Link>
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
                <button>Add a book</button>
                <div className="add-to-collection-form-container">
                    <form action="#">
                        <input type="text" name="title" placeholder="title" required/>
                        <input type="text" name="author" placeholder="author" required/>
                        <input type="text" name="description" placeholder="description"/>
                        <div>
                            <input type="submit" value="Add"/>
                            <input type="button" value="Cancel"/>
                        </div>
                    </form>
                </div>
                <div className="m-collections-headers">
                    <h6>Title</h6>
                    <h6>author</h6>
                </div>
                <div>
                    <ul>
                        {props.user.books.map(book => {
                            return(
                                <li key={book._id}>
                                    <Link to="#">{book.title}</Link>
                                    <h6>{book.author}</h6>
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
                                <button>Accept</button>
                                <button>Decline</button>
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
                                <button>Accept</button>
                                <button>Decline</button>
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
                                <button>Approve</button>
                                <button>Reject</button>
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
                                    <h4>{book.title} by: {book.author}</h4>
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
