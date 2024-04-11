from sanic import Blueprint
from sanic_jwt import protected
from sanic.request import Request
from sanic.response import json
from tortoise.transactions import atomic
from app.db.models import EventOption, User, UserEventOptionResponse
from app.utils.decorators import check_for_permission
from app.utils.tools import filter_dict_by_keys
from app.utils.types import EventStateEnum

user_event_option_response= Blueprint("user_event_option_response", url_prefix="/user_event_option_response")

@user_event_option_response.route("/<user_event_option_response_id:int>", methods=["GET"], name="get_user_event_option_response")
@protected()
@check_for_permission()
async def get_user_event_option_response(request: Request, my_user: User, user_event_option_response: UserEventOptionResponse|None):
    if user_event_option_response:
        return json(user_event_option_response.to_dict())
    else:
        return json({"error": f"Event Option not found"}, status=404)


@user_event_option_response.route("/<user_event_option_response_id:int>", methods=["PUT"], name="update_user_event_option_response")
@protected()
@check_for_permission()
@atomic()
async def update_user_event_option_response(request: Request, my_user: User, user_event_option_response: UserEventOptionResponse|None):
    if user_event_option_response:
        await user_event_option_response.fetch_related("user_and_group")
        if user_event_option_response.user_and_group.user_id == my_user.id:
            event_option = await EventOption.get(id=user_event_option_response.event_option_id).prefetch_related("event")
            if event_option.event.state != EventStateEnum.VOTING:
                return json({"error": f"The Voting period is over."}, status=403)
            await user_event_option_response.update_from_dict(filter_dict_by_keys(request.json,["response"]))
            await user_event_option_response.save()
            return json(user_event_option_response.to_dict())
        else:
            return json({"error": f"You are not allowed to access this enpoint."}, status=403)
    else:
        return json({"error": f"Event Option not found"}, status=404)