import React from 'react'

import Navbar from './navbar.jsx'

export default class Layout extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            loggedIn: false,
            user: null
        }
    }

    render() {
        return(
            <div>
                <Navbar loggedIn={false}/>
            </div>
        )
    }
}
