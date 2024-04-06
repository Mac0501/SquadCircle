from sanic import Blueprint
from sanic_jwt import protected
from sanic.request import Request
from sanic.response import json
from tortoise.transactions import atomic
from app.db.models import EventOption, User, UserAndGroup, UserEventOptionResponse
from app.utils.tools import filter_dict_by_keys
from app.utils.decorators import check_for_permission
from app.utils.types import UserGroupPermissionEnum

event_options = Blueprint("event_options", url_prefix="/event_options")

@event_options.route("/<event_option_id:int>", methods=["GET"])
@protected()
@check_for_permission()
async def get_event_option(request: Request, my_user: User, event_option: EventOption|None):
    if event_option:
        return json(event_option.to_dict())
    else:
        return json({"error": f"Event Option not found"}, status=404)


@event_options.route("/<event_option_id:int>", methods=["PUT"])
@protected()
@check_for_permission([UserGroupPermissionEnum.MANAGE_EVENTS])
@atomic()
async def update_event_option(request: Request, my_user: User, event_option: EventOption|None):
    if event_option:
        await event_option.update_from_dict(filter_dict_by_keys(request.json,["date", "start_time", "end_time"]))
        return json(event_option.to_dict())
    else:
        return json({"error": f"Event Option not found"}, status=404)


@event_options.route("/<event_option_id:int>", methods=["DELETE"])
@protected()
@check_for_permission([UserGroupPermissionEnum.MANAGE_EVENTS])
@atomic()
async def delete_event_option(request: Request, my_user: User, event_option: EventOption|None):
    if event_option:
        await event_option.delete()
        return json({"message": f"Event Option deleted successfully"})
    else:
        return json({"error": f"Event Option not found"}, status=404)
    

@event_options.route("/<event_option_id:int>/user_event_option_response", methods=["GET"])
@protected()
@check_for_permission()
async def get_user_event_option_responses(request: Request, my_user: User, event_option: EventOption|None):
    
    if not event_option:
        return json({"error": f"EventOption not found"}, status=404)
    
    user_event_option_responses = await UserEventOptionResponse.filter(event_option_id=event_option.id).prefetch_related("user_and_group")

    return json([{"id":user_event_option_response.id, "response":user_event_option_response.response, "user_id":user_event_option_response.user_and_group.user_id, "event_id":user_event_option_responses.event_id} for user_event_option_response in user_event_option_responses], status=201)
    
    
@event_options.route("/<event_option_id:int>/user_event_option_response", methods=["POST"])
@protected()
@check_for_permission()
@atomic()
async def create_user_event_option_response(request: Request, my_user: User, event_option: EventOption|None):
    data = request.json
    
    if not event_option:
        return json({"error": f"EventOption not found"}, status=404)
    
    user_and_group = await UserAndGroup.get_or_none(user_id=my_user.id, group_id=event_option.event.group_id)
    if not user_and_group:
        return json({"error": f"User is not in Group"}, status=404)

    user_event_option_response = await UserEventOptionResponse.get_or_none(event_option_id=event_option.id, user_and_group_id=user_and_group.id)
    if data.get("response", None):
        if user_event_option_response:
            user_event_option_response.update(response=data.get("response"))
        else:
            user_event_option_response = await UserEventOptionResponse.create(
                response=data.get("response"),
                event_option=event_option,
                user_and_group=user_and_group,
            )
        return json(user_event_option_response.to_dict(), status=201)
    else:
        return json(user_event_option_response.to_dict(), status=400)
