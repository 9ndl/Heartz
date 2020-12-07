//-------------------------------------------------------------------

#include <Wire.h>
#include "MAX30105.h"
#include "spo2_algorithm.h"
#include "BPMMonitorSM.h"

//-------------------------------------------------------------------

using namespace std;

//-------------------------------------------------------------------

#define ONE_DAY_MILLIS (24 * 60 * 60 * 1000)
#define THIRTY_MINUTES_MILLIS (1000 * 60 * 30)

unsigned long lastSync = millis();


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
   pinMode(D7, OUTPUT);
   Serial.println("Hello?");
   Serial.println("ECE 413/513 Photon and MAX30105 Test");

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
   
   Serial.println("setup webhook");
   // Setup webhook subscribe
   Particle.subscribe("hook-response/bpm", myHandler, MY_DEVICES);
   Particle.value()
}

//-------------------------------------------------------------------

void loop() {
   // Request time synchronization from the Particle Cloud once per day
   if (millis() - lastSync > ONE_DAY_MILLIS) {
      Particle.syncTime();
      lastSync = millis();
   }

   if (executeStateMachines) {
      //Serial.println("We good?");
      bpmSM.execute();
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



