import { EventStateEnum } from "../utils/types";

class Event {
    id: number
    title: string;
    color: string;
    state: EventStateEnum;
    group_id: number;
    description: string|null;
    choosen_event_option_id: number|null;

    constructor(id: number, title: string, color: string, state: EventStateEnum, group_id: number, description: string|null = null, choosen_event_option_id: number|null = null) {
        this.id = id;
        this.title = title;
        this.color = color;
        this.state = state;
        this.group_id = group_id;
        this.description = description;
        this.choosen_event_option_id = choosen_event_option_id;
    }

    static async get_event(id: number): Promise<Event | null> {
        try {
            const response = await fetch(`/events/${id}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const eventData = await response.json();
                return new Event(eventData.id, eventData.title, eventData.color, eventData.state, eventData.group_id, eventData.description, eventData.choosen_event_option_id);
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error fetching event:', error);
            return null;
        }
    }

    static async get_events(): Promise<Event[] | null> {
        try {
            const response = await fetch('/events', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const eventsData = await response.json();
                return eventsData.map((eventData: any) => new Event(eventData.id, eventData.title, eventData.color, eventData.state, eventData.group_id, eventData.description, eventData.choosen_event_option_id));
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error fetching events:', error);
            return null;
        }
    }

    async delete(): Promise<boolean> {
        try {
            const response = await fetch(`/events/${this.id}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return response.ok;
        } catch (error) {
            console.error('Error deleting event:', error);
            return false;
        }
    }

    async update(data: EventUpdateData): Promise<boolean> {
        try {
            const response = await fetch(`/events/${this.id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (response.ok) {
                const eventData = await response.json();
                this.title = eventData.title;
                this.color = eventData.color;
                this.state = eventData.state;
                this.description = eventData.description;
                this.choosen_event_option_id = eventData.choosen_event_option_id;
            }
            return response.ok
        } catch (error) {
            console.error('Error updating event:', error);
            return false;
        }
    }
}

type EventUpdateData = {
    title?: string;
    color?: string;
    state?: EventStateEnum;
    description?: string|null;
};

export default Event;