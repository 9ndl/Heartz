console.log("here");
var Chart = require('chart.js');
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
    $('#main').show();
    let ctx = document.getElementById('bpmChart').getContext('2d');
    var myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
            datasets: [{
                label: '# of Votes',
                data: [12, 19, 3, 5, 2, 3],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    });
    // Add the devices to the list before the list item for the add device button (link)
    for (let device of data.devices) {
        $("#addDeviceForm").before("<li class='collection-item'>ID: " +
        device.deviceId + ", APIKEY: " + device.apikey + " </li>");
    }
    console.log(data.BPMResults);
    console.log(data.OXResults);
    console.log(data.BPMResults.length);
    if(data.BPMResults.length>0){
        $("#Results").show();
        for( let i = 0; i< data.BPMResults.length;++i){
        $("#tableReadings").append("<tr><td>"+data.timestamps[i].toString()+"</td><td>"+data.BPMResults[i]+"</td><td>"+data.OXResults[i]+"</td></tr>");
        }
    }
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
            " <button id='remove-" + $("#deviceId").val() + "' class='waves-effect waves-light black btn remove'>Remove</button> " +
            "</li>");
            $("#remove-"+$("#deviceId").val()).click(function(event) {
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

$(function() {
    if (!window.localStorage.getItem("authToken")) {
      window.location.replace("index.html");
    }
    else {
      sendAccountRequest();
    }
  
    // Register event listeners
    $("#addDevice").click(showAddDeviceForm);
    $("#registerDevice").click(registerDevice);  
    $("#cancel").click(hideAddDeviceForm);  
});