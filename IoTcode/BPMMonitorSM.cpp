//-------------------------------------------------------------------

#include "BPMMonitorSM.h"
#include "MAX30105.h"
#include "heartRate.h"
#include <Wire.h>
#include <vector>
#include <Particle.h>
#include "spo2_algorithm.h"

//-------------------------------------------------------------------

using namespace std;
//-------------------------------------------------------------------

BPMMonitorSM::BPMMonitorSM(MAX30105 &mySensor) : heartSensor(mySensor){
    state = BPMMonitorSM::S_Init;
    sampleReported = false;
    led = D7;
    pinMode(led, OUTPUT);
    tick2 = 0;
    firstRemindFlag = true;
}

//-------------------------------------------------------------------

void BPMMonitorSM::execute(SaveData timeData) {
    uint32_t irValue;
    String data = "";
    switch (state) {
        case BPMMonitorSM::S_Init:
            Serial.println("Init");
            digitalWrite(led, LOW);
            remindTick = 0;
            sampleReported = false;
            state = BPMMonitorSM::S_FirstRead;
            heartRateHist.clear();
            spo2Hist.clear();
            invalidCount = 0;
            validCount = 0;

            bufferLength = 100; //buffer length of 100 stores 4 seconds of samples running at 25sps
            break;
            
        case BPMMonitorSM::S_FirstRead: //read the first 100 samples, and determine the signal range
            if (validCount >= bufferLength){
                //calculate heart rate annd blood ox level from the irbuffer and redbuffer
                maxim_heart_rate_and_oxygen_saturation(irBuffer, bufferLength, redBuffer, &spo2, &validSPO2, &heartRate, &validHeartRate);

                //if the heart rate and spo2 are valid, push them to the history
                if (validHeartRate && validSPO2){
                    heartRateHist.push_back(heartRate);
                    spo2Hist.push_back(spo2);
                }  
                //move on to normal reads
                state = S_ReadSensor;
            }
            while (heartSensor.available() == false) //do we have new data?
            heartSensor.check(); //Check the sensor for new data

            //gets a sample of ir and red light data and pushes to buffer
            redBuffer[validCount] = heartSensor.getRed();
            irBuffer[validCount] = heartSensor.getIR();
            Serial.print("validCount: ");
            Serial.println(validCount);
            Serial.print("IR: ");
            Serial.println(irBuffer[validCount]);

            //this is an invalid ir value
            if (irBuffer[validCount] < 5000){
                    
                Serial.print("validCount: ");
                Serial.println(validCount);
                Serial.print("IR: ");
                Serial.println(irBuffer[validCount]);
                Serial.print("invalids: ");
                Serial.println(invalidCount);
                --validCount;
                ++invalidCount; //tick up the invalid count
                if (invalidCount >= 50){    //if 50 invalid readings are taken, assume that there is no finger on the sensor
                    state = S_CheckRemindTime;  //move to remind interval
                    Serial.println("No finger detected.");
                    return;
                }
            }
            else {
                invalidCount = 0;   //finger detected, reset invalid count
            }
            heartSensor.nextSample(); //We're finished with this sample so move to next sample
            ++validCount;   //tick up valid count to keep pushing to buffer
            break;

        case BPMMonitorSM::S_ReadSensorPrep:
            for (byte i = 25; i < 100; i++)
            {
                redBuffer[i - 25] = redBuffer[i];
                irBuffer[i - 25] = irBuffer[i];
            }
            validCount = 75;
            state = S_ReadSensor;
            break;
        case BPMMonitorSM::S_ReadSensor:    //take 25 sets of samples before recalculating the heart rate.
            if (validCount >= bufferLength){
                //calculate heart rate annd blood ox level from the irbuffer and redbuffer
                maxim_heart_rate_and_oxygen_saturation(irBuffer, bufferLength, redBuffer, &spo2, &validSPO2, &heartRate, &validHeartRate);
                
                //If the heart rate and blood ox levels are valid and there are less than 3 readings in history,
                //saves the given reading, otherwise the three readings are averaged and reported
                if (heartRateHist.size() < 3 && validHeartRate && validSPO2){
                    Serial.println("Saved");
                    heartRateHist.push_back(heartRate);
                    spo2Hist.push_back(spo2);
                }
                Serial.print("Heart beat detected: ");
                Serial.print(heartRate);
                Serial.println(" avgBPM");

                Serial.println("Blood Oxygen Level: ");
                Serial.print(spo2);
                Serial.println("%");
                Serial.println(heartRateHist.size());
                //if the sample has not been reported and there are 3 readings in history, report average
                if (heartRateHist.size() == 3 && !sampleReported) {
                    state = BPMMonitorSM::S_Report;
                    return;
                }
                state = BPMMonitorSM::S_ReadSensorPrep;
                return;
            }

            while (heartSensor.available() == false) //do we have new data?
            heartSensor.check(); //Check the sensor for new data

            //Get new samples of ir and red light values
            redBuffer[validCount] = heartSensor.getRed();
            irBuffer[validCount] = heartSensor.getIR();

            //If the ir value is less than 5000, that reading is invalid
            if (irBuffer[validCount] < 5000){
                Serial.print("validCount: ");
                Serial.println(validCount);
                Serial.print("IR: ");
                Serial.println(irBuffer[validCount]);
                Serial.print("invalids: ");
                Serial.println(invalidCount);
                --validCount;   //redo reading
                ++invalidCount; //tick up invalid count
                if (invalidCount >= 50){    //if 50 invalids are read, there is no finger on the sensor, and we go to remind loop
                    state = S_CheckRemindTime;
                    Serial.println("No finger detected.");
                    return;
                }
            }
            else {
                invalidCount = 0;   //Finger was detected, reset invalid count
            }
            heartSensor.nextSample(); //We're finished with this sample so move to next sample
            ++validCount;   //tick up valid count
            break;
        case BPMMonitorSM::S_Reminder:
            ++tick2;
            if((tick2 == 10) && (flag == 1)){
                flag = 0;
                tick2 = 0;
                digitalWrite(led, HIGH);
            }
            if ((tick2 == 10) && (flag == 0)){
                flag = 1;
                tick2 = 0;
                digitalWrite(led, LOW);
            }

            irValue = heartSensor.getIR();
            if (irValue >= 5000) {  //sensed a finger on the sensor
                delay(200); //debounce
                irValue = heartSensor.getIR();
                if (irValue >= 5000){   //if the finger is still there, that means we should leave the remind loop
                    state = S_Init;
                    return;
                }
            }
            break;
        case BPMMonitorSM::S_Report:
            Serial.println("Report");
            avgBPM = (heartRateHist.at(0) + heartRateHist.at(1) + heartRateHist.at(2)) / 3.0;
            avgO2 = (spo2Hist.at(0) + spo2Hist.at(1) + spo2Hist.at(2)) / 3.0;
            data = String::format("{ \"avgBPM\": \"%f\", \"avgO2\": \"%f\", \"timestamp\": \"%d/%d/%d %d:%d:%d\" }", avgBPM, avgO2, Time.month(), Time.day(), Time.year(), Time.hour(), Time.minute(), Time.second());          
            Serial.println(data);
            // Publish to webhook
            Particle.publish("bpm", data, PRIVATE);
            sampleReported = true;  //put up sampleReported flag
            heartRateHist.clear();
            spo2Hist.clear();
            state = BPMMonitorSM::S_CheckRemindTime;
            break;
        case BPMMonitorSM::S_CheckRemindTime:
            //If the current time is outside of the given reminder time frame,
            //go to sleep and wait for valid sensor data
            if (Time.hour() > timeData.periodEndHour || Time.hour() < timeData.periodStartHour){
                state = S_Sleep;
                return;
            }
            else if (Time.hour() == timeData.periodEndHour){
                if (Time.minute() >= timeData.periodEndMinute){
                    state = S_Sleep;
                    return;
                }
            }
            else if (Time.hour() == timeData.periodStartHour){
                if (Time.minute() <= timeData.periodStartMinute){
                    state = S_Sleep;
                    return;
                }
            }
            if (sampleReported || firstRemindFlag){ //if a sample was reported or the firstRemindFlag is up, do some prep
                Serial.println("Reset tick");
                remindTick = 0;
                sampleReported = false;
                firstRemindFlag = false;
            }
            //If the remindTick value (each tick represents 10 milliseconds) equals the reminderInterval / 10 then go to remind loop
            if (remindTick >= timeData.reminderInterval / 10){  
                state = S_Reminder;
            }
            else{
                irValue = heartSensor.getIR();
                if (irValue >= 5000) {
                    delay(200);
                    irValue = heartSensor.getIR();
                    if (irValue >= 5000){
                        state = S_Init;
                        return;
                    }
                }
            }
            remindTick++;
            break;
        case BPMMonitorSM::S_Sleep:
            Serial.println("Sleep");
            irValue = heartSensor.getIR();
            if (irValue >= 5000) {  //Check to see if valid sensor data is given
                delay(200); //debounce
                irValue = heartSensor.getIR();
                if (irValue >= 5000){
                    state = S_Init;
                    return;
                }
            }
            break;
   }
}
