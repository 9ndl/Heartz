function sendRegisterRequest() {
    let email = $('#email').val();
    let password = $('#password').val();
    let fullName = $('#fullName').val();
    let passwordConfirm = $('#passwordConfirm').val();
    let emailReg = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,5}$/;
    let pwdReg =/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,15}$/;


    // Check to make sure the passwords match
    // FIXME: Check to ensure strong password 
    if (!emailReg.test(email)){

      $('#failMessage1').text("Invalid email address!");
      $("#failMessage1").css({color: "red"});
      $('#failMessage1').show();
    }
    if (!pwdReg.test(password)){
      $('#failMessage2').html("<span>Password is not strong enough!"
                                +"<ol><li>At least one capital letter</li>"
                                +"<li>At least one lower case letter</li>"
                                +"<li>At least one number</li>"
                                +"<li>At least one lower special character</li>"
                                +"</ol>");
      $('#failMessage2').css({color: "red"});
      $("#failMessage2").show();
      
    }
    if (password != passwordConfirm) {
      $('#failMessage3').html("<span>Passwords do not match.</span>");
      $('#failMessage3').css({color: "red"});
      $('#failMessage3').show();
    }
    
    $.ajax({
      url: '/users/register',
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({email:email, fullName:fullName, password:password}),
      dataType: 'json'
    })
      .done(registerSuccess)
      .fail(registerError);
  }
  
  function registerSuccess(data, textStatus, jqXHR) {
    if (data.success) {  
      console.log(data.message)
      //window.location = "index.html";
    }
    else {
      $('#ServerResponse').html("<span class='red-text text-darken-2'>Error: " + data.message + "</span>");
      $('#ServerResponse').show();
    }
  }
  
  function registerError(jqXHR, textStatus, errorThrown) {
    if (jqXHR.statusCode == 404) {
      $('#ServerResponse').html("<span class='red-text text-darken-2'>Server could not be reached.</p>");
      $('#ServerResponse').show();
    }
    else {
      $('#ServerResponse').html("<span class='red-text text-darken-2'>Error: " + jqXHR.responseJSON.message + "</span>");
      $('#ServerResponse').show();
    }
  }
  
  $(function () {
    $('#signup').click(sendRegisterRequest);
  });
  