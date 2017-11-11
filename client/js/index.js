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
import Dashboard from './components/dash.jsx'

class Layout extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            loggedIn: false,
            user: null,
            updateState: this.updateState.bind(this),
            error: null,
            status: 'loggedOut',
            redirect: false,
            dashItem: 'Groups'
        }
    }

    updateState(val) {
        this.setState(val)
    }

    render() {
        return (
            <Router>
                <div>
                    <Navbar loggedIn={this.state.loggedIn}/>
                    <Route exact path="/" component={Landing}/>
                    <Route exact path="/signup" render={() => <Signup {...this.state}/>}/>
                    <Route exact path="/dashboard" render={() => <Dashboard {...this.state}/>}/>
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
