import { EventOptionResponseEnum } from "../utils/types";
import UserEventOptionResponse from "./UserEventOptionResponse";

class EventOption {
    id: number;
    date: string; // Assuming ISO8601 format YYYY-MM-DD
    start_time: string; // Assuming HH:MM:SS format
    end_time: string | null; // Assuming HH:MM:SS format or null
    event_id: number;
    user_event_option_responses: UserEventOptionResponse[] | null;

    constructor(id: number, date: string, start_time: string, end_time: string | null = null, event_id: number, user_event_option_responses: UserEventOptionResponse[] | null = null) {
        this.id = id;
        this.date = date;
        this.start_time = start_time;
        this.end_time = end_time;
        this.event_id = event_id;
        this.user_event_option_responses = user_event_option_responses;
    }

    static fromJson(json: any): EventOption {
        return new EventOption(
            json.id,
            json.date,
            json.start_time,
            json.end_time,
            json.event_id,
            json.user_event_option_responses ? json.user_event_option_responses.map((responseData: any) => UserEventOptionResponse.fromJson(responseData)) : null
        );
    }

    static async get_event_option(id: number): Promise<EventOption | null> {
        try {
            const response = await fetch(`/api/event_options/${id}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const event_optionData = await response.json();
                return new EventOption(event_optionData.id, event_optionData.date, event_optionData.start_time, event_optionData.end_time, event_optionData.event_id);
            } else if (response.status === 401) {
                console.log("User is unauthorized. Logging out...");
                window.location.href = "/login";
                return null;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error fetching event_option:', error);
            return null;
        }
    }

    async delete(): Promise<boolean> {
        try {
            const response = await fetch(`/api/event_options/${this.id}`, {
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
            console.error('Error deleting event_option:', error);
            return false;
        }
    }

    async update(data: EventOptionUpdateData): Promise<boolean> {
        try {
            const response = await fetch(`/api/event_options/${this.id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (response.ok) {
                const event_optionData = await response.json();
                this.date = event_optionData.date;
                this.start_time = event_optionData.start_time;
                this.end_time = event_optionData.end_time;
            } else if (response.status === 401) {
                console.log("User is unauthorized. Logging out...");
                window.location.href = "/login";
                return response.ok;
            }
            return response.ok
        } catch (error) {
            console.error('Error updating event_option:', error);
            return false;
        }
    }

    async set_for_event(): Promise<boolean> {
        try {
            const response = await fetch(`/api/event_options/${this.id}/set_for_event`, {
                method: 'PUT',
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
            console.error('Error setting event option for event:', error);
            return false;
        }
    }

    async get_user_event_option_responses(): Promise<UserEventOptionResponse[] | null> {
        try {
            const response = await fetch(`/api/event_options/${this.id}/user_event_option_response`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const responseData = await response.json();
                return responseData.map((responseData: any) => UserEventOptionResponse.fromJson(responseData));
            } else if (response.status === 401) {
                console.log("User is unauthorized. Logging out...");
                window.location.href = "/login";
                return null;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error fetching user event option responses:', error);
            return null;
        }
    }

    async create_user_event_option_response(response: EventOptionResponseEnum, reason: string|null = null): Promise<UserEventOptionResponse | null> {
        try {
            const fetch_response = await fetch(`/api/event_options/${this.id}/user_event_option_response`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ response, reason })
            });
            if (fetch_response.ok) {
                const responseData = await fetch_response.json();
                return UserEventOptionResponse.fromJson(responseData);
            } else if (fetch_response.status === 401) {
                console.log("User is unauthorized. Logging out...");
                window.location.href = "/login";
                return null;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error creating user event option response:', error);
            return null;
        }
    }
}

type EventOptionUpdateData = {
    date?: string; // Assuming ISO8601 format YYYY-MM-DD
    start_time?: string; // Assuming HH:MM:SS format
    end_time?: string | null; // Assuming HH:MM:SS format or null
};

export default EventOption;