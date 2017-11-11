import React from 'react'
import {Link} from 'react-router-dom'

export default function NavRight(props) {
    const navIconClick = function(e) {
        e.preventDefault()
        let el = document.getElementsByClassName('dropdown-menu')[0]
        if(el.classList.contains('dropdown-slideIn')){
            el.classList.remove('dropdown-slideIn')
            el.classList.add('dropdown-slideOut')
        }else {
            el.classList.remove('dropdown-slideOut')
            el.classList.add('dropdown-slideIn')
        }
    }

    if(props.loggedIn) {
        return null
    }else {
        return(
            <div className="nav-right">
                <div className="dropdown-icon" onClick={navIconClick}>
                    <div className="v-line"></div>
                    <div className="v-line"></div>
                    <div className="v-line"></div>
                </div>

                <div className="dropdown-menu">
                    <ul>
                        <li>
                            <button>Demo Login</button>
                        </li>
                        <li>
                            <button>Login</button>
                        </li>
                        <li>
                            <Link to="/signup">
                                <button>Signup</button>
                            </Link>
                        </li>
                    </ul>
                </div>

                <button className="btn">Demo Login</button>
                <button className="btn">Login</button>
                <button className="btn">Signup</button>
            </div>
        )
    }
}
