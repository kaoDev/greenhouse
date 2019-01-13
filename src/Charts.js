import React, { Component } from 'react'
import PropTypes from 'prop-types'
import './App.css'
import { LineChart } from 'recharts'
import { subDays } from 'date-fns'

function subscribeToSensorData({
  firestore,
  lastDays = 1,
  collectionName,
  onUpdate
}) {
  const startDate = subDays(new Date(), lastDays)

  return firestore
    .collection(collectionName) // choose the collection of your data
    .orderBy('date', 'desc') // order the saved documents by date ascending
    .where('date', '>', startDate) // order the saved documents by date ascending
    .onSnapshot(snapshotData => {
      onUpdate(
        // on an update deliver the data to the callback
        // transform the snapshot data to the actual objects
        snapshotData.docs
          .map(documentSnapshot => {
            const data = documentSnapshot.data()

            return {
              ...data,
              date: data.date.seconds
            }
          })
          .reduce((acc, current) => {
            if (acc[current.name]) {
              acc[current.name].push(current)
            } else {
              acc[current.name] = [current]
            }
            return acc
          }, {})
      )
    })
}

export class Charts extends Component {
  static propTypes = {
    firestore: PropTypes.object.isRequired,
    lastDays: PropTypes.number,
    collectionName: PropTypes.string.isRequired,
    renderChartContent: PropTypes.func.isRequired
  }
  // initial state with an empty data array
  state = { sensorData: {}, windowWidth: document.body.clientWidth }

  // method that gets called when this component
  // instance got inserted into the view
  componentDidMount() {
    this.unsubscribe = subscribeToSensorData({
      firestore: this.props.firestore,
      onUpdate: this.onSensorData,
      lastDays: this.props.lastDays,
      collectionName: this.props.collectionName
    })
    window.addEventListener('resize', this.onResize)
  }

  // method that gets called when this component
  // instance will be removed
  componentWillUnmount() {
    if (this.unsubscribe) {
      this.unsubscribe()
    }
    window.removeEventListener('resize', this.onResize)
  }

  // method to store the given data in the component state
  onSensorData = sensorData => {
    this.setState({ sensorData })
  }

  onResize = () => {
    this.setState({
      windowWidth: document.body.clientWidth
    })
  }

  render() {
    const sensors = Object.keys(this.state.sensorData)
    sensors.sort()

    return sensors.map(name => {
      const data = this.state.sensorData[name]

      const width = Math.max(300, Math.min(1000, this.state.windowWidth - 80))

      return (
        <LineChart
          className="chart"
          key={name}
          width={width}
          height={400}
          data={data}
        >
          {this.props.renderChartContent(name, data)}
        </LineChart>
      )
    })
  }
}
