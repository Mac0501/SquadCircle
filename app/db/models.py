import hashlib
from datetime import date
from typing import Dict
from tortoise import fields
from tortoise import connections
from tortoise.models import Model
from tortoise.transactions import atomic
from app.utils.tools import generate_random_hex
from app.utils.types import EventStateEnum, EventOptionResponseEnum, UserGroupPermissionEnum

class User(Model):
    __parse_name__ = "user"
    id = fields.IntField(pk=True, autoincrement=True)
    name = fields.CharField(max_length=32, null=False, unique=True)
    password = fields.CharField(max_length=100, null=False)
    owner = fields.BooleanField(default=False, null=False)

    groups: fields.ReverseRelation["Group"]
    user_and_groups: fields.ReverseRelation["UserAndGroup"]
    
    class Meta:
        table = "users"

    def to_dict(self) -> Dict[str, any]:
        return {"id":self.id, "name":self.name, "owner":self.owner}
    
    def verify_password(self, input_password:str) -> bool:
        salt, stored_password = self.password.split("$")
        input_hashed_password = hashlib.sha256((input_password + salt).encode()).hexdigest()
        return input_hashed_password == stored_password
    
    @staticmethod
    def hash_password(password) -> str:
        salt = generate_random_hex(10)
        hashed_password = hashlib.sha256((password + salt).encode()).hexdigest()
        return f"{salt}${hashed_password}"


class Group(Model):
    __parse_name__ = "group"
    id = fields.IntField(pk=True, autoincrement=True)
    name = fields.CharField(max_length=32, null=False, unique=True)
    description = fields.TextField(max_length=2000, null=True)
    discord_webhook = fields.CharField(max_length=130, null=True)

    user_and_groups: fields.ReverseRelation["UserAndGroup"]
    events: fields.ReverseRelation["Event"]
    votes: fields.ReverseRelation["Vote"]
    invites: fields.ReverseRelation["Invite"]
    users: fields.ManyToManyRelation["User"] = fields.ManyToManyField(
        model_name="models.User",
        related_name="groups",
        through="user_and_groups",
        forward_key="user_id",
        backward_key="group_id",
    )

    class Meta:
        table = "groups"

    def to_dict(self) -> Dict[str, any]:
        return {"id":self.id, "name":self.name, "description":self.description}
    
    async def get_group_id(self) -> int:
        return self.id

class UserAndGroup(Model):
    __parse_name__ = "user_and_group"
    id = fields.IntField(pk=True, autoincrement=True)
    user_id: int
    user: fields.ForeignKeyRelation["User"] = fields.ForeignKeyField(
        model_name="models.User",
        to_field="id",
        related_name="user_and_groups",
        null=False,
    )
    group_id: int
    group: fields.ForeignKeyRelation["Group"] = fields.ForeignKeyField(
        model_name="models.Group",
        to_field="id",
        related_name="user_and_groups",
        null=False,
    )
    user_event_option_responses: fields.ReverseRelation["UserEventOptionResponse"]
    user_vote_option_responses: fields.ReverseRelation["UserEventOptionResponse"]
    user_group_permissions: fields.ReverseRelation["UserGroupPermission"]

    class Meta:
        table = "user_and_groups"
        unique_together = [("user_id", "group_id")]

    def to_dict(self) -> Dict[str, any]:
        return {"id":self.id, "user_id":self.user_id, "group_id":self.group_id}
    
    async def get_group_id(self) -> int:
        return self.group_id

class UserGroupPermission(Model):
    __parse_name__ = "user_group_permission"
    id = fields.IntField(pk=True, autoincrement=True)
    permission = fields.IntEnumField(enum_type=UserGroupPermissionEnum, null=False)
    user_and_group_id: int
    user_and_group: fields.ForeignKeyRelation["UserAndGroup"] = fields.ForeignKeyField(
        "models.UserAndGroup",
        to_field="id",
        related_name="user_group_permissions",
        on_delete=fields.CASCADE,
    )

    class Meta:
        unique_together = [("user_and_group_id", "permission")]
        table = "user_group_permissions"

    def to_dict(self) -> Dict[str, any]:
        return {"id":self.id, "permission":self.permission, "user_and_group_id":self.user_and_group_id}

    async def get_group_id(self) -> int:
        user_and_group = await UserAndGroup.get(id=self.user_and_group_id)
        return user_and_group.group_id

