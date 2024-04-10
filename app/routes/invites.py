from datetime import date
from sanic import Blueprint
from sanic.request import Request
from sanic.response import json
from sanic_jwt import protected
from tortoise.transactions import atomic
from app.db.models import Invite, User
from app.utils.decorators import check_for_permission
from app.utils.types import UserGroupPermissionEnum
from app.utils.tools import filter_dict_by_keys

invites = Blueprint("invites", url_prefix="/invites")

@invites.route("/", methods=["GET"], name="get_invites")
@protected()
@check_for_permission([UserGroupPermissionEnum.MANAGE_INVITES])
async def get_invites(request: Request, my_user: User):
    await Invite.delete_expired()
    invites = await Invite.filter(expiration_date__gte=date.today())
    return json([invite.to_dict() for invite in invites])


@invites.route("/<invite_id:int>", methods=["GET"], name="get_invite")
@protected()
@check_for_permission([UserGroupPermissionEnum.MANAGE_INVITES])
async def get_invite(request: Request, my_user: User, invite: Invite|None):
    if invite and not invite.is_expired():
        return json(invite.to_dict())
    else:
        if invite:
            await invite.delete()
        return json({"error": f"Invite not found"}, status=404)
    
@invites.route("/verify_code", methods=["POST"], name="verify_code_invite")
async def verify_code_invite(request: Request, my_user: User):
    code = filter_dict_by_keys(request.json, ["code"], True)
    code = code.get("code")
    if len(code) > 16:
        return json({'message': 'Invite code doesnt exists'}, status=404)
    invite = await Invite.get_or_none(code=code)
    if not invite or invite.is_expired():
        if invite:
            await invite.delete()
        return json({'message': 'Invite code doesnt exists'}, status=404)
    return json({'message': 'Invite code is valid'})

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
