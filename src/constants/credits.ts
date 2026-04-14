export interface CreditPackage {
  id: string;
  credits: number;
  price: string;
  priceCents: number;
  perCredit: string;
  popular?: boolean;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  { id: "pack_150", credits: 150, price: "$2.99", priceCents: 299, perCredit: "$0.02" },
  { id: "pack_500", credits: 500, price: "$5.99", priceCents: 599, perCredit: "$0.012", popular: true },
  { id: "pack_1500", credits: 1500, price: "$14.99", priceCents: 1499, perCredit: "$0.01" },
];
