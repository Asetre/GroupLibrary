import React from 'react'
import axios from 'axios'
import {Redirect} from 'react-router-dom'

import GroupItem from './group-item.jsx'

export default class Group extends React.Component {
    constructor(props) {
        super(props)
        this.handleAddBookButton = this.handleAddBookButton.bind(this)
        this.handleCancelAddBookButton = this.handleCancelAddBookButton.bind(this)
        this.handleInviteUserButton = this.handleInviteUserButton.bind(this)
        this.handleCancelInviteuserButton = this.handleCancelInviteuserButton.bind(this)
        this.handleSendInvite =  this.handleSendInvite.bind(this)

        this.state = {
            group: null,
            groupItem: 'Available Books',
            updateState: this.updateState.bind(this),
            showInviteForm: false,
            showCancelAddBookBtn: false,
            inviteUserFormErrors: null,
            invitedUserSuccess: false,
        }
        axios.get(`/group/${props.match.params.id}`)
        .then(res => {
            this.setState({group: res.data.group})
        })
    }

    updateState(val) {
        this.setState(val)
    }

    handleAddBookButton(e) {
        e.preventDefault()
        this.setState({groupItem: 'Add a book from your collection', showCancelAddBookBtn: true, showInviteForm: false})
    }
    handleInviteUserButton(e) {
        e.preventDefault()
        this.setState({showInviteForm: true, groupItem: 'Available Books', showCancelAddBookBtn: false})
    }
    handleCancelInviteuserButton(e) {
        e.preventDefault()
        this.setState({showInviteForm: false, invitedUserSuccess: false})
    }
    handleCancelAddBookButton(e) {
        this.setState({groupItem: 'Available Books', showCancelAddBookBtn: false})
    }
    handleSendInvite(e) {
        e.preventDefault()
        let username = e.target.username.value
        axios.post(`/group/${this.state.group._id}/send-invite`, {username: username})
        .then(res => {
            this.setState({inviteUserFormErrors: res.data.error, invitedUserSuccess: false})
            if(!res.data.error) this.setState({showInviteForm: false, invitedUserSuccess: true})
        })
    }

    render() {
        if(!this.props.loggedIn) return <Redirect to="/" />

        let group = this.state.group
        if(!group) return <h3>Loading</h3>

        return(
            <div>
                <div className="group">
                    
                </div>

                <div className="m-group">
                    <div className="group-head">
                        <h3>Group</h3>
                    </div>
                    <div className="m-group-headers-container">
                        <h2>{group.name}</h2>
                        <div>
                            <h5>{group.books.length} Available books</h5>
                            <h5>{group.users.length} Member(s)</h5>
                        </div>
                    </div>
                    {this.state.invitedUserSuccess ?
                        <h5>Sent Invite!</h5>
                        : null
                    }
                    <div className="btn-container">
                        <button id="m-btn-group-invite" onClick={this.handleInviteUserButton}>Invite a user</button>
                        <button onClick={this.handleAddBookButton}>Add a book</button>
                    </div>

                    {this.state.showCancelAddBookBtn ?
                        <button onClick={this.handleCancelAddBookButton}>Cancel</button>
                        : null
                    }
                    {this.state.showInviteForm ?
                        <form action="#" onSubmit={this.handleSendInvite}>
                            <div className="m-form-errors-container">
                                <h4>{this.state.inviteUserFormErrors}</h4>
                            </div>
                            <input type="text" name="username" placeholder="username" required/>
                            <input type="submit" value="Send invite"/>
                            <input type="button" onClick={this.handleCancelInviteuserButton} value="Cancel"/>
                        </form>
                        : null
                    }

                    <div className="m-group-info-headers">
                        <h4>{this.state.groupItem}</h4>
                        <div>
                            <h6>title</h6>
                            <h6>author</h6>
                        </div>
                    </div>
                    <div className="m-group-item">
                        <GroupItem groupState={this.state} appState={this.props}/>
                    </div>
                </div>
            </div>
        )
    }
}

/*
function* genGroup() {
var response = yield fetch(`/group/${props.match.params.id}`)
var group = yield response.json()
stuff = group
var groupIinfo = yield group
}

function getGroupInfo() {
let generator = genGroup()
let promiseOne = generator.next().value
promiseOne.then(res => generator.next(res).value)
.then(res => )
.catch(err => {
console.log(err)
//Handle error
})
}

axios.get(`/group/${props.match.params.id}`)
.then(res => {
return res.data.group
})
.catch(err => {
console.log(err)
//Handle error
})
*/
