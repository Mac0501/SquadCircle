import Group from "./Group";
import UserGroupPermission from "./UserGroupPermission";

class Me {
    id: number;
    name: string;
    owner: boolean;

    constructor(id: number, name: string, owner: boolean) {
        this.id = id;
        this.name = name;
        this.owner = owner;
    }

    static async get_me(): Promise<Me | null> {
        try {
            const response = await fetch(`/api/users/me`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const meData = await response.json();
                return new Me(meData.id, meData.name, meData.owner);
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error fetching current user:', error);
            return null;
        }
    }

    static async update_me(name: string|null = null, password:string|null = null): Promise<boolean> {
        const data: any = {};

        if (name !== null) {
            data.name = name;
        }
        if (password !== null) {
            data.password = password;
        }
        try {
            const response = await fetch(`/api/users/me`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (response.ok && this !== undefined) {
                const meData = await response.json();
                const updatedMe = new Me(meData.id, meData.name, meData.owner);
                // Update properties of the current instance
                Object.assign(this, updatedMe);
            }
            return response.ok;
        } catch (error) {
            console.error('Error updating current user:', error);
            return false;
        }
    }

    static async get_me_groups(): Promise<Group[] | null> {
        try {
            const response = await fetch(`/api/users/me/groups`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const groupsData = await response.json();
                return groupsData.map((groupData: any) => new Group(groupData.id, groupData.name, groupData.description));
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error fetching groups for current user:', error);
            return null;
        }
    }

    static async remove_me_from_group(group: Group): Promise<boolean> {
        try {
            const response = await fetch(`/api/users/me/groups/${group.id}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return response.ok;
        } catch (error) {
            console.error('Error removing current user from group:', error);
            return false;
        }
    }

    static async get_me_groups_permissions(group: Group): Promise<UserGroupPermission[] | null> {
        try {
            const response = await fetch(`/api/users/me/groups/${group.id}/permissions`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const permissionsData = await response.json();
                return permissionsData.map((permissionData: any) => new UserGroupPermission(permissionData.id, permissionData.user_and_group_id, permissionData.permission));
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error fetching permissions for current user in group:', error);
            return null;
        }
    }

    static async get_avatar(): Promise<Blob | null> {
        try {
            const response = await fetch(`/api/users/me/avatar`, {
                method: 'GET',
                credentials: 'include',
            });
            if (response.ok) {
                return await response.blob();
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error fetching avatar:', error);
            return null;
        }
    }

    static async upload_avatar(avatar: File): Promise<boolean> {
        try {
            const formData = new FormData();
            formData.append('avatar', avatar);

            const response = await fetch(`/api/users/me/avatar`, {
                method: 'POST',
                credentials: 'include',
                body: formData,
            });
            return response.ok;
        } catch (error) {
            console.error('Error uploading avatar:', error);
            return false;
        }
    }
}

export default Me;
