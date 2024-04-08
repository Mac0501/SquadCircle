import { EventOptionResponseEnum } from "../utils/types";

class UserEventOptionResponse {
    id: number;
    response: EventOptionResponseEnum;
    event_option_id: number;
    user_and_group_id: number;


    constructor(id: number, response: EventOptionResponseEnum, event_option_id: number, user_and_group_id: number) {
        this.id = id;
        this.response = response;
        this.event_option_id = event_option_id;
        this.user_and_group_id = user_and_group_id;
    }

    static async get_user_event_option_response(id: number): Promise<UserEventOptionResponse | null> {
        try {
            const response = await fetch(`/api/user_event_option_response/${id}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const responseData = await response.json();
                return new UserEventOptionResponse(responseData.id, responseData.response, responseData.event_option_id, responseData.user_and_group_id);
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error fetching user event option response:', error);
            return null;
        }
    }

    async update(response: EventOptionResponseEnum): Promise<boolean> {
        try {
            const fetch_response = await fetch(`/api/user_event_option_response/${this.id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ response })
            });
            if (fetch_response.ok) {
                const responseData = await fetch_response.json();
                this.response = responseData.response;
            }
            return fetch_response.ok;
        } catch (error) {
            console.error('Error updating user event option response:', error);
            return false;
        }
    }
}

export default UserEventOptionResponse;