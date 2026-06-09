export interface WithingsMeasures {
  date: number       // Unix timestamp of the measurement
  weight: number | null  // lbs
  muscle: number | null  // lbs
  fat: number | null     // lbs
  water: number | null   // % body water
}
