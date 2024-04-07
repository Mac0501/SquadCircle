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

    static async get_invite(id: number): Promise<Invite | null> {
        try {
            const response = await fetch(`/invites/${id}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const inviteData = await response.json();
                return new Invite(inviteData.id, inviteData.code, inviteData.expiration_date, inviteData.group_id);
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
            const response = await fetch('/invites', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const invitesData = await response.json();
                return invitesData.map((inviteData: any) => new Invite(inviteData.id, inviteData.code, inviteData.expiration_date, inviteData.group_id));
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
            const response = await fetch(`/invites/${this.id}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return response.ok;
        } catch (error) {
            console.error('Error deleting invite:', error);
            return false;
        }
    }

    static async verifyCode(code: string): Promise<boolean> {
        try {
            const response = await fetch('/invites/verify_code', {
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