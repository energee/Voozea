-- Add attribute_schema column to categories table
-- This stores the schema definition for product attributes per category
ALTER TABLE public.categories
ADD COLUMN attribute_schema jsonb DEFAULT '{}';

-- Add GIN index on product attributes for efficient filtering queries
CREATE INDEX idx_products_attributes_gin ON public.products USING GIN (attributes);

-- Add comment for documentation
COMMENT ON COLUMN public.categories.attribute_schema IS 'JSON schema defining available attributes for products in this category. Format: { "fieldName": { "type": "number|text|select", "label": "Display Label", "min?": number, "max?": number, "step?": number, "options?": string[], "optional?": boolean } }';
