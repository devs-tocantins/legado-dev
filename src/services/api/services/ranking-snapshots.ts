import { useCallback } from "react";
import useFetch from "../use-fetch";
import { API_URL } from "../config";
import wrapperFetchJsonResponse from "../wrapper-fetch-json-response";
import {
  RankingSnapshot,
  RankingSnapshotPeriodType,
} from "../types/ranking-snapshot";
import { RequestConfigType } from "./types/request-config";

export type GetChampionSnapshotRequest = {
  type: RankingSnapshotPeriodType;
};

export type GetChampionSnapshotResponse = RankingSnapshot | null;

export function useGetChampionSnapshotService() {
  const fetch = useFetch();

  return useCallback(
    (data: GetChampionSnapshotRequest, requestConfig?: RequestConfigType) => {
      const requestUrl = new URL(
        `${API_URL}/api/v1/ranking-snapshots/champion`
      );
      requestUrl.searchParams.append("type", data.type);

      return fetch(requestUrl, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<GetChampionSnapshotResponse>);
    },
    [fetch]
  );
}

export type GetProfileRankingHistoryResponse = RankingSnapshot[];

// GET /api/v1/ranking-snapshots/profile/:profileId
export function useGetProfileRankingHistoryService() {
  const fetch = useFetch();

  return useCallback(
    (profileId: string, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/ranking-snapshots/profile/${profileId}`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<GetProfileRankingHistoryResponse>);
    },
    [fetch]
  );
}
