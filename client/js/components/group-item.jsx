import React from 'react'
import {Link} from 'react-router-dom'
import axios from 'axios'

let props

export default function GroupItem(p) {
    props = p
    const {group, groupItem} = props.groupState
    const user = props.appState.user
    if(groupItem === 'Available Books') {
        console.log(group)
        return(
            <ul>
                {group.books.map(book => {
                    if(!book.borrower) {
                        return (
                            <li key={book._id}>
                                <h4>{book.title}</h4>
                                <h4>{book.author}</h4>
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
                                <Link to='#' onClick={handleAddBook(book._id)}>{book.title}</Link>
                                <h6>{book.author}</h6>
                            </li>
                        )
                    }
                })}
            </ul>
        )
    }
}

function handleAddBook(e) {
    //do stuff
    console.log('under development')
}
