from enum import IntEnum


class EventStateEnum(IntEnum):
    OPEN = 1
    AKTIVE = 2
    CLOSED = 3
    ARCHIVED = 4

class EventOptionResponseEnum(IntEnum):
    ACCEPTED = 1
    DENIED = 2

class UserGroupPermissionEnum(IntEnum):
    CAN_CREATE_EVENTS = 1
    CAN_MANAGE_USERS = 2