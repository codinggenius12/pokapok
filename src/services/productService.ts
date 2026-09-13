import { supabase } from "../lib/supabase";

/* =========================================================
   PUBLIC PRODUCT TYPES
========================================================= */

export type PublicProduct = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  model: string | null;
  category: string | null;

  condition:
    | "new"
    | "refurbished"
    | "used";

  /*
   * Only relevant when condition === "new".
   *
   * true means customers may additionally choose
   * the refurbished condition.
   */
  refurbished_enabled: boolean;

  description: string | null;

  /*
   * Legacy product-level compatibility fields.
   *
   * product_variants is authoritative for:
   * - storage
   * - colour
   * - stock
   * - images
   * - customer pricing
   */
  storage: string | null;
  color: string | null;

  battery_health: number | null;

  /*
   * Primary legacy product price.
   *
   * New product:
   *   new price.
   *
   * Dedicated refurbished product:
   *   refurbished price.
   *
   * Used product:
   *   used price.
   */
  sale_price: number;
  promotional_price: number | null;

  /*
   * Secondary refurbished fallback.
   *
   * Only applies to:
   *
   * condition === "new"
   * refurbished_enabled === true
   */
  refurbished_price: number | null;
  refurbished_promotional_price: number | null;

  stock: number;

  available: boolean;
  published: boolean;
  featured: boolean;

  lease_enabled: boolean;
  lease_monthly_price: number | null;
  lease_deposit: number | null;
  lease_term_months: number | null;

  financing_enabled: boolean;
  financing_monthly_price: number | null;
  financing_deposit: number | null;
  financing_term_months: number | null;

  insurance_enabled: boolean;
  insurance_monthly_price: number | null;
  insurance_annual_price: number | null;
  insurance_single_price: number | null;
  insurance_deductible: number | null;

  image_url: string | null;

  warranty_months: number;

  created_at: string;
  updated_at: string;
};

/* =========================================================
   PUBLIC PRODUCT VARIANT TYPES
========================================================= */

export type PublicProductVariant = {
  id: string;
  product_id: string;

  storage: string;
  color: string;

  color_hex: string | null;
  sku: string | null;

  /*
   * Legacy migration compatibility.
   *
   * New migrated products should normally use
   * direct variant prices instead.
   */
  price_adjustment: number;

  /*
   * Primary variant customer pricing.
   *
   * product.condition === "new":
   *   new pricing.
   *
   * product.condition === "refurbished":
   *   refurbished pricing.
   *
   * product.condition === "used":
   *   used pricing.
   *
   * Purchase prices are deliberately not exposed.
   */
  sale_price: number | null;
  promotional_price: number | null;

  /*
   * Secondary refurbished pricing.
   *
   * Used only when:
   *
   * product.condition === "new"
   * product.refurbished_enabled === true
   */
  refurbished_sale_price: number | null;
  refurbished_promotional_price: number | null;

  stock: number;
  available: boolean;

  image_url: string | null;

  created_at: string;
  updated_at: string;
};

/* =========================================================
   PUBLIC SPECIFICATION TYPES
========================================================= */

export type PublicProductSpecification = {
  id: string;
  product_id: string;

  name: string;
  value: string;

  sort_order: number;

  created_at: string;
};

/* =========================================================
   COLOR / STORAGE TYPES
========================================================= */

export type PublicProductColor = {
  name: string;
  hex: string;

  image_url: string | null;

  available: boolean;
  stock: number;
};

export type PublicProductStorage = {
  label: string;

  /*
   * Lowest active customer price found for
   * this storage option.
   */
  price: number | null;

  available: boolean;
  stock: number;
};

/*
 * Public UI condition.
 *
 * Dedicated "used" products are represented through
 * the refurbished/customer-used flow on the storefront.
 */
export type PublicSellCondition =
  | "new"
  | "refurbished";

/* =========================================================
   NORMALIZATION HELPERS
========================================================= */

function toNumber(
  value: unknown
): number {
  const parsed =
    Number(
      value ?? 0
    );

  return Number.isFinite(
    parsed
  )
    ? parsed
    : 0;
}

function toNullableNumber(
  value: unknown
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsed =
    Number(
      value
    );

  return Number.isFinite(
    parsed
  )
    ? parsed
    : null;
}

function normalizeString(
  value: unknown
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(
    value
  ).trim();
}

function safeMoney(
  value: number
): number {
  return (
    Math.round(
      (
        value +
        Number.EPSILON
      ) *
        100
    ) /
    100
  );
}

/* =========================================================
   NORMALIZE PRODUCT
========================================================= */

function normalizeProduct(
  product: any
): PublicProduct {
  return {
    ...product,

    name:
      normalizeString(
        product.name
      ),

    slug:
      normalizeString(
        product.slug
      ),

    brand:
      normalizeString(
        product.brand
      ),

    model:
      product.model == null
        ? null
        : normalizeString(
            product.model
          ),

    category:
      product.category == null
        ? null
        : normalizeString(
            product.category
          ),

    description:
      product.description == null
        ? null
        : normalizeString(
            product.description
          ),

    storage:
      product.storage == null
        ? null
        : normalizeString(
            product.storage
          ),

    color:
      product.color == null
        ? null
        : normalizeString(
            product.color
          ),

    sale_price:
      toNumber(
        product.sale_price
      ),

    promotional_price:
      toNullableNumber(
        product.promotional_price
      ),

    refurbished_price:
      toNullableNumber(
        product.refurbished_price
      ),

    refurbished_promotional_price:
      toNullableNumber(
        product.refurbished_promotional_price
      ),

    stock:
      Math.max(
        0,
        toNumber(
          product.stock
        )
      ),

    battery_health:
      toNullableNumber(
        product.battery_health
      ),

    lease_monthly_price:
      toNullableNumber(
        product.lease_monthly_price
      ),

    lease_deposit:
      toNullableNumber(
        product.lease_deposit
      ),

    lease_term_months:
      toNullableNumber(
        product.lease_term_months
      ),

    financing_monthly_price:
      toNullableNumber(
        product.financing_monthly_price
      ),

    financing_deposit:
      toNullableNumber(
        product.financing_deposit
      ),

    financing_term_months:
      toNullableNumber(
        product.financing_term_months
      ),

    insurance_monthly_price:
      toNullableNumber(
        product.insurance_monthly_price
      ),

    insurance_annual_price:
      toNullableNumber(
        product.insurance_annual_price
      ),

    insurance_single_price:
      toNullableNumber(
        product.insurance_single_price
      ),

    insurance_deductible:
      toNullableNumber(
        product.insurance_deductible
      ),

    warranty_months:
      toNumber(
        product.warranty_months ??
          12
      ),

    refurbished_enabled:
      Boolean(
        product.refurbished_enabled
      ),

    available:
      Boolean(
        product.available
      ),

    published:
      Boolean(
        product.published
      ),

    featured:
      Boolean(
        product.featured
      ),

    lease_enabled:
      Boolean(
        product.lease_enabled
      ),

    financing_enabled:
      Boolean(
        product.financing_enabled
      ),

    insurance_enabled:
      Boolean(
        product.insurance_enabled
      ),

    image_url:
      product.image_url
        ? String(
            product.image_url
          )
        : null,
  };
}

