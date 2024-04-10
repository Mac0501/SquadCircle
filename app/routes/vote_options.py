from sanic import Blueprint
from sanic_jwt import protected
from sanic.request import Request
from sanic.response import json
from tortoise.transactions import atomic
from tortoise import connections
from app.db.models import VoteOption, User, UserAndGroup, UserVoteOptionResponse
from app.utils.tools import filter_dict_by_keys
from app.utils.decorators import check_for_permission
from app.utils.types import UserGroupPermissionEnum

vote_options = Blueprint("vote_options", url_prefix="/vote_options")

@vote_options.route("/<vote_option_id:int>", methods=["GET"], name="get_vote_option")
@protected()
@check_for_permission()
async def get_vote_option(request: Request, my_user: User, vote_option: VoteOption|None):
    if vote_option:
        return json(vote_option.to_dict())
    else:
        return json({"error": f"Vote Option not found"}, status=404)


@vote_options.route("/<vote_option_id:int>", methods=["PUT"], name="update_vote_option")
@protected()
@check_for_permission([UserGroupPermissionEnum.MANAGE_VOTES])
@atomic()
async def update_vote_option(request: Request, my_user: User, vote_option: VoteOption|None):
    if vote_option:
        await vote_option.update_from_dict(filter_dict_by_keys(request.json,["title"]))
        await vote_option.save()
        return json(vote_option.to_dict())
    else:
        return json({"error": f"Vote Option not found"}, status=404)


@vote_options.route("/<vote_option_id:int>", methods=["DELETE"], name="delete_vote_option")
@protected()
@check_for_permission([UserGroupPermissionEnum.MANAGE_VOTES])
@atomic()
async def delete_vote_option(request: Request, my_user: User, vote_option: VoteOption|None):
    if vote_option:
        await vote_option.delete()
        return json({"message": f"Vote Option deleted successfully"})
    else:
        return json({"error": f"Vote Option not found"}, status=404)
    

@vote_options.route("/<vote_option_id:int>/user_vote_option_response", methods=["GET"], name="get_user_vote_option_responses")
@protected()
@check_for_permission()
async def get_user_vote_option_responses(request: Request, my_user: User, vote_option: VoteOption|None):
    
    if not vote_option:
        return json({"error": f"VoteOption not found"}, status=404)
    
    await vote_option.fetch_related("user_vote_option_responses")

    return json([user_vote_option_response.to_dict() for user_vote_option_response in vote_option.user_vote_option_responses])
    
    
@vote_options.route("/<vote_option_id:int>/user_vote_option_response", methods=["POST"], name="create_user_vote_option_response")
@protected()
@check_for_permission()
@atomic()
async def create_user_vote_option_response(request: Request, my_user: User, vote_option: VoteOption|None):
    
    conn = connections.get("default")
    delete_incomplete = f"""
    DELETE FROM user_vote_option_response
    WHERE user_and_group_id IN (
        SELECT uag.id
        FROM user_and_group AS uag
        INNER JOIN vote_option AS vo ON uag.group_id = vo.vote_id
        WHERE uag.user_id = {my_user.id}
        AND vo.id != {vote_option.id}
        AND vo.multi_select = 0
    );
    """

    await conn.execute_query(delete_incomplete)

    if not vote_option:
        return json({"error": f"VoteOption not found"}, status=404)
    
    await vote_option.fetch_related("vote")
    user_and_group = await UserAndGroup.get_or_none(user_id=my_user.id, group_id=vote_option.vote.group_id)
    if not user_and_group:
        return json({"error": f"User is not in Group"}, status=404)

    user_vote_option_response = await UserVoteOptionResponse.get_or_none(vote_option_id=vote_option.id, user_and_group_id=user_and_group.id)
    if user_vote_option_response:
        return json({"error": f"UserVoteOptionResponse allready exists"}, status=404)
    else:
        user_vote_option_response = await UserVoteOptionResponse.create(
            vote_option=vote_option,
            user_and_group=user_and_group
        )
    return json(user_vote_option_response.to_dict(), status=201)


@vote_options.route("/<vote_option_id:int>/user_vote_option_response", methods=["DELETE"], name="delete_user_vote_option_response")
@protected()
@check_for_permission()
@atomic()
async def delete_user_vote_option_response(request: Request, my_user: User, vote_option: VoteOption|None):
    
    if not vote_option:
        return json({"error": f"VoteOption not found"}, status=404)
    
    await vote_option.fetch_related("vote")
    user_and_group = await UserAndGroup.get_or_none(user_id=my_user.id, group_id=vote_option.vote.group_id)
    if not user_and_group:
        return json({"error": f"User is not in Group"}, status=404)

    user_vote_option_response = await UserVoteOptionResponse.get_or_none(vote_option_id=vote_option.id, user_and_group_id=user_and_group.id)
    if user_vote_option_response:
        await user_vote_option_response.delete()
        return json({"error": f"UserVoteOptionResponse deleted successfully"}, status=201)
    else:
        return json({"error": f"UserVoteOptionResponse not found"}, status=404)


@vote_options.route("/<vote_option_id:int>/user_vote_option_response/toggel", methods=["POST"], name="create_user_vote_option_response_toggel")
@protected()
@check_for_permission()
@atomic()
async def create_user_vote_option_response_toggel(request: Request, my_user: User, vote_option: VoteOption|None):

    if not vote_option:
        return json({"error": f"VoteOption not found"}, status=404)
    
    await vote_option.fetch_related("vote")
    user_and_group = await UserAndGroup.get_or_none(user_id=my_user.id, group_id=vote_option.vote.group_id)
    if not user_and_group:
        return json({"error": f"User is not in Group"}, status=404)

    user_vote_option_response = await UserVoteOptionResponse.get_or_none(vote_option_id=vote_option.id, user_and_group_id=user_and_group.id)
    if user_vote_option_response:
        await user_vote_option_response.delete()
        return json({"message": f"UserVoteOptionResponse deleted successfully"}, status=201)
    else:
        conn = connections.get("default")
        delete_incomplete = f"""
        DELETE FROM user_vote_option_response
        WHERE user_and_group_id IN (
            SELECT uag.id
            FROM user_and_group AS uag
            INNER JOIN vote_option AS vo ON uag.group_id = vo.vote_id
            WHERE uag.user_id = {my_user.id}
            AND vo.id != {vote_option.id}
            AND vo.multi_select = 0
        );
        """
        await conn.execute_query(delete_incomplete)
        user_vote_option_response = await UserVoteOptionResponse.create(
            vote_option=vote_option,
            user_and_group=user_and_group
        )
        return json(user_vote_option_response.to_dict(), status=201)