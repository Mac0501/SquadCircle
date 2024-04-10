import UserVoteOptionResponse from "./UserVoteOptionResponse";

class VoteOption {
    id: number;
    title: string;
    vote_id: number;


    constructor(id: number, title: string, vote_id: number) {
        this.id = id;
        this.title = title;
        this.vote_id = vote_id;
    }

    static async get_vote_option(id: number): Promise<VoteOption | null> {
        try {
            const response = await fetch(`/api/vote_options/${id}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const vote_optionData = await response.json();
                return new VoteOption(vote_optionData.id, vote_optionData.title, vote_optionData.vote_id);
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error fetching vote_option:', error);
            return null;
        }
    }

    async delete(): Promise<boolean> {
        try {
            const response = await fetch(`/api/vote_options/${this.id}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return response.ok;
        } catch (error) {
            console.error('Error deleting vote_option:', error);
            return false;
        }
    }

    async update(title: string): Promise<boolean> {
        try {
            const response = await fetch(`/api/vote_options/${this.id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(title)
            });
            if (response.ok) {
                const vote_optionData = await response.json();
                this.title = vote_optionData.date;
            }
            return response.ok
        } catch (error) {
            console.error('Error updating vote_option:', error);
            return false;
        }
    }

    async get_user_vote_option_responses(): Promise<UserVoteOptionResponse[] | null> {
        try {
            const response = await fetch(`/api/vote_options/${this.id}/user_vote_option_response`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const responseData = await response.json();
                return responseData.map((responseData: any) => new UserVoteOptionResponse(responseData.id, responseData.vote_option_id, responseData.user_and_group_id));
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error fetching user vote option responses:', error);
            return null;
        }
    }

    async create_user_vote_option_response(): Promise<UserVoteOptionResponse | null> {
        try {
            const response = await fetch(`/api/vote_options/${this.id}/user_vote_option_response`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const responseData = await response.json();
                return new UserVoteOptionResponse(responseData.id, responseData.vote_option_id, responseData.user_and_group_id);
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error creating user vote option response:', error);
            return null;
        }
    }

    async delete_user_vote_option_response(): Promise<boolean> {
        try {
            const response = await fetch(`/api/vote_options/${this.id}/user_vote_option_response`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            return response.ok;
        } catch (error) {
            console.error('Error creating user vote option response:', error);
            return false;
        }
    }

    async toggel_user_vote_option_response(): Promise<boolean> {
        try {
            const response = await fetch(`/api/vote_options/${this.id}/user_vote_option_response`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return response.ok;
        } catch (error) {
            console.error('Error creating user vote option response:', error);
            return false;
        }
    }
}

export default VoteOption;