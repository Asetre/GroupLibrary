import React from 'react'
import {Link} from 'react-router-dom'

import NavRight from './nav-right.jsx'

export default function Navbar(props) {
    return(
        <div className="navbar">
            <div className="nav-left">
                <Link to="#" className="nav-logo">
                    <h2>Group Library</h2>
                </Link>
            </div>
            <NavRight loggedIn={props.loggedIn} />
        </div>
    )
}
