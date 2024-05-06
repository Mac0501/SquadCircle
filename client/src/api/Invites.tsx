class Invite {
    id: number
    code: string;
    expiration_date: string; // Assuming ISO8601 format YYYY-MM-DD
    group_id: number;

    constructor(id: number, code: string, expiration_date: string, group_id: number) {
        this.id = id;
        this.code = code;
        this.expiration_date = expiration_date;
        this.group_id = group_id;
    }

    static fromJson(json: any): Invite {
        return new Invite(
            json.id,
            json.code,
            json.expiration_date,
            json.group_id
        );
    }

    static async get_invite(id: number): Promise<Invite | null> {
        try {
            const response = await fetch(`/api/invites/${id}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const inviteData = await response.json();
                return Invite.fromJson(inviteData);
            } else if (response.status === 401) {
                console.log("User is unauthorized. Logging out...");
                window.location.href = "/login";
                return null;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error fetching invite:', error);
            return null;
        }
    }

    static async get_invites(): Promise<Invite[] | null> {
        try {
            const response = await fetch('/api/invites', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const invitesData = await response.json();
                return invitesData.map((inviteData: any) => Invite.fromJson(inviteData));
            } else if (response.status === 401) {
                console.log("User is unauthorized. Logging out...");
                window.location.href = "/login";
                return null;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error fetching invites:', error);
            return null;
        }
    }

    async delete(): Promise<boolean> {
        try {
            const response = await fetch(`/api/invites/${this.id}`, {
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
            console.error('Error deleting invite:', error);
            return false;
        }
    }

    get_link(): string{
        return `${window.location.origin}/registration/${this.code}`
    }

    static async verifyCode(code: string): Promise<boolean> {
        try {
            const response = await fetch('/api/invites/verify_code', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code })
            });
            return response.ok;
        } catch (error) {
            console.error('Error verifying invite code:', error);
            return false;
        }
    }
}

export default Invite;