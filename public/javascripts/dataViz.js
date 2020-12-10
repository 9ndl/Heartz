console.log("here");
//let Chart = require('../../node_modules/chart.js');
if (!window.localStorage.getItem("authToken")) {
    window.location.replace("index.html");
}

function sendVisualsRequest() {
    $.ajax({
        url: '/users/visual',
        method: 'GET',
        headers: { 'x-auth' : window.localStorage.getItem("authToken") },
        dataType: 'json'
    })
    .done(visualSuccess)
    .fail(visualError);
}

function visualSuccess(data, textStatus, jqXHR) {
    console.log(data.Readings.length);
    //let todayTime = new Date.now();
    //let epochTime = Math.floor((new Date(todayTime.getFullYear(),todayTime.getMonth()+1,todayTime.getDate()).getTime())/1000.0);
    //console.log(epochTime);
  if(data.Readings.length > 0){
    for (let read of data.Readings){
      //console.log(read.timestamp.getTime());
      let date = new Date(read.timestamp);
      $("#tableReadings").append("<tr><td>"+date+"</td><td>"+read.BPMreading+"</td><td>"+read.O2reading+"</td></tr>");
    }
    $("#Results").show();
  }
    $('#main').show();
    

}

function visualError(jqXHR, textStatus, errorThrown) {
    // If authentication error, delete the authToken 
    // redirect user to sign-in page (which is index.html)
    if (jqXHR.status == 401) { // it should be 401
        window.localStorage.removeItem("authToken");
        window.location = "index.html";
    } 
    else {
        $("#error").html("Error: " + jqXHR.status);
        $("#error").show();
    }
}



$(function() {
    if (!window.localStorage.getItem("authToken")) {
      window.location.replace("index.html");
    }
    else {
      sendVisualsRequest();
    }
  
    // Register event listeners
    // $("#addDevice").click(showAddDeviceForm);
    // $("#registerDevice").click(registerDevice);  
    // $("#cancel").click(hideAddDeviceForm);  
});