/* =========================================================
   NORMALIZE VARIANT
========================================================= */

function normalizeVariant(
  variant: any
): PublicProductVariant {
  return {
    ...variant,

    storage:
      normalizeString(
        variant.storage
      ),

    color:
      normalizeString(
        variant.color
      ),

    color_hex:
      variant.color_hex
        ? normalizeString(
            variant.color_hex
          )
        : null,

    sku:
      variant.sku
        ? normalizeString(
            variant.sku
          )
        : null,

    price_adjustment:
      toNumber(
        variant.price_adjustment
      ),

    sale_price:
      toNullableNumber(
        variant.sale_price
      ),

    promotional_price:
      toNullableNumber(
        variant.promotional_price
      ),

    refurbished_sale_price:
      toNullableNumber(
        variant.refurbished_sale_price
      ),

    refurbished_promotional_price:
      toNullableNumber(
        variant.refurbished_promotional_price
      ),

    stock:
      Math.max(
        0,
        toNumber(
          variant.stock
        )
      ),

    available:
      Boolean(
        variant.available
      ),

    image_url:
      variant.image_url
        ? String(
            variant.image_url
          )
        : null,
  };
}

/* =========================================================
   NORMALIZE SPECIFICATION
========================================================= */

function normalizeSpecification(
  specification: any
): PublicProductSpecification {
  return {
    ...specification,

    name:
      normalizeString(
        specification.name
      ),

    value:
      normalizeString(
        specification.value
      ),

    sort_order:
      toNumber(
        specification.sort_order
      ),
  };
}

/* =========================================================
   PRODUCT SELECT

   NEVER expose purchase_price publicly.
========================================================= */

const publicProductSelect = `
  id,
  name,
  slug,
  brand,
  model,
  category,
  condition,
  refurbished_enabled,
  description,

  storage,
  color,
  battery_health,

  sale_price,
  promotional_price,
  refurbished_price,
  refurbished_promotional_price,

  stock,

  available,
  published,
  featured,

  lease_enabled,
  lease_monthly_price,
  lease_deposit,
  lease_term_months,

  financing_enabled,
  financing_monthly_price,
  financing_deposit,
  financing_term_months,

  insurance_enabled,
  insurance_monthly_price,
  insurance_annual_price,
  insurance_single_price,
  insurance_deductible,

  image_url,
  warranty_months,

  created_at,
  updated_at
`;

/* =========================================================
   VARIANT SELECT

   purchase_price and refurbished_purchase_price
   are intentionally excluded.
========================================================= */

const publicVariantSelect = `
  id,
  product_id,

  storage,
  color,
  color_hex,

  sku,

  price_adjustment,

  sale_price,
  promotional_price,

  refurbished_sale_price,
  refurbished_promotional_price,

  stock,
  available,

  image_url,

  created_at,
  updated_at
`;

/* =========================================================
   SPECIFICATION SELECT
========================================================= */

const publicSpecificationSelect = `
  id,
  product_id,

  name,
  value,

  sort_order,

  created_at
`;

/* =========================================================
   GET PUBLIC PRODUCTS
========================================================= */

export async function getPublicProducts(): Promise<
  PublicProduct[]
> {
  const {
    data,
    error,
  } = await supabase
    .from(
      "products"
    )
    .select(
      publicProductSelect
    )
    .eq(
      "published",
      true
    )
    .order(
      "featured",
      {
        ascending:
          false,
      }
    )
    .order(
      "created_at",
      {
        ascending:
          false,
      }
    );

  if (
    error
  ) {
    console.error(
      "Failed to load public products:",
      error
    );

    throw error;
  }

  return (
    data ?? []
  ).map(
    normalizeProduct
  );
}

/* =========================================================
   GET PRODUCT BY SLUG
========================================================= */

export async function getPublicProductBySlug(
  slug: string
): Promise<
  PublicProduct | null
> {
  const cleanSlug =
    normalizeString(
      slug
    ).toLowerCase();

  if (
    !cleanSlug
  ) {
    return null;
  }

  const {
    data,
    error,
  } = await supabase
    .from(
      "products"
    )
    .select(
      publicProductSelect
    )
    .eq(
      "slug",
      cleanSlug
    )
    .eq(
      "published",
      true
    )
    .maybeSingle();

  if (
    error
  ) {
    console.error(
      "Failed to load public product:",
      error
    );

    throw error;
  }

  return data
    ? normalizeProduct(
        data
      )
    : null;
}

/* =========================================================
   GET PRODUCT BY ID
========================================================= */

export async function getPublicProductById(
  productId: string
): Promise<
  PublicProduct | null
> {
  const cleanProductId =
    normalizeString(
      productId
    );

  if (
    !cleanProductId
  ) {
    return null;
  }

  const {
    data,
    error,
  } = await supabase
    .from(
      "products"
    )
    .select(
      publicProductSelect
    )
    .eq(
      "id",
      cleanProductId
    )
    .eq(
      "published",
      true
    )
    .maybeSingle();

  if (
    error
  ) {
    console.error(
      "Failed to load public product by ID:",
      error
    );

    throw error;
  }

  return data
    ? normalizeProduct(
        data
      )
    : null;
}

/* =========================================================
   GET PRODUCT VARIANTS
========================================================= */

export async function getPublicProductVariants(
  productId: string
): Promise<
  PublicProductVariant[]
