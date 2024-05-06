import Group from "./Group";

class User {
    id: number
    name: string;
    owner: boolean;
    avatar: string;

    constructor(id: number, name: string, owner: boolean) {
        this.id = id;
        this.name = name;
        this.owner = owner;
        this.avatar = `/api/users/${id}/avatar`;
    }

    static fromJson(json: any): User {
        return new User(json.id, json.name, json.owner);
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
                return User.fromJson(userData);
            } else if (response.status === 401) {
                console.log("User is unauthorized. Logging out...");
                window.location.href = "/login";
                return null;
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
                return usersData.map((userData: any) => User.fromJson(userData));
            } else if (response.status === 401) {
                console.log("User is unauthorized. Logging out...");
                window.location.href = "/login";
                return null;
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
            if (response.status === 401) {
                console.log("User is unauthorized. Logging out...");
                window.location.href = "/login";
                return response.ok;
            }
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
                return groupsData.map((groupData: any) => Group.fromJson(groupData));
            } else if (response.status === 401) {
                console.log("User is unauthorized. Logging out...");
                window.location.href = "/login";
                return null;
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