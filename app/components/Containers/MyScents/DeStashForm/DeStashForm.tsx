import { t } from "i18next"
import { useCallback, useMemo } from "react"

import { Button } from "~/components/Atoms/Button"
import RadioSelect from "~/components/Atoms/RadioSelect"
import RangeSlider from "~/components/Atoms/RangeSlider"
import VooDooCheck from "~/components/Atoms/VooDooCheck/VooDooCheck"
import { useFormState } from "~/hooks"
import type { UserPerfumeI } from "~/types"

interface DeStashFormProps {
   
  handleDecantConfirm: (deStashData: DeStashData) => void
  handleDecantCancel?: () => void
  userPerfume: UserPerfumeI
}

interface DeStashData {
  amount: string
  price?: string
  tradePreference: "cash" | "trade" | "both"
  tradeOnly: boolean
}

const DeStashForm = ({ handleDecantConfirm, userPerfume }: DeStashFormProps) => {
  const initialValues = useMemo(
    () => ({
      deStashAmount: userPerfume.available || "0",
      price: userPerfume.tradePrice || "",
      tradePreference:
        (userPerfume.tradePreference as "cash" | "trade" | "both") || "cash",
      tradeOnly: userPerfume.tradeOnly || false,
    }),
    [
      userPerfume.available,
      userPerfume.tradePrice,
      userPerfume.tradePreference,
      userPerfume.tradeOnly,
    ]
  )

  // Memoize validation function
  const validate = useCallback(
    (values: typeof initialValues) => {
      const errors: Partial<Record<keyof typeof values, string>> = {}

      const amount = parseFloat(values.deStashAmount)
      if (isNaN(amount) || amount < 0) {
        errors.deStashAmount = t("myScents.listItem.decantOptionsAmountError")
      }
      if (amount > parseFloat(userPerfume.amount)) {
        errors.deStashAmount = t("myScents.listItem.decantOptionsAmountError")
      }

      // Price is optional, but if provided, it should be a valid number
      if (values.price && values.price !== "") {
        const price = parseFloat(values.price)
        if (isNaN(price) || price < 0) {
          errors.price = t("myScents.listItem.decantOptionsPriceError")
        }
      }

      return errors
    },
    [userPerfume.amount]
  )

  // Memoize submit handler
  const onSubmit = useCallback(
    (values: typeof initialValues) => {
      const deStashData: DeStashData = {
        amount: values.deStashAmount,
        price: values.price || undefined,
        tradePreference: values.tradePreference,
        tradeOnly: values.tradeOnly,
      }
      handleDecantConfirm(deStashData)
      // Form will be reset by parent component after successful destash processing
    },
    [handleDecantConfirm]
  )

  const { values, errors, isValid, setValue, handleSubmit } = useFormState({
    initialValues,
    validate,
    onSubmit,
    resetOnSubmit: false,
  })

  const tradeOptions = [
    { id: "cash", value: "cash", label: t("myScents.listItem.decantOptionsTradePreferencesCash"), name: "tradePreference" },
    {
      id: "trade",
      value: "trade",
      label: t("myScents.listItem.decantOptionsTradePreferencesTrade"),
      name: "tradePreference",
    },
    {
      id: "both",
      value: "both",
      label: t("myScents.listItem.decantOptionsTradePreferencesBoth"),
      name: "tradePreference",
    },
  ]

  return (
    <div className="p-4">
      <h3 className="!text-noir-dark">{t("myScents.listItem.decantOptionsTitle")}</h3>
      <p className="text-sm text-noir-black">
        {t("myScents.listItem.decantOptionsDescriptionOne")}
      </p>
      <p className="text-sm text-noir-black">
        {t("myScents.listItem.decantOptionsDescriptionTwo")}
      </p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {/* Amount Slider */}
        <div>
          <RangeSlider
            min={0}
            max={parseFloat(userPerfume.amount)}
            step={0.1}
            value={parseFloat(values.deStashAmount) || 0}
            onChange={value => setValue("deStashAmount", value.toFixed(1))}
            formatValue={value => value.toFixed(1)}
            label={t("myScents.listItem.decantOptionsAmountLabel")}
            showManualInput={true}  
            inputPlaceholder={t("myScents.listItem.decantOptionsAmountPlaceholder", { amount: userPerfume.amount })}
          />
          {errors.deStashAmount && (
            <p className="text-red-500 text-sm mt-1">{errors.deStashAmount}</p>
          )}
        </div>

        {/* Price Input */}
        {parseFloat(values.deStashAmount) > 0 && (
          <div>
            <label
              htmlFor="price"
              className="block text-sm font-medium text-noir-dark mb-1"
            >
              {t("myScents.listItem.decantOptionsPriceLabel")}
            </label>
            <input
              type="number"
              id="price"
              name="price"
              placeholder="0.00"
              value={values.price}
              onChange={event => setValue("price", event.target.value)}
              step="0.01"
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        )}

        {parseFloat(values.deStashAmount) > 0 && (
          <div>
            <fieldset>
              <legend className="block text-sm font-medium text-gray-700 mb-2">
                {t("myScents.listItem.decantOptionsTradePreferencesLabel")}
              </legend>
              <RadioSelect
                data={tradeOptions.map(option => ({
                  ...option,
                  defaultChecked: option.value === values.tradePreference,
                }))}
                handleRadioChange={event => setValue(
                    "tradePreference",
                    event.target.value as "cash" | "trade" | "both"
                  )
                }
              />
            </fieldset>
          </div>
        )}

        {parseFloat(values.deStashAmount) > 0 &&
          values.tradePreference !== "cash" && (
            <div>
              <VooDooCheck
                labelChecked={t("myScents.listItem.decantOptionsTradePreferencesOnlyTrades")}
                labelUnchecked={t("myScents.listItem.decantOptionsTradePreferencesAcceptBoth")}
                checked={values.tradeOnly}
                onChange={() => setValue("tradeOnly", !values.tradeOnly)}
              />
            </div>
          )}

        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={!isValid || parseFloat(values.deStashAmount) < 0}
            variant="primary"
          >
            {parseFloat(values.deStashAmount) === 0
              ? t("myScents.listItem.removeFromTradingPost")
              : t("myScents.listItem.confirmDeStash")}
          </Button>
        </div>
      </form>
    </div>
  )
}
export default DeStashForm
