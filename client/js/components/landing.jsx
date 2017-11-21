import React from 'react'
import {Link} from 'react-router-dom'

export default function Landing() {
    return(
        <section className="landing-page">
            <div className="hero">
                <h2>Make Sharing books easy</h2>
                <p>We make it simple for you to keep track of your books so you can focus on reading</p>
                <Link to="/signup">
                    <button className="btn">Get started</button>
                </Link>
            </div>
            <div className="info">
                <h2>3 Simple steps</h2>
                <div className="steps-container">
                    <h2>Create or join a group</h2>
                    <p>Join and create groups with friends to get started. Each group is a small library between friends, the group libraries keep track of the books being borrowed so you don't have to. Joining a group is as easy as clicking a button, and we make it simple to create a group, the only hard part is thinking of a name! </p>
                    <div className="line"></div>
                    <h2>Request to borrow books</h2>
                    <p>Now you're in a group or a "library", feel free to browse all the books available inside that group. Once you have a book you're interested in, just request to borrow it, and the owner will recieve your borrow request as a notification. Feel free to lend out books you've read and enjoy ones you haven't.</p>
                    <div className="line"></div>
                    <h2>Pickup the books and enjoy reading</h2>
                    <p>Great! Your borrow request has been approved, just go out to pickup the book at your earliest convenience and get to reading. Once your done, just send a return request and return the book.</p>
                </div>
                <Link to="/signup">
                    <button type="button" className="btn">Signup for free</button>
                </Link>
            </div>
        </section>
    )
}
