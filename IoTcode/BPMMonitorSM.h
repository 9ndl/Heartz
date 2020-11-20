//-------------------------------------------------------------------
#ifndef BPMMonitorSM_H
#define BPMMonitorSM_H
//-------------------------------------------------------------------
#include <vector>
#include <Wire.h>
#include <time.h>
#include "MAX30105.h"
//-------------------------------------------------------------------
using namespace std;

#define THIRTY_MINUTES_MILLIS 1000 * 60 * 30
//-------------------------------------------------------------------
class BPMMonitorSM {
    enum State { S_Init, S_CheckRemindTime, S_ReadSensor, S_Report, S_Reminder};
    private:
        State state;
        bool inProgress;
        long lastBeat;
        int tick;
        int tick2;
        int led;
        int invalidCount;
        long refTime;
        int flag;
        uint32_t irBuffer[25]; //infrared LED sensor data
        uint32_t redBuffer[25];  //red LED sensor data
        float avgBPM;
        float avgSPO2;
        int32_t bufferLength; //data length
        int32_t spo2; //SPO2 value
        int8_t validSPO2; //indicator to show if the SPO2 calculation is valid
        int32_t heartRate; //heart rate value
        int8_t validHeartRate; //indicator to show if the heart rate calculation is valid
        MAX30105& heartSensor;
        vector<int32_t> heartRateHist;
        vector<int32_t> spo2Hist;
        vector<float> bpmHistory;
        bool sampleReported;
        string data;
    public:
        BPMMonitorSM(MAX30105& mySensor);
        void execute();
        float getBPM();
};
//-------------------------------------------------------------------
#endif