> {
  const cleanProductId =
    normalizeString(
      productId
    );

  if (
    !cleanProductId
  ) {
    return [];
  }

  const {
    data,
    error,
  } = await supabase
    .from(
      "product_variants"
    )
    .select(
      publicVariantSelect
    )
    .eq(
      "product_id",
      cleanProductId
    )
    .order(
      "storage",
      {
        ascending:
          true,
      }
    )
    .order(
      "color",
      {
        ascending:
          true,
      }
    );

  if (
    error
  ) {
    console.error(
      "Failed to load public product variants:",
      error
    );

    throw error;
  }

  return (
    data ?? []
  ).map(
    normalizeVariant
  );
}

/* =========================================================
   GET VARIANT BY ID
========================================================= */

export async function getPublicProductVariantById(
  variantId: string
): Promise<
  PublicProductVariant | null
> {
  const cleanVariantId =
    normalizeString(
      variantId
    );

  if (
    !cleanVariantId
  ) {
    return null;
  }

  const {
    data,
    error,
  } = await supabase
    .from(
      "product_variants"
    )
    .select(
      publicVariantSelect
    )
    .eq(
      "id",
      cleanVariantId
    )
    .maybeSingle();

  if (
    error
  ) {
    console.error(
      "Failed to load public product variant by ID:",
      error
    );

    throw error;
  }

  return data
    ? normalizeVariant(
        data
      )
    : null;
}

/* =========================================================
   GET VARIANTS BY SLUG
========================================================= */

export async function getPublicProductVariantsBySlug(
  slug: string
): Promise<
  PublicProductVariant[]
> {
  const product =
    await getPublicProductBySlug(
      slug
    );

  if (
    !product
  ) {
    return [];
  }

  return getPublicProductVariants(
    product.id
  );
}

/* =========================================================
   GET SPECIFICATIONS
========================================================= */

export async function getPublicProductSpecifications(
  productId: string
): Promise<
  PublicProductSpecification[]
> {
  const cleanProductId =
    normalizeString(
      productId
    );

  if (
    !cleanProductId
  ) {
    return [];
  }

  const {
    data,
    error,
  } = await supabase
    .from(
      "product_specifications"
    )
    .select(
      publicSpecificationSelect
    )
    .eq(
      "product_id",
      cleanProductId
    )
    .order(
      "sort_order",
      {
        ascending:
          true,
      }
    )
    .order(
      "created_at",
      {
        ascending:
          true,
      }
    );

  if (
    error
  ) {
    console.error(
      "Failed to load public product specifications:",
      error
    );

    throw error;
  }

  return (
    data ?? []
  ).map(
    normalizeSpecification
  );
}

/* =========================================================
   GET FULL PRODUCT DATA
========================================================= */

export async function getPublicProductDetailsBySlug(
  slug: string
): Promise<{
  product: PublicProduct;
  variants: PublicProductVariant[];
  specifications: PublicProductSpecification[];
} | null> {
  const product =
    await getPublicProductBySlug(
      slug
    );

  if (
    !product
  ) {
    return null;
  }

  const [
    variants,
    specifications,
  ] =
    await Promise.all([
      getPublicProductVariants(
        product.id
      ),

      getPublicProductSpecifications(
        product.id
      ),
    ]);

  return {
    product,
    variants,
    specifications,
  };
}

/* =========================================================
   PROMOTION HELPER
========================================================= */

function getValidPromotion(
  normalPrice:
    number | null,
  promotionalPrice:
    number | null
): number | null {
  if (
    normalPrice ===
      null ||
    normalPrice <=
      0
  ) {
    return null;
  }

  if (
    promotionalPrice ===
      null ||
    promotionalPrice <=
      0 ||
    promotionalPrice >=
      normalPrice
  ) {
    return null;
  }

  return safeMoney(
    promotionalPrice
  );
}

/* =========================================================
   LEGACY PRODUCT ACTIVE PRICE
========================================================= */

export function getActiveProductPrice(
  product: PublicProduct
): number {
  const promotion =
    getValidPromotion(
      product.sale_price,
      product.promotional_price
    );

  return safeMoney(
    promotion ??
      product.sale_price
  );
}

/* =========================================================
   PRODUCT PROMOTION
========================================================= */

export function productHasPromotion(
  product: PublicProduct
): boolean {
  return (
    getValidPromotion(
      product.sale_price,
      product.promotional_price
    ) !==
    null
  );
}

/* =========================================================
   CONDITION AVAILABILITY
========================================================= */

export function productHasRefurbishedOption(
  product: PublicProduct
): boolean {
  return (
    product.condition ===
      "refurbished" ||
    product.condition ===
      "used" ||
    (
      product.condition ===
        "new" &&
      product.refurbished_enabled
    )
  );
}

export function productCanBeSoldNew(
  product: PublicProduct
): boolean {
  return (
    product.condition ===
    "new"
  );
}

export function productCanBeSoldRefurbished(
  product: PublicProduct
): boolean {
  return (
    product.condition ===
      "refurbished" ||
    product.condition ===
      "used" ||
    (
      product.condition ===
        "new" &&
      product.refurbished_enabled
    )
  );
}

export function productHasMultipleConditionOptions(
  product: PublicProduct
): boolean {
  return (
    product.condition ===
      "new" &&
    product.refurbished_enabled
  );
}

/* =========================================================
   SECONDARY REFURBISHED PRODUCT PRICE
========================================================= */

export function productHasRefurbishedPrice(
  product: PublicProduct
): boolean {
  /*
   * This field is only meaningful when a NEW product
   * additionally offers refurbished.
   */
  if (
    product.condition !==
      "new" ||
    !product.refurbished_enabled
  ) {
    return false;
  }

  return (
    product.refurbished_price !==
      null &&
    product.refurbished_price >
      0
  );
}

export function productHasRefurbishedPromotion(
  product: PublicProduct
): boolean {
  if (
    !productHasRefurbishedPrice(
      product
    )
  ) {
    return false;
  }

  return (
    getValidPromotion(
      product.refurbished_price,
      product.refurbished_promotional_price
    ) !==
    null
  );
}

export function getActiveRefurbishedPrice(
  product: PublicProduct
): number | null {
  /*
   * Dedicated refurbished / used product.
   *
   * Its primary sale_price already represents
   * its customer price.
   */
  if (
    product.condition ===
      "refurbished" ||
    product.condition ===
      "used"
  ) {
    return getActiveProductPrice(
      product
    );
  }

  /*
   * NEW product + optional refurbished.
   */
  if (
    product.condition !==
      "new" ||
    !product.refurbished_enabled
  ) {
    return null;
  }

  if (
    product.refurbished_price ===
      null ||
    product.refurbished_price <=
      0
  ) {
    return null;
  }

  return safeMoney(
    getValidPromotion(
      product.refurbished_price,
      product.refurbished_promotional_price
    ) ??
      product.refurbished_price
  );
}

