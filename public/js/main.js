$(document).ready(function() {
  //
  //
  //Index Route
  //
  //
  //Redirect to signup on click
  $('.hero-btn, .signup-btn').on('click', function() {
    window.location.href = '/signup'
  })

  //Redirect to login on click
  $('.login-btn').on('click', function() {
    window.location.href = '/login'
  })

})
