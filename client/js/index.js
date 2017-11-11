import React from 'react'
import ReactDom from 'react-dom'
import {BrowserRouter as Router, Route, IndexRoute} from 'react-router-dom'

//HTML File
import indexHTML from '../index.html'
//CSS file
import mainCSS from '../main.scss'

//Components
import Landing from './components/landing.jsx'
import Navbar from './components/navbar.jsx'
//import Login from './components/login.jsx'
import Signup from './components/signup.jsx'

class Layout extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            loggedIn: false,
            user: null
        }
    }

    render() {
        return (
            <Router>
                <div>
                    <Navbar loggedIn={this.state.loggedIn}/>
                    <Route exact path="/" component={Landing}/>
                    <Route exact path="/signup" component={Signup} />
                </div>
            </Router>
        )
    }
}

document.addEventListener('DOMContentLoaded', () => {
    ReactDom.render(
        <Layout />,
        document.getElementById('app')
    )
})
