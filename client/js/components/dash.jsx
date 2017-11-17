import React from 'react'
import {Link, Redirect} from 'react-router-dom'
import DashItem from './dash-item.jsx'

let props

export default function Dashboard(p) {
    props = p
    if(!props.loggedIn) return <Redirect to="/" />

    return(
        <section className="dashboard">
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
