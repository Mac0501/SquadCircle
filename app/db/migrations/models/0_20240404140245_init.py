from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "groups" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "name" VARCHAR(32) NOT NULL,
    "description" TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS "events" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "color" VARCHAR(6) NOT NULL,
    "description" TEXT,
    "state" SMALLINT NOT NULL  DEFAULT 1 /* OPEN: 1\nAKTIVE: 2\nCLOSED: 3\nARCHIVED: 4 */,
    "group_id" INT NOT NULL REFERENCES "groups" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "event_options" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "date" DATE NOT NULL,
    "start_time" TIME NOT NULL,
    "end_time" TIME,
    "event_id" INT NOT NULL REFERENCES "events" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "users" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "name" VARCHAR(32) NOT NULL UNIQUE,
    "password" VARCHAR(100) NOT NULL,
    "owner" INT NOT NULL  DEFAULT 0
);
CREATE TABLE IF NOT EXISTS "user_and_group" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "group_id" INT NOT NULL REFERENCES "groups" ("id") ON DELETE CASCADE,
    "user_id" INT NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "user_event_option_responses" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "response" SMALLINT NOT NULL  /* ACCEPTED: 1\nDENIED: 2 */,
    "event_option_id" INT NOT NULL REFERENCES "event_options" ("id") ON DELETE CASCADE,
    "user_and_group_id" BIGINT NOT NULL REFERENCES "user_and_group" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "user_group_permissions" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "permission" SMALLINT NOT NULL  /* CAN_CREATE_EVENTS: 1\nCAN_MANAGE_USERS: 2 */,
    "user_and_group_id" BIGINT NOT NULL REFERENCES "user_and_group" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "aerich" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "version" VARCHAR(255) NOT NULL,
    "app" VARCHAR(100) NOT NULL,
    "content" JSON NOT NULL
);
CREATE TABLE IF NOT EXISTS "user_and_groups" (
    "group_id" INT NOT NULL REFERENCES "groups" ("id") ON DELETE CASCADE,
    "user_id" INT NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE
);"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        """
