import { useCallback } from "react";
import useFetch from "../use-fetch";
import { API_URL } from "../config";
import wrapperFetchJsonResponse from "../wrapper-fetch-json-response";
import { Event, EventCategory, EventModality } from "../types/event";
import { InfinityPaginationType } from "../types/infinity-pagination";
import { RequestConfigType } from "./types/request-config";

export type EventsRequest = {
  page: number;
  limit: number;
  filters?: {
    category?: EventCategory;
    modality?: EventModality;
  };
};

export type EventsResponse = InfinityPaginationType<Event>;

function buildEventsUrl(path: string, data: EventsRequest) {
  const requestUrl = new URL(`${API_URL}/api/v1/events${path}`);
  requestUrl.searchParams.append("page", data.page.toString());
  requestUrl.searchParams.append("limit", data.limit.toString());
  if (data.filters?.category) {
    requestUrl.searchParams.append("category", data.filters.category);
  }
  if (data.filters?.modality) {
    requestUrl.searchParams.append("modality", data.filters.modality);
  }
  return requestUrl;
}

export function useGetEventsService() {
  const fetch = useFetch();

  return useCallback(
    (data: EventsRequest, requestConfig?: RequestConfigType) => {
      return fetch(buildEventsUrl("", data), {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<EventsResponse>);
    },
    [fetch]
  );
}

export function useGetMyEventsService() {
  const fetch = useFetch();

  return useCallback(
    (data: EventsRequest, requestConfig?: RequestConfigType) => {
      return fetch(buildEventsUrl("/mine", data), {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<EventsResponse>);
    },
    [fetch]
  );
}

export function useGetPendingEventsService() {
  const fetch = useFetch();

  return useCallback(
    (data: EventsRequest, requestConfig?: RequestConfigType) => {
      return fetch(buildEventsUrl("/pending", data), {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<EventsResponse>);
    },
    [fetch]
  );
}

export function useGetAllEventsService() {
  const fetch = useFetch();

  return useCallback(
    (data: EventsRequest, requestConfig?: RequestConfigType) => {
      return fetch(buildEventsUrl("/all", data), {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<EventsResponse>);
    },
    [fetch]
  );
}

export type EventRequest = {
  id: Event["id"];
};

export type EventResponse = Event;

export function useGetEventService() {
  const fetch = useFetch();

  return useCallback(
    (data: EventRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/events/${data.id}`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<EventResponse>);
    },
    [fetch]
  );
}

export function useGetEventForManagementService() {
  const fetch = useFetch();

  return useCallback(
    (data: EventRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/events/${data.id}/manage`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<EventResponse>);
    },
    [fetch]
  );
}

export type EventPostRequest = {
  title: string;
  description: string;
  category: EventCategory;
  modality: EventModality;
  startAt: string;
  endAt?: string;
  location?: string;
  locationMapUrl?: string;
  onlineUrl?: string;
  externalUrl?: string;
  coverImageId?: string | null;
};

export type EventPostResponse = Event;

export function usePostEventService() {
  const fetch = useFetch();

  return useCallback(
    (data: EventPostRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/events`, {
        method: "POST",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<EventPostResponse>);
    },
    [fetch]
  );
}

export type EventPatchRequest = {
  id: Event["id"];
  data: Partial<EventPostRequest>;
};

export type EventPatchResponse = Event;

export function usePatchEventService() {
  const fetch = useFetch();

  return useCallback(
    (data: EventPatchRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/events/${data.id}`, {
        method: "PATCH",
        body: JSON.stringify(data.data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<EventPatchResponse>);
    },
    [fetch]
  );
}

export type EventReviewRequest = {
  id: Event["id"];
  status: "APPROVED" | "REJECTED";
  rejectionReason?: string;
};

export type EventReviewResponse = Event;

export function usePatchReviewEventService() {
  const fetch = useFetch();

  return useCallback(
    (data: EventReviewRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/events/${data.id}/review`, {
        method: "PATCH",
        body: JSON.stringify({
          status: data.status,
          rejectionReason: data.rejectionReason,
        }),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<EventReviewResponse>);
    },
    [fetch]
  );
}

export type EventDeleteRequest = {
  id: Event["id"];
};

export type EventDeleteResponse = undefined;

export function useDeleteEventService() {
  const fetch = useFetch();

  return useCallback(
    (data: EventDeleteRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/events/${data.id}`, {
        method: "DELETE",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<EventDeleteResponse>);
    },
    [fetch]
  );
}

export type EventCancelRequest = {
  id: Event["id"];
};

export type EventCancelResponse = Event;

export function useCancelEventService() {
  const fetch = useFetch();

  return useCallback(
    (data: EventCancelRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/events/${data.id}/cancel`, {
        method: "PATCH",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<EventCancelResponse>);
    },
    [fetch]
  );
}

export type EventSubscribeRequest = {
  id: Event["id"];
};

export type EventSubscribeResponse = undefined;

export function useSubscribeEventService() {
  const fetch = useFetch();

  return useCallback(
    (data: EventSubscribeRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/events/${data.id}/subscribe`, {
        method: "POST",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<EventSubscribeResponse>);
    },
    [fetch]
  );
}

export function useUnsubscribeEventService() {
  const fetch = useFetch();

  return useCallback(
    (data: EventSubscribeRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/events/${data.id}/subscribe`, {
        method: "DELETE",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<EventSubscribeResponse>);
    },
    [fetch]
  );
}

export type EventSubscriptionResponse = { subscribed: boolean };

export function useGetEventSubscriptionService() {
  const fetch = useFetch();

  return useCallback(
    (data: EventSubscribeRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/events/${data.id}/subscription`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<EventSubscriptionResponse>);
    },
    [fetch]
  );
}
