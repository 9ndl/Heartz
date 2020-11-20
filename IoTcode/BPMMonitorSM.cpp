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

BPMMonitorSM::BPMMonitorSM(MAX30105 mySensor) : heartSensor(mySensor){
    state = BPMMonitorSM::S_Init;
    //beatsPerMinute = 0.0;
    inProgress = true;
    lastBeat = 0;
    sampleReported = false;
    led = D7;
    pinMode(led, OUTPUT);
}

//-------------------------------------------------------------------

void BPMMonitorSM::execute() {
    switch (state) {
        case BPMMonitorSM::S_Init:
            digitalWrite(led, LOW);
            tick = 0;
            sampleReported = false;
            state = BPMMonitorSM::S_ReadSensor;
            heartRateHist.clear();
            spo2Hist.clear();
            invalidCount = 0;

            bufferLength = 100; //buffer length of 100 stores 4 seconds of samples running at 25sps

            //read the first 100 samples, and determine the signal range
            for (byte i = 0 ; i < bufferLength ; ++i)
            {
                while (particleSensor.available() == false) //do we have new data?
                particleSensor.check(); //Check the sensor for new data

                redBuffer[i] = particleSensor.getRed();
                irBuffer[i] = particleSensor.getIR();
                if (!checkForBeat(irBuffer[i])){
                    --i;
                    ++invalidCount;
                    if (invalidCount >= 50){
                        state = S_CheckRemindTime;
                        Serial.println("No finger detected.");
                        return;
                    }
                    else {
                    invalidCount = 0;
                    }  
                }
                particleSensor.nextSample(); //We're finished with this sample so move to next sample
            }

            //calculate heart rate and SpO2 after first 100 samples (first 4 seconds of samples)
            maxim_heart_rate_and_oxygen_saturation(irBuffer, bufferLength, redBuffer, &spo2, &validSPO2, &heartRate, &validHeartRate);

            heartRateHist.push_back(heartRate);
            spo2Hist.push_back(spo2);

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
                while (particleSensor.available() == false) //do we have new data?
                    particleSensor.check(); //Check the sensor for new data

                digitalWrite(readLED, !digitalRead(readLED)); //Blink onboard LED with every data read

                redBuffer[i] = particleSensor.getRed();
                irBuffer[i] = particleSensor.getIR();
                if (!checkForBeat(irBuffer[i])){
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
                particleSensor.nextSample(); //We're finished with this sample so move to next sample
            }
            maxim_heart_rate_and_oxygen_saturation(irBuffer, bufferLength, redBuffer, &spo2, &validSPO2, &heartRate, &validHeartRate);

            if (heartRateHist.size() < 3){
                heartRateHist.push_back(heartRate);
                spo2Hist.push_back(spo2);
            }
            Serial.print("Heart beat detected: ");
            Serial.print(heartRate);
            Serial.println(" avgBPM");

            Serial.println("Blood Oxygen Level: ");
            Serial.print(spo2);
            Serial.print("%");
            if (bpmHistory.size() == 3 && !sampleReported) {
                state = BPMMonitorSM::S_Report;
                return;
            }
            state = BPMMonitorSM::S_ReadSensor;
            break;
        case BPMMonitorSM::S_Reminder:
            tick2 = 0;
            ++tick2;
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

            uint32_t irValue = heartSensor.getIR();
            if (checkForBeat(irValue)) {
                delay(200);
                irValue = heartSensor.getIR();
                if (checkForBeat(irValue)){
                    state = S_Init;
                }
            }
            
            state = BPMMonitorSM::S_Reminder;
            break;
        case BPMMonitorSM::S_Report:
            avgBPM = (heartRateHist.at(0) + heartRateHist.at(1) + heartRateHist.at(2)) / 3.0;
            avgSPO2 = (spo2Hist.at(0) + spo2Hist.at(1) + spo2Hist.at(2)) / 3.0;
            data = String::format("{ \"avgBPM\": \"%f\", \"avgSPO2\": \"%f\", \"timestamp\": \"%d/%d/%d %d:%d:%d }", avgBPM, avgSPO2, month(), day(), year(), hour(), minute(), second());          
            Serial.println(data);
            // Publish to webhook
            Particle.publish("bpm", data, PRIVATE);
            sampleReported = true;
            //Serial.println("%d", sampleReported);
            //bpmHistory.clear();
            heartRateHist.clear();
            spo2Hist.clear();
            state = BPMMonitorSM::S_Init;
            break;
        case BPMMonitorSM::S_CheckRemindTime:
            if (sampleReported){
                refTime = millis();
                sampleReported = false;
            }
            while((millis() - refTime) >= THIRTY_MINUTES_MILLIS){
                uint32_t irValue = heartSensor.getIR();
                if (checkForBeat(irValue)) {
                    delay(200);
                    irValue = heartSensor.getIR();
                    if (checkForBeat(irValue)){
                        state = S_Init;
                    }
                }
            }
            state = S_Reminder;
            break;
   }
}

//-------------------------------------------------------------------

float BPMMonitorSM::getBPM() {
    return beatsPerMinute;
}

//-------------------------------------------------------------------
