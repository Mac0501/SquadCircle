enum EventStateEnum {
    OPEN = 1,
    ACTIVE = 2,
    CLOSED = 3,
    ARCHIVED = 4
}

enum EventOptionResponseEnum {
    ACCEPTED = 1,
    DENIED = 2
}

enum UserGroupPermissionEnum {
    ADMIN = 1,
    MANAGE_USERS = 2,
    MANAGE_INVITES = 3,
    MANAGE_EVENTS = 4
}

export { EventStateEnum, EventOptionResponseEnum, UserGroupPermissionEnum };