class Event(Model):
    __parse_name__ = "event"
    id = fields.IntField(pk=True, autoincrement=True)
    title = fields.CharField(max_length=100, null=False)
    color = fields.CharField(max_length=6, null=False)
    vote_end_date = fields.DatetimeField(null=True)
    description = fields.TextField(max_length=2000, null=True)
    state = fields.IntEnumField(enum_type=EventStateEnum, null=False, default=EventStateEnum.OPEN)

    choosen_event_option_id = fields.IntField(null=True)

    group_id:int
    group: fields.ForeignKeyRelation["Group"] = fields.ForeignKeyField(
        "models.Group",
        to_field="id",
        related_name="events",
        on_delete=fields.CASCADE,
    )
    event_options: fields.ReverseRelation["EventOption"]

    class Meta:
        table = "events"

    def to_dict(self) -> Dict[str, any]:
        return {"id":self.id, "title":self.title, "color":self.color, "description":self.description, "state":self.state, "group_id": self.group_id, "choosen_event_option_id":self.choosen_event_option_id}

    async def get_group_id(self) -> int:
        return self.group_id

    @staticmethod
    @atomic
    async def update_state():
        conn = connections.get("default")
        await conn.execute_query(f"""
            UPDATE events
            SET state = {EventStateEnum.ACTIVE},
                choosen_event_option_id = (
                    SELECT event_option_id
                    FROM (
                        SELECT event_option_id, COUNT(*) AS response_count
                        FROM user_event_option_responses
                        INNER JOIN event_options ON user_event_option_responses.event_option_id = event_options.id
                        WHERE response = {EventOptionResponseEnum.ACCEPTED}
                        AND event_options.event_id = events.id
                        GROUP BY event_option_id
                        ORDER BY response_count DESC, event_option_id ASC
                        LIMIT 1
                    )
                )
            WHERE state = {EventStateEnum.OPEN}
            AND choosen_event_option_id IS NULL
            AND (
                (events.vote_end_date IS NOT NULL AND events.vote_end_date <= DATETIME('now')) OR
                events.vote_end_date IS NULL AND (
                    SELECT DATETIME(MIN(event_options.date) || ' 23:00', '-1 day')
                    FROM event_options
                    WHERE event_options.event_id = events.id
                )  <= DATETIME('now')
            );
        """)

        await conn.execute_query(f"""
            UPDATE events
            SET state = (
                CASE
                    -- If choosen_event_option_id is set and the end time of the chosen event option is not over
                    WHEN events.choosen_event_option_id IS NOT NULL AND (
                        (eo.end_time IS NOT NULL AND DATETIME(eo.date || ' ' || eo.end_time) > DATETIME('now')) OR
                        (eo.end_time IS NULL AND DATE(eo.date) = DATE('now'))
                    )
                    AND DATETIME(eo.date || ' ' || eo.start_time) < DATETIME('now')
                    THEN {EventStateEnum.ACTIVE} -- Set state to ACTIVE
                    -- If choosen_event_option is set but the event is over
                    WHEN events.choosen_event_option_id IS NOT NULL AND (
                        (eo.end_time IS NOT NULL AND DATETIME(eo.date || ' ' || eo.end_time) < DATETIME('now')) OR
                        (eo.end_time IS NULL AND DATE(eo.date) < DATE('now'))
                    )
                    THEN {EventStateEnum.CLOSED} -- Set state to CLOSED
                    ELSE events.state -- Keep the state unchanged
                END
            )
            FROM (
                SELECT events.id AS event_id, event_options.end_time, event_options.date, event_options.start_time
                FROM events
                LEFT JOIN event_options ON events.choosen_event_option_id = event_options.id
                WHERE events.state IN ({EventStateEnum.OPEN}, {EventStateEnum.ACTIVE})
            ) AS eo
            WHERE events.id = eo.event_id;
        """)



class EventOption(Model):
    __parse_name__ = "event_option"
    id = fields.IntField(pk=True, autoincrement=True)
    date = fields.DateField(null=False)
    start_time = fields.TimeField(null=False)
    end_time = fields.TimeField(null=True)

    event_id: int
    event: fields.ForeignKeyRelation["Event"] = fields.ForeignKeyField(
        "models.Event",
        to_field="id",
        related_name="event_options",
        on_delete=fields.CASCADE,
    )

    user_event_option_responses: fields.ReverseRelation["UserEventOptionResponse"]

    class Meta:
        table = "event_options"

    def to_dict(self) -> Dict[str, any]:
        return {
            "id": self.id,
            "date": self.date.isoformat(),
            "start_time": self.start_time.strftime("%H:%M:%S"),
            "end_time": self.end_time.strftime("%H:%M:%S") if self.end_time else None,
            "event_id": self.event_id
        }
    
    async def get_group_id(self) -> int:
        event = await Event.get(id=self.event_id)
        return event.group_id

