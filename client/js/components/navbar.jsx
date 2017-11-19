import React from 'react'
import {Redirect, Link} from 'react-router-dom'

import NavRight from './nav-right.jsx'

export default function Navbar(props) {
    return(
        <div className="navbar">
            <div className="nav-left">
                <Link to={props.loggedIn ? '/dashboard' : '/'} className="nav-logo">
                    <h2>Group Library</h2>
                </Link>
            </div>
            <NavRight {...props} />
        </div>
    )
}
