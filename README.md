# Greenhouse

automate your greenhouse with a Raspberry Pi zero some sensors and firebase.

You can read more about how this project was made on
[kalleott.de/iot](https://kalleott.de/iot)

## Getting started

Install dependencies

```bash
npm install
cd functions
npm install
cd ..
```

## UI Code

The UI code for this application is react based and enables you to see the
current greenhouse state (temperature, air humidity and soil moisture values).
With a slider you can edit the current reference value to determine "dry"
moisture values. It is dry when the sensor value is bigger than the reference
value.

## Device Code

The code running on the Raspberry Pi is located in the `device/index.js` file.
It can be started with 2 arguments, the interval in milliseconds
(`-interval 60000` or `--verbose 60000`) in which the sensors should trigger and
a verbose (`-v` or `--verbose`) flag for more logging. The default interval is
1800000 which is equivalent to 30 minutes.

```
node index.js -v -i 5000
```

The wiring diagram can be seen in the greenhouse-schematics.png image.

For the connection to firebase generate a new private key in "service accounts"
of the project settings in the firebase console and save it as
`firebase-key.json` in the same folder as the device app on the Raspberry Pi.

## Serverless Code

To add functions to your project you can init a project in the `functions`
directory with the command `firebase init`. This project has a main index.js
file and every exported function (`exports.functionName`) is deployed as a
firebase function.

For example the function to check if the plants are dry on a new soil sensor
value looks like this:

```js
exports.checkIfPlantsAreDryOnSensorChange = functions.firestore
  .document('/soilMoistureData/{eventId}')
  .onCreate(async snap => {
    const sensorValue = snap.data().value

    const reference = await getDryReferenceValue()

    updateIsDry(sensorValue, reference)
  })
```

To learn more take a look in the `functions/index.js` file.

## Open ToDos to get started with your own application

### firebase

- install firebase-tools:
  - `npm install -g firebase-tools`
- login with the firebase tools
  - `firebase login`
- connect to an existing firebase project
  - `firebase use`

This application uses an gmail account to send emails to listed users in the
`users` collection when the soil gets dry. So you need to use an existing
account or create a new one. To enable the cloud functions to send emails you
must set 2 environment variables for firebase:

```bash
firebase functions:config:set gmail.email=aGmailAccount@gmail.com
firebase functions:config:set gmail.password=thePasswordForThisAccount
```

To deploy the application start with building the UI app, then run the firebase
deploy command:

```bash
npm run build
firebase deploy
```
