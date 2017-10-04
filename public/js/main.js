$(document).ready(function() {
  //navbar
  $('.nav-dropdown').on('click', function(e) {
    e.preventDefault()
    $('.drop-menu').slideToggle({duration: 400})
  })
  //Index Route
  //Redirect to signup on click
  $('.hero-btn, .signup-btn').on('click', function() {
    window.location.href = '/signup'
  })

  //Redirect to login on click
  $('.login-btn').on('click', function() {
    window.location.href = '/login'
  })

  //Dashboard Route
  //Hide create group form on cancel
  $('.remove-collection-btn').on('click', function() {
      $('.dashboard').addClass('blur')
      $('.remove-from-collection').show();
  })

  $('.create-group-box>form>input[type="button"]').on('click', function() {
    $('.create-group').hide()
    $('.dashboard').removeClass('blur')
  })

  $('.new-group-btn').on('click', function() {
    $('.dashboard').addClass('blur')
    $('.create-group').show()
  })

  $('.add-to-collection-box>form>input[type="button"]').on('click', function() {
    $('.add-to-collection').hide()
    $('.dashboard').removeClass('blur')
  })

  $('.add-collection-btn').on('click', function() {
    $('.dashboard').addClass('blur')
    $('.add-to-collection').show()
  })

  $('.btn-cancel-remove-collection').on('click', function() {
    $('.remove-from-collection').hide()
    $('.dashboard').removeClass('blur')
  })

  //Group Route
  $('.add-book-to-group-btn').on('click', function() {
    $('.add-book-to-group-list').show()
    $('.group').addClass('blur')
  })

  $('.add-book-to-group-cancel-btn').on('click', function() {
    $('.add-book-to-group-list').hide()
    $('.group').removeClass('blur')
  })
})
