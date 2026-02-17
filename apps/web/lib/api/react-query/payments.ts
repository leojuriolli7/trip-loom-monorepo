import { mutationOptions, queryOptions } from "@tanstack/react-query";
import type {
  ConfirmPaymentInput,
  CreatePaymentIntentInput,
  RefundPaymentInput,
} from "@trip-loom/api/dto";
import { apiClient } from "../api-client";

const KEYS = {
  base: () => ["payments"],
  detail: (paymentId: string) => [...KEYS.base(), "detail", paymentId],
  createIntent: () => [...KEYS.base(), "create-intent"],
  confirm: () => [...KEYS.base(), "confirm"],
  refund: (paymentId: string) => [...KEYS.base(), "refund", paymentId],
};

export type RefundPaymentVars = {
  paymentId: string;
  body: RefundPaymentInput;
};

export const paymentQueries = {
  base: () => KEYS.base(),
  getPaymentById: (paymentId: string) =>
    queryOptions({
      queryKey: KEYS.detail(paymentId),
      queryFn: async ({ signal }) =>
        apiClient.api.payments({ id: paymentId }).get({ fetch: { signal } }),
    }),
  createPaymentIntent: () =>
    mutationOptions({
      mutationKey: KEYS.createIntent(),
      mutationFn: async (vars: CreatePaymentIntentInput) =>
        apiClient.api.payments["create-intent"].post(vars),
    }),
  confirmPayment: () =>
    mutationOptions({
      mutationKey: KEYS.confirm(),
      mutationFn: async (vars: ConfirmPaymentInput) =>
        apiClient.api.payments.confirm.post(vars),
    }),
  refundPayment: () =>
    mutationOptions({
      mutationKey: KEYS.refund("any"),
      mutationFn: async (vars: RefundPaymentVars) =>
        apiClient.api.payments({ id: vars.paymentId }).refund.post(vars.body),
    }),
};
