from datetime import date
from sanic import Blueprint
from sanic_jwt import protected
from sanic.request import Request
from sanic.response import json
from tortoise.transactions import atomic
from app.db.models import Event, EventOption, Group, Invite, User, UserAndGroup, UserEventOptionResponse, UserGroupPermission, UserVoteOptionResponse, Vote, VoteOption
from app.utils.decorators import check_for_permission, is_owner
from app.utils.tools import filter_dict_by_keys
from tortoise.query_utils import Prefetch
from app.utils.types import UserGroupPermissionEnum

groups = Blueprint("groups", url_prefix="/groups")

@groups.route("/", methods=["GET"], name="get_groups")
@protected()
@is_owner
async def get_groups(request: Request, my_user: User):
    groups = await Group.all()
    return json([group.to_dict() for group in groups])


@groups.route("/", methods=["POST"], name="create_group")
@protected()
@is_owner
@atomic()
async def create_group(request: Request, my_user: User):
    data = filter_dict_by_keys(request.json, ["name", "description", "discord_webhook"], True)
    group = await Group.create(**data)
    return json(group.to_dict(), status=201)


@groups.route("/<group_id:int>", methods=["GET"], name="get_group")
@protected()
@check_for_permission()
async def get_group(request: Request, my_user: User, group: Group|None):
    if group:
        return json(group.to_dict())
    else:
        return json({"error": f"Group not found"}, status=404)


@groups.route("/<group_id:int>", methods=["PUT"], name="update_group")
@protected()
@is_owner
@atomic()
async def update_group(request: Request, my_user: User, group: Group|None):
    data = filter_dict_by_keys(request.json, ["name", "description", "discord_webhook"])
    if group:
        checkName = await Group.check_name_exists(data["name"], group.id)
        if checkName:
            return json({"error": f"Name already in use."}, status=400)
        await group.update_from_dict(data)
        await group.save()
        return json(group.to_dict())
    else:
        return json({"error": f"Group not found"}, status=404)


@groups.route("/<group_id:int>", methods=["DELETE"], name="delete_group")
@protected()
@is_owner
@atomic()
async def delete_group(request: Request, my_user: User, group: Group|None):
    if group:
        await group.delete()
        return json({"message": f"Group deleted successfully"})
    else:
        return json({"error": f"Group not found"}, status=404)
    
    
@groups.route("/<group_id:int>/invites", methods=["GET"], name="get_group_invites")
@protected()
@check_for_permission([UserGroupPermissionEnum.MANAGE_INVITES])
async def get_group_invites(request: Request, my_user: User, group: Group|None):
    if not group:
        return json({"error": "Group not found"}, status=404)
    await Invite.delete_expired()
    invites = await Invite.filter(expiration_date__gte=date.today(), group_id=group.id)
    return json([invite.to_dict() for invite in invites])


@groups.route("/<group_id:int>/invites", methods=["POST"], name="create_group_invite")
@protected()
@check_for_permission([UserGroupPermissionEnum.MANAGE_INVITES])
@atomic()
async def create_group_invite(request: Request, my_user: User, group: Group|None):
    if not group:
        return json({"error": "Group not found"}, status=404)
    data = filter_dict_by_keys(request.json, ["expiration_date"], True)
    invite = await Invite.create(group_id=group.id, code=Invite.generate_code(), **data)
    return json(invite.to_dict())


@groups.route("/<group_id:int>/events", methods=["GET"], name="get_all_events_for_group")
@protected()
@check_for_permission()
async def get_all_events_for_group(request: Request, my_user: User, group: Group|None):
    if not group:
        return json({"error": "Group not found"}, status=404)
    events = await Event.filter(group_id=group.id).prefetch_related(
        Prefetch("event_options", queryset=EventOption.all().prefetch_related(
            Prefetch("user_event_option_responses", queryset=UserEventOptionResponse.all().prefetch_related(
                "user_and_group"
            ))
        ))
    )
    await Event.update_state()
    return json([event.to_dict() for event in events])


@groups.route("/<group_id:int>/events", methods=["POST"], name="create_event_for_group")
@protected()
@check_for_permission([UserGroupPermissionEnum.MANAGE_EVENTS])
@atomic()
async def create_event_for_group(request: Request, my_user: User, group: Group|None):
    if not group:
        return json({"error": "Group not found"}, status=404)
    data = filter_dict_by_keys(request.json, ["title", "color", "description", "state", "vote_end_date"], True)
    event = await Event.create(group_id=group.id, **data)
    await event.send_embed(url=request.app.ctx.Config["App"]["URI"])
    return json(event.to_dict())


