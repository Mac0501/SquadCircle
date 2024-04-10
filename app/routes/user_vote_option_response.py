from sanic import Blueprint
from sanic_jwt import protected
from sanic.request import Request
from sanic.response import json
from tortoise.transactions import atomic
from app.db.models import User, UserVoteOptionResponse
from app.utils.decorators import check_for_permission

user_vote_option_response= Blueprint("user_vote_option_response", url_prefix="/user_vote_option_response")

@user_vote_option_response.route("/<user_vote_option_response_id:int>", methods=["GET"], name="get_user_vote_option_response")
@protected()
@check_for_permission()
async def get_user_vote_option_response(request: Request, my_user: User, user_vote_option_response: UserVoteOptionResponse|None):
    if user_vote_option_response:
        return json(user_vote_option_response.to_dict())
    else:
        return json({"error": f"UserVoteOptionResponse not found"}, status=404)

    
@user_vote_option_response.route("/<user_vote_option_response_id:int>", methods=["DELETE"], name="delete_user_vote_option_response")
@protected()
@check_for_permission()
@atomic()
async def delete_user_vote_option_response(request: Request, my_user: User, user_vote_option_response: UserVoteOptionResponse|None):
    if user_vote_option_response:
        await user_vote_option_response.fetch_related("user_and_group")
        if user_vote_option_response.user_and_group.user_id == my_user.id:
            await user_vote_option_response.delete()
            return json({"message": f"UserVoteOptionResponse deleted successfully"}, status=201)
        else:
            return json({"error": f"You are not allowed to access this enpoint."}, status=403)
    else:
        return json({"error": f"UserVoteOptionResponse not found"}, status=404)