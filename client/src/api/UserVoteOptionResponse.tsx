import UserAndGroup from "./UserAndGroup";

class UserVoteOptionResponse {
    id: number;
    vote_option_id: number;
    user_and_group_id: number;
    user_and_group: UserAndGroup | null;


    constructor(id: number, vote_option_id: number, user_and_group_id: number, user_and_group: UserAndGroup | null) {
        this.id = id;
        this.vote_option_id = vote_option_id;
        this.user_and_group_id = user_and_group_id;
        this.user_and_group = user_and_group;
    }

    static fromJson(json: any): UserVoteOptionResponse {
        return new UserVoteOptionResponse(
            json.id,
            json.vote_option_id,
            json.user_and_group_id,
            json.user_and_group ? UserAndGroup.fromJson(json.user_and_group) : null
        );
    }

    static async get_user_vote_option_response(id: number): Promise<UserVoteOptionResponse | null> {
        try {
            const response = await fetch(`/api/user_vote_option_response/${id}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const responseData = await response.json();
                return UserVoteOptionResponse.fromJson(responseData);
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error fetching user vote option response:', error);
            return null;
        }
    }

    async delete(): Promise<boolean> {
        try {
            const fetch_response = await fetch(`/api/user_vote_option_response/${this.id}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return fetch_response.ok;
        } catch (error) {
            console.error('Error updating user vote option response:', error);
            return false;
        }
    }
}

export default UserVoteOptionResponse;