@groups.route("/<group_id:int>/votes", methods=["GET"], name="get_all_vote_for_group")
@protected()
@check_for_permission()
async def get_all_votes_for_group(request: Request, my_user: User, group: Group|None):
    if not group:
        return json({"error": "Group not found"}, status=404)

    votes = await Vote.filter(group_id=group.id).prefetch_related(
        Prefetch("vote_options", queryset=VoteOption.all().prefetch_related(
            Prefetch("user_vote_option_responses", queryset=UserVoteOptionResponse.all().prefetch_related(
                "user_and_group"
            ))
        ))
    )
    return json([vote.to_dict() for vote in votes])


@groups.route("/<group_id:int>/votes", methods=["POST"], name="create_vote_for_group")
@protected()
@check_for_permission([UserGroupPermissionEnum.MANAGE_VOTES])
@atomic()
async def create_vote_for_group(request: Request, my_user: User, group: Group|None):
    if not group:
        return json({"error": "Group not found"}, status=404)
    data = filter_dict_by_keys(request.json, ["title", "multi_select"], True)
    vote = await Vote.create(group_id=group.id, **data)
    await vote.send_embed(url=request.app.ctx.Config["App"]["URI"])
    return json(vote.to_dict())


@groups.route("/<group_id:int>/users", methods=["Get"], name="get_group_users")
@protected()
@check_for_permission()
@atomic()
async def get_group_users(request: Request, my_user: User, group: Group|None):
    
    if not group:
        return json({"error": f"Group not found"}, status=404)

    await group.fetch_related("users")

    return json([user.to_dict() for user in group.users])


@groups.route("/<group_id:int>/users/<user_id:int>", methods=["POST"], name="add_user_to_group")
@protected()
@check_for_permission([UserGroupPermissionEnum.MANAGE_USERS])
@atomic()
async def add_user_to_group(request: Request, my_user: User, group: Group|None, user: User|None):

    if not user:
        return json({"error": f"User not found"}, status=404)
    
    if not group:
        return json({"error": f"Group not found"}, status=404)

    user_group = await UserAndGroup.get_or_none(group=group, user=user)
    if user_group:
        return json({"error": f"User is already in the Group"}, status=400)

    user_group = await UserAndGroup.create(user=user, group=group)

    return json(user_group.to_dict(), status=201)


@groups.route("/<group_id:int>/users/<user_id:int>", methods=["DELETE"], name="remove_user_from_group")
@protected()
@check_for_permission([UserGroupPermissionEnum.MANAGE_USERS])
@atomic()
async def remove_user_from_group(request: Request, my_user: User, group: Group|None, user: User|None):
    if not user:
        return json({"error": f"User not found"}, status=404)
    
    if not group:
        return json({"error": f"Group not found"}, status=404)

    user_and_group = await UserAndGroup.get_or_none(group=group, user=user).prefetch_related("user_group_permissions")

    if user_and_group:
        if my_user.owner or my_user.id == user.id:
            await user_and_group.delete()
            return json({"message": f"User was from Group successfully removed"})
        my_user_and_group = await UserAndGroup.get_or_none(group=group, user=my_user).prefetch_related("user_group_permissions")
        if my_user_and_group:
            for permission in user_and_group.user_group_permissions:
                if permission.permission in [UserGroupPermissionEnum.ADMIN]: 
                    return json({"error": f"You are not allowed to access this enpoint."}, status=403)
            for permission in user_and_group.user_group_permissions:
                if permission.permission in [UserGroupPermissionEnum.MANAGE_USERS]:
                    for my_permission in my_user_and_group.user_group_permissions:
                        if my_permission.permission in [UserGroupPermissionEnum.ADMIN]:
                            await user_and_group.delete()
                            return json({"message": f"User was from Group successfully removed"})
            else:
                await user_and_group.delete()
                return json({"message": f"User was from Group successfully removed"})
        return json({"error": f"You are not allowed to access this enpoint."}, status=403)
    else:
        return json({"error": f"User is not in the Group"}, status=400)
    

