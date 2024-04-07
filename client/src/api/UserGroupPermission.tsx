import { UserGroupPermissionEnum } from "../utils/types";

class UserGroupPermission {
    id: number
    user_and_group_id: number;
    permission: UserGroupPermissionEnum;

    constructor(id: number, user_and_group_id: number, permission: UserGroupPermissionEnum) {
        this.id = id;
        this.user_and_group_id = user_and_group_id;
        this.permission = permission;
    }
}

export default UserGroupPermission