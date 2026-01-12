export type AttributeFieldType = 'number' | 'text' | 'select'

export interface AttributeFieldSchema {
  type: AttributeFieldType
  label: string
  min?: number
  max?: number
  step?: number
  options?: string[] // for select type
  optional?: boolean
}

export type CategoryAttributeSchema = Record<string, AttributeFieldSchema>

export type ProductAttributes = Record<string, string | number | null>
