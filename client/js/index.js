import React from 'react'
import ReactDom from 'react-dom'
import { BrowserRouter as Router, Route, Switch, IndexRoute} from 'react-router-dom'

//HTML File
import indexHTML from '../index.html'
//CSS file
import mainCSS from '../main.scss'

//Components
import Layout from './components/layout.jsx'

document.addEventListener('DOMContentLoaded', () => {
    ReactDom.render(
        <Router>
            <Route path='/' component={Layout}>
            </Route>
        </Router>,
        document.getElementById('app')
    )
})
