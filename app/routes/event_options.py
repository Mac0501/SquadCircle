from sanic import Blueprint
from sanic_jwt import protected
from sanic.request import Request
from sanic.response import json
from tortoise.transactions import atomic
from app.db.models import EventOption, User, UserAndGroup, UserEventOptionResponse, Event
from app.utils.tools import filter_dict_by_keys
from app.utils.decorators import check_for_permission
from app.utils.types import UserGroupPermissionEnum, EventStateEnum

event_options = Blueprint("event_options", url_prefix="/event_options")

@event_options.route("/<event_option_id:int>", methods=["GET"], name="get_event_option")
@protected()
@check_for_permission()
async def get_event_option(request: Request, my_user: User, event_option: EventOption|None):
    if event_option:
        return json(event_option.to_dict())
    else:
        return json({"error": f"Event Option not found"}, status=404)


@event_options.route("/<event_option_id:int>", methods=["PUT"], name="update_event_option")
@protected()
@check_for_permission([UserGroupPermissionEnum.MANAGE_EVENTS])
@atomic()
async def update_event_option(request: Request, my_user: User, event_option: EventOption|None):
    if event_option:
        await event_option.fetch_related("event")
        if event_option.event.state == EventStateEnum.ARCHIVED:
            return json({"error": f"The Event is Archived."}, status=403)

        await event_option.update_from_dict(filter_dict_by_keys(request.json,["date", "start_time", "end_time"]))
        await event_option.save()
        return json(event_option.to_dict())
    else:
        return json({"error": f"Event Option not found"}, status=404)


@event_options.route("/<event_option_id:int>", methods=["DELETE"], name="delete_event_option")
@protected()
@check_for_permission([UserGroupPermissionEnum.MANAGE_EVENTS])
@atomic()
async def delete_event_option(request: Request, my_user: User, event_option: EventOption|None):
    if event_option:
        await event_option.fetch_related("event")
        if event_option.event.state == EventStateEnum.ARCHIVED:
            return json({"error": f"The Event is Archived."}, status=403)
        await event_option.delete()
        return json({"message": f"Event Option deleted successfully"})
    else:
        return json({"error": f"Event Option not found"}, status=404)
    

@event_options.route("/<event_option_id:int>/user_event_option_response", methods=["GET"], name="get_user_event_option_responses")
@protected()
@check_for_permission()
async def get_user_event_option_responses(request: Request, my_user: User, event_option: EventOption|None):
    
    if not event_option:
        return json({"error": f"EventOption not found"}, status=404)
    
    await event_option.fetch_related("user_event_option_responses")

    return json([user_event_option_response.to_dict() for user_event_option_response in event_option.user_event_option_responses])
    
    
@event_options.route("/<event_option_id:int>/user_event_option_response", methods=["POST"], name="create_user_event_option_response")
@protected()
@check_for_permission()
@atomic()
async def create_user_event_option_response(request: Request, my_user: User, event_option: EventOption|None):
    data = request.json
    await Event.update_state()
    if not event_option:
        return json({"error": f"EventOption not found"}, status=404)
    
    await event_option.fetch_related("event")
    if event_option.event.state != EventStateEnum.VOTING:
        return json({"error": f"The Voting period is over."}, status=403)
    
    user_and_group = await UserAndGroup.get_or_none(user_id=my_user.id, group_id=event_option.event.group_id)
    if not user_and_group:
        return json({"error": f"User is not in Group"}, status=404)

    user_event_option_response = await UserEventOptionResponse.get_or_none(event_option_id=event_option.id, user_and_group_id=user_and_group.id)
    data = filter_dict_by_keys(request.json, ["response", "reason"], True)
    if user_event_option_response:
        await user_event_option_response.update_from_dict(data)
        await user_event_option_response.save()
    else:
        user_event_option_response = await UserEventOptionResponse.create(
            event_option=event_option,
            user_and_group=user_and_group, **data
        )
    return json(user_event_option_response.to_dict(), status=201)


@event_options.route("/<event_option_id:int>/set_for_event", methods=["PUT"], name="set_event_option_for_event")
@protected()
@check_for_permission([UserGroupPermissionEnum.MANAGE_EVENTS])
async def set_event_option_for_event(request: Request, my_user: User, event_option: EventOption|None):
    if event_option:
        await event_option.fetch_related("event")
        if event_option.event.state == EventStateEnum.ARCHIVED:
            return json({"error": f"The Event is Archived."}, status=403)
        event_option.event.choosen_event_option_id = event_option.id
        await event_option.event.save()
        return json({"message": f"Set EventOption for Event"})
    else:
        return json({"error": f"Event Option not found"}, status=404)
