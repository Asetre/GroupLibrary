import React from 'react'
import axios from 'axios'

let props
export default function Demo(p) {
    props = p
    return(
        <div className="demo-container">
            <h2>Demonstration Account</h2>
            <h4 style={{color: '#f46842'}}>All information related to this account is reset every hour</h4>
            <h4>You can use another demonstation account to interact with this one</h4>
            <h5 style={{margin: '10px 0'}}>username:     anothertestuser</h5>
            <h5 style={{marginBotton: '20px'}}>password:     testtest</h5>
            <a href="https://github.com/Asetre/GroupLibrary" rel="noopener noreferrer" target="_blank" >Github and documentation here.</a>
            <button onClick={handleDemoLogin}>Login to demo account</button>
        </div>
    )
}

function handleDemoLogin() {
    axios.post('/user/login', {
        username: 'testuser',
        password: 'testtest'
    })
    .then(res => {
        if(res.data.error) throw res.data.error
        if(res.data.user) {
            props.updateState({user: res.data.user, error: null, loggedIn: true});
            props.history.push('/dashboard')
        }
    })
    .catch(err => {
        console.log(err)
        //Handle error
    })
}
