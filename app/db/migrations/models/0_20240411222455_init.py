from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "groups" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "name" VARCHAR(32) NOT NULL UNIQUE,
    "description" TEXT,
    "discord_webhook" VARCHAR(130)
);
CREATE TABLE IF NOT EXISTS "events" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "color" VARCHAR(6) NOT NULL,
    "vote_end_date" TIMESTAMP,
    "description" TEXT,
    "state" SMALLINT NOT NULL  DEFAULT 1 /* VOTING: 0\nOPEN: 1\nACTIVE: 2\nCLOSED: 3\nARCHIVED: 4 */,
    "choosen_event_option_id" INT,
    "group_id" INT NOT NULL REFERENCES "groups" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "event_options" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "date" DATE NOT NULL,
    "start_time" TIME NOT NULL,
    "end_time" TIME,
    "event_id" INT NOT NULL REFERENCES "events" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "invites" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "code" VARCHAR(16) NOT NULL UNIQUE,
    "expiration_date" DATE NOT NULL,
    "group_id" INT NOT NULL REFERENCES "groups" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "users" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "name" VARCHAR(32) NOT NULL UNIQUE,
    "password" VARCHAR(100) NOT NULL,
    "owner" INT NOT NULL  DEFAULT 0
);
CREATE TABLE IF NOT EXISTS "user_and_groups" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "group_id" INT NOT NULL REFERENCES "groups" ("id") ON DELETE CASCADE,
    "user_id" INT NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
    CONSTRAINT "uid_user_and_gr_user_id_709cc4" UNIQUE ("user_id", "group_id")
);
CREATE TABLE IF NOT EXISTS "user_event_option_responses" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "response" SMALLINT NOT NULL  /* ACCEPTED: 1\nDENIED: 2 */,
    "event_option_id" INT NOT NULL REFERENCES "event_options" ("id") ON DELETE CASCADE,
    "user_and_group_id" INT NOT NULL REFERENCES "user_and_groups" ("id") ON DELETE CASCADE,
    CONSTRAINT "uid_user_event__event_o_e54e67" UNIQUE ("event_option_id", "user_and_group_id")
);
CREATE TABLE IF NOT EXISTS "user_group_permissions" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "permission" SMALLINT NOT NULL  /* ADMIN: 1\nMANAGE_USERS: 2\nMANAGE_INVITES: 3\nMANAGE_EVENTS: 4\nMANAGE_VOTES: 5 */,
    "user_and_group_id" INT NOT NULL REFERENCES "user_and_groups" ("id") ON DELETE CASCADE,
    CONSTRAINT "uid_user_group__user_an_e968f9" UNIQUE ("user_and_group_id", "permission")
);
CREATE TABLE IF NOT EXISTS "votes" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "multi_select" INT NOT NULL  DEFAULT 1,
    "group_id" INT NOT NULL REFERENCES "groups" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "vote_options" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "vote_id" INT NOT NULL REFERENCES "votes" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "user_vote_option_responses" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "user_and_group_id" INT NOT NULL REFERENCES "user_and_groups" ("id") ON DELETE CASCADE,
    "vote_option_id" INT NOT NULL REFERENCES "vote_options" ("id") ON DELETE CASCADE,
    CONSTRAINT "uid_user_vote_o_vote_op_8bfd8e" UNIQUE ("vote_option_id", "user_and_group_id")
);
CREATE TABLE IF NOT EXISTS "aerich" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "version" VARCHAR(255) NOT NULL,
    "app" VARCHAR(100) NOT NULL,
    "content" JSON NOT NULL
);"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        """
