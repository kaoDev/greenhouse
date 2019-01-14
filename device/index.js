#!/usr/bin/env node
const sensorLib = require('node-dht-sensor')
const Gpio = require('onoff').Gpio
const sleep = require('sleep-promise')
const yargs = require('yargs')
const firebase = require('firebase-admin')

/**
 * keyFile to connect to firebase
 */
const serviceAccount = require('./firebase-key.json')

// initialize firebase app with authentication data
firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount)
})

// get the reference to the firebase database
const db = firebase.firestore()
db.settings({
  timestampsInSnapshots: true
})

const DHT_SENSOR_DATA_COLLECTION_NAME = 'sensorData'

/**
 * takes the sensor values for temperature and humidity and the name
 * of the source sensor
 *
 * @param {number} temperature
 * @param {number} humidity
 * @param {string} name
 */
async function writeDHTData(temperature, humidity, name) {
  try {
    await db.collection(DHT_SENSOR_DATA_COLLECTION_NAME).add({
      temperature,
      humidity,
      name,
      date: firebase.firestore.FieldValue.serverTimestamp()
    })
  } catch (e) {
    console.error('error writing to firestore', e)
  }
}

const DEFAULT_INTERVAL = 1800000 // 30 minutes

const args = yargs.options({
  interval: { alias: 'i', default: DEFAULT_INTERVAL },
  verbose: { alias: 'v', default: false, boolean: true }
}).argv

console.log(
  `starting reading of sensor data with a ${args.interval /
    60000} minutes interval`
)

const errorLed = new Gpio(23, 'out')
const greenLed = new Gpio(24, 'out')

// local state holding variable used to indicate some kind of error
let deviceHasError = false
/**
 * function to let an led connected to the pin 23 blink frantically
 * runs as long as the `deviceHasError` state is true
 */
async function errorBlink() {
  errorLed.writeSync(1)
  await sleep(100)
  errorLed.writeSync(0)
  await sleep(100)

  if (deviceHasError) {
    errorBlink()
  }
}

/**
 * some data to describe the connected DHT sensor
 * type can be 11 or 22, it depends on the device
 * the number of the gpio pin connected to the data pin of the sensor
 */
const dhtSensors = [
  {
    type: 11,
    pin: 22,
    name: 'DHT11'
  }
]

/**
 * function which reads the sensor values and sends them to the server
 * after waiting for the specified interval time it calls itself to run again
 */
function readSensor(sensor) {
  sensorLib.read(
    sensor.type,
    sensor.pin,
    async (error, temperature, humidity) => {
      if (error) {
        console.error(
          `some error ocurred on reading the ${sensor.name} sensor`,
          error
        )
        if (!deviceHasError) {
          deviceHasError = true
          errorBlink()
        }
      } else {
        deviceHasError = false

        if (args.verbose) {
          console.log(
            'dht sensor reading:',
            sensor.name,
            'temp:',
            temperature + '°C',
            'humidity: ',
            humidity + '%'
          )
        }

        writeDHTData(temperature, humidity, sensor.name)
        // wait for the given interval
      }
      if (deviceHasError) {
        // if the sensor has an error try to get a value faster than the normal interval
        await sleep(1000)
      } else {
        await sleep(args.interval)
      }
      // start over
      readSensor(sensor)
    }
  )
}

// kick of the sensor reading
dhtSensors.forEach(sensor => readSensor(sensor))

// read soil data and save it to firebase
const mcpadc = require('mcp-spi-adc')

const SOIL_MOISTURE_DATA_COLLECTION_NAME = 'soilMoistureData'

/**
 * takes the soil moisture value and the sensor-name and sends it to firebase
 *
 * @param {number} rawValue value between 0 and 1023
 * @param {number} humidity value between 0 and 1
 * @param {string} name name of the sensor
 */
async function writeSoilData(rawValue, value, name) {
  try {
    await db.collection(SOIL_MOISTURE_DATA_COLLECTION_NAME).add({
      rawValue,
      value,
      name,
      date: firebase.firestore.FieldValue.serverTimestamp()
    })
  } catch (e) {
    console.error('error writing to firestore', e)
  }
}

const soilSensorPowerPin = new Gpio(5, 'out')

const soilSensors = [
  {
    name: 'soil-0',
    pin: 0
  }
]

/**
 * @param {number} analogPin pin id to read analog data from (0-7)
 * @returns {Promise<{rawValue: number, value: number}>}
 */
async function readSoilSensor(analogPin, name) {
  return new Promise((resolve, reject) => {
    const soilSensor = mcpadc.open(analogPin, err => {
      if (err) {
        console.error('error on initializing spi', err)
        reject(err)
        return
      }

      soilSensor.read((err, reading) => {
        if (err) {
          console.error(`error reading analog pin ${analogPin}`, err)
          reject(err)
          return
        }

        if (args.verbose) {
          console.log('soil sensor value', name, reading)
        }

        resolve(reading)
      })
    })
  })
}

async function scanSoilSensors() {
  // give power to the soil sensors
  soilSensorPowerPin.writeSync(1)
  // wait some time to give the senor some time to measure
  await sleep(500)
  await Promise.all(
    soilSensors.map(async ({ name, pin }) => {
      const reading = await readSoilSensor(pin, name)
      writeSoilData(reading.rawValue, reading.value, name)
    })
  )
  soilSensorPowerPin.writeSync(0)
}

// scan soil sensor data on startup
scanSoilSensors()
// schedule soil data readings in the given interval
setInterval(scanSoilSensors, args.interval)
