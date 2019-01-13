import React, { Component } from 'react'
import PropTypes from 'prop-types'
import './App.css'
import { XAxis, YAxis, Line, Legend, Tooltip } from 'recharts'
import { format } from 'date-fns'
import { Charts } from './Charts'
import { lightColor, red, blue, darkColor } from './colors'

export class TemperatureDiagrams extends Component {
  static propTypes = {
    firestore: PropTypes.object.isRequired
  }

  render() {
    return (
      <Charts
        firestore={this.props.firestore}
        collectionName="sensorData"
        lastDays={1}
        renderChartContent={(name, data) => [
          <XAxis
            key="x"
            name="date"
            dataKey="date"
            type="number"
            domain={['dataMin', 'dataMax']}
            stroke={lightColor}
            tickFormatter={val => {
              if (Math.abs(val) < Infinity) {
                return format(new Date(val * 1000), 'DD.MM - HH:mm')
              }
            }}
          />,
          <YAxis
            key="yLeft"
            orientation="left"
            type="number"
            yAxisId="temperature"
            domain={[
              dataMin => Math.floor(dataMin - 0.3),
              dataMax => Math.ceil(dataMax + 0.3)
            ]}
            tickFormatter={val => parseFloat(val).toFixed(1)}
            stroke={red}
          />,
          <YAxis
            key="yRight"
            orientation="right"
            type="number"
            yAxisId="humidity"
            domain={[0, 100]}
            stroke={blue}
          />,
          <Line
            key="line1"
            dot={false}
            type="monotone"
            dataKey="temperature"
            yAxisId="temperature"
            stroke={red}
          />,
          <Line
            key="line2"
            dot={false}
            type="monotone"
            dataKey="humidity"
            yAxisId="humidity"
            stroke={blue}
          />,
          <Legend
            key="legend"
            content={
              <div>
                <div>{name}</div>
                <div style={{ color: red }}>Temperature in °C</div>
                <div style={{ color: blue }}>Humidity in %</div>
              </div>
            }
          />,
          <Tooltip
            key="tooltip"
            wrapperStyle={{ color: darkColor }}
            labelFormatter={date => {
              return format(date * 1000, 'HH:mm')
            }}
            formatter={(value, name) => {
              let res = ''
              switch (name) {
                case 'temperature':
                  res = `${value.toFixed(1)} °C`
                  break
                case 'humidity':
                  res = `${value.toFixed(0)}%`
                  break
                default:
                  break
              }
              return res
            }}
          />
        ]}
      />
    )
  }
}
