import { useState } from 'react'

import RangeSlider from '../../app/components/Atoms/RangeSlider/RangeSlider'

export default {
  title: 'Atoms/RangeSlider',
  component: RangeSlider,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A customizable range slider component with GSAP animations'
      }
    }
  }
}

export const Default = () => (
  <div className="w-96 p-4">
    <RangeSlider
      min={0}
      max={100}
      step={1}
      value={50}
    />
  </div>
)

export const WithLabel = () => (
  <div className="w-96 p-4">
    <RangeSlider
      label="Volume"
      min={0}
      max={100}
      step={1}
      value={75}
    />
  </div>
)

export const SmallSize = () => (
  <div className="w-96 p-4">
    <RangeSlider
      label="Small Slider"
      size="small"
      min={0}
      max={100}
      value={25}
    />
  </div>
)

export const LargeSize = () => (
  <div className="w-96 p-4">
    <RangeSlider
      label="Large Slider"
      size="large"
      min={0}
      max={100}
      value={80}
    />
  </div>
)

export const CustomRange = () => (
  <div className="w-96 p-4">
    <RangeSlider
      label="Price Range"
      min={10}
      max={1000}
      step={10}
      value={250}
    />
  </div>
)

export const Disabled = () => (
  <div className="w-96 p-4">
    <RangeSlider
      label="Disabled Slider"
      disabled={true}
      min={0}
      max={100}
      value={60}
    />
  </div>
)

export const Interactive = () => {
  const [value, setValue] = useState(50)

  return (
    <div className="w-96 p-4">
      <RangeSlider
        label={`Interactive Slider (${value}%)`}
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={setValue}
      />
      <div className="mt-4 text-sm text-gray-600">
        Current value: {value}
      </div>
    </div>
  )
}

export const WithManualInput = () => {
  const [value, setValue] = useState(25)

  return (
    <div className="w-96 p-4">
      <RangeSlider
        label={`Manual Input Slider (${value}ml)`}
        min={0}
        max={100}
        step={0.5}
        value={value}
        onChange={setValue}
        formatValue={val => val.toFixed(1)}
        showManualInput={true}
        inputPlaceholder="Enter value (0-100ml)"
      />
      <div className="mt-4 text-sm text-gray-600">
        Current value: {value}ml
      </div>
    </div>
  )
}