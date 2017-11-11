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
                            return (
                                <li key={group._id}>
                                    <div className="d-g-left">
                                        <Link to="#">{group.name}</Link>
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
    }

    return (
        <h2>{props.dashItem}</h2>
    )
}
