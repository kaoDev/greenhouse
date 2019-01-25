'use strict'

const functions = require('firebase-functions')
const admin = require('firebase-admin')
const nodemailer = require('nodemailer')

admin.initializeApp(functions.config().firebase)

const db = admin.firestore()

db.settings({ timestampsInSnapshots: true })

// Configure the email transport using the default SMTP transport and a GMail account.
// For Gmail, enable these:
// 1. https://www.google.com/settings/security/lesssecureapps
// 2. https://accounts.google.com/DisplayUnlockCaptcha
// For other types of transports such as Sendgrid see https://nodemailer.com/transports/
// TODO: Configure the `gmail.email` and `gmail.password` Google Cloud environment variables.
const gmailEmail = functions.config().gmail.email
const gmailPassword = functions.config().gmail.password
const mailTransport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmailEmail,
    pass: gmailPassword
  }
})

const APP_NAME = 'Greenhouse Bot'

// Sends a welcome email to the given user.
function sendPlantsAreDryMail(email, displayName) {
  const mailOptions = {
    from: `${APP_NAME} <noreply@firebase.com>`,
    to: email
  }

  // The user subscribed to the newsletter.
  mailOptions.subject = `Welcome to ${APP_NAME}!`
  mailOptions.text = `Hey ${displayName || ''}!
Your plants seem to be dry, please have a look and perhaps water them.`
  return mailTransport.sendMail(mailOptions).then(() => {
    return console.log('dry plants mail sent to ', email)
  })
}

async function getDryReferenceValue() {
  try {
    const referenceSnap = await db.doc('/settings/soilData').get()
    return referenceSnap.data().dryReference
  } catch (e) {
    return 0
  }
}

async function getLastSoilValue() {
  try {
    const lastSoilValueQuerySnap = await db
      .collection('soilMoistureData')
      .orderBy('date', 'desc')
      .limit(1)
      .get()

    return lastSoilValueQuerySnap.docs[0].data().value
  } catch (e) {
    return 1
  }
}

function updateIsDry(sensorValue, reference) {
  const isDry = sensorValue > reference

  const soilDataComputed = db.doc('/computedValues/soilData')

  soilDataComputed.update({
    isDry
  })
}

exports.checkIfPlantsAreDryOnSettingsChange = functions.firestore
  .document('/settings/soilData')
  .onWrite(async snap => {
    // Get an object representing the document
    // e.g. {'dryReference': 0.7}
    const lastSetting = snap.before.exists
      ? snap.before.data().dryReference
      : null

    // Get an object representing the document
    // e.g. {'dryReference': 0.3}
    const nextSetting = snap.after.exists
      ? snap.after.data().dryReference
      : null

    if (lastSetting !== nextSetting) {
      const sensorValue = await getLastSoilValue()

      updateIsDry(sensorValue, nextSetting)
    }
  })

exports.checkIfPlantsAreDryOnSensorChange = functions.firestore
  .document('/soilMoistureData/{eventId}')
  .onCreate(async snap => {
    const sensorValue = snap.data().value

    const reference = await getDryReferenceValue()

    updateIsDry(sensorValue, reference)
  })

exports.sendPlantsAreDryMail = functions.firestore
  .document('/computedValues/soilData')
  .onWrite(async snap => {
    // Get an object representing the document
    // e.g. {'isDry': false}
    const lastValue = snap.before.exists ? snap.before.data().isDry : null
    // Get an object representing the document
    // e.g. {'isDry': true}
    const newValue = snap.after.exists ? snap.after.data().isDry : null

    // the isDry value has changed and the new value is true
    if (lastValue !== newValue && newValue) {
      const userSnaps = await db.collection('users').get()

      userSnaps.forEach(userSnap => {
        const { mail, name } = userSnap.data()
        sendPlantsAreDryMail(mail, name)
      })
    }
  })
