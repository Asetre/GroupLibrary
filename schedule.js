const exec = require('child_process').exec;

function resetDemoAccount() {
    console.log('test')
    exec("ls", function(err) {
        if(err) console.log(err)
    })
}

resetDemoAccount()
