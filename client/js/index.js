import React from 'react'
import ReactDom from 'react-dom'
import {BrowserRouter as Router, Route, IndexRoute} from 'react-router-dom'

//HTML File
import indexHTML from '../index.html'
//CSS file
import mainCSS from '../main.scss'
//Components
//import Layout from './components/layout.jsx'
import Landing from './components/landing.jsx'
import Navbar from './components/navbar.jsx'

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
                    <Route path="/" component={Landing}/>
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