/* =========================================================
   PRODUCT ACTIVE PRICE BY CONDITION
========================================================= */

export function getActiveProductPriceByCondition(
  product: PublicProduct,
  condition: PublicSellCondition
): number {
  if (
    condition ===
    "new"
  ) {
    if (
      !productCanBeSoldNew(
        product
      )
    ) {
      throw new Error(
        "This product is not available as new."
      );
    }

    return getActiveProductPrice(
      product
    );
  }

  if (
    !productCanBeSoldRefurbished(
      product
    )
  ) {
    throw new Error(
      "This product is not available refurbished."
    );
  }

  /*
   * Dedicated refurbished / used product.
   */
  if (
    product.condition ===
      "refurbished" ||
    product.condition ===
      "used"
  ) {
    return getActiveProductPrice(
      product
    );
  }

  /*
   * NEW + optional refurbished.
   */
  const price =
    getActiveRefurbishedPrice(
      product
    );

  if (
    price === null
  ) {
    throw new Error(
      "Refurbished price is not configured."
    );
  }

  return price;
}

/* =========================================================
   PRODUCT NORMAL PRICE BY CONDITION
========================================================= */

export function getNormalProductPriceByCondition(
  product: PublicProduct,
  condition: PublicSellCondition
): number {
  if (
    condition ===
    "new"
  ) {
    if (
      !productCanBeSoldNew(
        product
      )
    ) {
      throw new Error(
        "This product is not available as new."
      );
    }

    return safeMoney(
      product.sale_price
    );
  }

  if (
    !productCanBeSoldRefurbished(
      product
    )
  ) {
    throw new Error(
      "This product is not available refurbished."
    );
  }

  /*
   * Dedicated refurbished / used product.
   */
  if (
    product.condition ===
      "refurbished" ||
    product.condition ===
      "used"
  ) {
    if (
      product.sale_price <=
      0
    ) {
      throw new Error(
        "Product price is not configured."
      );
    }

    return safeMoney(
      product.sale_price
    );
  }

  /*
   * NEW + optional refurbished.
   */
  if (
    product.refurbished_price ===
      null ||
    product.refurbished_price <=
      0
  ) {
    throw new Error(
      "Refurbished price is not configured."
    );
  }

  return safeMoney(
    product.refurbished_price
  );
}

/* =========================================================
   PRODUCT PROMOTION BY CONDITION
========================================================= */

export function productHasPromotionByCondition(
  product: PublicProduct,
  condition: PublicSellCondition
): boolean {
  if (
    condition ===
    "new"
  ) {
    return productHasPromotion(
      product
    );
  }

  /*
   * Dedicated refurbished / used products use
   * promotional_price.
   */
  if (
    product.condition ===
      "refurbished" ||
    product.condition ===
      "used"
  ) {
    return productHasPromotion(
      product
    );
  }

  /*
   * NEW + optional refurbished.
   */
  return productHasRefurbishedPromotion(
    product
  );
}

/* =========================================================
   PRODUCT VISIBILITY
========================================================= */

export function productShouldBeVisible(
  product: PublicProduct
): boolean {
  return Boolean(
    product.published
  );
}

/* =========================================================
   PRODUCT PURCHASABLE
========================================================= */

export function productIsPurchasable(
  product: PublicProduct
): boolean {
  return (
    product.published &&
    product.available &&
    product.stock >
      0
  );
}

/* =========================================================
   PRODUCT PURCHASABLE BY CONDITION
========================================================= */

export function productIsPurchasableByCondition(
  product: PublicProduct,
  condition: PublicSellCondition
): boolean {
  if (
    !productIsPurchasable(
      product
    )
  ) {
    return false;
  }

  if (
    condition ===
    "new"
  ) {
    return productCanBeSoldNew(
      product
    );
  }

  return productCanBeSoldRefurbished(
    product
  );
}

/* =========================================================
   VARIANT PURCHASABLE
========================================================= */

export function variantIsPurchasable(
  variant: PublicProductVariant
): boolean {
  return (
    variant.available &&
    variant.stock >
      0
  );
}

/* =========================================================
   VARIANT BELONGS TO PRODUCT
========================================================= */

export function variantBelongsToProduct(
  product: PublicProduct,
  variant: PublicProductVariant
): boolean {
  return (
    variant.product_id ===
    product.id
  );
}

/* =========================================================
   VARIANT HAS CONFIGURED PRICE
========================================================= */

export function variantHasConfiguredPrice(
  variant: PublicProductVariant,
  condition: PublicSellCondition,
  product?: PublicProduct
): boolean {
  /*
   * NEW products use primary sale_price.
   */
  if (
    condition ===
    "new"
  ) {
    return (
      variant.sale_price !==
        null &&
      variant.sale_price >
        0
    );
  }

  /*
   * Dedicated refurbished / used products
   * also use primary sale_price.
   */
  if (
    product?.condition ===
      "refurbished" ||
    product?.condition ===
      "used"
  ) {
    return (
      variant.sale_price !==
        null &&
      variant.sale_price >
        0
    );
  }

  /*
   * NEW + optional refurbished.
   */
  return (
    variant.refurbished_sale_price !==
      null &&
    variant.refurbished_sale_price >
      0
  );
}

/* =========================================================
   VARIANT NORMAL PRICE BY CONDITION
========================================================= */

