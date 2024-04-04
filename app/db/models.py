import hashlib
from typing import Iterable
from tortoise import fields
from tortoise.backends.base.client import BaseDBAsyncClient
from tortoise.models import Model
from app.utils.types import EventState, EventOptionResponse

class User(Model):
    id = fields.IntField(pk=True, autoincrement=True)
    name = fields.CharField(max_length=32, null=False, unique=True)
    password = fields.CharField(max_length=100, null=False)
    owner = fields.BooleanField(default=False, null=False)
    user_and_group: fields.ReverseRelation["UserAndGroup"]

    async def save(self, using_db: BaseDBAsyncClient | None = None, update_fields: Iterable[str] | None = None, force_create: bool = False, force_update: bool = False) -> None:
        self.password = self.hash_password("changeme")
        return await super().save(using_db, update_fields, force_create, force_update)
    
    class Meta:
        table = "users"

    def to_dict(self):
        return {"id":self.id, "name":self.name, "owner":self.owner}
    
    def verify_password(self, input_password:str):
        salt, stored_password = self.password.split("$")
        input_hashed_password = hashlib.sha256((input_password + salt).encode()).hexdigest()
        return input_hashed_password == stored_password
    
    def hash_password(self, password):
        salt = hashlib.sha256().hexdigest()[:10]
        hashed_password = hashlib.sha256((password + salt).encode()).hexdigest()
        return f"{salt}${hashed_password}"


class Group(Model):
    id = fields.IntField(pk=True, autoincrement=True)
    name = fields.CharField(max_length=32, null=False)
    description = fields.TextField(max_length=2000, null=False)
    user_and_group: fields.ReverseRelation["UserAndGroup"]
    events: fields.ReverseRelation["UserAndGroup"]

    class Meta:
        table = "groups"

    def to_dict(self):
        return {"id":self.id, "name":self.name, "description":self.description}

class UserAndGroup(Model):
    id = fields.BigIntField(pk=True, autoincrement=True)
    user: fields.ForeignKeyRelation["User"] = fields.ForeignKeyField(
        model_name="models.User",
        to_field="id",
        related_name="user_and_group",
        null=False,
    )
    group: fields.ForeignKeyRelation["Group"] = fields.ForeignKeyField(
        model_name="models.Group",
        to_field="id",
        related_name="user_and_group",
        null=False,
    )
    user_event_option_responses: fields.ReverseRelation["UserEventOptionResponse"]
    user_group_permission: fields.ReverseRelation["UserGroupPermission"]

    class Meta:
        table = "user_and_group"

    def to_dict(self):
        return {"id":self.id}

class UserGroupPermission(Model):
    id = fields.BigIntField(pk=True, autoincrement=True)

    user_and_group: fields.ForeignKeyRelation["UserAndGroup"] = fields.ForeignKeyField(
        "models.UserAndGroup",
        to_field="id",
        related_name="user_group_permission",
        on_delete=fields.CASCADE,
    )

    class Meta:
        table = "user_group_permission"

    def to_dict(self):
        return {"id":self.id, "name":self.name, "description":self.description}

class Event(Model):
    id = fields.IntField(pk=True, autoincrement=True)
    title = fields.CharField(max_length=100, null=False)
    color = fields.CharField(max_length=6, null=False)
    description = fields.TextField(max_length=2000, null=True)
    state = fields.IntEnumField(enum_type=EventState, null=False, default=EventState.OPEN)
    group: fields.ForeignKeyRelation["Group"] = fields.ForeignKeyField(
        "models.Group",
        to_field="id",
        related_name="events",
        on_delete=fields.CASCADE,
    )
    event_options: fields.ReverseRelation["EventOption"]

    class Meta:
        table = "events"

    def to_dict(self):
        return {"id":self.id, "title":self.title, "color":self.color, "description":self.description, "state":self.state,}


class EventOption(Model):
    id = fields.IntField(pk=True, autoincrement=True)
    date = fields.DateField(null=False)
    start_time = fields.TimeField(null=False)
    end_time = fields.TimeField(null=True)

    event: fields.ForeignKeyRelation["Event"] = fields.ForeignKeyField(
        "models.Event",
        to_field="id",
        related_name="event_options",
        on_delete=fields.CASCADE,
    )

    user_event_option_responses: fields.ReverseRelation["UserEventOptionResponse"]

    class Meta:
        table = "event_options"

    def to_dict(self):
        return {"id":self.id, "date":self.date, "start_time":self.start_time, "end_time":self.end_time}

class UserEventOptionResponse(Model):
    id = fields.IntField(pk=True, autoincrement=True)
    response = fields.IntEnumField(enum_type=EventOptionResponse, null=False)

    event_option: fields.ForeignKeyRelation["EventOption"] = fields.ForeignKeyField(
        "models.EventOption",
        to_field="id",
        related_name="user_event_option_responses",
        on_delete=fields.CASCADE,
    )

    user_and_group: fields.ForeignKeyRelation["UserAndGroup"] = fields.ForeignKeyField(
        "models.UserAndGroup",
        to_field="id",
        related_name="user_event_option_responses",
        on_delete=fields.CASCADE,
    )

    class Meta:
        table = "user_event_option_responses"

    def to_dict(self):
        return {"id":self.id, "response":self.response}

class Invite():
    id = fields.IntField(pk=True, autoincrement=True)
    code = fields.CharField(max_length=16, null=False)
    expiration_date = fields.DateField(null=False)

    class Meta:
        table = "invites"

    def to_dict(self):
        return {"id":self.id, "code":self.code, "expiration_date":self.expiration_date}
