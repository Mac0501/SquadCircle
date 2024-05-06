import { EventStateEnum } from "../utils/types";
import EventOption from "./EventOption";

class Event {
    id: number
    title: string;
    color: string;
    vote_end_date: string|null;
    created: Date;
    state: EventStateEnum;
    group_id: number;
    description: string|null;
    choosen_event_option_id: number|null;
    event_options: EventOption[]|null;

    constructor(id: number, title: string, color: string, vote_end_date: string|null, created:Date, state: EventStateEnum, group_id: number, description: string|null = null, choosen_event_option_id: number|null = null, event_options: EventOption[]|null = null) { // Updated constructor
        this.id = id;
        this.title = title;
        this.color = color;
        this.vote_end_date = vote_end_date;
        this.created = created;
        this.state = state;
        this.group_id = group_id;
        this.description = description;
        this.choosen_event_option_id = choosen_event_option_id;
        this.event_options = event_options;
    }

    static fromJson(json: any): Event {
        const event_options = json.event_options ? json.event_options.map((eventOptionData: any) => EventOption.fromJson(eventOptionData)) : null; // Check if event_options exists in JSON
        return new Event(
            json.id,
            json.title,
            json.color,
            json.vote_end_date,
            new Date(json.created),
            json.state,
            json.group_id,
            json.description,
            json.choosen_event_option_id,
            event_options,
        );
    }

    get choosen_event_option(): EventOption | null {
        if (this.event_options && this.choosen_event_option_id) {
            return this.event_options.find(option => option.id === this.choosen_event_option_id) || null;
        }
        return null;
    }

    static async get_event(id: number): Promise<Event | null> {
        try {
            const response = await fetch(`/api/events/${id}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const eventData = await response.json();
                return Event.fromJson(eventData);
            } else if (response.status === 401) {
                console.log("User is unauthorized. Logging out...");
                window.location.href = "/login";
                return null;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error fetching event:', error);
            return null;
        }
    }
    

    // static async get_events(): Promise<Event[] | null> {
    //     try {
    //         const response = await fetch('/api/events', {
    //             method: 'GET',
    //             credentials: 'include',
    //             headers: {
    //                 'Content-Type': 'application/json'
    //             }
    //         });
    //         if (response.ok) {
    //             const eventsData = await response.json();
    //             return eventsData.map((eventData: any) => new Event(eventData.id, eventData.title, eventData.color, eventData.state, eventData.group_id, eventData.description, eventData.choosen_event_option_id));
    //         } else {
    //             return null;
    //         }
    //     } catch (error) {
    //         console.error('Error fetching events:', error);
    //         return null;
    //     }
    // }

    async delete(): Promise<boolean> {
        try {
            const response = await fetch(`/api/events/${this.id}`, {
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
            console.error('Error deleting event:', error);
            return false;
        }
    }

    async update(data: EventUpdateData): Promise<boolean> {
        try {
            const response = await fetch(`/api/events/${this.id}`, {
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
            } else if (response.status === 401) {
                console.log("User is unauthorized. Logging out...");
                window.location.href = "/login";
                return response.ok;
            }
            
            return response.ok
        } catch (error) {
            console.error('Error updating event:', error);
            return false;
        }
    }

    async get_event_options_for_event(): Promise<EventOption[] | null> {
        try {
            const response = await fetch(`/api/events/${this.id}/event_options`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const event_optionsData = await response.json();
                return this.event_options = event_optionsData.map((event_optionData: any) => EventOption.fromJson(event_optionData));
            } else if (response.status === 401) {
                console.log("User is unauthorized. Logging out...");
                window.location.href = "/login";
                return null;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error fetching event options for event:', error);
            return null;
        }
    }
    
    async create_event_option_for_event(date: string, start_time: string, end_time: string | null = null,): Promise<EventOption | null> {
        try {
            const response = await fetch(`/api/events/${this.id}/event_options`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ "date": date, "start_time": start_time, "end_time": end_time })
            });
            if (response.ok) {
                const event_optionData = await response.json();
                const eventOption = EventOption.fromJson(event_optionData);
                if (eventOption && this.event_options) {
                    this.event_options.push(eventOption);
                }
                return eventOption;
            } else if (response.status === 401) {
                console.log("User is unauthorized. Logging out...");
                window.location.href = "/login";
                return null;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error creating event options for event:', error);
            return null;
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