export function getVariantNormalPriceByCondition(
  product: PublicProduct,
  variant: PublicProductVariant,
  condition: PublicSellCondition
): number {
  if (
    !variantBelongsToProduct(
      product,
      variant
    )
  ) {
    throw new Error(
      "The selected variant does not belong to this product."
    );
  }

  /*
   * NEW
   */
  if (
    condition ===
    "new"
  ) {
    if (
      !productCanBeSoldNew(
        product
      )
    ) {
      throw new Error(
        "This product is not available as new."
      );
    }

    /*
     * Direct variant price is authoritative.
     */
    if (
      variant.sale_price !==
        null &&
      variant.sale_price >
        0
    ) {
      return safeMoney(
        variant.sale_price
      );
    }

    /*
     * Legacy product + adjustment fallback.
     */
    if (
      product.sale_price >
      0
    ) {
      return safeMoney(
        product.sale_price +
          variant.price_adjustment
      );
    }

    throw new Error(
      "Variant price is not configured."
    );
  }

  /*
   * REFURBISHED / USED CUSTOMER CONDITION
   */
  if (
    !productCanBeSoldRefurbished(
      product
    )
  ) {
    throw new Error(
      "This product is not available refurbished."
    );
  }

  /*
   * Dedicated refurbished / used product.
   *
   * Primary variant sale_price is already
   * its customer selling price.
   */
  if (
    product.condition ===
      "refurbished" ||
    product.condition ===
      "used"
  ) {
    if (
      variant.sale_price !==
        null &&
      variant.sale_price >
        0
    ) {
      return safeMoney(
        variant.sale_price
      );
    }

    if (
      product.sale_price >
      0
    ) {
      return safeMoney(
        product.sale_price +
          variant.price_adjustment
      );
    }

    throw new Error(
      "Variant price is not configured."
    );
  }

  /*
   * NEW + optional refurbished.
   */
  if (
    variant.refurbished_sale_price !==
      null &&
    variant.refurbished_sale_price >
      0
  ) {
    return safeMoney(
      variant.refurbished_sale_price
    );
  }

  /*
   * Legacy product-level refurbished fallback.
   */
  if (
    product.refurbished_price !==
      null &&
    product.refurbished_price >
      0
  ) {
    return safeMoney(
      product.refurbished_price +
        variant.price_adjustment
    );
  }

  throw new Error(
    "Refurbished variant price is not configured."
  );
}

/* =========================================================
   VARIANT ACTIVE PRICE BY CONDITION
========================================================= */

export function getPublicVariantPriceByCondition(
  product: PublicProduct,
  variant: PublicProductVariant,
  condition: PublicSellCondition
): number {
  const normalPrice =
    getVariantNormalPriceByCondition(
      product,
      variant,
      condition
    );

  /*
   * NEW
   */
  if (
    condition ===
    "new"
  ) {
    const promotion =
      getValidPromotion(
        variant.sale_price,
        variant.promotional_price
      );

    if (
      promotion !==
      null
    ) {
      return promotion;
    }

    /*
     * Direct variant price exists.
     */
    if (
      variant.sale_price !==
        null &&
      variant.sale_price >
        0
    ) {
      return normalPrice;
    }

    /*
     * Legacy product-level fallback.
     */
    return safeMoney(
      getActiveProductPrice(
        product
      ) +
        variant.price_adjustment
    );
  }

  /*
   * DEDICATED REFURBISHED / USED
   *
   * Uses primary sale/promotional columns.
   */
  if (
    product.condition ===
      "refurbished" ||
    product.condition ===
      "used"
  ) {
    const promotion =
      getValidPromotion(
        variant.sale_price,
        variant.promotional_price
      );

    if (
      promotion !==
      null
    ) {
      return promotion;
    }

    if (
      variant.sale_price !==
        null &&
      variant.sale_price >
        0
    ) {
      return normalPrice;
    }

    return safeMoney(
      getActiveProductPrice(
        product
      ) +
        variant.price_adjustment
    );
  }

  /*
   * NEW + OPTIONAL REFURBISHED
   */
  const refurbishedPromotion =
    getValidPromotion(
      variant.refurbished_sale_price,
      variant.refurbished_promotional_price
    );

  if (
    refurbishedPromotion !==
    null
  ) {
    return refurbishedPromotion;
  }

  if (
    variant.refurbished_sale_price !==
      null &&
    variant.refurbished_sale_price >
      0
  ) {
    return normalPrice;
  }

  /*
   * Legacy product-level fallback.
   */
  const legacyPrice =
    getActiveRefurbishedPrice(
      product
    );

  if (
    legacyPrice !==
    null
  ) {
    return safeMoney(
      legacyPrice +
        variant.price_adjustment
    );
  }

  throw new Error(
    "Refurbished variant price is not configured."
  );
}

/* =========================================================
   DEFAULT VARIANT ACTIVE PRICE
========================================================= */

export function getPublicVariantPrice(
  product: PublicProduct,
  variant: PublicProductVariant
): number {
  /*
   * Preserve backwards compatibility while also
   * supporting dedicated refurbished / used products.
   */
  return getPublicVariantPriceByCondition(
    product,
    variant,
    getDefaultSellCondition(
      product
    )
  );
}

/* =========================================================
   DEFAULT VARIANT NORMAL PRICE
========================================================= */

export function getPublicVariantNormalPrice(
  product: PublicProduct,
  variant: PublicProductVariant
): number {
  return getVariantNormalPriceByCondition(
    product,
    variant,
    getDefaultSellCondition(
      product
    )
  );
}

/* =========================================================
   NORMAL PRICE BY CONDITION ALIAS
========================================================= */

export function getPublicVariantNormalPriceByCondition(
  product: PublicProduct,
  variant: PublicProductVariant,
  condition: PublicSellCondition
): number {
  return getVariantNormalPriceByCondition(
    product,
    variant,
    condition
  );
}

/* =========================================================
   VARIANT PROMOTION BY CONDITION
========================================================= */

export function variantHasPromotionByCondition(
  product: PublicProduct,
  variant: PublicProductVariant,
  condition: PublicSellCondition
): boolean {
  try {
    const normalPrice =
      getVariantNormalPriceByCondition(
        product,
        variant,
        condition
      );

    const activePrice =
      getPublicVariantPriceByCondition(
        product,
        variant,
        condition
      );

    return (
      activePrice >
        0 &&
      activePrice <
        normalPrice
    );
  } catch {
    return false;
  }
}

/* =========================================================
   VARIANT PURCHASABLE BY CONDITION
========================================================= */

