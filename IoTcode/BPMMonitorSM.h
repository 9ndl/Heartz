//-------------------------------------------------------------------
#ifndef BPMMonitorSM_H
#define BPMMonitorSM_H
//-------------------------------------------------------------------
#include <vector>
#include <Wire.h>
#include <time.h>
#include "MAX30105.h"
#include "spo2_algorithm.h"
#include "SaveData.h"

//-------------------------------------------------------------------
using namespace std;

//#define THIRTY_MINUTES_MILLIS 1000 * 60 * 2
//-------------------------------------------------------------------
class BPMMonitorSM {
    enum State { S_Init, S_CheckRemindTime, S_ReadSensor, S_Report, S_Reminder};
    private:
        State state;
        int tick;
        int tick2;
        int led;
        int invalidCount;
        long refTime;
        int flag;
        uint32_t irBuffer[100]; //infrared LED sensor data
        uint32_t redBuffer[100];  //red LED sensor data
        float avgBPM;
        float avgO2;
        int32_t bufferLength; //data length
        int32_t spo2; //SPO2 value
        int8_t validSPO2; //indicator to show if the SPO2 calculation is valid
        int32_t heartRate; //heart rate value
        int8_t validHeartRate; //indicator to show if the heart rate calculation is valid
        MAX30105& heartSensor;
        vector<int32_t> heartRateHist;
        vector<int32_t> spo2Hist;
        bool sampleReported;
        bool firstRemindFlag;
    public:
        BPMMonitorSM(MAX30105& mySensor);
        void execute(SaveData timeData);
        //float getBPM();
};
//-------------------------------------------------------------------
#endif
