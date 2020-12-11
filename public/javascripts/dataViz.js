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
  let dailyBPMchartValues = [];
  let dailyOXChartValues =[];
  let dayBPMAverage = new Number;
  let dayOXAverage = new Number;
  if(data.Readings.length > 0){
    for (let read of data.Readings){
      dailyBPMchartValues.push({x:new Date(read.timestamp), y: read.BPMreading});
      dailyOXChartValues.push({x:new Date(read.timestamp), y: read.O2reading});
      dayBPMAverage += read.BPMreading;
      dayOXAverage += read.O2reading;
      let date = new Date(read.timestamp);
      $("#tableReadings").append("<tr><td>"+date+"</td><td>"+read.BPMreading+"</td><td>"+read.O2reading+"</td></tr>");
    }
    dayBPMAverage = dayBPMAverage/data.Readings.length;
    dayOXAverage = dayOXAverage/data.Readings.length;
    $("#Results").show();
  }
  //BPM
  var dailyBPMChart = new CanvasJS.Chart("chartContainer1", {
    animationEnabled: true,  
    title:{
      text: "Heart Beat Monitor"
    },
    axisY: {
      title: "Beat per Minute",
      valueFormatString: "##0 ",
      suffix: "BPM",
      stripLines: [{
        value: dayBPMAverage,
        label: "Average"
      }]
    },
    data: [{
      yValueFormatString: "###.## BPM",
      xValueFormatString: "h:mm TT",
      type: "line",
      lineColor: "red",
      markerColor: "red",
      dataPoints: dailyBPMchartValues
    }]
  });
  dailyBPMChart.render();
  var dailyOXChart = new CanvasJS.Chart("chartContainer2", {
    animationEnabled: true,  
    title:{
      text: "Oxygen Level Monitor"
    },
    axisY: {
      title: "Percent",
      valueFormatString: "### ",
      maximum: 100,
      suffix: "%",
      stripLines: [{
        value: dayOXAverage,
        label: "Average"
      }]
    },
    data: [{
      yValueFormatString: "##.##'%'",
      xValueFormatString: "h:mm TT",
      type: "line",
      lineColor: "#0cc288",
      markerColor: "#0cc288",
      dataPoints: dailyOXChartValues
    }]
  });
  dailyOXChart.render();
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