export function variantIsPurchasableByCondition(
  product: PublicProduct,
  variant: PublicProductVariant,
  condition: PublicSellCondition
): boolean {
  if (
    !variantIsPurchasable(
      variant
    )
  ) {
    return false;
  }

  if (
    !variantBelongsToProduct(
      product,
      variant
    )
  ) {
    return false;
  }

  /*
   * NEW
   */
  if (
    condition ===
    "new"
  ) {
    if (
      !productCanBeSoldNew(
        product
      )
    ) {
      return false;
    }

    return (
      variantHasConfiguredPrice(
        variant,
        "new",
        product
      ) ||
      product.sale_price >
        0
    );
  }

  /*
   * REFURBISHED / USED
   */
  if (
    !productCanBeSoldRefurbished(
      product
    )
  ) {
    return false;
  }

  /*
   * Dedicated refurbished / used product.
   */
  if (
    product.condition ===
      "refurbished" ||
    product.condition ===
      "used"
  ) {
    return (
      variantHasConfiguredPrice(
        variant,
        "refurbished",
        product
      ) ||
      product.sale_price >
        0
    );
  }

  /*
   * NEW + optional refurbished.
   */
  return (
    variantHasConfiguredPrice(
      variant,
      "refurbished",
      product
    ) ||
    productHasRefurbishedPrice(
      product
    )
  );
}

/* =========================================================
   ORDER UNIT PRICE
========================================================= */

export function getOrderUnitPrice(
  product: PublicProduct,
  condition: PublicSellCondition,
  variant?:
    | PublicProductVariant
    | null
): number {
  if (
    variant
  ) {
    return getPublicVariantPriceByCondition(
      product,
      variant,
      condition
    );
  }

  /*
   * Compatibility fallback.
   *
   * Once checkout always requires a variant_id,
   * this can be removed.
   */
  return getActiveProductPriceByCondition(
    product,
    condition
  );
}

/* =========================================================
   ORDER TOTAL
========================================================= */

export function calculateProductOrderTotal(
  product: PublicProduct,
  condition: PublicSellCondition,
  quantity: number,
  variant?:
    | PublicProductVariant
    | null
): number {
  if (
    !Number.isInteger(
      quantity
    ) ||
    quantity <
      1
  ) {
    throw new Error(
      "Quantity must be a positive integer."
    );
  }

  const unitPrice =
    getOrderUnitPrice(
      product,
      condition,
      variant
    );

  return safeMoney(
    unitPrice *
      quantity
  );
}

/* =========================================================
   UNIQUE PRODUCT COLORS

   Supabase product_variants is authoritative.
========================================================= */

export function getProductColors(
  variants: PublicProductVariant[]
): PublicProductColor[] {
  const colorMap =
    new Map<
      string,
      PublicProductColor
    >();

  for (
    const variant of
    variants
  ) {
    const colorName =
      normalizeString(
        variant.color
      );

    if (
      !colorName
    ) {
      continue;
    }

    const key =
      colorName.toLowerCase();

    const variantStock =
      variant.available
        ? Math.max(
            0,
            variant.stock
          )
        : 0;

    const existing =
      colorMap.get(
        key
      );

    if (
      !existing
    ) {
      colorMap.set(
        key,
        {
          name:
            colorName,

          hex:
            variant.color_hex ||
            "#D9D9D9",

          image_url:
            variant.image_url,

          available:
            variant.available &&
            variant.stock >
              0,

          stock:
            variantStock,
        }
      );

      continue;
    }

    existing.stock +=
      variantStock;

    existing.available =
      existing.available ||
      (
        variant.available &&
        variant.stock >
          0
      );

    if (
      !existing.image_url &&
      variant.image_url
    ) {
      existing.image_url =
        variant.image_url;
    }

    if (
      existing.hex ===
        "#D9D9D9" &&
      variant.color_hex
    ) {
      existing.hex =
        variant.color_hex;
    }
  }

  return Array.from(
    colorMap.values()
  );
}

/* =========================================================
   UNIQUE PRODUCT STORAGE OPTIONS
========================================================= */

export function getProductStorageOptions(
  variants: PublicProductVariant[],
  product?: PublicProduct,
  condition: PublicSellCondition = "new"
): PublicProductStorage[] {
  const storageMap =
    new Map<
      string,
      PublicProductStorage
    >();

  for (
    const variant of
    variants
  ) {
    const label =
      normalizeString(
        variant.storage
      );

    if (
      !label
    ) {
      continue;
    }

    const key =
      label.toLowerCase();

    const variantStock =
      variant.available
        ? Math.max(
            0,
            variant.stock
          )
        : 0;

    let variantPrice:
      number | null =
      null;

    if (
      product
    ) {
      try {
        variantPrice =
          getPublicVariantPriceByCondition(
            product,
            variant,
            condition
          );
      } catch {
        variantPrice =
          null;
      }
    } else {
      /*
       * Without product context only primary
       * sale_price can safely be inferred.
       */
      if (
        variant.sale_price !==
          null &&
        variant.sale_price >
          0
      ) {
        variantPrice =
          getValidPromotion(
            variant.sale_price,
            variant.promotional_price
          ) ??
          variant.sale_price;
      }
    }

    const existing =
      storageMap.get(
        key
      );

    if (
      !existing
    ) {
      storageMap.set(
        key,
        {
          label,

          price:
            variantPrice,

          available:
            variant.available &&
            variant.stock >
              0,

          stock:
            variantStock,
        }
      );

      continue;
    }

    existing.stock +=
      variantStock;

    existing.available =
      existing.available ||
      (
        variant.available &&
        variant.stock >
          0
      );

    if (
      variantPrice !==
        null &&
      (
        existing.price ===
          null ||
        variantPrice <
          existing.price
      )
    ) {
      existing.price =
        variantPrice;
    }
  }

  return Array.from(
    storageMap.values()
  );
}

/* =========================================================
   VARIANTS FOR COLOR
========================================================= */

export function getVariantsForColor(
  variants: PublicProductVariant[],
  color: string
): PublicProductVariant[] {
  const wanted =
    normalizeString(
      color
    ).toLowerCase();

  if (
    !wanted
  ) {
    return [];
  }

  return variants.filter(
    (
      variant
    ) =>
      normalizeString(
        variant.color
      ).toLowerCase() ===
      wanted
  );
}

/* =========================================================
   VARIANTS FOR STORAGE
========================================================= */

export function getVariantsForStorage(
  variants: PublicProductVariant[],
  storage: string
): PublicProductVariant[] {
  const wanted =
    normalizeString(
      storage
    ).toLowerCase();

  if (
    !wanted
  ) {
    return [];
  }

  return variants.filter(
    (
      variant
    ) =>
      normalizeString(
        variant.storage
      ).toLowerCase() ===
      wanted
  );
}

/* =========================================================
   FIND EXACT VARIANT
========================================================= */

