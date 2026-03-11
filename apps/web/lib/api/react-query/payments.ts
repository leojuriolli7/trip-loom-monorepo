import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { apiClient } from "../api-client";

const KEYS = {
  base: () => ["payments"],
  detail: (paymentId: string) => [...KEYS.base(), "detail", paymentId],
  refund: (paymentId: string) => [...KEYS.base(), "refund", paymentId],
};

type RefundPaymentVars = {
  paymentId: string;
  body: Parameters<
    ReturnType<typeof apiClient.api.payments>["refund"]["post"]
  >[0];
};

export const paymentQueries = {
  base: () => KEYS.base(),

  getPaymentById: (paymentId: string) =>
    queryOptions({
      queryKey: KEYS.detail(paymentId),
      queryFn: async ({ signal }) =>
        apiClient.api.payments({ id: paymentId }).get({ fetch: { signal } }),
    }),

  refundPayment: () =>
    mutationOptions({
      mutationKey: KEYS.refund("any"),
      mutationFn: async (vars: RefundPaymentVars) =>
        apiClient.api.payments({ id: vars.paymentId }).refund.post(vars.body),
    }),
};
