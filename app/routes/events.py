from sanic import Blueprint
from sanic_jwt import protected
from sanic.request import Request
from sanic.response import json
from tortoise.transactions import atomic
from app.db.models import Event, User

events = Blueprint("events", url_prefix="/events")

@events.route("/", methods=["GET"])
@protected()
async def get_events(request: Request, my_user: User):
    events = await Event.all()
    return json([event.to_dict() for event in events])


@events.route("/<event_id:int>", methods=["GET"])
@protected()
async def get_event(request: Request, my_user: User, event_id: int):
    event = await Event.get_or_none(id=event_id)
    if event:
        return json(event.to_dict())
    else:
        return json({"error": f"Event with ID {event_id} not found"}, status=404)


@events.route("/<event_id:int>", methods=["PUT"])
@protected()
@atomic()
async def update_event(request: Request, my_user: User, event_id: int):
    data = request.json
    event = await Event.get_or_none(id=event_id)
    if event:
        await event.update_from_dict(data)
        return json(event.to_dict())
    else:
        return json({"error": f"Event with ID {event_id} not found"}, status=404)


@events.route("/<event_id:int>", methods=["DELETE"])
@protected()
@atomic()
async def delete_event(request: Request, my_user: User, event_id: int):
    event = await Event.get_or_none(id=event_id)
    if event:
        await event.delete()
        return json({"message": f"Event with ID {event_id} deleted successfully"})
    else:
        return json({"error": f"Event with ID {event_id} not found"}, status=404)
    
    
@events.route("/<event_id:int>/event_options", methods=["GET"])
@protected()
@atomic()
async def get_event_event_options(request: Request, my_user: User, event_id: int):
    event = await Event.get_or_none(id=event_id).prefetch_related("event_options")
    if event:
        return json([event_option.to_dict() for event_option in event.event_options])
    else:
        return json({"error": f"Event with ID {event_id} not found"}, status=404)