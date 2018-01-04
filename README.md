# PHONEBUZZ

Homepage (hosted on AWS EC2): http://richardkang.net:3000/

Built with Node.js (Express), HTML/EJS, MongoDB, and Twilio

Setup:
In the .env file, the user can configure ACCOUNT_SID, AUTH_TOKEN, TWILIO_NUMBER, and URL_BASE (include {host:port})

Deployment:

npm install

npm start

NOTE: The application is currently using port 3000 (which can be changed in 'server.js', if needed)

Phase 1:
Point Twilio number's voice URL to "POST {host:port}/phonebuzz"

Phase 2,3,4:
Visit homepage.
There are fields for phone number and delay (minutes and seconds) with the call button.
Underneath the call button is the call history, with the replay button showing on the rightmost column.
