from functools import wraps
from typing import List
from sanic import json
from sanic.request import Request

from app.db.models import User, UserAndGroup
from app.utils.types import UserGroupPermissionEnum

def is_owner(func):
    @wraps(func)
    async def wrapper(request: Request, my_user: User, *args, **kwargs):
        if my_user.owner:
            return await func(request, my_user, *args, **kwargs)
        return json({"error": f"You are not allowed to access this enpoint."}, status=403)

    return wrapper

def check_for_permission(permissions: List[UserGroupPermissionEnum] = None):
    def decorator(func):
        async def wrapper(request: Request, my_user: User, *args, **kwargs):
            if my_user.owner:
                return await func(request, my_user, *args, **kwargs)
        
            first_arg = args[0] if args else None
            first_kwarg = next(iter(kwargs.values()), None) if kwargs else None
            group_id = await first_arg.get_group_id() if first_arg else await first_kwarg.get_group_id() if first_kwarg else None

            user_and_group = await UserAndGroup.get_or_none(user_id=my_user.id, group_id=group_id).prefetch_related("user_group_permissions")
            if user_and_group:
                if permissions is None:
                    return await func(request, my_user, *args, **kwargs)
                
                permissions_list = permissions.copy() if permissions else []
                permissions_list.append(UserGroupPermissionEnum.ADMIN)
                for my_permission in user_and_group.user_group_permissions:
                    if my_permission.permission in permissions_list:
                        return await func(request, my_user, *args, **kwargs)
            return json({"error": f"You are not allowed to access this endpoint."}, status=403)
        return wrapper
    return decorator