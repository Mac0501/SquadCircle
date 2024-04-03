from enum import IntEnum


class EventState(IntEnum):
    OPEN = 1
    AKTIVE = 2
    CLOSED = 3
    ARCHIVED = 4

class EventOptionResponse(IntEnum):
    ACCEPTED = 1
    DENIED = 2

class UserGroupPermission(IntEnum):
    CAN_CREATE_EVENTS = 1
    CAN_MANAGE_USERS = 2