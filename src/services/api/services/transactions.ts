import { useCallback } from "react";
import useFetch from "../use-fetch";
import { API_URL } from "../config";
import wrapperFetchJsonResponse from "../wrapper-fetch-json-response";
import { Transaction } from "../types/transaction";
import { InfinityPaginationType } from "../types/infinity-pagination";
import { SortEnum } from "../types/sort-type";
import { RequestConfigType } from "./types/request-config";

export type TransactionsRequest = {
  page: number;
  limit: number;
  filters?: {
    category?: string;
  };
  sort?: Array<{
    orderBy: keyof Transaction;
    order: SortEnum;
  }>;
};

export type TransactionsResponse = InfinityPaginationType<Transaction>;

export function useGetTransactionsService() {
  const fetch = useFetch();

  return useCallback(
    (data: TransactionsRequest, requestConfig?: RequestConfigType) => {
      const requestUrl = new URL(`${API_URL}/api/v1/transactions`);
      requestUrl.searchParams.append("page", data.page.toString());
      requestUrl.searchParams.append("limit", data.limit.toString());
      if (data.filters) {
        requestUrl.searchParams.append("filters", JSON.stringify(data.filters));
      }
      if (data.sort) {
        requestUrl.searchParams.append("sort", JSON.stringify(data.sort));
      }

      return fetch(requestUrl, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<TransactionsResponse>);
    },
    [fetch]
  );
}

export type TransactionRequest = {
  id: Transaction["id"];
};

export type TransactionResponse = Transaction;

export function useGetTransactionService() {
  const fetch = useFetch();

  return useCallback(
    (data: TransactionRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/transactions/${data.id}`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<TransactionResponse>);
    },
    [fetch]
  );
}

export type MyTransactionsRequest = {
  page: number;
  limit: number;
};

export type MyTransactionsResponse = InfinityPaginationType<Transaction>;

export function useGetMyTransactionsService() {
  const fetch = useFetch();

  return useCallback(
    (data: MyTransactionsRequest, requestConfig?: RequestConfigType) => {
      const requestUrl = new URL(`${API_URL}/api/v1/transactions/me`);
      requestUrl.searchParams.append("page", data.page.toString());
      requestUrl.searchParams.append("limit", data.limit.toString());

      return fetch(requestUrl, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<MyTransactionsResponse>);
    },
    [fetch]
  );
}

export type TransactionPostRequest = {
  profile: string;
  category: string;
  amount: number;
  description?: string;
};

export type TransactionPostResponse = Transaction;

export function usePostTransactionService() {
  const fetch = useFetch();

  return useCallback(
    (data: TransactionPostRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/transactions`, {
        method: "POST",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<TransactionPostResponse>);
    },
    [fetch]
  );
}

export type TransactionPatchRequest = {
  id: Transaction["id"];
  data: Partial<{
    amount: number;
    category: string;
    description: string;
  }>;
};

export type TransactionPatchResponse = Transaction;

export function usePatchTransactionService() {
  const fetch = useFetch();

  return useCallback(
    (data: TransactionPatchRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/transactions/${data.id}`, {
        method: "PATCH",
        body: JSON.stringify(data.data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<TransactionPatchResponse>);
    },
    [fetch]
  );
}

export type TransactionDeleteRequest = {
  id: Transaction["id"];
};

export type TransactionDeleteResponse = undefined;

export function useDeleteTransactionService() {
  const fetch = useFetch();

  return useCallback(
    (data: TransactionDeleteRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/transactions/${data.id}`, {
        method: "DELETE",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<TransactionDeleteResponse>);
    },
    [fetch]
  );
}

export type ProfileTokenTransactionsRequest = {
  profileId: string;
  page: number;
  limit: number;
};

export type ProfileTokenTransactionsResponse =
  InfinityPaginationType<Transaction>;

export function useGetProfileTokenTransactionsService() {
  const fetch = useFetch();

  return useCallback(
    (
      data: ProfileTokenTransactionsRequest,
      requestConfig?: RequestConfigType
    ) => {
      const url = new URL(
        `${API_URL}/api/v1/transactions/profile/${data.profileId}/tokens`
      );
      url.searchParams.append("page", data.page.toString());
      url.searchParams.append("limit", data.limit.toString());

      return fetch(url, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<ProfileTokenTransactionsResponse>);
    },
    [fetch]
  );
}
