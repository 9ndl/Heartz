function sendSigninRequest() {
    //validation email.
    let emailReg = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,5}$/;
    if(emailReg.test($('#email').val()) && $('#password').val()!=""){
        $("#failMessage1").hide();
        $("#failMessage").hide();
        $.ajax({
            url: '/users/signin',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ email: $('#email').val(), password: $('#password').val() }),
            dataType: 'json'
          })  //call function done upon succes 
            .done(signinSuccess)
              //call fail function upon failuare
            .fail(signinFailure);
    }else if(!(emailReg.test($('#email').val()))){
        $("#failMessage").text("Invalid or missing email address.");
        $("#failMessage").css({color: "red"});
        $("#failMessage").show();
    }else if($('#password').val()==""){
        $("#failMessage1").text("Enter password please.");
        $("#failMessage1").css({color: "red"});
        $("#failMessage1").show();
    }
  }
    //function for seccuss
  function signinSuccess(data, testStatus, jqXHR) {
    console.log(data.authToken);
    window.localStorage.setItem('authToken', data.authToken);
    //window.location = "account.html";
    window.replace("account.html");
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
      window.location.replace("account.html");
    }
  
    $("#signin").click(sendSigninRequest);
    $("#password").keypress(function(event) {
        //for enter key
      if (event.which === 13) {
        sendSigninRequest();
      }
    });
  });