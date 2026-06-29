"use client"

import { Suspense } from "react"
import Realstate from "src/components/buyer/realstate"
import Loader from "src/components/loader"

export default function AutomobilePage() {
  return (
    <Suspense fallback={<div><Loader/></div>}>
      <Realstate />
    </Suspense>
  )
}