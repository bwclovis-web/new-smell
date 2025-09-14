import { useState } from 'react'

import NoirRating from '~/components/Organisms/NoirRating'
import PerfumeRatingSystem from '~/components/Containers/Perfume/PerfumeRatingSystem'

function NoirRatingShowcase() {
  const [selectedCategory, setSelectedCategory] = useState<
    'longevity' | 'sillage' | 'gender' | 'priceValue' | 'overall'
  >('overall')
  const [selectedValue, setSelectedValue] = useState<number | null>(3)

  const mockUserRatings = {
    longevity: 4,
    sillage: 3,
    gender: 5,
    priceValue: 2,
    overall: 4
  }

  const mockAverageRatings = {
    longevity: 3.8,
    sillage: 4.2,
    gender: 3.5,
    priceValue: 3.9,
    overall: 4.1,
    totalRatings: 42
  }

  return (
    <div className="min-h-screen bg-noir-dark-900 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-noir-gold-300 mb-4">
            Film Noir Rating System
          </h1>
          <p className="text-lg text-noir-gold-200 max-w-2xl mx-auto">
            A comprehensive perfume rating system with animated perfume bottle SVGs
            and GSAP-powered liquid filling effects for an immersive experience.
          </p>
        </header>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Individual Component Demo */}
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-noir-gold-300 text-center">
              Individual Rating Component
            </h2>

            <div className="bg-noir-dark-800 rounded-lg p-6 space-y-6">
              <div>
                <label
                  htmlFor="category-select"
                  className="block text-sm font-medium text-noir-gold-200 mb-2"
                >
                  Category:
                </label>
                <select
                  id="category-select"
                  value={selectedCategory}
                  onChange={evt => setSelectedCategory(evt.target.value as any)}
                  className="w-full p-2 bg-noir-dark-700 border border-noir-dark-600 rounded text-noir-gold-200"
                >
                  <option value="longevity">Longevity</option>
                  <option value="sillage">Sillage</option>
                  <option value="gender">Gender Appeal</option>
                  <option value="priceValue">Price Value</option>
                  <option value="overall">Overall Rating</option>
                </select>
              </div>

              <div className="flex flex-col items-center space-y-4">
                <h3 className="text-lg font-medium text-noir-gold-200">
                  Interactive Rating
                </h3>
                <NoirRating
                  category={selectedCategory}
                  value={selectedValue}
                  onChange={setSelectedValue}
                  size="lg"
                  showLabel
                />
                <p className="text-sm text-noir-gold-400">
                  Current value: {selectedValue || 'None'}
                </p>
              </div>

              <div className="border-t border-noir-dark-600 pt-4">
                <h4 className="text-md font-medium text-noir-gold-200 mb-3 text-center">
                  Read-Only Examples
                </h4>
                <div className="space-y-3">
                  {[
                    1,
                    2,
                    3,
                    4,
                    5
                  ].map(value => (
                    <div key={value} className="flex items-center justify-between">
                      <span className="text-noir-gold-300 text-sm w-16">
                        {value} star{value !== 1 ? 's' : ''}:
                      </span>
                      <NoirRating
                        category={selectedCategory}
                        value={value}
                        readonly
                        size="sm"
                        showLabel
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Complete System Demo */}
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-noir-gold-300 text-center">
              Complete Rating System
            </h2>

            <PerfumeRatingSystem
              perfumeId="demo-perfume-123"
              userId="demo-user-456"
              userRatings={mockUserRatings}
              averageRatings={mockAverageRatings}
            />
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16 bg-noir-dark-800 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-noir-gold-300 mb-6 text-center">
            System Features
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-noir-gold-200 mb-2">
                Film Noir Aesthetic
              </h3>
              <p className="text-sm text-noir-gold-400">
                Vintage-inspired design with shadows, gradients, and Art Deco styling
              </p>
            </div>

            <div className="text-center">
              <h3 className="text-lg font-semibold text-noir-gold-200 mb-2">
                Animated Perfume Bottles
              </h3>
              <p className="text-sm text-noir-gold-400">
                Custom SVG bottles with unique shapes for each rating category
              </p>
            </div>

            <div className="text-center">
              <h3 className="text-lg font-semibold text-noir-gold-200 mb-2">
                Comprehensive Categories
              </h3>
              <p className="text-sm text-noir-gold-400">
                Longevity, Sillage, Gender Appeal, Price Value, and Overall ratings
              </p>
            </div>

            <div className="text-center">
              <h3 className="text-lg font-semibold text-noir-gold-200 mb-2">
                User Authentication
              </h3>
              <p className="text-sm text-noir-gold-400">
                Prevents duplicate voting while allowing rating updates
              </p>
            </div>

            <div className="text-center">
              <h3 className="text-lg font-semibold text-noir-gold-200 mb-2">
                GSAP Liquid Animation
              </h3>
              <p className="text-sm text-noir-gold-400">
                Dynamic liquid filling effects for overall ratings with animation
              </p>
            </div>

            <div className="text-center">
              <h3 className="text-lg font-semibold text-noir-gold-200 mb-2">
                Community Averages
              </h3>
              <p className="text-sm text-noir-gold-400">
                Display aggregate ratings with vote counts
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NoirRatingShowcase
