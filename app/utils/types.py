from enum import IntEnum


class EventStateEnum(IntEnum):
    OPEN = 1
    ACTIVE = 2
    CLOSED = 3
    ARCHIVED = 4

class EventOptionResponseEnum(IntEnum):
    ACCEPTED = 1
    DENIED = 2

class UserGroupPermissionEnum(IntEnum):
    ADMIN = 1
    MANAGE_USERS = 2
    MANAGE_INVITES = 3
    MANAGE_EVENTS = 4