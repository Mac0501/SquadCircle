import { EventStateEnum, UserGroupPermissionEnum } from "../utils/types";
import Invite from "./Invites";
import User from "./User";
import UserAndGroup from "./UserAndGroup";
import UserGroupPermission from "./UserGroupPermission";
import Event from "./Event";
import Vote from "./Vote";
import { message } from "antd";

class Group {
    id: number;
    name: string;
    description: string | null;
    events: Event[] | null;
    votes: Vote[] | null;

    constructor(id: number, name: string, description: string | null = null, events: Event[] | null = null, votes: Vote[] | null = null) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.events = events;
        this.votes = votes;
    }

    static fromJson(json: any): Group {
        const events = json.events ? json.events.map((eventData: any) => Event.fromJson(eventData)) : null;
        const votes = json.votes ? json.votes.map((voteData: any) => Vote.fromJson(voteData)) : null;
        return new Group(json.id, json.name, json.description, events, votes);
    }

    static async get_group(id: number): Promise<Group | null> {
        try {
            const response = await fetch(`/api/goups/${id}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const groupData = await response.json();
                return Group.fromJson(groupData);
            } else if (response.status === 401) {
                console.log("User is unauthorized. Logging out...");
                window.location.href = "/login";
                return null;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error fetching group:', error);
            return null;
        }
    }

    static async get_groups(): Promise<Group[] | null> {
        try {
            const response = await fetch('/api/groups', {
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
            console.error('Error fetching groups:', error);
            return null;
        }
    }

    async delete(): Promise<boolean> {
        try {
            const response = await fetch(`/api/groups/${this.id}`, {
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
            console.error('Error deleting group:', error);
            return false;
        }
    }

    async update(name?:string, description?:string|null): Promise<boolean> {
        try {

            const data: { name?: string; description?: string|null } = {};

            if (name !== undefined && name !== '') {
                data.name = name;
            }

            if (description !== undefined && description !== '') {
                data.description = description;
            }

            const response = await fetch(`/api/groups/${this.id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (response.ok) {
                const groupData = await response.json();
                this.name = groupData.name;
                this.description = groupData.description;;
            } else if (response.status === 400) {
                const errorMessage = await response.json();
                message.error(errorMessage.error)
            } else if (response.status === 401) {
                console.log("User is unauthorized. Logging out...");
                window.location.href = "/login";
                return response.ok;
            }
            return response.ok;
        } catch (error) {
            console.error('Error updating group:', error);
            return false;
        }
    }

    static async create(name: string, description: string | null = null): Promise<Group | null> {
        try {
            const response = await fetch('/api/groups', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, description })
            });
            if (response.ok) {
                const groupData = await response.json();
                return new Group(groupData.id, groupData.name, groupData.description);
            } else if (response.status === 401) {
                console.log("User is unauthorized. Logging out...");
                window.location.href = "/login";
                return null;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error creating group:', error);
            return null;
        }
    }

    async get_invites(): Promise<Invite[] | null> {
        try {
            const response = await fetch(`/api/groups/${this.id}/invites`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const invitesData = await response.json();
                return invitesData.map((inviteData: any) => new Invite(inviteData.id, inviteData.code, inviteData.expiration_date, inviteData.group_id));
            } else if (response.status === 401) {
                console.log("User is unauthorized. Logging out...");
                window.location.href = "/login";
                return null;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error fetching group invites:', error);
            return null;
        }
    }

    async create_invite(expiration_date: string): Promise<Invite | null> {
        try {
            const response = await fetch(`/api/groups/${this.id}/invites`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ expiration_date })
            });
            if (response.ok) {
                const inviteData = await response.json();
                return new Invite(inviteData.id, inviteData.code, inviteData.expiration_date, inviteData.group_id);
            } else if (response.status === 401) {
                console.log("User is unauthorized. Logging out...");
                window.location.href = "/login";
                return null;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error creating group invite:', error);
            return null;
        }
    }

    async get_users(): Promise<User[] | null> {
        try {
            const response = await fetch(`/api/groups/${this.id}/users`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const usersData = await response.json();
                return usersData.map((userData: any) => new User(userData.id, userData.name, userData.owner));
            } else if (response.status === 401) {
                console.log("User is unauthorized. Logging out...");
                window.location.href = "/login";
                return null;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error fetching group users:', error);
            return null;
        }
    }

    async add_user(user_id: number): Promise<UserAndGroup | null> {
        try {
            const response = await fetch(`/api/groups/${this.id}/users/${user_id}`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const userGroupData = await response.json();
                return new UserAndGroup(userGroupData.id, userGroupData.groupId, userGroupData.userId);
            } else if (response.status === 401) {
                console.log("User is unauthorized. Logging out...");
                window.location.href = "/login";
                return null;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error adding user to group:', error);
            return null;
        }
    }

    async remove_user(user_id: number): Promise<boolean> {
        try {
            const response = await fetch(`/api/groups/${this.id}/users/${user_id}`, {
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
            console.error('Error removing user from group:', error);
            return false;
        }
    }

    async add_group_user_permission(user_id: number, permission: UserGroupPermissionEnum): Promise<UserGroupPermission | null> {
        try {
            const response = await fetch(`/api/groups/${this.id}/users/${user_id}/permissions`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ permission })
            });
            if (response.ok) {
                const permissionData = await response.json();
                return new UserGroupPermission(permissionData.id, permissionData.user_and_group_id, permissionData.permission);
            } else if (response.status === 401) {
                console.log("User is unauthorized. Logging out...");
                window.location.href = "/login";
                return null;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error adding permission:', error);
            return null;
        }
    }

    async remove_group_user_permission(user_id: number, permission: UserGroupPermissionEnum): Promise<boolean> {
        try {
            const response = await fetch(`/api/groups/${this.id}/users/${user_id}/permissions`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ permission })
            });
            if (response.status === 401) {
                console.log("User is unauthorized. Logging out...");
                window.location.href = "/login";
                return response.ok;
            }
            return response.ok;
        } catch (error) {
            console.error('Error removing permission:', error);
            return false;
        }
    }

    async get_group_user_permissions(user_id: number): Promise<UserGroupPermissionEnum[]> {
        try {
            const response = await fetch(`/api/groups/${this.id}/users/${user_id}/permissions`, {
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

    async get_all_events_for_group(): Promise<Event[] | null> {
        try {
            const response = await fetch(`/api/groups/${this.id}/events`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const eventsData = await response.json();
                const tempEvents = eventsData.map((eventData: any) => Event.fromJson(eventData));
                this.events = tempEvents.sort((a: Event, b: Event) => b.created.getTime() - a.created.getTime());
                return this.events;
            } else if (response.status === 401) {
                console.log("User is unauthorized. Logging out...");
                window.location.href = "/login";
                return null;
            } else {
                return this.events = null;
            }
        } catch (error) {
            console.error('Error fetching events for group:', error);
            return this.events = null;
        }
    }

    async create_event_for_group(title: string, color: string, state: EventStateEnum = EventStateEnum.VOTING, description: string|null = null): Promise<Event | null> {
        try {
            const response = await fetch(`/api/groups/${this.id}/events`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ "title": title, "color": color, "state": state, "description": description })
            });
            if (response.ok) {
                const eventData = await response.json();
                const newEvent = Event.fromJson(eventData);
                // Add the new event to this.events
                if (newEvent && this.events) {
                    this.events.unshift(newEvent);
                }
                return newEvent;
            } else if (response.status === 401) {
                console.log("User is unauthorized. Logging out...");
                window.location.href = "/login";
                return null;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error creating event for group:', error);
            return null;
        }
    }    

    async create_vote_for_group(title: string, multi_select: boolean = false): Promise<Vote | null> {
        try {
            const response = await fetch(`/api/groups/${this.id}/votes`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({"title": title, "multi_select": multi_select})
            });
            if (response.ok) {
                const voteData = await response.json();
                const newVote = Vote.fromJson(voteData);
                if (newVote && this.votes) {
                    this.votes.unshift(newVote);
                }
                return newVote;
            } else if (response.status === 401) {
                console.log("User is unauthorized. Logging out...");
                window.location.href = "/login";
                return null;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error creating vote for group:', error);
            return null;
        }
    }

    async get_all_votes_for_group(): Promise<Vote[] | null> {
        try {
            const response = await fetch(`/api/groups/${this.id}/votes`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const voteData = await response.json();
                return this.votes = voteData.map((voteData: any) => Vote.fromJson(voteData)).sort((a: Vote, b: Vote) => b.created.getTime() - a.created.getTime());
            } else if (response.status === 401) {
                console.log("User is unauthorized. Logging out...");
                window.location.href = "/login";
                return null;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error fetching events for group:', error);
            return null;
        }
    }
}

export default Group;