import Input from "~/components/Atoms/Input/Input"
import Select from "~/components/Atoms/Select/Select"
import { houseTypes } from "~/data/SelectTypes"
const InfoFieldset = ({ inputRef, data, actions, hideImage = false }) => (
  <fieldset className="flex flex-col gap-2">
    <legend className="text-3xl text-noir-gold-100 font-bold mb-2">Info</legend>
    <Input
      shading={true}
      inputType="text"
      inputRef={inputRef}
      action={actions.name}
      inputId="name"
      defaultValue={data?.name}
    />
    <Input
      shading={true}
      inputType="text"
      inputRef={inputRef}
      action={actions.description}
      inputId="description"
      defaultValue={data?.description}
    />
    <div className="grid grid-cols-2 gap-2">
      <Input
        shading={true}
        inputType="text"
        inputRef={inputRef}
        action={actions.founded}
        inputId="founded"
        defaultValue={data?.founded}
      />
      <Select
        label="House Type"
        selectId="type"
        selectData={houseTypes}
        defaultId={data?.type}
      />
    </div>
    {!hideImage && (
      <Input
        shading={true}
        inputType="text"
        inputRef={inputRef}
        action={actions.image}
        inputId="image"
        defaultValue={data?.image}
      />
    )}
  </fieldset>
)

export default InfoFieldset
