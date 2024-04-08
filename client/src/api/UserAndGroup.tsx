class UserAndGroup {
    id: number
    user_id: number;
    group_id: number;

    constructor(id: number, user_id: number, group_id: number) {
        this.id = id;
        this.user_id = user_id;
        this.group_id = group_id;
    }

    static async get_user_and_group(id: number): Promise<UserAndGroup | null> {
        try {
            const response = await fetch(`/api/user_and_group/${id}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const user_and_groupData = await response.json();
                return new UserAndGroup(user_and_groupData.id, user_and_groupData.user_id, user_and_groupData.group_id);
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error fetching user_and_group:', error);
            return null;
        }
    }
}

export default UserAndGroup