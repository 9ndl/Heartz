#ifndef SAVE_DATA_H
#define SAVE_DATA_H

// Useful Time in Millisecond definitions
#define ONE_MINUTE_MILLIS (1000 * 60)
#define THIRTY_MINUTES_MILLIS (ONE_MINUTE_MILLIS * 30)
#define ONE_HOUR_MILLIS (ONE_MINUTE_MILLIS * 60)
#define ONE_DAY_MILLIS (ONE_HOUR_MILLIS * 24)

// EEPROM Defines
#define SAVE_ADDRESS 10 // The starting address where save data will be saved to EEPROM
#define HEARTZ_VERSION 1    // Used to check whether or not EEPROM saved values are accurate

// Save Data Defaults
#define DEFAULT_REMINDER_INTERVAL THIRTY_MINUTES_MILLIS
#define DEFAULT_PERIOD_START_HOUR 6 // 6 AM
#define DEFAULT_PERIOD_START_MINUTE 0 // 6:00 AM
#define DEFAULT_PERIOD_END_HOUR 22  // 10 PM
#define DEFAULT_PERIOD_END_MINUTE 0 //10:00 PM

// Save Data struct
typedef struct SaveData{
    unsigned char version;  // version number which is used to check whether saved EEPROM values are valid
    unsigned long reminderInterval; // the amount of time in milliseconds between reminders
    unsigned char periodStartHour;  // The hour and minute at which reminders start
    unsigned char periodStartMinute;
    unsigned char periodEndHour;    // The hour and minute at which reminders end
    unsigned char periodEndMinute;
}SaveData;

void save(SaveData timeData);   // saves the given data to EEPROM 
SaveData load();    // Loads the EEPROM data if version numbers match up, otherwise defaults are loaded in

#endif