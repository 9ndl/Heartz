if (!window.localStorage.getItem("authToken")) {
    window.location.replace("index.html");
  }
  
  function sendAccountRequest() {
    $.ajax({
      url: '/users/account',
      method: 'GET',
      headers: { 'x-auth' : window.localStorage.getItem("authToken") },
      dataType: 'json'
    })
      .done(accountInfoSuccess)
      .fail(accountInfoError);
  }
  
  function accountInfoSuccess(data, textStatus, jqXHR) {
    let date = new Date();
    $('#email').html(data.email);
    $('#fullName').html(data.fullName);
    $('#lastAccess').html(data.lastAccess);
    $('#main').show();
  }
  
  function accountInfoError(jqXHR, textStatus, errorThrown) {
    // If authentication error, delete the authToken 
    // redirect user to sign-in page (which is index.html)
    if (jqXHR.status == 401) {
      window.localStorage.removeItem("authToken");
      window.location = "index.html";
    } 
    else {
      $("#error").html("Error: " + jqXHR.status);
      $("#error").show();
    }
  }
  
  // Registers the specified device with the server.
  function registerDevice() {
    $.ajax({
      url: '/devices/register',
      type: 'POST',
      headers: { 'x-auth': window.localStorage.getItem("authToken") },  
      contentType: 'application/json',
      data: JSON.stringify({ deviceId: $("#deviceId").val() }), 
      dataType: 'json'
      })
        .done(function (data, textStatus, jqXHR) {
          // Add new device to the device list
          $("#addDeviceForm").before("<li class='collection-item'>ID: " +
          $("#deviceId").val() + ", APIKEY: " + data["apikey"] + 
            //" <button id='ping-" + $("#deviceId").val() + "' class='waves-effect waves-light black btn ping'>Ping</button> " +
            " <button id='remove-" + $("#deviceId").val() + "' class='waves-effect waves-light black btn inline-button'>Remove</button> " +
            "</li>");
          $("#remove-"+$("#deviceId").val()).click(function(event) {
            //pingDevice(event, $("#deviceId").val());
            removeDevice(event, $("#deviceId").val());
          });
          hideAddDeviceForm();
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
          let response = JSON.parse(jqXHR.responseText);
          $("#error").html("Error: " + response.message);
          $("#error").show();
        }); 
  }

  function changeName(){
    var newName = $("#newName").val();
    $.ajax({
        url: '/users/update',
        type: 'POST',
        headers: { 'x-auth': window.localStorage.getItem("authToken") },  
        contentType: 'application/json',
        data: JSON.stringify({ fullName: newName }), 
        dataType: 'json'
        })
          .done(function (data, textStatus, jqXHR) {
            //$("#fullName").val() = newName;
            $("#fullName").text(newName);
            hideChangeNameForm();
          })
          .fail(function(jqXHR, textStatus, errorThrown) {
            let response = JSON.parse(jqXHR.responseText);
            $("#error").html("Error: " + response.message);
            $("#error").show();
          }); 
  }

  // Show add device form and hide the add device button (really a link)
  function showChangeNameForm() {
    $("#newName").val("");          // Clear the input for the device ID
    $("#changeNameForm").slideDown(); // Show the add device form
  }
  
  // Hides the add device form and shows the add device button (link)
  function hideChangeNameForm() {
    $("#changeNameForm").slideUp();   // Show the add device form
    $("#error").hide();
  }
  function showChangePassForm(){
    $("#changePasswordForm").slideDown();
  }
  function hideChangePassForm(){
    $("#currPass").val("");
    $("#newPass").val("");
    $("#cnfPass").val("");
    $("#failMessage1").slideUp();
    $("#failMessage1").html("");
    $("#failMessage2").slideUp();
    $("#failMessage2").html("");
    $("#changePasswordForm").slideUp();
  }
  function savePass(){
    //let currPass = $("#currPass").val();
    let newPass = $("#newPass").val();
    let cnfPass = $("#cnfPass").val();
    let flag = 0;
    let passReg = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,15}$/; 
    if(!passReg.test(newPass)){
      flag = 1;
      $('#failMessage1').html("<span>Password is not strong enough!"
                                +"<ol><li>At least one capital letter</li>"
                                +"<li>At least one lower case letter</li>"
                                +"<li>At least one number</li>"
                                +"<li>At least one lower special character</li>"
                                +"</ol>");
      $('#failMessage1').css({color: "red"});
      $("#failMessage1").show();
    }
    if(newPass != cnfPass){
      $('#failMessage2').html("<span>Passwords do not match.</span>");
      $('#failMessage2').css({color: "red"});
      $('#failMessage2').show();
      flag = 1;
    }
    if (flag == 0){
      $.ajax({
        url: '/users/changepass',
        type: 'POST',
        headers: { 'x-auth': window.localStorage.getItem("authToken") },  
        contentType: 'application/json',
        data: JSON.stringify({ newPassword: newPass }), 
        dataType: 'json'
        })
        .done(function(data, textStatus, jqXHR){
          window.localStorage.removeItem("authToken");
          window.location.replace("index.html");
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
          let response = JSON.parse(jqXHR.responseText);
          $("#error").html("Error: " + response.message);
          $("#error").show();
        });
    }
  } 
  

  $(function() {
    if (!window.localStorage.getItem("authToken")) {
      window.location.replace("index.html");
    }
    else {
      sendAccountRequest();
    }
  
    // Register event listeners
    $("#changeName").click(showChangeNameForm); 
    $("#saveName").click(changeName);
    $("#cancelName").click(hideChangeNameForm);
    $("#changePass").click(showChangePassForm);
    $("#cancelPass").click(hideChangePassForm);
    $("#savePass").click(savePass);
  });