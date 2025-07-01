import { gql } from '@apollo/client';

export const GET_RESERVATIONS = gql`
  query GetReservations($filter: ReservationFilter, $pagination: PaginationInput) {
    reservations(filter: $filter, pagination: $pagination) {
      data {
        id
        guestId
        guestName
        guestEmail
        guestPhone
        expectedArrivalTime
        tableSize
        notes
        status
        createdAt
        updatedAt
        approvedBy
        approvedAt
      }
      total
      page
      limit
      hasNext
      hasPrev
    }
  }
`;

export const GET_RESERVATION = gql`
  query GetReservation($id: ID!) {
    reservation(id: $id) {
      id
      guestId
      guestName
      guestEmail
      guestPhone
      expectedArrivalTime
      tableSize
      notes
      status
      createdAt
      updatedAt
      approvedBy
      approvedAt
    }
  }
`;

export const CREATE_RESERVATION = gql`
  mutation CreateReservation($input: CreateReservationInput!) {
    createReservation(input: $input) {
      id
      guestId
      guestName
      guestEmail
      guestPhone
      expectedArrivalTime
      tableSize
      notes
      status
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_RESERVATION = gql`
  mutation UpdateReservation($id: ID!, $input: UpdateReservationInput!) {
    updateReservation(id: $id, input: $input) {
      id
      guestId
      guestName
      guestEmail
      guestPhone
      expectedArrivalTime
      tableSize
      notes
      status
      createdAt
      updatedAt
    }
  }
`;

export const CANCEL_RESERVATION = gql`
  mutation CancelReservation($id: ID!) {
    cancelReservation(id: $id) {
      id
      guestId
      guestName
      guestEmail
      guestPhone
      expectedArrivalTime
      tableSize
      notes
      status
      createdAt
      updatedAt
    }
  }
`;

export const GET_MY_RESERVATIONS = gql`
  query GetMyReservations {
    myReservations {
      id
      guestId
      guestName
      guestEmail
      guestPhone
      expectedArrivalTime
      tableSize
      notes
      status
      createdAt
      updatedAt
      approvedBy
      approvedAt
    }
  }
`;

export const GET_RESERVATIONS_BY_EMAIL = gql`
  query GetReservationsByEmail($email: String!) {
    getReservationsByEmail(email: $email) {
      id
      guestId
      guestName
      guestEmail
      guestPhone
      expectedArrivalTime
      tableSize
      notes
      status
      createdAt
      updatedAt
      approvedBy
      approvedAt
    }
  }
`; 