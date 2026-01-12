-- Add default_product_category_id to categories table
-- This allows business types to specify their default product category
ALTER TABLE public.categories
ADD COLUMN default_product_category_id uuid REFERENCES public.categories(id);

-- Add comment for documentation
COMMENT ON COLUMN public.categories.default_product_category_id IS 'For business_type categories, specifies the default product_category for products created under businesses of this type';

-- Create index for the foreign key
CREATE INDEX idx_categories_default_product_category ON public.categories(default_product_category_id);
