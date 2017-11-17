import React from 'react'
import {Link} from 'react-router-dom'
import axios from 'axios'

let props

export default function NavRight(p) {
    props = p

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

    return(
        <div className="nav-right">
            <div className="dropdown-icon" onClick={navIconClick}>
                <div className="v-line"></div>
                <div className="v-line"></div>
                <div className="v-line"></div>
            </div>

            <div className="dropdown-menu">
                    {props.loggedIn ?
                        //Logged in
                        <ul>
                            <li>
                                <Link to="#">
                                    <button>Dashboard</button>
                                </Link>
                            </li>
                            <li>
                                <Link to="#">
                                    <button>Profile</button>
                                </Link>
                            </li>
                            <li>
                                <Link to="#" onClick={handleSignout}>
                                    <button>Signout</button>
                                </Link>
                            </li>
                        </ul>
                        //Loged out
                        : <ul>
                            <li>
                                <button>Demo Login</button>
                            </li>
                            <li>
                                <Link to="/login">
                                    <button>Login</button>
                                </Link>
                            </li>
                            <li>
                                <Link to="/signup">
                                    <button>Signup</button>
                                </Link>
                            </li>
                        </ul>
                    }
            </div>

            <button className="btn">Demo Login</button>
            <button className="btn">Login</button>
            <button className="btn">Signup</button>
        </div>
    )
}

function handleSignout(e) {
    e.preventDefault()
    axios.post('/user/signout')
    .then(res => {
        if(res.data.err) throw 'Passport Error: Failed to logout'
        props.updateState({loggedIn: false, user: null})
    })
    .catch(err => {
        console.log(err)
        //Handle error
    })
}
