import React from 'react'
import {Link} from 'react-router-dom'

export default function Signup(props) {
    console.log('test test from signup')
    return(
        <section className="signup">
            <div className="signup-container">
                <h2>Signup</h2>
                <div className="error-msg-container">
                    <p>{props.error}</p>
                </div>
                <form action="#" method="post">
                    <input type="text" name="username" placeholder="username" required="true"/>
                    <input type="email" placeholder="email" required="true" />
                    <input type="password" placeholder="password" required="true" />
                    <input type="submit" value="Signup"/>
                </form>
                <Link to="/login">Already have an account?</Link>
            </div>
        </section>
    )
}
