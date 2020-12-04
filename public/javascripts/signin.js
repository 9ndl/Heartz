function sendSigninRequest() {
    //validation email.
    let emailReg = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,5}$/;
    if(emailReg.test($('#email').val()) && $('#password').val()!=""){
       //hide messages 
      $("#failMessage1").hide();
      $("#failMessage").hide();
      //call post
      $.ajax({
        url: '/users/signin',
        method: 'POST',
        contentType: 'application/json',
        //data structure
        data: JSON.stringify({ email: $('#email').val(), password: $('#password').val() }),
        dataType: 'json'
      })//call function done upon succes 
        .done(signinSuccess)
        //call fail function upon failuare
        .fail(signinFailure);
    }else if(!(emailReg.test($('#email').val()))){
        $("#failMessage1").hide();
        $("#failMessage").text("Invalid or missing email address.");
        $("#failMessage").css({color: "red"});
        $("#failMessage").show();
    }else if($('#password').val()==""){
        $("#failMessage").hide();
        $("#failMessage1").text("Enter password please.");
        $("#failMessage1").css({color: "red"});
        $("#failMessage1").show();
    }
  }
    //function for seccuss
  function signinSuccess(data, testStatus, jqXHR) {
    //store authentication token
    window.localStorage.setItem('authToken', data.authToken);
    window.location = "home.html";
    //window.replace("home.html");
  }
    //function for failure
  function signinFailure(jqXHR, testStatus, errorThrown) {
      //check status to find the error code
    if (jqXHR.status == 401 ) {
        //<span class='red-text text-darken-2'>Error:
       $('#ServerResponse').html("<span class='red-text'>Error: " +
                                 jqXHR.responseJSON.message +"</span>");
        //show the message
        $('#ServerResponse').show();
    }
    else {
        // error is server couldnt be reached
       $('#ServerResponse').html("<span class='red-text'>Server could not be reached.</span>");
       $('#ServerResponse').show();
    }
  }
  //start code when page is loaded
  $(function() {
      //this is when we start using authentication the if statement executes
    if( window.localStorage.getItem("authToken") ) {
      window.location.replace("home.html");
    }
  
    $("#signin").click(sendSigninRequest);
    $("#password").keypress(function(event) {
        //for enter key
      if (event.which === 13) {
        sendSigninRequest();
      }
    });
  });