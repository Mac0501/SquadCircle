import UserAndGroup from "./UserAndGroup";
import Event from "./Event";

class Message {
    id: number
    content: string;
    sent_at: string; // Assuming ISO8601 format YYYY-MM-DD
    event_id: number;
    event: Event | null;
    user_and_group_id: number;
    user_and_group: UserAndGroup | null;

    static readonly content_length = 200;

    constructor(id: number, content: string, sent_at: string, event_id: number, user_and_group_id: number, user_and_group: UserAndGroup|null = null, event: Event|null = null) {
        this.id = id;
        this.content = content;
        this.sent_at = sent_at;
        this.event_id = event_id;
        this.user_and_group_id = user_and_group_id;
        this.user_and_group = user_and_group;
        this.event = event;
    }

    static fromJson(json: any): Message {
        return new Message(
            json.id,
            json.content,
            json.sent_at,
            json.event_id,
            json.user_and_group_id,
            json.user_and_group ? UserAndGroup.fromJson(json.user_and_group) : null,
            json.event ? Event.fromJson(json.event) : null
        );
    }

    static async get_message(id: number): Promise<Message | null> {
        try {
            const response = await fetch(`/api/messages/${id}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const messageData = await response.json();
                return Message.fromJson(messageData);
            } else if (response.status === 401) {
                console.log("User is unauthorized. Logging out...");
                window.location.href = "/login";
                return null;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error fetching message:', error);
            return null;
        }
    }

    async delete(): Promise<boolean> {
        try {
            const response = await fetch(`/api/messages/${this.id}`, {
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
            console.error('Error deleting message:', error);
            return false;
        }
    }
}

export default Message;