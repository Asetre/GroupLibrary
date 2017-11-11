import React from 'react'
import {Link, Redirect} from 'react-router-dom'
import axios from 'axios'

let props

export default function Signup(p) {
    props = p
    if(props.redirect) return props.redirect
    return(
        <section className="signup">
            <div className="signup-container">
                <h2>Signup</h2>
                <div className="error-msg-container">
                    <h4>{props.error}</h4>
                </div>
                <form action="#" method="post" onSubmit={handleSignup}>
                    <input type="text" name="username" placeholder="username" required="true"/>
                    <input type="email" name="email" placeholder="email" required="true" />
                    <input type="password" name="password" placeholder="password" required="true" />
                    <input type="submit" value="Signup"/>
                </form>
                <Link to="/login">Already have an account?</Link>
            </div>
        </section>
    )
}

function handleSignup(e) {
    e.preventDefault()
    let username = e.target.username.value
    let email = e.target.email.value
    let password = e.target.password.value

    axios.post('/user/signup', {
        username: username,
        email: email,
        password: password
    })
    .then(res => {
        if(res.data.error) return props.updateState({error: res.data.error})
        if(res.data.user) {
            let redirect = <Redirect to='/' />
            props.updateState({user: res.data.user, error: null, redirect: redirect});
        }
    })
    .catch(err => {
        console.log(err)
        //Handle error
    })
}
