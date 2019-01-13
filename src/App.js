import React from 'react'
import './App.css'
import firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/auth'
import FirebaseAuth from 'react-firebaseui/StyledFirebaseAuth'
import { AppContent } from './AppContent'

// Configure Firebase.
const config = {
  apiKey: 'AIzaSyBvRhAYjqwvMYG9P4h0CgM3fg_TMYpqwDM',
  authDomain: 'iot-2018-65259.firebaseapp.com',
  databaseURL: 'https://iot-2018-65259.firebaseio.com',
  projectId: 'iot-2018-65259'
}
const firebaseApp = firebase.initializeApp(config)

const firestore = firebaseApp.firestore()
firestore.settings({ timestampsInSnapshots: true })
const auth = firebase.auth()

export default class App extends React.Component {
  state = { user: null }

  componentDidMount() {
    this.unsubscribe = firebase.auth().onAuthStateChanged(
      user => {
        this.setState({ user })
      },
      error => {
        console.error(error)
        this.setState({ user: null })
      }
    )
  }

  componentWillUnmount() {
    if (this.unsubscribe) {
      this.unsubscribe()
    }
  }

  render() {
    return (
      <div>
        <header>
          <h1>My Greenhouse</h1>
        </header>
        {this.state.user ? (
          <AppContent firestore={firestore} auth={auth} />
        ) : (
          <FirebaseAuth
            uiConfig={{
              signInOptions: [firebase.auth.EmailAuthProvider.PROVIDER_ID]
            }}
            firebaseAuth={auth}
          />
        )}
      </div>
    )
  }
}
