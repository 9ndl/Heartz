//-------------------------------------------------------------------

#include "BPMMonitorSM.h"
#include "MAX30105.h"
#include "heartRate.h"
#include <Wire.h>
#include <vector>
#include <Particle.h>

//-------------------------------------------------------------------

using namespace std;

//-------------------------------------------------------------------

BPMMonitorSM::BPMMonitorSM(MAX30105 &mySensor) : heartSensor(mySensor){
    state = BPMMonitorSM::S_Init;
    beatsPerMinute = 0.0;
    lastBeat = 0;
    sampleReported = false;
    led = D7;
    pinMode(led, OUTPUT);
}

//-------------------------------------------------------------------

void BPMMonitorSM::execute() {
    String data = "";
    long irValue = 0;
    float avgBPM = 0.0;
    float bpmMeasurement = 0.0;
    switch (state) {
        case BPMMonitorSM::S_Init:
            digitalWrite(led, LOW);
            tick = 0;
            tick2 = 0;
            sampleReported = false;
            state = BPMMonitorSM::S_ReadSensor;
            break;
            
        case BPMMonitorSM::S_ReadSensor:
            //timer for reminder
            tick2++;
            irValue = heartSensor.getIR();
            if (irValue < 5000) {
                tick++;
                if (tick == 50) {
                    tick = 0;
                    //digitalWrite(led, LOW);
                    Serial.println("No finger deteced.");
                }
            }
            else if (checkForBeat(irValue) == true)  {
                //digitalWrite(led, HIGH);
                long delta = millis() - lastBeat;
                lastBeat = millis();
                        
                // Adds a random number between 1 and 10 to obfuscate measurement for privacy. 
                bpmMeasurement = 60 / (delta / 1000.0);// + random(1, 10);
                if (bpmMeasurement > 30) {
                    beatsPerMinute = bpmMeasurement;
                    Serial.print("Heart beat detected: ");
                    Serial.print(beatsPerMinute);
                    Serial.println(" avgBPM");
                    // Collect 3 samples
                    if (bpmHistory.size() < 3) {
                        bpmHistory.push_back(beatsPerMinute);
                        state = BPMMonitorSM::S_ReadSensor;
                    }
                }
            }
            if (bpmHistory.size() == 3 && !sampleReported) {
                state = BPMMonitorSM::S_Report;
            }//time for the reminder 30minuts
            else if (tick2 == 180000){
                tick2 = 0;
                tick = 0;
                flag = 1;
                state = BPMMonitorSM::S_Reminder;
            }
            else {
                state = BPMMonitorSM::S_ReadSensor;
            }
            break;
        case BPMMonitorSM::S_Reminder:
            tick2++;
            
            if((tick2 == 10) && (flag == 1)){
                flag = 0;
                tick2 = 0;
                digitalWrite(led, HIGH);
                //Serial.println("High");
            }
            if ((tick2 == 10) && (flag == 0)){
                flag = 1;
                tick2 = 0;
                digitalWrite(led, LOW);
                //Serial.println("Low");
            }
            irValue = heartSensor.getIR();
            if (irValue < 5000) {
                tick++;
                if (tick == 50) {
                    tick = 0;
                    //digitalWrite(led, LOW);
                    Serial.println("No finger deteced. (with reminder on)");
                }
            }
            else if (checkForBeat(irValue) == true)  {
                //digitalWrite(led, HIGH);
                long delta = millis() - lastBeat;
                lastBeat = millis();
                        
                // Adds a random number between 1 and 10 to obfuscate measurement for privacy. 
                bpmMeasurement = 60 / (delta / 1000.0);// + random(1, 10);
                if (bpmMeasurement > 30) {
                    beatsPerMinute = bpmMeasurement;
                    Serial.print("Heart beat detected: ");
                    Serial.print(beatsPerMinute);
                    Serial.println(" avgBPM");
                    // Collect 3 samples
                    if (bpmHistory.size() < 3) {
                        bpmHistory.push_back(beatsPerMinute);
                        state = BPMMonitorSM::S_Reminder;
                    }
                }
            }
            if (bpmHistory.size() == 3 && !sampleReported) {
                digitalWrite(led, LOW);
                state = BPMMonitorSM::S_Report;
                
            }else{
                state = BPMMonitorSM::S_Reminder;
            }
            break;
        case BPMMonitorSM::S_Report:
            avgBPM = (bpmHistory.at(0) + bpmHistory.at(1) + bpmHistory.at(2)) / 3.0;
            data = String::format("{ \"avgBPM\": \"%f\" }", avgBPM);          
            Serial.println(data);
            // Publish to webhook
            Particle.publish("bpm", data, PRIVATE);
            sampleReported = true;
            //Serial.println("%d", sampleReported);
            bpmHistory.clear();
            state = BPMMonitorSM::S_Init;
            break;
   }
}

//-------------------------------------------------------------------

float BPMMonitorSM::getBPM() {
    return beatsPerMinute;
}

//-------------------------------------------------------------------
