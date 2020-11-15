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
//-------------------------------------------------------------------
class BPMMonitorSM {
    enum State { S_Init, S_ReadSensor, S_Report, S_Reminder};
    private:
        State state;
        long lastBeat;
        int tick;
        int led;
        int tick2;
        int flag;
        float beatsPerMinute;
        MAX30105& heartSensor;
        vector<float> bpmHistory;
        bool sampleReported;
    public:
        BPMMonitorSM(MAX30105& mySensor);
        void execute();
        float getBPM();
};
//-------------------------------------------------------------------
#endif
