function sendAccountRequest() {
    $.ajax({
        url: '/users/home',
        method: 'GET',
        headers: { 'x-auth' : window.localStorage.getItem("authToken") },
        dataType: 'json'
    })
        .done(accountInfoSuccess)
        .fail(accountInfoError);
}
  
function accountInfoSuccess(data, textStatus, jqXHR) {
    let date = new Date();

    let i = 1;
    $("#deviceSelect").append('<option class="black-text" value="" disabled selected>Select a Device</option>');
    //$("#deviceSelect").append('<option value="'+ i + '">Device 1</option>');
    //$("#deviceSelect").append('<option value="2">Device 1</option>');
    // Add the devices to the list before the list item for the add device button (link)
   
    for (let device of data.devices) {
        $("#deviceSelect").append('<option class="black-text" value="' + i + '">'+ device.deviceId + '</option>');
        i++;
    }
    $("select").formSelect();
    $('#main').show();
    //$(".select-wrapper").prepend('<button id="registerDevice" class="waves-effect waves-light black btn right">Register</button>');
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

function selectDevice(){
    let deviceId = $(".select-dropdown .selected span").html();
    getDeviceInfo(deviceId);
}

function getDeviceInfo(deviceId){
    $.ajax({
        url: '/devices/info',
        type: 'POST',
        headers: { 'x-auth': window.localStorage.getItem("authToken") },
        data: { 'deviceId': deviceId },
        responseType: 'json',
        success: function(data, textStatus, jqXHR){
            $("#deviceID").html(data.deviceId);
            $("#apiKey").html(data.apiKey);
            $("#reminderTime").html(data.reminderTime);
            let startTime = ((parseInt(data.reminderStartHour) + 11) % 12) + ":" + data.reminderStartMinute;
            if (parseInt(data.reminderStartHour) >= 12){
                startTime = startTime + "PM";
            }
            else{
                startTime = startTime + "AM";
            }
            let endTime = ((parseInt(data.reminderEndHour) + 11) % 12) + ":" + data.reminderEndMinute;
            if (parseInt(data.reminderEndHour) >= 12){
                endTime = endTime + "PM";
            }
            else{
                endTime = endTime + "AM";
            }
            $("#reminderPeriod").html(startTime + " - " + endTime);
        },
        error: function(jqXHR, textStatus, errorThrown){
            var response = JSON.parse(jqXHR.responseText);
            $("#error").html("Error: " + response.message);
            $("#error").show();
        }
    });
}
  
$(function() {
    if (!window.localStorage.getItem("authToken")) {
      window.location.replace("index.html");
    }
    else {
      sendAccountRequest();
    }

    $("select").on('change', selectDevice);
  
    // Register event listeners
    //$("#addDevice").click(showAddDeviceForm);
    //$("#registerDevice").click(registerDevice);  
    //$("#cancel").click(hideAddDeviceForm);  
});