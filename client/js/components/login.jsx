import React from 'react'
import {Link} from 'react-router-dom'

let props
export default function Login(p) {
    props = p
    if(props.redirect) return props.redirect
    return(
        <section className="login">
            <div className="login-container">
                <h2>Login</h2>
                <div className="error-msg-container">
                    <h4>test</h4>
                </div>
                <form action="#">
                    <input type="text" required/>
                    <input type="password" required/>
                    <input type="submit" value="Login"/>
                </form>
                <Link to="/signup">Don't have an account?</Link>
            </div>
        </section>
    )
}

function handleLogin(e) {
    e.preventDefault()
}
