from sanic import Blueprint
from sanic_jwt import protected, inject_user
from sanic.request import Request
from sanic.response import json
from tortoise.transactions import atomic
from app.db.models import EventOption, User, UserAndGroup, UserEventOptionResponse

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
    
@event_options.route("/<event_option_id:int>/user_event_option_response", methods=["GET"])
@inject_user()
@protected()
@atomic()
async def get_user_event_option_responses(request: Request, user: User, event_option_id: int):

    event_option = await EventOption.get_or_none(id=event_option_id).prefetch_related("event")
    
    if not event_option:
        return json({"error": f"EventOption with ID {event_option_id} not found"}, status=404)
    
    user_and_group = await UserAndGroup.get_or_none(user_id=user.id, group_id=event_option.event.group_id)
    if not user_and_group:
        return json({"error": f"User with ID {user.id} is not in Group with ID {event_option.event.group_id}"}, status=404)
    
    user_event_option_responses = await UserEventOptionResponse.filter(event_option_id=event_option.id).prefetch_related("user_and_group")

    return json([{"id":user_event_option_response.id, "response":user_event_option_response.response, "user_id":user_event_option_response.user_and_group.user_id, "event_id":user_event_option_responses.event_idwd} for user_event_option_response in user_event_option_responses], status=201)
    
    
@event_options.route("/<event_option_id:int>/user_event_option_response", methods=["POST"])
@inject_user()
@protected()
@atomic()
async def create_user_event_option_response(request: Request, user: User, event_option_id: int):
    data = request.json
    event_option = await EventOption.get_or_none(id=event_option_id).prefetch_related("event")
    
    if not event_option:
        return json({"error": f"EventOption with ID {event_option_id} not found"}, status=404)
    
    user_and_group = await UserAndGroup.get_or_none(user_id=user.id, group_id=event_option.event.group_id)
    if not user_and_group:
        return json({"error": f"User with ID {user.id} is not in Group with ID {event_option.event.group_id}"}, status=404)

    user_event_option_response = await UserEventOptionResponse.create(
        response=data.get("response"),
        event_option=event_option,
        user_and_group=user_and_group,
    )

    return json(user_event_option_response.to_dict(), status=201)
