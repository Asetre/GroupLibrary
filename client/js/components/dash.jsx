import React from 'react'
import {Link, Redirect} from 'react-router-dom'
import DashItem from './dash-item.jsx'

let props

export default function Dashboard(p) {
    props = p
    if(!props.loggedIn) return <Redirect to="/" />

    return(
        <section className="dashboard">
            <div className="dash">
                <div className="dash-container">
                    <div className="dash-section">
                        <h2>Groups</h2>
                        <div>
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
                        <button>Create a group</button>
                    </div>
                    <div className="dash-section">
                        <h2>Your Collection</h2>
                        <button>Add a book</button>
                        <button>Remove a book</button>
                    </div>
                    <div className="dash-section">
                        <h2>Borrowed Books</h2>
                    </div>
                    <div className="dash-section">
                        <h2>Notifications</h2>
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
