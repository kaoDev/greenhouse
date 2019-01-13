import React from 'react'
import { Button } from '@material-ui/core'
import { DryReference } from './DryReference'
import { TemperatureDiagrams } from './TemperatureDiagrams'
import { SoilDiagrams } from './SoilDiagrams'

export const AppContent = ({ firestore, auth }) => (
  <main className="main">
    <Button
      className="logout"
      variant="contained"
      color="primary"
      onClick={() => auth.signOut()}
    >
      logout
    </Button>
    <DryReference firestore={firestore} />
    <div className="charts-container">
      <TemperatureDiagrams firestore={firestore} />
      <SoilDiagrams firestore={firestore} />
    </div>
  </main>
)