class UserEventOptionResponse(Model):
    __parse_name__ = "user_event_option_response"
    id = fields.IntField(pk=True, autoincrement=True)
    response = fields.IntEnumField(enum_type=EventOptionResponseEnum, null=False)

    event_option_id: int
    event_option: fields.ForeignKeyRelation["EventOption"] = fields.ForeignKeyField(
        "models.EventOption",
        to_field="id",
        related_name="user_event_option_responses",
        on_delete=fields.CASCADE,
    )
    user_and_group_id: int
    user_and_group: fields.ForeignKeyRelation["UserAndGroup"] = fields.ForeignKeyField(
        "models.UserAndGroup",
        to_field="id",
        related_name="user_event_option_responses",
        on_delete=fields.CASCADE,
    )

    class Meta:
        unique_together = [("event_option_id", "user_and_group_id")]
        table = "user_event_option_responses"

    def to_dict(self) -> Dict[str, any]:
        return {"id":self.id, "response":self.response, "event_option_id": self.event_option_id, "user_and_group_id":self.user_and_group_id}
    
    async def get_group_id(self) -> int:
        user_and_group = await UserAndGroup.get(id=self.user_and_group_id)
        return user_and_group.group_id


class Vote(Model):
    __parse_name__ = "vote"
    id = fields.IntField(pk=True, autoincrement=True)
    title = fields.CharField(max_length=100, null=False)
    multi_select = fields.BooleanField(default=True,null=False)

    group_id:int
    group: fields.ForeignKeyRelation["Group"] = fields.ForeignKeyField(
        "models.Group",
        to_field="id",
        related_name="votes",
        on_delete=fields.CASCADE,
    )
    vote_options: fields.ReverseRelation["VoteOption"]

    class Meta:
        table = "votes"

    def to_dict(self) -> Dict[str, any]:
        return {"id":self.id, "title":self.title, "multi_select":self.multi_select, "group_id": self.group_id}

    async def get_group_id(self) -> int:
        return self.group_id


class VoteOption(Model):
    __parse_name__ = "vote_option"
    id = fields.IntField(pk=True, autoincrement=True)
    title = fields.CharField(max_length=100, null=False)

    vote_id: int
    vote: fields.ForeignKeyRelation["Vote"] = fields.ForeignKeyField(
        "models.Vote",
        to_field="id",
        related_name="vote_options",
        on_delete=fields.CASCADE,
    )

    user_vote_option_responses: fields.ReverseRelation["UserVoteOptionResponse"]

    class Meta:
        table = "vote_options"

    def to_dict(self) -> Dict[str, any]:
        return {
            "id": self.id,
            "title":self.title,
            "vote_id": self.vote_id
        }
    
    async def get_group_id(self) -> int:
        vote = await Vote.get(id=self.vote_id)
        return vote.group_id

class UserVoteOptionResponse(Model):
    __parse_name__ = "user_vote_option_response"
    id = fields.IntField(pk=True, autoincrement=True)

    vote_option_id: int
    vote_option: fields.ForeignKeyRelation["VoteOption"] = fields.ForeignKeyField(
        "models.VoteOption",
        to_field="id",
        related_name="user_vote_option_responses",
        on_delete=fields.CASCADE,
    )
    user_and_group_id: int
    user_and_group: fields.ForeignKeyRelation["UserAndGroup"] = fields.ForeignKeyField(
        "models.UserAndGroup",
        to_field="id",
        related_name="user_vote_option_responses",
        on_delete=fields.CASCADE,
    )

    class Meta:
        unique_together = [("vote_option_id", "user_and_group_id")]
        table = "user_vote_option_responses"

    def to_dict(self) -> Dict[str, any]:
        return {"id":self.id, "vote_option_id": self.vote_option_id, "user_and_group_id":self.user_and_group_id}
    
    async def get_group_id(self) -> int:
        user_and_group = await UserAndGroup.get(id=self.user_and_group_id)
        return user_and_group.group_id


class Invite(Model):
    __parse_name__ = "invite"
    id = fields.IntField(pk=True, autoincrement=True)
    code = fields.CharField(max_length=16, null=False, unique=True)
    expiration_date = fields.DateField(null=False)

    group_id: int
    group: fields.ForeignKeyRelation["Group"] = fields.ForeignKeyField(
        model_name="models.Group",
        to_field="id",
        related_name="invites",
        null=False,
    )

    class Meta:
        table = "invites"

    def to_dict(self) -> Dict[str, any]:
        return {"id":self.id, "code":self.code, "expiration_date":self.expiration_date.isoformat(), "group_id":self.group_id}
    
    async def get_group_id(self) -> int:
        return self.group_id
    
    def is_expired(self) -> bool:
        return self.expiration_date < date.today()
    
    @staticmethod
    def generate_code() -> str:
        return generate_random_hex(16)

    @staticmethod
    @atomic
    async def delete_expired():
        conn = connections.get("default")
        await conn.execute_query("DELETE FROM invites WHERE expiration_date < CURRENT_DATE;")
