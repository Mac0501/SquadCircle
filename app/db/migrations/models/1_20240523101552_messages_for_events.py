from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "messages" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "content" TEXT NOT NULL,
    "sent_at" TIMESTAMP NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    "event_id" INT NOT NULL REFERENCES "events" ("id") ON DELETE CASCADE,
    "user_and_group_id" INT NOT NULL REFERENCES "user_and_groups" ("id") ON DELETE CASCADE
);;"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        DROP TABLE IF EXISTS "messages";"""
