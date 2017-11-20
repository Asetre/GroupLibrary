import React from 'react'
import axios from 'axios'
import {Redirect} from 'react-router-dom'

export default class Book extends React.Component {
    constructor(props) {
        super(props)
        this.handleRequestToborrow = this.handleRequestToborrow.bind(this)
        this.state = {
            book: null
        }
        axios.get(`/book/${props.match.params.id}?owner=${props.match.params.owner}`)
        .then(res => {
            if(res.data.error) console.log(res.data.error)
            this.setState({book: res.data.book})
        })
    }

    handleRequestToborrow() {
        //make request to server
    }

    render() {
        let book = this.state.book
        if(!book) return null
        if(!this.props.loggedIn) return <Redirect to="/" />
        return(
            <div className="m-book">
                <div className="m-book-head">
                    <h3>Book</h3>
                </div>
                <div className="m-book-container">
                    <h3>{book.title}</h3>
                    <h5>by: {book.author}</h5>

                    {book.description ?
                        <div>
                            <h4>Description</h4>
                            <p>{book.description}</p>
                        </div>
                        :null
                    }
                    <h4>Owned by: {book.owner.username}</h4>
                    {book.borrower ?
                        <h4>Borrowed by: {book.borrower}</h4>
                        : null
                    }
                    {!book.borrower && book.owner._id != this.props.user._id ?
                        <button>Request to borrow</button>
                        : null
                    }
                </div>
            </div>
        )
    }
}
