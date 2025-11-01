import { useState } from "react"

import NoirRating from "~/components/Organisms/NoirRating/NoirRating"

// Demo component to showcase NoirRating functionality
function NoirRatingDemo() {
  const [longevityRating, setLongevityRating] = useState<number | null>(null)
  const [sillageRating, setSillageRating] = useState<number | null>(null)
  const [genderRating, setGenderRating] = useState<number | null>(null)
  const [priceValueRating, setPriceValueRating] = useState<number | null>(null)
  const [overallRating, setOverallRating] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-noir-dark-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-noir-gold-300 mb-8 text-center">
          Film Noir Perfume Rating System
        </h1>

        <div className="bg-noir-dark-800 rounded-lg p-6 space-y-8">
          <div className="grid gap-6">
            <div className="flex flex-col items-center">
              <h3 className="mb-3 font-medium">Longevity</h3>
              <NoirRating
                category="longevity"
                value={longevityRating}
                onChange={setLongevityRating}
                size="lg"
                showLabel
              />
            </div>

            <div className="flex flex-col items-center">
              <h3 className="mb-3">Sillage</h3>
              <NoirRating
                category="sillage"
                value={sillageRating}
                onChange={setSillageRating}
                size="lg"
                showLabel
              />
            </div>

            <div className="flex flex-col items-center">
              <h3 className="mb-3">Gender Appeal</h3>
              <NoirRating
                category="gender"
                value={genderRating}
                onChange={setGenderRating}
                size="lg"
                showLabel
              />
            </div>

            <div className="flex flex-col items-center">
              <h3 className="mb-3">Price Value</h3>
              <NoirRating
                category="priceValue"
                value={priceValueRating}
                onChange={setPriceValueRating}
                size="lg"
                showLabel
              />
            </div>

            <div className="flex flex-col items-center">
              <h3 className="mb-3">Overall Rating</h3>
              <NoirRating
                category="overall"
                value={overallRating}
                onChange={setOverallRating}
                size="lg"
                showLabel
              />
            </div>
          </div>

          <div className="border-t border-noir-dark-600 pt-6">
            <h3 className="mb-4 text-center">Read-Only Example (Different Sizes)</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-noir-gold-300 text-sm">Small:</span>
                <NoirRating
                  category="overall"
                  value={4}
                  readonly
                  size="sm"
                  showLabel
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-noir-gold-300 text-sm">Medium:</span>
                <NoirRating
                  category="overall"
                  value={4}
                  readonly
                  size="md"
                  showLabel
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-noir-gold-300 text-sm">Large:</span>
                <NoirRating
                  category="overall"
                  value={4}
                  readonly
                  size="lg"
                  showLabel
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NoirRatingDemo