@groups.route("/<group_id:int>/users/<user_id:int>/permissions", methods=["POST"], name="add_group_user_permission")
@protected()
@check_for_permission([UserGroupPermissionEnum.MANAGE_USERS])
@atomic()
async def add_group_user_permission(request: Request, my_user: User, group: Group|None, user: User|None):
    if not user:
        return json({"error": f"User not found"}, status=404)
    
    if not group:
        return json({"error": f"Group not found"}, status=404)
    
    if my_user.id == user.id and not my_user.owner:
        return json({"error": f"You are not allowed to access this enpoint."}, status=403)
    
    data = filter_dict_by_keys(request.json, ["permission"], True)
    data_permission = UserGroupPermissionEnum(data.get("permission"))

    user_and_group = await UserAndGroup.get_or_none(group=group, user=user).prefetch_related("user_group_permissions")

    if user_and_group:

        user_group_permission = await UserGroupPermission.get_or_none(user_and_group_id=user_and_group.id, permission=data_permission)
        if user_group_permission:
            return json({"error": f"User has permission allready"}, status=400)

        my_user_and_group = await UserAndGroup.get_or_none(group=group, user=my_user).prefetch_related("user_group_permissions")


        if my_user.owner:
            user_group_permission = await UserGroupPermission.create(user_and_group_id=user_and_group.id, permission=data_permission)
            return json(user_group_permission.to_dict())
        if my_user_and_group:
            if data_permission == UserGroupPermissionEnum.ADMIN:
                pass
            if data_permission == UserGroupPermissionEnum.MANAGE_USERS:
                for permission in my_user_and_group.user_group_permissions:
                    if permission.permission in [UserGroupPermissionEnum.ADMIN]: 
                        user_group_permission = await UserGroupPermission.create(user_and_group_id=user_and_group.id, permission=data_permission)
                        return json(user_group_permission.to_dict())
            else:
                for permission in my_user_and_group.user_group_permissions:
                    if permission.permission in [UserGroupPermissionEnum.ADMIN, UserGroupPermissionEnum.MANAGE_USERS]: 
                        user_group_permission = await UserGroupPermission.create(user_and_group_id=user_and_group.id, permission=data_permission)
                        return json(user_group_permission.to_dict())
        return json({"error": f"You are not allowed to access this enpoint."}, status=403)
    else:
        return json({"error": f"User is not in the Group"}, status=400)


@groups.route("/<group_id:int>/users/<user_id:int>/permissions", methods=["DELETE"], name="remove_group_user_permission")
@protected()
@check_for_permission([UserGroupPermissionEnum.MANAGE_USERS])
@atomic()
async def remove_group_user_permission(request: Request, my_user: User, group: Group|None, user: User|None):
    if not user:
        return json({"error": f"User not found"}, status=404)
    
    if not group:
        return json({"error": f"Group not found"}, status=404)
    
    if my_user.id == user.id and not my_user.owner:
        return json({"error": f"You are not allowed to access this enpoint."}, status=403)
    
    data = filter_dict_by_keys(request.json, ["permission"], True)
    data_permission = UserGroupPermissionEnum(data.get("permission"))

    user_and_group = await UserAndGroup.get_or_none(group=group, user=user).prefetch_related("user_group_permissions")

    if user_and_group:

        user_group_permission = await UserGroupPermission.get_or_none(user_and_group_id=user_and_group.id, permission=data_permission)
        if not user_group_permission:
            return json({"error": f"User doesnt have permission allready"}, status=400)

        my_user_and_group = await UserAndGroup.get_or_none(group=group, user=my_user).prefetch_related("user_group_permissions")


        if my_user.owner:
            await user_group_permission.delete()
            return json({"message": f"UserGroupPermission deleted successfully"})
        if my_user_and_group:
            if data_permission == UserGroupPermissionEnum.ADMIN:
                pass
            if data_permission == UserGroupPermissionEnum.MANAGE_USERS:
                for permission in my_user_and_group.user_group_permissions:
                    if permission.permission in [UserGroupPermissionEnum.ADMIN]: 
                        await user_group_permission.delete()
                        return json({"message": f"UserGroupPermission deleted successfully"})
            else:
                for permission in my_user_and_group.user_group_permissions:
                    if permission.permission in [UserGroupPermissionEnum.ADMIN, UserGroupPermissionEnum.MANAGE_USERS]: 
                        await user_group_permission.delete()
                        return json({"message": f"UserGroupPermission deleted successfully"})
        return json({"error": f"You are not allowed to access this enpoint."}, status=403)
    else:
        return json({"error": f"User is not in the Group"}, status=400)

@groups.route("/<group_id:int>/users/<user_id:int>/permissions", methods=["GET"], name="get_user_groups_permissions")
@protected()
@check_for_permission([UserGroupPermissionEnum.MANAGE_USERS])
async def get_user_groups_permissions(request: Request, my_user: User, group: Group|None, user: User|None):

    if not user:
        return json({"error": f"User not found"}, status=404)
    
    if not group:
        return json({"error": f"Group not found"}, status=404)
    

    user_and_group = await UserAndGroup.get_or_none(user_id= user.id, group_id=group.id).prefetch_related("user_group_permissions")
    if user_and_group:
        return json([user_group_permission.permission for user_group_permission in user_and_group.user_group_permissions])
    else:
        return json({"error": f"User is not in the Group"}, status=400)