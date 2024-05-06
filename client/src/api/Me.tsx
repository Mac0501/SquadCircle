import Group from "./Group";
import Event from "./Event";
import UserGroupPermission from "./UserGroupPermission";
import { UserGroupPermissionEnum } from "../utils/types";
import Vote from "./Vote";

class Me {
    id: number;
    name: string;
    owner: boolean;
    avatar: string;

    constructor(id: number, name: string, owner: boolean) {
        this.id = id;
        this.name = name;
        this.owner = owner;
        this.avatar = `/api/users/me/avatar`;
    }

    static async get_me(): Promise<Me | null> {
        try {
            const response = await fetch(`/api/users/me`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const meData = await response.json();
                return new Me(meData.id, meData.name, meData.owner);
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error fetching current user:', error);
            return null;
        }
    }

    async update_me(name: string|null = null, password:string|null = null): Promise<boolean> {
        const data: any = {};

        if (name !== null) {
            data.name = name;
        }
        if (password !== null) {
            data.password = password;
        }
        try {
            const response = await fetch(`/api/users/me`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            const meData = await response.json();
            if(response.ok){
                this.id = meData.id;
                this.name = meData.name;
                this.owner = meData.owner;
            }
            return response.ok;
        } catch (error) {
            console.error('Error updating current user:', error);
            return false;
        }
    }

    static async get_me_groups(): Promise<Group[]> {
        try {
            const response = await fetch(`/api/users/me/groups`, {
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
                return [];
            }
        } catch (error) {
            console.error('Error fetching groups for current user:', error);
            return [];
        }
    }

    static async remove_me_from_group(group: Group): Promise<boolean> {
        try {
            const response = await fetch(`/api/users/me/groups/${group.id}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return response.ok;
        } catch (error) {
            console.error('Error removing current user from group:', error);
            return false;
        }
    }

    static async get_me_groups_permissions(group: Group): Promise<UserGroupPermission[] | null> {
        try {
            const response = await fetch(`/api/users/me/groups/${group.id}/permissions`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const permissionsData = await response.json();
                return permissionsData.map((permissionData: any) => new UserGroupPermission(permissionData.id, permissionData.user_and_group_id, permissionData.permission));
            } else if (response.status === 401) {
                console.log("User is unauthorized. Logging out...");
                window.location.href = "/login";
                return null;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error fetching permissions for current user in group:', error);
            return null;
        }
    }

    static async get_avatar(): Promise<Blob | null> {
        try {
            const response = await fetch(`/api/users/me/avatar`, {
                method: 'GET',
                credentials: 'include',
            });
            if (response.ok) {
                return await response.blob();
            } else if (response.status === 401) {
                console.log("User is unauthorized. Logging out...");
                window.location.href = "/login";
                return null;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error fetching avatar:', error);
            return null;
        }
    }

    static async upload_avatar(avatar: File): Promise<boolean> {
        try {
            const formData = new FormData();
            formData.append('avatar', avatar);

            const response = await fetch(`/api/users/me/avatar`, {
                method: 'POST',
                credentials: 'include',
                body: formData,
            });
            if (response.status === 401) {
                console.log("User is unauthorized. Logging out...");
                window.location.href = "/login";
                return response.ok;
            }
            return response.ok;
        } catch (error) {
            console.error('Error uploading avatar:', error);
            return false;
        }
    }

    static async delete_avatar(): Promise<boolean> {
        try {
            const response = await fetch(`/api/users/me/avatar`, {
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
            console.error('Error deleting avatar:', error);
            return false;
        }
    }

    static async get_me_events(): Promise<UserEventsResponse | null> {
        try {
            const response = await fetch(`/api/users/me/events`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const user_eventsData = await response.json();
                const { incomplete_events, other_events } = user_eventsData;
                const incompleteEventsArray: Event[] = incomplete_events.map((eventData: any) => Event.fromJson(eventData));
                const otherEventsArray: Event[] = other_events.map((eventData: any) => Event.fromJson(eventData));
                return { incomplete_events: incompleteEventsArray, other_events: otherEventsArray };
            } else if (response.status === 401) {
                console.log("User is unauthorized. Logging out...");
                window.location.href = "/login";
                return null;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error fetching events:', error);
            return null;
        }
    }

    static async get_me_group_events(group_id: number, allEvents: Event[]): Promise<{ meGroupEvents: Event[] | null, meGroupCalender: Event[] | null }> {
        try {
            const response = await fetch(`/api/users/me/group/${group_id}/events`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const user_eventsData = await response.json();
                const { incomplete_events, other_events } = user_eventsData;
    
                // Filter and match incomplete events
                const incompleteEventsArray: Event[] = incomplete_events.map((eventData: any) => {
                    const matchedEvent = allEvents.find(event => event.id === eventData.id);
                    if (matchedEvent) return matchedEvent;
                    return null;
                }).filter(Boolean);
    
                // Filter and match other events
                const otherEventsArray: Event[] = other_events.map((eventData: any) => {
                    const matchedEvent = allEvents.find(event => event.id === eventData.event_id);
                    if (matchedEvent) return matchedEvent;
                    return null;
                }).filter(Boolean);
    
                return { meGroupEvents: incompleteEventsArray, meGroupCalender: otherEventsArray };
            } else if (response.status === 401) {
                console.log("User is unauthorized. Logging out...");
                window.location.href = "/login";
                return { meGroupEvents: null, meGroupCalender: null};
            } else {
                return { meGroupEvents: null, meGroupCalender: null };
            }
        } catch (error) {
            console.error('Error fetching events for group:', error);
            return { meGroupEvents: null, meGroupCalender: null };
        }
    }
    

    static async get_me_votes(): Promise<UserVotesResponse | null> {
        try {
            const response = await fetch(`/api/users/me/votes`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const user_votesData = await response.json();
                const { incomplete_votes, other_votes } = user_votesData;
                const incompleteVotesArray: Vote[] = incomplete_votes.map((voteData: any) => new Vote(voteData.id, voteData.title, voteData.multi_select, voteData.group_id, voteData.description));
                const otherVotesArray: Vote[] = other_votes.map((voteData: any) => Vote.fromJson(voteData));
                return { incomplete_votes: incompleteVotesArray, other_votes: otherVotesArray };
            } else if (response.status === 401) {
                console.log("User is unauthorized. Logging out...");
                window.location.href = "/login";
                return null;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error fetching votes:', error);
            return null;
        }
    }

    static async get_me_group_votes(group_id: number, allVotes: Vote[]): Promise<Vote[] | null> {
        try {
            const response = await fetch(`/api/users/me/group/${group_id}/votes`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const user_votesData = await response.json();
                const { incomplete_votes } = user_votesData;
    
                // Filter and match incomplete votes
                const incompleteVotesArray: Vote[] = incomplete_votes.map((voteData: any) => {
                    const matchedVote = allVotes.find(vote => vote.id === voteData.id);
                    return matchedVote;
                }).filter(Boolean);
    
                return incompleteVotesArray;
            } else if (response.status === 401) {
                console.log("User is unauthorized. Logging out...");
                window.location.href = "/login";
                return null;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error fetching votes for group:', error);
            return null;
        }
    }

    static async get_group_permissions(group_id: number): Promise<UserGroupPermissionEnum[]> {
        try {
            const response = await fetch(`/api/users/me/group/${group_id}/permissions`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
            });
            if (response.ok) {
                return await response.json();
            } else if (response.status === 401) {
                console.log("User is unauthorized. Logging out...");
                window.location.href = "/login";
                return [];
            } else {
                return [];
            }
        } catch (error) {
            console.error('Error removing permission:', error);
            return [];
        }
    }
}


interface UserEventsResponse  {
    incomplete_events: Event[];
    other_events: Event[];
}

interface UserVotesResponse  {
    incomplete_votes: Vote[];
    other_votes: Vote[];
}

export default Me;
