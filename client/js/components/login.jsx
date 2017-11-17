import React from 'react'
import {Link, Redirect} from 'react-router-dom'
import axios from 'axios'

let props
export default function Login(p) {
    props = p
    if(props.redirect) return props.redirect
    return(
        <section className="login">
            <div className="login-container">
                <h2>Login</h2>
                <div className="error-msg-container">
                    <h4>{props.error}</h4>
                </div>
                <form action="#" onSubmit={handleLogin}>
                    <input type="text" name="username" placeholder="username" required/>
                    <input type="password" name="password" placeholder="password" required/>
                    <input type="submit" value="Login"/>
                </form>
                <Link to="/signup">Don't have an account?</Link>
            </div>
        </section>
    )
}

function handleLogin(e) {
    e.preventDefault()
    let username = e.target.username.value.split(' ').join('')
    let password = e.target.password.value.split(' ').join('')

    axios.post('/user/login', {
        username: username,
        password: password
    })
    .then(res => {
        if(res.data.error) return props.updateState({error: res.data.error})
        if(res.data.user) {
            let redirect = <Redirect to='/dashboard' />
            props.updateState({user: res.data.user, error: null, redirect: redirect, loggedIn: true});
        }
    })
    .catch(err => {
        console.log(err)
        //Handle error
    })
}
