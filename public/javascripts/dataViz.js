
//let Chart = require('../../node_modules/chart.js');
if (!window.localStorage.getItem("authToken")) {
    window.location.replace("index.html");
}
let flag = 0;
function sendDailyVisualsRequest() {
  flag = 0;
  $("#previewHeader").html("Daily Preview");
    $.ajax({
        url: '/users/dailyvisual',
        method: 'GET',
        headers: { 'x-auth' : window.localStorage.getItem("authToken") },
        dataType: 'json'
    })
    .done(visualSuccess)
    .fail(visualError);
}

function visualSuccess(data, textStatus, jqXHR) {
  let str;
  let subtitle;
  let minMaxAverageBPM = [];
  let minMaxAverageOX = [];
  let dailyBPMchartValues = [];
  let dailyOXChartValues =[];
  let dayBPMAverage = new Number;
  let dayOXAverage = new Number;
  let dayBPMMax = Number.parseInt(0);
  let dayBPMMin = Number.parseInt(0);
  let dayOXMax = Number.parseInt(0);
  let dayOXMin = Number.parseInt(0);
  if(data.Readings.length > 0){
    dayBPMMin = data.Readings[0].BPMreading;
    dayOXMin = data.Readings[0].O2reading;
    for (let read of data.Readings){
      dailyBPMchartValues.push({x:new Date(read.timestamp), y: read.BPMreading});
      dailyOXChartValues.push({x:new Date(read.timestamp), y: read.O2reading});
      dayBPMAverage += read.BPMreading;
      if(dayBPMMax < read.BPMreading ){
        dayBPMMax = read.BPMreading;
      }
      if(dayBPMMin > read.BPMreading){
        dayBPMMin = read.BPMreading;
      }
      dayOXAverage += read.O2reading;
      if(dayOXMax < read.O2reading ){
        dayOXMax = read.O2reading;
      }
      if(dayOXMin > read.O2reading){
        dayOXMin = read.O2reading;
      }
    }
    dayBPMAverage = dayBPMAverage/data.Readings.length;
    dayOXAverage = dayOXAverage/data.Readings.length;
  }
  
  if (flag == 0){
    str = "h:mm TT";
    subtitle = "Last 24 Hours";
    minMaxAverageBPM = [{value: dayBPMMax, label: "Maximum",showOnTop: true},
                        {value: dayBPMMin, label: "Minimum",showOnTop: true}];
    minMaxAverageOX = [{value: dayOXMax, label: "Maximum",showOnTop: true},
                       {value: dayOXMin, label: "Minimum",showOnTop: true}]
  }else{
    str = "DDD h:mm TT";
    minMaxAverageBPM = [{value: dayBPMAverage, label: "Average", showOnTop: true},
                        {value: dayBPMMax, label: "Maximum", showOnTop: true},
                        {value: dayBPMMin, label: "Minimum",showOnTop: true}];
    minMaxAverageOX = [{value: dayOXAverage, label: "Average",showOnTop: true},
                       {value: dayOXMax, label: "Maximum",showOnTop: true},
                       {value: dayOXMin, label: "Minimum",showOnTop: true}]
    subtitle = "Last 7 Days";
  }
  var dailyBPMChart = new CanvasJS.Chart("chartContainer1", {
    animationEnabled: true,  
    title:{
      text: "Heart Beat Monitor",
      fontFamily: "Geneva"
    },
    subtitles:[
      {text: subtitle,
       fontFamily: "Geneva"
      }],
    axisX:{
      title: "Time"
    },
    axisY: {
      title: "Beat per Minute",
      valueFormatString: "##0 ",
      suffix: "BPM",
      minimum: 0,
      stripLines: minMaxAverageBPM
    },
    data: [{
      yValueFormatString: "###.## BPM",
      xValueFormatString: str,
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
      text: "Oxygen Level Monitor",
      fontFamily: "Geneva"
    },
    
    subtitles:[
      {
        text: subtitle,
        fontFamily: "Geneva"
      }
      ],
    axisX:{
        title: "Time",
    },
    axisY: {
      title: "Percent",
      valueFormatString: "### ",
      maximum: 100,
      suffix: "%",
      stripLines: minMaxAverageOX
    },
    data: [{
      yValueFormatString: "##.##'%'",
      xValueFormatString: str,
      type: "line",
      lineColor: "#0cc288",
      markerColor: "#0cc288",
      dataPoints: dailyOXChartValues
    }]
  });
  dailyOXChart.render();
  $('#main').show();
}
function sendWeeklyVisualsRequest() {
  $("#previewHeader").html("Weekly Preview");
  flag = 1;
  $.ajax({
    url: '/users/weeklyvisual',
    method: 'GET',
    headers: { 'x-auth' : window.localStorage.getItem("authToken") },
    dataType: 'json'
    })
    .done(visualSuccess)
    .fail(visualError);
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
      sendDailyVisualsRequest();
      // Register event listeners
      $("#dailyView").click(sendDailyVisualsRequest);
      $("#weeklyView").click(sendWeeklyVisualsRequest);
    }
  
    
      
    // $("#cancel").click(hideAddDeviceForm);  
});