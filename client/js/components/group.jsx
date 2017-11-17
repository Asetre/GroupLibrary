import React from 'react'
import axios from 'axios'

import GroupItem from './group-item.jsx'

export default class Group extends React.Component {
    constructor(props) {
        super(props)
        this.handleAddBookButton = this.handleAddBookButton.bind(this)
        this.state = {
            group: null,
            groupItem: 'Available Books',
            updateState: this.updateState.bind(this)
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
        this.setState({groupItem: 'Add a book from your collection'})
    }

    render() {
        let group = this.state.group
        if(!group) return <h3>Loading</h3>

        return(
            <div className="m-group">
                <div className="group-head">
                    <h3>Group</h3>
                </div>
                <div className="m-group-headers-container">
                    <h2>{group.name}</h2>
                    <div>
                        <h5>{group.books.length} Available books</h5>
                        <h5>{group.users.length} Members</h5>
                    </div>
                </div>
                <button>Invite a user</button>
                <button onClick={this.handleAddBookButton}>Add a book</button>
                <form action="#">
                    <input type="text" placeholder="username" required/>
                    <input type="submit" value="Send invite"/>
                </form>
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
