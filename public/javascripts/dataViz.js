console.log("here");
//const express = require('express');
//let Chart = require('../../node_modules/chart.js');
if (!window.localStorage.getItem("authToken")) {
    window.location.replace("index.html");
}

function sendAccountRequest() {
    $.ajax({
        url: '/users/visual',
        method: 'GET',
        headers: { 'x-auth' : window.localStorage.getItem("authToken") },
        dataType: 'json'
    })
    .done(accountInfoSuccess)
    .fail(accountInfoError);
}

function accountInfoSuccess(data, textStatus, jqXHR) {
    $('#main').show();
    console.log("response recived");

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



$(function() {
    if (!window.localStorage.getItem("authToken")) {
      window.location.replace("index.html");
    }
    else {
      sendAccountRequest();
    }
  
    // Register event listeners
    // $("#addDevice").click(showAddDeviceForm);
    // $("#registerDevice").click(registerDevice);  
    // $("#cancel").click(hideAddDeviceForm);  
});