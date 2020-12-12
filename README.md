# Heartz 

This is the final project for ECE413 class

**Milestone Documentation**
- Procedures using the endpoint:
    1. Register a new acount if you do not have one.
    2. Sign in and add a new device by typing the device id of your Particle or Argon devices. 
    3. You shall see the Apikey after adding a device and this will be used later. 
- Data sent: the device is going to send heart rate(avgBPM), oxygen level(avgO2) and the sending time(timestamp) 
    - avgBPM is the average of three sets of heart rate per minute.
    - avgO2 is the average of three sets of oxygen level in percent.
    - timestamp is in month/day/year hour/minute/second
- Methods: post/get
- Response code: 
    - {
        "apikey": "YOUR_APIKEY",
        "deviceId": "PARTICLE_DEVICE_ID",
        "avgBPM": "{{avgBPM}}",
        "avgO2": "{{avgO2}}",
        "timestamp": "{{timestamp}}"
      }

- Reponse data formats:  
    - avgBPM : the average of three sets of heart rate per minute.
    - avgO2 : the average of three sets of oxygen level in percent.
    - timestamp : month/day/year hour/minute/second

- Link to milestone demonstration video: https://youtu.be/AHiOMYyjRpY

**Final Project**
- Link to the endpoint server: http://ec2-13-59-133-162.us-east-2.compute.amazonaws.com:3000
- Links to the pitch and demonstration videos.  
- Login credentials: Email: test@email.com; Password: ECE$13heartz
