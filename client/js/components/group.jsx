import React from 'react'

let props

export default function Group(p) {
    props = p
    console.log(getGroupInfo())
    console.log('render components')

    return(
        <div className="m-group">
            <div className="m-group-headers-container">
                <h2>Test</h2>
            </div>
        </div>
    )
}

function* genGroup() {
    var response = yield fetch(`/group/${props.match.params.id}`)
    const group = yield response.json()
    return yield
}

function getGroupInfo() {
    const gen = genGroup()
    const promise = gen.next().value
    return promise.then(res => {
        const secondPromise = gen.next(res).value
        return secondPromise.then(secondRes => gen.next(secondRes))
    })



}


/*
axios.get(`/group/${props.match.params.id}`)
.then(res => {
return res.data.group
})
.catch(err => {
console.log(err)
//Handle error
})
*/
