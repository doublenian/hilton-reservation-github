import { gql } from '@apollo/client';

// 员工认证相关查询
export const LOGIN_EMPLOYEE = gql`
  mutation LoginEmployee($username: String!, $password: String!) {
    loginEmployee(username: $username, password: $password) {
      employee {
        id
        username
        email
        role
        createdAt
        updatedAt
      }
      token
    }
  }
`;

// 获取当前登录用户信息
export const GET_CURRENT_EMPLOYEE = gql`
  query GetCurrentEmployee {
    me {
      id
      email
      role
      name
      username
    }
  }
`;

// 预订管理相关查询 - 使用原有的schema结构
export const GET_RESERVATIONS = gql`
  query GetReservations(
    $filter: ReservationFilter
    $pagination: PaginationInput
  ) {
    reservations(filter: $filter, pagination: $pagination) {
      data {
        id
        guestName
        guestEmail
        guestPhone
        expectedArrivalTime
        tableSize
        status
        notes
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
      guestName
      guestEmail
      guestPhone
      expectedArrivalTime
      tableSize
      status
      notes
      createdAt
      updatedAt
      approvedBy
      approvedAt
    }
  }
`;

// 预订状态管理变更 - 使用原有的schema结构
export const APPROVE_RESERVATION = gql`
  mutation ApproveReservation($id: ID!) {
    approveReservation(id: $id) {
      id
      status
      approvedBy
      approvedAt
    }
  }
`;

export const CANCEL_RESERVATION = gql`
  mutation CancelReservation($id: ID!) {
    cancelReservation(id: $id) {
      id
      status
    }
  }
`;

export const COMPLETE_RESERVATION = gql`
  mutation CompleteReservation($id: ID!) {
    completeReservation(id: $id) {
      id
      status
    }
  }
`;

// 预订统计查询
export const GET_RESERVATION_STATS = gql`
  query GetReservationStats {
    reservationStats {
      total
      pending
      confirmed
      cancelled
      todayReservations
    }
  }
`; 