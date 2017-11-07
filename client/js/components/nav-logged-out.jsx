import React from 'react'
import {Link} from 'react-router-dom'

export default function NavLoggedOut(props) {
    return(
        <div className="nav-right">
            <Link to="#">
                <button>Login</button>
            </Link>
            <Link to="#">
                <button>Signup</button>
            </Link>
        </div>
    )
}
