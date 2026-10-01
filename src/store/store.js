import { configureStore } from '@reduxjs/toolkit'
import scanReducer from './scanSlice.js'

export const store = configureStore({
  reducer: {
    scan: scanReducer,
  },
})