export function findProductVariant(
  variants: PublicProductVariant[],
  storage: string,
  color: string
): PublicProductVariant | null {
  const wantedStorage =
    normalizeString(
      storage
    ).toLowerCase();

  const wantedColor =
    normalizeString(
      color
    ).toLowerCase();

  if (
    !wantedStorage ||
    !wantedColor
  ) {
    return null;
  }

  return (
    variants.find(
      (
        variant
      ) =>
        normalizeString(
          variant.storage
        ).toLowerCase() ===
          wantedStorage &&
        normalizeString(
          variant.color
        ).toLowerCase() ===
          wantedColor
    ) ??
    null
  );
}

/* =========================================================
   STORAGE OPTIONS FOR COLOR
========================================================= */

export function getStorageOptionsForColor(
  variants: PublicProductVariant[],
  color: string,
  product?: PublicProduct,
  condition: PublicSellCondition = "new"
): PublicProductStorage[] {
  return getProductStorageOptions(
    getVariantsForColor(
      variants,
      color
    ),
    product,
    condition
  );
}

/* =========================================================
   COLORS FOR STORAGE
========================================================= */

export function getColorsForStorage(
  variants: PublicProductVariant[],
  storage: string
): PublicProductColor[] {
  return getProductColors(
    getVariantsForStorage(
      variants,
      storage
    )
  );
}

/* =========================================================
   EXACT VARIANT IMAGE
========================================================= */

export function getVariantImage(
  product: PublicProduct,
  variant:
    | PublicProductVariant
    | null
    | undefined
): string | null {
  return (
    variant?.image_url ??
    product.image_url ??
    null
  );
}

/* =========================================================
   COLOR IMAGE
========================================================= */

export function getColorImage(
  product: PublicProduct,
  variants: PublicProductVariant[],
  color: string
): string | null {
  const colorVariants =
    getVariantsForColor(
      variants,
      color
    );

  const variantWithImage =
    colorVariants.find(
      (
        variant
      ) =>
        Boolean(
          variant.image_url
        )
    );

  return (
    variantWithImage
      ?.image_url ??
    product.image_url ??
    null
  );
}

/* =========================================================
   TOTAL VARIANT STOCK
========================================================= */

export function getVariantTotalStock(
  variants: PublicProductVariant[]
): number {
  return variants.reduce(
    (
      total,
      variant
    ) =>
      total +
      (
        variant.available
          ? Math.max(
              0,
              variant.stock
            )
          : 0
      ),
    0
  );
}

/* =========================================================
   AVAILABLE VARIANT STOCK FOR CONDITION
========================================================= */

export function getVariantStockByCondition(
  product: PublicProduct,
  variants: PublicProductVariant[],
  condition: PublicSellCondition
): number {
  return variants.reduce(
    (
      total,
      variant
    ) => {
      if (
        !variantIsPurchasableByCondition(
          product,
          variant,
          condition
        )
      ) {
        return total;
      }

      return (
        total +
        Math.max(
          0,
          variant.stock
        )
      );
    },
    0
  );
}

/* =========================================================
   LOWEST DEFAULT VARIANT PRICE
========================================================= */

export function getLowestVariantPrice(
  product: PublicProduct,
  variants: PublicProductVariant[]
): number {
  return getLowestVariantPriceByCondition(
    product,
    variants,
    getDefaultSellCondition(
      product
    )
  );
}

/* =========================================================
   HIGHEST DEFAULT VARIANT PRICE
========================================================= */

export function getHighestVariantPrice(
  product: PublicProduct,
  variants: PublicProductVariant[]
): number {
  return getHighestVariantPriceByCondition(
    product,
    variants,
    getDefaultSellCondition(
      product
    )
  );
}

/* =========================================================
   LOWEST VARIANT PRICE BY CONDITION
========================================================= */

export function getLowestVariantPriceByCondition(
  product: PublicProduct,
  variants: PublicProductVariant[],
  condition: PublicSellCondition
): number {
  const prices =
    variants
      .map(
        (
          variant
        ) => {
          try {
            const price =
              getPublicVariantPriceByCondition(
                product,
                variant,
                condition
              );

            return price >
              0
              ? price
              : null;
          } catch {
            return null;
          }
        }
      )
      .filter(
        (
          price
        ): price is number =>
          price !==
          null
      );

  if (
    prices.length >
    0
  ) {
    return safeMoney(
      Math.min(
        ...prices
      )
    );
  }

  return getActiveProductPriceByCondition(
    product,
    condition
  );
}

/* =========================================================
   HIGHEST VARIANT PRICE BY CONDITION
========================================================= */

export function getHighestVariantPriceByCondition(
  product: PublicProduct,
  variants: PublicProductVariant[],
  condition: PublicSellCondition
): number {
  const prices =
    variants
      .map(
        (
          variant
        ) => {
          try {
            const price =
              getPublicVariantPriceByCondition(
                product,
                variant,
                condition
              );

            return price >
              0
              ? price
              : null;
          } catch {
            return null;
          }
        }
      )
      .filter(
        (
          price
        ): price is number =>
          price !==
          null
      );

  if (
    prices.length >
    0
  ) {
    return safeMoney(
      Math.max(
        ...prices
      )
    );
  }

  return getActiveProductPriceByCondition(
    product,
    condition
  );
}

/* =========================================================
   FIRST VARIANT
========================================================= */

export function getFirstVariant(
  variants: PublicProductVariant[]
): PublicProductVariant | null {
  return (
    variants[
      0
    ] ??
    null
  );
}

/* =========================================================
   FIRST PURCHASABLE VARIANT
========================================================= */

export function getFirstPurchasableVariant(
  variants: PublicProductVariant[]
): PublicProductVariant | null {
  return (
    variants.find(
      (
        variant
      ) =>
        variantIsPurchasable(
          variant
        )
    ) ??
    variants[
      0
    ] ??
    null
  );
}

/* =========================================================
   FIRST PURCHASABLE VARIANT BY CONDITION
========================================================= */

export function getFirstPurchasableVariantByCondition(
  product: PublicProduct,
  variants: PublicProductVariant[],
  condition: PublicSellCondition
): PublicProductVariant | null {
  return (
    variants.find(
      (
        variant
      ) =>
        variantIsPurchasableByCondition(
          product,
          variant,
          condition
        )
    ) ??
    null
  );
}

/* =========================================================
   PRODUCT HAS VARIANTS
========================================================= */

export function productHasVariants(
  variants: PublicProductVariant[]
): boolean {
  return (
    variants.length >
    0
  );
}

