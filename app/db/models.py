from tortoise import fields
from tortoise.models import Model
from app.utils.types import EventState, EventOptionResponse

__all__ = ["User"]


class User(Model):
    id = fields.IntField(pk=True, autoincrement=True)
    name = fields.CharField(max_length=32, null=False, unique=True)
    password = fields.CharField(max_length=100, null=False)
    avatar = fields.CharField(max_length=100, null=True)
    owner = fields.BooleanField(default=False, null=False)
    user_and_group: fields.ReverseRelation["UserAndGroup"]

    class Meta:
        table = "users"

class Group(Model):
    id = fields.IntField(pk=True, autoincrement=True)
    name = fields.CharField(max_length=32, null=False)
    description = fields.TextField(max_length=2000, null=False)
    user_and_group: fields.ReverseRelation["UserAndGroup"]
    events: fields.ReverseRelation["UserAndGroup"]

    class Meta:
        table = "groups"

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

class Invite():
    id = fields.IntField(pk=True, autoincrement=True)
    code = fields.CharField(max_length=16, null=False)
    expiration_date = fields.DateField(null=False)

    class Meta:
        table = "invites"
