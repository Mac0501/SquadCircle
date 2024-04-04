from sanic import Blueprint
from sanic.request import Request
from sanic.response import json
from sanic_jwt import protected
from tortoise.transactions import atomic
from app.db.models import Invite

invites = Blueprint("invites", url_prefix="/invites")

@invites.route("/", methods=["GET"])
@protected()
async def get_invites(request: Request):
    invites = await Invite.all()
    return json([invite.to_dict() for invite in invites])

@invites.route("/<invite_id:int>", methods=["GET"])
@protected()
async def get_invite(request: Request, invite_id: int):
    invite = await Invite.get_or_none(id=invite_id)
    if invite:
        return json(invite.to_dict())
    else:
        return json({"error": f"Invite with ID {invite_id} not found"}, status=404)

@invites.route("/", methods=["POST"])
@protected()
@atomic()
async def create_invite(request: Request):
    data = request.json
    data["code"] = Invite.generate_code()
    invite = await Invite.create(**data)
    return json(invite.to_dict(), status=201)

@invites.route("/<invite_id:int>", methods=["DELETE"])
@protected()
@atomic()
async def delete_invite(request: Request, invite_id: int):
    invite = await Invite.get_or_none(id=invite_id)
    if invite:
        await invite.delete()
        return json({"message": f"Invite with ID {invite_id} deleted successfully"})
    else:
        return json({"error": f"Invite with ID {invite_id} not found"}, status=404)
