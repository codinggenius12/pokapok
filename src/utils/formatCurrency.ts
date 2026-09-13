export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function formatMonthly(value: number) {
  return value.toFixed(2).replace(".", ",");
}