/* =========================================================
   PRODUCT HAS PURCHASABLE VARIANTS
========================================================= */

export function productHasPurchasableVariants(
  variants: PublicProductVariant[]
): boolean {
  return variants.some(
    (
      variant
    ) =>
      variantIsPurchasable(
        variant
      )
  );
}

/* =========================================================
   PRODUCT HAS PURCHASABLE VARIANTS BY CONDITION
========================================================= */

export function productHasPurchasableVariantsByCondition(
  product: PublicProduct,
  variants: PublicProductVariant[],
  condition: PublicSellCondition
): boolean {
  return variants.some(
    (
      variant
    ) =>
      variantIsPurchasableByCondition(
        product,
        variant,
        condition
      )
  );
}

/* =========================================================
   COLOR EXISTS
========================================================= */

export function productHasColor(
  variants: PublicProductVariant[],
  color: string
): boolean {
  const wanted =
    normalizeString(
      color
    ).toLowerCase();

  if (
    !wanted
  ) {
    return false;
  }

  return variants.some(
    (
      variant
    ) =>
      normalizeString(
        variant.color
      ).toLowerCase() ===
      wanted
  );
}

/* =========================================================
   STORAGE EXISTS
========================================================= */

export function productHasStorage(
  variants: PublicProductVariant[],
  storage: string
): boolean {
  const wanted =
    normalizeString(
      storage
    ).toLowerCase();

  if (
    !wanted
  ) {
    return false;
  }

  return variants.some(
    (
      variant
    ) =>
      normalizeString(
        variant.storage
      ).toLowerCase() ===
      wanted
  );
}

/* =========================================================
   AVAILABLE COLORS BY CONDITION
========================================================= */

export function getAvailableColorsByCondition(
  product: PublicProduct,
  variants: PublicProductVariant[],
  condition: PublicSellCondition
): PublicProductColor[] {
  const validVariants =
    variants.filter(
      (
        variant
      ) =>
        variantIsPurchasableByCondition(
          product,
          variant,
          condition
        )
    );

  return getProductColors(
    validVariants
  );
}

/* =========================================================
   AVAILABLE STORAGE BY CONDITION
========================================================= */

export function getAvailableStorageOptionsByCondition(
  product: PublicProduct,
  variants: PublicProductVariant[],
  condition: PublicSellCondition
): PublicProductStorage[] {
  const validVariants =
    variants.filter(
      (
        variant
      ) =>
        variantIsPurchasableByCondition(
          product,
          variant,
          condition
        )
    );

  return getProductStorageOptions(
    validVariants,
    product,
    condition
  );
}

/* =========================================================
   AVAILABLE STORAGE FOR COLOR + CONDITION
========================================================= */

export function getAvailableStorageOptionsForColor(
  product: PublicProduct,
  variants: PublicProductVariant[],
  color: string,
  condition: PublicSellCondition
): PublicProductStorage[] {
  const colorVariants =
    getVariantsForColor(
      variants,
      color
    ).filter(
      (
        variant
      ) =>
        variantIsPurchasableByCondition(
          product,
          variant,
          condition
        )
    );

  return getProductStorageOptions(
    colorVariants,
    product,
    condition
  );
}

/* =========================================================
   AVAILABLE COLORS FOR STORAGE + CONDITION
========================================================= */

export function getAvailableColorsForStorage(
  product: PublicProduct,
  variants: PublicProductVariant[],
  storage: string,
  condition: PublicSellCondition
): PublicProductColor[] {
  const storageVariants =
    getVariantsForStorage(
      variants,
      storage
    ).filter(
      (
        variant
      ) =>
        variantIsPurchasableByCondition(
          product,
          variant,
          condition
        )
    );

  return getProductColors(
    storageVariants
  );
}

/* =========================================================
   EXACT PURCHASABLE VARIANT
========================================================= */

export function findPurchasableProductVariant(
  product: PublicProduct,
  variants: PublicProductVariant[],
  storage: string,
  color: string,
  condition: PublicSellCondition
): PublicProductVariant | null {
  const variant =
    findProductVariant(
      variants,
      storage,
      color
    );

  if (
    !variant
  ) {
    return null;
  }

  if (
    !variantIsPurchasableByCondition(
      product,
      variant,
      condition
    )
  ) {
    return null;
  }

  return variant;
}

/* =========================================================
   CONDITION DEFAULT
========================================================= */

export function getDefaultSellCondition(
  product: PublicProduct
): PublicSellCondition {
  if (
    product.condition ===
      "refurbished" ||
    product.condition ===
      "used"
  ) {
    return "refurbished";
  }

  return "new";
}

/* =========================================================
   CONDITION OPTIONS
========================================================= */

export function getProductSellConditions(
  product: PublicProduct
): PublicSellCondition[] {
  /*
   * Dedicated refurbished / used product.
   */
  if (
    product.condition ===
      "refurbished" ||
    product.condition ===
      "used"
  ) {
    return [
      "refurbished",
    ];
  }

  /*
   * NEW product with optional refurbished.
   */
  if (
    product.condition ===
      "new" &&
    product.refurbished_enabled
  ) {
    return [
      "new",
      "refurbished",
    ];
  }

  /*
   * Standard NEW product.
   */
  return [
    "new",
  ];
}

/* =========================================================
   SAFE VARIANT PRICE

   Useful for UI components where we do not want a
   missing migrated price to crash the entire page.
========================================================= */

export function tryGetPublicVariantPriceByCondition(
  product: PublicProduct,
  variant: PublicProductVariant,
  condition: PublicSellCondition
): number | null {
  try {
    const price =
      getPublicVariantPriceByCondition(
        product,
        variant,
        condition
      );

    if (
      !Number.isFinite(
        price
      ) ||
      price <=
        0
    ) {
      return null;
    }

    return price;
  } catch {
    return null;
  }
}

/* =========================================================
   SAFE VARIANT NORMAL PRICE
========================================================= */

export function tryGetPublicVariantNormalPriceByCondition(
  product: PublicProduct,
  variant: PublicProductVariant,
  condition: PublicSellCondition
): number | null {
  try {
    const price =
      getVariantNormalPriceByCondition(
        product,
        variant,
        condition
      );

    if (
      !Number.isFinite(
        price
      ) ||
      price <=
        0
    ) {
      return null;
    }

    return price;
  } catch {
    return null;
  }
}