from sanic import Blueprint
from sanic_jwt import protected
from sanic.request import Request
from sanic.response import json
from tortoise.transactions import atomic
from app.db.models import Event, Group, Invite, User, UserAndGroup, UserGroupPermission
from app.utils.decorators import check_for_permission, is_owner
from app.utils.tools import filter_dict_by_keys
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
    data = filter_dict_by_keys(request.json, ["name", "description"], True)
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
    data = filter_dict_by_keys(request.json, ["name", "description"])
    if group:
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
    await group.fetch_related("invites")
    return json([invite.to_dict() for invite in group.invites])


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
    events = await Event.filter(group_id=group.id)
    return json([event.to_dict() for event in events])


@groups.route("/<group_id:int>/events", methods=["POST"], name="create_event_for_group")
@protected()
@check_for_permission([UserGroupPermissionEnum.MANAGE_EVENTS])
@atomic()
async def create_event_for_group(request: Request, my_user: User, group: Group|None):
    if not group:
        return json({"error": "Group not found"}, status=404)
    data = filter_dict_by_keys(request.json, ["title", "color", "description", "state"], True)
    event = await Event.create(group_id=group.id, **data)
    return json(event.to_dict())

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
    
    if my_user.id == user.id:
        return json({"error": f"You are not allowed to access this enpoint."}, status=403)
    
    data = filter_dict_by_keys(request.json, ["permission"], True)
    data_permission = UserGroupPermissionEnum(data.get("permission"))

    user_and_group = await UserAndGroup.get_or_none(group=group, user=user).prefetch_related("user_group_permissions")

    user_group_permission = await UserGroupPermission.get_or_none(user_and_group_id=user_and_group.id, permission=data_permission)
    if user_group_permission:
        return json({"error": f"User has permission allready"}, status=400)

    my_user_and_group = await UserAndGroup.get_or_none(group=group, user=my_user).prefetch_related("user_group_permissions")

    if user_and_group:
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
    
    if my_user.id == user.id:
        return json({"error": f"You are not allowed to access this enpoint."}, status=403)
    
    data = filter_dict_by_keys(request.json, ["permission"], True)
    data_permission = UserGroupPermissionEnum(data.get("permission"))

    user_and_group = await UserAndGroup.get_or_none(group=group, user=user).prefetch_related("user_group_permissions")

    user_group_permission = await UserGroupPermission.get_or_none(user_and_group_id=user_and_group.id, permission=data_permission)
    if not user_group_permission:
        return json({"error": f"User doesnt have permission allready"}, status=400)

    my_user_and_group = await UserAndGroup.get_or_none(group=group, user=my_user).prefetch_related("user_group_permissions")

    if user_and_group:
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