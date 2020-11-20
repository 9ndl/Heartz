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

void BPMMonitorSM::execute() {
    uint32_t irValue;
    String data = "";
    switch (state) {
        case BPMMonitorSM::S_Init:
            Serial.println("Init");
            digitalWrite(led, LOW);
            tick = 0;
            sampleReported = false;
            state = BPMMonitorSM::S_ReadSensor;
            heartRateHist.clear();
            spo2Hist.clear();
            invalidCount = 0;

            bufferLength = 100; //buffer length of 100 stores 4 seconds of samples running at 25sps

            //read the first 100 samples, and determine the signal range
            for (int i = 0 ; i < bufferLength ; ++i)
            {
                while (heartSensor.available() == false) //do we have new data?
                heartSensor.check(); //Check the sensor for new data

                redBuffer[i] = heartSensor.getRed();
                irBuffer[i] = heartSensor.getIR();
                Serial.print("i: ");
                Serial.println(i);
                Serial.print("IR: ");
                Serial.println(irBuffer[i]);
                if (irBuffer[i] < 5000){
                    
                    Serial.print("i: ");
                    Serial.println(i);
                    Serial.print("IR: ");
                    Serial.println(irBuffer[i]);
                    Serial.print("invalids: ");
                    Serial.println(invalidCount);
                    --i;
                    ++invalidCount;
                    if (invalidCount >= 50){
                        state = S_CheckRemindTime;
                        Serial.println("No finger detected.");
                        return;
                    }
                }
                else {
                    invalidCount = 0;
                }
                heartSensor.nextSample(); //We're finished with this sample so move to next sample
            }

            //calculate heart rate and SpO2 after first 100 samples (first 4 seconds of samples)
            maxim_heart_rate_and_oxygen_saturation(irBuffer, bufferLength, redBuffer, &spo2, &validSPO2, &heartRate, &validHeartRate);
            
            if (validHeartRate && validSPO2){
                heartRateHist.push_back(heartRate);
                spo2Hist.push_back(spo2);
            }

            break;
            
        case BPMMonitorSM::S_ReadSensor:

            //Continuously taking samples from MAX30102.  Heart rate and SpO2 are calculated every 1 second
            //dumping the first 25 sets of samples in the memory and shift the last 75 sets of samples to the top
            for (byte i = 25; i < 100; i++)
            {
                redBuffer[i - 25] = redBuffer[i];
                irBuffer[i - 25] = irBuffer[i];
            }

            //take 25 sets of samples before recalculating the heart rate.
            for (byte i = 75; i < 100; i++)
            {
                while (heartSensor.available() == false) //do we have new data?
                    heartSensor.check(); //Check the sensor for new data

                //digitalWrite(readLED, !digitalRead(readLED)); //Blink onboard LED with every data read

                redBuffer[i] = heartSensor.getRed();
                irBuffer[i] = heartSensor.getIR();
                if (irBuffer[i] < 5000){
                    Serial.print("i: ");
                    Serial.println(i);
                    Serial.print("IR: ");
                    Serial.println(irBuffer[i]);
                    Serial.print("invalids: ");
                    Serial.println(invalidCount);
                    --i;
                    ++invalidCount;
                    if (invalidCount >= 50){
                        state = S_CheckRemindTime;
                        Serial.println("No finger detected.");
                        return;
                    }
                }
                else {
                    invalidCount = 0;
                }
                heartSensor.nextSample(); //We're finished with this sample so move to next sample
            }
            maxim_heart_rate_and_oxygen_saturation(irBuffer, bufferLength, redBuffer, &spo2, &validSPO2, &heartRate, &validHeartRate);

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
            if (heartRateHist.size() == 3 && !sampleReported) {
                state = BPMMonitorSM::S_Report;
                return;
            }
            state = BPMMonitorSM::S_ReadSensor;
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
            if (irValue >= 5000) {
                delay(200);
                irValue = heartSensor.getIR();
                if (irValue >= 5000){
                    state = S_Init;
                    return;
                }
            }
            
            state = BPMMonitorSM::S_Reminder;
            break;
        case BPMMonitorSM::S_Report:
            Serial.println("Report");
            avgBPM = (heartRateHist.at(0) + heartRateHist.at(1) + heartRateHist.at(2)) / 3.0;
            avgO2 = (spo2Hist.at(0) + spo2Hist.at(1) + spo2Hist.at(2)) / 3.0;
            data = String::format("{ \"avgBPM\": \"%f\", \"avgO2\": \"%f\", \"timestamp\": \"%d/%d/%d %d:%d:%d\" }", avgBPM, avgO2, Time.month(), Time.day(), Time.year(), Time.hour(), Time.minute(), Time.second());          
            Serial.println(data);
            // Publish to webhook
            Particle.publish("bpm", data, PRIVATE);
            sampleReported = true;
            heartRateHist.clear();
            spo2Hist.clear();
            state = BPMMonitorSM::S_Init;
            break;
        case BPMMonitorSM::S_CheckRemindTime:
            Serial.println("RemindLoop");
            if (sampleReported || firstRemindFlag){
                refTime = millis();
                sampleReported = false;
                firstRemindFlag = false;
            }
            while((millis() - refTime) < THIRTY_MINUTES_MILLIS){
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
            state = S_Reminder;
            break;
   }
}
