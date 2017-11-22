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
import Login from './components/login.jsx'
import Signup from './components/signup.jsx'
import Dashboard from './components/dash.jsx'
import Group from './components/group.jsx'
import Book from './components/book.jsx'
import Demo from './components/demo.jsx'

class Layout extends React.Component {
    constructor(props) {
        super(props)
        this.state = { loggedIn: false,
            user: null,
            updateState: this.updateState.bind(this),
            error: null,
            loginError: null,
            dashItem: 'Groups',
            currentGroup: null,
            dashAddToCollection: false,
            dashCreateGroup: false
        }
    }
    updateState(val) {
        this.setState(val)
    }
    handleRouteChange() {
        console.log('changed')
    }
    render() {
        return (
            <Router>
                <div>
                    <Navbar {...this.state}/>
                    <Route exact path="/demo" render={props => <Demo {...props} {...this.state} />}/>
                    <Route exact path="/" component={Landing}/>
                    <Route exact path="/login" render={props => <Login {...this.state} {...props}/>} />
                    <Route exact path="/signup" render={props => <Signup {...this.state} {...props}/>} />
                    <Route exact path="/dashboard" render={props => <Dashboard {...this.state} {...props}/>} />
                    <Route exact path="/group/:id" render={props => {
                        return(<Group
                            {...this.state}
                            {...props}
                        />
                        )
                    }} />
                    <Route exact path="/book/:id/:owner" render={props => <Book {...this.state} {...props} /> } />
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
