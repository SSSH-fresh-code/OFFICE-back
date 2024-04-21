enum AuthsEnum {
  SUPER_USER = "S0000001",
  CAN_USE_OFFICE = "LOGIN001",
  CAN_USE_WORK = "A0000003",
  CAN_USE_AUTH = "A0000004",
  CAN_USE_MENU = "A0000004",
  MODIFY_ANOTHER_USER = "M0000001",
  DELETE_ANOTHER_USER = "D0000001",
  READ_ANOTHER_USER = "R0000001",
  MODIFY_ALARMS = "M0000002",
  DELETE_ALARMS = "D0000002",
  READ_ALARMS = "R0000002",
  POST_ALARMS = "P0000002",
  MODIFY_ANOTHER_WORK = "M0000003",
  DELETE_ANOTHER_WORK = "D0000003",
  READ_ANOTHER_WORK = "R0000003",
  ADMIN_ALARMS = "AR000001",
}

export default AuthsEnum;