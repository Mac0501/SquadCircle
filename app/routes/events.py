from sanic import Blueprint
from sanic_jwt import protected
from sanic.request import Request
from sanic.response import json
from tortoise.transactions import atomic
from app.db.models import Event, EventOption, User
from app.utils.decorators import check_for_permission
from app.utils.tools import filter_dict_by_keys
from app.utils.types import EventStateEnum, UserGroupPermissionEnum

events = Blueprint("events", url_prefix="/events")

# @events.route("/", methods=["GET"], name="get_events")
# @protected()
# @check_for_permission()
# async def get_events(request: Request, my_user: User):
#     events = await Event.all()
#     return json([event.to_dict() for event in events])


@events.route("/<event_id:int>", methods=["GET"], name="get_event")
@protected()
@check_for_permission()
async def get_event(request: Request, my_user: User, event: Event|None):
    if event:
        await Event.update_state()
        return json(event.to_dict())
    else:
        return json({"error": "Event not found"}, status=404)


@events.route("/<event_id:int>", methods=["PUT"], name="update_event")
@protected()
@check_for_permission([UserGroupPermissionEnum.MANAGE_EVENTS])
@atomic()
async def update_event(request: Request, my_user: User, event: Event|None):
    if event:
        if event.state == EventStateEnum.ARCHIVED:
            return json({"error": f"The Event is Archived."}, status=403)
        await event.update_from_dict(filter_dict_by_keys(request.json, ["title", "color", "description", "state"]))
        await event.save()
        return json(event.to_dict())
    else:
        return json({"error": "Event not found"}, status=404)


@events.route("/<event_id:int>", methods=["DELETE"], name="delete_event")
@protected()
@check_for_permission([UserGroupPermissionEnum.MANAGE_EVENTS])
@atomic()
async def delete_event(request: Request, my_user: User, event: Event|None):
    if event:
        await event.delete()
        return json({"message": "Event deleted successfully"})
    else:
        return json({"error": "Event not found"}, status=404)
    
    
@events.route("/<event_id:int>/event_options", methods=["GET"], name="get_event_event_options")
@protected()
@check_for_permission()
async def get_event_event_options(request: Request, my_user: User, event: Event|None):
    if event:
        await event.fetch_related("event_options")
        return json([event_option.to_dict() for event_option in event.event_options])
    else:
        return json({"error": "Event not found"}, status=404)
    
@events.route("/<event_id:int>/event_options", methods=["POST"], name="create_event_event_options")
@protected()
@check_for_permission([UserGroupPermissionEnum.MANAGE_EVENTS])
@atomic()
async def create_event_event_options(request: Request, my_user: User, event: Event|None):
    if event:
        if event.state == EventStateEnum.ARCHIVED:
            return json({"error": f"The Event is Archived."}, status=403)
        data = filter_dict_by_keys(request.json,["date", "start_time", "end_time"])
        event_option = await EventOption.create(event_id=event.id, **data)
        return json(event_option.to_dict())
    else:
        return json({"error": "Event not found"}, status=404)