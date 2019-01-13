import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Slider from '@material-ui/lab/Slider'
import { debounce } from 'underscore'

const updateDryReference = firestore =>
  // debounce the actual update function to save database writes
  debounce(dryReference => {
    firestore
      .collection('settings')
      .doc('soilData')
      .set({ dryReference })
  }, 250)

const subscribeToReferenceValue = (firestore, onUpdate) => {
  return firestore
    .collection('settings') // choose the collection of your data
    .doc('soilData') // choose the document
    .onSnapshot(documentSnapshot => {
      if (documentSnapshot.exists) {
        // read the actual data and give it to the onUpdate function
        onUpdate(documentSnapshot.data().dryReference)
      }
    })
}

export class DryReference extends Component {
  static propTypes = {
    firestore: PropTypes.object.isRequired
  }

  state = { dryReference: 0.5 }
  subs = []

  componentDidMount() {
    this.subs.push(
      subscribeToReferenceValue(this.props.firestore, dryReference => {
        this.setState({ dryReference })
      })
    )
  }

  updateRemoteDryReference = updateDryReference(this.props.firestore)

  // method that gets called when this component
  // instance will be removed
  componentWillUnmount() {
    this.subs.forEach(unsubscribe => unsubscribe())
  }

  render() {
    return (
      <div className="dry-reference-form">
        <p>Dry Reference: {this.state.dryReference.toFixed(2)}</p>
        <Slider
          min={0}
          max={1}
          step={0.05}
          value={this.state.dryReference}
          onChange={(_, dryReference) => {
            this.setState(
              { dryReference },
              // after setting the local state send
              // the new value to the remote data store
              () => {
                this.updateRemoteDryReference(dryReference)
              }
            )
          }}
        />
      </div>
    )
  }
}
