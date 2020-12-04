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
            $("#fullName").val() = newName;
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
  });