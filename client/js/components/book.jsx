import React from 'react'
import axios from 'axios'
import {Redirect} from 'react-router-dom'

export default class Book extends React.Component {
    constructor(props) {
        super(props)
        this.handleRequestToborrow = this.handleRequestToborrow.bind(this)
        this.handleRequestToReturn = this.handleRequestToReturn.bind(this)
        this.state = {
            book: null,
            error: null,
            msg: null,
        }
        axios.get(`/book/${props.match.params.id}?owner=${props.match.params.owner}`)
        .then(res => {
            if(res.data.error) console.log(res.data.error)
            this.setState({book: res.data.book})
        })
    }
    handleRequestToReturn(bookId, ownerId) {
        axios.post(`/book/${bookId}?owner=${ownerId}&request=return`)
        .then(res => {
            if(res.data.error) {
                this.setState({error: res.data.error, msg: null})
                return console.log(res.data.error)
            }
            this.setState({error: null, msg: 'Request sent!'})
        })
    }
    handleRequestToborrow(bookId, ownerId, groupId) {
        axios.post(`/book/${bookId}?owner=${ownerId}&group=${groupId}&request=borrow`)
        .then(res => {
            if(res.data.error) {
                this.setState({error: res.data.error, msg: null})
                return console.log(res.data.error)
            }
            this.setState({error: null, msg: res.data})
        })
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
                    {this.state.error ?
                        <h4 style={{alignSelf: 'center', color: '#FF0000'}}>{this.state.error}</h4>
                        : null
                    }
                    {this.state.msg ?
                        <h4 style={{alignSelf: 'center', color: '#03EB60'}}>{this.state.msg}</h4>
                        : null
                    }
                    {book.borrower && book.borrower === this.props.user.username ?
                        <button onClick={() => this.handleRequestToReturn(book._id, book.owner._id)}>Request to return the book</button>
                        : null
                    }
                    {!book.borrower && book.owner._id != this.props.user._id ?
                        <button onClick={() => this.handleRequestToborrow(book._id, book.owner._id, book.group._id)}>Request to borrow</button>
                        : null
                    }
                </div>
            </div>
        )
    }
}
