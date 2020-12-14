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
- Documentation regarding all endpoints
    1. /register: The user is registering a new account all information including email, full name, and password is saved in the database by mongoDB. If there is error at endpoint, 400 message will be sent. If the full name has been created, 201 message will be sent. 
    2. /signin: After the account is created or the user has an exsiting account, the user will be using sign-in page to login into the account. If the endpoint has database connection error, 401 message will be sent. If the user typed the wrong email, 401 message will be sent to tell the user where he got wrong.
    If the account exists, the endpoint will then match the password with passwordhash. 401 message will be sent if the comparsion function is not working. 201 message will be sent if the authenticatin token is created successfully and 401 message will be sent if the password typed is wrong.
    3. /account: If the account page is not successfully requested, 401 message with 'No athentication token' will be sent. If there is database connection error, 400 message will be sent. If the user cannot be found in the database, 400 message will be sent saying 'user is not found'. If the user account is successully found, information such as user email, name and last access time will be got from the database and shown in the page.
    4. /home: If the home page is not successfully requested, 401 message with 'No athentication token' will be sent. If there is database connection error, 400 message will be sent. If the user cannot be found in the database, 400 message will be sent saying 'user is not found'. If the user account is successully found, information such as user email, name, last access time, device information and all recorded readings from IoT device will be got from the database and shown in the page. The device information includes device ID and APIKey.
    5. /dailyvisual: If the 'daily visual' is not successfully requested, 401 message with 'No athentication token' will be sent. If there is database connection error, 400 message will be sent. If the requested readings can not be found in the database, 400 message will be sent saying 'No reading is found'. If readings are found, daily readings will be obtained and shown in the chart.
    6. /weeklyvisual: If the 'weekly visual' is not successfully requested, 401 message with 'No athentication token' will be sent. If there is database connection error, 400 message will be sent. If the requested readings can not be found in the database, 400 message will be sent saying 'No reading is found'. If readings are found, weekly readings will be obtained and shown in the chart.
    7. /update: If the authentication token does not exist, 401 message will be sent, otherwise the correct token will be obtained. If there is database connection error, 400 message will be sent, otherwise the user can update user information.
    8. /changepass: If the authentication token does not exist, 401 message will be sent, otherwise the correct token will be obtained.If there is database connection error, 400 message will be sent, otherwise the user can update user information. If the user is not found in the database, 400 message will be sent saying 'No user found'. If the user is found and the new password is created. 'Password has been updated' will be sent. 
