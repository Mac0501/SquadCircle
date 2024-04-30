enum EventStateEnum {
    VOTING = 0,
    OPEN = 1,
    ACTIVE = 2,
    CLOSED = 3,
    ARCHIVED = 4,
}

enum EventOptionResponseEnum {
    ACCEPTED = 1,
    DENIED = 2
}

enum UserGroupPermissionEnum {
    ADMIN = 1,
    MANAGE_USERS = 2,
    MANAGE_INVITES = 3,
    MANAGE_EVENTS = 4,
    MANAGE_VOTES = 5
}

enum EventColorEnum {
    RASSPBERRY = 'ff686b',
    ROSE = 'ef91b6',
    LILAC = 'e192ff',
    BABY_BLUE = 'b2cefe',
    LAVENDER = 'ba97fb',
    MINT = 'a3ffda',
    SEA_GREEN = 'abe5aa',
    CORAL = 'f4946a',
    PEACH = 'f7b869',
}

export { EventStateEnum, EventOptionResponseEnum, UserGroupPermissionEnum, EventColorEnum };