import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { XAxis, YAxis, Line, Legend, Tooltip } from 'recharts'
import { format } from 'date-fns'
import { Charts } from './Charts'
import { lightColor, blue, darkColor } from './colors'

export class SoilDiagrams extends Component {
  static propTypes = {
    firestore: PropTypes.object.isRequired
  }

  render() {
    return (
      <Charts
        firestore={this.props.firestore}
        collectionName="soilMoistureData"
        lastDays={1}
        renderChartContent={name => [
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
            key="y"
            orientation="left"
            type="number"
            stroke={blue}
            domain={[0, 1]}
            tickFormatter={val => parseFloat(val).toFixed(2)}
          />,
          <Line
            key="line"
            dot={false}
            type="monotone"
            dataKey="value"
            stroke={blue}
          />,
          <Legend
            key="legend"
            content={
              <div>
                <div>{name}</div>
                <div style={{ color: blue }}> soil moisture value</div>
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
                case 'value':
                  res = `${value.toFixed(2)}`
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
