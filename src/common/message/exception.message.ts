export enum ExceptionMessages {
  ALREADY_PRECESSED = "이미 처리된 상태입니다.",
  ALREADY_WORK = "이미 퇴근한 상태입니다. \n재 출근시 출근 기록을 삭제해주세요.",
  EXPIRED_TOKEN = "만료된 토큰입니다.",
  EXIST_ID = "이미 존재하는 ID입니다.",
  EXIST_NAME = "이미 존재하는 닉네임입니다.",
  HAS_CHILD_MENUS = "하위 메뉴가 존재합니다.",
  INVALID_TOKEN = "잘못된 유형의 토큰입니다.",
  INVALID_UUID = "올바르지 않은 UUID 값 입니다.",
  INVALID_WHERE_IN_PAGING = "where 필터는 '__'로 split 하였을때 길이가 2 또는 3이어야 합니다. - key : ",
  NO_PERMISSION = "권한이 존재하지 않습니다.",
  NO_PARAMETER = "파라미터가 존재하지 않습니다.",
  NOT_APPROVED = "승인되지 않은 유저입니다.",
  NOT_EXIST_ACCOUNT_INFO = "사용자 정보가 존재하지 않습니다.",
  NOT_EXIST_ID = "존재하지 않는 아이디입니다.",
  NOT_EXIST_USER = "존재하지 않는 유저입니다.",
  NOT_EXIST_CODE = "존재하지 않는 코드입니다.",
  NOT_EXIST_USER_PROPERTY_IN_REQUEST = "Request에 user 프로퍼티가 존재하지 않습니다.",
  NOT_EXIST_WORK = "출근 기록이 없습니다. 출근 후 퇴근해주세요.",
  WRONG_ACCOUNT_INFO = "잘못된 계정 정보입니다.",

  INTERNAL_SERVER_ERROR = "관리자에게 문의해주세요."
}