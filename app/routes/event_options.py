from sanic import Blueprint
from sanic_jwt import protected
from sanic.request import Request
from sanic.response import json
from tortoise.transactions import atomic
from app.db.models import EventOption

event_options = Blueprint("event_options", url_prefix="/event_options")

@event_options.route("/<event_option_id:int>", methods=["GET"])
@protected()
async def get_event_option(request: Request, event_option_id: int):
    event_option = await EventOption.get_or_none(id=event_option_id)
    if event_option:
        return json(event_option.to_dict())
    else:
        return json({"error": f"Event Option with ID {event_option_id} not found"}, status=404)


@event_options.route("/<event_option_id:int>", methods=["PUT"])
@protected()
@atomic()
async def update_event_option(request: Request, event_option_id: int):
    data = request.json
    event_option = await EventOption.get_or_none(id=event_option_id)
    if event_option:
        await event_option.update_from_dict(data)
        return json(event_option.to_dict())
    else:
        return json({"error": f"Event Option with ID {event_option_id} not found"}, status=404)


@event_options.route("/<event_option_id:int>", methods=["DELETE"])
@protected()
@atomic()
async def delete_event_option(request: Request, event_option_id: int):
    event_option = await EventOption.get_or_none(id=event_option_id)
    if event_option:
        await event_option.delete()
        return json({"message": f"Event Option with ID {event_option_id} deleted successfully"})
    else:
        return json({"error": f"Event Option with ID {event_option_id} not found"}, status=404)
