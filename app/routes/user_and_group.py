from sanic import Blueprint
from sanic_jwt import protected
from sanic.request import Request
from sanic.response import json 
from app.db.models import User, UserAndGroup
from app.utils.decorators import check_for_permission

user_and_group = Blueprint("user_and_group", url_prefix="/user_and_group")


@user_and_group.route("/<user_and_group_id:int>", methods=["GET"], name="get_user_and_group")
@protected()
@check_for_permission()
async def get_user_and_group(request: Request, my_user: User, user_and_group: UserAndGroup|None):
    if user_and_group:
        return json(user_and_group.to_dict())
    else:
        return json({"error": f"UserAndGroup not found"}, status=404)