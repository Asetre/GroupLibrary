import React from 'react'
import {Link} from 'react-router-dom'
import axios from 'axios'

let props

export default function GroupItem(p) {
    props = p
    const {group, groupItem} = props.groupState
    const user = props.appState.user
    if(groupItem === 'Available Books') {
        return(
            <ul>
                {group.books.map(book => {
                    if(!book.borrower) {
                        return (
                            <li key={book._id}>
                                <Link to="#">{book.title}</Link>
                                <h6>{book.author}</h6>
                            </li>
                        )
                    }
                })}
            </ul>
        )
    }else if(groupItem === 'Add a book from your collection') {
        return(
            <ul>
                {user.books.map(book => {
                    if(!book.group) {
                        return(
                            <li key={book._id}>
                                <Link to='#' onClick={() => handleAddBook(book._id)}>{book.title}</Link>
                                <h6>{book.author}</h6>
                            </li>
                        )
                    }
                })}
            </ul>
        )
    }
}

function handleAddBook(id) {
    let group = props.groupState.group
    axios.post(`/group/${group._id}/${id}`)
    .then(res => {
        group.books = res.data.groupBooks
        props.groupState.updateState({group: group, groupItem: 'Available Books'})
        let user = props.appState.user
        user.books = res.data.userBooks
        props.appState.updateState({user: user})
    })
}
