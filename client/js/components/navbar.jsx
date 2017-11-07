import React from 'react'
import {Link} from 'react-router-dom'

import NavLoggedIn from './nav-logged-in.jsx'
import NavLoggedOut from './nav-logged-out.jsx'

export default class Navbar extends React.Component {
    render() {
        let navRight
        if(this.props.loggedIn) navRight = NavLoggedIn
        else navRight = NavLoggedOut
        return(
            <div className="navbar">
                <div className="nav-left">
                    <Link to="#" className="nav-logo">
                        <h2>Group Library</h2>
                    </Link>
                </div>
                <navRight />
            </div>
        )
    }
}
