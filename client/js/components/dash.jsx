import React from 'react'
import DashItem from './dash-item.jsx'
let props
export default function Dashboard(p) {
    props = p
    return(
        <section className="dashboard">
            <div className="dash-m">
                <div className="dash-nav-container">
                    <select defaultValue={props.dashItem}>
                        <option value="borrowedBooks">Borrowed Books</option>
                        <option value="collection">Collection</option>
                        <option value="notifications">Notifications</option>
                        <option value="booksLent">Books Lent</option>
                    </select>
                </div>
                <DashItem item={props.dashItem} />
            </div>
        </section>
    )
}

function handleSelect(e) {
    props.updateState({dashItem: e.target.value})
}
