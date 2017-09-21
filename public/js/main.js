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

  //
  //
  //Dashboard Route
  //
  //Hide create group form on cancel
  $('.create-group-box>form>input[type="button"]').on('click', function() {
    $('.create-group').hide()
  })

})
