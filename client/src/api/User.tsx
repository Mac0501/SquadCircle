import Group from "./Group";

class User {
    id: number
    name: string;
    owner: boolean;

    constructor(id: number, name: string, owner: boolean) {
        this.id = id;
        this.name = name;
        this.owner = owner;
    }

    static async get_user(id: number): Promise<User | null> {
        try {
            const response = await fetch(`/api/users/${id}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const userData = await response.json();
                return new User(userData.id, userData.name, userData.owner);
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error fetching user:', error);
            return null;
        }
    }

    static async get_users(): Promise<User[] | null> {
        try {
            const response = await fetch('/api/users', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const usersData = await response.json();
                return usersData.map((userData: any) => new User(userData.id, userData.name, userData.owner));
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            return null;
        }
    }

    async delete(): Promise<boolean> {
        try {
            const response = await fetch(`/api/users/${this.id}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return response.ok;
        } catch (error) {
            console.error('Error deleting user:', error);
            return false;
        }
    }

    async get_groups(): Promise<Group[] | null> {
        try {
            const response = await fetch(`/api/users/${this.id}/groups`, {
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
            console.error('Error fetching user groups:', error);
            return null;
        }
    }
}

export default User;