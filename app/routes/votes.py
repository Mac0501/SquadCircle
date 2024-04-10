from sanic import Blueprint
from sanic_jwt import protected
from sanic.request import Request
from sanic.response import json
from tortoise.transactions import atomic
from app.db.models import Vote, VoteOption, User
from app.utils.decorators import check_for_permission
from app.utils.tools import filter_dict_by_keys
from app.utils.types import UserGroupPermissionEnum

votes = Blueprint("votes", url_prefix="/votes")

# @votes.route("/", methods=["GET"], name="get_votes")
# @protected()
# @check_for_permission()
# async def get_votes(request: Request, my_user: User):
#     votes = await Vote.all()
#     return json([vote.to_dict() for vote in votes])


@votes.route("/<vote_id:int>", methods=["GET"], name="get_vote")
@protected()
@check_for_permission()
async def get_vote(request: Request, my_user: User, vote: Vote|None):
    if vote:
        return json(vote.to_dict())
    else:
        return json({"error": "Vote not found"}, status=404)


@votes.route("/<vote_id:int>", methods=["PUT"], name="update_vote")
@protected()
@check_for_permission([UserGroupPermissionEnum.MANAGE_VOTES])
@atomic()
async def update_vote(request: Request, my_user: User, vote: Vote|None):
    if vote:
        await vote.update_from_dict(filter_dict_by_keys(request.json, ["title", "multi_select"]))
        await vote.save()
        return json(vote.to_dict())
    else:
        return json({"error": "Vote not found"}, status=404)


@votes.route("/<vote_id:int>", methods=["DELETE"], name="delete_vote")
@protected()
@check_for_permission([UserGroupPermissionEnum.MANAGE_VOTES])
@atomic()
async def delete_vote(request: Request, my_user: User, vote: Vote|None):
    if vote:
        await vote.delete()
        return json({"message": "Vote deleted successfully"})
    else:
        return json({"error": "Vote not found"}, status=404)
    
    
@votes.route("/<vote_id:int>/vote_options", methods=["GET"], name="get_vote_vote_options")
@protected()
@check_for_permission()
async def get_vote_vote_options(request: Request, my_user: User, vote: Vote|None):
    if vote:
        await vote.fetch_related("vote_options")
        return json([vote_option.to_dict() for vote_option in vote.vote_options])
    else:
        return json({"error": "Vote not found"}, status=404)
    
@votes.route("/<vote_id:int>/vote_options", methods=["POST"], name="create_vote_vote_options")
@protected()
@check_for_permission([UserGroupPermissionEnum.MANAGE_VOTES])
@atomic()
async def create_vote_vote_options(request: Request, my_user: User, vote: Vote|None):
    if vote:
        data = filter_dict_by_keys(request.json,["title"])
        vote_option = await VoteOption.create(vote_id=vote.id, **data)
        return json(vote_option.to_dict())
    else:
        return json({"error": "Vote not found"}, status=404)