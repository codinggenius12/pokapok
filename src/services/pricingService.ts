import type { PaymentMode } from "../types/phone";

export const INSURANCE_MONTHLY_PRICE = 9.99;

export function calculateUnitPrice(basePrice: number, storageIncrease: number) {
  return basePrice + storageIncrease;
}

export function calculateMonthlyPrice(params: {
  unitPrice: number;
  paymentMode: PaymentMode;
  months: number;
  insurance: boolean;
  leaseFrom: number;
}) {
  const insurancePrice = params.insurance ? INSURANCE_MONTHLY_PRICE : 0;

  if (params.paymentMode === "buy") {
    return 0;
  }

  if (params.paymentMode === "lease") {
    return params.leaseFrom + insurancePrice;
  }

  return params.unitPrice / params.months + insurancePrice;
}