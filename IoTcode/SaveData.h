#ifndef SAVE_DATA_H
#define SAVE_DATA_H

#include <stdint.h>

#define SAVE_ADDRESS 10
#define HEARTZ_VERSION 1
#define ONE_MINUTE_MILLIS (1000 * 60)
#define THIRTY_MINUTES_MILLIS (ONE_MINUTE_MILLIS * 30)
#define DEFAULT_REMINDER_INTERVAL THIRTY_MINUTES_MILLIS
#define DEFAULT_PERIOD_START_HOUR 6 // 6 AM
#define DEFAULT_PERIOD_START_MINUTE 0 // 6:00 AM
#define DEFAULT_PERIOD_END_HOUR 22  // 10 PM
#define DEFAULT_PERIOD_END_MINUTE 0 //10:00 PM

typedef struct SaveData{
    unsigned char version;
    unsigned long reminderInterval;
    unsigned char periodStartHour;
    unsigned char periodStartMinute;
    unsigned char periodEndHour;
    unsigned char periodEndMinute;
}SaveData;

void save(SaveData timeData);
SaveData load();

#endif