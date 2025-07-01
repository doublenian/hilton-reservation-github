export const typeDefs = `#graphql
  # 标量类型
  scalar DateTime

  # 枚举类型
  enum ReservationStatus {
    requested
    approved
    cancelled
    completed
  }

  enum UserRole {
    guest
    employee
  }

  # 输入类型
  input CreateReservationInput {
    guestName: String!
    guestEmail: String!
    guestPhone: String!
    expectedArrivalTime: DateTime!
    tableSize: Int!
    notes: String
  }

  input UpdateReservationInput {
    guestName: String
    guestEmail: String
    guestPhone: String
    expectedArrivalTime: DateTime
    tableSize: Int
    notes: String
  }

  input ReservationFilter {
    status: [ReservationStatus!]
    startDate: DateTime
    endDate: DateTime
    guestName: String
    guestEmail: String
    tableSize: Int
  }

  input PaginationInput {
    page: Int = 1
    limit: Int = 10
  }

  input CreateEmployeeInput {
    username: String!
    email: String!
    password: String!
    role: UserRole = employee
  }

  # 对象类型
  type Reservation {
    id: ID!
    guestId: String
    guestName: String!
    guestEmail: String!
    guestPhone: String!
    expectedArrivalTime: DateTime!
    tableSize: Int!
    status: ReservationStatus!
    notes: String
    createdAt: DateTime!
    updatedAt: DateTime!
    approvedBy: String
    approvedAt: DateTime
  }

  type PaginatedReservations {
    data: [Reservation!]!
    total: Int!
    page: Int!
    limit: Int!
    hasNext: Boolean!
    hasPrev: Boolean!
  }

  type User {
    id: ID!
    email: String!
    role: UserRole!
    name: String
    username: String
  }

  type Employee {
    id: ID!
    username: String!
    email: String!
    role: UserRole!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type AuthPayload {
    user: User!
    token: String!
  }

  type ReservationStats {
    total: Int!
    pending: Int!
    confirmed: Int!
    cancelled: Int!
    todayReservations: Int!
  }

  # 查询类型
  type Query {
    # 获取当前用户信息
    me: User

    # 获取单个预定
    reservation(id: ID!): Reservation

    # 获取预定列表（支持筛选和分页）
    reservations(
      filter: ReservationFilter
      pagination: PaginationInput
    ): PaginatedReservations!

    # 获取当前用户的预定列表（客人）
    myReservations: [Reservation!]!

    # 通过邮箱获取预定列表（匿名访问）
    getReservationsByEmail(email: String!): [Reservation!]!

    # 获取预订统计信息（员工）
    reservationStats: ReservationStats
  }

  # 变更类型
  type Mutation {
    # 创建预定
    createReservation(input: CreateReservationInput!): Reservation!

    # 更新预定
    updateReservation(id: ID!, input: UpdateReservationInput!): Reservation!

    # 取消预定
    cancelReservation(id: ID!): Reservation!

    # 批准预定（员工）
    approveReservation(id: ID!): Reservation!

    # 完成预定（员工）
    completeReservation(id: ID!): Reservation!

    # 注册员工账号（员工）
    registerEmployee(input: CreateEmployeeInput!): Employee!
  }

  # 订阅类型
  type Subscription {
    # 预定状态更新订阅
    reservationUpdated: Reservation!
  }
`; 