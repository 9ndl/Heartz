//-------------------------------------------------------------------

#include <Wire.h>
#include "MAX30105.h"
#include "spo2_algorithm.h"
#include "BPMMonitorSM.h"
#include "SaveData.h"

//-------------------------------------------------------------------

using namespace std;

//-------------------------------------------------------------------

unsigned long lastSync = millis();
SaveData timeData = load();   // loads in the saved EEPROM data

int reminderInterval(){ // variable calculation exposed to the cloud, acts as a getter for the amount of time between reminder intervals
   return (int)(timeData.reminderInterval / ONE_MINUTE_MILLIS);
}

// variable calculation exposed to the cloud, acts as a getter for the time period when reminders are active
// exposes in the format startHour:startMinute-endHour:endMinute
String reminderPeriod(){   
   char period[15];
   sprintf(period, "%d:%d-%d:%d", timeData.periodStartHour, timeData.periodStartMinute, timeData.periodEndHour, timeData.periodEndMinute);
   return period;
}

// function exposed to the cloud, acts as a setter for the amount of time between reminders
int setReminderInterval(String interval){
   int timeInterval;
   sscanf(interval.c_str(), "%d", &timeInterval);  //extracts reminder interval from string
   timeData.reminderInterval = timeInterval * ONE_MINUTE_MILLIS;  //converts value from minutes to milliseconds
   save(timeData);   //saves the timedata to the EEPROM
   Serial.print("Saved interval: ");
   Serial.println(interval);
   return 0;
}

// function exposed to the cloud, acts as a setter for the time period when reminders are active
int setReminderPeriod(String period){
   sscanf(period.c_str(), "%d:%d-%d:%d", &(timeData.periodStartHour), &(timeData.periodStartMinute), &(timeData.periodEndHour), &(timeData.periodEndMinute));
   save(timeData);
   Serial.print("Saved period: ");
   Serial.println(period);
   return 0;
}

//-------------------------------------------------------------------

// Sensors and Outputs

//Variables and objects
MAX30105 heartSensor = MAX30105();

//-------------------------------------------------------------------

// State Machines

BPMMonitorSM bpmSM (heartSensor);

//-------------------------------------------------------------------

// State machine scheduler

bool executeStateMachines = false;

void simpleScheduler() {
   executeStateMachines = true;
}

Timer schedulerTimer(10, simpleScheduler);

//-------------------------------------------------------------------

void setup() {
   Serial.begin(115200);
   pinMode(D7, OUTPUT); //sets up d7 for reminder output pin
   Serial.println("ECE 413/513 Photon and Heartz Firmware");

   // Sensor Initialization:  default I2C port, 400kHz speed
   if (!heartSensor.begin(Wire, I2C_SPEED_FAST)) {
      Serial.println("MAX30105 was not found. Please check wiring/power.");
      while (1);
   }
   Serial.println("Starting setup");
   // Configure sensor with default settings
   heartSensor.setup(); 
   Serial.println("Setting red led pulse amplitude");
   // Turn Red LED to low to indicate sensor is running
   heartSensor.setPulseAmplitudeRed(0x0A);
  
   // Turn off Green LED
   heartSensor.setPulseAmplitudeGreen(0); 
   Serial.println("Starting scheduler");
   // Starts the state machine scheduler timer.
   schedulerTimer.start();
   
   Serial.println("setup webhook and cloud function");
   // Setup webhook subscribe
   Particle.subscribe("hook-response/bpm", myHandler, MY_DEVICES);
   // Exposes reminderInterval and reminderPeriod variable calculations to the cloud api
   Particle.variable("reminderInterval", reminderInterval);
   Particle.variable("reminderPeriod", reminderPeriod);
   //Exposes setReminderInterval and setReminderPeriod functions to the cloud api
   Particle.function("setReminderInterval", setReminderInterval);
   Particle.function("setReminderPeriod", setReminderPeriod);
   Particle.connect();
}

//-------------------------------------------------------------------

void loop() {
   // Request time synchronization from the Particle Cloud once per day
   if (millis() - lastSync > ONE_DAY_MILLIS) {
      Particle.syncTime();
      lastSync = millis();
   }

   if (executeStateMachines) {
      bpmSM.execute(timeData);
   }
}

//-------------------------------------------------------------------

// When obtain response from the publish
void myHandler(const char *event, const char *data) {
    // Formatting output
    String output = String::format("Response from Post:\n  %s\n", data);
    // Log to serial console
    Serial.println(output);
}



