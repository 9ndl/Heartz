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
    $("#deviceInfo").slideDown();
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
            $("#reminderTime").html(data.reminderInterval + " minutes");
            let startTime = "";
            if ((((parseInt(data.reminderStartHour) + 11) % 12) + 1) < 10){
                startTime = "0";
            }
            startTime = startTime + (((parseInt(data.reminderStartHour) + 11) % 12) + 1) + ":";
            if (parseInt(data.reminderStartMinute) < 10){
                startTime = startTime + "0";
            }
            startTime = startTime + data.reminderStartMinute;
            if (parseInt(data.reminderStartHour) >= 12){
                startTime = startTime + "PM";
            }
            else{
                startTime = startTime + "AM";
            }
            let endTime = "";
            if ((((parseInt(data.reminderEndHour) + 11) % 12) + 1) < 10){
                endTime = "0";
            }
            endTime =  endTime + (((parseInt(data.reminderEndHour) + 11) % 12) + 1) + ":";
            if (parseInt(data.reminderEndMinute) < 10){
                endTime = endTime + "0";
            }
            endTime = endTime + data.reminderEndMinute;
            if (parseInt(data.reminderEndHour) >= 12){
                endTime = endTime + "PM";
            }
            else{
                endTime = endTime + "AM";
            }
            $("#reminderPeriodStart").html(startTime);
            $("#reminderPeriodEnd").html(endTime);

            //$("#reminderPeriod").html(startTime + " - " + endTime);
        },
        error: function(jqXHR, textStatus, errorThrown){
            var response = JSON.parse(jqXHR.responseText);
            $("#error").html("Error: " + response.message);
            $("#error").show();
        }
    });
}

function changePeriod(){
    let newDeviceId = $(".select-dropdown .selected span").html();

    let newStartPeriod = $("#newPeriodStart").val();
    let newEndPeriod = $("#newPeriodEnd").val();

    if (newStartPeriod === ''){
        newStartPeriod = $("#reminderPeriodStart").text();
    }

    if (newEndPeriod === ''){
        newEndPeriod = $("#reminderPeriodEnd").text();
    }


    $.ajax({
        url: '/devices/setReminderPeriod',
        type: 'POST',
        headers: { 'x-auth': window.localStorage.getItem("authToken") },
        contentType: 'application/json',
        data: JSON.stringify({ deviceId: newDeviceId, startPeriod: newStartPeriod, endPeriod: newEndPeriod }), 
        dataType: 'json'
    })
        .done(function (data, textStatus, jqXHR) {
            $("#reminderPeriodStart").html(newStartPeriod);
            $("#reminderPeriodEnd").html(newEndPeriod);
            //$("#reminderPeriod").text(newStartPeriod + " - " + newEndPeriod);
            //hideChangePeriodForm();
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
            let response = JSON.parse(jqXHR.responseText);
            $("#error").html("Error: " + response.message);
            $("#error").show();
        }); 
}

function changeFrequency(){
    let newReminderInterval = $("#newFrequency").val();
    let newDeviceId = $(".select-dropdown .selected span").html();

    $.ajax({
        url: '/devices/setReminderInterval',
        type: 'POST',
        headers: { 'x-auth': window.localStorage.getItem("authToken") },
        contentType: 'application/json',
        data: JSON.stringify({ deviceId: newDeviceId, reminderInterval: newReminderInterval }), 
        dataType: 'json'
    })
        .done(function (data, textStatus, jqXHR) {
            $("#reminderTime").text(newReminderInterval + " minutes");
            //hideChangeFrequencyForm();
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
            let response = JSON.parse(jqXHR.responseText);
            $("#error").html("Error: " + response.message);
            $("#error").show();
        }); 
}

 // Show add device form and hide the add device button (really a link)
 function showChangeFrequencyForm() {
    hideChangePeriodForm();
    $("#newFrequency").val("");          // Clear the input for the device ID
    $("#changeFrequencyForm").slideDown(); // Show the add device form
  }
  
  // Hides the add device form and shows the add device button (link)
  function hideChangeFrequencyForm() {
    $("#changeFrequencyForm").slideUp();   // Show the add device form
    $("#error").hide();
  }
  function showChangePeriodForm(){
    hideChangeFrequencyForm();
    $("#newPeriodStart").val(""); 
    $("#newPeriodEnd").val(""); 
    $("#changePeriodForm").slideDown();
  }
  function hideChangePeriodForm(){
    $("#changePeriodForm").slideUp();
    $("#error").hide();
  }
  
$(function() {
    if (!window.localStorage.getItem("authToken")) {
      window.location.replace("index.html");
    }
    else {
      sendAccountRequest();
    }

    $("select").on('change', selectDevice);
    $("#savePeriod").click(changePeriod);
    $("#saveFrequency").click(changeFrequency);
  
    $("#changeFrequency").click(showChangeFrequencyForm);
    $("#changePeriod").click(showChangePeriodForm);
    $("#cancelFrequency").click(hideChangeFrequencyForm);
    $("#cancelPeriod").click(hideChangePeriodForm);
});