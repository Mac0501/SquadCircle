from sanic import Blueprint
from sanic.request import Request
from sanic.response import json
from sanic_jwt import protected
from tortoise.transactions import atomic
from app.db.models import Invite, User
from app.utils.decorators import check_for_permission
from app.utils.types import UserGroupPermissionEnum

invites = Blueprint("invites", url_prefix="/invites")

@invites.route("/", methods=["GET"], name="get_invites")
@protected()
@check_for_permission([UserGroupPermissionEnum.MANAGE_INVITES])
async def get_invites(request: Request, my_user: User):
    invites = await Invite.all()
    return json([invite.to_dict() for invite in invites])


@invites.route("/<invite_id:int>", methods=["GET"], name="get_invite")
@protected()
@check_for_permission([UserGroupPermissionEnum.MANAGE_INVITES])
async def get_invite(request: Request, my_user: User, invite: Invite|None):
    if invite:
        return json(invite.to_dict())
    else:
        return json({"error": f"Invite not found"}, status=404)

@invites.route("/<invite_id:int>", methods=["DELETE"], name="delete_invite")
@protected()
@check_for_permission([UserGroupPermissionEnum.MANAGE_INVITES])
@atomic()
async def delete_invite(request: Request, my_user: User, invite: Invite|None):
    if invite:
        await invite.delete()
        return json({"message": f"Invite deleted successfully"})
    else:
        return json({"error": f"Invite not found"}, status=404)
