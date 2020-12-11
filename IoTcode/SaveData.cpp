#include "SaveData.h"

void save(SaveData timeData){
    EEPROM.put(SAVE_ADDRESS, timeData);
}

SaveData load(){
    SaveData timeData;
    EEPROM.get(SAVE_ADDRESS, timeData);
    if (timeData.version != HEARTZ_VERSION){
        SaveData defaultData = {
            HEARTZ_VERSION,
            DEFAULT_REMINDER_INTERVAL,
            DEFAULT_PERIOD_START_HOUR,
            DEFAULT_PERIOD_START_MINUTE,
            DEFAULT_PERIOD_END_HOUR,
            DEFAULT_PERIOD_END_MINUTE
        };
        return defaultData;
    }
    return timeData;
}