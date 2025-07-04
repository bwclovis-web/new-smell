// Alternative approach using roundToDecimal utility
// You can use this instead of the integer multiplication approach

import { roundToDecimal } from "~/utils/numberUtils"

// In your component:
<RangeSlider
min={0}
max={10}
step={0.1}
value={parseFloat(perfumeAmount) || 0}
onChange={value => {
// Round to 1 decimal place to avoid floating-point precision issues
const roundedValue = roundToDecimal(value, 1)
setPerfumeAmount(roundedValue.toFixed(1))
}}
formatValue={value => roundToDecimal(value, 1).toFixed(1)}
label={t('myScents.modal.amountLabel')}
/>

// This approach:
// 1. Uses the original decimal step (0.1)
// 2. Rounds the value to eliminate floating-point precision errors
// 3. Ensures consistent 1-decimal formatting
// 4. Is more readable and intuitive than the integer multiplication approach
